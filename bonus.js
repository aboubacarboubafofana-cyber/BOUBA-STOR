/* BOUBA STORE – Bonus : achat groupé, niveaux VIP, anniversaire, panier oublié, occasion, live shopping, reçu partageable, missions du jour
   Dépend de index.html, promos.js (PROMO.addCredit/addPts, PROMO_EXTRA), features.js, fun.js */
(function(){
var DAY=864e5,LSK='p_F3',started='',booted=0;
var F=Object.assign({bday:'',bdayYear:0,cartSig:'',cartAt:0,remind:'',mDate:'',mDone:{},mBonus:0,spent:0,orders:0},LS(LSK,{}));
var key=function(){return me&&me.key};
var P=function(id){return (S.products||{})[id]};
var today=function(){return new Date().toISOString().slice(0,10)};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var intl=function(p){var d=String(p||'').replace(/\D/g,'');return (d.length===10&&d[0]==='0')?'225'+d:d};
var link=function(){return location.origin+'/'};
function sv(){SV(LSK,F);if(key())write('loyalty/'+key()+'/vip',{spent:F.spent,orders:F.orders})}

/* ---------- niveaux VIP ---------- */
function level(){
 if(F.spent>=100000)return {n:'🥇 Or',pct:5,next:null};
 if(F.spent>=30000)return {n:'🥈 Argent',pct:3,next:100000,nn:'Or'};
 return {n:'🥉 Bronze',pct:0,next:30000,nn:'Argent'};
}

/* ---------- achat groupé ---------- */
function gb(id){
 var g=(S.groupbuy||{})[id];if(!g||!g.end||g.end<Date.now())return null;
 var m=g.members||{},n=Object.keys(m).length;
 return {target:g.target,pct:g.pct,end:g.end,n:n,ok:n>=g.target,member:!!(key()&&m[key()])};
}
window.PROMO_EXTRA=function(items){
 var d=0,tot=0;
 items.forEach(function(x){tot+=x.p.price*x.qty;var g=gb(x.p.id);if(g&&g.ok&&g.member)d+=Math.round(x.p.price*x.qty*g.pct/100)});
 return d+Math.round((tot-d)*level().pct/100);
};

/* ---------- styles + pages ---------- */
var css=document.createElement('style');
css.textContent='.bc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.bc h3{color:gold;font-size:16px;margin:0 0 6px}.bc p{font-size:14px;color:#ddd;margin:4px 0 8px}.bm{display:flex;gap:8px;align-items:center;padding:6px 0;border-top:1px solid #333}.bar2{height:10px;background:#2a2a2a;border-radius:6px;overflow:hidden;margin:6px 0}.bar2 i{display:block;height:100%;background:gold}.gbtn{width:100%;font-size:12px!important;padding:7px!important;border-radius:6px;border:1px solid #25d366;background:#04210f;color:#25d366;font-weight:800;margin:4px 0}.rem{background:#1a1400;border:1px solid gold;border-radius:10px;padding:8px 10px;margin:6px 0;color:#ffd700;font-size:14px;display:flex;gap:8px;align-items:center}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='bonusPage';pg.className='page';
var zone=document.createElement('div');zone.id='bonusZone';zone.style.cssText='padding:0 10px';
function bc(t,b){return '<div class="bc"><h3>'+t+'</h3>'+b+'</div>'}

/* ---------- cartes : achat groupé ---------- */
function extra(){
 document.querySelectorAll('#grid .card[data-pid]').forEach(function(c){
  if(c.dataset.g)return;c.dataset.g=1;
  var id=c.dataset.pid,g=gb(id),i=c.querySelector('.info'),b=c.querySelector('.info .btn');
  if(!g||!i)return;
  var d=document.createElement('div');
  d.innerHTML='<button class="gbtn" onclick="BON.join(\''+id+'\')">👥 Groupé '+g.n+'/'+g.target+' • -'+g.pct+'%'+(g.member?(g.ok?' ✓ Débloqué !':' ✓ Inscrit'):' • Rejoindre')+'</button>';
  i.insertBefore(d,b);
 });
}

/* ---------- page Bonus ---------- */
var MIS=[['fav','❤️ Ajouter un favori'],['share','📤 Partager un article ou l\'appli'],['wheel','🎡 Tourner la roue']];
function openBonus(){
 var lv=level(),h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🌟 BONUS</h2>';
 h+=bc('Mon niveau : '+lv.n,'<p>Vous avez dépensé <b>'+fmt(F.spent)+' F</b> en '+F.orders+' commande(s). '+(lv.pct?'Réduction permanente : <b>-'+lv.pct+' %</b>.':'')+'</p>'+(lv.next?'<div class="bar2"><i style="width:'+Math.min(100,F.spent*100/lv.next)+'%"></i></div><p>Encore '+fmt(lv.next-F.spent)+' F pour devenir '+lv.nn+(lv.nn==='Argent'?' (-3 %)':' (-5 %)')+'.</p>':'<p>Niveau maximum atteint, bravo !</p>'));
 var md=F.mDate===today()?F.mDone:{},nd=MIS.filter(function(m){return md[m[0]]}).length;
 h+=bc('🎯 Missions du jour ('+nd+'/3)','<p>+2 points par mission, et +500 F si vous faites les 3.</p>'+MIS.map(function(m){return '<div class="bm"><span style="flex:1">'+m[1]+'</span>'+(md[m[0]]?'✅':'⬜')+'</div>'}).join(''));
 h+=bc('🎂 Anniversaire',F.bday?'<p>Date enregistrée : <b>'+esc(F.bday)+'</b>. Vous recevez 1 000 F de crédit le jour J !</p>':'<p>Indiquez votre date de naissance pour recevoir 1 000 F de crédit le jour J (une seule fois).</p><div style="display:flex;gap:8px"><input id="bdD" class="input" type="number" min="1" max="31" placeholder="Jour"><input id="bdM" class="input" type="number" min="1" max="12" placeholder="Mois"></div><button class="gold" onclick="BON.setBday()">Enregistrer</button>');
 /* occasion */
 var us=Object.values(S.used||{}).filter(function(x){return x&&x.ok}).sort(function(a,b){return b.date-a.date}).slice(0,12);
 h+=bc('♻️ Occasion',(us.length?us.map(function(x){return '<div class="bm"><img src="'+safeImg(x.img)+'" style="width:64px;height:64px;border-radius:8px;object-fit:cover"><div style="flex:1"><b>'+esc(x.name)+'</b><br><span style="color:gold">'+fmt(x.price)+' F</span><br><span style="font-size:12px;color:#aaa">'+esc(x.desc||'')+'</span></div><button class="mini" onclick="BON.contact(\''+x.id+'\')">💬</button></div>'}).join(''):'<p>Aucun article d\'occasion pour le moment.</p>')+'<p style="margin-top:8px">Vous voulez vendre un article ? Une petite commission de BOUBA STORE s\'applique à la vente.</p><input id="usN" class="input" placeholder="Article (ex: Baskets pointure 42)"><input id="usP" class="input" type="number" placeholder="Prix en F"><input id="usD" class="input" placeholder="État (ex: très bon état)"><input type="file" id="usF" accept="image/*" class="input" onchange="BON.usedPhoto(this.files[0])"><button class="gold" onclick="BON.sellUsed()">Envoyer pour validation</button>');
 /* reçus */
 var oo=LS('p_orders',[]).slice().reverse().slice(0,8);
 h+=bc('🧾 Mes reçus',oo.length?oo.map(function(o){return '<div class="bm"><div style="flex:1">#'+esc(o.id)+' • '+fmt(o.total)+' F<br><span style="font-size:12px;color:#aaa">'+new Date(o.date).toLocaleDateString('fr-FR')+'</span></div><button class="mini" onclick="BON.receipt(\''+o.id+'\')">Partager</button></div>'}).join(''):'<p>Vos reçus apparaissent après une commande.</p>');
 if(isAdmin)h+=adminBlock();
 pg.innerHTML=h;openPage('bonusPage');
}
function adminBlock(){
 var o=Object.values(S.products||{}).filter(function(p){return p&&p.id}).map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('');
 var pend=Object.values(S.used||{}).filter(function(x){return x&&!x.ok}),lv=(S.info||{}).live||{};
 return bc('🔧 Admin bonus','<p><b>Achat groupé</b></p><select id="gbP" class="input">'+o+'</select><input id="gbT" class="input" type="number" placeholder="Nombre de personnes (ex: 5)"><input id="gbR" class="input" type="number" placeholder="Réduction en % (ex: 15)"><input id="gbD" class="input" type="number" placeholder="Durée en jours (ex: 3)"><button class="gold" onclick="BON.mkGroup()">Lancer le groupe</button><button class="ghost" onclick="BON.stopGroup()">Arrêter ce groupe</button>'+
  '<p style="margin-top:12px"><b>Live shopping</b> '+(lv.on?'🔴 en cours':'')+'</p><input id="lvU" class="input" placeholder="Lien du live (TikTok, Facebook…)" value="'+esc(lv.url||'')+'"><input id="lvT" class="input" placeholder="Titre du live" value="'+esc(lv.title||'')+'"><button class="gold" onclick="BON.live(true)">🔴 Démarrer</button><button class="ghost" onclick="BON.live(false)">Arrêter le live</button>'+
  '<p style="margin-top:12px"><b>Occasion à valider : '+pend.length+'</b></p>'+pend.map(function(x){return '<div class="bm"><img src="'+safeImg(x.img)+'" style="width:50px;height:50px;border-radius:8px;object-fit:cover"><div style="flex:1">'+esc(x.name)+' • '+fmt(x.price)+' F<br><span style="font-size:12px">'+esc(x.sname||'')+' '+esc(x.phone||'')+'</span></div><button class="mini" onclick="BON.okUsed(\''+x.id+'\')">✅</button><button class="mini" onclick="BON.delUsed(\''+x.id+'\')">🗑</button></div>'}).join(''));
}

/* ---------- reçu partageable ---------- */
function receipt(id){
 var o=LS('p_orders',[]).find(function(x){return x.id===id});if(!o)return;
 var items=o.items||[],H=300+items.length*44,c=document.createElement('canvas');c.width=600;c.height=H;var x=c.getContext('2d');
 x.fillStyle='#000';x.fillRect(0,0,600,H);x.strokeStyle='#d4af37';x.lineWidth=6;x.strokeRect(8,8,584,H-16);
 x.textAlign='center';x.fillStyle='#FFD700';x.font='bold 40px sans-serif';x.fillText('BOUBA STORE',300,70);
 x.fillStyle='#ddd';x.font='22px sans-serif';x.fillText('Reçu de commande #'+o.id,300,110);x.fillText(new Date(o.date).toLocaleString('fr-FR'),300,140);
 x.textAlign='left';x.fillStyle='#fff';x.font='24px sans-serif';
 items.forEach(function(t,i){x.fillText('• '+String(t).slice(0,38),40,200+i*44)});
 x.strokeStyle='#555';x.lineWidth=1;x.beginPath();x.moveTo(40,H-110);x.lineTo(560,H-110);x.stroke();
 x.fillStyle='#FFD700';x.font='bold 32px sans-serif';x.fillText('Total : '+fmt(o.total)+' F',40,H-65);
 x.textAlign='center';x.fillStyle='#aaa';x.font='20px sans-serif';x.fillText('Merci pour votre confiance !',300,H-25);
 c.toBlob(function(b){
  var f=new File([b],'recu-bouba-'+o.id+'.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Reçu BOUBA STORE'}).catch(function(){});
  else{var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();a.remove();toast('Reçu téléchargé')}
 });
}

/* ---------- missions ---------- */
function mission(k){
 if(F.mDate!==today()){F.mDate=today();F.mDone={};F.mBonus=0}
 if(F.mDone[k])return;F.mDone[k]=1;PROMO.addPts(2);toast('✅ Mission accomplie : +2 points');
 if(MIS.every(function(m){return F.mDone[m[0]]})&&!F.mBonus){F.mBonus=1;PROMO.addCredit(500);toast('🎉 3 missions : +500 F de crédit !')}
 sv();
}
document.addEventListener('click',function(e){
 var b=e.target.closest&&e.target.closest('button');if(!b||!me)return;
 if(b.classList.contains('pfav'))mission('fav');
 else if(/Partager|WhatsApp/.test(b.textContent)&&!b.closest('#bonusPage')&&!b.closest('#p2Page'))mission('share');
},true);

/* ---------- commande : cumul VIP ---------- */
var _cm=window.commander;
window.commander=function(){
 var tot=cartSum(),had=cartItems().length;_cm();
 if(had&&!cartItems().length){F.spent+=tot;F.orders++;sv();renderZone()}
};

/* ---------- API ---------- */
window.BON={
 open:openBonus,receipt:receipt,
 join:function(id){
  if(!me){alert('Connectez-vous d\'abord');return}
  var g=gb(id);if(!g)return;
  if(!g.member){write('groupbuy/'+id+'/members/'+key(),Date.now());toast('👥 Vous avez rejoint le groupe !')}
  var p=P(id);
  if(!g.ok)window.open('https://wa.me/?text='+encodeURIComponent('👥 Achat groupé BOUBA STORE : '+(p?p.name:'')+' à -'+g.pct+'% si on est '+g.target+' ! Rejoins-nous : '+link()),'_blank');
 },
 setBday:function(){
  var d=Number($('bdD').value),m=Number($('bdM').value);
  if(!(d>=1&&d<=31&&m>=1&&m<=12)){alert('Date invalide');return}
  F.bday=('0'+m).slice(-2)+'-'+('0'+d).slice(-2);sv();toast('🎂 Date enregistrée');openBonus();
 },
 usedPhoto:function(f){compress(f,600,function(img){window._usImg=img;toast('Photo prête')})},
 sellUsed:function(){
  var n=($('usN').value||'').trim(),p=Number($('usP').value),d=($('usD').value||'').trim();
  if(!me){alert('Connectez-vous d\'abord');return}
  if(!n||!p||!window._usImg){alert('Nom, prix et photo obligatoires');return}
  var id=uid();write('used/'+id,{id:id,name:n,price:p,desc:d,img:window._usImg,seller:key(),sname:me.name,phone:me.phone,date:Date.now(),ok:false});
  window._usImg='';toast('♻️ Envoyé : validation en cours');openBonus();
 },
 contact:function(id){
  var x=(S.used||{})[id];if(!x)return;
  window.open('https://wa.me/'+intl(x.phone)+'?text='+encodeURIComponent('Bonjour, l\'article « '+x.name+' » ('+fmt(x.price)+' F) vu sur BOUBA STORE est-il toujours disponible ?'),'_blank');
 },
 okUsed:function(id){write('used/'+id+'/ok',true);setTimeout(openBonus,400)},
 delUsed:function(id){write('used/'+id,null);setTimeout(openBonus,400)},
 mkGroup:function(){
  var t=Number($('gbT').value),r=Number($('gbR').value),d=Number($('gbD').value)||3;
  if(!(t>=2&&r>0&&r<100)){alert('Personnes (2 ou plus) et réduction (1 à 99 %)');return}
  write('groupbuy/'+$('gbP').value,{target:t,pct:r,end:Date.now()+d*DAY});toast('👥 Achat groupé lancé');
 },
 stopGroup:function(){write('groupbuy/'+$('gbP').value,null);toast('Groupe arrêté')},
 live:function(on){
  var u=($('lvU').value||'').trim();
  if(on&&!/^https:\/\//.test(u)){alert('Collez un lien commençant par https://');return}
  write('info/live',{on:!!on,url:u,title:($('lvT').value||'').trim()});toast(on?'🔴 Live démarré':'Live arrêté');
  if(on)fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'🔴 Live en cours',body:($('lvT').value||'Rejoignez notre live shopping !')})}).catch(function(){});
 },
 watch:function(){var l=(S.info||{}).live;if(l&&l.on&&l.url)window.open(l.url,'_blank')},
 cart:function(){openPage('cartPage')},
 dismiss:function(){F.remind=today();sv();renderZone()}
};
var _sp=window.PLAY&&PLAY.spin;
if(_sp)PLAY.spin=function(){_sp();mission('wheel')};

