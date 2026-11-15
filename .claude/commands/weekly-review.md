---
description: Write the Monday service review from current records.
---

Read CLAUDE.md and docs/cli.md. Run queue-now, wait-review and service-review separately, then compliance. Write the open-ticket count, the oldest waits, outcomes by service and the privacy reviews due. Cite ticket tokens. Separate imported history and UTC dates. Do not call a service wait target a legal deadline.

```bash
npm run queue -- weekly-review
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
