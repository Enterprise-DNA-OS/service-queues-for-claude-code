---
description: Preview and import a Qminder Excel or CSV export.
---

Read CLAUDE.md and docs/cli.md. Read docs/replace-qminder.md first. Confirm location, timezone offset, scope, purpose and retention date. Run the preview. Resolve every refused row, reconcile counts with the export, then remove --dry-run only within the authorised import. Existing import batches are immutable. Never guess missing timestamps or merge overlapping exports.

```bash
npm run queue -- import qminder "<export.xlsx>" --location="<location>" --batch="<unique batch>" --offset=+13:00 --purpose="<lawful review purpose>" --retain-until=YYYY-MM-DD --target=15 --actor="<operator>" --dry-run
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