/* ---------- accueil : live, rappel panier, bouton Bonus ---------- */
function renderZone(){
 var g=$('grid');if(!g)return;
 if(!zone.parentNode){var f=$('p2Zone')||$('funZone')||$('trendZone');if(f&&f.parentNode)f.parentNode.insertBefore(zone,f.nextSibling);else g.parentNode.insertBefore(zone,g)}
 var h='',lv=(S.info||{}).live;
 if(lv&&lv.on&&lv.url)h+='<button class="gold" style="margin:4px 0;background:#d00;color:#fff" onclick="BON.watch()">🔴 EN DIRECT : '+esc(lv.title||'Live shopping')+'</button>';
 var n=0;try{n=cart.length}catch(e){}
 if(n&&F.remind!==today()&&F.cartAt&&Date.now()-F.cartAt>3600e3)h+='<div class="rem"><span style="flex:1">🛒 Vous avez oublié '+n+' article(s) dans votre panier !</span><button class="mini" onclick="BON.cart()">Voir</button><button class="mini" onclick="BON.dismiss()">✕</button></div>';
 h+='<button class="mini" style="width:100%;padding:12px;margin:4px 0" onclick="BON.open()">🌟 Niveau '+level().n+' • Missions • Occasion</button>';
 zone.innerHTML=h;
}

