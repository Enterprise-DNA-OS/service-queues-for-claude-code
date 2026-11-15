---
description: Move a visitor to another service while retaining the earlier wait.
---

Read CLAUDE.md and docs/cli.md. Read the relevant ticket first before changing it. Use only facts supplied by the operator. An ambiguous name must be resolved from the candidates; never choose the first one. Never send a notification or treat an actor label as authenticated approval.

```bash
npm run queue -- forward "<token>" --location="<location>" --service="<next service>" --reason="<reason>" --actor="<operator>"
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
