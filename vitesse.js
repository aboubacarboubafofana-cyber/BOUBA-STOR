/* BOUBA STORE – Connexion claire + diagnostic de vitesse.
   - Barre de réseau : En ligne / Hors ligne + qualité de la connexion (temps de réponse en ms).
   - Admin : page « Vitesse & connexion » (poids des données, images lourdes) + bouton « Optimiser les images ». */
(function(){
var RTT=0,slowWarned=0;
function lvl(ms){return ms<400?['🟢','rapide']:ms<1200?['🟡','moyenne']:['🔴','lente']}
function ping(){
 if(!navigator.onLine||document.hidden||typeof FB_CFG==='undefined')return;
 var t=performance.now();
 fetch(FB_CFG.databaseURL+'/info/name.json?_='+Date.now(),{cache:'no-store'}).then(function(r){return r.text()}).then(function(){
  RTT=Math.round(performance.now()-t);
  if(RTT>1800&&!slowWarned){slowWarned=1;toast('🔴 Connexion lente : l\'appli charge moins d\'articles à la fois')}
  if(window.setNet)setNet();
 }).catch(function(){RTT=-1});
}
var _sn=window.setNet;
if(_sn)window.setNet=function(){
 _sn();var n=document.getElementById('net');if(!n)return;
 var add='';
 if(!online)add=' <span style="color:#aaa;font-size:12px">• vos actions partiront au retour du réseau</span>';
 else if(RTT>0){var l=lvl(RTT);add=' <span style="color:#aaa;font-size:12px">• '+l[0]+' '+l[1]+' ('+RTT+' ms)</span>'}
 n.innerHTML+=add;
};
setTimeout(ping,4000);setInterval(ping,30000);
window.addEventListener('online',function(){setTimeout(ping,1500)});

/* ---------- diagnostic admin ---------- */
var css=document.createElement('style');
css.textContent='.spc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.spc h3{color:gold;font-size:16px;margin:0 0 8px}.spg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.spg div{background:#000;border:1px solid #333;border-radius:10px;padding:10px;text-align:center}.spg b{display:block;color:#ffd700;font-size:18px}.spg span{font-size:12px;color:#aaa}.spr{display:flex;gap:8px;font-size:13px;color:#ddd;border-top:1px solid #222;padding:5px 0}.spr span:first-child{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='speedPage';pg.className='page';
var kb=function(n){return n>=1024?(n/1024).toFixed(1)+' Mo':Math.round(n)+' Ko'};
function open(){
 if(!isAdmin){toast('Réservé à l\'administrateur');return}
 if(!pg.parentNode)document.body.appendChild(pg);
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">⚡ VITESSE & CONNEXION</h2><p style="color:#aaa">Mesure en cours…</p>';
 openPage('speedPage');diag();
}
async function diag(){
 try{
  var nav=performance.getEntriesByType('navigation')[0],load=nav?Math.round(nav.loadEventEnd||nav.duration):0,pings=[];
  for(var i=0;i<3;i++){var t0=performance.now();try{await (await fetch(FB_CFG.databaseURL+'/info/name.json?_='+Date.now()+i,{cache:'no-store'})).text();pings.push(Math.round(performance.now()-t0))}catch(e){}}
  var rtt=pings.length?Math.round(pings.reduce(function(a,b){return a+b},0)/pings.length):-1;
  var t1=performance.now(),txt=await (await fetch(FB_CFG.databaseURL+'/products.json',{cache:'no-store'})).text(),dt=Math.round(performance.now()-t1);
  var bytes=new Blob([txt]).size,data={};try{data=JSON.parse(txt)||{}}catch(e){}
  var list=Object.values(data).filter(Boolean).map(function(p){return {id:p.id,name:p.name||'',kb:Math.round(String(p.img||'').length/1024)}}).sort(function(a,b){return b.kb-a.kb});
  var heavy=list.filter(function(x){return x.kb>70}).length,st=Math.round((localStorage.getItem('b_state')||'').length/1024);
  var verdict=bytes>2.5e6?'🔴 Trop lourd : les articles pèsent '+kb(bytes/1024)+'. Touchez « Optimiser les images ».':bytes>1.2e6?'🟡 Un peu lourd : optimiser les images accélérera le démarrage.':'🟢 Poids des données correct.';
  var q=rtt<0?['⚪','indisponible']:lvl(rtt);
  pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">⚡ VITESSE & CONNEXION</h2>'+
   '<div class="spc"><h3>Connexion</h3><div class="spg"><div><b>'+(rtt<0?'—':rtt+' ms')+'</b><span>Temps de réponse '+q[0]+' '+q[1]+'</span></div><div><b>'+(online?'🟢 En ligne':'🟠 Hors ligne')+'</b><span>Base de données</span></div><div><b>'+(load?(load/1000).toFixed(1)+' s':'—')+'</b><span>Chargement de cette page</span></div><div><b>'+kb(st)+'</b><span>Mémoire locale utilisée</span></div></div></div>'+
   '<div class="spc"><h3>Données des articles</h3><div class="spg"><div><b>'+list.length+'</b><span>Articles</span></div><div><b>'+kb(bytes/1024)+'</b><span>Poids total ('+(dt/1000).toFixed(1)+' s)</span></div><div><b>'+heavy+'</b><span>Images lourdes (&gt; 70 Ko)</span></div><div><b>'+(list.length?kb(bytes/1024/list.length):'—')+'</b><span>Moyenne par article</span></div></div><p style="margin:10px 0 6px;color:#eee">'+verdict+'</p>'+
   '<button class="gold" style="width:100%;margin-top:4px" onclick="SPEED.optimize()">🗜️ Optimiser les images</button></div>'+
   (list.length?'<div class="spc"><h3>Articles les plus lourds</h3>'+list.slice(0,6).map(function(x){return '<div class="spr"><span>'+esc(x.name)+'</span><b style="color:'+(x.kb>70?'#ff6b6b':'#25d366')+'">'+x.kb+' Ko</b></div>'}).join('')+'</div>':'')+
   '<div class="spc"><h3>Conseils</h3><div class="spr"><span>Les photos sont réduites à 560 px (qualité visuelle conservée).</span></div><div class="spr"><span>Si l\'appli est lente après beaucoup de ventes, nettoyez la mémoire locale.</span></div><button class="ghost" style="width:100%;margin-top:6px" onclick="SPEED.clean()">🧹 Nettoyer la mémoire locale</button></div>';
 }catch(e){pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><p style="color:#f66">Mesure impossible : vérifiez votre connexion.</p>'}
}
function recompress(url,max,q){
 return new Promise(function(res){
  var i=new Image();
  i.onload=function(){var k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',q))};
  i.onerror=function(){res(null)};i.src=url;
 });
}
async function optimize(){
 var l=Object.values(S.products||{}).filter(function(p){return p&&p.id&&/^data:image/.test(p.img||'')&&p.img.length>70000});
 if(!l.length){toast('✅ Les images sont déjà légères');return}
 if(!confirm(l.length+' image(s) lourde(s) vont être compressées (aspect conservé). Continuer ?'))return;
 var saved=0,done=0;
 for(var j=0;j<l.length;j++){
  var p=l[j],n=await recompress(p.img,560,0.6);
  if(n&&n.length<p.img.length*0.85){saved+=p.img.length-n.length;write('products/'+p.id+'/img',n)}
  done++;toast('🗜️ '+done+' / '+l.length);
 }
 toast('✅ '+kb(saved/1024)+' économisés');setTimeout(diag,2000);
}
window.SPEED={open:open,optimize:optimize,clean:function(){
 if(!confirm('Vider la mémoire locale ? Rien n\'est perdu : tout se recharge depuis internet.'))return;
 try{localStorage.removeItem('b_state')}catch(e){}
 location.reload();
}};
})();
