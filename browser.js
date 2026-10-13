/* BOUBA STORE – Navigateur intégré : barre d'adresse / recherche, onglets, favoris, historique, raccourcis, partage.
   Limite technique : beaucoup de sites (Google, YouTube, Facebook, TikTok…) refusent d'être affichés dans une autre appli ;
   ils s'ouvrent alors dans le navigateur du téléphone (souvent en fenêtre intégrée si l'appli est installée). */
(function(){
var MAXTABS=5;
var SE={google:['Google','https://www.google.com/search?q='],ddg:['DuckDuckGo','https://duckduckgo.com/?q='],bing:['Bing','https://www.bing.com/search?q=']};
var SITES=[['🔎','Google','https://www.google.com'],['▶️','YouTube','https://m.youtube.com'],['📘','Facebook','https://m.facebook.com'],['🎵','TikTok','https://www.tiktok.com'],['📸','Instagram','https://www.instagram.com'],['💬','WhatsApp Web','https://web.whatsapp.com'],['📚','Wikipédia','https://fr.wikipedia.org'],['🌐','Traduction','https://translate.google.com'],['🛒','Jumia CI','https://www.jumia.ci'],['🟠','Orange CI','https://www.orange.ci'],['🌊','Wave','https://www.wave.com'],['📰','Abidjan.net','https://news.abidjan.net']];
/* sites qui refusent l'affichage dans une autre appli : on les ouvre directement dehors */
var BLOCK=/(^|\.)(google\.[a-z.]+|youtube\.com|youtu\.be|facebook\.com|fb\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|whatsapp\.com|linkedin\.com|amazon\.[a-z.]+|netflix\.com|paypal\.com|wave\.com|orange\.ci|telegram\.org|t\.me|snapchat\.com|pinterest\.[a-z.]+)$/i;
var tabs=LS('n_tabs',[]),cur=LS('n_cur',0);
if(!tabs.length)tabs=[{u:'',t:'Nouvel onglet'}];
if(cur>=tabs.length)cur=0;
var save=function(){SV('n_tabs',tabs);SV('n_cur',cur)};
var bk=function(){return LS('n_bk',[])},hs=function(){return LS('n_hs',[])};
var se=function(){return LS('n_se','google')};

function norm(q){
 q=String(q||'').trim();if(!q)return '';
 if(/^(javascript|data|file|blob):/i.test(q))return '';
 if(/^https?:\/\//i.test(q))return q;
 if(!/\s/.test(q)&&/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(q))return 'https://'+q;
 return (SE[se()]||SE.google)[1]+encodeURIComponent(q);
}
function host(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}}
function blocked(u){return BLOCK.test(host(u))}

var css=document.createElement('style');
css.textContent='.nvt{display:flex;gap:6px;overflow-x:auto;margin:8px 0;scrollbar-width:none}.nvt div{flex:none;max-width:130px;padding:7px 10px;border:1px solid #444;border-radius:10px;background:#111;color:#ddd;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nvt div.on{border-color:gold;color:#ffd700;background:#2a2200}.nvb{display:flex;gap:8px;align-items:center}.nvb input{flex:1 1 auto;min-width:0;width:auto!important;margin:0!important;height:46px;font-size:16px;padding:0 14px;border-radius:23px}.nvb button{flex:none;width:50px;height:46px;border-radius:23px;border:0;background:#ffd700;color:#000;font-size:18px;font-weight:900;padding:0}.nvg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.nvg div{background:#111;border:1px solid #d4af37;border-radius:12px;padding:10px 2px;text-align:center;color:#ffd700;font-size:12px;font-weight:700}.nvg span{display:block;font-size:26px}.nvc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:10px;margin:10px 0}.nvc h3{color:gold;font-size:15px;margin:0 0 6px}.nvr{display:flex;gap:8px;align-items:center;border-top:1px solid #222;padding:8px 0;font-size:14px;color:#eee}.nvr div{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nvtools{display:flex;gap:6px;margin:8px 0}.nvtools button{flex:1;background:#000;border:1px solid #444;color:#ffd700;border-radius:10px;padding:9px 2px;font-size:16px}.nvf{width:100%;height:calc(100vh - 250px);min-height:360px;border:1px solid #444;border-radius:10px;background:#fff}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='navPage';pg.className='page';

function addHist(u){
 var h=hs().filter(function(x){return x.u!==u});h.unshift({u:u,t:host(u)||u,d:Date.now()});SV('n_hs',h.slice(0,50));
}
function render(){
 var t=tabs[cur],h='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="mini" onclick="closeAll()">←</button><h3 style="color:gold;margin:0;flex:1">🌐 Navigateur BOUBA</h3><select id="nvSe" class="input" style="margin:0;width:auto;height:36px;font-size:13px">'+Object.keys(SE).map(function(k){return '<option value="'+k+'"'+(k===se()?' selected':'')+'>'+SE[k][0]+'</option>'}).join('')+'</select></div>';
 h+='<div class="nvb"><input id="nvIn" class="input" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="Rechercher ou saisir une adresse" value="'+esc(t.u||'')+'"><button onclick="NAV.go()">➜</button></div>';
 h+='<div class="nvt">'+tabs.map(function(x,i){return '<div class="'+(i===cur?'on':'')+'" onclick="NAV.tab('+i+')">'+esc(x.t||'Nouvel onglet')+(tabs.length>1?' <span onclick="event.stopPropagation();NAV.close('+i+')" style="color:#f66">✕</span>':'')+'</div>'}).join('')+(tabs.length<MAXTABS?'<div onclick="NAV.add()" style="color:gold">＋</div>':'')+'</div>';
 if(t.u){
  var isB=bk().some(function(x){return x.u===t.u});
  h+='<div class="nvtools"><button onclick="NAV.reload()" title="Actualiser">↻</button><button onclick="NAV.ext()" title="Ouvrir dans le navigateur du téléphone">↗</button><button onclick="NAV.star()" title="Favori">'+(isB?'⭐':'☆')+'</button><button onclick="NAV.copy()" title="Copier le lien">📋</button><button onclick="NAV.share()" title="Partager">📤</button><button onclick="NAV.home()" title="Accueil">🏠</button></div>';
  if(blocked(t.u))h+='<div class="nvc"><h3>'+esc(host(t.u))+'</h3><p style="color:#ddd;font-size:14px;margin:4px 0 8px">Ce site refuse d\'être affiché dans une autre application. Touchez le bouton pour l\'ouvrir dans le navigateur de votre téléphone.</p><button class="gold" style="width:100%" onclick="NAV.ext()">↗ Ouvrir '+esc(host(t.u))+'</button></div>';
  else h+='<p style="font-size:12px;color:#aaa;margin:4px 0">Si la page reste vide, ce site refuse l\'affichage ici : touchez ↗.</p><iframe id="nvFr" class="nvf" src="'+esc(t.u)+'" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" loading="lazy"></iframe>';
 }else{
  h+='<div class="nvg">'+SITES.map(function(s,i){return '<div onclick="NAV.site('+i+')"><span>'+s[0]+'</span>'+esc(s[1])+'</div>'}).join('')+'</div>';
  var b=bk(),hh=hs().slice(0,8);
  h+='<div class="nvc"><h3>⭐ Mes favoris</h3>'+(b.length?b.map(function(x,i){return '<div class="nvr"><div onclick="NAV.open(\''+i+'\',\'b\')">'+esc(x.t||host(x.u))+'<br><span style="font-size:11px;color:#888">'+esc(host(x.u))+'</span></div><span onclick="NAV.rmb('+i+')" style="color:#f66">🗑</span></div>'}).join(''):'<p style="color:#aaa;font-size:14px;margin:0">Touchez ☆ sur une page pour l\'ajouter ici.</p>')+'</div>';
  h+='<div class="nvc"><h3>🕘 Historique</h3>'+(hh.length?hh.map(function(x,i){return '<div class="nvr"><div onclick="NAV.open(\''+i+'\',\'h\')">'+esc(x.t)+'<br><span style="font-size:11px;color:#888">'+esc(x.u.slice(0,60))+'</span></div></div>'}).join('')+'<button class="ghost" style="width:100%;margin-top:6px" onclick="NAV.clearH()">Effacer l\'historique</button>':'<p style="color:#aaa;font-size:14px;margin:0">Aucune page visitée.</p>')+'</div>';
 }
 pg.innerHTML=h;
 var i=$('nvIn');if(i)i.onkeydown=function(e){if(e.key==='Enter')NAV.go()};
 var s=$('nvSe');if(s)s.onchange=function(){SV('n_se',s.value)};
}
function load(u){
 u=norm(u);if(!u){toast('Adresse invalide');return}
 tabs[cur]={u:u,t:host(u)||u};save();addHist(u);
 render();
}
function open(){
 if(!pg.parentNode)document.body.appendChild(pg);
 render();openPage('navPage');
}
window.NAV={
 open:function(i,w){
  if(w==='b'||w==='h'){var l=w==='b'?bk():hs(),x=l[+i];if(x)load(x.u);return}
  open();
 },
 show:open,
 go:function(){load($('nvIn').value)},
 site:function(i){load(SITES[i][2])},
 reload:function(){var f=$('nvFr');if(f)f.src=tabs[cur].u;else render()},
 ext:function(){var u=tabs[cur].u;if(u)window.open(u,'_blank','noopener')},
 star:function(){
  var u=tabs[cur].u;if(!u)return;
  var b=bk(),i=b.findIndex(function(x){return x.u===u});
  if(i>-1){b.splice(i,1);toast('Retiré des favoris')}else{b.unshift({u:u,t:host(u)});toast('⭐ Ajouté aux favoris')}
  SV('n_bk',b.slice(0,60));render();
 },
 rmb:function(i){var b=bk();b.splice(i,1);SV('n_bk',b);render()},
 copy:function(){var u=tabs[cur].u;try{navigator.clipboard.writeText(u);toast('Lien copié')}catch(e){prompt('Copiez le lien :',u)}},
 share:function(){var u=tabs[cur].u;if(navigator.share)navigator.share({title:host(u),url:u}).catch(function(){});else window.open('https://wa.me/?text='+encodeURIComponent(u),'_blank')},
 home:function(){tabs[cur]={u:'',t:'Nouvel onglet'};save();render()},
 tab:function(i){cur=i;save();render()},
 add:function(){if(tabs.length<MAXTABS){tabs.push({u:'',t:'Nouvel onglet'});cur=tabs.length-1;save();render()}},
 close:function(i){tabs.splice(i,1);if(!tabs.length)tabs=[{u:'',t:'Nouvel onglet'}];if(cur>=tabs.length)cur=tabs.length-1;save();render()},
 clearH:function(){SV('n_hs',[]);render()},
 history:function(){tabs[cur]={u:'',t:'Nouvel onglet'};save();open()}
};
})();
