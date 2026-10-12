/* BOUBA STORE – BOUBA+, ambassadeurs, livraison par commune, boîtes surprise, enchères, précommande, sondages
   (l'avis avec photo est dans features.js). Dépend de index.html, promos.js (PROMO_FEE), features.js, fun.js, suite.js, bonus.js */
(function(){
var HOUR=36e5,DAY=864e5,started='',booted=0,PLUS=null;
var DLV={'Cocody':1000,'Plateau':1000,'Adjamé':1000,'Marcory':1000,'Treichville':1000,'Koumassi':1500,'Port-Bouët':1500,'Yopougon':1500,'Abobo':1500,'Bingerville':2000,'Anyama':2000,'Autre (à convenir)':0};
var key=function(){return me&&me.key};
var P=function(id){return (S.products||{})[id]};
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var intl=function(p){var d=String(p||'').replace(/\D/g,'');return (d.length===10&&d[0]==='0')?'225'+d:d};
var wa=function(num,t){window.open('https://wa.me/'+(num||'')+'?text='+encodeURIComponent(t),'_blank')};
var table=function(){var d=(S.info||{}).delivery;return (d&&typeof d==='object'&&Object.keys(d).length)?d:DLV};
function plusActive(){return PLUS&&PLUS.until>Date.now()}
function feeNow(){var c=LS('p_comm',''),t=table();if(!c||t[c]===undefined)return 0;var f=+t[c]||0;return plusActive()?Math.round(f/2):f}

/* ---------- livraison : frais ajoutés au panier ---------- */
window.PROMO_FEE=function(base){return base>0?feeNow():0};
function dlvBox(){
 var t=$('cartTotal');if(!t)return;
 var b=$('dlvBox');
 if(!b){b=document.createElement('div');b.id='dlvBox';b.style.cssText='margin:10px 0;color:gold;font-weight:700';t.parentNode.insertBefore(b,t.nextSibling)}
 if(!cartItems().length){b.style.display='none';return}
 b.style.display='block';
 var tb=table(),c=LS('p_comm','');
 b.innerHTML='🚚 Livraison : <select id="dlvSel" class="input" style="margin:6px 0"><option value="">Choisir ma commune</option>'+Object.keys(tb).map(function(k){return '<option value="'+esc(k)+'"'+(k===c?' selected':'')+'>'+esc(k)+' — '+(tb[k]?fmt(plusActive()?Math.round(tb[k]/2):tb[k])+' F':'à convenir')+'</option>'}).join('')+'</select>'+(plusActive()?'<div style="font-size:12px;color:#25d366">⭐ BOUBA+ : livraison -50 %</div>':'');
 $('dlvSel').onchange=function(){SV('p_comm',this.value);renderCart()};
}
var _rc=window.renderCart;
window.renderCart=function(){_rc();dlvBox()};

/* ---------- commande : livraison + ambassadeur ---------- */
(function(){var p=new URLSearchParams(location.search).get('amb');if(p)SV('p_amb',p.toUpperCase())})();
var _cm=window.commander;
window.commander=function(){
 if(!cartItems().length||!me)return _cm();
 var fee=feeNow(),com=LS('p_comm',''),amb=LS('p_amb',''),tot=cartSum()-fee,o=window.open;
 if(amb&&!((S.ambassadors||{})[amb]))amb='';
 window.open=function(u,t){window.open=o;
  var m=/Commande%20%23([^%]+)/.exec(u),x='';
  if(com)x+='\nLivraison : '+com+' '+(fee?fmt(fee)+' F':'(à convenir)');else x+='\nLivraison : commune à préciser';
  if(amb){x+='\nAmbassadeur : '+amb;if(m)write('commissions/'+m[1],{code:amb,total:tot,date:Date.now()})}
  return o.call(window,u+encodeURIComponent(x),t)};
 try{_cm()}finally{window.open=o}
};

/* ---------- styles + page ---------- */
var css=document.createElement('style');
css.textContent='.mc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.mc h3{color:gold;font-size:16px;margin:0 0 6px}.mc p{font-size:14px;color:#ddd;margin:4px 0 8px}.mr{display:flex;gap:8px;align-items:center;border-top:1px solid #333;padding:8px 0}.mr img{width:64px;height:64px;border-radius:8px;object-fit:cover}.mb{height:12px;background:#2a2a2a;border-radius:6px;overflow:hidden;margin:3px 0}.mb i{display:block;height:100%;background:gold}.prebtn{width:100%;font-size:12px!important;padding:7px!important;border-radius:6px;border:1px solid #6aa9ff;background:#06122a;color:#8ec0ff;font-weight:800;margin:4px 0}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='moreAPage';pg.className='page';
var zone=document.createElement('div');zone.id='moreAZone';zone.style.cssText='padding:0 10px';
function mc(t,b){return '<div class="mc"><h3>'+t+'</h3>'+b+'</div>'}
function left(e){var s=Math.max(0,Math.floor((e-Date.now())/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return (d?d+'j ':'')+h+'h '+m+'min'}

/* ---------- cartes : précommande ---------- */
function extra(){
 document.querySelectorAll('#grid .card[data-pid]').forEach(function(c){
  if(c.dataset.pr)return;c.dataset.pr=1;
  var id=c.dataset.pid,r=(S.preorders||{})[id],i=c.querySelector('.info'),b=c.querySelector('.info .btn');
  if(!r||!i)return;
  var d=document.createElement('div');d.innerHTML='<button class="prebtn" onclick="PM.pre(\''+id+'\')">📅 Précommander • acompte '+r.pct+'%</button>';
  i.insertBefore(d,b);
 });
}

/* ---------- page principale ---------- */
function openMore(){
 var h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🚀 BOUBA+ & PLUS</h2>';
 /* BOUBA+ */
 h+=mc('⭐ BOUBA+',plusActive()?'<p>Vous êtes membre jusqu\'au <b>'+new Date(PLUS.until).toLocaleDateString('fr-FR')+'</b>.<br>Avantage : <b>livraison à moitié prix</b>.</p>':'<p>2 000 F par mois : <b>livraison à -50 %</b> sur toutes vos commandes.</p><button class="gold" onclick="PM.subscribe()">Je m\'abonne</button>');
 /* livraison */
 var tb=table();
 h+=mc('🚚 Frais de livraison',Object.keys(tb).map(function(k){return '<div class="mr"><span style="flex:1">'+esc(k)+'</span><b style="color:gold">'+(tb[k]?fmt(tb[k])+' F':'à convenir')+'</b></div>'}).join('')+'<p style="margin-top:8px">Choisissez votre commune dans le panier. L\'état de votre livraison se suit dans « Mes commandes ».</p>');
 /* boîtes surprise */
 var bx=Object.values(S.products||{}).filter(function(p){return p&&p.id&&(/surprise/i.test(p.cat||'')||/surprise/i.test(p.name||''))&&p.stock!==false});
 h+=mc('🎁 Boîtes surprise',bx.length?bx.map(function(p){return '<div class="mr"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span></div><button class="mini" onclick="addCart(\''+p.id+'\')">🛒</button></div>'}).join(''):'<p>Bientôt : des boîtes mystère à prix fixe, pleines de surprises.</p>');
 /* enchères */
 var au=Object.values(S.auctions||{}).filter(function(a){return a&&a.id}).sort(function(a,b){return b.end-a.end}).slice(0,5);
 h+=mc('🔨 Enchères',au.length?au.map(auctionRow).join(''):'<p>Aucune enchère en ce moment.</p>');
 /* précommandes */
 var pr=Object.keys(S.preorders||{}).map(function(id){return P(id)}).filter(Boolean);
 h+=mc('📅 Précommandes',pr.length?pr.map(function(p){var r=S.preorders[p.id];return '<div class="mr"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name)+'</b><br>'+fmt(p.price)+' F • acompte '+r.pct+'%<br><span style="font-size:12px;color:#aaa">'+esc(r.eta||'')+'</span></div><button class="mini" onclick="PM.pre(\''+p.id+'\')">Réserver</button></div>'}).join(''):'<p>Aucune précommande ouverte.</p>');
 /* sondages */
 var po=Object.values(S.polls||{}).filter(function(x){return x&&x.id}).sort(function(a,b){return b.date-a.date}).slice(0,3);
 h+=mc('🗳️ Sondages',po.length?po.map(pollRow).join(''):'<p>Aucun sondage pour le moment.</p>');
 /* ambassadeur */
 h+=mc('🤝 Devenir ambassadeur','<p>Partagez votre lien personnel et gagnez une commission sur chaque commande.</p><button class="gold" onclick="PM.beAmb()">Je veux devenir ambassadeur</button>');
 if(isAdmin)h+=adminBlock();
 pg.innerHTML=h;openPage('moreAPage');
 if(isAdmin)loadComm();
}
function auctionRow(a){
 var p=P(a.pid)||{},bids=Object.entries(a.bids||{}).map(function(e){return Object.assign({id:e[0]},e[1])}),top=null;
 bids.forEach(function(b){if(!top||b.amt>top.amt||(b.amt===top.amt&&b.date<top.date))top=b});
 var live=a.end>Date.now(),cur=top?top.amt:a.start,min=top?top.amt+a.step:a.start;
 var s='<div class="mr" style="align-items:flex-start"><img src="'+safeImg(p.img)+'"><div style="flex:1"><b>'+esc(p.name||'Article')+'</b><br>'+(top?'Offre actuelle :':'Mise de départ :')+' <b style="color:gold">'+fmt(cur)+' F</b>'+(top?' ('+esc(top.name)+')':'')+'<br>'+(live?'⏱ '+left(a.end):'<b style="color:#25d366">Terminée</b>');
 if(live)s+='<br><input id="bid_'+a.id+'" class="input" type="number" placeholder="Min. '+fmt(min)+' F" style="margin:6px 0"><button class="mini" onclick="PM.bid(\''+a.id+'\')">🔨 Enchérir</button>';
 else s+='<br>'+(top?'🏆 Gagnant : <b>'+esc(top.name)+'</b> ('+fmt(top.amt)+' F)':'Aucune offre')+(isAdmin&&top?' <button class="mini" onclick="PM.winner(\''+a.id+'\',\''+top.id+'\')">Contacter</button>':'');
 return s+(isAdmin?' <button class="mini" onclick="PM.delAuction(\''+a.id+'\')">🗑</button>':'')+'</div></div>';
}
function pollRow(x){
 var v=x.votes||{},n=Object.keys(v).length,my=key()&&v[key()]!==undefined,open=x.open!==false;
 var s='<p><b>'+esc(x.q)+'</b></p>';
 (x.opts||[]).forEach(function(o,i){
  var c=Object.values(v).filter(function(z){return z===i}).length,pc=n?Math.round(c*100/n):0;
  s+='<div style="margin:6px 0">'+(open&&!my?'<button class="mini" style="width:100%;text-align:left" onclick="PM.vote(\''+x.id+'\','+i+')">'+esc(o)+'</button>':'<div>'+esc(o)+(my&&v[key()]===i?' ✓':'')+' • '+c+' ('+pc+'%)</div><div class="mb"><i style="width:'+pc+'%"></i></div>')+'</div>';
 });
 return s+'<p style="font-size:12px;color:#aaa">'+n+' vote(s)'+(open?'':' • clôturé')+(isAdmin?' <button class="mini" onclick="PM.closePoll(\''+x.id+'\')">Clôturer</button> <button class="mini" onclick="PM.delPoll(\''+x.id+'\')">🗑</button>':'')+'</p>';
}
function adminBlock(){
 var o=Object.values(S.products||{}).filter(function(p){return p&&p.id}).map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('');
 var amb=Object.values(S.ambassadors||{}).filter(function(x){return x&&x.code});
 var tbl=Object.keys(table()).map(function(k){return k+':'+table()[k]}).join('\n');
 return mc('🔧 Admin','<p><b>BOUBA+ : activer un client</b></p><input id="plP" class="input" placeholder="Téléphone du client"><input id="plM" class="input" type="number" placeholder="Nombre de mois (ex: 1)"><button class="gold" onclick="PM.givePlus()">Activer</button>'+
  '<p style="margin-top:12px"><b>Tarifs de livraison</b> (Commune:prix, une par ligne)</p><textarea id="dlT" class="input" rows="6">'+esc(tbl)+'</textarea><button class="gold" onclick="PM.saveDlv()">Enregistrer</button>'+
  '<p style="margin-top:12px"><b>Enchère</b></p><select id="auP" class="input">'+o+'</select><input id="auS" class="input" type="number" placeholder="Mise de départ (F)"><input id="auT" class="input" type="number" placeholder="Pas minimum (F)"><input id="auH" class="input" type="number" placeholder="Durée en heures (ex: 24)"><button class="gold" onclick="PM.mkAuction()">Lancer l\'enchère</button>'+
  '<p style="margin-top:12px"><b>Précommande</b></p><select id="prP" class="input">'+o+'</select><input id="prA" class="input" type="number" placeholder="Acompte en % (ex: 30)"><input id="prE" class="input" placeholder="Arrivée prévue (ex: fin du mois)"><button class="gold" onclick="PM.mkPre()">Ouvrir</button><button class="ghost" onclick="PM.stopPre()">Fermer pour cet article</button>'+
  '<p style="margin-top:12px"><b>Sondage</b></p><input id="poQ" class="input" placeholder="Question"><input id="poO" class="input" placeholder="Choix séparés par des virgules"><button class="gold" onclick="PM.mkPoll()">Publier le sondage</button>'+
  '<p style="margin-top:12px"><b>Ambassadeurs</b></p><input id="amN" class="input" placeholder="Nom"><input id="amP" class="input" placeholder="Téléphone"><input id="amC" class="input" type="number" placeholder="Commission en % (ex: 5)"><button class="gold" onclick="PM.mkAmb()">Créer l\'ambassadeur</button>'+
  amb.map(function(x){return '<div class="mr" style="display:block"><b>'+esc(x.name)+'</b> • '+esc(x.code)+' • '+x.pct+'%<br><span id="cm_'+x.code+'" style="color:gold">Gains : …</span><br><button class="mini" onclick="PM.sendAmb(\''+x.code+'\')">💬 Envoyer le lien</button> <button class="mini" onclick="PM.delAmb(\''+x.code+'\')">🗑</button></div>'}).join(''));
}
function loadComm(){
 if(!fb)return;
 fb.D.get(fb.D.ref(fb.db,'commissions')).then(function(s){
  var v=Object.values(s.val()||{}),sum={};
  v.forEach(function(c){sum[c.code]=sum[c.code]||{t:0,n:0};sum[c.code].t+=+c.total||0;sum[c.code].n++});
  window._commSum=sum;
  Object.values(S.ambassadors||{}).forEach(function(a){var e=$('cm_'+a.code),m=sum[a.code]||{t:0,n:0};if(e)e.textContent='Ventes : '+m.n+' • '+fmt(m.t)+' F • Commission : '+fmt(Math.round(m.t*a.pct/100))+' F'});
 }).catch(function(){});
}

/* ---------- API ---------- */
window.PM={
 open:openMore,
 subscribe:function(){wa(waNum(),'Bonjour, je veux m\'abonner à BOUBA+ (2 000 F par mois).\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''))},
 beAmb:function(){wa(waNum(),'Bonjour, je veux devenir ambassadeur BOUBA STORE.\nNom : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''))},
 pre:function(id){
  var p=P(id),r=(S.preorders||{})[id];if(!p||!r)return;
  var a=Math.round(p.price*r.pct/100);
  wa(waNum(),'Bonjour, je veux précommander « '+p.name+' » ('+fmt(p.price)+' F).\nAcompte ('+r.pct+'%) : '+fmt(a)+' F\nArrivée prévue : '+(r.eta||'à confirmer')+'\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''));
 },
 bid:function(id){
  if(!me){alert('Connectez-vous d\'abord');return}
  var a=(S.auctions||{})[id];if(!a||a.end<Date.now()){toast('Enchère terminée');return}
  var amt=Number($('bid_'+id).value),top=0;
  Object.values(a.bids||{}).forEach(function(b){if(b.amt>top)top=b.amt});
  var min=top?top+a.step:a.start;
  if(!(amt>=min)){toast('Offre minimum : '+fmt(min)+' F');return}
  var b=uid();
  write('auctions/'+id+'/bids/'+b,{amt:amt,name:me.name,date:Date.now()});
  write('bidphone/'+id+'/'+b,{phone:me.phone});
  toast('🔨 Offre enregistrée : '+fmt(amt)+' F');setTimeout(openMore,600);
 },
 winner:function(aid,bid){
  fb.D.get(fb.D.ref(fb.db,'bidphone/'+aid+'/'+bid)).then(function(s){var v=s.val();if(v&&v.phone)wa(intl(v.phone),'Félicitations ! Vous avez gagné l\'enchère BOUBA STORE. Contactez-nous pour finaliser.');else toast('Numéro introuvable')}).catch(function(){toast('Accès refusé')});
 },
 delAuction:function(id){if(confirm('Supprimer cette enchère ?')){write('auctions/'+id,null);setTimeout(openMore,500)}},
 vote:function(id,i){if(!me){alert('Connectez-vous d\'abord');return}write('polls/'+id+'/votes/'+key(),i);toast('🗳️ Merci pour votre vote');setTimeout(openMore,500)},
 closePoll:function(id){write('polls/'+id+'/open',false);setTimeout(openMore,500)},
 delPoll:function(id){write('polls/'+id,null);setTimeout(openMore,500)},
 givePlus:function(){
  var k=($('plP').value||'').replace(/\D/g,'').slice(-10),m=Number($('plM').value)||1;
  if(k.length<8){alert('Numéro invalide');return}
  fb.D.get(fb.D.ref(fb.db,'plus/'+k)).then(function(s){var v=s.val(),b=Math.max(Date.now(),(v&&v.until)||0);
   write('plus/'+k,{until:b+m*30*DAY});toast('⭐ BOUBA+ activé pour '+m+' mois')}).catch(function(){write('plus/'+k,{until:Date.now()+m*30*DAY});toast('⭐ Activé')});
 },
 saveDlv:function(){
  var o={};($('dlT').value||'').split('\n').forEach(function(l){var i=l.lastIndexOf(':');if(i>0){var n=l.slice(0,i).trim(),p=Number(l.slice(i+1).replace(/\D/g,''));if(n)o[n]=p||0}});
  if(!Object.keys(o).length){alert('Format : Commune:prix');return}
  write('info/delivery',o);toast('🚚 Tarifs enregistrés');
 },
 mkAuction:function(){
  var s=Number($('auS').value),st=Number($('auT').value)||500,h=Number($('auH').value)||24;
  if(!(s>0)){alert('Mise de départ obligatoire');return}
  var id=uid();write('auctions/'+id,{id:id,pid:$('auP').value,start:s,step:st,end:Date.now()+h*HOUR,date:Date.now()});toast('🔨 Enchère lancée');setTimeout(openMore,500);
  fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'🔨 Nouvelle enchère',body:((P($('auP').value)||{}).name||'Un article')+' dès '+fmt(s)+' F'})}).catch(function(){});
 },
 mkPre:function(){
  var a=Number($('prA').value);if(!(a>0&&a<=100)){alert('Acompte entre 1 et 100 %');return}
  write('preorders/'+$('prP').value,{pct:a,eta:($('prE').value||'').trim()});toast('📅 Précommande ouverte');
 },
 stopPre:function(){write('preorders/'+$('prP').value,null);toast('Précommande fermée')},
 mkPoll:function(){
  var q=($('poQ').value||'').trim(),o=($('poO').value||'').split(',').map(function(x){return x.trim()}).filter(Boolean);
  if(!q||o.length<2){alert('Une question et au moins 2 choix');return}
  var id=uid();write('polls/'+id,{id:id,q:q,opts:o,date:Date.now(),open:true});toast('🗳️ Sondage publié');setTimeout(openMore,500);
 },
 mkAmb:function(){
  var n=($('amN').value||'').trim(),p=($('amP').value||'').trim(),c=Number($('amC').value)||5;
  if(!n||!p){alert('Nom et téléphone obligatoires');return}
  var code='AMB'+Math.random().toString(36).slice(2,6).toUpperCase();
  write('ambassadors/'+code,{code:code,name:n,phone:p,pct:c,date:Date.now()});toast('🤝 Ambassadeur créé : '+code);setTimeout(openMore,500);
 },
 sendAmb:function(code){
  var a=(S.ambassadors||{})[code];if(!a)return;
  var m=(window._commSum||{})[code]||{t:0,n:0};
  wa(intl(a.phone),'Bonjour '+a.name+' ! Votre lien ambassadeur BOUBA STORE : '+location.origin+'/?amb='+code+'\nCommission : '+a.pct+'% sur chaque commande.\nVos gains actuels : '+fmt(Math.round(m.t*a.pct/100))+' F ('+m.n+' vente(s)).');
 },
 delAmb:function(c){if(confirm('Supprimer cet ambassadeur ?')){write('ambassadors/'+c,null);setTimeout(openMore,500)}}
};

/* ---------- accueil + démarrage ---------- */
function renderZone(){
 var g=$('grid');if(!g)return;
 if(!zone.parentNode){var f=$('bonusZone')||$('p2Zone')||$('funZone')||$('trendZone');if(f&&f.parentNode)f.parentNode.insertBefore(zone,f.nextSibling);else g.parentNode.insertBefore(zone,g)}
 zone.innerHTML='<button class="mini" style="width:100%;padding:12px;margin:4px 0" onclick="PM.open()">🚀 '+(plusActive()?'⭐ BOUBA+ actif':'BOUBA+')+' • Enchères • Livraison • Sondages</button>';
}
function start(){
 if(!fb||!key()||started===key())return;started=key();
 ['auctions','polls','preorders','ambassadors'].forEach(function(r){sub(r)});
 try{fb.D.onValue(fb.D.ref(fb.db,'plus/'+String(key()).slice(-10)),function(s){PLUS=s.val();renderZone();renderCart()},function(){})}catch(e){}
}
setInterval(function(){
 if($('grid')&&!pg.parentNode)document.body.appendChild(pg);
 start();
},1500);
var _rs=window.renderStore;
window.renderStore=function(){_rs();extra();renderZone()};
})();
