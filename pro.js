/* BOUBA STORE – Portefeuille, tombola, vendeur du mois, prix de gros, point relais, suivi livreur, commander à nouveau, complétez le look
   Dépend de index.html, promos.js, features.js, suite.js, bonus.js, more.js */
(function(){
var started='',WAL=0,month=function(){return new Date().toISOString().slice(0,7)};
var key=function(){return me&&me.key};
var k10=function(){return String(key()||'').replace(/\D/g,'').slice(-10)};
var P=function(id){return (S.products||{})[id]};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var wa=function(t){window.open('https://wa.me/'+waNum()+'?text='+encodeURIComponent(t),'_blank')};
var who=function(){return ((me&&me.name)||'')+' / '+((me&&me.phone)||'')};
var shopsCache=null;
function shops(cb){
 if(shopsCache)return cb(shopsCache);
 import('./bouba-data.js').then(function(m){return m.list('boutiques')}).then(function(r){shopsCache=(r||[]).filter(function(x){return x&&x.status!=='closed'});cb(shopsCache)}).catch(function(){cb([])});
}

/* ---------- styles + pages ---------- */
var css=document.createElement('style');
css.textContent='.pc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.pc h3{color:gold;font-size:16px;margin:0 0 6px}.pc p{font-size:14px;color:#ddd;margin:4px 0 8px}.pr{display:flex;gap:8px;align-items:center;border-top:1px solid #333;padding:8px 0}.pr img{width:60px;height:60px;border-radius:8px;object-fit:cover}.whs{font-size:12px;color:#8ec0ff;margin:2px 0}.lkbtn{width:100%;font-size:12px!important;padding:7px!important;border-radius:6px;border:1px solid #c58cff;background:#14062a;color:#d9b0ff;font-weight:800;margin:4px 0}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='proPage';pg.className='page';
function pc(t,b){return '<div class="pc"><h3>'+t+'</h3>'+b+'</div>'}
function shell(title,h){pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">'+title+'</h2>'+h;openPage('proPage')}

/* ---------- prix de gros ---------- */
function wh(id){var w=(S.wholesale||{})[id];return (w&&w.qty>1&&w.pct>0)?w:null}
var _pe=window.PROMO_EXTRA;
window.PROMO_EXTRA=function(items){
 var d=_pe?_pe(items):0;
 items.forEach(function(x){var w=wh(x.p.id);if(w&&x.qty>=w.qty)d+=Math.round(x.p.price*x.qty*w.pct/100)});
 return d;
};

/* ---------- point relais : livraison gratuite ---------- */
var relays=function(){var r=(S.info||{}).relays;return r?Object.values(r).filter(Boolean):[]};
var _pf=window.PROMO_FEE;
window.PROMO_FEE=function(b){return LS('p_relay','')?0:(_pf?_pf(b):0)};

/* ---------- panier : portefeuille, relais, look ---------- */
function after(el,ref){if(ref&&ref.parentNode)ref.parentNode.insertBefore(el,ref.nextSibling)}
function cartExtras(){
 var t=$('cartTotal');if(!t)return;
 var anchor=$('dlvBox')||t;
 var empty=!cartItems().length;
 /* relais */
 var rb=$('rlyBox'),rl=relays();
 if(!rb){rb=document.createElement('div');rb.id='rlyBox';rb.style.cssText='margin:10px 0;color:gold;font-weight:700';after(rb,anchor)}
 if(empty||!rl.length)rb.style.display='none';
 else{rb.style.display='block';var c=LS('p_relay','');
  rb.innerHTML='🏬 Retrait en point relais (gratuit) : <select id="rlySel" class="input" style="margin:6px 0"><option value="">Non, livraison à domicile</option>'+rl.map(function(r){return '<option'+(r===c?' selected':'')+'>'+esc(r)+'</option>'}).join('')+'</select>';
  $('rlySel').onchange=function(){SV('p_relay',this.value);renderCart()}}
 /* portefeuille */
 var wb=$('wlBox');
 if(!wb){wb=document.createElement('label');wb.id='wlBox';wb.style.cssText='display:none;margin:10px 0;color:gold;font-weight:700';wb.innerHTML='<input type="checkbox" id="wlChk"> 💰 Payer avec mon portefeuille (solde <span id="wlBal"></span> F)';after(wb,rb)}
 wb.style.display=(!empty&&WAL>0)?'block':'none';$('wlBal').textContent=fmt(WAL);
 /* look */
 var lb=$('lkBox');
 if(!lb){lb=document.createElement('div');lb.id='lkBox';after(lb,wb)}
 var sg=empty?[]:suggest(cartItems().map(function(x){return x.p.id}),3);
 lb.innerHTML=sg.length?'<div style="color:gold;font-weight:700;margin:10px 0 4px">👗 Complétez votre look</div>'+sg.map(function(p){return '<div class="pr"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span></div><button class="mini" onclick="addCart(\''+p.id+'\')">+ Ajouter</button></div>'}).join(''):'';
}
function suggest(ids,n){
 var cats={};ids.forEach(function(i){var p=P(i);if(p)cats[(p.cat||'').toLowerCase()]=1});
 var v=function(p){return +((S.views||{})[p.id])||0};
 return Object.values(S.products||{}).filter(function(p){return p&&p.id&&p.stock!==false&&ids.indexOf(p.id)<0&&!cats[(p.cat||'').toLowerCase()]})
  .sort(function(a,b){return v(b)-v(a)||(b.date||0)-(a.date||0)}).slice(0,n);
}
var _rc=window.renderCart;
window.renderCart=function(){_rc();cartExtras()};

/* ---------- commande : portefeuille, relais, mémoire pour recommander ---------- */
var _cm=window.commander;
window.commander=function(){
 var items=cartItems();
 if(!items.length||!me)return _cm();
 var snap=JSON.parse(JSON.stringify(cart)),tot=cartSum(),relay=LS('p_relay',''),o=window.open;
 var useW=$('wlChk')&&$('wlChk').checked&&WAL>0,used=useW?Math.min(WAL,tot):0;
 window.open=function(u,t){window.open=o;
  var m=/Commande%20%23([^%]+)/.exec(u),x='';
  if(relay)x+='\nRetrait : point relais '+relay;
  if(used)x+='\nPayé par portefeuille : '+fmt(used)+' F (reste '+fmt(tot-used)+' F)';
  if(m){var R=LS('p_reord',{});R[m[1]]=snap;var ks=Object.keys(R);if(ks.length>20)delete R[ks[0]];SV('p_reord',R)}
  return o.call(window,x?u+encodeURIComponent(x):u,t)};
 try{_cm()}finally{window.open=o}
 if(used&&!cartItems().length){write('wallet/'+k10(),WAL-used);toast('💰 '+fmt(used)+' F déduits de votre portefeuille')}
};

/* ---------- cartes : gros + look ---------- */
function extra(){
 document.querySelectorAll('#grid .card[data-pid]').forEach(function(c){
  if(c.dataset.pro)return;c.dataset.pro=1;
  var id=c.dataset.pid,i=c.querySelector('.info'),b=c.querySelector('.info .btn');if(!i)return;
  var w=wh(id);
  if(w){var d=document.createElement('div');d.className='whs';d.textContent='📦 Gros : -'+w.pct+'% dès '+w.qty+' articles';i.insertBefore(d,b)}
  var e=document.createElement('div');e.innerHTML='<button class="lkbtn" onclick="PRO.look(\''+id+'\')">👗 Complétez le look</button>';i.insertBefore(e,b);
 });
}

/* ---------- page Portefeuille & tombola ---------- */
function openWallet(){
 var h='';
 h+=pc('💰 Mon portefeuille','<p>Solde : <b style="color:gold;font-size:22px">'+fmt(WAL)+' F</b></p><p>Rechargez par Wave ou Orange Money, puis payez vos commandes en un clic (case dans le panier).</p><button class="gold" onclick="PRO.recharge(5000)">+ 5 000 F</button> <button class="gold" onclick="PRO.recharge(10000)">+ 10 000 F</button> <button class="ghost" onclick="PRO.recharge(0)">Autre montant</button>');
 var tb=Object.values(S.tombola||{}).filter(function(x){return x&&x.id}).sort(function(a,b){return b.date-a.date}).slice(0,3);
 h+=pc('🎟️ Tombola',tb.length?tb.map(tombolaRow).join(''):'<p>Aucune tombola en ce moment.</p>');
 var wl=Object.values(S.wholesale?Object.keys(S.wholesale).map(function(id){return Object.assign({id:id},S.wholesale[id])}):[]);
 h+=pc('📦 Prix de gros',wl.length?wl.map(function(w){var p=P(w.id);return p?'<div class="pr"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name)+'</b><br>-'+w.pct+'% dès '+w.qty+' articles</div><button class="mini" onclick="addCart(\''+p.id+'\')">🛒</button></div>':''}).join(''):'<p>Revendeurs : demandez un tarif de gros sur WhatsApp.</p><button class="ghost" onclick="PRO.gros()">Demander un prix de gros</button>');
 h+=pc('🏅 Vendeur du mois','<div id="topShop"><p>Chargement…</p></div>');
 if(isAdmin)h+=adminBlock();
 shell('💰 PORTEFEUILLE & PLUS',h);
 topShop();
}
function tombolaRow(t){
 var tk=Object.entries(t.tickets||{}).map(function(e){return Object.assign({id:e[0]},e[1])}),mine=tk.filter(function(x){return x.by&&x.by===k10()}).length,live=t.end>Date.now()&&!t.winner;
 var s='<div class="pr" style="display:block"><b>🎁 '+esc(t.prize)+'</b><br>Ticket : <b style="color:gold">'+fmt(t.price)+' F</b> • '+tk.length+' ticket(s) vendus'+(mine?' • <b>vous : '+mine+'</b>':'')+'<br>';
 if(t.winner)s+='🏆 Gagnant : <b>'+esc(t.winner.name)+'</b>';
 else if(live)s+='⏱ Fin le '+new Date(t.end).toLocaleDateString('fr-FR')+'<br><button class="mini" onclick="PRO.ticket(\''+t.id+'\')">🎟️ Acheter un ticket (portefeuille)</button> <button class="mini" onclick="PRO.ticketWA(\''+t.id+'\')">💬 Par Wave / Orange</button>';
 else s+='Terminée, tirage en attente.';
 if(isAdmin)s+='<br><button class="mini" onclick="PRO.draw(\''+t.id+'\')">🎲 Tirer au sort</button> <button class="mini" onclick="PRO.delTombola(\''+t.id+'\')">🗑</button>';
 return s+'</div>';
}
function topShop(){
 shops(function(sh){
  var b=$('topShop');if(!b)return;
  var id=(S.info||{}).topShop,x=sh.find(function(s){return s.id===id}),v=((S.shopviews||{})[month()])||{};
  var rank=sh.map(function(s){return {s:s,n:+v[s.id]||0}}).sort(function(a,c){return c.n-a.n}).slice(0,3);
  b.innerHTML=(x?'<div class="pr"><img src="'+safeImg(x.avatar||'')+'"><div style="flex:1"><b>🏅 '+esc(x.name)+'</b><br><span style="font-size:12px;color:#aaa">Choisie par BOUBA STORE</span></div><button class="mini" onclick="PL2.shop(\''+x.id+'\')">Voir</button></div>':'<p>Bientôt annoncé.</p>')+
   '<p style="margin-top:8px"><b>Les plus visitées ce mois</b></p>'+rank.map(function(r,i){return '<div class="pr"><span>'+['🥇','🥈','🥉'][i]+'</span><div style="flex:1">'+esc(r.s.name)+'</div><span style="color:#aaa">'+r.n+' visite(s)</span></div>'}).join('');
  var sel=$('tpS');if(sel&&!sel.options.length)sel.innerHTML=sh.map(function(s){return '<option value="'+s.id+'">'+esc(s.name)+'</option>'}).join('');
 });
}
function adminBlock(){
 var o=Object.values(S.products||{}).filter(function(p){return p&&p.id}).map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('');
 var od=Object.values(S.orders||{}).filter(function(x){return x&&x.id}).sort(function(a,b){return (b.date||0)-(a.date||0)}).slice(0,12).map(function(x){return '<option value="'+x.id+'">#'+esc(x.id)+' • '+esc(x.name||'')+' • '+fmt(x.total||0)+' F</option>'}).join('');
 return pc('🔧 Admin','<p><b>Recharger un portefeuille</b></p><input id="wP" class="input" placeholder="Téléphone du client"><input id="wA" class="input" type="number" placeholder="Montant (F)"><button class="gold" onclick="PRO.credit()">Créditer</button>'+
  '<p style="margin-top:12px"><b>Tombola</b></p><input id="tbN" class="input" placeholder="Lot à gagner"><input id="tbP" class="input" type="number" placeholder="Prix du ticket (F)"><input id="tbD" class="input" type="number" placeholder="Durée en jours"><button class="gold" onclick="PRO.mkTombola()">Lancer</button><p style="margin-top:8px">Tickets payés en cash : </p><select id="tkS" class="input">'+Object.values(S.tombola||{}).filter(function(x){return x&&x.id}).map(function(x){return '<option value="'+x.id+'">'+esc(x.prize)+'</option>'}).join('')+'</select><input id="tkN" class="input" placeholder="Nom du client"><input id="tkQ" class="input" type="number" placeholder="Nombre de tickets"><button class="ghost" onclick="PRO.addTickets()">Ajouter les tickets</button>'+
  '<p style="margin-top:12px"><b>Prix de gros</b></p><select id="whP" class="input">'+o+'</select><input id="whQ" class="input" type="number" placeholder="À partir de (quantité)"><input id="whR" class="input" type="number" placeholder="Réduction %"><button class="gold" onclick="PRO.mkWhole()">Enregistrer</button><button class="ghost" onclick="PRO.delWhole()">Retirer pour cet article</button>'+
  '<p style="margin-top:12px"><b>Points relais</b> (un par ligne)</p><textarea id="rlT" class="input" rows="4">'+esc(relays().join('\n'))+'</textarea><button class="gold" onclick="PRO.saveRelays()">Enregistrer</button>'+
  '<p style="margin-top:12px"><b>Vendeur du mois</b></p><select id="tpS" class="input"></select><button class="gold" onclick="PRO.setTop()">Désigner</button>'+
  '<p style="margin-top:12px"><b>Affecter un livreur</b></p><select id="dvO" class="input">'+od+'</select><input id="dvN" class="input" placeholder="Nom du livreur"><input id="dvP" class="input" placeholder="Téléphone du livreur"><button class="gold" onclick="PRO.mkDelivery()">Affecter et passer « en livraison »</button>');
}

/* ---------- page Commandes & livraisons ---------- */
function openOrders(){
 var oo=LS('p_orders',[]).slice().reverse(),R=LS('p_reord',{});
 var h=pc('🔁 Mes commandes',oo.length?oo.map(function(o){
  var st=(S.ostatus||{})[o.id]||'en attente',d=(S.delivery||{})[o.id],s='<div class="pr" style="display:block"><b style="color:gold">#'+esc(o.id)+'</b> • '+new Date(o.date).toLocaleDateString('fr-FR')+' • '+fmt(o.total)+' F<br>'+esc((o.items||[]).join(', '))+'<br>Statut : <b>'+esc(st)+'</b>';
  if(d)s+='<br>🛵 Livreur : <b>'+esc(d.name)+'</b> <a class="mini" style="text-decoration:none;display:inline-block" href="tel:'+esc(String(d.phone).replace(/[^\d+]/g,''))+'">📞 Appeler</a>';
  if(R[o.id])s+='<br><button class="mini" style="margin-top:6px" onclick="PRO.again(\''+o.id+'\')">🔁 Commander à nouveau</button>';
  return s+'</div>'}).join(''):'<p>Aucune commande pour le moment.</p>');
 shell('🔁 COMMANDES & LIVRAISONS',h);
}
function openLook(id){
 var p=P(id);if(!p)return;
 var sg=suggest([id],3);
 shell('👗 Complétez le look',pc(esc(p.name),'<div class="pr"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span></div><button class="mini" onclick="addCart(\''+p.id+'\')">+ Ajouter</button></div>')+
  pc('Ça va bien avec',sg.length?sg.map(function(q){return '<div class="pr"><img src="'+safeImg(q.img)+'"><div style="flex:1"><b>'+esc(q.name)+'</b><br><span style="color:gold">'+fmt(q.price)+' F</span></div><button class="mini" onclick="addCart(\''+q.id+'\')">+ Ajouter</button></div>'}).join('')+'<button class="gold" style="margin-top:8px" onclick="PRO.addLook(\''+id+'\')">Tout ajouter au panier</button>':'<p>Pas encore de suggestion.</p>'));
}

/* ---------- API ---------- */
window.PRO={
 wallet:openWallet,orders:openOrders,look:openLook,
 recharge:function(n){
  if(!n){var v=prompt('Montant à recharger (en F) :');n=Number(String(v||'').replace(/\D/g,''));if(!n)return}
  wa('Bonjour, je veux recharger mon portefeuille BOUBA de '+fmt(n)+' F.\nClient : '+who());
 },
 gros:function(){wa('Bonjour, je suis revendeur et je veux un prix de gros.\nClient : '+who())},
 again:function(id){
  var R=LS('p_reord',{})[id];if(!R)return;
  R.forEach(function(c){var p=P(c.id);if(p&&p.stock!==false)for(var i=0;i<c.qty;i++)addCart(c.id)});
  toast('🔁 Articles remis dans le panier');openPage('cartPage');
 },
 addLook:function(id){suggest([id],3).forEach(function(p){addCart(p.id)});toast('👗 Ajouté au panier')},
 ticket:function(id){
  var t=(S.tombola||{})[id];if(!t||!me)return;
  if(WAL<t.price){toast('Solde insuffisant : rechargez votre portefeuille');return}
  var tk=uid();
  write('wallet/'+k10(),WAL-t.price);
  write('tombola/'+id+'/tickets/'+tk,{name:me.name,by:k10(),date:Date.now()});
  toast('🎟️ Ticket acheté !');setTimeout(openWallet,500);
 },
 ticketWA:function(id){var t=(S.tombola||{})[id];if(t)wa('Bonjour, je veux un ticket de tombola « '+t.prize+' » ('+fmt(t.price)+' F).\nClient : '+who())},
 credit:function(){
  var k=($('wP').value||'').replace(/\D/g,'').slice(-10),a=Number($('wA').value);
  if(k.length<8||!(a>0)){alert('Téléphone et montant obligatoires');return}
  fb.D.get(fb.D.ref(fb.db,'wallet/'+k)).then(function(s){var cur=+s.val()||0;write('wallet/'+k,cur+a);toast('💰 '+fmt(a)+' F ajoutés (solde '+fmt(cur+a)+' F)')}).catch(function(){write('wallet/'+k,a)});
 },
 mkTombola:function(){
  var n=($('tbN').value||'').trim(),p=Number($('tbP').value),d=Number($('tbD').value)||7;
  if(!n||!(p>0)){alert('Lot et prix du ticket obligatoires');return}
  var id=uid();write('tombola/'+id,{id:id,prize:n,price:p,end:Date.now()+d*864e5,date:Date.now()});toast('🎟️ Tombola lancée');setTimeout(openWallet,500);
  fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'🎟️ Nouvelle tombola',body:n+' à gagner dès '+fmt(p)+' F'})}).catch(function(){});
 },
 addTickets:function(){
  var id=$('tkS').value,n=($('tkN').value||'').trim(),q=Number($('tkQ').value)||1;
  if(!id||!n){alert('Choisissez la tombola et le nom');return}
  for(var i=0;i<Math.min(q,50);i++)write('tombola/'+id+'/tickets/'+uid(),{name:n,by:'',date:Date.now()});
  toast('🎟️ '+q+' ticket(s) ajoutés');setTimeout(openWallet,600);
 },
 draw:function(id){
  var t=(S.tombola||{})[id],tk=Object.values((t&&t.tickets)||{});
  if(!tk.length){alert('Aucun ticket vendu');return}
  var w=tk[Math.floor(Math.random()*tk.length)];
  write('tombola/'+id+'/winner',{name:w.name,date:Date.now()});alert('🏆 Gagnant : '+w.name);setTimeout(openWallet,500);
 },
 delTombola:function(id){if(confirm('Supprimer cette tombola ?')){write('tombola/'+id,null);setTimeout(openWallet,500)}},
 mkWhole:function(){
  var q=Number($('whQ').value),r=Number($('whR').value);
  if(!(q>1&&r>0&&r<100)){alert('Quantité (2 ou plus) et réduction (1 à 99 %)');return}
  write('wholesale/'+$('whP').value,{qty:q,pct:r});toast('📦 Prix de gros enregistré');
 },
 delWhole:function(){write('wholesale/'+$('whP').value,null);toast('Prix de gros retiré')},
 saveRelays:function(){
  var l=($('rlT').value||'').split('\n').map(function(x){return x.trim()}).filter(Boolean);
  write('info/relays',l.length?l:null);toast('🏬 Points relais enregistrés');
 },
 setTop:function(){var v=$('tpS').value;if(v){write('info/topShop',v);toast('🏅 Vendeur du mois désigné')}},
 mkDelivery:function(){
  var id=$('dvO').value,n=($('dvN').value||'').trim(),p=($('dvP').value||'').trim();
  if(!id||!n||!p){alert('Commande, nom et téléphone obligatoires');return}
  write('delivery/'+id,{name:n,phone:p});
  if(window.setStatus)window.setStatus(id,'livraison');else write('ostatus/'+id,'livraison');
  toast('🛵 Livreur affecté');
 }
};

/* ---------- démarrage ---------- */
function start(){
 if(!fb||!key()||started===key())return;started=key();
 ['tombola','shopviews','wholesale','delivery'].forEach(function(r){sub(r)});
 try{fb.D.onValue(fb.D.ref(fb.db,'wallet/'+k10()),function(s){WAL=+s.val()||0;renderCart()},function(){})}catch(e){}
 /* visites des boutiques */
 if(window.PL2&&PL2.shop&&!PL2._w){PL2._w=1;var _s=PL2.shop;PL2.shop=function(id){
  try{fb.D.set(fb.D.ref(fb.db,'shopviews/'+month()+'/'+id),fb.D.increment(1))}catch(e){}
  return _s(id)}}
}
setInterval(function(){
 if($('grid')&&!pg.parentNode)document.body.appendChild(pg);
 start();
},1500);
var _rs=window.renderStore;
window.renderStore=function(){_rs();extra()};
})();
