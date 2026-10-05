const C='bouba-v4';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 const ks=await caches.keys(),old=ks.some(k=>k!==C);
 await Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)));
 await self.clients.claim();
 if(old)for(const c of await self.clients.matchAll({type:'window'}))c.navigate(c.url).catch(()=>{});
})()));
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{
  if(res.ok){const k=res.clone();caches.open(C).then(c=>c.put(r,k))}
  return res;
 }).catch(()=>caches.match(r).then(x=>x||caches.match('./index.html'))));
});
