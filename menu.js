/* BOUBA STORE – un seul bouton « 🎁 Menu » qui regroupe les 5 boutons de l'accueil.
   Dépend de features.js (PLUS), fun.js (PLAY), suite.js (PL2), bonus.js (BON), more.js (PM) */
(function(){
var css=document.createElement('style');
css.textContent=
 /* cache les 5 anciens boutons */
 '#trendZone>div:first-child,#funZone button[onclick="PLAY.open()"],#p2Zone button[onclick="PL2.open()"],#bonusZone button[onclick="BON.open()"],#moreAZone button[onclick="PM.open()"]{display:none!important}'+
 '.mtile{background:#111;border:1px solid #d4af37;border-radius:14px;padding:16px 8px;text-align:center;color:#ffd700;font-weight:800;font-size:15px;cursor:pointer;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;min-height:110px}.mtile span{font-size:34px}.mtile small{font-size:12px;color:#25d366;font-weight:700;min-height:14px}.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}';
document.head.appendChild(css);

var pg=document.createElement('div');pg.id='menuPage';pg.className='page';
var zone=document.createElement('div');zone.id='menuZone';zone.style.cssText='padding:0 10px';
var today=function(){return new Date().toISOString().slice(0,10)};

function badges(){
 var f=LS('p_F',{}),v=LS('p_F3',{}),spent=+v.spent||0,b={};
 b.play=f.lastWheel!==today()?'1 tour gratuit !':'';
 b.lvl=spent>=100000?'🥇 Or':spent>=30000?'🥈 Argent':'🥉 Bronze';
 b.fav=(LS('p_fav',[])||[]).length?(LS('p_fav',[]).length+' favori(s)'):'';
 return b;
}
function open(){
 var b=badges();
 function t(ic,name,sub,fn){return '<div class="mtile" onclick="'+fn+'"><span>'+ic+'</span>'+name+'<small>'+sub+'</small></div>'}
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🎁 MENU</h2><div class="mgrid">'+
  t('❤️','Mon espace','Favoris • Commandes',"PLUS.open()")+
  t('🎡','Jeux & cadeaux',b.play,"PLAY.open()")+
  t('🏪','Boutiques & bons','Suivre • QR • Comparer',"PL2.open()")+
  t('🌟','Niveau & missions',b.lvl,"BON.open()")+
  t('🚀','BOUBA+ & enchères','Livraison • Sondages',"PM.open()")+
  t('🎁','Mes avantages','Points • Parrainage',"openPage('promoPage')")+
  t('💰','Portefeuille & tombola','Solde • Gros • Vendeur du mois',"PRO.wallet()")+
  t('🔁','Commandes & livraisons','Recommander • Livreur',"PRO.orders()")+
  t('📲','Installer l\'application','Écran d\'accueil',"PLUS.install()")+
  t('💬','Aide','WhatsApp',"PLUS.aide()")+
  '</div>';
 openPage('menuPage');
}
window.MENU={open:open};

function render(){
 var g=$('grid');if(!g)return;
 if(!pg.parentNode)document.body.appendChild(pg);
 if(!zone.parentNode){
  var t=$('trendZone');
  if(t&&t.parentNode)t.parentNode.insertBefore(zone,t);else g.parentNode.insertBefore(zone,g);
 }
 var b=badges();
 var inst=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
 zone.innerHTML=(inst?'':'<button class="gold" style="width:100%;margin:6px 0;padding:14px;background:#25d366" onclick="PLUS.install()">📲 Installer l\'application</button>')+'<button class="gold" style="width:100%;margin:6px 0;padding:14px" onclick="MENU.open()">🎁 Menu'+(b.play?' • '+b.play:'')+'</button>';
}
setInterval(render,1500);
var _rs=window.renderStore;
if(_rs)window.renderStore=function(){_rs();render()};
})();
