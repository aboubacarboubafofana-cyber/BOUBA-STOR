/* BOUBA STORE – 8 options : Favoris, Avis, Mes commandes, Boutiques, Filtres/tri, Aide, Installer, Tendances
   S'appuie sur index.html + promos.js (S, me, write, sub, fb, online, esc, safeImg, fmt, uid, LS, SV, toast, openPage, closeAll, addCart, renderStore) */
(function(){
var LSF='p_fav',LSO='p_orders',fav=LS(LSF,[]),myOrders=LS(LSO,[]),sortBy='new',maxP=0,shopsCache=null,deferred=null,subbed=0,viewed={};
var key=function(){return me&&me.key};
var P=function(id){return (S.products||{})[id]};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var STAT={'en attente':'🕐 En attente','confirmée':'✅ Confirmée','préparation':'📦 En préparation','livraison':'🚚 En livraison','livrée':'🎉 Livrée','annulée':'❌ Annulée'};

/* ---------- données : avis, vues, statuts ---------- */
function rating(id){
 var a=Object.values(((S.avis||{})[id])||{}).filter(function(x){return x&&x.stars});
 if(!a.length)return null;
 return {avg:a.reduce(function(s,x){return s+x.stars},0)/a.length,n:a.length,list:a};
}
function stars(n){return '★★★★★'.slice(0,Math.round(n))+'☆☆☆☆☆'.slice(0,5-Math.round(n))}
function views(id){return +((S.views||{})[id])||0}

/* ---------- cartes de la grille : cœur, note, vues ---------- */
function enhance(){
 document.querySelectorAll('#grid .card').forEach(function(c){
  if(c.dataset.e)return;
  var m=/addCart\('([^']+)'/.exec(c.innerHTML);if(!m)return;
  var id=m[1];c.dataset.e=1;c.dataset.pid=id;
  var heart=document.createElement('button');
  heart.className='pfav';heart.setAttribute('aria-label','Favori');
  heart.textContent=fav.indexOf(id)>-1?'❤️':'🤍';
  heart.onclick=function(e){e.stopPropagation();toggleFav(id,heart)};
  c.appendChild(heart);
  var info=c.querySelector('.info'),r=rating(id);
  var d=document.createElement('div');d.className='prate';
  d.textContent=r?stars(r.avg)+' '+r.avg.toFixed(1)+' ('+r.n+')':'☆ Donner un avis';
  d.onclick=function(){openAvis(id)};
  if(info)info.insertBefore(d,info.querySelector('.btn'));
  var img=c.querySelector('img');if(img)img.onclick=function(){countView(id)};
 });
 applyFilter();
}
function toggleFav(id,el){
 var i=fav.indexOf(id);
 if(i>-1)fav.splice(i,1);else fav.push(id);
 SV(LSF,fav);if(el)el.textContent=fav.indexOf(id)>-1?'❤️':'🤍';
 toast(i>-1?'Retiré des favoris':'❤️ Ajouté aux favoris');renderHub();
}
function countView(id){
 if(viewed[id]||!fb||!online)return;viewed[id]=1;
 try{fb.D.set(fb.D.ref(fb.db,'views/'+id),fb.D.increment(1))}catch(e){}
}

/* ---------- tri et budget ---------- */
function applyFilter(){
 var g=$('grid');if(!g)return;
 var cs=[].slice.call(g.querySelectorAll('.card[data-pid]'));if(!cs.length)return;
 var val=function(c){var p=P(c.dataset.pid)||{};
  if(sortBy==='asc')return p.price||0;
  if(sortBy==='desc')return -(p.price||0);
  if(sortBy==='pop')return -views(p.id);
  if(sortBy==='rate'){var r=rating(p.id);return -(r?r.avg*10+r.n:0)}
  return -(p.date||0)};
 cs.sort(function(a,b){return val(a)-val(b)}).forEach(function(c){
  g.appendChild(c);var p=P(c.dataset.pid)||{};
  c.style.display=(maxP&&p.price>maxP)?'none':'';
 });
}
function buildFilter(){
 if($('pFilter'))return;
 var g=$('grid');if(!g)return;
 var d=document.createElement('div');d.id='pFilter';d.style.cssText='display:flex;gap:8px;padding:0 10px 6px';
 d.innerHTML='<select id="fSort" class="input" style="margin:0;flex:1.3"><option value="new">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="pop">Populaires</option><option value="rate">Mieux notés</option></select><input id="fMax" class="input" type="number" inputmode="numeric" placeholder="Budget max (F)" style="margin:0;flex:1">';
 g.parentNode.insertBefore(d,g);
 $('fSort').onchange=function(){sortBy=this.value;applyFilter()};
 $('fMax').oninput=function(){maxP=Number(this.value)||0;applyFilter()};
}

/* ---------- pages : Mes avantages+ (hub) ---------- */
var css=document.createElement('style');
css.textContent='.pfav{position:absolute;top:6px;right:6px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(0,0,0,.65);font-size:20px;padding:0!important}.prate{color:#ffd700;font-size:13px;margin:4px 0;cursor:pointer}.hub{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.hub h3{color:gold;font-size:16px;margin:0 0 6px}.hub p{font-size:14px;color:#ddd;margin:4px 0 8px}.hs{display:flex;gap:8px;overflow-x:auto}.hs>div{min-width:130px;background:#000;border:1px solid #333;border-radius:10px;padding:6px;font-size:13px}.hs img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.hubnav{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.hubnav button{padding:14px 6px}.ord{border-top:1px solid #333;padding:8px 0;font-size:14px}.shp{display:flex;gap:10px;align-items:center;border-top:1px solid #333;padding:10px 0}.shp img{width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid #d4af37}.aide{position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:150;background:#25d366;color:#000;font-weight:900;border:0;border-radius:24px;padding:10px 14px;font-size:14px}';
document.head.appendChild(css);
var hub=document.createElement('div');hub.id='hubPage';hub.className='page';
var rv=document.createElement('div');rv.id='avisPage';rv.className='page';
function hubCard(t,b){return '<div class="hub"><h3>'+t+'</h3>'+b+'</div>'}
function renderHub(){
 var h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">⭐ MON ESPACE</h2>';
 /* favoris */
 var fl=fav.map(P).filter(Boolean);
 h+=hubCard('❤️ Mes favoris',fl.length?'<div class="hs">'+fl.map(function(p){return '<div><img src="'+safeImg(p.img)+'"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span><button class="mini" style="width:100%;margin-top:4px" onclick="addCart(\''+p.id+'\')">🛒 Ajouter</button></div>'}).join('')+'</div>':'<p>Touchez 🤍 sur un article pour le retrouver ici.</p>');
 /* commandes */
 h+=hubCard('📦 Mes commandes',myOrders.length?myOrders.slice().reverse().map(function(o){
  var st=(S.ostatus||{})[o.id]||'en attente';
  return '<div class="ord"><b style="color:gold">#'+esc(o.id)+'</b> • '+new Date(o.date).toLocaleDateString('fr-FR')+'<br>'+esc((o.items||[]).join(', '))+'<br><b>'+fmt(o.total)+' F</b> • '+esc(STAT[st]||st)+'</div>'}).join(''):'<p>Aucune commande pour le moment.</p>');
 /* boutiques */
 h+=hubCard('🏪 Boutiques','<div id="hubShops"><p>Chargement…</p></div>');
 /* aide + installer */
 h+=hubCard('💬 Aide','<p>Une question ? Écrivez-nous sur WhatsApp.</p><button class="gold" onclick="PLUS.aide()">Écrire à BOUBA STORE</button>');
 h+=hubCard('📲 Installer l\'application','<p>Ajoutez BOUBA STORE à votre écran d\'accueil : ouverture plus rapide et notifications.</p><button class="gold" onclick="PLUS.install()">Installer</button>');
 hub.innerHTML=h;loadShops();
}
function loadShops(){
 var box=$('hubShops');if(!box)return;
 function draw(){
  var s=shopsCache.shops.filter(function(x){return x.status!=='closed'}),a=shopsCache.arts;
  box.innerHTML=s.length?s.map(function(x){
   var n=a.filter(function(y){return y.shopId===x.id}).length,ph=String(x.phone||'').replace(/\D/g,'');
   return '<div class="shp"><img src="'+safeImg(x.avatar||'')+'" alt=""><div style="flex:1"><b>'+esc(x.name)+'</b><br><span style="font-size:12px;color:#aaa">'+n+' article(s)</span></div><button class="mini" onclick="PLUS.shopWA(\''+ph+'\')">💬</button></div>'}).join(''):'<p>Aucune boutique pour le moment.</p>';
 }
 if(shopsCache)return draw();
 import('./bouba-data.js').then(function(m){return Promise.all([m.list('boutiques'),m.list('articles')])})
  .then(function(r){shopsCache={shops:r[0]||[],arts:r[1]||[]};draw()})
  .catch(function(){box.innerHTML='<p>Liste indisponible pour le moment.</p>'});
}

/* ---------- avis ---------- */
var avisId='',avisStars=5;
function openAvis(id){
 avisId=id;avisStars=5;var p=P(id)||{},r=rating(id);
 var h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">⭐ Avis : '+esc(p.name||'')+'</h2>';
 h+=hubCard('Donner mon avis','<div id="avSt" style="font-size:34px;color:gold">'+[1,2,3,4,5].map(function(i){return '<span onclick="PLUS.setStars('+i+')">★</span>'}).join('')+'</div><input id="avTxt" class="input" maxlength="250" placeholder="Votre commentaire (facultatif)"><input type="file" id="avPh" accept="image/*" class="input" onchange="PLUS.avPhoto(this.files[0])"><button class="gold" onclick="PLUS.sendAvis()">Envoyer mon avis</button>');
 h+=hubCard('Avis des clients'+(r?' • '+r.avg.toFixed(1)+'/5':''),r?r.list.sort(function(a,b){return b.date-a.date}).slice(0,15).map(function(x){return '<div class="ord"><span style="color:gold">'+stars(x.stars)+'</span> <b>'+esc(x.name||'Client')+'</b><br>'+esc(x.text||'')+(x.img?'<br><img src="'+safeImg(x.img)+'" style="width:120px;border-radius:8px;margin-top:4px">':'')+'</div>'}).join(''):'<p>Aucun avis pour le moment.</p>');
 rv.innerHTML=h;openPage('avisPage');
}

/* ---------- accueil : tendances + boutons ---------- */
var tz=document.createElement('div');tz.id='trendZone';tz.style.cssText='padding:0 10px';
function renderTrend(){
 var g=$('grid');if(!g)return;
 if(!tz.parentNode)g.parentNode.insertBefore(tz,g);
 var top=Object.values(S.products||{}).filter(function(p){return p&&p.id&&p.stock!==false&&views(p.id)>0}).sort(function(a,b){return views(b.id)-views(a.id)}).slice(0,6);
 var h='<div style="display:flex;gap:8px;margin:6px 0"><button class="mini" style="flex:1;padding:12px" onclick="PLUS.open()">❤️ Favoris • 📦 Commandes • 🏪 Boutiques</button></div>';
 if(top.length)h+=hubCard('🔥 Tendances','<div class="hs">'+top.map(function(p){return '<div onclick="PLUS.view(\''+p.id+'\')"><img src="'+safeImg(p.img)+'"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span><button class="mini" style="width:100%;margin-top:4px" onclick="event.stopPropagation();addCart(\''+p.id+'\')">🛒 Ajouter</button></div>'}).join('')+'</div>');
 tz.innerHTML=h;
}

/* ---------- aide + installation ---------- */
var aideBtn=document.createElement('button');aideBtn.className='aide';aideBtn.textContent='💬 Aide';
aideBtn.onclick=function(){PLUS.aide()};

window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});

