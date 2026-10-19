/* BOUBA STORE – « enveloppe » ultra rapide (App Shell) : l'appli s'ouvre instantanément depuis la mémoire du téléphone,
   puis se met à jour en arrière-plan. Un bandeau « Nouvelle version prête » propose d'actualiser. */
const C='bouba-shell-v6',RT='bouba-ext-v1';
const SHELL=['index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable-512.png','firebase-config.js','bouba-data.js','alertes.js','amis5.js','bouba-chat.js','maj.js','articles-accueil.js',
 'promos.js','features.js','aide.js','fun.js','suite.js','bonus.js','more.js','pro.js','vibes.js','accueil.js','menu.js','monde.js','browser.js','star.js','onboarding.js','stats.js','commandes.js','vitesse.js','republier.js','partage.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k!==C&&k!==RT)await caches.delete(k);
 await self.clients.claim();
})()));
let told=0;
async function tell(){if(told)return;told=1;for(const c of await self.clients.matchAll({type:'window'}))c.postMessage({type:'update'})}
function changed(a,b){
 const x=a.headers.get('etag'),y=b.headers.get('etag');
 if(x&&y)return x!==y;
 return a.headers.get('content-length')!==b.headers.get('content-length')||a.headers.get('last-modified')!==b.headers.get('last-modified');
}
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 if(u.origin===self.location.origin){
  if(u.pathname.startsWith('/api/'))return;
  e.respondWith(shell(e,r));
 }else if(/(^|\.)gstatic\.com$|^fonts\.googleapis\.com$/.test(u.hostname)){
  e.respondWith(ext(r));
 }
});
async function shell(e,r){
 const c=await caches.open(C),nav=r.mode==='navigate',key=nav?'index.html':r;
 const hit=await c.match(key,{ignoreSearch:true});
 const net=fetch(nav?new Request('index.html',{cache:'no-cache'}):new Request(r,{cache:'no-cache'})).then(async res=>{
  if(res&&res.ok){if(hit&&changed(hit,res))tell();await c.put(key,res.clone())}
  return res;
 }).catch(()=>null);
 if(hit){e.waitUntil(net);return hit}
 const res=await net;
 return res||(await c.match('index.html'))||new Response('Hors ligne',{status:503});
}
async function ext(r){
 const c=await caches.open(RT),h=await c.match(r);
 if(h)return h;
 try{const res=await fetch(r);if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}catch(x){return Response.error()}
}
self.addEventListener('push',e=>{let d={};try{const j=e.data.json();d=Object.assign({},j,j.notification||{},j.data||{})}catch(_){}e.waitUntil(self.registration.showNotification(d.title||'BOUBA STORE',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||'bouba-new',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const u=(e.notification.data&&e.notification.data.url)||'./';e.waitUntil(self.clients.matchAll({type:'window'}).then(l=>{for(const c of l)if('focus' in c)return c.focus();return self.clients.openWindow(u)}))});
