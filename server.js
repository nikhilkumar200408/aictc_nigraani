'use strict';
const express = require('express'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const L = require('./public/logic.js');
const PORT = process.env.PORT || 3000, PROD = process.env.NODE_ENV === 'production';
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/+$/, ''), APP_BACKEND_URL = String(process.env.APP_BACKEND_URL || '').replace(/\/+$/, ''), APP_BACKEND_SECRET = process.env.APP_BACKEND_SECRET || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'application-documents';
const REMOTE = Boolean(SUPABASE_URL && APP_BACKEND_URL && APP_BACKEND_SECRET);
let DB_VERSION = 0, pendingSave = null;
async function sbRequest(url, options = {}) {
 const original = new URL(url), endpoint = `${APP_BACKEND_URL}?path=${encodeURIComponent(original.pathname + original.search)}`;
 const response = await fetch(endpoint, {...options, headers:{...(options.headers||{}),'x-nigrani-secret':APP_BACKEND_SECRET}});
 if(!response.ok){const detail=await response.text().catch(()=> '');throw Object.assign(new Error(`Backend request failed (${response.status}): ${detail.slice(0,250)}`),{status:response.status});}
 return response;
}
const sbPath = p => p.split('/').map(encodeURIComponent).join('/');
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data'), FILE = path.join(DIR, 'db.json');
const UPLOAD_DIR = path.join(DIR, 'uploads'), MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 15 * 1024 * 1024);
if (!Number.isSafeInteger(MAX_UPLOAD_BYTES) || MAX_UPLOAD_BYTES < 1024 * 1024 || MAX_UPLOAD_BYTES > 100 * 1024 * 1024) throw new Error('MAX_UPLOAD_BYTES must be between 1048576 and 104857600');
const MAX_UPLOAD_LABEL = `${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(2).replace(/\.?0+$/, '')} MB`;
const DEMO_PW = process.env.DEMO_PASSWORD || (PROD ? '' : 'Aicte@2026');
const SHOW_HINT = process.env.DEMO_HINT ? process.env.DEMO_HINT === '1' : !PROD;

/* ---------- password + token helpers (node crypto only) ---------- */
const hashPw = p => { const s = crypto.randomBytes(16); return s.toString('hex') + ':' + crypto.scryptSync(p, s, 64).toString('hex'); };
const checkPw = (p, st) => { const [s, h] = st.split(':'); const a = crypto.scryptSync(p, Buffer.from(s, 'hex'), 64), b = Buffer.from(h, 'hex'); return crypto.timingSafeEqual(a, b); };
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const SECRET = () => process.env.JWT_SECRET || DB.secret;
const sign = pl => { const d = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(pl); return d + '.' + crypto.createHmac('sha256', SECRET()).update(d).digest('base64url'); };
function verify(t) {
  const p = String(t || '').split('.'); if (p.length !== 3) return null;
  const sig = crypto.createHmac('sha256', SECRET()).update(p[0] + '.' + p[1]).digest(), got = Buffer.from(p[2], 'base64url');
  if (sig.length !== got.length || !crypto.timingSafeEqual(sig, got)) return null;
  try { const pl = JSON.parse(Buffer.from(p[1], 'base64url')); return pl.exp > Date.now() / 1000 ? pl : null; } catch { return null; }
}

