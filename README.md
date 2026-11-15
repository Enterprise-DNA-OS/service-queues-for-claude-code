# Service Queues for Claude Code

Know who is waiting, which desk needs attention and what happened during each service interaction. A staff-operated service queue in a database you own, for the record-based part of Qminder.

## Three ways to use it

**Do it yourself.** Free under the MIT licence. Use Claude Code, Codex, OpenCode or Cursor to run the desk through the commands below.

**We customise it.** Enterprise DNA brings your Qminder history across and builds your service rules, documents and connections. Your version can include a kiosk, a web front end, a different stack or messaging. One setup fee, then a retainer.

**We run it for you.** Omni by Enterprise DNA installs, connects and operates your version. One setup fee, then a monthly retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=qminder&utm_medium=github).

Qminder Premium lists US$12,588 a year with 50 users on its [pricing page](https://www.qminder.com/pricing/), checked 15 November 2026. That is a published subscription price, not evidence of what an Enterprise DNA customer pays.

## Quick start

Node 22.15 or newer on Windows, Linux or macOS.

```bash
npm install
npm test
npm run demo
```

The demo ignores DATABASE_URL and creates its own local database and reports. Its output gives the folder. For a persistent fictional workspace:

```bash
npm run migrate
npm run seed
npm run queue -- weekly-review
npm run view
npm run docs
```

For real records, run migrate only. DATA_DIR chooses the embedded database. DATABASE_URL chooses PostgreSQL 15 or newer. OUTPUT_DIR chooses the private report, draft and export directory. Remote database certificates are verified. Do not store exports or visitor records in Git.

## What ships

33 slash commands, three read-only HTML dashboards and two document types: a daily service report per location and a visit interaction record. Change brand.json for your business name, logo and colours. No live service, public screen, message or appointment booking is created by the free base.

The desk records arrival, in-person call, service completion, no-show, removal, transfer and return to the queue. Each transfer starts a new interaction, retaining the earlier wait. One live call per clerk is enforced in the database. Wait targets are internal operational choices, not legal deadlines or guaranteed waiting times.

Averages group interactions by the UTC arrival date. Called waits and completed service durations have explicit denominators. Imported history is separated from live records. Imported unfinished activity never ages into today's queue. The clerk review describes the recorded work and service mix; it does not rank staff.

## Bring Qminder history across

```bash
npm run queue -- import qminder ./imports/visitor-history.xlsx --location="Harbour" --batch="october-export" --offset=+13:00 --purpose="Service quality review" --retain-until=2027-02-01 --target=15 --actor="Operator" --dry-run
```

Review the preview, then repeat without --dry-run to import. Choose the correct offset and retention date for your export. The [switch guide](docs/replace-qminder.md) lists supported headers, legacy dates, privacy omissions, archive behaviour and reconciliation. Your export imports in one command after those choices are made. No real customer workbook was available; fixtures use the vendor's documented layout.

## Ten questions to ask today

`npm run queue -- insights` answers each of these. Qminder already offers plain-language analysis. These are working questions supported here, not a claim that its reporting cannot answer them.

1. Which waiting tickets exceed their own service target?
2. Which calls have stayed open for more than an hour?
3. Which queues still contain a ticket from a previous UTC day?
4. Which services have the most completed waits above their own target?
5. Which service lines lost visits as no-shows or removals?
6. Which visits required more than one service interaction?
7. Which retention reviews are overdue while a visit is still open?
8. Which services are waiting while a local active clerk has no open call?
9. How much imported history is still marked unfinished?
10. Which visits have incomplete privacy review records?

## Your first hour: ten things to ask for

1. Show today's open service work, with previous-day tickets identified.
2. Find waiting tickets above their service target.
3. Read all interactions for H-101 before changing it.
4. Record a new anonymous arrival at General enquiries.
5. Explain why a clerk cannot take a second open call.
6. Prepare the shift handover as a local draft.
7. Compare no-shows with removals by service.
8. Preview an export and reconcile its selected rows.
9. Put our business name and logo on the daily report.
10. Use /customise to add our counter number and /new-view to report it.

## Commands and operating limits

[CLI syntax](docs/cli.md) gives every action. [Privacy checks](docs/compliance.md), [source research](docs/research.md) and [screen boundaries](docs/why-no-front-end.md) explain the scope.

This is a trusted operator workspace. Actor labels are not authentication, and database owners can administer the audit history. Row security is enabled with no public grants. Configure identity, access roles, backups and retention before shared use. Keep reports private; they can contain clerk names and operational notes.

The base does not provide kiosk capture, public queue displays, SMS, remote check-in, appointment booking, live Qminder sync or medical triage. A custom version can connect the services you keep. No command sends messages or makes clinical or legal decisions.

Tests exercise valid and refused transitions, history preservation, import replay and overlap refusal, time conversion, rollback, complete export, drafts and HTML escaping. CI is manual and runs Windows, Linux and PostgreSQL jobs. A configured job is not evidence it has run.
