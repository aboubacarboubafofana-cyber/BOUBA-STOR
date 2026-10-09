import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getMessaging,getToken,onMessage} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const VAPID="BNKwvLEvBi6bAvLgh3Hj508UQCFl71iEqHUU_SEleU63pJL1JVRBaJGIvYJBc1dOv5Xu2KTJHkjeXc7c9bU9si4";

async function activer(){
 try{
  if(!('Notification' in window)||!('serviceWorker' in navigator)){alert('Notifications non supportées');return}
  const p=await Notification.requestPermission();
  if(p!=='granted'){alert('Notifications refusées : autorisez-les dans Chrome');return}
  const reg=await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const app=initializeApp(firebaseConfig,'push');
  const m=getMessaging(app);
  const token=await getToken(m,{vapidKey:VAPID,serviceWorkerRegistration:reg});
  if(!token){alert('Pas de token');return}
  const r=await fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'sub',token})});
  const j=await r.json().catch(()=>({}));
  if(!j.ok){alert('Serveur : enregistrement refusé');return}
  localStorage.setItem('b_tok',token);
  onMessage(m,pl=>{const n=pl.notification||{};new Notification(n.title||'BOUBA STORE',{body:n.body||'',icon:'icon-192.png'})});
  alert('✅ Notifications activées');
 }catch(e){alert('Erreur : '+(e.code||e.message||e))}
}

window.activerAlertes=activer;
