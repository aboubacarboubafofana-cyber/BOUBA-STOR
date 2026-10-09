import './firebase-config.js';
import {getApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getMessaging,getToken,onMessage} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const VAPID="BNKwvLEvBi6bAvLgh3Hj508UQCFl71iEqHUU_SEleU63pJL1JVRBaJGIvYJBc1dOv5Xu2KTJHkjeXc7c9bU9si4";

async function activer(){
 try{
  if(!('Notification' in window)||!('serviceWorker' in navigator))return;
  const p=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
  if(p!=='granted')return;
  const reg=await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const m=getMessaging(getApp());
  const token=await getToken(m,{vapidKey:VAPID,serviceWorkerRegistration:reg});
  if(!token||localStorage.getItem('b_tok')===token)return;
  await fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'sub',token})});
  localStorage.setItem('b_tok',token);
  onMessage(m,pl=>{const n=pl.notification||{};new Notification(n.title||'BOUBA STORE',{body:n.body||'',icon:'icon-192.png'})});
 }catch(e){console.log('alertes',e)}
}

if(Notification.permission==='granted')activer();
else if(Notification.permission==='default')
 document.addEventListener('click',activer,{once:true});