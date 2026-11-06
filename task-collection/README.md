# Task collection

Buildless HTML/CSS/JavaScript page served by the existing GitHub Pages site.

- Contributors need no account; name, affiliation, and email are required.
- Tools and modalities are entered once. A single item applies to all steps; multiple items enable per-step choices.
- Steps can have zero or more evidence items. Each evidence item has an explicit importance selection.
- Drafts stay in the visitor's browser. JSON download/import, readable preview, and an email fallback preserve the complete task.
- The sole example covers ESC 2019 pulmonary embolism risk stratification, with six steps and seven evidence items. It opens in a separate read-only dialog and never replaces, saves, or edits the contributor’s draft.

## Direct submissions

Set `SUBMISSION_ENDPOINT` in `config.js` to the public `https://formspree.io/f/FORM_ID` endpoint after creating the form and verifying its notification recipient, `weixiang.shen@tum.de`. Never put an account credential or private API key in this repository.

With no endpoint, the page clearly offers email delivery. With a configured endpoint, the review dialog offers direct submission. A submission includes a readable `message`, contributor details, `structured_task_json`, and a generated reference ID. Drafts are retained on success and failure. Only a successful HTTP acknowledgement is displayed as accepted; inbox delivery must be checked separately.

Formshield content filtering is disabled at the owner's request to avoid false positives on medical task descriptions. Required name, affiliation, and email checks, the hidden honeypot, and the private submission archive remain enabled. Only collect workflow descriptions and de-identified task specifications, not patient records.

Run the model checks from the repository root:

```sh
node --test tests/task-collection.test.mjs
```
