/* BOUBA STORE – Boutiques & plus : suivre une boutique, prévenez-moi, bon cadeau, comparer, taille & questions, liste de souhaits, payer en 2 fois, lien & QR boutique
   Dépend de index.html, promos.js (PROMO.addCredit), features.js et fun.js */
(function(){
var DAY=864e5,LSK='p_F2',cache=null,cmp=[],booted=0,F=Object.assign({follows:[],seen:{},plans:[]},LS(LSK,{}));
var key=function(){return me&&me.key};
var P=function(id){return (S.products||{})[id]};
var sv=function(){SV(LSK,F)};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var intl=function(p){var d=String(p||'').replace(/\D/g,'');return (d.length===10&&d[0]==='0')?'225'+d:d};
var link=function(id){return location.origin+'/'+(id?'?boutique='+id:'')};
var wa=function(num,t){window.open('https://wa.me/'+(num||'')+'?text='+encodeURIComponent(t),'_blank')};
function shops(cb){
 if(cache)return cb(cache);
 import('./bouba-data.js').then(function(m){return Promise.all([m.list('boutiques'),m.list('articles')])})
  .then(function(r){cache={s:(r[0]||[]).filter(function(x){return x&&x.status!=='closed'}),a:r[1]||[]};cb(cache)})
  .catch(function(){cb({s:[],a:[]})});
}

/* ---------- styles + pages ---------- */
var css=document.createElement('style');
css.textContent='.p2c{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.p2c h3{color:gold;font-size:16px;margin:0 0 6px}.p2c p{font-size:14px;color:#ddd;margin:4px 0 8px}.p2s{display:flex;gap:8px;align-items:center;border-top:1px solid #333;padding:8px 0}.p2s img{width:50px;height:50px;border-radius:50%;object-fit:cover;border:2px solid #d4af37}.p2t{width:100%;border-collapse:collapse;font-size:14px}.p2t td,.p2t th{border:1px solid #333;padding:6px;text-align:center}.p2t th{color:gold}#cmpBar{position:fixed;right:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:150;display:none;background:gold;color:#000;font-weight:900;border:0;border-radius:24px;padding:10px 14px;font-size:14px}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='p2Page';pg.className='page';
var bar=document.createElement('button');bar.id='cmpBar';bar.onclick=function(){PL2.compare()};
var zone=document.createElement('div');zone.id='p2Zone';zone.style.cssText='padding:0 10px';
function card(t,b){return '<div class="p2c"><h3>'+t+'</h3>'+b+'</div>'}
function show(h){pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button>'+h;openPage('p2Page')}

/* ---------- cartes : comparer, taille, prévenez-moi ---------- */
function extra(){
 document.querySelectorAll('#grid .card[data-pid]').forEach(function(c){
  if(c.dataset.x)return;c.dataset.x=1;
  var id=c.dataset.pid,i=c.querySelector('.info'),b=c.querySelector('.info .btn'),p=P(id);if(!i)return;
  var d=document.createElement('div');d.className='pact';
  d.innerHTML='<button onclick="PL2.cmp(\''+id+'\',this)">⚖️ Comparer</button><button onclick="PL2.qa(\''+id+'\')">❓ Taille</button>';
  i.insertBefore(d,b);
  if(p&&p.stock===false){var e=document.createElement('div');e.className='pact';e.innerHTML='<button style="flex:1" onclick="PL2.notify(\''+id+'\')">🔔 Prévenez-moi</button>';i.insertBefore(e,b)}
 });
}

/* ---------- page Boutiques & plus ---------- */
function openMore(){
 show('<h2 style="color:gold;margin:10px 0">✨ BOUTIQUES & PLUS</h2><div id="p2Body"><p>Chargement…</p></div>');
 shops(function(c){
  var h='';
  h+=card('🏪 Boutiques',c.s.length?c.s.map(function(x){
   var a=c.a.filter(function(y){return y.shopId===x.id}),fl=F.follows.indexOf(x.id)>-1,nw=fl?a.filter(function(y){return (y.date||0)>(F.seen[x.id]||0)}).length:0;
   return '<div class="p2s"><img src="'+safeImg(x.avatar||'')+'" alt=""><div style="flex:1" onclick="PL2.shop(\''+x.id+'\')"><b>'+esc(x.name)+'</b>'+(nw?' <span style="color:#25d366">• '+nw+' nouveau(x)</span>':'')+'<br><span style="font-size:12px;color:#aaa">'+a.length+' article(s)</span></div><button class="mini" onclick="PL2.follow(\''+x.id+'\')">'+(fl?'✓ Suivie':'+ Suivre')+'</button><button class="mini" onclick="PL2.qr(\''+x.id+'\')">🔗</button></div>'}).join(''):'<p>Aucune boutique pour le moment.</p>');
  h+=card('🎁 Bon cadeau','<p>Offrez un bon à un proche. Choisissez le montant, nous vous envoyons le code après paiement.</p><div style="display:flex;gap:8px"><button class="gold" onclick="PL2.buyVoucher(5000)">5 000 F</button><button class="gold" onclick="PL2.buyVoucher(10000)">10 000 F</button></div><p style="margin-top:10px">Vous avez un code ?</p><input id="gcCode" class="input" placeholder="Code du bon"><button class="ghost" onclick="PL2.useVoucher()">Utiliser mon bon</button>');
  h+=card('💝 Liste de souhaits','<p>Envoyez vos favoris à vos proches sur WhatsApp.</p><button class="gold" onclick="PL2.wish()">Partager ma liste</button>');
  var pl=F.plans.slice().reverse();
  h+=card('💳 Paiements en 2 fois',pl.length?pl.map(function(x){return '<div class="p2s"><div style="flex:1">Commande #'+esc(x.id)+'<br><span style="font-size:12px;color:#aaa">Reste '+fmt(x.rest)+' F avant le '+new Date(x.due).toLocaleDateString('fr-FR')+'</span></div><button class="mini" onclick="PL2.paid(\''+x.id+'\')">✓ Payé</button></div>'}).join(''):'<p>Pour un panier de 20 000 F ou plus, choisissez « Payer en 2 fois » dans le panier.</p>');
  if(isAdmin)h+=card('🔧 Admin','<p>Créer un bon cadeau :</p><input id="gcAmt" class="input" type="number" placeholder="Montant en F (ex: 5000)"><button class="gold" onclick="PL2.mkVoucher()">Générer le code</button><p style="margin-top:12px">Clients en attente d\'un article :</p><div id="alList"><p>Chargement…</p></div>');
  $('p2Body').innerHTML=h;
  if(isAdmin)loadAlerts();
 });
}
function loadAlerts(){
 if(!fb)return;
 fb.D.get(fb.D.ref(fb.db,'alerts')).then(function(s){
  var v=s.val()||{},k=Object.keys(v);
  $('alList').innerHTML=k.length?k.map(function(id){var p=P(id);return '<div class="p2s"><div style="flex:1"><b>'+esc(p?p.name:id)+'</b><br>'+Object.keys(v[id]).length+' personne(s)</div><button class="mini" onclick="PL2.clearAlert(\''+id+'\')">Effacer</button></div>'}).join(''):'<p>Aucune demande.</p>';
 }).catch(function(){$('alList').innerHTML='<p>Accès refusé (vérifiez les règles).</p>'});
}

/* ---------- page boutique + QR ---------- */
function openShop(id){
 shops(function(c){
  var x=c.s.find(function(s){return s.id===id});if(!x){toast('Boutique introuvable');return}
  var a=c.a.filter(function(y){return y.shopId===id}).sort(function(p,q){return (q.date||0)-(p.date||0)});
  F.seen[id]=Date.now();sv();
  show('<div style="text-align:center"><img src="'+safeImg(x.avatar||'')+'" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #d4af37"><h2 style="color:gold">'+esc(x.name)+'</h2><p style="color:#ddd">'+esc(x.desc||'')+'</p><button class="mini" onclick="PL2.follow(\''+id+'\',1)">'+(F.follows.indexOf(id)>-1?'✓ Suivie':'+ Suivre')+'</button> <button class="mini" onclick="PL2.qr(\''+id+'\')">🔗 Lien & QR</button></div>'+
   (a.length?a.map(function(y){return '<div class="p2c" style="display:flex;gap:10px"><img src="'+safeImg(y.img)+'" style="width:90px;height:90px;border-radius:10px;object-fit:cover"><div style="flex:1"><b>'+esc(y.name)+'</b><br><span style="color:gold">'+fmt(y.price)+' F</span><br><button class="mini" style="margin-top:6px" onclick="PL2.ask(\''+y.id+'\')">💬 Commander</button></div></div>'}).join(''):'<p style="color:#aaa;text-align:center">Pas encore d\'article.</p>'));
 });
}
function qr(id){
 shops(function(c){
  var x=c.s.find(function(s){return s.id===id});if(!x)return;
  var l=link(id);
  show('<div class="p2c" style="text-align:center"><h3>'+esc(x.name)+'</h3><p>Imprimez ce QR code ou partagez le lien.</p><img alt="QR code" style="width:240px;height:240px;background:#fff;padding:8px;border-radius:10px" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data='+encodeURIComponent(l)+'"><p style="word-break:break-all;color:gold">'+esc(l)+'</p><button class="gold" onclick="PL2.copy(\''+id+'\')">Copier le lien</button><button class="ghost" onclick="PL2.shareShop(\''+id+'\')">Partager sur WhatsApp</button></div>');
 });
}

/* ---------- taille + questions ---------- */
function openQA(id){
 var p=P(id);if(!p)return;
 var q=Object.values((S.questions||{})[id]||{}).filter(function(x){return x&&x.q}).sort(function(a,b){return b.date-a.date});
 var sz=[['S','88-92'],['M','92-96'],['L','96-100'],['XL','100-106'],['XXL','106-112'],['3XL','112-118']];
 var h='<h2 style="color:gold;margin:10px 0">❓ '+esc(p.name)+'</h2>';
 h+=card('📏 Guide des tailles (indicatif)','<table class="p2t"><tr><th>Taille</th><th>Poitrine (cm)</th></tr>'+sz.map(function(s){return '<tr><td>'+s[0]+'</td><td>'+s[1]+'</td></tr>'}).join('')+'</table><p style="margin-top:8px">Chaussures : pointure 40 ≈ 25,5 cm, 42 ≈ 27 cm, 44 ≈ 28,5 cm. Les tailles varient selon le vendeur : en cas de doute, demandez ci-dessous.</p>');
 h+=card('Poser une question','<input id="qTxt" class="input" maxlength="190" placeholder="Votre question sur cet article"><button class="gold" onclick="PL2.sendQ(\''+id+'\')">Envoyer</button>');
 h+=card('Questions des clients',q.length?q.slice(0,15).map(function(x){return '<div class="p2s" style="display:block"><b>'+esc(x.name||'Client')+' :</b> '+esc(x.q)+'<br>'+(x.a?'<span style="color:#25d366">Réponse : '+esc(x.a)+'</span>':(isAdmin?'<input id="qa_'+x.id+'" class="input" placeholder="Votre réponse"><button class="mini" onclick="PL2.answer(\''+id+'\',\''+x.id+'\')">Répondre</button>':'<span style="color:#aaa">En attente de réponse</span>'))+'</div>'}).join(''):'<p>Aucune question pour le moment.</p>');
 show(h);
}

/* ---------- comparer ---------- */
function openCmp(){
 if(cmp.length<2){toast('Choisissez 2 articles à comparer');return}
 var a=cmp.map(P).filter(Boolean);if(a.length<2)return;
 var rate=function(id){var l=Object.values(((S.avis||{})[id])||{}).filter(function(x){return x&&x.stars});return l.length?(l.reduce(function(s,x){return s+x.stars},0)/l.length).toFixed(1)+'/5 ('+l.length+')':'Pas d\'avis'};
 var best=a[0].price<=a[1].price?0:1;
 var row=function(t,f){return '<tr><th>'+t+'</th>'+a.map(function(p,i){return '<td>'+f(p,i)+'</td>'}).join('')+'</tr>'};
 show('<h2 style="color:gold;margin:10px 0">⚖️ Comparer</h2><div class="p2c"><table class="p2t">'+
  row('',function(p){return '<img src="'+safeImg(p.img)+'" style="width:100%;border-radius:8px"><b>'+esc(p.name)+'</b>'})+
  row('Prix',function(p,i){return '<b style="color:'+(i===best?'#25d366':'gold')+'">'+fmt(p.price)+' F</b>'+(i===best?'<br>moins cher':'')})+
  row('Avis',function(p){return rate(p.id)})+
  row('Vues',function(p){return (+((S.views||{})[p.id])||0)})+
  row('Stock',function(p){return p.stock===false?'Épuisé':'Disponible'})+
  row('',function(p){return '<button class="mini" onclick="addCart(\''+p.id+'\')">🛒 Ajouter</button>'})+
  '</table></div>');
}
function updBar(){bar.style.display=cmp.length?'block':'none';bar.textContent='⚖️ Comparer ('+cmp.length+'/2)'}

/* ---------- payer en 2 fois ---------- */
function p2box(){
 var t=$('cartTotal');if(!t)return;
 var b=$('p2box');
 if(!b){b=document.createElement('label');b.id='p2box';b.style.cssText='display:none;margin:10px 0;color:gold;font-weight:700';b.innerHTML='<input type="checkbox" id="p2chk"> 💳 Payer en 2 fois (50 % maintenant, 50 % sous 15 jours)';t.parentNode.insertBefore(b,t.nextSibling)}
 var tot=cartSum();b.style.display=tot>=20000?'block':'none';
 if(tot<20000&&$('p2chk'))$('p2chk').checked=false;
}
var _rc=window.renderCart;
window.renderCart=function(){_rc();p2box()};
var _cm=window.commander;
window.commander=function(){
 var tot=cartSum(),two=$('p2chk')&&$('p2chk').checked&&tot>=20000&&cartItems().length,o=window.open;
 if(!two)return _cm();
 var half=Math.round(tot/2),rest=tot-half,due=Date.now()+15*DAY;
 window.open=function(u,t){window.open=o;var m=/Commande%20%23([^%]+)/.exec(u);
  if(m){F.plans.push({id:m[1],rest:rest,due:due});sv()}
  return o.call(window,u+encodeURIComponent('\nPaiement en 2 fois : '+fmt(half)+' F maintenant, '+fmt(rest)+' F avant le '+new Date(due).toLocaleDateString('fr-FR')),t)};
 try{_cm()}finally{window.open=o}
};

/* ---------- API ---------- */
window.PL2={
 open:openMore,shop:openShop,qr:qr,qa:openQA,compare:openCmp,
 follow:function(id,again){var i=F.follows.indexOf(id);if(i>-1)F.follows.splice(i,1);else F.follows.push(id);sv();toast(i>-1?'Boutique retirée':'✓ Vous suivez cette boutique');again?openShop(id):openMore()},
 cmp:function(id,btn){var i=cmp.indexOf(id);if(i>-1)cmp.splice(i,1);else{if(cmp.length>=2)cmp.shift();cmp.push(id)}
  document.querySelectorAll('#grid .card .pact button:first-child').forEach(function(b){var c=b.closest('.card');if(c&&c.dataset.pid&&b.textContent.indexOf('Comparer')>-1)b.style.background=cmp.indexOf(c.dataset.pid)>-1?'#3a2f00':'#000'});updBar()},
 notify:function(id){
  if(!me){alert('Connectez-vous d\'abord');return}
  write('alerts/'+id+'/'+key(),{name:me.name,phone:me.phone,date:Date.now()});toast('🔔 Nous vous préviendrons');
 },
 clearAlert:function(id){write('alerts/'+id,null);setTimeout(loadAlerts,400)},
 buyVoucher:function(n){wa(waNum(),'Bonjour, je veux acheter un bon cadeau de '+fmt(n)+' F.\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''))},
 mkVoucher:function(){
  var n=Number($('gcAmt').value);if(!(n>0)){alert('Entrez un montant');return}
  var c='BOUBA'+Math.random().toString(36).slice(2,8).toUpperCase();
  write('giftcodes/'+c,{amount:n,used:false,date:Date.now()});
  prompt('Code du bon de '+fmt(n)+' F (copiez-le) :',c);
 },
 useVoucher:function(){
  var c=($('gcCode').value||'').trim().toUpperCase();if(!c)return;
  if(!fb||!online){toast('Connexion requise');return}
  var r=fb.D.ref(fb.db,'giftcodes/'+c);
  fb.D.get(r).then(function(s){var v=s.val();
   if(!v||v.used){toast('Code invalide ou déjà utilisé');return}
   return fb.D.update(r,{used:true,usedBy:key(),ts:Date.now()}).then(function(){PROMO.addCredit(v.amount);toast('🎁 '+fmt(v.amount)+' F ajoutés à votre crédit');openMore()});
  }).catch(function(){toast('Code invalide ou déjà utilisé')});
 },
 wish:function(){
  var f=LS('p_fav',[]).map(P).filter(Boolean);
  if(!f.length){toast('Ajoutez d\'abord des favoris ❤️');return}
  window.open('https://wa.me/?text='+encodeURIComponent('💝 Ma liste de souhaits BOUBA STORE :\n'+f.map(function(p){return '• '+p.name+' — '+fmt(p.price)+' F'}).join('\n')+'\n'+link()),'_blank');
 },
 paid:function(id){F.plans=F.plans.filter(function(x){return x.id!==id});sv();toast('✓ Enregistré');openMore()},
 sendQ:function(id){
  var t=($('qTxt').value||'').trim().slice(0,190);if(!t||!me)return;
  var q=uid();write('questions/'+id+'/'+q,{id:q,q:t,name:me.name,date:Date.now()});toast('Question envoyée');setTimeout(function(){openQA(id)},300);
 },
 answer:function(pid,qid){
  var a=($('qa_'+qid).value||'').trim().slice(0,200);if(!a)return;
  var o=((S.questions||{})[pid]||{})[qid];if(!o)return;
  write('questions/'+pid+'/'+qid,Object.assign({},o,{a:a}));toast('Réponse envoyée');setTimeout(function(){openQA(pid)},300);
 },
 ask:function(id){
  shops(function(c){var y=c.a.find(function(z){return z.id===id});if(!y)return;
   wa(intl(y.phone),'Bonjour, je veux commander « '+y.name+' » ('+fmt(y.price)+' F) vu sur BOUBA STORE.\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''))})},
 copy:function(id){try{navigator.clipboard.writeText(link(id));toast('Lien copié')}catch(e){prompt('Copiez le lien :',link(id))}},
 shareShop:function(id){shops(function(c){var x=c.s.find(function(s){return s.id===id});wa('','Découvrez la boutique '+(x?x.name:'')+' sur BOUBA STORE : '+link(id))})}
};

/* ---------- accueil ---------- */
function renderZone(){
 var g=$('grid');if(!g)return;
 if(!zone.parentNode){var f=$('funZone')||$('trendZone');if(f&&f.parentNode)f.parentNode.insertBefore(zone,f.nextSibling);else g.parentNode.insertBefore(zone,g)}
 var n=0;
 if(cache)F.follows.forEach(function(id){n+=cache.a.filter(function(y){return y.shopId===id&&(y.date||0)>(F.seen[id]||0)}).length});
 zone.innerHTML='<button class="mini" style="width:100%;padding:12px;margin:4px 0" onclick="PL2.open()">✨ Boutiques, bons cadeaux & plus'+(n?' • '+n+' nouveauté(s)':'')+'</button>';
}
function boot(){
 if(!$('grid')||!fb)return;
 if(!pg.parentNode){document.body.appendChild(pg);document.body.appendChild(bar)}
 if(booted)return;booted=1;sub('questions');
 shops(function(){
  renderZone();
  var id=new URLSearchParams(location.search).get('boutique');
  if(id)setTimeout(function(){openShop(id)},600);
 });
}
setInterval(boot,1000);
var _rs=window.renderStore;
window.renderStore=function(){_rs();extra();renderZone()};
})();
