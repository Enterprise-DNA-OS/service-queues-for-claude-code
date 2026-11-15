---
description: Read completed work and open calls without ranking staff.
---

Read CLAUDE.md and docs/cli.md. State the service mix and time period. Counts and average durations are context, not an employee performance ranking. Do not infer competence, attendance or productivity from these counts.

```bash
npm run queue -- clerk-review
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
