/* BOUBA STORE – ⭐ SUPER STAR : les artistes publient musiques, clips, albums et photos (gratuits ou payants) ; BOUBA STORE garde 10 %.
   Les achats sont vérifiés côté serveur (api/star.js) : le lien d'une œuvre payante n'est donné qu'après validation du paiement. */
(function(){
var OWNER='2250787619717',A={},W={},typeF='all',artF='',started=0,busy=0;
var ICON={music:'🎵',clip:'🎬',album:'💿',photo:'📸'},NAME={music:'Musique',clip:'Clip',album:'Album',photo:'Photo'};
var cid=function(){return LS('v_id','')},tok=function(){return LS('sx_tok','')},buys=function(){return LS('sx_buys',{})};
function api(a,d){
 return fetch('/api/star',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({a:a},d||{}))})
  .then(function(r){return r.json()}).catch(function(){return {ok:false,err:'Connexion impossible.'}});
}
function wa(t){window.open('https://wa.me/'+OWNER+'?text='+encodeURIComponent(t),'_blank')}
function initial(n,id,sz,im){
 if(im)return '<img src="'+safeImg(im)+'" alt="" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;border:2px solid #ffd700;display:block">';
 var h=0;String(id).split('').forEach(function(c){h=(h*31+c.charCodeAt(0))%360});
 return '<div style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:hsl('+h+',60%,45%);display:grid;place-items:center;color:#fff;font-weight:900;font-size:'+Math.round(sz*0.45)+'px;border:2px solid #ffd700">'+esc(String(n||'?').charAt(0).toUpperCase())+'</div>';
}

var css=document.createElement('style');
css.textContent='.ssh{background:linear-gradient(90deg,#ffd700,#ff8c00);color:#000;border-radius:12px;padding:12px;text-align:center;font-weight:900;font-size:20px;margin:6px 0}.sar{display:flex;gap:10px;overflow-x:auto;padding:4px 0;scrollbar-width:none}.sar>div{flex:none;width:92px;text-align:center;font-size:12px;color:#ddd}.sar>div>div,.sar>div>img{margin:0 auto 4px}.stb{display:flex;gap:6px;margin:10px 0;overflow-x:auto}.stb button{flex:none;padding:8px 12px;border-radius:18px;border:1px solid #d4af37;background:#000;color:#ffd700;font-weight:800;font-size:13px}.stb button.on{background:#ffd700;color:#000}.swk{display:flex;gap:10px;background:#111;border:1px solid #d4af37;border-radius:12px;padding:10px;margin:10px 0}.swk img.c{width:84px;height:84px;border-radius:10px;object-fit:cover;flex:none;background:#000}.swk .ph{width:84px;height:84px;border-radius:10px;background:#222;display:grid;place-items:center;font-size:34px;flex:none}.swk .i{flex:1;min-width:0}.swk .i b{color:#fff;font-size:15px}.chip{display:inline-block;background:#2a2200;border:1px solid #ffd700;color:#ffd700;border-radius:12px;padding:2px 8px;font-size:12px;font-weight:800}.swk button{margin:6px 6px 0 0;padding:8px 10px!important;border-radius:8px;font-size:13px!important}.sbx{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.sbx h3{color:gold;font-size:16px;margin:0 0 6px}.sbx p{font-size:14px;color:#ddd;margin:4px 0 8px}.sg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.sg div{background:#000;border:1px solid #333;border-radius:10px;padding:10px;text-align:center}.sg b{display:block;color:#ffd700;font-size:18px}.sg span{font-size:12px;color:#aaa}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='starPage';pg.className='page';
var sp=document.createElement('div');sp.id='starSub';sp.className='page';

/* ---------- données publiques ---------- */
function listen(path,k,n){
 var q=fb.D.query(fb.D.ref(fb.db,path),fb.D.limitToLast(n));
 fb.D.onValue(q,function(s){(k==='A'?A=s.val()||{}:W=s.val()||{});if(pg.classList.contains('active'))render()},function(){});
}
function boot(){
 if(!fb||!fb.D||started)return;started=1;
 listen('artists','A',80);listen('works','W',80);
}
setInterval(function(){
 if(document.body&&!pg.parentNode){document.body.appendChild(pg);document.body.appendChild(sp)}
 var nav=document.querySelector('.nav');
 if(nav&&!nav.dataset.s){nav.dataset.s=1;var d=document.createElement('div');d.innerHTML='⭐<br>Stars';d.onclick=function(){STAR.open()};nav.insertBefore(d,nav.children[3]||null)}
 boot();
},1200);

