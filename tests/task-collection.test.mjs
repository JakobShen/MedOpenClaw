import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  blankTask, effectiveIds, exportTask, normalizeTask,
  validationError, taskSummary,
} from '../task-collection/model.js';

const examples = JSON.parse(await readFile(new URL('../task-collection/examples.json', import.meta.url), 'utf8'));
const testContact = () => ({ name: 'Example contributor', email: 'example@example.org', affiliation: 'Example institution' });

function validSingle() {
  const state = blankTask();
  state.contact = testContact();
  Object.assign(state.task, {
    name: 'Assess a finding', description: 'Determine whether the finding is present.',
    data: 'A de-identified image series.',
    tools: [{ id: 'viewer', name: 'Image viewer' }],
    modalities: [{ id: 'mri', name: 'MRI' }],
  });
  Object.assign(state.steps[0], {
    description: 'Inspect the finding.',
    evidence: [{ id: 'e-1', description: 'Location of the finding in the image series.', importance: 'essential' }],
  });
  state.expectedResult = 'Present / absent / uncertain.';
  return state;
}

function makeMultiple(state) {
  state.task.tools.push({ id: 'ehr', name: 'EHR / clinical records' });
  state.task.modalities.push({ id: 'records', name: 'Text / clinical records' });
  return state;
}

test('name, affiliation, and a valid email are required before submission', () => {
  const state = validSingle();
  state.contact = { name: '', affiliation: '', email: '' };
  assert.equal(validationError(state), 'Please enter your name.');
  state.contact.name = '   ';
  assert.equal(validationError(state), 'Please enter your name.');
  state.contact.name = 'Example contributor';
  assert.equal(validationError(state), 'Please enter your affiliation.');
  state.contact.affiliation = '   ';
  assert.equal(validationError(state), 'Please enter your affiliation.');
  state.contact.affiliation = 'Example institution';
  assert.equal(validationError(state), 'Please enter a valid email address.');
  for (const email of ['not-an-email', 'example@', '@example.org', 'example@example', 'two words@example.org']) {
    state.contact.email = email;
    assert.equal(validationError(state), 'Please enter a valid email address.', `Must reject ${email}`);
  }
  state.contact.email = 'example+workflow@example.org';
  assert.equal(validationError(state), '');
});

test('a single active tool and modality are inherited by every exported step', () => {
  const state = validSingle();
  state.task.tools.push({ id: 'unused', name: '   ' });
  state.task.modalities.push({ id: 'unused-data', name: '' });
  state.steps.push({ id: 'step-2', description: 'Decide the result.', toolIds: [], modalityIds: [], evidence: [] });
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  assert.equal(result.task.tools.length, 1);
  assert.equal(result.task.modalities.length, 1);
  for (const step of result.steps) {
    assert.deepEqual(step.toolIds, ['viewer']);
    assert.deepEqual(step.modalityIds, ['mri']);
  }
});

test('export resolves inheritance without mutating the draft or its selections', () => {
  const state = validSingle();
  const before = structuredClone(state);
  const exported = exportTask(state);
  exported.steps[0].evidence[0].description = 'A different item';
  exported.task.tools[0].name = 'Changed tool';
  assert.deepEqual(state, before);
});

test('multiple tools require a valid selection at each step', () => {
  const state = makeMultiple(validSingle());
  assert.equal(validationError(state), 'Select the tools used in step 1.');
  state.steps[0].toolIds = ['missing-tool'];
  assert.equal(validationError(state), 'Select the tools used in step 1.');
  state.steps[0].toolIds = ['viewer'];
  assert.equal(validationError(state), 'Select the data modalities used in step 1.');
  state.steps[0].modalityIds = ['mri'];
  assert.equal(validationError(state), '');
});

test('one step may use several tools and modalities, with stale IDs excluded from export', () => {
  const state = makeMultiple(validSingle());
  state.steps[0].toolIds = ['viewer', 'ehr', 'deleted-tool'];
  state.steps[0].modalityIds = ['mri', 'records', 'deleted-modality'];
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  assert.deepEqual(result.steps[0].toolIds, ['viewer', 'ehr']);
  assert.deepEqual(result.steps[0].modalityIds, ['mri', 'records']);
  assert.deepEqual(effectiveIds(state.task.tools, ['deleted-tool']), []);
});

test('arbitrary evidence counts are retained through export, summary, and import', () => {
  const state = validSingle();
  state.steps[0].evidence = Array.from({ length: 7 }, (_, i) => ({
    id: `e-${i}`, description: `Unique evidence item ${i + 1}.`,
    importance: ['essential', 'important', 'optional'][i % 3],
  }));
  assert.equal(validationError(state), '');
  const result = exportTask(state);
  const summary = taskSummary(state);
  const restored = normalizeTask(JSON.parse(JSON.stringify(result)));
  assert.equal(result.steps[0].evidence.length, 7);
  assert.equal(restored.steps[0].evidence.length, 7);
  for (const item of result.steps[0].evidence) {
    assert.ok(summary.includes(`[${item.importance}] ${item.description}`));
  }
  assert.deepEqual(restored.steps[0].evidence.map(({ description, importance }) => ({ description, importance })),
    state.steps[0].evidence.map(({ description, importance }) => ({ description, importance })));
});

test('a step with no evidence is valid when another step has evidence', () => {
  const state = validSingle();
  state.steps.unshift({ id: 'open', description: 'Open the data.', toolIds: [], modalityIds: [], evidence: [] });
  assert.equal(validationError(state), '');
  const summary = taskSummary(state);
  assert.ok(summary.includes('1. Open the data.\n   No evidence specified at this step.'));
  assert.ok(summary.includes('2. Inspect the finding.'));
});

