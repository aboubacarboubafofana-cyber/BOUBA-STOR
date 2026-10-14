/* BOUBA STORE – Tutoriel de premier lancement (5 écrans). Se montre une seule fois ; rouvrable depuis le Menu. */
(function(){
var SL=[
 ['🛍️','Bienvenue sur BOUBA STORE','Mode, chaussures, cosmétiques et bien plus. Tout se commande en quelques touches.'],
 ['🛒','Commander, c\'est simple','Ajoutez au panier, choisissez votre commune, touchez « Commander » : votre commande part sur WhatsApp. -10 % sur la première !'],
 ['🎁','Gagnez chaque jour','Roue de la chance, points, parrainage et missions : du crédit offert pour vos achats.'],
 ['🎬','BOUBA VIBES','Publiez photos, vidéos et stories. Activez la monétisation pour gagner de l\'argent avec vos vues.'],
 ['📲','Gardez l\'appli sous la main','Installez-la sur votre écran d\'accueil et activez les notifications pour ne rien rater.']
];
var i=0,box=null;
var css=document.createElement('style');
css.textContent='#onb{position:fixed;inset:0;z-index:1500;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;color:#fff}#onb .e{font-size:96px}#onb h2{color:#ffd700;margin:18px 0 10px;font-size:26px}#onb p{color:#ddd;font-size:17px;line-height:1.5;max-width:420px}#onb .d{display:flex;gap:8px;margin:26px 0}#onb .d i{width:10px;height:10px;border-radius:50%;background:#444}#onb .d i.on{background:#ffd700}#onb .b{display:flex;gap:10px;width:100%;max-width:420px}#onb button{flex:1;height:50px;border-radius:25px;border:1px solid #d4af37;background:#000;color:#ffd700;font-size:16px;font-weight:800}#onb button.g{background:#ffd700;color:#000}';
document.head.appendChild(css);
function draw(){
 if(!box)return;var s=SL[i],last=i===SL.length-1;
 box.innerHTML='<div class="e">'+s[0]+'</div><h2>'+s[1]+'</h2><p>'+s[2]+'</p><div class="d">'+SL.map(function(_,k){return '<i class="'+(k===i?'on':'')+'"></i>'}).join('')+'</div><div class="b">'+(last?'':'<button onclick="ONB.close()">Passer</button>')+'<button class="g" onclick="ONB.next()">'+(last?'Commencer 🚀':'Suivant')+'</button></div>';
}
window.ONB={
 open:function(){i=0;if(!box){box=document.createElement('div');box.id='onb';document.body.appendChild(box)}box.style.display='flex';draw()},
 next:function(){if(i>=SL.length-1)return ONB.close();i++;draw()},
 close:function(){SV('p_onb',1);if(box)box.style.display='none'}
};
if(!LS('p_onb',0))setTimeout(function(){if(!LS('p_onb',0))ONB.open()},1200);
})();
