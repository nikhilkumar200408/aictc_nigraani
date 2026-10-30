# Evaluator Demo Guide

**Recommended duration:** 5–7 minutes.  
**Live URL:** https://aictc-nigraani.vercel.app

## Before the demo

- Open the live URL in a fresh browser session.
- Use evaluator credentials supplied separately by the team, or create a Regional Officer / Institution Head account from **Create account**.
- Registration requires a 12-character minimum password. Institution Head email domain must match the declared institution website domain. This is a consistency check only; it is not domain ownership verification.
- Admin/Bureau cannot be created through public registration.

## Suggested walkthrough

| Time | Screen | What to demonstrate | Evaluation signal |
|---|---|---|---|
| 0:00–0:45 | Sign in / Create account | Role selector and self-registration | Accessible onboarding with role separation |
| 0:45–1:30 | Dashboard | Active cases, overdue items, upcoming deadlines, EVC queue, stage and Region summaries | At-a-glance visibility and prioritisation |
| 1:30–2:30 | Applications | Open a case, inspect workflow path, stage, overview and timeline | Traceable case movement |
| 2:30–3:15 | EVC | Show the EVC queue and schedule an eligible case | EVC coordination |
| 3:15–4:00 | Undertakings | Show due dates and submission / verification states | Time-bound obligation tracking |
| 4:00–4:45 | Documents | Show expiry status, drag/drop upload and authorised review | Evidence handling and renewal visibility |
| 4:45–5:45 | Alerts | Show upcoming/overdue levels and export CSV | Escalation and reporting |
| 5:45–6:30 | Bureau controls | Use workflow date simulator to demonstrate ageing and escalation | Reproducible evaluator scenario |

## Narration: what is unique?

1. **One obligation engine:** approvals, EVC, undertakings and document expiry are visible in one workspace.
2. **Role-aware work queues:** each role sees the cases within its assigned Region or institution.
3. **Reasoned workflow:** a return requires a reason and case actions appear in the timeline/audit trail.
4. **Escalation visibility:** overdue work is labelled for the next responsible level.
5. **Human authority:** the system supports officers; it does not make statutory approval or rejection decisions.

## Important demo caveats

- Dashboard records and dates are illustrative seed data.
- The workflow date simulator is an evaluation aid, not a live regulatory clock.
- In-app alert calculation and escalation visibility are demonstrated; outbound email/SMS delivery and a production background scheduler are not configured.
- OCR/AI lease-date extraction and live AICTE/eOffice/DigiLocker integrations are proposed extensions, not deployed capabilities.
- Do not upload real personal, institutional or confidential regulatory documents to the public evaluation deployment.