/* ---------- démarrage ---------- */
function start(){
 if(!fb||!key()||started===key())return;started=key();
 sub('groupbuy');sub('used');
 fb.D.get(fb.D.ref(fb.db,'loyalty/'+key()+'/vip')).then(function(s){var r=s.val();if(r){F.spent=Math.max(F.spent||0,r.spent||0);F.orders=Math.max(F.orders||0,r.orders||0)}}).catch(function(){}).then(function(){
  var d=new Date(),md=('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
  if(F.bday&&F.bday===md&&F.bdayYear!==d.getFullYear()){
   F.bdayYear=d.getFullYear();PROMO.addCredit(1000);toast('🎂 Joyeux anniversaire ! 1 000 F offerts');
   try{if(Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(function(r){r.showNotification('🎂 Joyeux anniversaire !',{body:'BOUBA STORE vous offre 1 000 F de crédit.',icon:'icon-192.png'})})}catch(e){}
  }
  try{if(cart.length&&F.cartAt&&Date.now()-F.cartAt>3600e3&&F.remind!==today()&&Notification.permission==='granted'&&navigator.serviceWorker)navigator.serviceWorker.ready.then(function(r){r.showNotification('🛒 Panier en attente',{body:'Vous avez oublié des articles dans votre panier.',icon:'icon-192.png'})})}catch(e){}
  sv();renderZone();
 });
}
setInterval(function(){
 if($('grid')&&!pg.parentNode)document.body.appendChild(pg);
 start();
 try{var sg=JSON.stringify(cart);if(sg!==F.cartSig){F.cartSig=sg;F.cartAt=Date.now();SV(LSK,F)}}catch(e){}
},5000);
setTimeout(function(){if($('grid')&&!pg.parentNode)document.body.appendChild(pg);start()},1500);
var _rs=window.renderStore;
window.renderStore=function(){_rs();extra();renderZone()};
})();
