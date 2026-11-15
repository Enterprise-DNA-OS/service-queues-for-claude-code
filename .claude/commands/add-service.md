---
description: Add a service and its internal wait target.
---

Read CLAUDE.md and docs/cli.md. Read the relevant ticket first before changing it. Use only facts supplied by the operator. An ambiguous name must be resolved from the candidates; never choose the first one. Never send a notification or treat an actor label as authenticated approval. The example retention period and wait target are placeholders for the organisation to decide; they are not legal defaults.

```bash
npm run queue -- add-service --location="<location>" --name="<service>" --target=15 --actor="<operator>"
```

Use `--json` for exact records. Present the result in plain words with the relevant tokens and dates. Say when there are no matching records. Drafts stay local.
