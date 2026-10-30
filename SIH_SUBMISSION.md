# AICTE Nigrani — SIH 2026 Solution Brief

**Problem Statement ID:** SIH26262  
**Title:** Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System  
**Theme:** Smart Automation · **Category:** Software  
**Team:** Aayam · **Team ID:** 197726

## 1. Problem understanding

AICTE approval work includes multiple application pathways and processing stages, including scrutiny, Expert Visit Committee (EVC), SAC/SHC and other combinations prescribed by the applicable Approval Process Handbook (APH). In parallel, institutions may have time-bound undertakings and prescribed documents—such as lease documents—that require submission, verification and renewal. Fragmented follow-up makes it difficult to identify stalled applications, approaching deadlines, overdue compliance and the official responsible for the next action.

## 2. Proposed solution

**AICTE Nigrani is a unified, role-based approval and obligation monitoring workspace.** It connects the application lifecycle with EVC, undertaking and document-validity tracking. Each case has a visible status, stage, owner/scope, timeline and next action. Configurable workflow rules support authorised officers; deadline rules surface upcoming and overdue work for follow-up.

## 3. Innovation and differentiators

### Unified Obligation Engine
One timeline for application stage clocks, EVC events, institutional undertakings and document validity. The goal is to replace separate follow-up sheets with a consistent record of due date, status and responsibility.

### Explainable AI assistance (planned extension)
OCR/AI can propose lease/document dates and flag missing or inconsistent evidence. The interface should show the source page/field and confidence; an authorised officer confirms or corrects the extracted value. This is an explainable-assistance design direction, not a claim that a production OCR/AI service is currently integrated.

### Smart alert and escalation model
The SIH concept specifies T-30 and T-7 reminders, due-date notices and overdue escalation through L1/L2. The current prototype demonstrates upcoming/overdue alert calculations, escalation labels and an evaluator date simulator. Email/SMS dispatch and a live scheduler are not configured in this deployment.

### Secure governance and human decision boundary
Role-based access, private document storage, reasoned returns, application history and a hash-chained audit log support traceability. AI and automation assist administrative work; statutory scrutiny, inspection, verification and final decisions remain with competent authorities.

## 4. Requirement-to-prototype mapping

| SIH requirement | What the current prototype demonstrates | Status / boundary |
|---|---|---|
| Application intake and routing | Application creation and APH-style workflow path selection | Demonstrated with illustrative paths; validate exact APH configuration before use |
| Stage automation | Stage completion, return with reason and resubmission | Human-authorised actions; not an autonomous statutory decision |
| Role-based dashboards | Bureau, Regional Officer and Institution Head views | Server-side role and scope checks |
| Pendency monitoring | Stage ageing, overdue indicators and Region summaries | Demonstrated using sample data and simulated workflow date |
| EVC scheduling | EVC queue and scheduling action | Demonstrated; no external committee calendar integration |
| Undertakings | Due-date records and submit/verify states | Demonstrated using sample data; production must enforce evidence and verification policy |
| Lease/document validity | Expiry alerts and renewal/verification states | Demonstrated using sample data; live OCR date extraction is not integrated |
| Notifications and escalation | Upcoming/overdue alert list, escalation levels and CSV export | In-app alerts demonstrated; email/SMS gateways and background scheduler not configured |
| Auditability | Application history and hash-chained audit events | Demonstrated in prototype |
| AI document assistance | Explainable OCR/date extraction concept | Planned extension; no deployed OCR/AI model claimed |
| AICTE integration | Extension architecture | Planned; no live AICTE/eOffice/DigiLocker integration is claimed |
| Human oversight | Authorised role actions and explicit decision boundary | Demonstrated design principle |

## 5. User roles

- **Bureau / Admin:** organisation-wide view, user administration, date simulation, reporting and audit visibility.
- **Regional Officer:** cases and obligations scoped to the assigned AICTE Region; authorised review and scheduling actions.
- **Institution Head:** applications and compliance items scoped to the registered institution; document upload and resubmission.

Regional Officers and Institution Heads can self-register for evaluator access. Institution registration checks that the email domain matches the declared website domain; this is only a consistency check, not proof of domain ownership. Bureau/Admin self-registration is disabled.

## 6. Technical architecture

- Responsive browser UI: HTML, CSS and JavaScript.
- API: Node.js 22 + Express on Vercel serverless.
- Data: Supabase Postgres JSONB state with version-checked writes through a private backend proxy.
- Files: private Supabase Storage bucket accessed server-side.
- Security: scrypt password hashing, HS256 HttpOnly session cookie, login throttling, role/scope checks, upload signature validation and audit events.

See [Architecture](docs/ARCHITECTURE.md) and [Security & limitations](docs/SECURITY_AND_LIMITATIONS.md).

## 7. Feasibility and viability

The prototype uses widely adopted web technologies and a managed database/object-storage backend. It demonstrates a phased approach: digitise workflow and obligation records first; add approved notification channels and verified identity/domain checks next; then integrate OCR-assisted extraction and authorised AICTE systems under formal governance.

## 8. Expected impact and measurable evaluation

The solution is intended to reduce manual chasing, expose pending work earlier, improve EVC and compliance visibility, and create a traceable record of actions. Suggested evaluation metrics:

- Median time from submission to first scrutiny action.
- Percentage of cases processed within configured stage SLA.
- Number and age distribution of pending/overdue cases.
- EVC scheduling lead time and overdue EVC count.
- Percentage of undertakings/document renewals submitted before due date.
- Alert precision/recall and escalation timeliness.
- Completeness of application history and audit verification.
- User task completion time and number of manual follow-ups avoided.

Do not present target improvements as measured results unless a controlled pilot produces evidence.

## 9. Demo and evidence

- [Live prototype](https://aictc-nigraani.vercel.app)
- [Evaluator demo guide](docs/EVALUATOR_DEMO.md)
- [UI previews](docs/screenshots/)
- [Feature traceability matrix](docs/FEATURE_TRACEABILITY.md)

## 10. Regulatory safeguard

The platform must operate only under current AICTE regulations, the applicable APH and authorised administrative procedures. Workflow rules, timelines, delegation, document requirements and escalation levels must be approved and version-controlled by the competent authority. Automated alerts, OCR and recommendations are decision-support tools only; they must never replace statutory scrutiny, verification, EVC inspection or decisions reserved for competent authorities.