/* ---------- page principale ---------- */
function myWorks(){return Object.values(W).filter(function(w){return w&&w.cid===cid()})}
function render(){
 var h='<div style="display:flex;align-items:center;gap:8px"><button class="mini" onclick="closeAll()">← Retour</button><div class="ssh" style="flex:1;margin:0;font-size:17px">⭐ SUPER STAR ⭐</div></div>';
 h+='<p style="text-align:center;color:#ccc;font-size:14px">Musiques, clips, albums et photos de vos artistes. Gratuit ou payant, par Wave / Orange Money.</p>';
 h+=tok()?'<button class="gold" style="width:100%;margin-bottom:8px" onclick="STAR.space()">🎤 Mon espace artiste</button>':'<button class="gold" style="width:100%;margin-bottom:8px" onclick="STAR.register()">🎤 Devenir Super Star</button>';
 var ar=Object.values(A).filter(function(a){return a&&a.cid}).sort(function(a,b){return b.date-a.date});
 h+='<h3 style="color:gold;margin:12px 0 4px">🔥 Artistes</h3>'+(ar.length?'<div class="sar">'+ar.map(function(a){return '<div onclick="STAR.artist(\''+a.cid+'\')">'+initial(a.name,a.cid,64,a.img)+esc(a.name)+'</div>'}).join('')+'</div>':'<p style="color:#aaa">Aucun artiste pour le moment : soyez le premier !</p>');
 h+='<div class="stb">'+[['all','Tout'],['music','🎵 Musique'],['clip','🎬 Clips'],['album','💿 Albums'],['photo','📸 Photos']].map(function(t){return '<button class="'+(typeF===t[0]?'on':'')+'" onclick="STAR.type(\''+t[0]+'\')">'+t[1]+'</button>'}).join('')+'</div>';
 if(artF){var an=(A[artF]||{}).name||'Artiste';h+='<div class="sbx"><b>'+esc(an)+'</b> <button class="mini" onclick="STAR.artist(\'\')">✕ Tous</button></div>'}
 var l=Object.values(W).filter(function(w){return w&&w.id&&(typeF==='all'||w.type===typeF)&&(!artF||w.cid===artF)}).sort(function(a,b){return b.date-a.date});
 h+=l.length?l.map(wk).join(''):'<p style="color:#aaa;text-align:center;margin:24px 0">Aucune œuvre pour le moment.</p>';
 if(isAdmin)h+='<button class="ghost" style="width:100%;margin-top:14px" onclick="STAR.admin()">🔧 Admin Super Star</button>';
 pg.innerHTML=h;
}
function wk(w){
 var b=buys()[w.id],btn='';
 if(!w.price)btn='<button class="gold" onclick="STAR.open_w(\''+w.id+'\')">▶ Ouvrir</button>';
 else if(b&&b.paid)btn='<button class="gold" onclick="STAR.unlock(\''+w.id+'\')">📥 Ouvrir mon achat</button>';
 else if(b)btn='<button class="ghost" onclick="STAR.check(\''+w.id+'\')">⏳ Vérifier le paiement</button><button class="ghost" onclick="STAR.pay(\''+w.id+'\')">💬 Payer</button>';
 else btn='<button class="gold" onclick="STAR.buy(\''+w.id+'\')">💳 Acheter '+fmt(w.price)+' F</button>';
 if(w.pv)btn+='<button class="ghost" onclick="STAR.play(\''+esc(w.pv)+'\',\''+esc(w.title).replace(/\'/g,'’')+' (aperçu)\')">👂 Aperçu</button>';
 return '<div class="swk">'+(w.cover?'<img class="c" loading="lazy" src="'+safeImg(w.cover)+'" alt="">':'<div class="ph">'+(ICON[w.type]||'🎵')+'</div>')+'<div class="i"><b>'+(ICON[w.type]||'')+' '+esc(w.title)+'</b><br><span style="color:#aaa;font-size:13px" onclick="STAR.artist(\''+w.cid+'\')">'+esc(w.an)+'</span><br><span class="chip">'+(w.price?fmt(w.price)+' F':'Gratuit')+'</span><br>'+btn+'</div></div>';
}
function show(h){sp.innerHTML='<button class="mini" onclick="STAR.open()">← Retour</button>'+h;openPage('starSub')}

/* ---------- lecteur ---------- */
function embed(u,title){
 u=String(u||'');var y=/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u),e='';
 if(y)e='<iframe src="https://www.youtube.com/embed/'+y[1]+'?playsinline=1" allow="encrypted-media" allowfullscreen style="width:100%;height:260px;border:0;border-radius:10px"></iframe>';
 else if(/\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(u))e='<audio src="'+esc(u)+'" controls style="width:100%"></audio>';
 else if(/\.(mp4|webm)(\?|$)/i.test(u))e='<video src="'+esc(u)+'" controls playsinline style="width:100%;border-radius:10px;background:#000"></video>';
 else if(/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u))e='<img src="'+esc(u)+'" alt="" style="width:100%;border-radius:10px">';
 return '<div class="sbx"><h3>'+esc(title||'')+'</h3>'+e+'<a class="gold" style="display:block;text-align:center;text-decoration:none;margin-top:10px;padding:12px;border-radius:10px" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">↗ Ouvrir / Télécharger</a></div>';
}

