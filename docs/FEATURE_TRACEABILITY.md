# SIH26262 Requirement Traceability

This matrix maps the SIH problem statement to what an evaluator can verify in the current prototype. “Planned” items are explicitly not represented as deployed functionality.

| SIH area | Requirement | Prototype evidence | Current status |
|---|---|---|---|
| A. Workflow automation | APH pathway routing | Workflow selector and path-driven stage timeline | Demonstrated; APH configuration requires competent-authority validation |
| A. Workflow automation | Auto-movement after authorised completion | Stage completion action advances to next configured stage | Demonstrated as an authorised officer action |
| A. Workflow automation | Return/revert with reasons | Return action requires a reason; institution can respond/resubmit | Demonstrated |
| B. Dashboards | Region/stage/institution visibility | Role-based dashboard, stage-wise pendency, Region summaries | Demonstrated with sample records |
| B. Pendency | Ageing and workload visibility | Stage clock, overdue queue, upcoming/overdue counts | Demonstrated with simulated workflow date |
| B. Audit | Trace application movement and decisions | Application timeline and hash-chained audit events | Demonstrated |
| C. EVC | Identify and schedule EVC cases | EVC queue and schedule action | Demonstrated; no external calendar integration |
| C. EVC alerts | Reminders/escalation for delays | In-app EVC/overdue alert calculation | Demonstrated; no outbound gateway/scheduler |
| D. Undertakings | Store conditions and due dates | Undertakings view with due dates and states | Demonstrated using sample data |
| D. Evidence | Submit and verify compliance evidence | Submit/verify states and evidence/document workflows | Partially demonstrated; enforce evidence policy before production |
| E. Document validity | Track expiry and renewals | Documents view, expiry indicators, renewal states | Demonstrated using sample data |
| E. Document verification | Review renewed documents | Authorised document review and private upload/download | Demonstrated for application documents |
| F. Notifications | Configurable notices | In-app upcoming/overdue alert list | In-app only; email/SMS not configured |
| F. Escalation | Escalate overdue cases | L1/L2/L3 labels and escalation records | Demonstrated in prototype |
| F. Reporting | Consolidated reports | Dashboard summaries and CSV alert export | Demonstrated |
| Key requirement | Secure role-based access | scrypt, session cookie, rate limit, server-side scope checks | Implemented prototype controls; requires independent security review |
| Key requirement | AICTE integration | Extension architecture | Planned; no live integration claimed |
| Regulatory safeguard | Human oversight | Authorised role actions and explicit decision boundary | Demonstrated design principle |
| Innovation | Explainable OCR/AI assistance | Source-aware extraction and human confirmation concept | Planned; no deployed OCR/AI model claimed |

## Suggested evaluation evidence

- Workflow correctness: test each configured path and confirm that an officer action advances only one prescribed stage.
- Return quality: confirm that a return cannot be submitted without a reason and that the reason is visible to the institution.
- Access control: attempt cross-Region and cross-institution access with separate accounts; requests should not expose out-of-scope records.
- Deadline accuracy: advance the demo date and compare expected alert levels with displayed alerts.
- Document security: test permitted file signatures, duplicate detection, file size limit and unauthorised download denial.
- Audit completeness: verify that stage, return, resubmission, EVC and compliance actions appear in the history/audit trail.

Do not report benchmark improvements or accuracy percentages without a reproducible test dataset and measured results.
