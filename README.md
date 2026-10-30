# AICTE Nigrani — Approval & Compliance Monitor

Responsive Node.js + Express prototype for AICTE-style application workflow tracking, EVC scheduling, institutional undertakings, document validity, alerts and auditability.

## Live prototype
- Production: https://aictc-nigraani.vercel.app
- Health check: https://aictc-nigraani.vercel.app/healthz

## Run locally
```bash
npm ci
npm start
```

Local demo accounts (development only; password `Aicte@2026` unless `DEMO_PASSWORD` is set):
| Role | Email |
|---|---|
| Admin/Bureau | bureau@aicte.demo |
| Regional Officer | central@ / north@ / south@ / west@ / east@aicte.demo |
| Institution Head | sriram@inst.demo, narmada@inst.demo |

## Registration and account governance
- Institution Heads and Regional Officers can request an account from the public registration tab.
- Institution Head email domain must match the declared institution website domain.
- All public requests remain pending until an existing Admin approves or rejects them.
- Admin self-registration is intentionally disabled. Admin accounts are created by an existing Admin or a secure bootstrap configuration.
- Domain matching is a consistency check only; it does not prove domain ownership. Admin review remains mandatory.
- Pending and rejected accounts cannot sign in or access institutional data.

## Prototype capabilities
- Role-based dashboards with server-side Region/Institution data scoping.
- APH-style pathways: Only Scrutiny, Scrutiny + EVC, Only EVC, Only SAC/SHC, Scrutiny + SAC/SHC, EVC + SAC/SHC and Scrutiny + EVC + SAC/SHC.
- Stage progression, reasoned returns, application timelines and SLA ageing.
- EVC queue and scheduling; time-bound undertaking tracking; lease/document validity and renewal states.
- Upcoming/overdue alerts, escalation levels, region-wise summaries and CSV alert export.
- Drag-and-drop application documents, file type/signature validation, private Supabase Storage and authorised preview/download.
- Admin account approval, hash-chained audit events and human-authority safeguards.

## Architecture and deployment
- Front end: responsive HTML/CSS/JavaScript.
- API: Node.js 22 + Express, deployed on Vercel serverless functions.
- Persistent state: Supabase Postgres JSONB state row with optimistic version checks.
- Documents: private Supabase Storage bucket accessed through the `nigrani-proxy` Edge Function.
- Vercel environment variables: `SUPABASE_URL`, `APP_BACKEND_URL`, `APP_BACKEND_SECRET`, `SUPABASE_BUCKET`, `JWT_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME`, `NODE_ENV=production`, `DEMO_HINT=0`.

## Tests
```bash
npm test
node --check server.js
```
GitHub Actions runs the smoke tests on pushes and pull requests to `main`.

## SIH documentation
- [SIH submission and feature mapping](SIH_SUBMISSION.md)
- [Evaluator demo guide](docs/EVALUATOR_DEMO.md)

## Production limitations and safeguards
This is an evaluation prototype, not an authorised AICTE production system. Seed records and the workflow date simulator are illustrative. SLA values and workflow combinations must be validated against the currently applicable APH and approved administrative procedures. Registration domain matching is not email/domain ownership verification. Outbound email/SMS notification providers and authorised AICTE system integrations are not configured. Some undertaking and renewal actions are currently represented by status transitions; production use must require evidence files and formal verification. Automated workflow actions do not replace statutory scrutiny, inspections, verification or decisions of competent authorities. Production onboarding must include formal identity/institution verification, approved APH configuration, retention policies, notification gateways, monitoring and a security review.

## Security controls
scrypt password hashing · HttpOnly/SameSite cookies · HS256 sessions · login throttling · role/region/institution checks on API routes · file signature validation · private document storage · CSP/security headers · hash-chained audit log.