/* ---------- commandes locales + statut admin ---------- */
var _cm=window.commander;
window.commander=function(){
 var it=cartItems(),tot=cartSum(),o=window.open;
 if(!it.length||!me)return _cm();
 var names=it.map(function(x){return x.p.name+' x'+x.qty}),oid='';
 window.open=function(u,t){window.open=o;try{var m=/Commande%20%23([^%]+)/.exec(u);oid=m?m[1]:''}catch(e){}return o.call(window,u,t)};
 try{_cm()}finally{window.open=o}
 if(oid){myOrders.push({id:oid,date:Date.now(),total:tot,items:names});if(myOrders.length>30)myOrders.shift();SV(LSO,myOrders)}
};
var _ss=window.setStatus;
window.setStatus=function(id,s){_ss(id,s);write('ostatus/'+id,s)};

/* ---------- API publique ---------- */
window.PLUS={
 avPhoto:function(f){if(f)compress(f,400,function(img){window._avImg=img;toast('📸 Photo prête')})},
 open:function(){renderHub();openPage('hubPage')},
 aide:function(){window.open('https://wa.me/'+waNum()+'?text='+encodeURIComponent('Bonjour BOUBA STORE, j\'ai besoin d\'aide.'),'_blank')},
 shopWA:function(p){if(p)window.open('https://wa.me/'+p+'?text='+encodeURIComponent('Bonjour, je vous contacte depuis BOUBA STORE.'),'_blank')},
 view:function(id){countView(id);addCart(id)},
 setStars:function(n){avisStars=n;[].forEach.call($('avSt').children,function(s,i){s.style.opacity=i<n?1:.3})},
 sendAvis:function(){
  if(!me){alert('Connectez-vous d\'abord');return}
  var t=($('avTxt').value||'').trim().slice(0,250),id=uid();
  write('avis/'+avisId+'/'+id,{id:id,stars:avisStars,text:t,name:me.name,date:Date.now(),by:key(),img:window._avImg||''});window._avImg='';
  toast('⭐ Merci pour votre avis');closeAll();
 },
 install:function(){
  if(deferred){deferred.prompt();deferred=null;return}
  alert(/iphone|ipad/i.test(navigator.userAgent)?'Sur iPhone : touchez le bouton Partager puis « Sur l\'écran d\'accueil ».':'Menu du navigateur (⋮) puis « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».');
 }
};

/* ---------- démarrage ---------- */
function boot(){
 if(!$('grid')||!fb)return;
 if(!hub.parentNode){document.body.appendChild(hub);document.body.appendChild(rv);document.body.appendChild(aideBtn);buildFilter()}
 if(!subbed){subbed=1;sub('avis');sub('views');sub('ostatus')}
}
setInterval(boot,1000);
var _rs=window.renderStore;
window.renderStore=function(){_rs();enhance();renderTrend()};
var _ra=window.renderAll;
window.renderAll=function(){_ra();if($('hubPage')&&hub.classList.contains('active'))renderHub()};
})();
