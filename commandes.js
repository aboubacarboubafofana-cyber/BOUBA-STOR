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
