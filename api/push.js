// BOUBA STORE : notifs auto articles + boutiques (Vercel) - V3 : collections = articles + boutiques
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
const msg=(tk,title,body)=>({message:{token:tk,data:{title,[STRIPPED]
const getTk=v=>(v&&v.t)||v;
const uniq=T=>{const s=new Set();return T.filter(([id,v])=>{const t=getTk(v);if(!t||s.has(t))return false;s.add(t);return true})};
const money=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' F';
// date peut etre en secondes ou millisecondes -> on normalise en ms
const normDate=v=>{let n=+(v||0); if(n>0&&n<10000000000)n*=1000; return n;};

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
 if(!T.length)return{sent:0,total:0,reason:'Aucun client abonne'};
 const at=await tok();
 let ok=0;
 for(let i=0;i<T.length;i+=20){
  await Promise.all(T.slice(i,i+20).map(async([id,v])=>{
   const tk=getTk(v);
   const r=await fetch('https://fcm.googleapis.com/v1/projects/'+PID+'/messages:send',{method:'POST',headers:{authorization:'Bearer '+at,'content-type':'application/json'},body:JSON.stringify(msg(tk,title,body))});
   if(r.ok)ok++;
   else if(r.status===404||r.status===400){
    const e=JSON.stringify(await r.json().catch(()=>({})));
    if(/UNREGISTERED|NOT_FOUND/.test(e))await db('DELETE','pushTokens/'+id);
   }
  }));
 }
 return{sent:ok,total:T.length};
}
// Verifie les nouveautes dans UNE collection (products OU shops/boutiques)
async function checkCollection(coll,metaKey){
 const m=await db('GET','pushMeta/'+metaKey,{etag:1});
 let last=m.data;
 if(typeof last!=='number'){
  const q=await db('GET',coll,{q:'orderBy="date"&limitToLast=1'});
  const mx=Math.max(0,...Object.values(q.data||{}).map(p=>normDate(p&&(p.date||p.createdAt||p.ts))));
  await db('PUT','pushMeta/'+metaKey,{body:mx,match:m.etag});
  return{items:[],init:true};
 }
 const q=await db('GET',coll,{q:'orderBy="date"&startAt='+(last+1)});
 // Fallback : si date en secondes dans la base, startAt en ms ne trouve rien -> on relit tout et on filtre en JS
 let all=Object.values(q.data||{}).filter(p=>p&&normDate(p.date||p.createdAt||p.ts)>last);
 if(!all.length){
  const q2=await db('GET',coll);
  all=Object.values(q2.data||{}).filter(p=>p&&normDate(p.date||p.createdAt||p.ts)>last);
 }
 if(!all.length)return{items:[]};
 const mx=Math.max(...all.map(p=>normDate(p.date||p.createdAt||p.ts)));
 const w=await db('PUT','pushMeta/'+metaKey,{body:mx,match:m.etag});
 if(w.status===412)return{items:[],skip:true};
 return{items:all};
}
async function notify(){
 const out={sent:0,products:0,shops:0};
 // 1) NOUVEAUX ARTICLES
 const P=await checkCollection('articles','lastArticle');
 const L=P.items.filter(p=>p.name&&p.stock!==false);
 if(L.length){
  const title=L.length>1?'🆕 '+L.length+' nouveaux articles':'🆕 Nouvel article';
  const body=L.slice(0,3).map(p=>p.name+(p.price?' — '+money(p.price):'')).join('\n');
  const r=await sendAll(title,body);
  out.sent+=r.sent; out.products=L.length;
 }
 // 2) NOUVELLES BOUTIQUES - on essaie les 3 noms possibles de collection
 let shops=[];
 for(const coll of ['boutiques']){
  const S=await checkCollection(coll,'lastBoutique');
  shops.push(...S.items);
 }
 shops=shops.filter(s=>s&&(s.name||s.nom||s.title||s.shopName));
 if(shops.length){
  const nom=shops[0].name||shops[0].nom||shops[0].title||shops[0].shopName;
  const r=await sendAll('🏪 Nouvelle boutique : '+String(nom).slice(0,40),'Découvre la nouvelle boutique sur BOUBA STOR !');
  out.sent+=r.sent; out.shops=shops.length;
 }
 return out;
}
module.exports=async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Access-Control-Allow-Headers','content-type');
 res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
 if(req.method==='OPTIONS')return res.status(204).end();
 try{
  const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
  const act=String(b.act||b.action||b.type||'').toLowerCase();
  // ENVOI MANUEL (bouton vert) : ne touche PLUS aux reperes auto
  const isSend=['new','send','sendall','broadcast','notify','push','manual'].includes(act);
  if(isSend){
   const g=await db('GET','pushMeta/lastNew',{etag:1});
   if(typeof g.data==='number'&&Date.now()-g.data<60000)return res.status(200).json({skip:true});
   const w=await db('PUT','pushMeta/lastNew',{body:Date.now(),match:g.etag});
   if(w.status===412)return res.status(200).json({skip:true});
   const t=String(b.title||b.titre||'🆕 Nouvel article chez BOUBA STOR').slice(0,60);
   const x=String(b.body||b.message||b.text||'Découvre les nouveautés — livraison 24H à Abidjan !').slice(0,120);
   return res.status(200).json(await sendAll(t,x));
  }
  if(act==='sub'||act==='subscribe')return res.status(200).json(await subscribe(b.token,b.dev));
  // AUTO : appele apres ajout article OU boutique (voir code a coller ci-dessous)
  return res.status(200).json(await notify());
 }catch(e){console.error(e);res.status(500).json({ok:false,error:String(e.message||e)})}
};
     
