import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getMessaging,getToken,onMessage} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const VAPID="BNKwvLEvBi6bAvLgh3Hj508UQCFl71iEqHUU_SEleU63pJL1JVRBaJGIvYJBc1dOv5Xu2KTJHkjeXc7c9bU9si4";
let dev='';try{dev=localStorage.getItem('b_dev')||'';if(!dev){dev=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2)).replace(/[^\w-]/g,'');localStorage.setItem('b_dev',dev)}}catch(e){}
const say=(m,manual)=>{if(manual)alert(m)};

async function activer(manual){
 try{
  if(!('Notification' in window)||!('serviceWorker' in navigator)){say('Notifications non supportées',manual);return}
  const p=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
  if(p!=='granted'){say('Notifications refusées : autorisez-les dans Chrome',manual);return}
  const reg=await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const app=initializeApp(firebaseConfig,'push');
  const m=getMessaging(app);
  const token=await getToken(m,{vapidKey:VAPID,serviceWorkerRegistration:reg});
  if(!token){say('Pas de token',manual);return}
  if(!window.__bMsg){window.__bMsg=1;onMessage(m,pl=>{const d=pl.data||{},n=pl.notification||{};
   /* même tag que le service worker : une seule notification visible, jamais de doublon */
   reg.showNotification(d.title||n.title||'BOUBA STORE',{body:d.body||n.body||'',icon:'icon-192.png',tag:d.tag||'bouba-new',data:{url:d.url||'./'}})})}
  if(!manual&&localStorage.getItem('b_tok')===token)return;
  const r=await fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'sub',token,dev})});
  const j=await r.json().catch(()=>({}));
  if(!j.ok){say('Serveur : enregistrement refusé',manual);return}
  localStorage.setItem('b_tok',token);
  say('✅ Notifications activées',manual);
 }catch(e){say('Erreur : '+(e.code||e.message||e),manual)}
}

window.activerAlertes=()=>activer(true);

if(Notification.permission==='granted')activer(false);
else if(Notification.permission==='default')
 document.addEventListener('click',()=>activer(false),{once:true});
