# Service queue CLI

Run `npm run queue -- help` for syntax. Use `--json` for structured output. Text flags use `--name=value`; quote values with spaces. Unknown flags are refused. `--json`, `--help` and `--dry-run` are switches with no value.

## Reads

locations, services and clerks list setup. queue-now lists live open interactions. wait-review flags target breaches, calls open longer than an internal hour threshold, and earlier-day tickets. service-review groups by UTC arrival day; clerk-review shows recorded work. no-shows, handover, compliance, history, audit and imports are dedicated lists. ticket takes an anonymous token, a unique case-insensitive fragment or a unique id prefix. insights answers ten questions. weekly-review joins the queue, attention, service and privacy reviews.

## Writes

**arrive**: Record a visitor at a staffed counter.

`npm run queue -- arrive --location="<location>" --service="<service>" --token="<anonymous ticket token>" --actor="<operator>"`

**call**: Record that a clerk called a visitor in person.

`npm run queue -- call "<token>" --clerk="<clerk>" --actor="<operator>"`

**serve**: Record the end of a called service interaction.

`npm run queue -- serve "<token>" --actor="<operator>"`

**no-show**: Record a called visitor who did not answer.

`npm run queue -- no-show "<token>" --reason="<observed reason>" --actor="<operator>"`

**remove**: Close an open ticket without deleting its history.

`npm run queue -- remove "<token>" --reason="<observed reason>" --actor="<operator>"`

**forward**: Move a visitor to another service while retaining the earlier wait.

`npm run queue -- forward "<token>" --location="<location>" --service="<next service>" --reason="<reason>" --actor="<operator>"`

**return-to-queue**: Return a called visitor to the queue as a new interaction.

`npm run queue -- return-to-queue "<token>" --reason="<reason>" --actor="<operator>"`

**log**: Record an internal operational note against an open visit.

`npm run queue -- log "<token>" --note="<necessary factual note>" --actor="<operator>"`

**review-retention**: Record a lawful purpose, review date and supporting reference.

`npm run queue -- review-retention "<token>" --until=YYYY-MM-DD --purpose="<necessary purpose>" --evidence="<review reference>" --actor="<operator>"`

**add-location**: Add a desk location with its collection policy.

`npm run queue -- add-location --name="<name>" --purpose="<necessary purpose>" --retention-days=90 --actor="<operator>"`

**add-service**: Add a service and its internal wait target.

`npm run queue -- add-service --location="<location>" --name="<service>" --target=15 --actor="<operator>"`

**add-clerk**: Add a clerk at a location.

`npm run queue -- add-clerk --location="<location>" --name="<clerk>" --actor="<operator>"`

Every write requires --actor. Optional --at on queue state changes accepts ISO 8601 with an explicit offset. It must follow the previous state timestamp and cannot be in the future. Calling records what staff did in person; it does not announce, message or notify anyone. Removing closes a ticket, without deleting it. A return or transfer closes one interaction and opens the next. Calling a busy clerk is refused.

Locations own the purpose and retention settings for new visits. The retention period is a review date, never an automatic delete date. A privacy review requires a purpose, a new review date and an evidence reference. It does not establish that the legal purpose is valid.

`draft-handover` writes a private Markdown file to drafts/. `export` writes all seven business record types to a structured JSON snapshot in exports/, with stable record relationships. It is an export, not an automatic restore tool. Use database backups as well.

## Import

Read replace-qminder.md. Import supports the Ticket List or legacy Visitors worksheet and UTF-8 CSV. An optional --mapping=path.json maps the expected header names to your actual header labels. --service supplies a service name when the export has no Line column. --target is required if the import introduces a new service.

A single offset applies to timezone-free timestamps in an export. Split historical files spanning a daylight-saving change, or supply explicit ISO timestamps per row. Timezone-aware ISO values keep their own offsets. Excel date values are interpreted as wall-clock cells in the supplied offset. No locale-dependent date guessing.