/* ---------- storage (atomic JSON file) ---------- */
const MY = 'Shri Ram Institute of Technology';
function seedData() {
  return {
    off: 0, sent: {}, audit: [],
    apps: [[MY, 'Central', 'Scrutiny + EVC', 0, -18], ['Vindhya College of Engineering', 'Central', 'Only EVC', 0, -12], ['Narmada School of Management', 'West', 'Scrutiny + EVC + SAC/SHC', 1, -34], ['Himalaya Technical Campus', 'North', 'EVC + SAC/SHC', 1, -9], ['Kaveri Institute of Pharmacy', 'South', 'Only Scrutiny', 0, -4], ['Ganga Polytechnic', 'East', 'Scrutiny + EVC', 1, -27], ['Thar Institute of Design', 'West', 'Only Scrutiny', 0, -16], ['Deccan Architecture School', 'South', 'EVC + SAC/SHC', 0, -2], ['Konark College of Technology', 'East', 'Scrutiny + EVC', 0, -10]]
      .map((a, i) => ({ id: 'APP-' + (1001 + i), inst: a[0], reg: a[1], path: a[2], i: a[3], since: a[4], sched: null, ret: null, done: false })),
    uts: [[MY, 'Central', 'Submit fire-safety NOC', -9], ['Himalaya Technical Campus', 'North', 'Appoint 3 professors', 5], ['Kaveri Institute of Pharmacy', 'South', 'Complete lab accreditation', 12], ['Ganga Polytechnic', 'East', 'Submit land conversion proof', -1], ['Thar Institute of Design', 'West', 'Library expansion proof', 40]]
      .map((a, i) => ({ id: 'UT-' + (i + 1), inst: a[0], reg: a[1], cond: a[2], due: a[3], st: 'Pending' })),
    docs: [[MY, 'Central', 'Lease deed', 6], ['Vindhya College of Engineering', 'Central', 'Lease deed', -20], ['Narmada School of Management', 'West', 'Lease deed', 75], ['Deccan Architecture School', 'South', 'Rent agreement', 11], ['Konark College of Technology', 'East', 'Lease deed', -3]]
      .map((a, i) => ({ id: 'LD-' + (i + 1), inst: a[0], reg: a[1], name: a[2], exp: a[3], st: 'Valid' }))
  };
}
function seedUsers() {
  const U = (email, name, role, reg, inst, password) => ({ id: crypto.randomUUID(), email, name, role, reg, inst, pw: hashPw(password), status:'active' });
  if (PROD) {
    const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) return [];
    return [U(email, process.env.BOOTSTRAP_ADMIN_NAME || 'AICTE Nigrani Administrator', 'bureau', null, null, password)];
  }
  return [U('bureau@aicte.demo','Bureau Officer','bureau',null,null,DEMO_PW),
    ...['Central','North','South','West','East'].map(r=>U(r.toLowerCase()+'@aicte.demo',r+' Regional Officer','regional',r,null,DEMO_PW)),
    U('sriram@inst.demo','Shri Ram Institute (Principal)','institution','Central',MY,DEMO_PW),
    U('narmada@inst.demo','Narmada School (Registrar)','institution','West','Narmada School of Management',DEMO_PW)];
}
let DB;
function loadLocal() {
 fs.mkdirSync(DIR,{recursive:true});
 try{DB=JSON.parse(fs.readFileSync(FILE,'utf8'));}
 catch{DB=Object.assign(seedData(),{users:seedUsers(),secret:crypto.randomBytes(48).toString('hex')});log('System','INIT','Platform initialised');save();}
}
async function loadRemote(){
 if(!REMOTE)throw Object.assign(new Error('Persistent database is not configured'),{status:503});
 if(PROD&&(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32))throw Object.assign(new Error('JWT_SECRET is not configured'),{status:503});
 const url=`${SUPABASE_URL}/rest/v1/app_state?select=data,version&id=eq.primary`;
 let rows=await(await sbRequest(url)).json();
 if(!rows.length){
  const users=seedUsers();if(PROD&&!users.length)throw Object.assign(new Error('Bootstrap administrator is not configured'),{status:503});
  const initial=Object.assign(seedData(),{users,secret:crypto.randomBytes(48).toString('hex')});
  try{await sbRequest(`${SUPABASE_URL}/rest/v1/app_state`,{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:'primary',data:initial,version:1})});}
  catch(err){if(err.status!==409)throw err;}
  rows=await(await sbRequest(url)).json();
 }
 if(!rows.length)throw Object.assign(new Error('Could not initialise application data'),{status:503});
 DB=rows[0].data;DB_VERSION=Number(rows[0].version);
 if(PROD && DB.users?.some(u=>u.email==='bureau@aicte.demo')){
  const secureUsers=seedUsers();
  if(!secureUsers.length)throw Object.assign(new Error('Bootstrap administrator is not configured'),{status:503});
  DB.users=secureUsers;
  log('System','PRODUCTION ACCOUNT MIGRATION','Removed demo accounts and installed the configured administrator');
  try{await save();}
  catch(err){
   if(err.status!==409)throw err;
   pendingSave=null;
   const latest=await(await sbRequest(url)).json();
   if(!latest.length)throw err;
   DB=latest[0].data;DB_VERSION=Number(latest[0].version);
   if(DB.users?.some(u=>u.email==='bureau@aicte.demo'))throw err;
  }
 }
}
function save(){
 if(!REMOTE){const t=FILE+'.tmp';fs.mkdirSync(DIR,{recursive:true});fs.writeFileSync(t,JSON.stringify(DB));fs.renameSync(t,FILE);return;}
 pendingSave=(async()=>{
  const rows=await(await sbRequest(`${SUPABASE_URL}/rest/v1/rpc/save_app_state`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_id:'primary',p_expected_version:DB_VERSION,p_data:DB})})).json();
  if(!Array.isArray(rows)||!rows.length)throw Object.assign(new Error('Data changed in another request; reload and retry'),{status:409});
  DB_VERSION=Number(rows[0].version);
 })();return pendingSave;
}
function appStatus(a) { return a.ret ? 'Returned' : a.done ? 'Completed' : a.state || 'In Review'; }
function addAppHistory(a, user, action, remarks, previousStatus, newStatus) {
  a.history ||= [];
  a.history.push({ action, user: user.name, role: user.role, at: new Date().toISOString(), previousStatus, newStatus, remarks: remarks || '' });
}
function validateApplication(body, institution, region) {
  const fields = ['inst', 'permanentId', 'academicYear', 'category', 'state', 'reg', 'address', 'contactPerson', 'contactEmail', 'contactMobile', 'path', 'requiredDocuments', 'description'];
  const value = Object.fromEntries(fields.map(k => [k, String(body?.[k] ?? '').trim()]));
  const missing = fields.filter(k => !value[k]);
  if (missing.length) return { error: `Required fields missing: ${missing.join(', ')}` };
  if (value.inst.length > 160 || value.address.length > 500 || value.description.length > 3000) return { error: 'One or more fields exceed the allowed length' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contactEmail)) return { error: 'Enter a valid contact email' };
  if (!/^[+\d() -]{7,20}$/.test(value.contactMobile)) return { error: 'Enter a valid contact mobile number' };
  if (!L.PATHS[value.path]) return { error: 'Unsupported workflow type' };
  if (institution && value.inst !== institution) return { error: 'Institution does not match your account' };
  if (region && value.reg !== region) return { error: 'Region does not match your account' };
  return { value };
}
function fileTypeAllowed(name, mime, buf) {
  const ext = path.extname(name).toLowerCase(), expected = {
    '.pdf': ['application/pdf'], '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'],
    '.png': ['image/png'], '.doc': ['application/msword', 'application/octet-stream'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
    '.xls': ['application/vnd.ms-excel', 'application/octet-stream'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream']
  };
  if (!expected[ext] || !expected[ext].includes(mime)) return false;
  if (ext === '.pdf') return buf.subarray(0, 5).toString() === '%PDF-';
  if (ext === '.png') return buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === '.jpg' || ext === '.jpeg') return buf[0] === 255 && buf[1] === 216 && buf[2] === 255;
  if (ext === '.doc' || ext === '.xls') return buf.subarray(0, 8).equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]));
  return buf.subarray(0, 2).toString() === 'PK';
}

