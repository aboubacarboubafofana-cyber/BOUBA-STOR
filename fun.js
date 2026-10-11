/* BOUBA STORE – Jeux & cadeaux : roue, série, faire une offre, classement parrains, alerte baisse de prix, coupons à gratter, vidéos, offrir à un ami
   Dépend de index.html, promos.js (PROMO.addCredit/addPts) et features.js */
(function(){
var DAY=864e5,LSF='p_F',started='',lock=0,scratchPrize=null;
var F=Object.assign({streak:0,lastDay:'',lastWheel:'',coupons:0,flashSeen:0,price:{},drops:[]},LS(LSF,{}));
var key=function(){return me&&me.key};
var P=function(id){return (S.products||{})[id]};
var today=function(){return new Date().toISOString().slice(0,10)};
var yest=function(){return new Date(Date.now()-DAY).toISOString().slice(0,10)};
var month=function(){return today().slice(0,7)};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var link=function(){return location.origin+'/'};
function save(){SV(LSF,F);if(key())write('loyalty/'+key()+'/fun',F)}
function flash(){var f=(S.info||{}).flash;return f&&f.end>Date.now()?f:null}
function reward(r){
 if(r==='p5'){PROMO.addPts(5);return '5 points fidélité'}
 if(r>0){PROMO.addCredit(r);return fmt(r)+' F de crédit'}
 return ''
}

/* ---------- styles + pages ---------- */
var css=document.createElement('style');
css.textContent='.pact{display:flex;gap:4px;margin:4px 0}.pact button{flex:1;font-size:11px!important;padding:6px 2px!important;border-radius:6px;border:1px solid gold;background:#000;color:gold;font-weight:700}.fcard{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0;text-align:center}.fcard h3{color:gold;font-size:16px;margin:0 0 6px}.fcard p{font-size:14px;color:#ddd;margin:4px 0 8px}.dots{display:flex;justify-content:center;gap:6px;margin:8px 0}.dots i{width:30px;height:30px;border-radius:50%;border:2px solid gold;display:grid;place-items:center;font-style:normal;font-size:13px;color:#000}.vid{height:100%;scroll-snap-align:start;position:relative;background:#000;margin-bottom:8px;border-radius:12px;overflow:hidden}.vfeed{height:calc(100% - 50px);overflow-y:auto;scroll-snap-type:y mandatory}.vbar{position:absolute;left:0;right:0;bottom:0;padding:12px;background:linear-gradient(transparent,rgba(0,0,0,.9));color:#fff}.drop{background:#1a1400;border:1px solid gold;border-radius:10px;padding:8px 10px;margin:6px 0;font-size:14px;color:#ffd700;display:flex;gap:8px;align-items:center}';
document.head.appendChild(css);
var fp=document.createElement('div');fp.id='funPage';fp.className='page';
var vp=document.createElement('div');vp.id='vidPage';vp.className='page';vp.style.padding='10px';
var fz=document.createElement('div');fz.id='funZone';fz.style.cssText='padding:0 10px';

/* ---------- roue ---------- */
var SEG=[['100 F',100],['Perdu',0],['200 F',200],['5 pts','p5'],['500 F',500],['Perdu',0],['300 F',300],['1 000 F',1000]];
var WT=[24,15,18,8,6,15,10,4],rot=0,k=0;
function pt(a,r){a=a*Math.PI/180;return [100+r*Math.cos(a),100+r*Math.sin(a)]}
function wheelSvg(){
 var s='<svg viewBox="0 0 200 215" style="width:250px;max-width:80%"><polygon points="92,2 108,2 100,20" fill="#fff"/><g transform="translate(0,12)"><g id="wh" style="transform-origin:100px 100px;transition:transform 4.2s cubic-bezier(.12,.7,.1,1)">';
 SEG.forEach(function(g,i){var a=pt(i*45-90,95),b=pt(i*45-45,95);
  s+='<path d="M100 100 L'+a[0]+' '+a[1]+' A95 95 0 0 1 '+b[0]+' '+b[1]+' Z" fill="'+(i%2?'#2a2200':'#d4af37')+'" stroke="#000"/>'+
     '<text x="100" y="36" text-anchor="middle" font-size="13" font-weight="800" fill="'+(i%2?'#ffd700':'#000')+'" transform="rotate('+(i*45+22.5)+' 100 100)">'+g[0]+'</text>'});
 return s+'</g></g></svg>';
}
function spin(){
 if(lock)return;
 if(F.lastWheel===today()){toast('Revenez demain pour tourner à nouveau');return}
 lock=1;F.lastWheel=today();save();
 var r=Math.random()*100,i=0,c=0;
 for(;i<WT.length;i++){c+=WT[i];if(r<c)break}
 k++;rot=360*5*k-(i*45+22.5);
 $('wh').style.transform='rotate('+rot+'deg)';
 $('spinBtn').disabled=true;
 setTimeout(function(){
  var g=reward(SEG[i][1]);
  $('wres').textContent=g?'🎉 Vous gagnez : '+g+' !':'😅 Perdu, retentez demain !';
  if(g)toast('🎉 '+g);lock=0;
 },4400);
}

/* ---------- coupon à gratter ---------- */
function initScratch(){
 var cv=$('scv');if(!cv)return;
 var x=cv.getContext('2d'),W=cv.width,H=cv.height,n=0,done=0;
 var P5=[100,100,100,200,200,300,500,1000];
 scratchPrize=P5[Math.floor(Math.random()*P5.length)];
 $('scPrize').textContent=fmt(scratchPrize)+' F';
 x.fillStyle='#8a8a8a';x.fillRect(0,0,W,H);x.fillStyle='#ddd';x.font='bold 22px sans-serif';x.textAlign='center';x.fillText('GRATTEZ ICI',W/2,H/2+8);
 function at(e){var r=cv.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return [(t.clientX-r.left)*W/r.width,(t.clientY-r.top)*H/r.height]}
 function erase(e){
  if(done)return;e.preventDefault();var p=at(e);
  x.globalCompositeOperation='destination-out';x.beginPath();x.arc(p[0],p[1],20,0,7);x.fill();
  if(++n%6===0){var d=x.getImageData(0,0,W,H).data,c=0;for(var i=3;i<d.length;i+=16)if(d[i]===0)c++;
   if(c/(d.length/16)>0.4){done=1;cv.style.display='none';
    if(F.coupons>0){F.coupons--;save();var g=reward(scratchPrize);toast('🎟️ '+g);$('scMsg').textContent='🎉 Vous gagnez '+g+' !';setTimeout(function(){openFun()},2500)}}}
 }
 cv.addEventListener('touchmove',erase,{passive:false});cv.addEventListener('mousemove',function(e){if(e.buttons)erase(e)});
}

/* ---------- page Jeux & cadeaux ---------- */
function fcard(t,b){return '<div class="fcard"><h3>'+t+'</h3>'+b+'</div>'}
function openFun(){
 var h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🎡 JEUX & CADEAUX</h2>';
 var done=F.lastWheel===today();
 h+=fcard('🎡 Roue de la chance','<p>Une fois par jour. Gagnez du crédit ou des points.</p>'+wheelSvg()+'<div id="wres" style="color:gold;font-weight:800;min-height:24px"></div><button id="spinBtn" class="gold" '+(done?'disabled style="opacity:.5"':'')+' onclick="PLAY.spin()">'+(done?'Déjà joué aujourd\'hui':'Tourner la roue')+'</button>');
 var s=Math.min(7,F.streak||0),dots='';
 for(var i=1;i<=7;i++)dots+='<i style="background:'+(i<=s?'gold':'transparent')+'">'+(i<=s?'✓':i)+'</i>';
 h+=fcard('🔥 Série de connexion','<p>7 jours de suite = 1 000 F de crédit.</p><div class="dots">'+dots+'</div><p><b>'+s+'</b> / 7 jours</p><button class="gold" '+(s>=7?'':'disabled style="opacity:.4"')+' onclick="PLAY.claim()">Réclamer 1 000 F</button>');
 h+=fcard('🎟️ Coupons à gratter',F.coupons>0?'<p>Vous avez <b>'+F.coupons+'</b> coupon(s). Grattez avec le doigt !</p><div style="position:relative;width:260px;height:110px;margin:0 auto;border-radius:10px;overflow:hidden;background:#d4af37;color:#000"><div style="position:absolute;inset:0;display:grid;place-items:center;font-weight:900;font-size:30px" id="scPrize">…</div><canvas id="scv" width="260" height="110" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></canvas></div><p id="scMsg" style="color:gold;font-weight:800"></p>':'<p>Chaque commande vous donne un coupon à gratter.</p>');
 var L=Object.values(((S.leaders||{})[month()])||{}).filter(function(x){return x&&x.count}).sort(function(a,b){return b.count-a.count}).slice(0,5);
 h+=fcard('🏆 Top parrains du mois','<p>Les 3 meilleurs gagnent un prix, annoncé sur WhatsApp.</p>'+(L.length?L.map(function(x,i){return '<div style="padding:4px 0">'+['🥇','🥈','🥉','4.','5.'][i]+' <b>'+esc(String(x.name||'').split(' ')[0])+'</b> • '+x.count+' filleul(s)</div>'}).join(''):'<p>Soyez le premier ! Partagez votre code de parrainage.</p>')+'<button class="ghost" onclick="openPage(\'promoPage\')">Mon code de parrainage</button>');
 h+=fcard('🎥 Vidéos des articles','<p>Découvrez les articles en vidéo.</p><button class="gold" onclick="PLAY.videos()">Voir les vidéos</button>');
 if(isAdmin){var o=Object.values(S.products||{}).filter(function(p){return p&&p.id}).map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('');
  h+=fcard('🔧 Admin : vidéo d\'un article','<select id="vSel" class="input">'+o+'</select><input id="vUrl" class="input" placeholder="Lien YouTube ou .mp4"><button class="gold" onclick="PLAY.saveVideo()">Enregistrer la vidéo</button>')}
 fp.innerHTML=h;openPage('funPage');setTimeout(initScratch,50);
}

/* ---------- vidéos ---------- */
function embed(u){
 u=String(u||'');if(!/^https:\/\//.test(u))return '';
 var m=/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u);
 if(m)return '<iframe src="https://www.youtube.com/embed/'+m[1]+'?playsinline=1" allow="encrypted-media" allowfullscreen style="width:100%;height:100%;border:0"></iframe>';
 if(/\.(mp4|webm)(\?|$)/i.test(u))return '<video src="'+esc(u)+'" controls playsinline loop style="width:100%;height:100%;object-fit:contain;background:#000"></video>';
 return '<div style="height:100%;display:grid;place-items:center"><a class="gold" style="padding:14px 20px;text-decoration:none" target="_blank" rel="noopener" href="'+esc(u)+'">▶ Voir la vidéo</a></div>';
}
function openVideos(){
 var l=Object.values(S.products||{}).filter(function(p){return p&&p.id&&p.video});
 vp.innerHTML='<button class="mini" onclick="PLAY.back()">← Retour</button><div class="vfeed" style="margin-top:8px">'+(l.length?l.map(function(p){
  return '<div class="vid">'+embed(p.video)+'<div class="vbar"><b>'+esc(p.name)+'</b> • <span style="color:gold">'+fmt(p.price)+' F</span><button class="gold" style="margin-top:6px" onclick="addCart(\''+p.id+'\')">🛒 Ajouter au panier</button></div></div>'}).join(''):'<p style="color:#aaa;padding:20px">Pas encore de vidéo.</p>')+'</div>';
 openPage('vidPage');
}

/* ---------- cartes : offre + cadeau ---------- */
function extra(){
 document.querySelectorAll('#grid .card[data-pid]').forEach(function(c){
  if(c.dataset.o)return;c.dataset.o=1;var id=c.dataset.pid,i=c.querySelector('.info'),b=c.querySelector('.info .btn');
  if(!i)return;var d=document.createElement('div');d.className='pact';
  d.innerHTML='<button onclick="PLAY.offer(\''+id+'\')">💸 Offre</button><button onclick="PLAY.gift(\''+id+'\')">🎁 Offrir</button>';
  i.insertBefore(d,b);
 });
}

/* ---------- alerte baisse de prix ---------- */
function priceCheck(){
 if(!key())return;var fav=LS('p_fav',[]),ch=0,f=flash();
 fav.forEach(function(id){var p=P(id);if(!p)return;var old=F.price[id];
  if(old&&p.price<old){F.drops.push({name:p.name,old:old,now:p.price});ch=1}
  if(F.price[id]!==p.price){F.price[id]=p.price;ch=1}});
 if(f&&fav.indexOf(f.id)>-1&&F.flashSeen!==f.end){var p=P(f.id);if(p){F.drops.push({name:p.name,old:p.price,now:Math.round(p.price*(100-f.pct)/100)});F.flashSeen=f.end;ch=1}}
 if(ch){F.drops=F.drops.slice(-5);save();
  try{var d=F.drops[F.drops.length-1];if(d&&Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(function(r){r.showNotification('🔔 Baisse de prix',{body:d.name+' : '+fmt(d.now)+' F au lieu de '+fmt(d.old)+' F',icon:'icon-192.png'})})}catch(e){}}
}
function renderZone(){
 var g=$('grid');if(!g)return;
 if(!fz.parentNode){var t=$('trendZone');if(t&&t.parentNode)t.parentNode.insertBefore(fz,t.nextSibling);else g.parentNode.insertBefore(fz,g)}
 var h=F.drops.slice().reverse().map(function(d,i){return '<div class="drop"><span style="flex:1">🔔 <b>'+esc(d.name)+'</b> : '+fmt(d.now)+' F (avant '+fmt(d.old)+' F)</span><button class="mini" onclick="PLAY.ok('+(F.drops.length-1-i)+')">OK</button></div>'}).join('');
 h+='<button class="mini" style="width:100%;padding:12px;margin:4px 0" onclick="PLAY.open()">🎡 Jeux & cadeaux'+(F.lastWheel!==today()?' • 1 tour gratuit !':'')+(F.coupons?' • 🎟️ '+F.coupons:'')+'</button>';
 fz.innerHTML=h;
}

/* ---------- coupon gagné après commande ---------- */
var _cm=window.commander;
window.commander=function(){
 var had=cartItems().length;_cm();
 if(had&&!cartItems().length){F.coupons=(F.coupons||0)+1;save();toast('🎟️ Un coupon à gratter vous attend !');renderZone()}
};

/* ---------- API ---------- */
window.PLAY={
 open:openFun,spin:spin,videos:openVideos,
 back:function(){openFun()},
 claim:function(){if((F.streak||0)<7)return;PROMO.addCredit(1000);F.streak=0;save();toast('🔥 1 000 F de crédit !');openFun()},
 ok:function(i){F.drops.splice(i,1);save();renderZone()},
 offer:function(id){
  var p=P(id);if(!p)return;
  var v=prompt('Votre offre pour « '+p.name+' »\nPrix actuel : '+fmt(p.price)+' F\nProposez votre prix (en F) :');
  if(v===null)return;v=Number(String(v).replace(/\D/g,''));
  if(!v||v>=p.price){alert('Proposez un prix inférieur au prix actuel.');return}
  if(v<p.price*0.5){alert('Offre trop basse. Essayez un prix plus proche.');return}
  window.open('https://wa.me/'+waNum()+'?text='+encodeURIComponent('Bonjour, je propose '+fmt(v)+' F pour « '+p.name+' » (prix : '+fmt(p.price)+' F).\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||'')),'_blank');
 },
 gift:function(id){
  var p=P(id);if(!p)return;
  var n=prompt('Prénom de votre ami(e) :');if(n===null)return;
  var m=prompt('Votre message (facultatif) :')||'';
  addCart(id);
  window.open('https://wa.me/?text='+encodeURIComponent('🎁 Pour '+n+' : '+((me&&me.name)||'Un ami')+' t\'offre « '+p.name+' » ('+fmt(p.price)+' F) sur BOUBA STORE !'+(m?'\n« '+m+' »':'')+'\n'+link()),'_blank');
 },
 saveVideo:function(){
  var u=($('vUrl').value||'').trim();if(!/^https:\/\//.test(u)){alert('Collez un lien commençant par https://');return}
  write('products/'+$('vSel').value+'/video',u);toast('🎥 Vidéo enregistrée');
 }
};

/* ---------- démarrage ---------- */
function start(){
 if(!fb||!key()||started===key())return;started=key();
 sub('leaders');
 fb.D.get(fb.D.ref(fb.db,'loyalty/'+key()+'/fun')).then(function(s){
  var r=s.val();
  if(r){F.coupons=Math.max(F.coupons||0,r.coupons||0);
   if((r.lastDay||'')>(F.lastDay||'')){F.lastDay=r.lastDay;F.streak=r.streak||0}
   if((r.lastWheel||'')>(F.lastWheel||''))F.lastWheel=r.lastWheel;
   F.flashSeen=Math.max(F.flashSeen||0,r.flashSeen||0);F.price=Object.assign({},r.price||{},F.price)}
 }).catch(function(){}).then(function(){
  var t=today();if(F.lastDay!==t){F.streak=(F.lastDay===yest())?(F.streak||0)+1:1;F.lastDay=t}
  save();priceCheck();renderZone();
 });
}
setInterval(function(){
 if($('grid')&&!fp.parentNode){document.body.appendChild(fp);document.body.appendChild(vp)}
 start();
},1000);
var _rs=window.renderStore;
window.renderStore=function(){_rs();extra();renderZone()};
var _ra=window.renderAll;
window.renderAll=function(){_ra();priceCheck()};
})();
