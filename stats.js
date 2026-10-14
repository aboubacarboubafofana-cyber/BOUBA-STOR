/* BOUBA STORE – Statistiques (visites, commandes, chiffre d'affaires, installations) + tableau de bord admin. */
(function(){
var day=function(d){return (d||new Date()).toISOString().slice(0,10)};
var inc=function(k,n){try{if(fb&&fb.D)fb.D.set(fb.D.ref(fb.db,'stats/'+day()+'/'+k),fb.D.increment(n||1))}catch(e){}};
/* suivi automatique */
var tries=0,t=setInterval(function(){
 if(++tries>40)clearInterval(t);
 if(fb&&fb.D){clearInterval(t);if(LS('st_d','')!==day()){SV('st_d',day());inc('visits')}}
},1500);
window.addEventListener('appinstalled',function(){inc('installs')});
var _cm=window.commander;
window.commander=function(){
 var tot=0,had=0;try{had=cartItems().length;tot=cartSum()}catch(e){}
 _cm();
 try{if(had&&!cartItems().length){inc('orders');inc('revenue',tot)}}catch(e){}
};
/* tableau de bord (admin) */
var css=document.createElement('style');
css.textContent='.stc{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.stc h3{color:gold;font-size:16px;margin:0 0 8px}.stg{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stg div{background:#000;border:1px solid #333;border-radius:10px;padding:10px;text-align:center}.stg b{display:block;color:#ffd700;font-size:20px}.stg span{font-size:12px;color:#aaa}.str{display:flex;align-items:center;gap:6px;font-size:12px;color:#ddd;margin:3px 0}.str i{display:block;height:10px;background:#ffd700;border-radius:5px}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='statsPage';pg.className='page';
function sum(a,k,n){return a.slice(-n).reduce(function(s,x){return s+(+x[k]||0)},0)}
function open(){
 if(!isAdmin){toast('Réservé à l\'administrateur');return}
 if(!pg.parentNode)document.body.appendChild(pg);
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">📊 STATISTIQUES</h2><p style="color:#aaa">Chargement…</p>';
 openPage('statsPage');
 fb.D.get(fb.D.ref(fb.db,'stats')).then(function(s){
  var v=s.val()||{},days=[];
  for(var i=13;i>=0;i--){var d=day(new Date(Date.now()-i*864e5));days.push(Object.assign({d:d},v[d]||{}))}
  var mx=Math.max.apply(null,days.map(function(x){return +x.visits||0}).concat([1]));
  var all=Object.keys(v).map(function(k){return v[k]});
  var tot=function(k){return all.reduce(function(s,x){return s+(+x[k]||0)},0)};
  var h='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">📊 STATISTIQUES</h2>';
  h+='<div class="stc"><h3>Aujourd\'hui</h3><div class="stg"><div><b>'+fmt(+days[13].visits||0)+'</b><span>Visiteurs</span></div><div><b>'+fmt(+days[13].orders||0)+'</b><span>Commandes</span></div><div><b>'+fmt(+days[13].revenue||0)+' F</b><span>Chiffre d\'affaires</span></div><div><b>'+fmt(+days[13].installs||0)+'</b><span>Installations</span></div></div></div>';
  h+='<div class="stc"><h3>7 derniers jours</h3><div class="stg"><div><b>'+fmt(sum(days,'visits',7))+'</b><span>Visiteurs</span></div><div><b>'+fmt(sum(days,'orders',7))+'</b><span>Commandes</span></div><div><b>'+fmt(sum(days,'revenue',7))+' F</b><span>Chiffre d\'affaires</span></div><div><b>'+fmt(sum(days,'installs',7))+'</b><span>Installations</span></div></div></div>';
  h+='<div class="stc"><h3>Depuis le début</h3><div class="stg"><div><b>'+fmt(tot('visits'))+'</b><span>Visites</span></div><div><b>'+fmt(tot('orders'))+'</b><span>Commandes</span></div><div><b>'+fmt(tot('revenue'))+' F</b><span>Chiffre d\'affaires</span></div><div><b>'+fmt(tot('installs'))+'</b><span>Installations</span></div></div></div>';
  h+='<div class="stc"><h3>Visiteurs par jour (14 jours)</h3>'+days.map(function(x){return '<div class="str"><span style="width:44px">'+x.d.slice(5)+'</span><i style="width:'+Math.round((+x.visits||0)*100/mx)+'%;min-width:2px"></i><b>'+(+x.visits||0)+'</b></div>'}).join('')+'</div>';
  var tp=Object.keys(S.views||{}).map(function(id){return {p:(S.products||{})[id],n:+S.views[id]||0}}).filter(function(x){return x.p}).sort(function(a,b){return b.n-a.n}).slice(0,5);
  h+='<div class="stc"><h3>🔥 Articles les plus vus</h3>'+(tp.length?tp.map(function(x,i){return '<div class="str"><span>'+(i+1)+'.</span><span style="flex:1">'+esc(x.p.name)+'</span><b>'+x.n+' vues</b></div>'}).join(''):'<p style="color:#aaa">Pas encore de données.</p>')+'</div>';
  h+='<p style="font-size:12px;color:#888">Les visiteurs sont comptés une fois par jour et par téléphone.</p>';
  pg.innerHTML=h;
 }).catch(function(){pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><p style="color:#f66">Accès refusé : vérifiez la règle « stats » dans Firebase.</p>'});
}
window.STATS={open:open};
})();
