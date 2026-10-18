/* BOUBA STORE – Page Contrôle : bouton « 🔁 Republier des articles ».
   Choisissez tous les articles ou seulement quelques-uns : ils repassent en tête de l'accueil (date de publication = maintenant). */
(function(){
var sel={p:new Set(),a:new Set()},vend=null,vmode='',q='',notif=false;
var css=document.createElement('style');
css.textContent='.rrow{display:flex;gap:10px;align-items:center;border-top:1px solid #222;padding:8px 0}.rrow input{width:22px;height:22px;flex:none}.rrow img{width:54px;height:54px;border-radius:8px;object-fit:cover;flex:none;background:#222}.rrow div{flex:1;min-width:0;font-size:14px;color:#eee}.rrow small{color:#aaa}.rbx{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.rbx h3{color:gold;font-size:16px;margin:0 0 6px}.rbar{position:sticky;bottom:0;background:#000;border-top:1px solid #333;padding:10px 0;z-index:5}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='republierPage';pg.className='page';pg.style.paddingBottom='20px';
function ago(t){if(!t)return 'date inconnue';var d=Math.floor((Date.now()-t)/864e5);return d<1?'aujourd\'hui':d===1?'hier':'il y a '+d+' jours'}
function prodList(){return Object.values(S.products||{}).filter(function(p){return p&&p.id}).sort(function(a,b){return (a.date||0)-(b.date||0)})}
function match(x){return !q||String(x.name||'').toLowerCase().indexOf(q)>-1}
function row(k,x,shop){
 return '<label class="rrow"><input type="checkbox" data-k="'+k+'" data-id="'+esc(x.id)+'"'+(sel[k].has(x.id)?' checked':'')+'><img loading="lazy" src="'+safeImg(x.img)+'" alt=""><div><b>'+esc(x.name||'')+'</b><br><small>'+fmt(x.price)+' F • '+(shop?esc(shop)+' • ':'')+ago(x.date)+'</small></div></label>';
}
function count(){return sel.p.size+sel.a.size}
function drawList(){
 var box=document.getElementById('rList');if(!box)return;
 var ps=prodList().filter(match),h='<div class="rbx"><h3>🛍️ Articles BOUBA STORE ('+ps.length+')</h3>'+(ps.length?ps.map(function(p){return row('p',p)}).join(''):'<p style="color:#aaa">Aucun article.</p>')+'</div>';
 if(vend===null)h+='<div class="rbx"><h3>🏪 Articles des vendeurs</h3><p style="color:#aaa">Chargement…</p></div>';
 else{
  var as=vend.filter(match);
  h+='<div class="rbx"><h3>🏪 Articles des vendeurs ('+as.length+')</h3>'+(vmode==='local'?'<p style="color:#ffb3b3;font-size:12px">⚠️ Base en ligne inaccessible : seuls les articles de ce téléphone sont listés.</p>':'')+(as.length?as.map(function(a){return row('a',a,a.shopName)}).join(''):'<p style="color:#aaa">Aucun article de vendeur.</p>')+'</div>';
 }
 box.innerHTML=h;upd();
}
function upd(){var b=document.getElementById('rGo');if(b)b.textContent='🔁 Republier la sélection ('+count()+')'}
function open(){
 if(typeof isAdmin==='undefined'||!isAdmin){toast('Réservé à l\'administrateur');return}
 if(!pg.parentNode)document.body.appendChild(pg);
 sel={p:new Set(),a:new Set()};q='';vend=null;
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🔁 REPUBLIER DES ARTICLES</h2><p style="color:#ccc;font-size:14px">Cochez les articles à remettre en tête de l\'accueil. Les plus anciens sont en haut.</p>'+
  '<input id="rQ" class="input" placeholder="🔎 Chercher un article…"><div style="display:flex;gap:8px;margin:6px 0"><button class="ghost" style="flex:1" onclick="REPUB.all()">✔ Tout sélectionner</button><button class="ghost" style="flex:1" onclick="REPUB.none()">✖ Aucun</button></div>'+
  '<label style="display:block;color:#ddd;font-size:14px;margin:6px 0"><input type="checkbox" id="rN"> 📣 Envoyer une notification aux clients</label>'+
  '<div id="rList"></div><div class="rbar"><button id="rGo" class="gold" style="width:100%;padding:14px" onclick="REPUB.go()">🔁 Republier la sélection (0)</button></div>';
 openPage('republierPage');drawList();
 document.getElementById('rQ').oninput=function(){q=this.value.trim().toLowerCase();drawList()};
 pg.onchange=function(e){var t=e.target;if(t&&t.dataset&&t.dataset.k){if(t.checked)sel[t.dataset.k].add(t.dataset.id);else sel[t.dataset.k].delete(t.dataset.id);upd()}};
 import('./bouba-data.js').then(function(m){return Promise.all([m.list('articles'),m.mode()])}).then(function(r){
  vend=(r[0]||[]).filter(function(a){return a&&a.id}).sort(function(a,b){return (a.date||0)-(b.date||0)});vmode=r[1];drawList();
 }).catch(function(){vend=[];drawList()});
}
async function go(){
 var ps=prodList().filter(function(p){return sel.p.has(p.id)}),as=(vend||[]).filter(function(a){return sel.a.has(a.id)}),n=ps.length+as.length;
 if(!n){toast('Sélectionnez au moins un article');return}
 if(!confirm('Republier '+n+' article(s) ? Ils réapparaîtront en tête de l\'accueil.'))return;
 var base=Date.now(),i=0,wantN=document.getElementById('rN')&&document.getElementById('rN').checked;
 ps.forEach(function(p){write('products/'+p.id+'/date',base+(i++))});
 if(as.length){
  try{var m=await import('./bouba-data.js');for(var k=0;k<as.length;k++){await m.patch('articles',as[k].id,{date:base+(i++)})}}
  catch(e){toast('⚠️ Certains articles de vendeurs n\'ont pas pu être mis à jour')}
 }
 if(wantN)fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'🆕 Articles disponibles',body:n+' article(s) à découvrir sur BOUBA STORE'})}).catch(function(){});
 toast('✅ '+n+' article(s) republié(s)');
 try{if(window.__baShow)window.__baShow()}catch(e){}
 setTimeout(function(){closeAll()},600);
}
window.REPUB={
 open:open,go:go,
 all:function(){prodList().filter(match).forEach(function(p){sel.p.add(p.id)});(vend||[]).filter(match).forEach(function(a){sel.a.add(a.id)});drawList()},
 none:function(){sel={p:new Set(),a:new Set()};drawList()}
};
setInterval(function(){
 var panel=document.getElementById('adminPanel'),t=document.getElementById('tabs');
 if(panel&&t&&!document.getElementById('repubBtn')){
  var d=document.createElement('div');d.id='repubBtn';
  d.innerHTML='<button class="gold" style="width:100%;margin:8px 0" onclick="REPUB.open()">🔁 Republier des articles</button>';
  panel.insertBefore(d,t);
 }
},1500);
})();
