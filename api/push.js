// BOUBA STORE : envoi des alertes (Vercel, gratuit) - VERSION CORRIGEE
const crypto=require('crypto');
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const PID='project-f4477c80-7c55-4db7-b2e';
const b64=b=>Buffer.from(b).toString('base64url');
let cache=null;
async function tok(){
 if(cache&&cache.exp>Date.now()+60000)return cache.t;
 const sa=JSON.parse(process.env.FIREBASE_SA);
 const now=Math.floor(Date.now()/1000);
 const h=b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const c=b64(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const sig=crypto.createSign('RSA-SHA256').update(h+'.'+c).sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+h+'.'+c+'.'+sig});
 const j=await r.json();
 if(!j.access_token)throw new Error('auth');
 cache={t:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};
 return cache.t;
}
async function db(method,path,o={}){
 const t=await tok();
 const h={};
 if(o.etag)h['X-Firebase-ETag']='true';
 if(o.match)h['if-match']=o.match;
 const r=await fetch(DB+'/'+path+'.json?'+(o.q?o.q+'&':'')+'access_token='+t,{method,headers:h,body:o.body===undefined?undefined:JSON.stringify(o.body)});
 return{status:r.status,etag:r.headers.get('etag'),data:r.status===412?null:await r.json().catch(()=>null)};
}
const msg=(tk,title,body)=>({message:{token:tk,data:{title,body,url:'./',tag:'bouba-new'},webpush:{headers:{Urgency:'high',TTL:'86400'}}}});
const getTk=v=>(v&&v.t)||v;
const uniq=T=>{const s=new Set();return T.filter(([id,v])=>{const t=getTk(v);if(!t||s.has(t))return false;s.add(t);return true})};
const money=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' F';

async function subscribe(t,dev){
 t=String(t||'');
 if(t.length<100||t.length>400||!/^[\w:\-]+$/.test(t))return{ok:false};
 const d=String(dev||'');
 const key=/^[\w-]{8,64}$/.test(d)?'d_'+d:crypto.createHash('sha1').update(t).digest('hex');
 await db('PUT','pushTokens/'+key,{body:{t,ts:Date.now()}});
 return{ok:true};
}

async function sendAll(title,body){
 const T=uniq(Object.entries((await db('GET','pushTokens')).data||{}));
 if(!T.length)return{sent:0,total:0,reason:'Aucun client abonne - personne n a clique sur Activer les notifications'};
 const at=await tok();
 let ok=0; const errors=[];
 for(let i=0;i<T.length;i+=20){
  await Promise.all(T.slice(i,i+20).map(async([id,v])=>{
   const tk=getTk(v);
   const r=await fetch('https://fcm.googleapis.com/v1/projects/'+PID+'/messages:send',{method:'POST',headers:{authorization:'Bearer '+at,'content-type':'application/json'},body:JSON.stringify(msg(tk,title,body))});
   if(r.ok)ok++;
   else if(r.status===404||r.status===400){
    const e=JSON.stringify(await r.json().catch(()=>({})));
    if(/UNREGISTERED|NOT_FOUND/.test(e))await db('DELETE','pushTokens/'+id);
    else errors.push(e.slice(0,120));
   } else errors.push('HTTP '+r.status);
  }));
 }
 return{sent:ok,total:T.length,errors:errors.slice(0,3)};
}

async function notify(){
 const m=await db('GET','pushMeta/last',{etag:1});
 const last=m.data;
 if(typeof last!=='number'){
  const q=await db('GET','products',{q:'orderBy="date"&limitToLast=1'});
  const mx=Math.max(0,...Object.values(q.data||{}).map(p=>+(p&&p.date)||0));
  await db('PUT','pushMeta/last',{body:mx,match:m.etag});
  return{init:true,sent:0};
 }
 const q=await db('GET','products',{q:'orderBy="date"&startAt='+(last+1)});
 const all=Object.values(q.data||{}).filter(p=>p&&(+p.date)>last);
 if(!all.length)return{sent:0,reason:'Aucun nouvel article depuis le dernier envoi'};
 const mx=Math.max(...all.map(p=>+p.date));
 const w=await db('PUT','pushMeta/last',{body:mx,match:m.etag});
 if(w.status===412)return{skip:true};
 const L=all.filter(p=>p.name&&p.stock!==false);
 if(!L.length)return{sent:0};
 const title=L.length>1?'🆕 '+L.length+' nouveaux articles':'🆕 Nouvel article';
 const body=L.slice(0,3).map(p=>p.name+(p.price?' — '+money(p.price):'')).join('\n')+(L.length>3?'\n…':'');
 return await sendAll(title,body);
}

module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Access-Control-Allow-Headers','content-type');
 res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(204).end();
 try{
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  // CORRECTION 1 : le bouton peut envoyer n'importe quel nom d'action
  const act=String(b.act||b.action||b.type||'').toLowerCase();
  const isSend=['new','send','sendall','send-all','broadcast','notify','notifyclients','notify-clients','clients','push','manual'].includes(act);
  if(isSend){
   const g=await db('GET','pushMeta/lastNew',{etag:1});
   if(typeof g.data==='number'&&Date.now()-g.data<60000)return res.status(200).json({skip:true,reason:'Double-clic bloque 60s, reessaie dans 1 min'});
   const w=await db('PUT','pushMeta/lastNew',{body:Date.now(),match:g.etag});
   if(w.status===412)return res.status(200).json({skip:true});
   // CORRECTION 2 : accepte title/body/message/text, avec defaut si bouton sans texte
   const t=String(b.title||b.titre||'🆕 Nouvel article chez BOUBA STOR').slice(0,60);
   const x=String(b.body||b.message||b.text||b.texte||'Découvre les nouveautés — livraison 24H à Abidjan !').slice(0,120);
   const out=await sendAll(t,x);
   return res.status(200).json(out);
  }
  if(act==='sub'||act==='subscribe')return res.status(200).json(await subscribe(b.token,b.dev));
  // Sans act : c'est l'envoi auto apres ajout d'article, pas le bouton manuel
  return res.status(200).json(await notify());
 }catch(e){console.error(e);res.status(500).json({ok:false,error:String(e.message||e)})}
};
  
