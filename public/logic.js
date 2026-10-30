// Shared by server (authoritative) and browser (display). UMD-style.
(function(){
const SLA={'Scrutiny':15,'EVC':30,'SAC/SHC':10};
const PATHS={'Only Scrutiny':['Scrutiny'],'Scrutiny + EVC':['Scrutiny','EVC'],'Only EVC':['EVC'],'Only SAC/SHC':['SAC/SHC'],'Scrutiny + SAC/SHC':['Scrutiny','SAC/SHC'],'EVC + SAC/SHC':['EVC','SAC/SHC'],'Scrutiny + EVC + SAC/SHC':['Scrutiny','EVC','SAC/SHC']};
const dt=(base,n)=>new Date(base+n*864e5).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
function lvl(left){if(left>14)return null;if(left>=0)return'Upcoming';const d=-left;return d<=7?'L1 · Regional Officer':d<=15?'L2 · Regional Director':'L3 · Bureau Head'}
function alerts(S){const A=[],add=(type,ref,x,left,msg,thr)=>{const l=lvl(left);if(l&&left<=thr)A.push({key:type+ref,type,ref,inst:x.inst,reg:x.reg,left,lv:l,msg})};
S.apps.forEach(a=>{if(a.done||a.ret)return;const s=PATHS[a.path][a.i],left=SLA[s]-(S.off-a.since),ev=s==='EVC'&&!a.sched;add(ev?'EVC':'Pendency',a.id,a,left,`${a.id} (${a.inst}) at ${s}${ev?' – EVC not scheduled':''}: ${left<0?-left+' day(s) beyond':left+' day(s) left in'} SLA`,5)});
S.uts.forEach(u=>{if(u.st==='Pending'){const l=u.due-S.off;add('Undertaking',u.id,u,l,`${u.id} (${u.inst}) – ${u.cond}: ${l<0?-l+' day(s) overdue':l+' day(s) to due date'}`,14)}});
S.docs.forEach(d=>{if(d.st==='Valid'){const l=d.exp-S.off;add('Document',d.id,d,l,`${d.id} (${d.inst}) – ${d.name} ${l<0?'expired '+-l+' day(s) ago':'expires in '+l+' day(s)'}`,14)}});
return A.sort((a,b)=>a.left-b.left)}
function fnv(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return(x>>>0).toString(16).padStart(8,'0')}
const entryHash=(p,r)=>fnv(p+r.t+r.actor+r.act+r.det);
function verifyChain(audit){let p='00000000';for(const r of audit){if(entryHash(p,r)!==r.h)return false;p=r.h}return true}
const L={SLA,PATHS,lvl,alerts,entryHash,verifyChain,dt};
if(typeof module!=='undefined')module.exports=L;else window.LOGIC=L;
})();
