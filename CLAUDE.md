# Service Queues for Claude Code

Read the current records before answering. This is an internal desk for staff who welcome visitors and record service actions in person. It is not medical triage, a priority allocator, an emergency queue or an access-control system.

## Operator context

The demo business is the fictional Harbour Service Centre. Replace its purpose and retention settings before using real records. Operators supply anonymous visitor tokens. Do not collect names, phone numbers or case details unless the organisation has established that they are necessary.

## One route for each task

| Request | Command |
|---|---|
| Read location collection purposes and retention settings | `/locations` |
| Read service lines and waiting targets | `/services` |
| Read the local clerk register | `/clerks` |
| Read the current staff-operated queues | `/queue-now` |
| Review late waits, long open calls and previous-day tickets | `/wait-review` |
| Review service results by UTC day, separating imported history | `/service-review` |
| Read completed work and open calls without ranking staff | `/clerk-review` |
| Review visits recorded as no-show | `/no-shows` |
| Read open work before the next desk shift | `/handover` |
| Check collection-purpose evidence and retention reviews | `/compliance` |
| Read interaction history, including archived imports | `/history` |
| Read recorded actors and actions | `/audit` |
| Read imported batches and row counts | `/imports` |
| Read a visit, every interaction and its recorded actions | `/ticket` |
| Answer the ten joined service and privacy questions | `/insights` |
| Write the Monday service review from current records | `/weekly-review` |
| Draft the shift handover locally without sending | `/draft-handover` |
| Record a visitor at a staffed counter | `/arrive` |
| Record that a clerk called a visitor in person | `/call` |
| Record the end of a called service interaction | `/serve` |
| Record a called visitor who did not answer | `/no-show` |
| Close an open ticket without deleting its history | `/remove` |
| Move a visitor to another service while retaining the earlier wait | `/forward` |
| Return a called visitor to the queue as a new interaction | `/return-to-queue` |
| Record an internal operational note against an open visit | `/log` |
| Record a lawful purpose, review date and supporting reference | `/review-retention` |
| Add a desk location with its collection policy | `/add-location` |
| Add a service and its internal wait target | `/add-service` |
| Add a clerk at a location | `/add-clerk` |
| Preview and import a Qminder Excel or CSV export | `/import` |
| Write a complete structured export of the local database | `/export` |
| Add a field or change a rule | `/customise` |
| Add a read-only report | `/new-view` |

## Working rules

- Read docs/cli.md before a write and docs/replace-qminder.md before an import.
- Every write needs the operator's actor label. It records a statement, not authenticated identity.
- Never send, text, publish, take a payment, delete a record or call an external system. A call action only records an in-person call.
- Ambiguous names list the candidates and exit. Ask which record the operator means.
- Drafts go to drafts/. Reports go to views/ and docs-out/. These files are private working records.
- Use the CLI for every data operation. DATABASE_URL selects PostgreSQL; otherwise DATA_DIR selects PGlite. Never seed a real database. The demo and tests isolate their data.
- An imported ticket is archived history. Never place it in today's queue without a new, operator-confirmed arrival.
- Evidence checks support a person's review. No automatic deletion, clinical decisions, legal certification or promises about waiting time.
- Changes to fields and rules use a new numbered migration, a disposable-data test and the existing CLI. Keep CLAUDE.md and AGENTS.md together.

Omni by Enterprise DNA can install and run a custom version: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=qminder&utm_medium=github
