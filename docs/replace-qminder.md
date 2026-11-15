# Replace the service record desk in Qminder

Checked 15 November 2026. Start with a saved export and run both records alongside each other before changing your staffed desk.

## Export

In Qminder, open Data Insights, Visitor History, select a location and the date/status filters you intend to bring across, then Download Excel. The [vendor export guide](https://help.qminder.com/excel-export-in-visitor-history) identifies a Ticket List worksheet with the individual records. Older workbooks use Visitors. Clerk and line summary sheets are not imported because the base recomputes summaries from individual records.

Record the export location, timezone and selected date range. Keep an untouched copy in your approved private storage. The vendor's old export screenshot shows Taken, Status, Wait Time, Called, Service Ended, Service Time and Clerk. Its guide also describes the line and optional fields. Layouts can differ; a header mapping is supported.

## Preview, then import

```bash
npm run queue -- import qminder ./imports/visitor-history.xlsx --location="Harbour" --batch="october-export" --offset=+13:00 --purpose="Service quality review" --retain-until=2027-02-01 --target=15 --actor="Operator" --dry-run
```

Choose your actual purpose, review date, offset and internal target. The preview changes nothing. Review its row count and services. Repeat without --dry-run to import the supported export in one command. CSV saved from the Ticket List worksheet is also accepted. examples/qminder.csv is synthetic test data, not a customer export.

## What maps

| Export field | Destination |
|---|---|
| Taken | Interaction arrival timestamp |
| Status | Waiting, called, served, no-show, removed, forwarded or returned |
| Called | In-person call timestamp |
| Service Ended | End timestamp, if supplied |
| Clerk | A clerk attached to the selected location |
| Line | A service at that location; use --service if missing |
| Ticket ID or ID, if present | Import fingerprint input |
| Wait Time and Service Time | Recomputed from timestamps, rather than trusting formatted durations |

A finished served/no-show record needs a clerk, call time and end time. A legacy cancelled/removed record can lack an end timestamp; its unknown waiting duration stays blank. The importer never fabricates an end time. Unknown statuses, malformed dates and inconsistent timestamps stop the entire batch with a row number. Formula cells must be converted to plain values. European dot dates such as 16.03.17 9:01 are supported; slash dates are not guessed.

Optional --mapping=examples/column-map.json maps expected labels to your exported column names. The timestamp choices are explicit because a spreadsheet does not reliably encode the export's timezone. A single offset is unsuitable for local timestamps spanning a daylight-saving change. Split them or use offset-qualified ISO timestamps.

## What does not carry over

Visitor names, phones, email addresses, messages, labels and custom answers are deliberately not imported. The desk uses anonymous tokens. Keep the original export under your approved retention policy if you need those fields; decide and test a mapping before using a custom version. Archived rows are individual exported interactions. The base does not infer a multi-step visit relationship when an export lacks a stable visit key.

Old waiting/called rows remain archived history, never live queue entries. There is no live Qminder connection, kiosk pairing, appointment schedule, TV display, user authentication or message delivery. Enterprise DNA can build those connections into your version.

## Reconciliation

Compare selected export row count, statuses, services, clerks and timestamp samples with imports and history. Unknown imported durations remain blank. Imported groups stay separate in the service review. No rows are silently discarded. Same batch plus same mapped content is a no-op. Changed content under the same batch name is refused. Overlapping arrival time ranges at the same location are refused even with a new batch name, so partial exports cannot silently double the count. Use one complete, non-overlapping time slice per location.

Names and sensitive extra fields are excluded by design, so the import is not a full account clone. Run a representative exported workbook through preview and compare outcomes before switching. No customer workbook was available for this build.
