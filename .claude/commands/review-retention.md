---
description: Record a lawful purpose, review date and supporting reference.
---

Read CLAUDE.md and docs/cli.md. Read the relevant ticket first before changing it. Use only facts supplied by the operator. An ambiguous name must be resolved from the candidates; never choose the first one. Never send a notification or treat an actor label as authenticated approval.

```bash
npm run queue -- review-retention "<token>" --until=YYYY-MM-DD --purpose="<necessary purpose>" --evidence="<review reference>" --actor="<operator>"
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
