/* BOUBA STORE – programmes d'attraction (bienvenue, vente flash, points, parrainage, concours, nouveautés, photos, boutiques gratuites)
   S'appuie sur les fonctions de index.html : me, S, write, sub, fb, online, isAdmin, cartItems, cartSum, renderCart, commander, addCart, compress, toast, esc, safeImg, fmt, prods, openPage, closeAll */
(function(){
var DAY=864e5,LSK='p_L',L={pts:0,credit:0},started='',got=0;
var key=function(){return me&&me.key};
var today=function(){return new Date().toISOString().slice(0,10)};
var month=function(){return today().slice(0,7)};
var myCode=function(){return 'BOUBA'+String(key()).slice(-5)};
var link=function(){return location.origin+'/'};
var wa=function(m){window.open('https://wa.me/?text='+encodeURIComponent(m),'_blank')};
function setL(f,v){L[f]=v;SV(LSK,L);write('loyalty/'+key()+'/'+f,v)}

/* ---------- réductions : flash + bienvenue 10 % + crédit ---------- */
function flash(){var f=(S.info||{}).flash;return f&&f.end>Date.now()?f:null}
function parts(){
 var it=cartItems(),base=it.reduce(function(s,x){return s+x.p.price*x.qty},0),fl=0,f=flash();
 if(f){var x=it.find(function(y){return y.p.id===f.id});if(x)fl=Math.round(x.p.price*x.qty*f.pct/100)}
 var wel=(!L.welcomeUsed&&base)?Math.round((base-fl)*0.1):0;
 var cr=Math.min(L.credit||0,Math.max(0,base-fl-wel));
 return {base:base,fl:fl,wel:wel,cr:cr,tot:base-fl-wel-cr};
}
function note(p){
 var a=[];if(p.fl)a.push('Vente flash -'+fmt(p.fl)+' F');if(p.wel)a.push('Bienvenue -10% (-'+fmt(p.wel)+' F)');if(p.cr)a.push('Crédit -'+fmt(p.cr)+' F');
 return a.join(' / ');
}
window.cartSum=function(){return parts().tot};
var _rc=window.renderCart;
window.renderCart=function(){
 _rc();var p=parts();
 if(p.base&&p.base!==p.tot)$('cartTotal').innerHTML='<s style="color:#888">'+fmt(p.base)+' F</s> Total : '+fmt(p.tot)+' F<div style="font-size:12px;color:#25D366">'+esc(note(p))+'</div>';
};
var _cm=window.commander;
window.commander=function(){
 if(!cartItems().length||!me)return _cm();
 var p=parts(),o=window.open;
 window.open=function(u,t){window.open=o;return o.call(window,p.base!==p.tot?u+encodeURIComponent('\nRéductions : '+note(p)):u,t)};
 try{_cm()}finally{window.open=o}
 afterOrder(p);
};
function afterOrder(p){
 var first=!L.welcomeUsed;
 if(first)setL('welcomeUsed',true);
 if(p.cr)setL('credit',(L.credit||0)-p.cr);
 setL('pts',(L.pts||0)+10);
 if(first&&L.refBy&&fb&&online){
  fb.D.get(fb.D.ref(fb.db,'referrals/'+L.refBy)).then(function(s){var o=s.val();
   if(o&&o.owner)fb.D.update(fb.D.ref(fb.db,'loyalty/'+o.owner),{credit:fb.D.increment(1000)})}).catch(function(){});
 }
 toast('+10 points fidélité 🎉');
}

/* ---------- démarrage par client ---------- */
function start(){
 if(!fb||!key()||started===key())return;started=key();got=0;
 L=Object.assign({pts:0,credit:0},LS(LSK,{}));
 var r=fb.D.ref(fb.db,'loyalty/'+key());
 fb.D.onValue(r,function(s){Object.assign(L,s.val()||{});SV(LSK,L);first();renderPromo()},function(){first()});
 setTimeout(first,3500);
 sub('photos');
}
function first(){
 if(got)return;got=1;
 if(!L.init){setL('init',1);if(Date.now()-(me.date||0)>2*DAY)setL('welcomeUsed',true)}
 if(L.visit!==today()){setL('visit',today());setL('pts',(L.pts||0)+1)}
 if(!L.refSaved){write('referrals/'+myCode(),{owner:key(),name:me.name});setL('refSaved',1)}
 if(!L.welcomeUsed&&!LS('p_wel',0))welcome();
 renderPromo();
}
function welcome(){
 var d=document.createElement('div');d.id='pWel';
 d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:998;display:flex;align-items:center;justify-content:center;padding:20px';
 d.innerHTML='<div class="gateBox"><h2 style="color:gold">🎁 Bienvenue chez BOUBA</h2><p style="margin:12px 0">-10 % sur votre première commande.<br>Appliqué automatiquement dans le panier.</p><button class="gold" onclick="PROMO.closeWel()">Voir les articles</button></div>';
 document.body.appendChild(d);
}

/* ---------- affichage ---------- */
var css=document.createElement('style');
css.textContent='.pc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.pc h3{color:gold;font-size:16px;margin-bottom:6px}.pc p{font-size:14px;margin:4px 0 8px;color:#ddd}.pc img.t{width:90px;height:90px;border-radius:10px;object-fit:cover}.pbar{height:10px;background:#2a2a2a;border-radius:6px;overflow:hidden;margin:6px 0}.pbar i{display:block;height:100%;background:gold}.pcode{display:inline-block;border:2px dashed gold;color:gold;border-radius:8px;padding:6px 12px;font-weight:900;letter-spacing:1px}.pn{display:flex;gap:8px;overflow-x:auto}.pn div{min-width:120px;background:#000;border:1px solid #333;border-radius:10px;padding:6px;font-size:13px}.pn img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px}.pg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.pg img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:8px}';
document.head.appendChild(css);
var zone=document.createElement('div');zone.id='promoZone';
var pg=document.createElement('div');pg.id='promoPage';pg.className='page';
var adz=document.createElement('div');adz.id='adZone';adz.style.cssText='padding:8px 10px 0';
var adSig='',adImg='',adsOn=0;
function mount(){
 var g=$('grid');if(!g||zone.parentNode)return;
 g.parentNode.insertBefore(adz,g);g.parentNode.insertBefore(zone,g);document.body.appendChild(pg);
 var a=document.querySelector('a[href="bouton.html"]');
 if(a){var n=document.createElement('div');n.style.cssText='color:gold;font-size:13px;margin-top:6px';n.textContent='🎁 3 mois gratuits pour les premiers vendeurs';a.parentNode.appendChild(n)}
}
function ads(){return Object.values(S.ads||{}).filter(function(a){return a&&a.id&&a.img&&(!a.end||a.end>Date.now())}).sort(function(a,b){return (b.date||0)-(a.date||0)}).slice(0,8)}
function adClick(i){
 var a=ads()[i];
 if(!a){wa2('Bonjour, je veux faire de la publicité sur BOUBA STORE.');return}
 if(/^https?:/.test(a.url||''))window.open(a.url,'_blank');else wa2('Bonjour, je suis intéressé par la pub : '+a.title);
}
function wa2(m){window.open('https://wa.me/'+(((S.info||{}).whatsapp||DEFAULT_WA).replace(/\D/g,''))+'?text='+encodeURIComponent(m),'_blank')}
function renderAds(){
 mount();
 var l=ads(),sig=l.map(function(a){return a.id}).join(',');
 if(sig===adSig&&adz.innerHTML)return;adSig=sig;
 var h='<div id="adTrack" style="display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none">';
 l.forEach(function(a,i){h+='<div onclick="PROMO.ad('+i+')" style="flex:0 0 100%;scroll-snap-align:center;position:relative;border:1px solid #d4af37;border-radius:12px;overflow:hidden;aspect-ratio:16/7;background:#111"><img src="'+safeImg(a.img)+'" alt="" style="width:100%;height:100%;object-fit:cover"><div style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.85));padding:14px 10px 8px;font-weight:700;color:#fff;font-size:15px">'+esc(a.title||'')+'</div><span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.7);color:#ffd700;font-size:10px;padding:2px 6px;border-radius:8px">PUB</span></div>'});
 h+='<div onclick="PROMO.ad(-1)" style="flex:0 0 100%;scroll-snap-align:center;border:2px dashed #d4af37;border-radius:12px;aspect-ratio:16/7;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#ffd700;font-weight:900;font-size:18px;gap:4px"><span>📢 Votre pub ici</span><span style="font-size:13px;color:#ddd;font-weight:400">Touchez pour nous contacter sur WhatsApp</span></div></div>';
 adz.innerHTML=h;
}
var adIdx=0;
setInterval(function(){var t=$('adTrack');if(!t||t.children.length<2)return;adIdx=(adIdx+1)%t.children.length;t.scrollTo({left:t.children[adIdx].offsetLeft-t.offsetLeft,behavior:'smooth'})},4000);
function card(t,b){return '<div class="pc"><h3>'+t+'</h3>'+b+'</div>'}
function left(f){var s=Math.max(0,Math.floor((f.end-Date.now())/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(function(x){return ('0'+x).slice(-2)}).join(':')}
function renderPromo(){
 mount();if(!me)return;
 if(document.activeElement&&/INPUT|SELECT/.test(document.activeElement.tagName)&&pg.contains(document.activeElement))return;
 var f=flash(),pr=f&&(S.products||{})[f.id],h='';
 if(pr)h+=card('⚡ Vente flash','<div style="display:flex;gap:10px"><img class="t" src="'+safeImg(pr.img)+'"><div><b>'+esc(pr.name)+'</b><br><s style="color:#888">'+fmt(pr.price)+' F</s> <b style="color:gold">'+fmt(Math.round(pr.price*(100-f.pct)/100))+' F</b> (-'+f.pct+'%)<br>⏱ <b id="pFt">'+left(f)+'</b><br><button class="mini" style="margin-top:6px" onclick="addCart(\''+pr.id+'\')">🛒 Ajouter</button></div></div>');
 h+='<button class="gold" style="margin:6px 0" onclick="openPage(\'promoPage\')">🎁 Mes avantages • '+(L.pts||0)+' pts'+(L.credit?' • '+fmt(L.credit)+' F':'')+'</button>';
 zone.style.cssText='padding:0 10px';zone.innerHTML=h;
 renderPage();
}
function renderPage(){
 var pts=L.pts||0,h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🎁 MES AVANTAGES</h2>';
 h+=card('⭐ Points fidélité','<p>1 point par visite du jour, 10 par commande. À 50 points : 1 000 F de réduction.</p><div class="pbar"><i style="width:'+Math.min(100,pts*2)+'%"></i></div><p><b>'+pts+'</b> / 50 points'+(L.credit?' • crédit : <b style="color:#25D366">'+fmt(L.credit)+' F</b>':'')+'</p><button class="gold" '+(pts<50?'disabled style="opacity:.4"':'')+' onclick="PROMO.redeem()">Échanger 50 points</button>');
 h+=card('🤝 Parrainage','<p>Vous et votre ami gagnez 1 000 F quand il passe sa première commande.</p><span class="pcode">'+esc(myCode())+'</span><button class="gold" style="margin-top:8px" onclick="PROMO.shareRef()">💬 Envoyer sur WhatsApp</button>'+(L.refBy||L.welcomeUsed?'':'<p style="margin-top:8px">Vous avez un code ?</p><input id="pRefIn" class="input" placeholder="Code de votre ami"><button class="ghost" onclick="PROMO.applyRef()">Valider le code</button>'));
 var joined=L.contest===month();
 h+=card('🏆 Concours du mois','<p>Un ensemble gratuit à gagner. Participez et partagez la boutique.</p><button class="gold" '+(joined?'disabled style="opacity:.5"':'')+' onclick="PROMO.join()">'+(joined?'✅ Participation enregistrée':'Je participe')+'</button><button class="ghost" onclick="PROMO.shareShop()">📤 Partager la boutique</button>');
 var nw=prods().filter(function(p){return Date.now()-(p.date||0)<7*DAY}).slice(0,8);
 h+=card('🆕 Nouveautés de la semaine',nw.length?'<div class="pn">'+nw.map(function(p){return '<div><img src="'+safeImg(p.img)+'"><b>'+esc(p.name)+'</b><br><span style="color:gold">'+fmt(p.price)+' F</span><button class="shb" onclick="PROMO.shareProd(\''+p.id+'\')">📤 Partager</button></div>'}).join('')+'</div>':'<p>Pas de nouveauté cette semaine.</p>');
 var ph=Object.values(S.photos||{}).filter(function(p){return p&&p.ok&&p.img}).slice(0,9);
 h+=card('📸 Ils portent BOUBA',(ph.length?'<div class="pg">'+ph.map(function(p){return '<div><img src="'+safeImg(p.img)+'"><div style="font-size:11px;color:#aaa">'+esc(p.name)+'</div></div>'}).join('')+'</div>':'<p>Soyez le premier à poster votre photo.</p>')+'<input type="file" id="pFile" accept="image/*" style="display:none" onchange="PROMO.photo(this.files[0])"><button class="ghost" onclick="$(\'pFile\').click()">📷 Envoyer ma photo</button>');
 h+=card('🏪 Vendez avec BOUBA','<p>3 mois gratuits pour les premiers vendeurs.</p><a class="gold" style="display:block;text-align:center;text-decoration:none" href="bouton.html" target="_blank">+ Créer ma boutique</a>');
 if(isAdmin)h+=adminBlock();
 pg.innerHTML=h;
}
function adminBlock(){
 var pend=Object.values(S.photos||{}).filter(function(p){return p&&!p.ok});
 return card('🔧 Admin promos','<p>Vente flash 24h :</p><select id="pFp" class="input">'+prods().map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+'</option>'}).join('')+'</select><input id="pFd" class="input" type="number" placeholder="Réduction en % (ex: 20)"><button class="gold" onclick="PROMO.launch()">⚡ Lancer</button><button class="ghost" onclick="PROMO.stopFlash()">Arrêter la vente flash</button><p style="margin-top:12px">Photos à valider : '+pend.length+'</p>'+pend.map(function(p){return '<div class="row"><img src="'+safeImg(p.img)+'"><div class="g">'+esc(p.name)+'</div><button class="mini" onclick="PROMO.ok(\''+p.id+'\')">✅</button><button class="mini" onclick="PROMO.del(\''+p.id+'\')">🗑</button></div>'}).join('')+'<button class="ghost" onclick="PROMO.draw()">🎲 Tirer au sort le concours</button><p style="margin-top:14px">Pubs défilantes :</p><input type="file" id="adFile" accept="image/*" class="input" onchange="PROMO.adFile(this.files[0])"><input id="adTitle" class="input" placeholder="Titre de la pub"><input id="adUrl" class="input" placeholder="Lien (facultatif, sinon WhatsApp)"><input id="adDays" class="input" type="number" placeholder="Durée en jours (ex: 7)"><button class="gold" onclick="PROMO.adPub()">📢 Publier la pub</button>'+ads().map(function(a){return '<div class="row"><img src="'+safeImg(a.img)+'"><div class="g">'+esc(a.title)+'</div><button class="mini" onclick="PROMO.adDel(\''+a.id+'\')">🗑</button></div>'}).join(''));
}
setInterval(function(){var f=flash(),e=$('pFt');if(e&&f)e.textContent=left(f);if(!f&&$('promoZone')&&zone.querySelector('#pFt'))renderPromo();if(!started)start();if(fb&&!adsOn){adsOn=1;sub('ads')}},1000);

/* ---------- actions ---------- */
window.PROMO={
 closeWel:function(){var d=$('pWel');if(d)d.remove();SV('p_wel',1)},
 redeem:function(){if((L.pts||0)<50)return;setL('pts',L.pts-50);setL('credit',(L.credit||0)+1000);toast('✅ 1 000 F de crédit ajoutés')},
 shareRef:function(){wa('Viens sur BOUBA STORE ! Utilise mon code '+myCode()+' à ton inscription : on gagne chacun 1 000 F. '+link())},
 shareShop:function(){wa('Découvre BOUBA STORE et tente de gagner un ensemble gratuit : '+link())},
 shareProd:function(id){var p=(S.products||{})[id];if(p)wa('Nouveau chez BOUBA STORE : '+p.name+' à '+fmt(p.price)+' F. '+link())},
 applyRef:function(){
  var c=($('pRefIn').value||'').trim().toUpperCase();if(!c)return;
  if(c===myCode()){toast('C\'est votre propre code');return}
  if(!fb||!online){toast('Connexion requise');return}
  fb.D.get(fb.D.ref(fb.db,'referrals/'+c)).then(function(s){
   if(!s.exists()){toast('Code inconnu');return}
   setL('refBy',c);setL('credit',(L.credit||0)+1000);toast('✅ 1 000 F offerts sur votre commande');
  }).catch(function(){toast('Erreur, réessayez')});
 },
 join:function(){if(L.contest===month())return;setL('contest',month());write('contest/'+month()+'/'+key(),{name:me.name,phone:me.phone,date:Date.now()});toast('🎟️ Participation enregistrée')},
 photo:function(file){compress(file,500,function(img){var id=uid();write('photos/'+id,{id:id,img:img,name:me.name,date:Date.now(),ok:false});toast('📸 Photo envoyée, validation en cours')})},
 launch:function(){var d=Number($('pFd').value);if(!(d>0&&d<100)){alert('Pourcentage entre 1 et 99');return}write('info/flash',{id:$('pFp').value,pct:d,end:Date.now()+DAY});toast('⚡ Vente flash lancée');var fp=(S.products||{})[$('pFp').value]||{};fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'⚡ Vente flash -'+d+'%',body:(fp.name||'Un article')+' en promo pendant 24h'})}).catch(function(){})},
 stopFlash:function(){write('info/flash',null)},
 ad:function(i){adClick(i)},
 adFile:function(f){compress(f,900,function(img){adImg=img;toast('Image prête')})},
 adPub:function(){
  var t=($('adTitle').value||'').trim(),d=Number($('adDays').value)||7;
  if(!adImg||!t){alert('Ajoutez une image et un titre');return}
  var id=uid();write('ads/'+id,{id:id,img:adImg,title:t,url:($('adUrl').value||'').trim(),date:Date.now(),end:Date.now()+d*DAY});
  adImg='';adSig='';toast('📢 Pub publiée');
 },
 adDel:function(id){write('ads/'+id,null);adSig=''},
 ok:function(id){write('photos/'+id+'/ok',true)},
 del:function(id){write('photos/'+id,null)},
 draw:function(){
  if(!fb)return;
  fb.D.get(fb.D.ref(fb.db,'contest/'+month())).then(function(s){
   var a=Object.values(s.val()||{});
   if(!a.length){alert('Aucun participant');return}
   var w=a[Math.floor(Math.random()*a.length)];
   alert(a.length+' participants.\nGagnant : '+w.name+'\nWhatsApp : '+w.phone);
  }).catch(function(){alert('Accès refusé (vérifiez les règles)')});
 }
};
var _ra=window.renderAll;
window.renderAll=function(){_ra();renderAds();renderPromo()};
})();
