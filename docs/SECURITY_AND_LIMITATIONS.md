# Security, Governance and Prototype Limitations

## Implemented prototype controls

- Passwords are stored as salted scrypt hashes.
- Session tokens are signed with HS256 and sent in an HttpOnly, SameSite cookie; production cookies are Secure.
- Login and registration endpoints apply request throttling.
- API routes enforce role checks and server-side Region/Institution scoping.
- Uploads validate filename extension, declared MIME type and file signature, enforce a configurable size limit and calculate SHA-256 checksums.
- Hosted document storage is private and accessed through a server-side proxy.
- Security headers and a Content Security Policy are applied.
- Workflow actions are recorded in application history and a hash-chained audit log.

## Evaluator registration

Regional Officer and Institution Head self-registration is enabled for evaluation. Institution email domain must match the declared institution website domain. This does **not** prove mailbox control, institutional affiliation or website ownership. Admin/Bureau accounts cannot be self-registered and must be provisioned through the secure administrator bootstrap or an existing administrator.

## Not yet production-ready

- No independent penetration test, security certification or formal privacy impact assessment is claimed.
- Sample data and simulated workflow dates are illustrative, not official AICTE records or a live regulatory clock.
- Exact APH pathways, SLAs, document checklists, escalation thresholds and delegation must be approved and versioned by AICTE.
- Email/SMS delivery, scheduled background notifications and delivery receipts are not configured.
- OCR/AI date extraction is a proposed extension; no production AI extraction model is integrated.
- Live AICTE, eOffice, DigiLocker or API Setu integration is not configured.
- Domain matching is not verified domain ownership or identity verification.
- The current JSONB singleton state store is a compatibility-oriented prototype architecture; high-volume production should consider normalised relational tables, transactional workflows, queue processing, backups and disaster recovery.
- Undertaking and renewal workflows require production-grade evidence enforcement, retention rules, multi-party verification and policy-based sign-off.

## Responsible-use boundary

AI-generated suggestions, OCR output, alerts and workflow automation are decision-support only. They must not approve/reject an application, replace statutory scrutiny or inspection, certify compliance, or override a competent authority. Every proposed automated action must be explainable, reviewable, permission-checked and auditable.

## Secret handling

Never commit `.env`, JWT secrets, Supabase service-role keys, backend proxy secrets, bootstrap passwords, access tokens or real institution documents. Store runtime secrets in the hosting provider's encrypted environment settings and rotate them if exposed. Use synthetic data in the evaluator environment.
