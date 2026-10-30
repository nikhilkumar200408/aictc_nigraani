# AICTE Nigrani – Approval & Compliance Monitor

Node.js + Express backend (JSON-file metadata storage) with a white-theme web UI. Application records have dedicated detail URLs, and uploaded files are stored separately under `DATA_DIR/uploads` rather than embedded in JSON.

## Run locally
```
npm install
npm start          # http://localhost:3000
```
Initial test accounts (password `Aicte@2026`, or `DEMO_PASSWORD`):
| Role | Email |
|---|---|
| Bureau (all regions, audit, workflow date controls) | bureau@aicte.demo |
| Regional officer | central@ / north@ / south@ / west@ / east@aicte.demo |
| Institution | sriram@inst.demo, narmada@inst.demo |

## Public registration and access control
- Institution Heads can request access using an institutional email address whose domain matches the institution website domain they enter.
- Regional Officers can request access and select their AICTE region.
- All public registrations remain pending until an existing Admin approves or rejects them. Admin self-registration is disabled; Admin accounts can only be provisioned by an existing Admin or secure bootstrap configuration.
- Pending/rejected accounts cannot sign in or access application data. Domain matching is a registration check, not a substitute for formal institutional verification.

## Deploy
- **Render / Railway / Fly**: connect repo, build `npm install`, start `npm start`. Set env vars from `.env.example`; mount a persistent disk and point `DATA_DIR` to it.
- **Docker**: `docker build -t nigrani . && docker run -p 3000:3000 -v nigrani:/data -e JWT_SECRET=... -e DEMO_PASSWORD=... -e DEMO_HINT=0 nigrani`

## Applications and documents
Institution users can create, edit, submit, and open applications at `/applications/:id`; Bureau officers can open and edit application records, and refreshing a detail URL retains the page. Application history is recorded with each workflow action. Application documents can be selected or dragged into the upload area, then previewed inline (PDF/images) or downloaded. File contents are stored on disk, while metadata is stored with the application record.

Uploads accept PDF, JPG/JPEG, PNG, DOC/DOCX, XLS/XLSX. The default per-file limit is 15 MiB and can be changed with `MAX_UPLOAD_BYTES` (integer from 1048576 to 104857600). Keep `DATA_DIR` on persistent storage; back up both `db.json` and the `uploads/` directory.

## Security built in
scrypt password hashing · HS256 JWT in HttpOnly + SameSite=Strict (+Secure in production) cookie · login rate limit · server-side role & region/institution scoping on every endpoint · input validation · CSP and security headers · hash-chained backend audit log.

## API (all JSON, cookie auth)
`POST /api/login` · `POST /api/logout` · `GET /api/state` · `POST /api/applications` · `GET/PATCH /api/applications/:id` · `POST /api/applications/:id/documents` (raw file body; `X-File-Name` and `X-Document-Category` headers) · `PATCH /api/applications/:id/documents/:documentId {status,reason?}` (authorised official review) · `GET /api/applications/:id/documents/:documentId` · `POST /api/act {k,id,reason?,days?}` · `POST /api/password {old,next}`
Bureau only: `POST /api/tick {n}` (date simulator) · `POST /api/reset` · `POST /api/users {email,name,role,reg,inst,password}`

## SIH prototype coverage
- Role-based dashboards and server-enforced Region/Institution scoping.
- APH-style workflow pathways: Only Scrutiny, Scrutiny + EVC, Only EVC, Only SAC/SHC, Scrutiny + SAC/SHC, EVC + SAC/SHC and Scrutiny + EVC + SAC/SHC; stage progression and reasoned returns.
- Stage ageing, EVC queue/scheduling, undertakings, lease/document validity, upcoming/overdue alerts and escalation levels.
- Document upload with drag-and-drop, private object storage, official verification, application history and hash-chained audit log.
- CSV alert export and Admin-managed account approval.
- Human authority is preserved: workflow completion does not represent statutory approval.

## Before production
Change all initial account passwords/`JWT_SECRET`, set `DEMO_HINT=0`, replace the JSON file with Supabase/Postgres and local file storage with a private object store before production; configure real notification channels (email/SMS) and AICTE systems. Supabase Auth, Netlify Functions, email verification, and the production storage/database policies are not configured by this Express deployment. Alerts/escalations support, but never replace, decisions of the competent authority.