/* ---------- tamper-evident audit + alert sweep ---------- */
function log(actor, act, det) {
  const p = DB.audit.length ? DB.audit[DB.audit.length - 1].h : '00000000', r = { t: DB.off, ts: new Date().toISOString(), actor, act, det };
  r.h = L.entryHash(p, r); DB.audit.push(r);
}
function sweep() {
  L.alerts(DB).forEach(a => {
    if (DB.sent[a.key] !== a.lv) { DB.sent[a.key] = a.lv; log('System', a.lv === 'Upcoming' ? 'REMINDER' : 'ESCALATION → ' + a.lv.split(' · ')[1], a.msg); }
  });
}

/* ---------- access control ---------- */
const canSee = (u, x) => u.role === 'bureau' || (u.role === 'regional' ? x.reg === u.reg : x.inst === u.inst);
const view = u => ({
  user: { name: u.name, role: u.role, reg: u.reg, inst: u.inst, email: u.email }, users: u.role === 'bureau' ? DB.users.map(x => ({ id:x.id, name:x.name, email:x.email, role:x.role, reg:x.reg, inst:x.inst, emailDomain:x.emailDomain||null, status:x.status||'active' })) : [], off: DB.off,
  apps: DB.apps.filter(x => canSee(u, x)), uts: DB.uts.filter(x => canSee(u, x)), docs: DB.docs.filter(x => canSee(u, x)),
  audit: u.role === 'bureau' ? DB.audit.slice(-200) : [], chainOk: u.role === 'bureau' ? L.verifyChain(DB.audit) : true
});

/* ---------- app ---------- */
if(!REMOTE){loadLocal();sweep();save();}
const app = express();
app.disable('x-powered-by'); if (PROD) app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'" });
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname,'public')));
let apiQueue=Promise.resolve();
app.use('/api',(req,res,next)=>{
 const previous=apiQueue;let release;apiQueue=new Promise(resolve=>{release=resolve;});
 let released=false;const unlock=()=>{if(!released){released=true;release();}};
 res.once('finish',unlock);res.once('close',unlock);
 previous.then(async()=>{
  try{if(!REMOTE){next();return;}await loadRemote();const send=res.json.bind(res);res.json=body=>{const pending=pendingSave;pendingSave=null;if(!pending)return send(body);pending.then(()=>send(body)).catch(next);return res;};next();}
  catch(err){unlock();next(err);}
 }).catch(err=>{unlock();next(err);});
});

const tries = new Map();
const cookie = (req, n) => (req.headers.cookie || '').split(';').map(s => s.trim().split('=')).find(p => p[0] === n)?.[1];
const setTok = (res, t, age) => res.append('Set-Cookie', `tok=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${PROD ? '; Secure' : ''}`);
function auth(req, res, next) {
  const pl = verify(cookie(req, 'tok')), u = pl && DB.users.find(x => x.id === pl.sub);
  if (!u) return res.status(401).json({ error: 'Not signed in' });
  req.user = u; next();
}
const bureau = (req, res, next) => req.user.role === 'bureau' ? next() : res.status(403).json({ error: 'Bureau access only' });

