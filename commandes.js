/* BOUBA STORE – Alerte de nouvelles commandes pour l'administrateur (dans l'appli, sans WhatsApp).
   Affiche un message, vibre, fait un petit bip et indique le nombre de commandes en attente sur l'onglet Contrôle. */
(function(){
var subbed=0;
function beep(){
 try{var c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=0.08;o.start();
  setTimeout(function(){o.stop();c.close()},350)}catch(e){}
}
setInterval(function(){
 if(typeof isAdmin==='undefined'||!isAdmin)return;
 if(!subbed&&typeof fb!=='undefined'&&fb&&typeof sub==='function'){subbed=1;try{sub('orders')}catch(e){}}
 var o=S.orders;if(!o)return;
 var ids=Object.keys(o),seen=LS('o_seen',null);
 if(seen===null){SV('o_seen',ids)}
 else{
  var nw=ids.filter(function(i){return seen.indexOf(i)<0});
  if(nw.length){SV('o_seen',ids);toast('🛒 '+nw.length+' nouvelle(s) commande(s) !');try{if(navigator.vibrate)navigator.vibrate([200,100,200])}catch(e){}beep()}
 }
 var pend=ids.filter(function(i){var x=o[i];return x&&(!x.status||x.status==='en attente')}).length;
 var n=document.getElementById('navAdmin');
 if(n){var t='⚙️<br>Contrôle'+(pend?' <b style="color:#ff5a5a">('+pend+')</b>':'');if(n.dataset.b!==t){n.dataset.b=t;n.innerHTML=t}}
},3000);
})();

