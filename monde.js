/* BOUBA STORE – Communauté internationale : choix du pays (drapeau), salons de discussion Monde / Pays / Affaires / Créateurs / Entraide.
   Dépend de index.html (me, fb, write, esc, toast, openPage, closeAll, isAdmin) et vibes.js (flagOf, identifiant créateur LS 'v_id'). */
(function(){
var C=[['CI','Côte d\'Ivoire'],['SN','Sénégal'],['ML','Mali'],['BF','Burkina Faso'],['GN','Guinée'],['TG','Togo'],['BJ','Bénin'],['NE','Niger'],['CM','Cameroun'],['GA','Gabon'],['CG','Congo'],['CD','RD Congo'],['GH','Ghana'],['NG','Nigeria'],['MA','Maroc'],['DZ','Algérie'],['TN','Tunisie'],['FR','France'],['BE','Belgique'],['CA','Canada'],['US','États-Unis'],['XX','Autre pays']];
var fl=function(c){return (window.flagOf?window.flagOf(c):'🌍')};
var cname=function(c){var x=C.find(function(k){return k[0]===c});return x?x[1]:''};
var cc=function(){return LS('v_cc','')};
var unsub=null,room='',lastSend=0;
function nid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function ago(t){var s=Math.floor((Date.now()-t)/1000);if(s<60)return 'maintenant';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return Math.floor(s/86400)+' j'}

var css=document.createElement('style');
css.textContent='.vtabs button{font-size:12px!important;padding:9px 2px!important}.mrm{display:flex;gap:12px;align-items:center;background:#111;border:1px solid #d4af37;border-radius:12px;padding:14px;margin:10px 0}.mrm span.i{font-size:30px}.mrm b{color:gold}.mmsg{max-width:82%;margin:6px 0;padding:8px 12px;border-radius:14px;background:#1b1b1b;color:#eee;font-size:15px;word-break:break-word}.mmsg.me{margin-left:auto;background:#3a2f00;border:1px solid #d4af37}.mmsg small{display:block;color:#aaa;font-size:11px;margin-bottom:2px}.mbar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;padding:10px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px));background:#000;border-top:1px solid #333;z-index:300}.mbar input{flex:1 1 auto;min-width:0;width:auto!important;height:46px;font-size:16px;padding:0 14px;border-radius:23px;margin:0!important}.mbar button{flex:none;width:54px;height:46px;border-radius:23px;border:0;background:#ffd700;color:#000;font-size:20px;font-weight:900;padding:0}.mpick{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mpick div{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px 6px;text-align:center;color:#ffd700;font-weight:700;font-size:14px}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='mondePage';pg.className='page';
var rp=document.createElement('div');rp.id='roomPage';rp.className='page';rp.style.paddingBottom='90px';

function rooms(){
 var mine=cc();
 return [
  ['monde','🌍','Monde','Discussion ouverte à tous les pays'],
  mine?['pays_'+mine,fl(mine),'Mon pays : '+(cname(mine)||mine),'Les gens de votre pays']:null,
  ['affaires','🛍️','Bonnes affaires','Vendre, acheter, bons plans'],
  ['createurs','🎬','Créateurs','Astuces, collaborations, vues'],
  ['entraide','💡','Entraide','Questions et aide entre membres']
 ].filter(Boolean);
}
function open(){
 if(!pg.parentNode){document.body.appendChild(pg);document.body.appendChild(rp)}
 if(!cc())return pick();
 var h='<div style="display:flex;align-items:center;gap:10px"><button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;flex:1;margin:0">🌍 COMMUNAUTÉ</h2><button class="mini" onclick="MONDE.pick()">'+fl(cc())+'</button></div><p style="color:#aaa;font-size:14px">Discutez avec des membres du monde entier. Soyez respectueux : pas d\'insultes ni d\'arnaques.</p>';
 h+=rooms().map(function(r){return '<div class="mrm" onclick="MONDE.join(\''+r[0]+'\')"><span class="i">'+r[1]+'</span><div style="flex:1"><b>'+esc(r[2])+'</b><br><span style="font-size:13px;color:#aaa">'+esc(r[3])+'</span></div><span style="color:gold">›</span></div>'}).join('');
 h+='<button class="gold" style="width:100%;margin-top:10px" onclick="VIBES.open()">🎬 Voir BOUBA VIBES</button>';
 pg.innerHTML=h;openPage('mondePage');
}
function pick(){
 if(!pg.parentNode){document.body.appendChild(pg);document.body.appendChild(rp)}
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">🏳️ Mon pays</h2><p style="color:#ddd">Choisissez votre pays : son drapeau s\'affichera sur vos publications.</p><div class="mpick">'+C.map(function(c){return '<div onclick="MONDE.set(\''+c[0]+'\')"><span style="font-size:28px">'+(c[0]==='XX'?'🌍':fl(c[0]))+'</span><br>'+esc(c[1])+'</div>'}).join('')+'</div>';
 openPage('mondePage');
}
function join(id){
 var r=rooms().find(function(x){return x[0]===id});if(!r)return;
 room=id;
 rp.innerHTML='<div style="display:flex;align-items:center;gap:10px;position:sticky;top:0;background:#000;padding:8px 0;z-index:5"><button class="mini" onclick="MONDE.leave()">←</button><h3 style="color:gold;margin:0;flex:1">'+r[1]+' '+esc(r[2])+'</h3></div><div id="mList"><p style="color:#aaa;text-align:center">Chargement…</p></div><div class="mbar"><input id="mIn" class="input" maxlength="380" placeholder="Écrire un message…" autocomplete="off"><button onclick="MONDE.send()">➤</button></div>';
 openPage('roomPage');
 var inp=$('mIn');inp.onkeydown=function(e){if(e.key==='Enter')MONDE.send()};
 if(unsub)unsub();
 var q=fb.D.query(fb.D.ref(fb.db,'rooms/'+id+'/msgs'),fb.D.limitToLast(60));
 unsub=fb.D.onValue(q,function(s){
  var l=Object.entries(s.val()||{}).map(function(e){return Object.assign({id:e[0]},e[1])}).sort(function(a,b){return a.date-b.date});
  var mine=LS('v_id',''),box=$('mList');if(!box)return;
  var atEnd=(window.innerHeight+window.scrollY)>=document.body.scrollHeight-200||!box.dataset.f;
  box.dataset.f=1;
  box.innerHTML=l.length?l.map(function(m){
   return '<div class="mmsg'+(m.by&&m.by===mine?' me':'')+'"><small>'+fl(m.cc)+' <b>'+esc(m.name||'')+'</b> • '+ago(m.date)+(isAdmin?' <a href="#" onclick="MONDE.del(\''+m.id+'\');return false" style="color:#f66">🗑</a>':'')+'</small>'+esc(m.text)+'</div>'}).join(''):'<p style="color:#aaa;text-align:center;margin-top:30px">Aucun message. Lancez la discussion !</p>';
  if(atEnd){var sc=rp.scrollHeight;rp.scrollTop=sc;window.scrollTo(0,document.body.scrollHeight)}
 },function(){var b=$('mList');if(b)b.innerHTML='<p style="color:#aaa;text-align:center">Salon indisponible (vérifiez les règles Firebase).</p>'});
}
function leave(){if(unsub){unsub();unsub=null}room='';open()}
window.MONDE={
 open:open,pick:pick,join:join,leave:leave,
 set:function(c){SV('v_cc',c==='XX'?'':c);if(me)write('loyalty/'+String(me.key).replace(/\D/g,'').slice(-10)+'/cc',c);toast(c==='XX'?'🌍 Pays enregistré':fl(c)+' Pays enregistré');open()},
 send:function(){
  if(!me){alert('Connectez-vous d\'abord');return}
  var i=$('mIn'),t=(i.value||'').trim().slice(0,380);if(!t||!room)return;
  if(Date.now()-lastSend<2000){toast('Doucement 🙂');return}
  lastSend=Date.now();
  write('rooms/'+room+'/msgs/'+nid(),{name:me.name,cc:cc(),text:t,date:Date.now(),by:LS('v_id','')});
  i.value='';
 },
 del:function(id){if(confirm('Supprimer ce message ?'))write('rooms/'+room+'/msgs/'+id,null)}
};
})();
