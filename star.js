// BOUBA STORE – Super Star : artistes, œuvres, achats vérifiés côté serveur (Vercel).
// Variables Vercel nécessaires : FIREBASE_SA (déjà utilisée par push.js) et ADMIN_CODE.
const crypto=require('crypto');
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const b64=b=>Buffer.from(b).toString('base64url');
let cache=null;
async function tok(){
 if(cache&&cache.exp>Date.now()+60000)return cache.t;
 const sa=JSON.parse(process.env.FIREBASE_SA);
 const now=Math.floor(Date.now()/1000);
 const h=b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const c=b64(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const sig=crypto.createSign('RSA-SHA256').update(h+'.'+c).sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+h+'.'+c+'.'+sig});
 const j=await r.json();
 if(!j.access_token)throw new Error('auth');
 cache={t:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};
 return cache.t;
}
async function db(method,path,body){
 const t=await tok();
 const r=await fetch(DB+'/'+path+'.json?access_token='+t,{method,body:body===undefined?undefined:JSON.stringify(body)});
 return r.json().catch(()=>null);
}
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const eq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const rid=()=>Date.now().toString(36)+crypto.randomBytes(2).toString('hex');
const str=(v,n)=>String(v==null?'':v).trim().slice(0,n);
const img=v=>{v=String(v||'');return (/^data:image\/(png|jpeg|webp|gif);base64,/.test(v)&&v.length<=140000)?v:''};
const https=v=>{v=String(v||'').trim();return (/^https:\/\/[^\s<>"']+$/.test(v)&&v.length<=500)?v:''};
const ICON={music:'🎵',clip:'🎬',album:'💿',photo:'📸'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function artistOk(cid,t){
 if(!/^c[a-z0-9]{6,24}$/.test(String(cid||''))||!t)return null;
 const s=await db('GET','artistsec/'+cid);
 if(!s||!eq(s.th,sha(t))){await sleep(600);return null}
 return s;
}
async function adminOk(code){
 const real=String(process.env.ADMIN_CODE||'');
 if(!real||!eq(sha(code),sha(real))){await sleep(700);return false}
 return true;
}

const A={
 async register(d){
  const cid=String(d.cid||'');
  if(!/^c[a-z0-9]{6,24}$/.test(cid))return{ok:false,err:'Identifiant invalide : ouvrez d\'abord BOUBA VIBES.'};
  const name=str(d.name,40),pn=String(d.payNumber||'').replace(/\D/g,''),pm=d.method==='Orange Money'?'Orange Money':'Wave';
  if(name.length<2)return{ok:false,err:'Nom de scène trop court.'};
  if(pn.length<8||pn.length>15)return{ok:false,err:'Numéro Wave / Orange Money invalide.'};
  if(await db('GET','artists/'+cid))return{ok:false,err:'Vous êtes déjà artiste.'};
  const t=crypto.randomBytes(24).toString('hex');
  await db('PUT','artistsec/'+cid,{th:sha(t),pm:pm,pn:pn,phone:str(d.phone,20),date:Date.now()});
  await db('PUT','artists/'+cid,{cid:cid,name:name,bio:str(d.bio,200),city:str(d.city,40),img:img(d.img),date:Date.now()});
  return{ok:true,tok:t};
 },
 async update(d){
  if(!await artistOk(d.cid,d.tok))return{ok:false,err:'Accès refusé.'};
  const p={};
  if(d.name!=null&&str(d.name,40).length>=2)p.name=str(d.name,40);
  if(d.bio!=null)p.bio=str(d.bio,200);
  if(d.city!=null)p.city=str(d.city,40);
  if(img(d.img))p.img=img(d.img);
  await db('PATCH','artists/'+d.cid,p);
  const pn=String(d.payNumber||'').replace(/\D/g,'');
  if(pn.length>=8&&pn.length<=15)await db('PATCH','artistsec/'+d.cid,{pn:pn,pm:d.method==='Orange Money'?'Orange Money':'Wave'});
  return{ok:true};
 },
 async publish(d){
  if(!await artistOk(d.cid,d.tok))return{ok:false,err:'Accès refusé.'};
  const type=ICON[d.type]?d.type:'',title=str(d.title,80),price=Math.round(+d.price||0),url=https(d.url),pv=https(d.preview);
  if(!type)return{ok:false,err:'Type invalide.'};
  if(title.length<2)return{ok:false,err:'Titre trop court.'};
  if(!(price===0||(price>=100&&price<=500000)))return{ok:false,err:'Prix : 0 (gratuit) ou entre 100 et 500 000 F.'};
  if(!url)return{ok:false,err:'Le lien de l\'œuvre doit commencer par https://'};
  const ar=await db('GET','artists/'+d.cid);if(!ar)return{ok:false,err:'Artiste introuvable.'};
  const id=rid(),cover=img(d.cover),now=Date.now();
  const pub={id:id,cid:d.cid,an:ar.name,av:ar.img||'',type:type,title:title,desc:str(d.desc,300),cover:cover,price:price,date:now,pv:pv};
  if(price===0)pub.url=url;else await db('PUT','workfiles/'+id,{url:url,cid:d.cid});
  await db('PUT','works/'+id,pub);
  await db('PUT','posts/'+id,{id:id,by:d.cid,name:ar.name,date:now,av:ar.img||'',text:ICON[type]+' '+title+(price?' • '+price+' F':' • Gratuit')+(pub.desc?'\n'+pub.desc:''),img:cover,work:id});
  return{ok:true,id:id};
 },
 async remove(d){
  if(!await artistOk(d.cid,d.tok))return{ok:false,err:'Accès refusé.'};
  const w=await db('GET','works/'+d.id);
  if(!w||w.cid!==d.cid)return{ok:false,err:'Œuvre introuvable.'};
  await Promise.all([db('DELETE','works/'+d.id),db('DELETE','workfiles/'+d.id),db('DELETE','posts/'+d.id)]);
  return{ok:true};
 },
 async buy(d){
  const w=await db('GET','works/'+str(d.work,30));
  if(!w)return{ok:false,err:'Œuvre introuvable.'};
  if(!w.price)return{ok:true,free:true,url:w.url||''};
  const oid='SS'+crypto.randomBytes(3).toString('hex').toUpperCase(),bt=crypto.randomBytes(16).toString('hex');
  const com=Math.round(w.price*0.10);
  await db('PUT','starorders/'+oid,{oid:oid,work:w.id,cid:w.cid,title:w.title,an:w.an,price:w.price,com:com,share:w.price-com,buyer:{name:str(d.name,40),phone:str(d.phone,20),cid:str(d.bcid,30)},bth:sha(bt),status:'pending',date:Date.now()});
  await db('PUT','starpending/'+oid,true);
  return{ok:true,oid:oid,btok:bt,price:w.price,title:w.title,an:w.an};
 },
 async status(d){
  const o=await db('GET','starorders/'+str(d.oid,12));
  if(!o||!eq(o.bth,sha(d.btok)))return{ok:false};
  return{ok:true,status:o.status};
 },
 async get(d){
  const o=await db('GET','starorders/'+str(d.oid,12));
  if(!o||!eq(o.bth,sha(d.btok)))return{ok:false,err:'Commande introuvable.'};
  if(o.status!=='paid')return{ok:false,err:'Paiement pas encore validé.'};
  const f=await db('GET','workfiles/'+o.work);
  if(!f||!f.url)return{ok:false,err:'Fichier indisponible.'};
  return{ok:true,url:f.url,title:o.title};
 },
 async me(d){
  if(!await artistOk(d.cid,d.tok))return{ok:false,err:'Accès refusé.'};
  const b=(await db('GET','starbal/'+d.cid))||{},o=(await db('GET','artistorders/'+d.cid))||{};
  const list=Object.values(o).sort((a,c)=>c.date-a.date).slice(0,15);
  return{ok:true,sales:b.sales||0,earned:b.earned||0,paid:b.paid||0,due:Math.max(0,(b.earned||0)-(b.paid||0)),orders:list};
 },
 async admin_overview(d){
  if(!await adminOk(d.code))return{ok:false,err:'Code incorrect.'};
  const pend=Object.keys((await db('GET','starpending'))||{}),orders=[];
  for(const id of pend.slice(0,30)){const o=await db('GET','starorders/'+id);if(o)orders.push(o)}
  const bal=(await db('GET','starbal'))||{},sec=(await db('GET','artistsec'))||{},ar=(await db('GET','artists'))||{},arts=[];
  Object.keys(bal).forEach(c=>{const b=bal[c],s=sec[c]||{};arts.push({cid:c,name:(ar[c]||{}).name||c,sales:b.sales||0,earned:b.earned||0,paid:b.paid||0,due:Math.max(0,(b.earned||0)-(b.paid||0)),pm:s.pm||'',pn:s.pn||''})});
  const st=(await db('GET','starstats'))||{};
  return{ok:true,orders:orders.sort((a,c)=>c.date-a.date),artists:arts,commission:st.commission||0,revenue:st.revenue||0};
 },
 async admin_validate(d){
  if(!await adminOk(d.code))return{ok:false,err:'Code incorrect.'};
  const o=await db('GET','starorders/'+str(d.oid,12));
  if(!o||o.status!=='pending')return{ok:false,err:'Commande déjà traitée.'};
  await db('PATCH','starorders/'+o.oid,{status:'paid',paidAt:Date.now()});
  await db('DELETE','starpending/'+o.oid);
  const b=(await db('GET','starbal/'+o.cid))||{};
  await db('PUT','starbal/'+o.cid,{sales:(b.sales||0)+1,earned:(b.earned||0)+o.share,paid:b.paid||0});
  await db('PUT','artistorders/'+o.cid+'/'+o.oid,{title:o.title,price:o.price,share:o.share,date:Date.now(),buyer:String((o.buyer&&o.buyer.name)||'').split(' ')[0]});
  const s=(await db('GET','starstats'))||{};
  await db('PUT','starstats',{commission:(s.commission||0)+o.com,revenue:(s.revenue||0)+o.price});
  return{ok:true};
 },
 async admin_reject(d){
  if(!await adminOk(d.code))return{ok:false,err:'Code incorrect.'};
  await db('PATCH','starorders/'+str(d.oid,12),{status:'rejected'});await db('DELETE','starpending/'+str(d.oid,12));
  return{ok:true};
 },
 async admin_payout(d){
  if(!await adminOk(d.code))return{ok:false,err:'Code incorrect.'};
  const a=Math.round(+d.amount||0);if(!(a>0))return{ok:false,err:'Montant invalide.'};
  const c=str(d.cid,30),b=(await db('GET','starbal/'+c))||{};
  await db('PUT','starbal/'+c,{sales:b.sales||0,earned:b.earned||0,paid:(b.paid||0)+a});
  await db('PUT','starpayouts/'+c+'/'+rid(),{amount:a,date:Date.now()});
  return{ok:true};
 }
};

module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.status(405).json({ok:false});return}
 let b=req.body;
 if(typeof b==='string'){try{b=JSON.parse(b)}catch(e){b={}}}
 b=b||{};
 const f=A[String(b.a||'')];
 if(!f){res.status(400).json({ok:false,err:'Action inconnue.'});return}
 try{res.status(200).json(await f(b))}
 catch(e){res.status(200).json({ok:false,err:'Erreur du serveur. Vérifiez FIREBASE_SA et ADMIN_CODE sur Vercel.'})}
};
