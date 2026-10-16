/* BOUBA STORE – « Publications ➜ glisse » : toutes les publications et stories de BOUBA VIBES sur la page d'accueil,
   en défilement de gauche à droite. Elles restent visibles jusqu'à ce que VOUS les supprimiez (🗑 réservé à l'admin / à l'auteur). */
(function(){
var el=document.createElement('div');el.id='vibesHome';el.style.cssText='padding:0 10px';
var sig='';
var css=document.createElement('style');
css.textContent='.vhs{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;scrollbar-width:none}.vhs::-webkit-scrollbar{display:none}.vhc{flex:none;width:150px;height:215px;position:relative;border:1px solid #d4af37;border-radius:14px;overflow:hidden;scroll-snap-align:start;background:#111}.vhc img.m{width:100%;height:100%;object-fit:cover;display:block}.vhc .t{position:absolute;inset:0;display:grid;place-items:center;padding:12px;text-align:center;color:#fff;font-weight:800;font-size:15px;line-height:1.3}.vhc .b{position:absolute;left:0;right:0;bottom:0;padding:22px 8px 7px;background:linear-gradient(transparent,rgba(0,0,0,.88));color:#fff;font-size:12px}.vhc .k{position:absolute;top:6px;left:6px;background:rgba(0,0,0,.65);color:#ffd700;font-size:11px;font-weight:800;border-radius:10px;padding:2px 7px}.vhc .x{position:absolute;top:4px;right:4px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.7);color:#fff;font-size:15px;padding:0}';
document.head.appendChild(css);
function ago(t){var s=Math.floor((Date.now()-t)/1000);if(s<60)return 'maintenant';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return Math.floor(s/86400)+' j'}
function hue(s){var h=0;String(s).split('').forEach(function(c){h=(h*31+c.charCodeAt(0))%360});return h}
function items(){
 var V=window.VIBES&&VIBES.data&&VIBES.data();if(!V)return [];
 var a=[];
 Object.values(V.posts||{}).forEach(function(p){if(p&&p.id)a.push({k:'p',id:p.id,by:p.by,name:p.name,date:p.date||0,img:p.img,text:p.text,v:!!(p.vid||p.vm)})});
 Object.values(V.stories||{}).forEach(function(s){if(s&&s.id)a.push({k:'s',id:s.id,by:s.by,name:s.name,date:s.date||0,img:s.img,text:s.text})});
 return a.sort(function(x,y){return y.date-x.date}).slice(0,40);
}
function card(x){
 var cid=LS('v_id',''),can=(typeof isAdmin!=='undefined'&&isAdmin)||(cid&&cid===x.by);
 var body=x.img?'<img class="m" loading="lazy" src="'+safeImg(x.img)+'" alt="">':'<div class="t" style="background:linear-gradient(135deg,hsl('+hue(x.id)+',55%,38%),#000)">'+esc(String(x.text||'').slice(0,90))+'</div>';
 return '<div class="vhc" onclick="HOMEV.open(\''+x.k+'\',\''+x.id+'\',\''+x.by+'\')">'+body+'<span class="k">'+(x.k==='s'?'📸 Story':(x.v?'🎬 Vidéo':'🎬 Post'))+'</span>'+(can?'<button class="x" onclick="event.stopPropagation();HOMEV.del(\''+x.k+'\',\''+x.id+'\')">🗑</button>':'')+'<div class="b"><b>'+esc(x.name||'')+'</b> • '+ago(x.date)+'</div></div>';
}
function mount(){
 var g=document.getElementById('grid');if(!g||el.parentNode)return;
 var m=document.getElementById('menuZone');
 if(m&&m.parentNode)m.parentNode.insertBefore(el,m.nextSibling);else g.parentNode.insertBefore(el,g);
}
function render(){
 mount();
 var l=items(),s=l.map(function(x){return x.k+x.id}).join(',')+'|'+(typeof isAdmin!=='undefined'&&isAdmin?1:0);
 if(s===sig)return;sig=s;
 if(!l.length){el.innerHTML='';return}
 el.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between"><h3 style="color:gold;margin:8px 0;font-size:17px">🎬 Publications ➜ glisse</h3><button class="mini" onclick="VIBES.open()">Tout voir</button></div><div class="vhs">'+l.map(card).join('')+'</div>';
}
window.HOMEV={
 open:function(k,id,by){
  if(k==='s'){VIBES.story(by);return}
  VIBES.open();setTimeout(function(){VIBES.one(id)},500);
 },
 del:function(k,id){
  if(!confirm('Supprimer cette publication définitivement ?'))return;
  var V=VIBES.data();
  write((k==='s'?'stories/':'posts/')+id,null);
  if(k==='s')delete V.stories[id];else{delete V.posts[id];try{fb.D.remove(fb.D.ref(fb.db,'media/'+id)).catch(function(){})}catch(e){}}
  sig='';render();toast('🗑 Supprimée');
 }
};
setInterval(render,2500);
})();