app.get('/healthz',async(_,res)=>{
 if(!REMOTE)return res.status(PROD?503:200).json({ok:!PROD,database:'local-only'});
 try{await sbRequest(`${SUPABASE_URL}/rest/v1/app_state?select=id&limit=1`);await sbRequest(`${SUPABASE_URL}/storage/v1/bucket/${encodeURIComponent(SUPABASE_BUCKET)}`);res.json({ok:true,database:'connected',storage:'connected'});}
 catch(_){res.status(503).json({ok:false,database:'unavailable',storage:'unavailable'});}
});
app.get('/favicon.ico', (_, res) => res.type('image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1e3a8a"/><text x="32" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#fff">N</text></svg>'));
app.get('/api/config', (_, res) => res.json({ maxUploadBytes: MAX_UPLOAD_BYTES }));
app.get('/api/hint', (_, res) => res.json({ hint: SHOW_HINT ? `Test sign-ins (password ${DEMO_PW}): bureau@aicte.demo · central@aicte.demo · sriram@inst.demo` : null }));
app.get('/api/session', (req, res) => {
  const payload = verify(cookie(req, 'tok')), user = payload && DB.users.find(x => x.id === payload.sub);
  res.json(user ? { authenticated: true, state: view(user) } : { authenticated: false });
});

app.post('/api/register', (req, res) => {
 const b=req.body||{},email=String(b.email||'').trim().toLowerCase(),name=String(b.name||'').trim(),role=String(b.role||''),reg=String(b.reg||'').trim(),inst=String(b.inst||'').trim(),password=b.password;
 const domain=String(b.domain||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'');
 if(!/^\S+@\S+\.\S+$/.test(email)||name.length<2||name.length>80||!['regional','institution'].includes(role)||typeof password!=='string'||password.length<12)return res.status(400).json({error:'Enter valid details. Password must be at least 12 characters. Admin accounts can only be created by an existing Admin.'});
 if(!['Central','North','South','West','East'].includes(reg))return res.status(400).json({error:'Select your AICTE Region.'});
 if(role==='institution'&&(!inst||inst.length>160||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)||email.split('@')[1]!==domain))return res.status(400).json({error:'Institution email domain must exactly match the institution website domain entered.'});
 if(DB.users.some(x=>x.email===email))return res.status(409).json({error:'This email is already registered.'});
 DB.users.push({id:crypto.randomUUID(),email,name,role,reg,inst:role==='institution'?inst:null,emailDomain:role==='institution'?domain:null,pw:hashPw(password),status:'pending',requestedAt:new Date().toISOString()});
 log(name,'REGISTRATION REQUESTED',email+' requested '+role+' access; pending Admin verification');save();
 res.status(202).json({ok:true,pendingApproval:true,message:'Registration submitted. An AICTE Admin must verify and approve your access before you can sign in.'});
});

app.post('/api/login', (req, res) => {
  const ip = req.ip, t = tries.get(ip) || { n: 0, at: Date.now() };
  if (Date.now() - t.at > 9e5) { t.n = 0; t.at = Date.now(); }
  if (t.n >= 8) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  const { email, password, role } = req.body || {};
  const u = DB.users.find(x => x.email === String(email || '').trim().toLowerCase());
  if (!u || (role && u.role !== role) || typeof password !== 'string' || !checkPw(password, u.pw)) { t.n++; tries.set(ip, t); return res.status(401).json({ error: 'Email, password or selected role is incorrect' }); }
  if(u.status==='pending')return res.status(403).json({error:'Your registration is awaiting Admin approval.'});
  if(u.status==='rejected')return res.status(403).json({error:'This registration was not approved. Contact the AICTE Admin.'});
  tries.delete(ip); setTok(res, sign({ sub: u.id, exp: Math.floor(Date.now() / 1000) + 8 * 3600 }), 8 * 3600);
  log(u.name, 'LOGIN', u.email); save(); res.json(view(u));
});
app.post('/api/logout', (req, res) => { setTok(res, '', 0); res.json({ ok: true }); });
app.get('/api/state', auth, (req, res) => res.json(view(req.user)));

