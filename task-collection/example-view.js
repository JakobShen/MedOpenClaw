const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Examples are reading material, independent of the editable submission draft.
export function exampleMarkup(data) {
  const names = (items, ids) => items.filter(item => ids.includes(item.id)).map(item => item.name).join(' + ');
  const rows = data.steps.map((step, index) => {
    const evidence = step.evidence.length ? step.evidence : [null];
    return `<tbody>${evidence.map((item, itemIndex) => `<tr>${itemIndex === 0 ? `
      <th scope="rowgroup" rowspan="${evidence.length}">${index + 1}. ${escape(step.description)}</th>
      <td rowspan="${evidence.length}">${escape(names(data.task.tools, step.toolIds))}</td>
      <td rowspan="${evidence.length}">${escape(names(data.task.modalities, step.modalityIds))}</td>` : ''}
      <td>${item ? escape(item.description) : '<span class="muted">—</span>'}</td>
      <td>${item ? `<span class="importance-tag">${escape(item.importance)}</span>` : '<span class="muted">—</span>'}</td>
    </tr>`).join('')}</tbody>`;
  }).join('');
  const mobileSteps = data.steps.map((step, index) => `<article class="example-step">
    <h3>${index + 1}. ${escape(step.description)}</h3>
    <p class="example-step-context">${escape(names(data.task.tools, step.toolIds))} · ${escape(names(data.task.modalities, step.modalityIds))}</p>
    ${step.evidence.length ? `<ul>${step.evidence.map(item => `<li><p>${escape(item.description)}</p><span class="importance-tag">${escape(item.importance)}</span></li>`).join('')}</ul>` : '<p class="small muted">No evidence to record at this step.</p>'}
  </article>`).join('');
  return `<div class="example-dialog-heading"><h2 id="example-dialog-title">${escape(data.task.exampleTitle || data.task.name)}</h2>
    <button type="button" class="button-text close-dialog" data-action="close-example" aria-label="Close example" autofocus>×</button></div>
    <div class="example-dialog-body"><p class="example-subtitle">${escape(data.task.description)}</p>
    <dl class="example-details"><dt>Task</dt><dd>${escape(data.task.name)}</dd><dt>Data</dt><dd>${escape(data.task.data)}</dd>
      <dt>Software or tools</dt><dd>${escape(data.task.tools.map(item => item.name).join(' and '))}.</dd></dl>
    ${data.task.note ? `<p class="example-guidance">${escape(data.task.note)}</p>` : ''}
    <div class="example-table-wrap"><table class="example-table"><caption class="example-table-caption">Steps, applications, data modalities, evidence and importance</caption>
      <colgroup><col class="example-col-step"><col class="example-col-app"><col class="example-col-data"><col class="example-col-evidence"><col class="example-col-importance"></colgroup>
      <thead><tr><th scope="col">Step</th><th scope="col">Application</th><th scope="col">Data modality</th><th scope="col">Evidence to record</th><th scope="col">Importance</th></tr></thead>${rows}</table></div>
    <div class="example-mobile-steps">${mobileSteps}</div>
    <section class="example-result"><h3>Expected result</h3><p>${escape(data.expectedResult)}</p></section>
    ${data.task.reference ? `<p class="example-reference small"><strong>Reference</strong><br><a class="text-link" href="${escape(data.task.reference)}" target="_blank" rel="noopener noreferrer">${escape(data.task.reference)}</a></p>` : ''}
    <div class="example-end"><button type="button" class="button button-secondary" data-action="close-example">Back to form</button></div></div>`;
}
