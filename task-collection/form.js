import { RECIPIENT, IMPORTANCE, uid, blankTask, blankStep, activeItems, effectiveIds, normalizeTask, exportTask, validationError, taskSummary } from './model.js?v=pe-20261107';
import { exampleMarkup } from './example-view.js?v=example-view-20261107';
import { SUBMISSION_ENDPOINT } from './config.js';

const $ = selector => document.querySelector(selector);
const form = $('#task-form');
const dialog = $('#review-dialog');
const STORAGE_KEY = 'medopenclaw.task-collection.v1';
const SUBMIT_URL = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(SUBMISSION_ENDPOINT) ? SUBMISSION_ENDPOINT : '';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const fieldPaths = { taskName: ['task', 'name'], goal: ['task', 'description'], dataDescription: ['task', 'data'],
  contactName: ['contact', 'name'], email: ['contact', 'email'], affiliation: ['contact', 'affiliation'], expectedResult: ['expectedResult'], comments: ['comments'] };
let state = blankTask();
let storageAvailable = true;
let saveTimer;
let submissionId;
let submitting = false;
let revision = 0;
let initialMessage = '';
try {
  const draft = localStorage.getItem(STORAGE_KEY);
  if (draft) { state = normalizeTask(JSON.parse(draft)); initialMessage = 'Your saved draft has been restored.'; }
} catch {
  initialMessage = 'The previous draft could not be restored. You can load a downloaded JSON draft below.';
}