app.post('/api/applications', auth, (req, res) => {
  if (req.user.role !== 'institution') return res.status(403).json({ error: 'Only institution users can create applications' });
  const checked = validateApplication(req.body, req.user.inst, req.user.reg);
  if (checked.error) return res.status(400).json({ error: checked.error });
  const d = checked.value, submitted = req.body.submit === true;
  const a = {
    id: `APP-${new Date().getFullYear()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    inst: d.inst, reg: d.reg, path: d.path, i: 0, since: DB.off, sched: null, ret: null, done: false,
    state: submitted ? 'In Review' : 'Draft', details: {
      permanentId: d.permanentId, applicationNumber: null, academicYear: d.academicYear, category: d.category,
      state: d.state, address: d.address, contactPerson: d.contactPerson, contactEmail: d.contactEmail,
      contactMobile: d.contactMobile, requiredDocuments: d.requiredDocuments, description: d.description, submissionDate: submitted ? new Date().toISOString() : null
    }, documents: [], history: []
  };
  a.details.applicationNumber = a.id;
  addAppHistory(a, req.user, submitted ? 'Application submitted' : 'Draft created', '', '', a.state);
  DB.apps.push(a);
  log(req.user.name, 'APPLICATION CREATED', `${a.id} (${a.inst})`);
  save();
  res.status(201).json({ application: a, state: view(req.user) });
});

app.get('/api/applications/:id', auth, (req, res) => {
  const a = DB.apps.find(x => x.id === req.params.id);
  if (!a || !canSee(req.user, a)) return res.status(404).json({ error: 'Application not found' });
  const history = a.history?.length ? a.history : DB.audit.filter(x => String(x.det).includes(a.id)).map(x => ({
    action: x.act, user: x.actor, role: '', at: x.ts, previousStatus: '', newStatus: '', remarks: x.det
  }));
  res.json({ ...a, status: appStatus(a), details: a.details || {}, documents: a.documents || [], history });
});

app.patch('/api/applications/:id', auth, (req, res) => {
  const a = DB.apps.find(x => x.id === req.params.id);
  if (!a || !canSee(req.user, a)) return res.status(404).json({ error: 'Application not found' });
  if (!['institution', 'bureau'].includes(req.user.role) || appStatus(a) === 'Completed') return res.status(403).json({ error: 'You cannot edit this application' });
  if (req.user.role === 'institution' && a.ret && req.body.submit !== true) return res.status(409).json({ error: 'Submit the application after addressing the return reason' });
  const checked = validateApplication(
    req.body,
    req.user.role === 'institution' ? req.user.inst : null,
    req.user.role === 'institution' ? req.user.reg : null
  );
  if (checked.error) return res.status(400).json({ error: checked.error });
  const previousStatus = appStatus(a), d = checked.value, submitted = req.body.submit === true;
  if (a.i > 0 && d.path !== a.path) return res.status(409).json({ error: 'Workflow cannot be changed after processing has advanced' });
  Object.assign(a, { inst: d.inst, reg: d.reg, path: d.path });
  Object.assign(a.details ||= {}, {
    permanentId: d.permanentId, academicYear: d.academicYear, category: d.category, state: d.state,
    address: d.address, contactPerson: d.contactPerson, contactEmail: d.contactEmail,
    contactMobile: d.contactMobile, requiredDocuments: d.requiredDocuments, description: d.description,
    submissionDate: submitted ? new Date().toISOString() : a.details?.submissionDate || null
  });
  if (submitted) { a.ret = null; a.state = 'In Review'; a.since = DB.off; }
  else if (previousStatus === 'Draft') a.state = 'Draft';
  addAppHistory(a, req.user, submitted ? 'Application submitted' : 'Application updated', '', previousStatus, appStatus(a));
  log(req.user.name, submitted ? 'APPLICATION SUBMITTED' : 'APPLICATION UPDATED', a.id);
  save();
  res.json({ application: a, state: view(req.user) });
});

app.post('/api/applications/:id/documents', auth, (req, res, next) => {
  const a = DB.apps.find(x => x.id === req.params.id);
  if (!a || !canSee(req.user, a)) return res.status(404).json({ error: 'Application not found' });
  if (req.user.role !== 'institution' || appStatus(a) === 'Completed') return res.status(403).json({ error: 'You cannot upload documents for this application' });
  express.raw({ type: () => true, limit: MAX_UPLOAD_BYTES })(req, res, async err => {
    if (err) return next(err);
    let rawName = String(req.headers['x-file-name'] || '');
    try { rawName = decodeURIComponent(rawName); } catch { return res.status(400).json({ error: 'Invalid file name encoding' }); }
    const name = path.basename(rawName.replace(/\\/g, '/')).replace(/[\r\n"]/g, '').trim();
    const category = String(req.headers['x-document-category'] || '').trim().slice(0, 100);
    const mime = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
    const buf = req.body;
    if (!name || !category || !Buffer.isBuffer(buf) || !buf.length) return res.status(400).json({ error: 'File, file name and document category are required' });
    if (buf.length > MAX_UPLOAD_BYTES) return res.status(413).json({ error: `Maximum file size is ${MAX_UPLOAD_LABEL}` });
    if (!fileTypeAllowed(name, mime, buf)) return res.status(415).json({ error: 'File extension, content type or file signature is not supported' });
    const doc = {
      id: crypto.randomUUID(), applicationId: a.id, category, fileName: name, storagePath: `${a.id}/${crypto.randomUUID()}`,
      mimeType: mime, size: buf.length, uploadedBy: req.user.name, uploadedAt: new Date().toISOString(),
      verificationStatus: 'Pending', version: (a.documents || []).filter(x => x.category === category).length + 1
    };
    doc.checksum = crypto.createHash('sha256').update(buf).digest('hex');
    if ((a.documents || []).some(x => x.category === category && x.checksum === doc.checksum)) return res.status(409).json({ error: 'This document was already uploaded in this category' });
    try {
      if(REMOTE)await sbRequest(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${sbPath(doc.storagePath)}`,{method:'POST',headers:{'Content-Type':mime,'x-upsert':'false'},body:buf});
      else{const target=path.join(UPLOAD_DIR,doc.storagePath);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,buf,{flag:'wx',mode:0o600});}
    } catch(err){return next(err);}
    a.documents ||= [];
    a.documents.push(doc);
    addAppHistory(a, req.user, 'Document uploaded', `${category}: ${name}`, appStatus(a), appStatus(a));
    log(req.user.name, 'APPLICATION DOCUMENT UPLOADED', `${a.id}: ${category} (${name})`);
    save();
    res.status(201).json(doc);
  });
});

