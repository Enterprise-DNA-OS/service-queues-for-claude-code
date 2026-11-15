# Purpose and retention evidence checks

Sources checked 15 November 2026. This is an internal, nonclinical service desk. These controls support an organisation's privacy review; they do not certify legal compliance.

| Rule | Behaviour | Source and scope |
|---|---|---|
| COLLECTION_PURPOSE | Flags a missing collection purpose. New arrivals use the location's configured purpose and anonymous tokens. | [NZ Privacy Principle 1](https://www.privacy.org.nz/privacy-principles/1/) requires necessary collection for a lawful business function. A recorded purpose is evidence to review, not proof of necessity. |
| RETENTION_REVIEW | Flags a missing or overdue review date. A reviewer records a purpose, future date and evidence reference. No automatic deletion. | [NZ Privacy Principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to lawful need. The organisation chooses the period after considering applicable duties. |

The seed's 90-day period is a fictional business setting, not a statutory retention period. The wait target and open-call threshold are operational rules, not law. Qminder's security certifications do not transfer to this software.

Do not use this base for medical triage, urgent service prioritisation or decisions about a person's eligibility. It records the ordinary counter queue staff operate. Australian and sector-specific duties need separate review before deployment. Shared access needs identity, least-privilege roles, backups and an approved retention process. The base enables row security and removes public grants, but does not provide hosted authentication.

Actor labels and evidence references are operator statements. A database owner can administer the audit record. Notes and exports need the same protection as the working database. The base sends nothing and never erases a visit automatically.