/* ---------- Contrôle > Commandes : affichage clair (photo, article, quantité, boutons rapides) ---------- */
(function(){
var f='',q='';
var COL={'en attente':'#ff9f1a','confirmée':'#3b82f6','livrée':'#25d366','annulée':'#ff5a5a'};
var cssx=document.createElement('style');
cssx.textContent='.oc{background:#111;border:2px solid #333;border-radius:14px;padding:12px;margin:12px 0}.oc.w{border-color:#ffd700;box-shadow:0 0 0 2px rgba(255,215,0,.15)}.och{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.ost{display:inline-block;border-radius:12px;padding:3px 10px;font-size:12px;font-weight:900;color:#000}.oit{display:flex;gap:10px;align-items:center;background:#000;border:1px solid #2a2a2a;border-radius:10px;padding:8px;margin:8px 0}.oit img,.oit .ph{width:64px;height:64px;border-radius:8px;object-fit:cover;flex:none;background:#222;display:grid;place-items:center;font-size:26px}.oit b{color:#fff;font-size:16px}.oq{background:#ffd700;color:#000;border-radius:10px;padding:2px 9px;font-weight:900;font-size:16px;flex:none}.ofl{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px}.ofl button{padding:8px 12px;border-radius:18px;border:1px solid #d4af37;background:#000;color:#ffd700;font-weight:800;font-size:13px}.ofl button.on{background:#ffd700;color:#000}.oqb{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.oqb button,.oqb a{flex:1;min-width:90px;text-align:center;text-decoration:none;padding:10px 6px;border-radius:10px;border:1px solid #d4af37;background:#000;color:#ffd700;font-weight:800;font-size:13px}';
document.head.appendChild(cssx);
function ago(t){var s=Math.floor((Date.now()-t)/1000);if(s<60)return 'à l\'instant';if(s<3600)return 'il y a '+Math.floor(s/60)+' min';if(s<86400)return 'il y a '+Math.floor(s/3600)+' h';return 'il y a '+Math.floor(s/86400)+' j'}
function img(i){
 var P=S.products||{},p=i.id&&P[i.id];
 if(!p){var n=String(i.name||'').trim().toLowerCase();p=Object.values(P).find(function(x){return x&&String(x.name||'').trim().toLowerCase()===n})}
 return p&&p.img?'<img src="'+safeImg(p.img)+'" alt="">':'<div class="ph">🛍️</div>';
}
function card(o){
 var its=o.items||[],sum=its.reduce(function(s,i){return s+(+i.price||0)*(+i.qty||1)},0),diff=(+o.total||0)-sum,col=COL[o.status]||'#aaa',n=its.reduce(function(s,i){return s+(+i.qty||1)},0);
 var ph=String(o.phone||'').replace(/\D/g,''),names=its.map(function(i){return i.name+' x'+i.qty}).join(', ');
 var wa='https://wa.me/'+ph+'?text='+encodeURIComponent('Bonjour '+(o.name||'')+', votre commande #'+o.id+' ('+names+') — total '+fmt(o.total)+' F. Merci d\'avoir choisi BOUBA STORE !');
 return '<div class="oc'+(o.status==='en attente'?' w':'')+'" style="border-left:6px solid '+col+'">'+
  '<div class="och"><div><span class="ost" style="background:'+col+'">'+esc(String(o.status||'').toUpperCase())+'</span>'+(o.status==='en attente'?' <b style="color:#ffd700">🆕</b>':'')+'<br><span style="color:#aaa;font-size:12px">#'+esc(o.id)+' • '+ago(o.date)+'<br>'+new Date(o.date).toLocaleString('fr-FR')+'</span></div><div style="text-align:right"><b style="color:#ffd700;font-size:20px">'+fmt(o.total)+' F</b><br><span style="color:#aaa;font-size:12px">🛍️ '+n+' article(s)</span></div></div>'+
  '<div style="margin:8px 0;color:#eee;font-size:14px">👤 <b>'+esc(o.name)+'</b> • <a href="tel:'+esc(ph)+'" style="color:#8ec0ff">'+esc(o.phone)+'</a> • 📍 '+esc(o.city)+'</div>'+
  its.map(function(i){return '<div class="oit">'+img(i)+'<div style="flex:1;min-width:0"><b>'+esc(i.name)+'</b><br><span style="color:#aaa;font-size:13px">'+fmt(i.price)+' F l\'unité • sous-total <b style="color:#ffd700">'+fmt((+i.price||0)*(+i.qty||1))+' F</b></span></div><span class="oq">× '+esc(i.qty)+'</span></div>'}).join('')+
  (Math.abs(diff)>1?'<div style="color:#aaa;font-size:12px;margin:2px 0">'+(diff>0?'➕ Livraison / frais : ':'➖ Réductions : ')+fmt(Math.abs(diff))+' F</div>':'')+
  '<select class="input" style="margin:8px 0 0" onchange="setStatus(\''+o.id+'\',this.value)">'+STAT.map(function(s){return '<option '+(s===o.status?'selected':'')+'>'+s+'</option>'}).join('')+'</select>'+
  '<div class="oqb">'+(o.status==='en attente'?'<button onclick="setStatus(\''+o.id+'\',\'confirmée\')">✅ Confirmer</button>':'')+(o.status!=='livrée'&&o.status!=='annulée'?'<button onclick="setStatus(\''+o.id+'\',\'livrée\')">🎉 Livrée</button>':'')+'<a href="'+wa+'" target="_blank" rel="noopener">💬 WhatsApp</a><a href="tel:'+esc(ph)+'">📞 Appeler</a><button style="color:#ff5a5a;border-color:#ff5a5a;flex:0 0 52px;min-width:52px" onclick="delOrder(\''+o.id+'\')">🗑️</button></div></div>';
}
function draw(){
 var b=document.getElementById('adminBody');if(!b)return;
 var os=orders(),c={w:0,e:0,l:0,a:0};
 os.forEach(function(o){if(o.status==='en attente')c.w++;else if(o.status==='confirmée')c.e++;else if(o.status==='livrée')c.l++;else if(o.status==='annulée')c.a++});
 if(f==='')f=c.w?'w':'all';
 var show=os.filter(function(o){return f==='all'||(f==='w'&&o.status==='en attente')||(f==='e'&&o.status==='confirmée')||(f==='l'&&o.status==='livrée')||(f==='a'&&o.status==='annulée')});
 var t=q.toLowerCase();
 if(t)show=show.filter(function(o){return (String(o.name)+' '+o.phone+' '+o.id+' '+(o.items||[]).map(function(i){return i.name}).join(' ')).toLowerCase().indexOf(t)>-1});
 var chips=[['w','🆕 À traiter ('+c.w+')'],['e','✅ Confirmées ('+c.e+')'],['l','🎉 Livrées ('+c.l+')'],['a','❌ Annulées ('+c.a+')'],['all','Tout ('+os.length+')']];
 b.innerHTML='<input id="ordQ" class="input" placeholder="🔎 Client, téléphone ou article…" value="'+esc(q)+'"><div class="ofl">'+chips.map(function(x){return '<button class="'+(f===x[0]?'on':'')+'" onclick="ORD.f(\''+x[0]+'\')">'+x[1]+'</button>'}).join('')+'</div>'+(show.map(card).join('')||'<p style="color:#888;text-align:center;margin:30px 0">Aucune commande ici.</p>');
 var i=document.getElementById('ordQ');if(i)i.oninput=function(){q=this.value.trim();var p=this.selectionStart;draw();var n=document.getElementById('ordQ');if(n){n.focus();try{n.setSelectionRange(p,p)}catch(e){}}};
}
window.ORD={f:function(x){f=x;draw()}};
var _ra=window.renderAdmin;
if(_ra)window.renderAdmin=function(){
 _ra();
 if(typeof tab!=='undefined'&&tab==='orders'&&typeof isAdmin!=='undefined'&&isAdmin){var a=document.activeElement;if(a&&a.id==='ordQ')return;draw()}
};
})();
