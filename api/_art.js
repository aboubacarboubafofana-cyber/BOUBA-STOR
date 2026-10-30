// BOUBA STORE : lecture d'un article boutique (Firestore, collection "articles")
const crypto=require('crypto');
const PID='project-f4477c80-7c55-4db7-b2e';
const KEY='AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4'; // clé web publique (déjà présente dans vos pages)
const b64=b=>Buffer.from(b).toString('base64url');
let cache=null;
async function tok(){
 if(cache&&cache.exp>Date.now()+60000)return cache.t;
 const sa=JSON.parse(process.env.FIREBASE_SA);
 const now=Math.floor(Date.now()/1000);
 const h=b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const c=b64(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const sig=crypto.createSign('RSA-SHA256').update(h+'.'+c).sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion='+h+'.'+c+'.'+sig});
 const j=await r.json();
 if(!j.access_token)throw new Error('auth');
 cache={t:j.access_token,exp:Date.now()+(j.expires_in||3600)*1000};
 return cache.t;
}
const val=f=>!f?undefined:f.stringValue!==undefined?f.stringValue:f.integerValue!==undefined?Number(f.integerValue):f.doubleValue!==undefined?f.doubleValue:undefined;
async function getArticle(id){
 id=String(id||'');
 if(!/^[\w-]{3,60}$/.test(id))return null;
 const url='https://firestore.googleapis.com/v1/projects/'+PID+'/databases/(default)/documents/articles/'+id;
 let r=await fetch(url+'?key='+KEY);
 if((r.status===401||r.status===403)&&process.env.FIREBASE_SA){
  r=await fetch(url,{headers:{authorization:'Bearer '+await tok()}});
 }
 if(!r.ok)return null;
 const d=await r.json(),f=d.fields||{},o={id};
 for(const k of Object.keys(f)){const v=val(f[k]);if(v!==undefined)o[k]=v}
 return o;
}
module.exports={getArticle};