app.patch('/api/applications/:id/documents/:documentId', auth, (req, res) => {
  const a = DB.apps.find(x => x.id === req.params.id);
  if (!a || !canSee(req.user, a)) return res.status(404).json({ error: 'Application not found' });
  if (req.user.role === 'institution') return res.status(403).json({ error: 'Only authorised officials can verify documents' });
  const doc = (a.documents || []).find(x => x.id === req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const { status, reason } = req.body || {};
  if (!['Verified', 'Returned'].includes(status)) return res.status(400).json({ error: 'Status must be Verified or Returned' });
  const remarks = String(reason || '').trim().slice(0, 300);
  if (status === 'Returned' && !remarks) return res.status(400).json({ error: 'A reason is required when returning a document' });
  if (doc.verificationStatus !== 'Pending') return res.status(409).json({ error: 'This document has already been reviewed' });
  doc.verificationStatus = status;
  doc.verifiedBy = req.user.name;
  doc.verifiedAt = new Date().toISOString();
  addAppHistory(a, req.user, status === 'Verified' ? 'Document verified' : 'Document returned', remarks || `${doc.category}: ${doc.fileName}`, appStatus(a), appStatus(a));
  log(req.user.name, status === 'Verified' ? 'APPLICATION DOCUMENT VERIFIED' : 'APPLICATION DOCUMENT RETURNED', `${a.id}: ${doc.category} (${doc.fileName})${remarks ? ` — ${remarks}` : ''}`);
  save();
  res.json({ ok: true, document: doc });
});

app.get('/api/applications/:id/documents/:documentId', auth, async (req, res, next) => {
  const a = DB.apps.find(x => x.id === req.params.id);
  if (!a || !canSee(req.user, a)) return res.status(404).json({ error: 'Application not found' });
  const doc = (a.documents || []).find(x => x.id === req.params.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  const target = path.join(UPLOAD_DIR, doc.storagePath);
  res.set({ 'Content-Type': doc.mimeType, 'Content-Length': String(doc.size), 'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN', 'Content-Security-Policy': "default-src 'self'; frame-ancestors 'self'",
    'Content-Disposition': `${req.query.download === '1' ? 'attachment' : 'inline'}; filename="${doc.fileName.replace(/["\\]/g, '_').replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}` });
  if(REMOTE){try{const file=await sbRequest(`${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${sbPath(doc.storagePath)}`);return res.send(Buffer.from(await file.arrayBuffer()));}catch(err){return next(err);}}
  fs.createReadStream(target).on('error', next).pipe(res);
});

app.post('/api/compliance/:kind/:id/evidence',auth,(req,res,next)=>{
 const list=req.params.kind==='undertaking'?DB.uts:req.params.kind==='lease'?DB.docs:null;
 if(!list)return res.status(404).json({error:'Unknown compliance record'});
 const item=list.find(x=>x.id===req.params.id);
 if(!item||!canSee(req.user,item))return res.status(404).json({error:'Compliance record not found'});
 if(req.user.role!=='institution')return res.status(403).json({error:'Only the institution can submit compliance evidence'});
 if(req.params.kind==='undertaking'&&item.st!=='Pending')return res.status(409).json({error:'Undertaking is not awaiting evidence'});
 if(req.params.kind==='lease'&&item.st!=='Valid')return res.status(409).json({error:'Document renewal is not awaiting submission'});
 express.raw({type:()=>true,limit:MAX_UPLOAD_BYTES})(req,res,async err=>{
  if(err)return next(err);
  let name=String(req.headers['x-file-name']||'');try{name=decodeURIComponent(name)}catch{return res.status(400).json({error:'Invalid file name'})}
  name=path.basename(name.replace(/\\/g,'/')).replace(/[\\r\\n"]/g,'').trim();
  const mime=String(req.headers['content-type']||'').split(';')[0].toLowerCase(),buf=req.body;
  if(!name||!Buffer.isBuffer(buf)||!buf.length)return res.status(400).json({error:'Select a file'});
  if(!fileTypeAllowed(name,mime,buf))return res.status(415).json({error:'Unsupported file type or invalid file signature'});
  const evidence={fileName:name,storagePath:'compliance/'+req.params.kind+'/'+item.id+'/'+crypto.randomUUID(),mimeType:mime,size:buf.length,uploadedBy:req.user.name,uploadedAt:new Date().toISOString(),checksum:crypto.createHash('sha256').update(buf).digest('hex')};
  try{if(REMOTE)await sbRequest(SUPABASE_URL+'/storage/v1/object/'+encodeURIComponent(SUPABASE_BUCKET)+'/'+sbPath(evidence.storagePath),{method:'POST',headers:{'Content-Type':mime,'x-upsert':'false'},body:buf});else{const target=path.join(UPLOAD_DIR,evidence.storagePath);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,buf,{flag:'wx',mode:0o600})}}catch(e){return next(e)}
  item.evidence=evidence;item.st=req.params.kind==='undertaking'?'Submitted':'Renewal submitted';
  log(req.user.name,req.params.kind==='undertaking'?'UNDERTAKING EVIDENCE UPLOADED':'DOCUMENT RENEWAL UPLOADED',item.id+': '+name);
  save();res.status(201).json({ok:true,evidence,status:item.st});
 });
});
app.get('/api/compliance/:kind/:id/evidence',auth,async(req,res,next)=>{
 const list=req.params.kind==='undertaking'?DB.uts:req.params.kind==='lease'?DB.docs:null;
 const item=list&&list.find(x=>x.id===req.params.id),evidence=item?.evidence;
 if(!item||!evidence||!canSee(req.user,item))return res.status(404).json({error:'Evidence not found'});
 res.set({'Content-Type':evidence.mimeType,'Content-Length':String(evidence.size),'Content-Disposition':'inline; filename="'+evidence.fileName.replace(/["\\]/g,'_')+'"'});
 try{if(REMOTE){const file=await sbRequest(SUPABASE_URL+'/storage/v1/object/'+encodeURIComponent(SUPABASE_BUCKET)+'/'+sbPath(evidence.storagePath));return res.send(Buffer.from(await file.arrayBuffer()))}fs.createReadStream(path.join(UPLOAD_DIR,evidence.storagePath)).on('error',next).pipe(res)}catch(e){next(e)}
});

const KINDS = { adv: ['apps', 'off'], ret: ['apps', 'off'], sch: ['apps', 'off'], res: ['apps', 'inst'], usub: ['uts', 'inst'], uver: ['uts', 'off'], dsub: ['docs', 'inst'], dver: ['docs', 'off'] };
app.post('/api/act', auth, (req, res) => {
  const { k, id, reason, days } = req.body || {}, u = req.user, km = KINDS[k], bad = (c, m) => res.status(c).json({ error: m });
  if (!km) return bad(400, 'Unknown action');
  const o = DB[km[0]].find(x => x.id === id);
  if (!o || !canSee(u, o)) return bad(404, 'Record not found');
  if ((km[1] === 'inst') !== (u.role === 'institution')) return bad(403, 'Your role cannot perform this action');
  const previousStatus = km[0] === 'apps' ? appStatus(o) : '';
  const stage = km[0] === 'apps' ? L.PATHS[o.path][o.i] : null;
  if (k === 'adv') {
    if (o.done || o.ret) return bad(409, 'Application is not in a processable state');
    if (o.i < L.PATHS[o.path].length - 1) { o.i++; o.since = DB.off; log(u.name, 'STAGE COMPLETE', `${id}: ${stage} → ${L.PATHS[o.path][o.i]}`); }
    else { o.done = true; log(u.name, 'FINAL STAGE COMPLETE', `${id}: ${stage} completed; forwarded to competent authority for decision`); }
  } else if (k === 'ret') {
    const r = String(reason || '').trim().slice(0, 300);
    if (!r) return bad(400, 'Reason is mandatory'); if (o.done || o.ret) return bad(409, 'Application cannot be returned now');
    o.ret = r; log(u.name, 'RETURNED', `${id} at ${stage}: ${r}`);
  } else if (k === 'res') {
    if (!o.ret) return bad(409, 'Nothing to resubmit'); log(u.name, 'RESUBMITTED', `${id}: replied to "${o.ret}"`); o.ret = null; o.state = 'In Review'; o.since = DB.off;
  } else if (k === 'sch') {
    const d = Number(days); if (!Number.isInteger(d) || d < 0 || d > 365) return bad(400, 'Days must be 0–365');
    if (o.done || o.ret || stage !== 'EVC') return bad(409, 'Application is not in the EVC stage');
    o.sched = DB.off + d; log(u.name, 'EVC SCHEDULED', `${id} on ${L.dt(Date.parse('2026-10-30T00:00:00'), o.sched)}`);
  } else if (k === 'usub') { if (o.st !== 'Pending') return bad(409, 'Already submitted'); o.st = 'Submitted'; log(u.name, 'UNDERTAKING EVIDENCE SUBMITTED', `${id}: ${o.cond}`); }
  else if (k === 'uver') { if (o.st !== 'Submitted'||!o.evidence) return bad(409, 'No uploaded evidence to verify'); o.st = 'Verified'; o.verifiedBy=u.name;o.verifiedAt=new Date().toISOString();log(u.name, 'UNDERTAKING VERIFIED', `${id}: ${o.cond}`); }
  else if (k === 'dsub') { if (o.st !== 'Valid') return bad(409, 'Renewal already submitted'); o.st = 'Renewal submitted'; log(u.name, 'RENEWAL SUBMITTED', `${id}: ${o.name}`); }
  else if (k === 'dver') { if (o.st !== 'Renewal submitted'||!o.evidence) return bad(409, 'No uploaded renewal to verify'); o.st = 'Valid'; o.exp = Math.max(o.exp, DB.off) + 365;o.verifiedBy=u.name;o.verifiedAt=new Date().toISOString();o.evidence=null;log(u.name, 'RENEWAL VERIFIED', `${id}: valid for another year`); }
  if (km[0] === 'apps') addAppHistory(o, u, ({ adv: 'Stage completed', ret: 'Returned for clarification', res: 'Resubmitted', sch: 'EVC scheduled' })[k] || k, reason || '', previousStatus, appStatus(o));
  sweep(); save(); res.json(view(u));
});

/* demo / admin endpoints (bureau only) */
app.post('/api/tick', auth, bureau, (req, res) => {
  const n = Number(req.body?.n); if (!Number.isInteger(n) || n < 1 || n > 60) return res.status(400).json({ error: 'n must be 1–60' });
  DB.off += n; log(req.user.name, 'WORKFLOW DATE ADVANCED', `+${n} day(s)`); sweep(); save(); res.json(view(req.user));
});
app.post('/api/reset', auth, bureau, (req, res) => {
  Object.assign(DB, seedData()); log(req.user.name, 'PLATFORM DATA RESTORED', 'Configured initial records restored'); sweep(); save(); res.json(view(req.user));
});
app.post('/api/users/:id/approve',auth,bureau,(req,res)=>{
 const u=DB.users.find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:'Registration not found'});
 if(u.status!=='pending')return res.status(409).json({error:'This account is no longer pending'});
 u.status=req.body?.decision==='reject'?'rejected':'active';u.reviewedAt=new Date().toISOString();u.reviewedBy=req.user.name;
 log(req.user.name,u.status==='active'?'REGISTRATION APPROVED':'REGISTRATION REJECTED',u.email+' ('+u.role+')');
 save();res.json({ok:true,status:u.status});
});

app.post('/api/users', auth, bureau, (req, res) => {
  const { email, name, role, reg, inst, password } = req.body || {}, e = String(email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(e) || !name || !['bureau', 'regional', 'institution'].includes(role) || String(password || '').length < 8) return res.status(400).json({ error: 'email, name, role and password (min 8 chars) required' });
  if (role !== 'bureau' && !reg) return res.status(400).json({ error: 'reg required' }); if (role === 'institution' && !inst) return res.status(400).json({ error: 'inst required' });
  if (DB.users.some(x => x.email === e)) return res.status(409).json({ error: 'Email already exists' });
  DB.users.push({ id: crypto.randomUUID(), email: e, name: String(name).slice(0, 80), role, reg: reg || null, inst: inst || null, pw: hashPw(password) });
  log(req.user.name, 'USER CREATED', `${e} (${role})`); save(); res.json({ ok: true });
});
app.post('/api/password', auth, (req, res) => {
  const { old, next } = req.body || {};
  if (typeof old !== 'string' || !checkPw(old, req.user.pw)) return res.status(401).json({ error: 'Current password is wrong' });
  if (typeof next !== 'string' || next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  req.user.pw = hashPw(next); log(req.user.name, 'PASSWORD CHANGED', req.user.email); save(); res.json({ ok: true });
});

app.get('/applications/:id', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use('/api', (_, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => { console.error(err.message); res.status(err.status || 400).json({ error: err.status === 413 ? `Maximum file size is ${MAX_UPLOAD_LABEL}` : 'Bad request' }); });
if(require.main===module)app.listen(PORT,()=>console.log(`AICTE Nigrani running on http://localhost:${PORT}`));
module.exports=app;
