// BOUBA STORE : publication automatique d'un nouvel article sur Facebook (page) et/ou vers un webhook (Make, Zapier…).
// Variables Vercel : FIREBASE_SA (déjà là) ; pour Facebook : FB_PAGE_ID + FB_PAGE_TOKEN ; facultatif : SOCIAL_WEBHOOK_URL ; ADMIN_CODE pour « forcer ».
const crypto=require('crypto');
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const b64=b=>Buffer.from(b).toString('base64url');
let cache=null;
async function tok(){
 if(cache&&cache.exp>Date.now()+60000)return cache.t;
 const sa=JSON.parse(process.env.FIREBASE_SA),now=Math.floor(Date.now()/1000);
 const h=b64(JSON.stringify({alg:'RS256',typ:'JWT'})),c=b64(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const sig=crypto.createSign('RSA-SHA256').update(h+'.'+c).sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+h+'.'+c+'.'+sig});
 const j=await r.json();if(!j.access_token)throw new Error('auth');
 cache={t:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};return cache.t;
}
async function db(method,path,body){
 const t=await tok();
 const r=await fetch(DB+'/'+path+'.json?access_token='+t,{method,body:body===undefined?undefined:JSON.stringify(body)});
 return r.json().catch(()=>null);
}
const sha=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
const eq=(a,b)=>{a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.status(405).json({ok:false});return}
 let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch(e){b={}}}b=b||{};
 try{
  const id=String(b.id||'').replace(/[^\w-]/g,'').slice(0,40);
  if(!id){res.status(200).json({ok:false,err:'Article manquant.'});return}
  const PAGE=process.env.FB_PAGE_ID,RAW=process.env.FB_PAGE_TOKEN,HOOK=process.env.SOCIAL_WEBHOOK_URL;
  let TOKEN=RAW;
  const IGID=process.env.IG_USER_ID,TGT=process.env.TG_BOT_TOKEN,TGC=process.env.TG_CHAT_ID;
  const XK=process.env.X_API_KEY&&process.env.X_API_SECRET&&process.env.X_ACCESS_TOKEN&&process.env.X_ACCESS_SECRET;
  if(!(PAGE&&TOKEN)&&!(TOKEN&&IGID)&&!(TGT&&TGC)&&!XK&&!HOOK){res.status(200).json({ok:false,err:'non configuré',configured:false});return}
  /* jeton d'utilisateur système -> jeton de Page (permanent), obtenu automatiquement */
  if(PAGE&&RAW){try{const g=await (await fetch('https://graph.facebook.com/v25.0/'+PAGE+'?fields=access_token&access_token='+encodeURIComponent(RAW))).json();if(g&&g.access_token)TOKEN=g.access_token}catch(e){}}
  let WHO='';if(TOKEN){try{const w=await (await fetch('https://graph.facebook.com/v25.0/me?fields=id,name&access_token='+encodeURIComponent(TOKEN))).json();WHO=w&&w.name?w.name+' '+w.id:(w&&w.error?'invalide':'?')}catch(e){WHO='?'}}
  if(b.force){
   const real=String(process.env.ADMIN_CODE||'');
   if(!real||!eq(sha(b.code||''),sha(real))){await sleep(700);res.status(200).json({ok:false,err:'Code administrateur incorrect.'});return}
  }else{
   if(await db('GET','socialposted/'+id)){res.status(200).json({ok:true,already:true});return}
   const last=+(await db('GET','socialrate'))||0;
   if(Date.now()-last<3000){res.status(200).json({ok:false,err:'Trop de demandes, réessayez.'});return}
  }
  await db('PUT','socialrate',Date.now());
  let p=null;
  for(let i=0;i<4;i++){p=await db('GET','products/'+id);if(p&&p.name)break;await sleep(1200)}
  if(!p||!p.name){res.status(200).json({ok:false,err:'Article introuvable.'});return}
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app').replace(/[^\w.:-]/g,'');
  const site='https://'+host,link=site+'/api/p?id='+id;
  const msg='🆕 '+p.name+'\n💰 '+Number(p.price||0).toLocaleString('fr-FR')+' F'+(p.cat?' • '+p.cat:'')+'\n🛒 Commandez sur BOUBA STORE : '+site+'\n💬 WhatsApp : +225 07 87 61 97 17';
  const out={};
  if(PAGE&&TOKEN){
   try{
    const m=/^data:(image\/[a-z]+);base64,([\s\S]+)$/.exec(String(p.img||''));let r;
    if(m){const fd=new FormData();fd.append('source',new Blob([Buffer.from(m[2],'base64')],{type:m[1]}),'article.jpg');fd.append('caption',msg);fd.append('access_token',TOKEN);r=await fetch('https://graph.facebook.com/v25.0/'+PAGE+'/photos',{method:'POST',body:fd})}
    else r=await fetch('https://graph.facebook.com/v25.0/'+PAGE+'/feed',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:msg,link:site,access_token:TOKEN})});
    const j=await r.json();
    out.facebook=(j.id||j.post_id)?{ok:true,id:j.post_id||j.id}:{ok:false,err:((j.error&&j.error.code===190?'Jeton Facebook expiré : générez un jeton de Page permanent.':(j.error&&j.error.message))||'Erreur Facebook')+' [jeton utilisé : '+WHO+(TOKEN===RAW?' — jeton brut':' — jeton de Page')+']'};
   }catch(e){out.facebook={ok:false,err:'Facebook injoignable'}}
  }
  const imgUrl=site+'/api/img?id='+id,mm=/^data:(image\/[a-z]+);base64,([\s\S]+)$/.exec(String(p.img||''));
  if(TOKEN&&IGID){
   try{
    const c=await (await fetch('https://graph.facebook.com/v25.0/'+IGID+'/media',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({image_url:imgUrl,caption:msg+'\n🔗 '+link,access_token:TOKEN})})).json();
    if(!c.id)out.instagram={ok:false,err:(c.error&&c.error.code===190?'Jeton expiré':(c.error&&c.error.message))||'Erreur Instagram'};
    else{
     for(let i=0;i<4;i++){const st=await (await fetch('https://graph.facebook.com/v25.0/'+c.id+'?fields=status_code&access_token='+TOKEN)).json();if(st.status_code==='FINISHED'||st.error)break;await sleep(1500)}
     const pb=await (await fetch('https://graph.facebook.com/v25.0/'+IGID+'/media_publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({creation_id:c.id,access_token:TOKEN})})).json();
     out.instagram=pb.id?{ok:true,id:pb.id}:{ok:false,err:(pb.error&&pb.error.message)||'Erreur Instagram'};
    }
   }catch(e){out.instagram={ok:false,err:'Instagram injoignable'}}
  }
  if(TGT&&TGC){
   try{
    const cap=(msg+'\n🔗 '+link).slice(0,1000);let r;
    if(mm){const fd=new FormData();fd.append('chat_id',TGC);fd.append('caption',cap);fd.append('photo',new Blob([Buffer.from(mm[2],'base64')],{type:mm[1]}),'article.jpg');r=await fetch('https://api.telegram.org/bot'+TGT+'/sendPhoto',{method:'POST',body:fd})}
    else r=await fetch('https://api.telegram.org/bot'+TGT+'/sendMessage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:TGC,text:cap})});
    const j=await r.json();out.telegram=j.ok?{ok:true}:{ok:false,err:j.description||'Erreur Telegram'};
   }catch(e){out.telegram={ok:false,err:'Telegram injoignable'}}
  }
  if(XK){
   try{
    const url='https://api.twitter.com/2/tweets',cr=require('crypto');
    const enc=x=>encodeURIComponent(x).replace(/[!*'()]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
    const o={oauth_consumer_key:process.env.X_API_KEY,oauth_nonce:cr.randomBytes(12).toString('hex'),oauth_signature_method:'HMAC-SHA1',oauth_timestamp:String(Math.floor(Date.now()/1000)),oauth_token:process.env.X_ACCESS_TOKEN,oauth_version:'1.0'};
    const base=['POST',enc(url),enc(Object.keys(o).sort().map(k=>enc(k)+'='+enc(o[k])).join('&'))].join('&');
    o.oauth_signature=cr.createHmac('sha1',enc(process.env.X_API_SECRET)+'&'+enc(process.env.X_ACCESS_SECRET)).update(base).digest('base64');
    const auth='OAuth '+Object.keys(o).sort().map(k=>enc(k)+'="'+enc(o[k])+'"').join(', ');
    const tw='🆕 '+String(p.name).slice(0,120)+'\n💰 '+Number(p.price||0).toLocaleString('fr-FR')+' F\n🛒 '+link;
    const j=await (await fetch(url,{method:'POST',headers:{authorization:auth,'content-type':'application/json'},body:JSON.stringify({text:tw})})).json();
    out.x=(j.data&&j.data.id)?{ok:true,id:j.data.id}:{ok:false,err:j.detail||j.title||'Erreur X'};
   }catch(e){out.x={ok:false,err:'X injoignable'}}
  }
  if(HOOK){
   try{const r=await fetch(HOOK,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({event:'new_article',id:id,name:p.name,price:p.price,category:p.cat||'',message:msg,link:link,imageUrl:site+'/api/img?id='+id,site:site})});out.webhook={ok:r.ok}}
   catch(e){out.webhook={ok:false,err:'Webhook injoignable'}}
  }
  const any=Object.values(out).some(x=>x&&x.ok);
  if(any)await db('PUT','socialposted/'+id,{date:Date.now(),facebook:!!(out.facebook&&out.facebook.ok),instagram:!!(out.instagram&&out.instagram.ok),telegram:!!(out.telegram&&out.telegram.ok),x:!!(out.x&&out.x.ok),webhook:!!(out.webhook&&out.webhook.ok)});
  res.status(200).json({ok:any,results:out,configured:true});
 }catch(e){res.status(200).json({ok:false,err:'Erreur du serveur. Vérifiez FIREBASE_SA, FB_PAGE_ID et FB_PAGE_TOKEN sur Vercel.'})}
};
