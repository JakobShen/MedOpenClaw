export const RECIPIENT = 'weixiang.shen@tum.de';
export const IMPORTANCE = ['essential', 'important', 'optional'];
export const uid = () => `id-${crypto.randomUUID()}`;
export const blankStep = () => ({ id: uid(), description: '', toolIds: [], modalityIds: [], evidence: [] });
export function blankTask() {
  return { schemaVersion: 1, contact: { name: '', email: '', affiliation: '' },
    task: { name: '', description: '', data: '', tools: [{ id: uid(), name: '' }], modalities: [{ id: uid(), name: '' }] },
    steps: [blankStep()], expectedResult: '', comments: '' };
}
export const activeItems = items => items.filter(item => item.name.trim());
export const effectiveIds = (items, ids) => {
  const active = activeItems(items);
  return active.length === 1 ? [active[0].id] : ids.filter(id => active.some(item => item.id === id));
};
const text = value => typeof value === 'string' ? value : '';

// Only accept the documented task format. Imported content never becomes markup.
export function normalizeTask(raw) {
  if (!raw || raw.schemaVersion !== 1 || !raw.task || !Array.isArray(raw.steps) ||
      !Array.isArray(raw.task.tools) || !Array.isArray(raw.task.modalities)) throw new Error('Choose a MedOpenClaw task JSON file.');
  const result = blankTask();
  const items = list => list.map(item => ({ id: uid(), oldId: text(item?.id), name: text(item?.name) }));
  const tools = items(raw.task.tools);
  const modalities = items(raw.task.modalities);
  const mapIds = (ids, list) => Array.isArray(ids) ? [...new Set(ids.map(id => list.find(item => item.oldId === id)?.id).filter(Boolean))] : [];
  result.contact = { name: text(raw.contact?.name), email: text(raw.contact?.email), affiliation: text(raw.contact?.affiliation) };
  result.task = { name: text(raw.task.name), description: text(raw.task.description), data: text(raw.task.data),
    tools: tools.length ? tools.map(({ id, name }) => ({ id, name })) : result.task.tools,
    modalities: modalities.length ? modalities.map(({ id, name }) => ({ id, name })) : result.task.modalities };
  if (text(raw.task.note)) result.task.note = raw.task.note;
  if (/^https:\/\//.test(text(raw.task.reference))) result.task.reference = raw.task.reference;
  result.steps = raw.steps.map(step => ({ id: uid(), description: text(step?.description),
    toolIds: mapIds(step?.toolIds, tools), modalityIds: mapIds(step?.modalityIds, modalities),
    evidence: Array.isArray(step?.evidence) ? step.evidence.map(item => ({ id: uid(), description: text(item?.description),
      importance: IMPORTANCE.includes(item?.importance) ? item.importance : '' })) : [] }));
  if (!result.steps.length) result.steps.push(blankStep());
  result.expectedResult = text(raw.expectedResult);
  result.comments = text(raw.comments);
  return result;
}
export function exportTask(state) {
  const copy = structuredClone(state);
  copy.task.tools = activeItems(copy.task.tools);
  copy.task.modalities = activeItems(copy.task.modalities);
  copy.steps.forEach(step => {
    step.toolIds = effectiveIds(copy.task.tools, step.toolIds);
    step.modalityIds = effectiveIds(copy.task.modalities, step.modalityIds);
  });
  return copy;
}
export function validationError(state) {
  if (!state.contact.name.trim()) return 'Please enter your name.';
  if (!state.contact.affiliation.trim()) return 'Please enter your affiliation.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email.trim())) return 'Please enter a valid email address.';
  for (const [key, label] of [['name', 'task name'], ['description', 'task goal'], ['data', 'available data']]) {
    if (!state.task[key].trim()) return `Please enter the ${label}.`;
  }
  if (!activeItems(state.task.tools).length) return 'Please enter at least one tool or software application.';
  if (!activeItems(state.task.modalities).length) return 'Please enter at least one data modality.';
  for (const [index, step] of state.steps.entries()) {
    if (!step.description.trim()) return `Please describe step ${index + 1}, or remove it.`;
    if (!effectiveIds(state.task.tools, step.toolIds).length) return `Select the tools used in step ${index + 1}.`;
    if (!effectiveIds(state.task.modalities, step.modalityIds).length) return `Select the data modalities used in step ${index + 1}.`;
    for (const [number, evidence] of step.evidence.entries()) {
      if (!evidence.description.trim()) return `Describe evidence ${number + 1} in step ${index + 1}, or remove it.`;
      if (!IMPORTANCE.includes(evidence.importance)) return `Select the importance of evidence ${number + 1} in step ${index + 1}.`;
    }
  }
  if (!state.steps.some(step => step.evidence.length)) return 'Add at least one evidence item needed to check the task result.';
  if (!state.expectedResult.trim()) return 'Please describe the expected final answer.';
  return '';
}
export function taskSummary(state) {
  const names = (items, ids) => items.filter(item => ids.includes(item.id)).map(item => item.name).join(', ');
  const data = exportTask(state);
  const lines = ['MEDOPENCLAW TASK SUBMISSION', '', data.task.name, '', 'TASK', data.task.description,
    '', 'AVAILABLE DATA', data.task.data, '', `Tools: ${data.task.tools.map(item => item.name).join(', ')}`,
    `Data modalities: ${data.task.modalities.map(item => item.name).join(', ')}`, '', 'STEPS & EVIDENCE',
    'Suggested workflow; only recorded evidence is scored.'];
  data.steps.forEach((step, i) => {
    lines.push('', `${i + 1}. ${step.description}`);
    if (data.task.tools.length > 1) lines.push(`   Tools: ${names(data.task.tools, step.toolIds)}`);
    if (data.task.modalities.length > 1) lines.push(`   Data: ${names(data.task.modalities, step.modalityIds)}`);
    step.evidence.forEach(e => lines.push(`   [${e.importance || 'importance not selected'}] ${e.description}`));
    if (!step.evidence.length) lines.push('   No evidence specified at this step.');
  });
  lines.push('', 'EXPECTED RESULT', data.expectedResult);
  if (data.comments) lines.push('', 'COMMENTS', data.comments);
  if (data.task.note) lines.push('', 'EXAMPLE NOTE', data.task.note);
  if (data.task.reference) lines.push(`Reference: ${data.task.reference}`);
  if (Object.values(data.contact).some(Boolean)) lines.push('', 'CONTRIBUTOR', ...Object.entries(data.contact).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`));
  return lines.join('\n');
}
