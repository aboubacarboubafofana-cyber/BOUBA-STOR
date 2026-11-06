importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSy...",
  authDomain:"project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app",
  databaseURL:"https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:"project-f4477c80-7c55-4db7-b2e",
  storageBucket:"project-f4477c80-7c55-4db7-b2e.firebasestorage.app",
  messagingSenderId:"697604298457",
  appId:"1:697604298457:web:4f9a6d66ec6fde9c1990c8"
});

const messaging=firebase.messaging();

// Notification en arrière-plan
messaging.onBackgroundMessage(payload=>{
  console.log('Notif reçue',payload);
  const title=payload.notification?.title||'BOUBA STOR';
  const options={
    body:payload.notification?.body||'Nouvel article disponible !',
    icon:'/icon-192.png',
    badge:'/icon-192.png',
    data:{url:payload.data?.url||'/'}
  };
  self.registration.showNotification(title,options);
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/';
  event.waitUntil(
    clients.matchAll({type:'window'}).then(clis=>{
      for(const c of clis){ if(c.url.includes(url) && 'focus' in c) return c.focus(); }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
