/* BOUBA STORE – Partage des articles : après chaque nouvelle publication, une fenêtre propose le partage en un geste
   (WhatsApp : message, statut, groupes ; Facebook) avec la PHOTO. Si Facebook automatique est activé sur le serveur, la page Facebook est publiée toute seule. */
(function(){
var css=document.createElement('style');
css.textContent='#shr{position:fixed;inset:0;z-index:1400;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;padding:18px}#shr.on{display:flex}#shr .bx{background:#111;border:2px solid #d4af37;border-radius:18px;padding:16px;max-width:380px;width:100%;max-height:92vh;overflow:auto}#shr h3{color:#ffd700;margin:0 0 8px;font-size:18px;text-align:center}#shr .p{display:flex;gap:10px;align-items:center;background:#000;border:1px solid #333;border-radius:12px;padding:8px;margin-bottom:10px}#shr .p img{width:64px;height:64px;border-radius:8px;object-fit:cover}#shr button{width:100%;margin:5px 0;padding:13px;border-radius:12px;font-size:15px;font-weight:800;border:1px solid #d4af37;background:#000;color:#ffd700}#shr button.g{background:#ffd700;color:#000}#shr button.w{background:#25d366;color:#000;border:0}#shr button.f{background:#1877f2;color:#fff;border:0}#shr .s{font-size:13px;color:#ddd;text-align:center;margin:6px 0;min-height:18px}';
document.head.appendChild(css);
var box=null,cur='';
var link=function(id){return location.origin+'/api/p?id='+id};
function P(id){return (S.products||{})[id]}
function text(p){return '🆕 '+p.name+'\n💰 '+fmt(p.price)+' F'+(p.cat?' • '+p.cat:'')+'\n🛒 Commandez sur BOUBA STORE :\n'+link(p.id)}
function modal(id,title,status){
 var p=P(id);if(!p)return;cur=id;
 if(!box){box=document.createElement('div');box.id='shr';document.body.appendChild(box)}
 box.innerHTML='<div class="bx"><h3>'+title+'</h3><div class="p"><img src="'+safeImg(p.img)+'" alt=""><div><b style="color:#fff">'+esc(p.name)+'</b><br><span style="color:#ffd700">'+fmt(p.price)+' F</span></div></div><div class="s" id="shS">'+(status||'')+'</div>'+
  '<button class="g" onclick="SHARE.native()">📤 Partager avec la photo<br><span style="font-size:12px;font-weight:600">WhatsApp (message, statut, groupes), Facebook…</span></button>'+
  '<button class="w" onclick="SHARE.wa()">💬 WhatsApp (message + lien)</button>'+
  '<button class="f" onclick="SHARE.fb()">📘 Facebook (partager le lien)</button>'+
  '<button onclick="SHARE.page()">📘 Publier sur ma page Facebook (auto)</button>'+
  '<button onclick="SHARE.close()">Fermer</button></div>';
 box.classList.add('on');
}
function setS(t){var e=document.getElementById('shS');if(e)e.innerHTML=t}
function fileOf(p){return fetch(p.img).then(function(r){return r.blob()}).then(function(b){return new File([b],'article.jpg',{type:b.type||'image/jpeg'})})}
function social(id,force,code){
 return fetch('/api/social',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:id,force:!!force,code:code||''})}).then(function(r){return r.json()}).catch(function(){return {ok:false,err:'Connexion impossible'}});
}
function report(r){
 if(r.configured===false||r.err==='non configuré')return 'ℹ️ Facebook automatique non activé sur le serveur.';
 if(r.already)return '✅ Déjà publié sur Facebook.';
 var f=r.results&&r.results.facebook;
 if(f&&f.ok)return '✅ Publié automatiquement sur votre page Facebook.';
 if(f&&!f.ok)return '⚠️ Facebook : '+esc(f.err||'erreur');
 if(r.ok)return '✅ Envoyé vers votre automatisation.';
 return '⚠️ '+esc(r.err||'Publication automatique impossible');
}
window.SHARE={
 open:function(id){modal(id,'📤 Partager cet article','Partagez avec la photo sur WhatsApp ou Facebook.')},
 close:function(){if(box)box.classList.remove('on')},
 native:function(){
  var p=P(cur);if(!p)return;var t=text(p);
  fileOf(p).then(function(f){
   if(navigator.canShare&&navigator.canShare({files:[f]}))return navigator.share({files:[f],text:t});
   throw new Error('nofile');
  }).catch(function(e){
   if(e&&e.name==='AbortError')return;
   if(navigator.share)return navigator.share({text:t}).catch(function(){});
   window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
  });
 },
 wa:function(){var p=P(cur);if(p)window.open('https://wa.me/?text='+encodeURIComponent(text(p)),'_blank')},
 fb:function(){window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link(cur)),'_blank')},
 page:function(){
  var code=sessionStorage.getItem('sx_ac')||prompt('Code administrateur :');if(!code)return;
  setS('⏳ Publication sur Facebook…');
  social(cur,true,code).then(function(r){if(r.ok)sessionStorage.setItem('sx_ac',code);setS(report(r))});
 }
};
/* ---------- après chaque nouvel article ---------- */
var _sp=window.saveProd;
if(_sp)window.saveProd=function(){
 var isNew=!editId,before=Object.keys(S.products||{});
 _sp();
 if(!isNew)return;
 setTimeout(function(){
  var added=Object.keys(S.products||{}).filter(function(k){return before.indexOf(k)<0});
  if(!added.length)return;
  var id=added[0];
  modal(id,'🎉 Article publié !','⏳ Publication automatique sur Facebook…');
  setTimeout(function(){social(id).then(function(r){setS(report(r)+'<br>Partagez-le aussi sur WhatsApp :')})},1500);
 },500);
};
/* ---------- bouton 📤 dans Contrôle > Produits ---------- */
var _ra=window.renderAdmin;
if(_ra)window.renderAdmin=function(){
 _ra();
 if(typeof tab==='undefined'||tab!=='prods')return;
 document.querySelectorAll('#adminBody .row').forEach(function(r){
  if(r.querySelector('.shrb'))return;
  var d=r.querySelector('button[onclick*="delProd"]');if(!d)return;
  var m=/delProd\('([^']+)'\)/.exec(d.getAttribute('onclick')||'');if(!m)return;
  var b=document.createElement('button');b.className='mini shrb';b.textContent='📤';b.setAttribute('onclick',"SHARE.open('"+m[1]+"')");
  r.insertBefore(b,d);
 });
};
})();
