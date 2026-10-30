# AICTE Nigrani — SIH Prototype Submission

## 1. Problem addressed
AICTE approval processing spans multiple application pathways, scrutiny stages, EVC scheduling, committee processing, time-bound undertakings and validity of institutional documents. The prototype centralises these records and exposes stage ageing, ownership, alerts and an auditable history.

## 2. Solution overview
AICTE Nigrani is a role-based web platform with three operational roles:
- **Admin / Bureau:** consolidated view, account approval, audit trail, workflow actions and reporting.
- **Regional Officer:** region-scoped applications and compliance records, stage actions, EVC scheduling and verification.
- **Institution Head:** institution-scoped applications, supporting-document uploads, returned-case resubmission and compliance follow-up.

Public users may request Institution Head or Regional Officer access. Institution registrations must use an email address matching the declared institutional website domain. Requests remain pending until an existing Admin approves them. Admin self-registration is disabled.

## 3. Feature mapping to the problem statement
| Problem requirement | Prototype implementation |
|---|---|
| End-to-end application routing | Workflow pathways for Only Scrutiny, Scrutiny + EVC, Only EVC, Only SAC/SHC, Scrutiny + SAC/SHC, EVC + SAC/SHC and Scrutiny + EVC + SAC/SHC; authorised stage completion and reasoned returns |
| Role-based dashboards | Admin, Regional Officer and Institution Head views with server-side region/institution scoping |
| Pendency and ageing | Stage-wise SLA counters, active/overdue application queues and region-wise dashboard summaries |
| EVC scheduling | Dedicated EVC queue, schedule/reschedule action and alerts for unscheduled EVC-stage cases |
| Time-bound undertakings | Due-date tracking, submission and authorised verification states |
| Lease/document validity | Validity date tracking, expiry indicators, renewal submission and verification states |
| Alerts and escalation | Upcoming/overdue alert rules with Regional Officer, Regional Director and Bureau Head escalation levels |
| Secure document handling | Drag-and-drop uploads, file signature/type checks, private Supabase Storage and authorised preview/download |
| Auditability | Per-application history and hash-chained audit events; Admin can inspect audit records |
| Reports | Alert CSV export and region/stage dashboard summaries |
| Human oversight | Workflow actions support review; final statutory decisions remain with competent authorities |

## 4. Distinctive features
- Institution-domain-aware onboarding with Immediate self-registration to prevent unauthorised self-assigned roles.
- One operational view across approval movement, EVC, undertakings and expiring documents.
- Application timeline that records who acted, what changed, when it happened and any return reason.
- Private document storage separated from application metadata.
- Escalation visibility based on ageing rather than relying only on manual follow-up.
- Workflow simulation controls for evaluators to demonstrate upcoming, overdue and escalated states.

## 5. Suggested evaluator demo
1. Open the production URL and sign in as Admin.
2. Open Users and show pending registration approval and Admin-created account provisioning.
3. Sign in as Institution Head; create a new application and choose a workflow pathway.
4. Drag-and-drop supporting documents and show the application timeline.
5. Sign in as Regional Officer; complete a stage, return a case with a reason and schedule an EVC.
6. Open Undertakings and Documents; demonstrate submission/verification and validity monitoring.
7. Return to Admin; show region-wise/stage-wise pendency, alerts, escalation levels, CSV export and audit chain.
8. Use the date simulator to demonstrate approaching and overdue alerts. Explain that it is a prototype simulation, not a live regulatory clock.

## 6. Architecture
- Front end: responsive HTML/CSS/JavaScript interface.
- Application API: Node.js + Express deployed as a Vercel serverless function.
- Persistent state: Supabase Postgres JSONB state store with version checks.
- Document storage: private Supabase Storage bucket.
- Security: scrypt password hashes, HttpOnly/SameSite cookies, HS256 session tokens, login throttling, role and scope checks, input validation and security headers.

## 7. Regulatory and production safeguards
This is a prototype and workflow-support system. Its sample records, simulated clock and configurable demo pathways must not be treated as official AICTE data or authoritative APH interpretations. Before institutional production use, AICTE must approve the exact APH rules, stage SLAs, delegation matrix, document checklist, escalation hierarchy, data-retention policy and integrations. Email/SMS delivery, verified domain ownership, institutional identity proof and integration with authorised AICTE systems require approved providers and credentials. Automated workflow progression must never replace statutory scrutiny, EVC inspection, verification or competent-authority decisions.

## 8. Current prototype limitations
- Registration domain matching is a consistency check; it does not prove domain ownership. Admin review is mandatory.
- Alerts are visible in the platform; outbound email/SMS gateways are not configured in this prototype.
- The prototype stores evidence uploads for undertakings and lease renewals and supports official verification; production should additionally enforce APH-specific document checklists and multi-step sign-off.
- SLA values and demo pathways require validation against the currently applicable Approval Process Handbook before operational use.
- Demo date simulation is for evaluation only.

## 9. Evaluation focus
Workflow accuracy, role and data isolation, stage-wise pendency visibility, EVC scheduling, deadline alert correctness, audit completeness, document security, usability and the ability to demonstrate reduced manual follow-up.