function status(message, inReview = false) {
  $(inReview ? '#send-status' : '#form-status').textContent = message;
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#save-status').textContent = `Draft saved on this device · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    $('#save-status').textContent = 'Browser saving is unavailable. Download your draft to keep a copy.';
  }
}
function changed() {
  revision += 1;
  submissionId = undefined;
  const submit = $('#submit-task');
  if (submit && !submitting) { submit.disabled = false; submit.textContent = 'Submit task'; }
  $('#save-status').textContent = storageAvailable ? 'Saving draft…' : 'Download your draft to keep a copy.';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 300);
}
function focusField(id) {
  const element = document.getElementById(id);
  element?.focus();
}
function renderItems(kind) {
  const label = kind === 'tools' ? 'Tool' : 'Modality';
  $(`#${kind}-list`).innerHTML = state.task[kind].map((item, index) => `<div class="item-row">
    <label class="field"><span class="sr-only">${label} ${index + 1}</span><input id="${item.id}" data-kind="${kind}" data-item="${item.id}" value="${escape(item.name)}" placeholder="${kind === 'tools' ? 'e.g. 3D Slicer or EHR' : 'e.g. MRI or Text / clinical records'}" ${kind === 'modalities' ? 'list="modality-options"' : ''} autocomplete="off"></label>
    <button type="button" class="button-text" data-action="remove-item" data-kind="${kind}" data-item="${item.id}" aria-label="Remove ${label.toLowerCase()} ${index + 1}" ${state.task[kind].length === 1 ? 'disabled' : ''}>Remove</button></div>`).join('');
}
function contextControl(step, kind) {
  const items = activeItems(state.task[kind]);
  if (items.length <= 1) return '';
  const idsKey = kind === 'tools' ? 'toolIds' : 'modalityIds';
  return `<fieldset><legend>${kind === 'tools' ? 'Tools used' : 'Data used'}</legend><div class="choice-list">${items.map(item =>
    `<label><input type="checkbox" data-step="${step.id}" data-context="${idsKey}" value="${item.id}" ${step[idsKey].includes(item.id) ? 'checked' : ''}><span>${escape(item.name)}</span></label>`).join('')}</div></fieldset>`;
}
function renderContexts() {
  state.steps.forEach(step => {
    const container = document.getElementById(`context-${step.id}`);
    container.innerHTML = contextControl(step, 'tools') + contextControl(step, 'modalities');
    container.hidden = !container.innerHTML;
  });
}
function evidenceMarkup(step, evidence, index) {
  return `<div class="evidence-row" data-evidence-row="${evidence.id}">
    <label class="field"><span>Evidence ${index + 1}</span><textarea id="${evidence.id}" rows="2" data-step="${step.id}" data-evidence="${evidence.id}" data-field="description" placeholder="e.g. RV and LV diameters (mm), with series and slice.">${escape(evidence.description)}</textarea></label>
    <label class="field"><span>Importance</span><select data-step="${step.id}" data-evidence="${evidence.id}" data-field="importance" aria-label="Importance of evidence ${index + 1} in step ${state.steps.indexOf(step) + 1}"><option value="">Select…</option>${IMPORTANCE.map(level => `<option value="${level}" ${evidence.importance === level ? 'selected' : ''}>${level[0].toUpperCase() + level.slice(1)}</option>`).join('')}</select></label>
    <button type="button" class="button-text" data-action="remove-evidence" data-step="${step.id}" data-evidence="${evidence.id}" aria-label="Remove evidence ${index + 1} in step ${state.steps.indexOf(step) + 1}">Remove</button></div>`;
}
function renderSteps() {
  $('#steps-list').innerHTML = state.steps.map((step, index) => `<article class="step-card" aria-labelledby="heading-${step.id}">
    <div class="step-header"><h3 id="heading-${step.id}">Step ${index + 1}</h3><div class="step-actions">
    <button type="button" class="button-text small" data-action="move-up" data-step="${step.id}" ${index === 0 ? 'disabled' : ''} aria-label="Move step ${index + 1} up">↑</button>
    <button type="button" class="button-text small" data-action="move-down" data-step="${step.id}" ${index === state.steps.length - 1 ? 'disabled' : ''} aria-label="Move step ${index + 1} down">↓</button>
    <button type="button" class="button-text small" data-action="remove-step" data-step="${step.id}" ${state.steps.length === 1 ? 'disabled' : ''}>Remove step</button></div></div>
    <label class="field"><span class="sr-only">Step ${index + 1} description</span><textarea id="description-${step.id}" rows="2" data-step="${step.id}" data-field="description" placeholder="What do you do at this step?">${escape(step.description)}</textarea></label>
    <div class="step-context" id="context-${step.id}"></div>
    <div class="evidence-list">${step.evidence.map((evidence, i) => evidenceMarkup(step, evidence, i)).join('')}</div>
    <button type="button" class="button-text add-control" data-action="add-evidence" data-step="${step.id}">+ Add evidence</button>
    </article>`).join('');
  renderContexts();
}
function render() {
  for (const [name, path] of Object.entries(fieldPaths)) {
    form.elements[name].value = path.reduce((obj, key) => obj[key], state);
  }
  renderItems('tools'); renderItems('modalities'); renderSteps();

}
function hasContent() {
  return Boolean(state.task.name || state.task.description || state.task.data || state.expectedResult || state.comments ||
    activeItems(state.task.tools).length || activeItems(state.task.modalities).length ||
    Object.values(state.contact).some(Boolean) || state.steps.some(step => step.description || step.evidence.length));
}
function confirmAction(message, label = 'Continue') {
  const prompt = document.createElement('dialog'); prompt.className = 'confirm-dialog';
  const text = document.createElement('p'); text.textContent = message;
  const actions = document.createElement('div'); actions.className = 'review-actions';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'button button-secondary'; cancel.textContent = 'Cancel';
  const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'button'; accept.textContent = label;
  actions.append(cancel, accept); prompt.append(text, actions); document.body.append(prompt);
  return new Promise(resolve => {
    const done = value => { prompt.close(); prompt.remove(); resolve(value); };
    cancel.addEventListener('click', () => done(false)); accept.addEventListener('click', () => done(true));
    prompt.addEventListener('cancel', event => { event.preventDefault(); done(false); });
    prompt.showModal(); cancel.focus();
  });
}
async function mayReplace() { return !hasContent() || await confirmAction('Replace this draft? Download it first if you want to keep a copy.', 'Replace draft'); }
function snapshot() { return { ...exportTask(state), submissionId: submissionId || undefined }; }
function download() {
  save();
  const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = state.task.name.replace(/[^a-z\d -]/gi, '').trim().replace(/\s+/g, '-').slice(0, 70) || 'draft';
  a.href = url; a.download = `MedOpenClaw-${name}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copySummary(inReview = false) {
  const summary = taskSummary(state);
  try { await navigator.clipboard.writeText(summary); status('Summary copied. You can paste it into an email.', inReview); }
  catch {
    status('Select and copy the summary below.', inReview);
    if (!dialog.open) openReview(false);
    const range = document.createRange(); range.selectNodeContents($('#review-content')); const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
  }
}
function openReview(validate = true) {
  const error = validate && validationError(state);
  if (error) { status(error); $('#form-status').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
  save();
  const data = exportTask(state);
  const names = (items, ids) => items.filter(item => ids.includes(item.id)).map(item => item.name).join(', ');
  $('#review-content').innerHTML = `<p class="review-contributor"><strong>${escape(data.contact.name)}</strong> · ${escape(data.contact.affiliation)}<br>${escape(data.contact.email)}</p>
    ${data.task.exampleTitle ? `<h3>${escape(data.task.exampleTitle)}</h3>` : ''}<h3>${escape(data.task.name)}</h3><p class="preserve-lines">${escape(data.task.description)}</p>
    <dl><dt>Available data</dt><dd>${escape(data.task.data)}</dd><dt>Software or tools</dt><dd>${escape(data.task.tools.map(item => item.name).join(', '))}</dd><dt>Data modalities</dt><dd>${escape(data.task.modalities.map(item => item.name).join(', '))}</dd></dl>
    <h3>Steps &amp; evidence</h3><ol class="review-steps">${data.steps.map(step => `<li><strong>${escape(step.description)}</strong>
    ${data.task.tools.length > 1 ? `<p class="small muted">Tools: ${escape(names(data.task.tools, step.toolIds))}</p>` : ''}
    ${data.task.modalities.length > 1 ? `<p class="small muted">Data: ${escape(names(data.task.modalities, step.modalityIds))}</p>` : ''}
    ${step.evidence.length ? `<ul>${step.evidence.map(e => `<li><span class="importance-tag">${escape(e.importance)}</span> ${escape(e.description)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol>
    <h3>Expected result</h3><p class="preserve-lines">${escape(data.expectedResult)}</p>
    ${data.task.note ? `<p class="small muted">${escape(data.task.note)}</p>` : ''}
    ${data.task.reference ? `<p class="small"><a class="text-link" href="${escape(data.task.reference)}" target="_blank" rel="noopener noreferrer">Reference</a></p>` : ''}
    ${data.comments ? `<h3>Comments</h3><p class="preserve-lines">${escape(data.comments)}</p>` : ''}`;
  const fullMail = `mailto:${RECIPIENT}?subject=${encodeURIComponent(`MedOpenClaw task: ${state.task.name}`)}&body=${encodeURIComponent(taskSummary(state))}`;
  const longMail = fullMail.length > 1800;
  $('#send-email').href = longMail ? `mailto:${RECIPIENT}?subject=${encodeURIComponent(`MedOpenClaw task: ${state.task.name}`)}&body=${encodeURIComponent('Please find my task submission in the attached JSON file.\n\n(Attach the downloaded MedOpenClaw task file before sending.)')}` : fullMail;
  $('#send-email').dataset.download = String(longMail);
  $('#send-status').textContent = '';
  if (!dialog.open) dialog.showModal();
}

form.addEventListener('input', event => {
  const element = event.target;
  const path = fieldPaths[element.name];
  if (path) {
    const parent = path.slice(0, -1).reduce((obj, key) => obj[key], state); parent[path.at(-1)] = element.value;
  } else if (element.dataset.item && !element.dataset.action) {
    const { kind, item } = element.dataset;
    const before = activeItems(state.task[kind]);
    state.task[kind].find(i => i.id === item).name = element.value;
    const after = activeItems(state.task[kind]);
    if (before.length === 1 && after.length > 1) {
      const key = kind === 'tools' ? 'toolIds' : 'modalityIds';
      state.steps.forEach(step => { if (!step[key].length) step[key] = [before[0].id]; });
    }
  } else if (element.dataset.field) {
    const step = state.steps.find(s => s.id === element.dataset.step);
    const target = element.dataset.evidence ? step.evidence.find(e => e.id === element.dataset.evidence) : step;
    target[element.dataset.field] = element.value;
  } else return;
  changed();
});
form.addEventListener('change', event => {
  const element = event.target;
  if (element.dataset.context) {
    const step = state.steps.find(s => s.id === element.dataset.step);
    const key = element.dataset.context;
    step[key] = element.checked ? [...new Set([...step[key], element.value])] : step[key].filter(id => id !== element.value);
    changed();
  }
  if (element.dataset.item && !element.dataset.action) renderContexts();
});
form.addEventListener('submit', event => { event.preventDefault(); openReview(); });
form.addEventListener('invalid', event => { const details = event.target.closest('details'); if (details) details.open = true; }, true);

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-action], [data-example]');
  if (!button) return;
  const { action, example } = button.dataset;
  if (example) {
    button.disabled = true;
    try {
      const response = await fetch('./examples.json?v=pe-20261107'); if (!response.ok) throw new Error();
      const examples = await response.json();
      const exampleData = normalizeTask(examples[example]);
      $('#example-content').innerHTML = exampleMarkup(exampleData);
      if (!$('#example-dialog').open) {
        $('#example-dialog').addEventListener('close', () => button.focus(), { once: true });
        $('#example-dialog').showModal();
      }
    } catch { status('The example could not be displayed. Please try again.'); }
    finally { button.disabled = false; }
    return;
  }
  if (action === 'close-example') { $('#example-dialog').close(); return; }
  if (action === 'close-review') { dialog.close(); return; }
  if (action === 'download-json') { download(); status('Task file downloaded.'); return; }
  if (action === 'copy-summary') { await copySummary(); return; }
  if (action === 'import-draft') { $('#draft-file').click(); return; }
  if (action === 'print') { openReview(false); window.print(); return; }
  if (action === 'add-tool' || action === 'add-modality') {
    const kind = action === 'add-tool' ? 'tools' : 'modalities'; const item = { id: uid(), name: '' };
    state.task[kind].push(item); renderItems(kind); changed(); focusField(item.id); return;
  }
  if (action === 'remove-item') {
    const { kind, item } = button.dataset;
    if (state.task[kind].length === 1) return;
    state.task[kind] = state.task[kind].filter(i => i.id !== item);
    const key = kind === 'tools' ? 'toolIds' : 'modalityIds';
    state.steps.forEach(step => { step[key] = step[key].filter(id => id !== item); });
    renderItems(kind); renderContexts(); changed(); return;
  }
  if (action === 'add-step') {
    const step = blankStep(); state.steps.push(step); renderSteps(); changed(); focusField(`description-${step.id}`); return;
  }
  const step = state.steps.find(s => s.id === button.dataset.step);
  if (!step) return;
  if (action === 'add-evidence') {
    const evidence = { id: uid(), description: '', importance: '' }; step.evidence.push(evidence);
    renderSteps(); changed(); focusField(evidence.id); return;
  }
  if (action === 'remove-evidence') {
    const evidence = step.evidence.find(e => e.id === button.dataset.evidence);
    if (evidence.description && !await confirmAction('Remove this evidence item?', 'Remove evidence')) return;
    step.evidence = step.evidence.filter(e => e.id !== evidence.id); renderSteps(); changed(); return;
  }
  if (action === 'remove-step') {
    if (state.steps.length === 1 || ((step.description || step.evidence.length) && !await confirmAction('Remove this step and its evidence?', 'Remove step'))) return;
    state.steps = state.steps.filter(s => s.id !== step.id); renderSteps(); changed(); return;
  }
  if (action === 'move-up' || action === 'move-down') {
    const from = state.steps.indexOf(step); const to = from + (action === 'move-up' ? -1 : 1);
    if (to < 0 || to >= state.steps.length) return;
    [state.steps[from], state.steps[to]] = [state.steps[to], state.steps[from]];
    renderSteps(); changed(); focusField(`description-${step.id}`);
  }
});
$('#draft-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('Choose a task JSON file smaller than 2 MB.');
    const imported = normalizeTask(JSON.parse(await file.text()));
    if (!await mayReplace()) return;
    state = imported; render(); changed(); status('Draft loaded.');
  } catch (error) { status(error instanceof SyntaxError ? 'This file is not valid JSON. Your draft has been kept.' : error.message); }
  finally { event.target.value = ''; }
});
$('#review-copy').addEventListener('click', () => copySummary(true));
$('#review-download').addEventListener('click', () => { download(); status('Task file downloaded.', true); });
$('#send-email').addEventListener('click', () => {
  if ($('#send-email').dataset.download === 'true') {
    download(); status(`Attach the downloaded JSON file to your email to ${RECIPIENT}. Your task has not been sent yet.`, true);
  } else status('Your email app should open with a draft. Send it there to complete your submission.', true);
});
$('#submit-task')?.addEventListener('click', async () => {
  if (!SUBMIT_URL) { status('Use “Send by email” to send this task to the team.', true); return; }
  if (submitting) return;
  const error = validationError(state); if (error) { status(error, true); return; }
  if (form.elements.website?.value) { status('Unable to submit. Please send your task by email instead.', true); return; }
  submitting = true; const button = $('#submit-task'); button.disabled = true; button.textContent = 'Submitting…';
  submissionId ||= `MOC-${crypto.randomUUID()}`;
  const data = snapshot();
  const sentId = submissionId;
  const sentRevision = revision;
  const payload = { subject: `MedOpenClaw task: ${state.task.name.replace(/[\r\n]/g, ' ').slice(0, 140)}`,
    source: 'https://jakobshen.github.io/MedOpenClaw/task-collection/', submission_id: sentId,
    task: state.task.name, name: state.contact.name.trim(), email: state.contact.email.trim(), affiliation: state.contact.affiliation.trim(),
    message: taskSummary(state), structured_task_json: JSON.stringify(data), _gotcha: '' };
  status('Sending your task. Please keep this window open.', true);
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(SUBMIT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal });
    const result = await response.json();
    if (!response.ok || result.ok === false || result.error || result.errors?.length) throw new Error('Submission was not acknowledged.');
    status(`“${data.task.name}” was accepted for forwarding to ${RECIPIENT}. Reference: ${sentId}. ${revision === sentRevision ? 'Your draft remains saved on this device.' : 'Your newer edits have not been submitted.'}`, dialog.open);
    if (revision === sentRevision) button.textContent = 'Submitted';
  } catch {
    status(`We could not confirm delivery. Your draft is safe. Retry, or use “Send by email instead” to contact ${RECIPIENT}. Reference: ${sentId}.`, dialog.open);
    button.disabled = false; button.textContent = 'Retry submission';
  } finally {
    clearTimeout(timeout); submitting = false;
    if (revision !== sentRevision) { button.disabled = false; button.textContent = 'Submit task'; }
  }
});
window.addEventListener('pagehide', save);
const datalist = document.createElement('datalist'); datalist.id = 'modality-options';
datalist.innerHTML = ['MRI', 'CT', 'Ultrasound', 'X-ray', 'Pathology slides', 'Text / clinical records', 'ECG', 'Laboratory data', 'Other'].map(value => `<option value="${value}"></option>`).join('');
document.body.append(datalist);
if (!SUBMIT_URL) {
  $('#submit-task').hidden = true;
  $('#send-email').textContent = 'Send by email';
  $('#send-email').className = 'button';
  $('#review-button').textContent = 'Review & send →';
  $('#delivery-note').textContent = `Send your prepared task to ${RECIPIENT}, or download it to keep a copy. Automatic submission is being set up.`;
  $('#privacy-note').textContent = 'Task descriptions only — do not include patient-identifiable information.';
}
render();
if (initialMessage) status(initialMessage);
if (initialMessage.startsWith('Your saved')) $('#save-status').textContent = 'Saved draft restored on this device.';
