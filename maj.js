/* Mise à jour automatique : recharge l'app dès qu'une nouvelle version est en ligne */
(function(){
 var F=['index.html','amis.html','amis5.js','sw.js'],
  base=location.href.split('#')[0].split('?')[0].replace(/[^\/]*$/,''),sig0=null,diff=0;
 async function sig(){
  var s='';
  for(var i=0;i<F.length;i++){
   try{var r=await fetch(base+F[i],{method:'HEAD',cache:'no-store'});
    s+=(r.headers.get('etag')||r.headers.get('last-modified')||r.headers.get('content-length')||'')+'|'}
   catch(e){return null}
  }
  return s;
 }
 function busy(){
  if(window.busy&&window.busy())return true;
  var a=document.activeElement;return !!a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName);
 }
 async function chk(){
  if(document.hidden)return;
  var s=await sig();if(!s)return;
  if(sig0===null){sig0=s;return}
  if(s===sig0){diff=0;return}
  if(++diff<2||busy())return;
  var t=0;try{t=+sessionStorage.getItem('majT')||0}catch(e){}
  if(Date.now()-t<60000)return;
  try{sessionStorage.setItem('majT',Date.now())}catch(e){}
  try{if(navigator.serviceWorker){var g=await navigator.serviceWorker.getRegistration();if(g)await g.update()}}catch(e){}
  location.reload();
 }
 setInterval(chk,10000);
 document.addEventListener('visibilitychange',chk);
 window.addEventListener('focus',chk);
 window.addEventListener('online',chk);
 chk();
})();