/* ---------- actions ---------- */
window.STAR={
 open:function(){render();openPage('starPage');silentCheck()},
 type:function(t){typeF=t;render()},
 artist:function(c){artF=c||'';typeF='all';STAR.open()},
 play:function(u,t){show(embed(u,t))},
 work:function(id){
  var w=W[id];
  if(!w){if(!fb)return;fb.D.get(fb.D.ref(fb.db,'works/'+id)).then(function(x){if(x.exists()){W[id]=x.val();STAR.work(id)}else toast('Œuvre introuvable')});return}
  show('<div class="ssh">⭐ Super Star</div>'+wk(w));
 },
 open_w:function(id){var w=W[id];if(w)show(embed(w.url,w.title))},
 buy:function(id){
  var w=W[id];if(!w)return;
  if(!me){alert('Connectez-vous d\'abord');return}
  if(!confirm('Acheter « '+w.title+' » de '+w.an+' pour '+fmt(w.price)+' F ?\n\nVous payez par Wave ou Orange Money au +225 07 87 61 97 17. Le lien est débloqué dès que le paiement est validé.'))return;
  api('buy',{work:id,bcid:cid(),name:me.name,phone:me.phone}).then(function(r){
   if(!r.ok){toast(r.err||'Erreur');return}
   if(r.free){STAR.open_w(id);return}
   var b=buys();b[id]={oid:r.oid,btok:r.btok,paid:false};SV('sx_buys',b);
   wa('Bonjour BOUBA STORE, je veux acheter « '+r.title+' » de '+r.an+' ('+fmt(r.price)+' F).\nCommande : '+r.oid+'\nJe paie par Wave / Orange Money.\nClient : '+me.name+' / '+me.phone);
   render();if(sp.classList.contains('active'))STAR.work(id);toast('Commande '+r.oid+' créée');
  });
 },
 pay:function(id){var b=buys()[id],w=W[id];if(b&&w)wa('Bonjour, voici mon paiement pour la commande '+b.oid+' : « '+w.title+' » ('+fmt(w.price)+' F).\nClient : '+((me&&me.name)||'')+' / '+((me&&me.phone)||''))},
 check:function(id){
  var b=buys()[id];if(!b)return;
  api('status',{oid:b.oid,btok:b.btok}).then(function(r){
   if(r.ok&&r.status==='paid'){var x=buys();x[id].paid=true;SV('sx_buys',x);toast('✅ Paiement validé !');render()}
   else if(r.ok&&r.status==='rejected')toast('Commande refusée : contactez-nous');
   else toast('Pas encore validé. Envoyez votre preuve de paiement sur WhatsApp.');
  });
 },
 unlock:function(id){
  var b=buys()[id];if(!b)return;
  api('get',{oid:b.oid,btok:b.btok}).then(function(r){if(r.ok)show(embed(r.url,r.title));else toast(r.err||'Erreur')});
 },
 /* --- inscription artiste --- */
 register:function(){
  if(!me){alert('Connectez-vous d\'abord');return}
  if(!cid()){alert('Ouvrez d\'abord l\'onglet 🎬 Vibes une fois, puis revenez ici.');return}
  show('<div class="ssh">🎤 Créer mon compte Artiste</div><div class="sbx"><input id="rN" class="input" maxlength="40" placeholder="Nom de scène (ex : DJ Ivoire)"><textarea id="rB" class="input" rows="3" maxlength="200" placeholder="Biographie courte"></textarea><input id="rC" class="input" maxlength="40" placeholder="Ville / pays"><select id="rM" class="input"><option>Wave</option><option>Orange Money</option></select><input id="rP" class="input" type="tel" placeholder="Votre numéro Wave / Orange Money (pour être payé)"><p style="color:#aaa;font-size:13px">📷 Photo de profil</p><input type="file" id="rI" accept="image/*" class="input" onchange="STAR.pic(this.files[0],\'reg\')"><label style="display:block;color:#ddd;font-size:14px;margin:8px 0"><input type="checkbox" id="rK"> Je certifie être l\'auteur de mes œuvres (ou en avoir les droits) et j\'accepte que BOUBA STORE garde <b>10 %</b> de chaque vente.</label><button class="gold" style="width:100%;padding:14px" onclick="STAR.doReg()">🚀 Créer mon compte Super Star</button></div>');
 },
 pic:function(f,w){if(f)compress(f,w==='cover'?500:220,function(i){window['_sx_'+w]=i;toast('📷 Photo prête')})},
 doReg:function(){
  if(busy)return;
  var n=($('rN').value||'').trim(),p=($('rP').value||'').trim();
  if(n.length<2||p.replace(/\D/g,'').length<8){alert('Nom de scène et numéro de paiement obligatoires');return}
  if(!$('rK').checked){alert('Vous devez accepter les conditions');return}
  busy=1;
  api('register',{cid:cid(),name:n,bio:$('rB').value,city:$('rC').value,method:$('rM').value,payNumber:p,phone:me.phone,img:window._sx_reg||''}).then(function(r){
   busy=0;
   if(!r.ok){alert(r.err||'Erreur');return}
   SV('sx_tok',r.tok);window._sx_reg='';toast('🎉 Vous êtes Super Star !');STAR.space();
  });
 },
 /* --- espace artiste --- */
 space:function(){
  if(!tok()){return STAR.register()}
  show('<div class="ssh">🎤 Mon espace artiste</div><div id="sMe"><p style="color:#aaa">Chargement…</p></div>');
  api('me',{cid:cid(),tok:tok()}).then(function(r){
   var b=$('sMe');if(!b)return;
   if(!r.ok){b.innerHTML='<p style="color:#f66">'+esc(r.err||'Erreur')+'</p>';return}
   var mw=myWorks(),o=r.orders||[];
   b.innerHTML='<div class="sbx"><div class="sg"><div><b>'+r.sales+'</b><span>Ventes</span></div><div><b>'+fmt(r.earned)+' F</b><span>Gains (90 %)</span></div><div><b>'+fmt(r.paid)+' F</b><span>Déjà payé</span></div><div><b style="color:#25d366">'+fmt(r.due)+' F</b><span>À recevoir</span></div></div>'+(r.due>=1000?'<button class="gold" style="width:100%;margin-top:10px" onclick="STAR.payReq('+r.due+')">💬 Demander mon paiement</button>':'<p style="color:#aaa;font-size:13px;margin:8px 0 0">Paiement possible dès 1 000 F à recevoir.</p>')+'</div>'+
    '<div class="sbx"><h3>➕ Publier une œuvre</h3><select id="pT" class="input"><option value="music">🎵 Musique</option><option value="clip">🎬 Clip</option><option value="album">💿 Album</option><option value="photo">📸 Photo</option></select><input id="pTi" class="input" maxlength="80" placeholder="Titre"><textarea id="pD" class="input" rows="2" maxlength="300" placeholder="Description (facultatif)"></textarea><input id="pP" class="input" type="number" inputmode="numeric" placeholder="Prix en F (0 = gratuit, sinon 100 à 500000)"><input id="pU" class="input" placeholder="Lien de l\'œuvre (https://… YouTube, .mp3, .mp4, Drive)"><input id="pV" class="input" placeholder="Lien d\'aperçu gratuit (facultatif)"><p style="color:#aaa;font-size:13px">🖼️ Pochette / image</p><input type="file" id="pI" accept="image/*" class="input" onchange="STAR.pic(this.files[0],\'cover\')"><button class="gold" style="width:100%;padding:14px" onclick="STAR.publish()">Publier (visible sur Vibes)</button><p style="color:#aaa;font-size:12px">Le lien d\'une œuvre payante reste secret : il n\'est donné qu\'aux acheteurs validés.</p></div>'+
    '<div class="sbx"><h3>Mes œuvres ('+mw.length+')</h3>'+(mw.length?mw.map(function(w){return '<div style="display:flex;gap:8px;align-items:center;border-top:1px solid #222;padding:6px 0"><span style="flex:1">'+(ICON[w.type]||'')+' '+esc(w.title)+' • '+(w.price?fmt(w.price)+' F':'Gratuit')+'</span><button class="mini" onclick="STAR.del(\''+w.id+'\')">🗑</button></div>'}).join(''):'<p style="color:#aaa">Aucune œuvre publiée.</p>')+'</div>'+
    (o.length?'<div class="sbx"><h3>Dernières ventes</h3>'+o.map(function(x){return '<div style="border-top:1px solid #222;padding:6px 0;font-size:14px">'+esc(x.title)+' • '+fmt(x.share)+' F <span style="color:#aaa">('+esc(x.buyer||'')+')</span></div>'}).join('')+'</div>':'');
  });
 },
 publish:function(){
  if(busy)return;
  var d={cid:cid(),tok:tok(),type:$('pT').value,title:$('pTi').value,desc:$('pD').value,price:$('pP').value||0,url:($('pU').value||'').trim(),preview:($('pV').value||'').trim(),cover:window._sx_cover||''};
  if(!/^https:\/\//.test(d.url)){alert('Le lien de l\'œuvre doit commencer par https://');return}
  busy=1;
  api('publish',d).then(function(r){
   busy=0;
   if(!r.ok){alert(r.err||'Erreur');return}
   window._sx_cover='';toast('✅ Publié sur Super Star et Vibes');setTimeout(STAR.space,600);
  });
 },
 del:function(id){
  if(!confirm('Supprimer cette œuvre ?'))return;
  api('remove',{cid:cid(),tok:tok(),id:id}).then(function(r){toast(r.ok?'Supprimée':(r.err||'Erreur'));setTimeout(STAR.space,500)});
 },
 payReq:function(due){wa('Bonjour BOUBA STORE, je demande mon paiement Super Star.\nMontant à recevoir : '+fmt(due)+' F\nArtiste : '+((A[cid()]||{}).name||(me&&me.name)||'')+'\nIdentifiant : '+cid())},
 /* --- admin --- */
 admin:function(){
  if(!isAdmin)return;
  var c=sessionStorage.getItem('sx_ac')||prompt('Code administrateur :');
  if(!c)return;
  show('<div class="ssh">🔧 Admin Super Star</div><p style="color:#aaa">Chargement…</p>');
  api('admin_overview',{code:c}).then(function(r){
   if(!r.ok){sessionStorage.removeItem('sx_ac');sp.innerHTML='<button class="mini" onclick="STAR.open()">← Retour</button><p style="color:#f66">'+esc(r.err||'Erreur')+'</p>';return}
   sessionStorage.setItem('sx_ac',c);
   var h='<div class="sbx"><div class="sg"><div><b>'+fmt(r.commission)+' F</b><span>Votre commission (10 %)</span></div><div><b>'+fmt(r.revenue)+' F</b><span>Ventes totales</span></div></div></div>';
   h+='<div class="sbx"><h3>Paiements à valider ('+r.orders.length+')</h3>'+(r.orders.length?r.orders.map(function(o){return '<div style="border-top:1px solid #222;padding:8px 0;font-size:14px"><b>'+esc(o.oid)+'</b> • '+esc(o.title)+' • <b style="color:gold">'+fmt(o.price)+' F</b><br>Acheteur : '+esc((o.buyer||{}).name||'')+' • '+esc((o.buyer||{}).phone||'')+'<br><button class="gold" style="padding:8px 12px" onclick="STAR.ok(\''+o.oid+'\')">✅ Valider (paiement reçu)</button> <button class="ghost" style="padding:8px 12px" onclick="STAR.no(\''+o.oid+'\')">❌ Refuser</button></div>'}).join(''):'<p style="color:#aaa">Aucun paiement en attente.</p>')+'</div>';
   h+='<div class="sbx"><h3>Artistes à payer</h3>'+(r.artists.length?r.artists.map(function(a){return '<div style="border-top:1px solid #222;padding:8px 0;font-size:14px"><b>'+esc(a.name)+'</b> • '+a.sales+' vente(s)<br>Gains : '+fmt(a.earned)+' F • Payé : '+fmt(a.paid)+' F<br><b style="color:#25d366">À payer : '+fmt(a.due)+' F</b><br>💳 '+esc(a.pm)+' : '+esc(a.pn)+'<br><button class="mini" onclick="STAR.payout(\''+a.cid+'\')">💸 Marquer un paiement</button></div>'}).join(''):'<p style="color:#aaa">Aucune vente validée.</p>')+'</div>';
   sp.innerHTML='<button class="mini" onclick="STAR.open()">← Retour</button><div class="ssh">🔧 Admin Super Star</div>'+h;
  });
 },
 ok:function(oid){api('admin_validate',{code:sessionStorage.getItem('sx_ac'),oid:oid}).then(function(r){toast(r.ok?'✅ Paiement validé':(r.err||'Erreur'));STAR.admin()})},
 no:function(oid){if(confirm('Refuser cette commande ?'))api('admin_reject',{code:sessionStorage.getItem('sx_ac'),oid:oid}).then(function(){STAR.admin()})},
 payout:function(c){
  var a=Number(prompt('Montant payé à l\'artiste (en F) :'));if(!(a>0))return;
  api('admin_payout',{code:sessionStorage.getItem('sx_ac'),cid:c,amount:a}).then(function(r){toast(r.ok?'💸 Enregistré':(r.err||'Erreur'));STAR.admin()});
 }
};
function silentCheck(){
 var b=buys();
 Object.keys(b).forEach(function(id){
  if(b[id].paid)return;
  api('status',{oid:b[id].oid,btok:b[id].btok}).then(function(r){
   if(r.ok&&r.status==='paid'){var x=buys();if(x[id]){x[id].paid=true;SV('sx_buys',x);render();toast('✅ Votre achat est débloqué')}}
  });
 });
}
})();
// ============================================================
// UPLOAD DE FICHIER VIA LE WIDGET CLOUDINARY
// ============================================================
(function() {
    function injecterBoutonUpload() {
        const inputs = document.querySelectorAll('input[placeholder]');
        let urlInput = null;
        inputs.forEach(inp => {
            if (inp.placeholder.includes("Lien de l'œuvre") && !inp.dataset.uploadReady) {
                urlInput = inp;
            }
        });
        if (!urlInput) return;
        urlInput.dataset.uploadReady = '1';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gold';
        btn.style.cssText = 'margin-top:8px; margin-bottom:6px; width:100%; font-size:14px; font-weight:bold;';
        btn.innerHTML = '📁 OU ENVOYER UN FICHIER DEPUIS MON TÉLÉPHONE';

        urlInput.parentNode.insertBefore(btn, urlInput.nextSibling);

        btn.onclick = () => {
            if (typeof cloudinary === 'undefined') {
                alert("Le module d'upload n'est pas encore chargé. Réessaie dans quelques secondes.");
                return;
            }
            
            const myWidget = cloudinary.createUploadWidget({
                cloudName: 'vtcgahib', // Ton nom de nuage Cloudinary
                uploadPreset: 'bouba_upload', // Ton preset
                folder: 'oeuvres',
                sources: ['local', 'camera'], // Permet de choisir un fichier ou prendre une photo
                multiple: false,
                maxFileSize: 100000000 // 100 Mo
            }, (error, result) => {
                if (!error && result && result.event === "success") {
                    // Remplir le champ avec le lien de Cloudinary
                    urlInput.value = result.info.secure_url;
                    btn.innerHTML = '✅ Fichier envoyé ! Lien rempli automatiquement.';
                    btn.style.background = '#25D366';
                    btn.style.color = '#fff';
                    setTimeout(() => {
                        btn.innerHTML = '📁 OU ENVOYER UN FICHIER DEPUIS MON TÉLÉPHONE';
                        btn.style.background = '';
                        btn.style.color = '';
                    }, 3000);
                } else if (error) {
                    console.error("Erreur Cloudinary:", error);
                    alert("Erreur d'upload : " + error.message);
                }
            });
            myWidget.open();
        };
    }

    // Observer les changements pour injecter le bouton quand l'espace artiste s'ouvre
    const observer = new MutationObserver(() => {
        setTimeout(injecterBoutonUpload, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(injecterBoutonUpload, 1000);
})();
