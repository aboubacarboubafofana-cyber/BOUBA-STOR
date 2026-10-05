/* BOUBA STORE : abonnement aux alertes (app fermée) */
(function(){
 var API='https://bouba-stor.vercel.app/api/push';
 var VAPID='BNKwvLEvBi6bAvLgh3Hj508UQCFl71iEqHUU_SEleU63pJL1JVRBaJGIvYJBc1dOv5Xu2KTJHkjeXc7c9bU9si4';
 var CFG={apiKey:'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4',authDomain:'project-f4477c80-7c55-4db7-b2e.firebaseapp.com',projectId:'project-f4477c80-7c55-4db7-b2e',messagingSenderId:'697604298457',appId:'1:697604298457:web:4f9a6d66ec6fde9c1990c8'};
 var V='https://www.gstatic.com/firebasejs/10.12.2/';
 async function subscribe(){
  try{
   if(!('serviceWorker' in navigator)||!('Notification' in window)||Notification.permission!=='granted')return;
   var A=await import(V+'firebase-app.js'),M=await import(V+'firebase-messaging.js');
   if(!(await M.isSupported()))return;
   var app=A.getApps().filter(function(a){return a.name==='push'})[0]||A.initializeApp(CFG,'push');
   var reg=await navigator.serviceWorker.ready;
   var t=await M.getToken(M.getMessaging(app),{vapidKey:VAPID,serviceWorkerRegistration:reg});
   if(t&&localStorage.getItem('pushTok')!==t){
    var r=await fetch(API,{method:'POST',body:JSON.stringify({act:'sub',token:t})});
    if(r.ok)localStorage.setItem('pushTok',t);
   }
  }catch(e){}
 }
 function ping(){fetch(API,{method:'POST',body:JSON.stringify({act:'notify'})}).catch(function(){})}
 var t1,t2;
 window.boubaPush=subscribe;
 window.boubaNotify=function(){clearTimeout(t1);clearTimeout(t2);t1=setTimeout(ping,6000);t2=setTimeout(ping,25000)};
 setTimeout(subscribe,3000);
})();