test('an empty evidence entry requires a description and an explicit importance choice', () => {
  const state = validSingle();
  state.steps[0].evidence.push({ id: 'e-2', description: '', importance: '' });
  assert.equal(validationError(state), 'Describe evidence 2 in step 1, or remove it.');
  state.steps[0].evidence[1].description = 'A second recorded item.';
  assert.equal(validationError(state), 'Select the importance of evidence 2 in step 1.');
  state.steps[0].evidence[1].importance = 'optional';
  assert.equal(validationError(state), '');
});

test('at least one evidence item is needed for a completed submission', () => {
  const state = validSingle();
  state.steps[0].evidence = [];
  assert.equal(validationError(state), 'Add at least one evidence item needed to check the task result.');
});

test('invalid JSON or an unrelated/unsupported schema cannot be imported', () => {
  assert.throws(() => normalizeTask(JSON.parse('{broken')), SyntaxError);
  for (const raw of [null, {}, [], { schemaVersion: 2 }, { schemaVersion: '1' },
    { schemaVersion: 1, task: {}, steps: [] },
    { schemaVersion: 1, task: { tools: [], modalities: [] }, steps: 'not an array' }]) {
    assert.throws(() => normalizeTask(raw), /Choose a MedOpenClaw task JSON file/);
  }
});

test('import normalizes malformed optional fields and unknown importance without inventing answers', () => {
  const raw = exportTask(validSingle());
  raw.contact = { name: 123, email: null, affiliation: ['not text'] };
  raw.task.name = 42;
  raw.task.reference = 'javascript:alert(1)';
  raw.comments = { unexpected: true };
  raw.steps[0].evidence[0].importance = 'critical';
  raw.steps.push(null);
  const restored = normalizeTask(raw);
  assert.deepEqual(restored.contact, { name: '', email: '', affiliation: '' });
  assert.equal(restored.task.name, '');
  assert.equal(restored.task.reference, undefined);
  assert.equal(restored.comments, '');
  assert.equal(restored.steps[0].evidence[0].importance, '');
  assert.equal(restored.steps[1].description, '');
  assert.deepEqual(restored.steps[1].evidence, []);
});

test('import remaps tool/modality IDs coherently, deduplicates references, and ignores unknown references', () => {
  const raw = makeMultiple(validSingle());
  raw.steps[0].toolIds = ['viewer', 'ehr', 'viewer', 'unknown'];
  raw.steps[0].modalityIds = ['records', 'records', 'mri', 'unknown'];
  const untouched = structuredClone(raw);
  const restored = normalizeTask(raw);
  assert.notEqual(restored.steps[0].id, raw.steps[0].id);
  assert.deepEqual(restored.steps[0].toolIds,
    [restored.task.tools[0].id, restored.task.tools[1].id]);
  assert.deepEqual(restored.steps[0].modalityIds,
    [restored.task.modalities[1].id, restored.task.modalities[0].id]);
  assert.equal(validationError(restored), '');
  assert.deepEqual(raw, untouched);
});

test('an empty imported draft gets one editable step and one tool/modality field', () => {
  const restored = normalizeTask({ schemaVersion: 1, task: { tools: [], modalities: [] }, steps: [] });
  assert.equal(restored.steps.length, 1);
  assert.equal(restored.task.tools.length, 1);
  assert.equal(restored.task.modalities.length, 1);
  assert.equal(restored.steps[0].evidence.length, 0);
  assert.equal(validationError(restored), 'Please enter your name.');
});

test('summary preserves contact, comments, expected result, example notes, and references', () => {
  const state = normalizeTask(examples.rano);
  state.contact = testContact();
  state.comments = 'A free comment with multiple lines.\nSecond line.';
  const summary = taskSummary(state);
  for (const value of [state.task.name, state.task.description, state.task.data,
    state.expectedResult, state.comments, state.task.note, state.task.reference,
    ...Object.values(state.contact)]) assert.ok(summary.includes(value), `Missing ${value}`);
  assert.ok(summary.includes('Tools: 3D Slicer, EHR / clinical records'));
  assert.ok(summary.includes('Data: MRI, Text / clinical records'));
});

test('both shipped examples retain the five broad steps and every evidence item', () => {
  for (const [name, raw] of Object.entries(examples)) {
    const restored = normalizeTask(raw);
    assert.deepEqual(restored.contact, { name: '', email: '', affiliation: '' }, 'Examples leave contributor details blank');
    restored.contact = testContact();
    assert.equal(validationError(restored), '', `${name} must be ready to review`);
    assert.equal(restored.steps.length, 5);
    assert.equal(restored.steps.reduce((count, step) => count + step.evidence.length, 0), name === 'rano' ? 6 : 2);
    assert.deepEqual(restored.steps.map(step => step.description), raw.steps.map(step => step.description));
    const summary = taskSummary(restored);
    for (const step of raw.steps) {
      for (const evidence of step.evidence) assert.ok(summary.includes(evidence.description));
    }
  }
  const rano = normalizeTask(examples.rano);
  assert.equal(rano.steps[4].toolIds.length, 2);
  assert.equal(rano.steps[4].modalityIds.length, 2);
  assert.ok(rano.task.data.includes('steroid use, radiotherapy'));
  const vsd = exportTask(normalizeTask(examples.vsd));
  assert.ok(vsd.steps.every(step => step.toolIds.length === 1 && step.modalityIds.length === 1));
});
