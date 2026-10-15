/* BOUBA VIBES – réseau de publications (photos, vidéos, stories) avec monétisation des créateurs.
   Tout est automatique : points, vues, abonnés, gains. L'admin active seulement les créateurs et note les paiements Wave / Orange Money.
   Dépend de index.html (me, S, fb, write, compress, toast, esc, safeImg, fmt, openPage, closeAll, addCart, isAdmin) et promos.js (PROMO.addPts). */
(function(){
var DEF_RATE=0.2,MIN_PAY=5000,STEP=10,LIM=STEP;
var V={posts:{},works:{},stories:{},monet:{},views:{},likes:{},cm:{},fol:{},cv:{},pay:{},payAll:{}};
var started='',unsubP=null,cidv='',tab='all',filt='',openC={},cImg='',cVidFile=null,timer=0,rt=0;
var key=function(){return me&&me.key};
var k10=function(){return String(key()||'').replace(/\D/g,'').slice(-10)};
var rate=function(){return +((S.info||{}).monetRate)||DEF_RATE};
var wa=function(t){window.open('https://wa.me/2250787619717?text='+encodeURIComponent(t),'_blank')};
var link=function(id){return location.origin+'/?vibe='+id};
function nid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function ago(t){var s=Math.floor((Date.now()-t)/1000);if(s<60)return 'à l\'instant';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return Math.floor(s/86400)+' j'}
function col(s){var h=0;String(s).split('').forEach(function(c){h=(h*31+c.charCodeAt(0))%360});return 'hsl('+h+',60%,45%)'}
function av(n,id,sz,nc,im){
 var oc=nc?'':' onclick="VIBES.by(\''+id+'\')"',core;
 if(im){var src=im==='logo'?'icon-192.png':safeImg(im);core='<img'+oc+' src="'+src+'" alt="" style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;object-fit:cover;display:block;background:#000">'}
 else core='<div'+oc+' style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+col(id)+';display:grid;place-items:center;color:#fff;font-weight:900;font-size:'+Math.round(sz*0.45)+'px">'+esc(String(n||'?').charAt(0).toUpperCase())+'</div>';
 var mon=active(id)?'<span title="Compte monétisé" style="position:absolute;right:-3px;bottom:-3px;font-size:'+Math.max(12,Math.round(sz*0.32))+'px;line-height:1;background:#000;border-radius:50%">✅</span>':'';
 return '<span style="position:relative;display:inline-block;flex:none;width:'+sz+'px;height:'+sz+'px">'+core+mon+'</span>';
}
function myAv(){return LS('v_av','')||(isAdmin?'logo':'')}
function active(c){var m=V.monet[c];return !!(m&&m.status==='active')}
function creatorId(){return cidv}
window.flagOf=function(c){if(!c||String(c).length!==2)return '🌍';return String.fromCodePoint.apply(null,String(c).toUpperCase().split('').map(function(x){return 127397+x.charCodeAt(0)}))};
var hiSig='';
function headIcon(){
 var e=document.querySelector('span[onclick*="profilePage"]');if(!e)return;
 var im=myAv(),mon=!!(cidv&&active(cidv)),sig=(im||'').length+'|'+mon;
 if(sig===hiSig)return;hiSig=sig;
 if(!im&&!mon){e.textContent='👤';return}
 var src=im==='logo'?'icon-192.png':(im?safeImg(im):'');
 e.innerHTML='<span style="position:relative;display:inline-block;width:40px;height:40px;vertical-align:middle">'+(src?'<img src="'+src+'" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #3b82f6;background:#000">':'<span style="font-size:30px;line-height:40px">👤</span>')+(mon?'<span title="Compte monétisé" style="position:absolute;right:-5px;bottom:-5px;font-size:15px;line-height:1;background:#000;border-radius:50%">✅</span>':'')+'</span>';
}

/* ---------- styles + pages ---------- */
var css=document.createElement('style');
css.textContent='.vp{background:#111;border:1px solid #d4af37;border-radius:14px;margin:12px 0;overflow:hidden}.vh{display:flex;gap:10px;align-items:center;padding:10px}.vm img,.vm video{width:100%;display:block;max-height:480px;object-fit:cover;background:#000}.vt{padding:8px 12px;font-size:15px;line-height:1.4;color:#eee;white-space:pre-wrap;word-break:break-word}.va{display:flex;gap:5px;padding:6px 8px 10px;flex-wrap:nowrap}.va button{flex:1 1 0;min-width:0;padding:8px 2px!important;background:#000;border:1px solid #333;color:#ffd700;border-radius:18px;padding:8px 4px;font-weight:700;font-size:13px}.va button.on{border-color:gold;background:#2a2200}.vs{display:flex;gap:12px;overflow-x:auto;padding:6px 0;scrollbar-width:none}.vs>div{flex:none;text-align:center;font-size:11px;color:#ddd;width:64px}.ring{padding:3px;border-radius:50%;background:linear-gradient(45deg,#ffd700,#ff7a00)}.ring.seen{background:#444}.ring>div{border:2px solid #000;border-radius:50%}.vtabs{display:flex;gap:6px;margin:8px 0}.vtabs button{flex:1;padding:9px 4px;border-radius:18px;border:1px solid #d4af37;background:#000;color:#ffd700;font-weight:800;font-size:13px}.vtabs button.on{background:#ffd700;color:#000}.vcm{padding:0 12px 10px;font-size:14px}.vcm div{padding:4px 0;border-top:1px solid #222}.vrow{display:flex;gap:8px;align-items:center}.vrow input{flex:1 1 auto!important;min-width:0;width:auto!important;margin:0!important;height:46px!important;font-size:16px!important;padding:0 14px!important}.vrow button{flex:none!important;width:70px!important;height:46px!important;padding:0!important}.vcm .vcr{display:flex;gap:8px;align-items:center;margin-top:8px;border-top:0}.vcm .vcr input{flex:1 1 auto!important;min-width:0;width:auto!important;height:46px!important;font-size:16px!important;padding:0 14px!important;margin:0!important;border-radius:23px!important}.vcm .vcr button{flex:none!important;width:50px!important;height:46px!important;padding:0!important;border-radius:23px!important;font-size:20px!important}.vfab{position:fixed;right:14px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:260;width:56px;height:56px;border-radius:50%;background:#ffd700;color:#000;border:0;font-size:28px;font-weight:900;box-shadow:0 2px 10px #000}.vst{position:fixed;inset:0;background:#000;z-index:500;display:none;flex-direction:column}.vst.on{display:flex}.vmon{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.vmon h3{color:gold;font-size:16px;margin:0 0 6px}.vmon p{font-size:14px;color:#ddd;margin:4px 0 8px}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='vibesPage';pg.className='page';
var pc=document.createElement('div');pc.id='vcPage';pc.className='page';
var pm=document.createElement('div');pm.id='vmonPage';pm.className='page';
var st=document.createElement('div');st.className='vst';st.id='vStory';
var fab=document.createElement('button');fab.className='vfab';fab.textContent='+';fab.style.display='none';fab.onclick=function(){VIBES.compose()};

/* ---------- données ---------- */
function listen(path,k){
 var r=fb.D.ref(fb.db,path);
 return fb.D.onValue(r,function(s){V[k]=s.val()||{};sched()},function(){});
}
function listenLast(path,k,n){
 var q=fb.D.query(fb.D.ref(fb.db,path),fb.D.limitToLast(n));
 return fb.D.onValue(q,function(s){V[k]=s.val()||{};sched()},function(){});
}
function sched(){clearTimeout(rt);rt=setTimeout(render,500)}
function start(){
 if(!fb||!key()||started===key())return;started=key();
 cidv=LS('v_id','');
 fb.D.get(fb.D.ref(fb.db,'loyalty/'+k10()+'/vid')).then(function(s){
  var r=s.val();
  if(r){cidv=r;SV('v_id',r)}
  else{if(!cidv){cidv='c'+nid()}SV('v_id',cidv);write('loyalty/'+k10()+'/vid',cidv)}
 }).catch(function(){if(!cidv){cidv='c'+nid();SV('v_id',cidv)}}).then(function(){
  unsubP=listenLast('posts','posts',LIM);
    listen('works','works');
  listenLast('stories','stories',60);
  ['monet','postviews','postlikes','postcomments','followers','creatorviews'].forEach(function(p,i){listen(p,['monet','views','likes','cm','fol','cv'][i])});
  if(isAdmin)listen('payouts','payAll');else listen('payouts/'+cidv,'pay');
  var q=new URLSearchParams(location.search).get('vibe');
  if(q)setTimeout(function(){open();VIBES.one(q)},800);
 });
}

/* ---------- feed ---------- */
function liked(id){return LS('v_like',[]).indexOf(id)>-1}
function follows(c){return LS('v_fol',[]).indexOf(c)>-1}
function pts(){var d=new Date().toISOString().slice(0,10),o=LS('v_pts',{d:'',n:0});if(o.d!==d)o={d:d,n:0};return o}
function sortPosts(){
 var posts=Object.values(V.posts).filter(function(p){return p&&p.id});
 var works=Object.values(V.works).filter(function(w){return w&&w.id}).map(function(w){
  return {
   id: w.id, by: w.cid, name: w.an || 'Artiste', date: w.date,
   text: (w.title ? '🎵 ' + w.title : '') + (w.desc ? '\n' + w.desc : ''),
   img: w.cover || '', work: w.id, price: w.price, isWork: true
  };
 });
 var l = posts.concat(works).sort(function(a,b){return b.date-a.date});
 if(filt)l=l.filter(function(p){return p.by===filt});
 else if(tab==='fol'){var f=LS('v_fol',[]);l=l.filter(function(p){return f.indexOf(p.by)>-1})}
 else if(tab==='cc'){var c0=LS('v_cc','');l=l.filter(function(p){return c0&&p.cc===c0})}
 else if(tab==='pop')l.sort(function(a,b){var sc=function(p){return (+V.views[p.id]||0)+3*(+V.likes[p.id]||0)+2*(+V.cm[p.id]||0)};return sc(b)-sc(a)});
 return l;
}
function card(p){
 var lk=liked(p.id),pr=p.tag&&S.products&&S.products[p.tag],me2=creatorId()===p.by,h='<div class="vp" data-id="'+p.id+'" data-by="'+p.by+'"><div class="vh">'+av(p.name,p.by,40,0,p.av)+'<div style="flex:1"><b onclick="VIBES.by(\''+p.by+'\')">'+esc(p.name||'')+'</b>'+(p.cc?' '+flagOf(p.cc):'')+(active(p.by)?' <span title="Créateur monétisé">✅</span>':'')+'<br><span style="font-size:11px;color:#aaa">'+ago(p.date)+'</span></div>';
 if(!me2)h+='<button class="mini" onclick="VIBES.follow(\''+p.by+'\')">'+(follows(p.by)?'✓ Suivi':'+ Suivre')+'</button>';
 h+='</div>';
 if(p.text)h+='<div class="vt">'+esc(p.text)+'</div>';
 if(p.img)h+='<div class="vm"><img loading="lazy" src="'+safeImg(p.img)+'" alt=""></div>';
 //if(p.work)h+='<div style="padding:6px 12px"><button class="gold" style="width:100%" onclick="STAR.work(\''+p.work+'\')">⭐ Écouter / Acheter</button></div>';
 if(p.isWork&&p.work){
  h+='<div style="padding:6px 12px">';
  if(p.price>0)h+='<button class="gold" style="width:100%;background:#ffd700;color:#000;font-weight:900" onclick="STAR.work(\''+p.work+'\')">💰 Acheter pour '+fmt(p.price)+' F</button>';
  else h+='<button class="gold" style="width:100%;background:#25D366;color:#fff" onclick="STAR.work(\''+p.work+'\')">▶️ Écouter / Voir (Gratuit)</button>';
  h+='</div>';
} else if(p.work)h+='<div style="padding:6px 12px"><button class="gold" style="width:100%" onclick="STAR.work(\''+p.work+'\')">⭐ Écouter / Acheter</button></div>';
 return h;
}
function storiesRow(){
 var now=Date.now(),g={};
 Object.values(V.stories).forEach(function(s){if(s&&s.end>now){(g[s.by]=g[s.by]||[]).push(s)}});
 var seen=LS('v_seen',{}),h='<div class="vs"><div onclick="VIBES.compose(1)"><div class="ring seen"><div style="width:54px;height:54px;display:grid;place-items:center;background:#111;color:gold;font-size:26px;border-radius:50%">+</div></div>Ma story</div>';
 Object.keys(g).forEach(function(c){
  var l=g[c].sort(function(a,b){return a.date-b.date}),last=l[l.length-1],sn=!!seen[last.id];
  h+='<div onclick="VIBES.story(\''+c+'\')"><div class="ring '+(sn?'seen':'')+'"><div>'+av(l[0].name,c,54,1,l[l.length-1].av||l[0].av)+'</div></div>'+esc(String(l[0].name||'').split(' ')[0])+'</div>';
 });
 return h+'</div>';
}
function render(){
 if(!pg.classList.contains('active'))return;
 var a=document.activeElement;if(a&&/INPUT|TEXTAREA/.test(a.tagName)&&pg.contains(a))return;
 if(pg.querySelector('video')&&!pg.querySelector('video').paused)return;
 var l=sortPosts(),sy=pg.scrollTop;
 var h='<div style="display:flex;align-items:center;gap:10px"><button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;flex:1;margin:0">🎬 BOUBA VIBES</h2><button class="mini" onclick="MONDE.open()">🌍</button><button class="mini" onclick="VIBES.photo()">👤</button><button class="mini" onclick="VIBES.monet()">💰</button></div>'+storiesRow()+
  (!LS('v_av','')&&!isAdmin?'<div class="vmon" style="text-align:center"><b>📷 Ajoutez votre photo de profil</b><br><button class="gold" style="margin-top:6px" onclick="VIBES.photo()">Choisir ma photo</button></div>':'')+'<div class="vtabs"><button class="'+(tab==='all'&&!filt?'on':'')+'" onclick="VIBES.tab(\'all\')">Pour toi</button><button class="'+(tab==='fol'?'on':'')+'" onclick="VIBES.tab(\'fol\')">Abonnements</button><button class="'+(tab==='pop'?'on':'')+'" onclick="VIBES.tab(\'pop\')">🔥 Populaires</button><button class="'+(tab==='cc'?'on':'')+'" onclick="VIBES.tab(\'cc\')">'+flagOf(LS('v_cc',''))+' Pays</button></div>';
 if(filt){var n=(Object.values(V.posts).find(function(p){return p.by===filt})||{}).name||'Créateur';h+='<div class="vmon"><b>'+esc(n)+'</b>'+(active(filt)?' ✅':'')+' • '+(+V.fol[filt]||0)+' abonné(s)<br><button class="mini" onclick="VIBES.by(\'\')">← Tous les posts</button></div>'}
 h+=l.length?l.map(card).join(''):'<p style="color:#aaa;text-align:center;margin:30px 0">Aucune publication pour le moment.<br>Soyez le premier : touchez le bouton +</p>';
 if(Object.keys(V.posts).length>=LIM)h+='<button class="ghost" style="width:100%" onclick="VIBES.more2()">Voir plus</button>';
 pg.innerHTML=h;pg.scrollTop=sy;
 observe();
}
var io=null;
function observe(){
 if(!('IntersectionObserver' in window))return;
 if(io)io.disconnect();
 io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&e.intersectionRatio>0.6){io.unobserve(e.target);countView(e.target.dataset.id,e.target.dataset.by)}})},{threshold:[0.6]});
 pg.querySelectorAll('.vp').forEach(function(n){io.observe(n)});
}
function countView(id,by){
 if(!fb||!cidv||by===cidv)return;
 var seen=LS('v_vw',{});if(seen[id])return;seen[id]=1;SV('v_vw',seen);
 var r=fb.D.ref(fb.db,'viewers/'+id+'/'+cidv);
 fb.D.get(r).then(function(s){
  if(s.exists())return;
  return fb.D.set(r,1).then(function(){
   fb.D.set(fb.D.ref(fb.db,'postviews/'+id),fb.D.increment(1));
   fb.D.set(fb.D.ref(fb.db,'creatorviews/'+by),fb.D.increment(1));
  });
 }).catch(function(){});
}
function open(){
 if(!pg.parentNode){document.body.appendChild(pg);document.body.appendChild(pc);document.body.appendChild(pm);document.body.appendChild(st)}
 openPage('vibesPage');fab.style.display='block';render();
}
var _cl=window.closeAll;
window.closeAll=function(){_cl();fab.style.display='none'};
var _op=window.openPage;
window.openPage=function(id){_op(id);fab.style.display=(id==='vibesPage')?'block':'none'};

/* ---------- actions ---------- */
window.VIBES={
 open:open,
 tab:function(t){tab=t;filt='';render()},
 photo:function(){
  if(!me){alert('Connectez-vous d\'abord');return}
  var i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=function(){var f=i.files[0];if(f)compress(f,160,function(img){SV('v_av',img);hiSig='';headIcon();toast('👤 Photo de profil enregistrée (visible sur vos prochains posts et stories)')})};
  i.click();
 },
 by:function(c){filt=c||'';tab='all';open()},
 more2:function(){LIM+=STEP;if(unsubP)unsubP();unsubP=listenLast('posts','posts',LIM)},
 one:function(id){fb.D.get(fb.D.ref(fb.db,'posts/'+id)).then(function(s){if(s.exists()){V.posts[id]=s.val();render();var e=pg.querySelector('[data-id="'+id+'"]');if(e)e.scrollIntoView()}})},
 like:function(id){
  var l=LS('v_like',[]),i=l.indexOf(id);
  if(i>-1)l.splice(i,1);else l.push(id);SV('v_like',l);
  V.likes[id]=Math.max(0,(+V.likes[id]||0)+(i>-1?-1:1));
  fb.D.set(fb.D.ref(fb.db,'postlikes/'+id),fb.D.increment(i>-1?-1:1)).catch(function(){});render();
 },
 follow:function(c){
  var l=LS('v_fol',[]),i=l.indexOf(c);
  if(i>-1)l.splice(i,1);else l.push(c);SV('v_fol',l);
  V.fol[c]=Math.max(0,(+V.fol[c]||0)+(i>-1?-1:1));
  fb.D.set(fb.D.ref(fb.db,'followers/'+c),fb.D.increment(i>-1?-1:1)).catch(function(){});render();
 },
 share:function(id){
  var t='🎬 Regarde ce post sur BOUBA VIBES : '+link(id);
  if(navigator.share)navigator.share({title:'BOUBA VIBES',text:t,url:link(id)}).catch(function(){});
  else window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank');
 },
 more:function(id,by){
  var own=cidv===by,m=prompt((own||isAdmin?'1 = Supprimer ce post\n':'')+'2 = Signaler ce post\n(Entrez le numéro)');
  if(m==='1'&&(own||isAdmin)){if(confirm('Supprimer ce post ?')){write('posts/'+id,null);fb.D.remove(fb.D.ref(fb.db,'media/'+id)).catch(function(){});delete V.posts[id];render()}}
  else if(m==='2'){fb.D.set(fb.D.ref(fb.db,'vreports/'+id+'/'+cidv),1).then(function(){toast('Merci, nous allons vérifier')}).catch(function(){toast('Déjà signalé')})}
 },
 play:function(id){
  var p=V.posts[id],box=$('vv_'+id);if(!p||!box)return;
  function show(src){box.style.padding='0';box.innerHTML='<video src="'+src+'" controls autoplay playsinline style="width:100%;max-height:480px;background:#000"></video>'}
  if(p.vm){box.innerHTML='<p style="padding:16px;text-align:center">Chargement…</p>';fb.D.get(fb.D.ref(fb.db,'media/'+id)).then(function(s){var v=s.val();if(v&&/^data:video\//.test(v))show(v);else box.innerHTML='<p style="padding:16px">Vidéo indisponible</p>'}).catch(function(){box.innerHTML='<p style="padding:16px">Vidéo indisponible</p>'});return}
  var u=String(p.vid||''),y=/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/.exec(u);
  if(y){box.style.padding='0';box.innerHTML='<iframe src="https://www.youtube.com/embed/'+y[1]+'?playsinline=1&autoplay=1" allow="autoplay;encrypted-media" allowfullscreen style="width:100%;height:260px;border:0"></iframe>'}
  else if(/\.(mp4|webm)(\?|$)/i.test(u)&&/^https:\/\//.test(u))show(esc(u));
  else if(/^https:\/\//.test(u))window.open(u,'_blank');
 },
 cmt:function(id){
  var b=$('vc_'+id);if(!b)return;
  if(openC[id]){openC[id]=0;b.innerHTML='';return}
  openC[id]=1;b.innerHTML='<div class="vcm">Chargement…</div>';
  fb.D.get(fb.D.ref(fb.db,'vcomments/'+id)).then(function(s){
   var l=Object.values(s.val()||{}).sort(function(a,c){return a.date-c.date}).slice(-30);
   b.innerHTML='<div class="vcm">'+l.map(function(c){return '<div><b>'+esc(c.name)+'</b> '+esc(c.text)+'</div>'}).join('')+'<div class="vcr"><input id="vci_'+id+'" class="input" maxlength="280" placeholder="Votre commentaire…"><button class="gold" onclick="VIBES.send(\''+id+'\')">➤</button></div></div>';
  }).catch(function(){b.innerHTML='<div class="vcm">Commentaires indisponibles</div>'});
 },
 send:function(id){
  if(!me){alert('Connectez-vous d\'abord');return}
  var i=$('vci_'+id),t=(i.value||'').trim().slice(0,280);if(!t)return;
  var c=nid();
  write('vcomments/'+id+'/'+c,{name:me.name,text:t,date:Date.now(),by:cidv});
  fb.D.set(fb.D.ref(fb.db,'postcomments/'+id),fb.D.increment(1)).catch(function(){});
  V.cm[id]=(+V.cm[id]||0)+1;openC[id]=0;setTimeout(function(){VIBES.cmt(id)},400);
 },
 /* --- publier --- */
 compose:function(story){
  if(!me){alert('Connectez-vous d\'abord pour publier');return}
  cImg='';cVidFile=null;
  var o=Object.values(S.products||{}).filter(function(p){return p&&p.id}).map(function(p){return '<option value="'+p.id+'">'+esc(p.name)+' • '+fmt(p.price)+' F</option>'}).join('');
  pc.innerHTML='<button class="mini" onclick="VIBES.open()">← Retour</button><h2 style="color:gold;margin:10px 0">'+(story?'📸 Nouvelle story (24 h)':'🎬 Nouvelle publication')+'</h2>'+
   '<textarea id="cTxt" class="input" rows="4" maxlength="500" placeholder="'+(story?'Texte de votre story (facultatif)':'Quoi de neuf ? Écrivez votre publication…')+'"></textarea>'+
   '<p style="color:#aaa;font-size:13px">📷 Photo</p><input type="file" id="cImg" accept="image/*" class="input" onchange="VIBES.img(this.files[0])">'+
   (story?'':'<p style="color:#aaa;font-size:13px">🎥 Vidéo (max 3 Mo) ou lien YouTube / .mp4</p><input type="file" id="cVf" accept="video/*" class="input" onchange="VIBES.vfile(this.files[0])"><input id="cVl" class="input" placeholder="Lien de la vidéo (https://…)"><p style="color:#aaa;font-size:13px">🛒 Lier un article de la boutique (facultatif)</p><select id="cTag" class="input"><option value="">Aucun</option>'+o+'</select>')+
   '<button class="gold" style="width:100%;margin-top:10px;padding:14px" onclick="VIBES.publish('+(story?1:0)+')">Publier</button><p id="cMsg" style="color:gold;text-align:center"></p>';
  openPage('vcPage');fab.style.display='none';
 },
 img:function(f){if(f)compress(f,700,function(i){cImg=i;toast('📷 Photo prête')})},
 vfile:function(f){
  if(!f)return;
  if(f.size>3000000){alert('Vidéo trop lourde (max 3 Mo). Collez plutôt un lien YouTube ou .mp4 dans le champ lien.');$('cVf').value='';return}
  cVidFile=f;toast('🎥 Vidéo prête');
 },
 publish:function(story){
  var t=($('cTxt').value||'').trim(),l=story?'':($('cVl').value||'').trim(),tag=story?'':$('cTag').value;
  if(!t&&!cImg&&!l&&!cVidFile){alert('Ajoutez du texte, une photo ou une vidéo');return}
  if(l&&!/^https:\/\//.test(l)){alert('Le lien doit commencer par https://');return}
  if(!cidv){alert('Patientez un instant et réessayez');return}
  var id=nid(),now=Date.now(),msg=$('cMsg');
  function done(){
   var o=pts();if(o.n<3){o.n++;SV('v_pts',o);try{PROMO.addPts(3)}catch(e){}toast('✅ Publié ! +3 points')}else toast('✅ Publié !');
   if(isAdmin&&!story)fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'new',title:'🎬 Nouveau sur BOUBA VIBES',body:(t||'Une nouvelle publication').slice(0,80)})}).catch(function(){});
   VIBES.open();
  }
  if(story){
   var s={id:id,by:cidv,name:me.name,date:now,end:now+864e5};var a1=myAv();if(a1)s.av=a1;var c1=LS('v_cc','');if(c1)s.cc=c1;if(t)s.text=t;if(cImg)s.img=cImg;
   write('stories/'+id,s);return done();
  }
  var p={id:id,by:cidv,name:me.name,date:now};
  var a2=myAv();if(a2)p.av=a2;var c2=LS('v_cc','');if(c2)p.cc=c2;
  if(t)p.text=t;if(cImg)p.img=cImg;if(l)p.vid=l;if(tag)p.tag=tag;
  if(cVidFile){
   msg.textContent='Envoi de la vidéo…';
   var fr=new FileReader();
   fr.onload=function(){
    fb.D.set(fb.D.ref(fb.db,'media/'+id),fr.result).then(function(){p.vm=1;write('posts/'+id,p);done()}).catch(function(){msg.textContent='Échec de l\'envoi. Essayez avec un lien.'});
   };
   fr.onerror=function(){msg.textContent='Fichier illisible'};
   fr.readAsDataURL(cVidFile);return;
  }
  write('posts/'+id,p);done();
 },
 /* --- stories --- */
 story:function(c){
  var now=Date.now(),l=Object.values(V.stories).filter(function(s){return s&&s.by===c&&s.end>now}).sort(function(a,b){return a.date-b.date});
  if(!l.length)return;
  var i=0;
  function show(){
   clearTimeout(timer);
   if(i>=l.length){st.classList.remove('on');render();return}
   var s=l[i],seen=LS('v_seen',{});seen[s.id]=1;SV('v_seen',seen);
   st.innerHTML='<div style="display:flex;gap:4px;padding:10px">'+l.map(function(_,k){return '<div style="flex:1;height:3px;background:'+(k<=i?'#ffd700':'#555')+'"></div>'}).join('')+'</div><div style="display:flex;align-items:center;gap:8px;padding:0 12px;color:#fff">'+av(s.name,s.by,34,1,s.av)+'<b style="flex:1">'+esc(s.name)+'</b><span style="color:#aaa;font-size:12px">'+ago(s.date)+'</span><button class="mini" id="vsx">✕</button></div><div id="vsb" style="flex:1;display:grid;place-items:center;'+(s.img?'':'background:linear-gradient(135deg,'+col(s.id)+',#000)')+'">'+(s.img?'<img src="'+safeImg(s.img)+'" style="max-width:100%;max-height:100%;object-fit:contain">':'')+(s.text?'<div style="position:absolute;left:0;right:0;bottom:90px;padding:16px;text-align:center;color:#fff;font-size:'+(s.img?'18':'26')+'px;font-weight:800;text-shadow:0 1px 4px #000">'+esc(s.text)+'</div>':'')+'</div>';
   $('vsx').onclick=function(e){e.stopPropagation();clearTimeout(timer);st.classList.remove('on');render()};
   $('vsb').onclick=function(e){var x=e.clientX||0;i+=(x<window.innerWidth/3)?-1:1;if(i<0)i=0;show()};
   timer=setTimeout(function(){i++;show()},5000);
  }
  st.classList.add('on');show();
 },
 /* --- monétisation --- */
 monet:function(){
  if(!pm.parentNode){document.body.appendChild(pm)}
  renderMon();openPage('vmonPage');fab.style.display='none';
 },
 reqMonet:function(){
  if(!me){alert('Connectez-vous d\'abord');return}
  var n=($('mN').value||'').trim(),c=($('mC').value||'').trim(),m=$('mM').value,pn=($('mP').value||'').trim(),sn=($('mS').value||'').trim(),b=($('mB').value||'').trim();
  if(!n||!pn||!b||!$('mOk').checked){alert('Remplissez le nom, le numéro de paiement, la description de vos contenus et acceptez les conditions.');return}
  var o={cid:cidv,name:n,city:c,method:m,payNumber:pn,social:sn,bio:b,phone:me.phone,date:Date.now()};
  write('monetreq/'+cidv,o);
  write('monet/'+cidv,{status:'pending',name:n,date:Date.now()});
  SV('v_req',o);
  wa('Bonjour BOUBA STORE, je demande la monétisation de mon compte BOUBA VIBES.\n\nNom : '+n+'\nVille : '+c+'\nTéléphone : '+me.phone+'\nPaiement : '+m+' '+pn+'\nRéseaux : '+(sn||'-')+'\nContenus : '+b+'\nIdentifiant créateur : '+cidv);
  toast('✅ Demande envoyée');setTimeout(renderMon,500);
 },
 payReq:function(due){
  var r=LS('v_req',{});
  wa('Bonjour BOUBA STORE, je demande mon paiement BOUBA VIBES.\nMontant disponible : '+fmt(due)+' F\nPaiement : '+(r.method||'')+' '+(r.payNumber||'')+'\nNom : '+(r.name||(me&&me.name)||'')+'\nIdentifiant créateur : '+cidv);
 },
 act:function(c){
  fb.D.get(fb.D.ref(fb.db,'creatorviews/'+c)).then(function(s){
   var base=+s.val()||0,q=(window._mreq||{})[c]||{};
   write('monet/'+c,{status:'active',since:Date.now(),base:base,name:q.name||''});toast('✅ Monétisation activée');setTimeout(renderMon,600);
  });
 },
 rej:function(c){write('monet/'+c,{status:'rejected'});toast('Demande refusée');setTimeout(renderMon,600)},
 paid:function(c){
  var a=Number(prompt('Montant payé (en F) :'));
  if(!(a>0))return;
  write('payouts/'+c+'/'+nid(),{amount:a,date:Date.now()});toast('💸 Paiement enregistré');setTimeout(renderMon,600);
 },
 delPay:function(c,id){if(confirm('Annuler ce paiement enregistré ?')){write('payouts/'+c+'/'+id,null);setTimeout(renderMon,600)}},
 setRate:function(){var r=Number($('mR').value);if(r>0){write('info/monetRate',r);toast('Tarif enregistré')}}
};
function totals(c){
 var m=V.monet[c]||{},cv=+V.cv[c]||0,views=Math.max(0,cv-(+m.base||0)),earned=Math.round(views*rate());
 var pay=isAdmin?(V.payAll[c]||{}):(c===cidv?V.pay:{}),paid=Object.values(pay).reduce(function(s,x){return s+(+x.amount||0)},0);
 return {views:views,earned:earned,paid:paid,due:Math.max(0,earned-paid),adv:Math.max(0,paid-earned)};
}
function renderMon(){
 var m=V.monet[cidv]||{},h='<button class="mini" onclick="VIBES.open()">← Retour</button><h2 style="color:gold;margin:10px 0">💰 MONÉTISATION</h2>';
 var terms='<p style="font-size:13px;color:#aaa">Conditions : contenu original et respectueux (pas de violence, ni de contenu adulte, ni d\'arnaque). Gains calculés sur les vues uniques de vos publications : <b>'+(rate()*1000)+' F pour 1 000 vues</b>. Paiement dès <b>'+fmt(MIN_PAY)+' F</b> par Wave ou Orange Money. BOUBA STORE peut refuser ou suspendre un compte qui triche.</p>';
 if(m.status==='active'){
  var t=totals(cidv);
  h+='<div class="vmon"><h3>✅ Votre compte est monétisé</h3><p>Vues comptabilisées : <b>'+fmt(t.views)+'</b></p><p>Gains : <b style="color:gold">'+fmt(t.earned)+' F</b> • Déjà payé : '+fmt(t.paid)+' F</p><p style="font-size:20px">À recevoir : <b style="color:#25d366">'+fmt(t.due)+' F</b></p>'+(t.adv?'<p style="color:#aaa">Avance déjà versée : '+fmt(t.adv)+' F (déduite de vos prochains gains)</p>':'')+(t.due>=MIN_PAY?'<button class="gold" style="width:100%" onclick="VIBES.payReq('+t.due+')">💬 Demander mon paiement</button>':'<p style="color:#aaa">Paiement possible à partir de '+fmt(MIN_PAY)+' F.</p>')+'</div>'+terms;
 }else if(m.status==='pending'){
  h+='<div class="vmon"><h3>⏳ Demande en cours</h3><p>Nous vérifions votre compte. Vous serez activé rapidement. Vous pouvez aussi nous écrire sur WhatsApp au +225 07 87 61 97 17.</p><button class="ghost" onclick="PLUS.aide_wa&&PLUS.aide_wa(\'Bonjour, où en est ma demande de monétisation BOUBA VIBES ? (ID '+cidv+')\')">💬 Relancer sur WhatsApp</button></div>'+terms;
 }else{
  h+=(m.status==='rejected'?'<div class="vmon"><p>Votre dernière demande n\'a pas été acceptée. Vous pouvez en refaire une.</p></div>':'')+
   '<div class="vmon"><h3>Gagnez de l\'argent avec vos publications</h3><p>Publiez des photos, vidéos et stories. Plus vous avez de vues, plus vous gagnez.</p>'+terms+
   '<input id="mN" class="input" placeholder="Nom complet" value="'+esc((me&&me.name)||'')+'"><input id="mC" class="input" placeholder="Ville / pays"><select id="mM" class="input"><option>Wave</option><option>Orange Money</option></select><input id="mP" class="input" placeholder="Numéro de paiement (Wave / Orange Money)"><input id="mS" class="input" placeholder="Lien TikTok / Facebook / Instagram (facultatif)"><textarea id="mB" class="input" rows="3" placeholder="Décrivez vos contenus (ce que vous publiez)"></textarea><label style="display:block;margin:8px 0;color:#ddd;font-size:14px"><input type="checkbox" id="mOk"> J\'accepte les conditions</label><button class="gold" style="width:100%;padding:14px" onclick="VIBES.reqMonet()">Envoyer ma demande</button><p style="font-size:12px;color:#aaa;margin-top:6px">Votre demande part aussi sur WhatsApp au +225 07 87 61 97 17.</p></div>';
 }
 if(isAdmin)h+='<div id="mAdm"></div>';
 pm.innerHTML=h;
 if(isAdmin)adminMon();
}
function adminMon(){
 var act=Object.keys(V.monet).filter(function(c){return V.monet[c]&&V.monet[c].status==='active'});
 var box=$('mAdm');if(!box)return;
 var h='<div class="vmon"><h3>🔧 Admin monétisation</h3><p>Gain des créateurs (F par vue) :</p><div class="vrow"><input id="mR" class="input" type="number" step="0.01" inputmode="decimal" placeholder="Ex : 0.2"><button class="gold" onclick="VIBES.setRate()">OK</button></div><p>Tarif actuel : <b>'+rate()+' F par vue</b> ('+fmt(rate()*1000)+' F pour 1 000 vues)</p></div><div class="vmon"><h3>Demandes en attente</h3><div id="mReq"><p>Chargement…</p></div></div><div class="vmon"><h3>Créateurs actifs ('+act.length+')</h3>'+
  (act.length?act.map(function(c){var t=totals(c),m=V.monet[c];return '<div style="border-top:1px solid #333;padding:8px 0"><b>'+esc(m.name||c)+'</b> <span style="color:#aaa;font-size:12px">'+c+'</span><br>Vues : '+fmt(t.views)+' • Gains : '+fmt(t.earned)+' F • Payé : '+fmt(t.paid)+' F<br><b style="color:#25d366">Reste à payer : '+fmt(t.due)+' F</b>'+(t.adv?' <span style="color:#aaa">(avance versée : '+fmt(t.adv)+' F)</span>':'')+'<br>'+Object.entries(V.payAll[c]||{}).sort(function(a,b){return (b[1].date||0)-(a[1].date||0)}).slice(0,5).map(function(e){return '<span style="font-size:12px;color:#aaa">💸 '+fmt(e[1].amount)+' F • '+new Date(e[1].date).toLocaleDateString('fr-FR')+' <a href="#" onclick="VIBES.delPay(\''+c+'\',\''+e[0]+'\');return false" style="color:#f66">🗑 annuler</a></span><br>'}).join('')+'<button class="mini" onclick="VIBES.paid(\''+c+'\')">💸 Marquer un paiement</button> <button class="mini" onclick="VIBES.payInfo(\''+c+'\')">📋 Infos de paiement</button></div>'}).join(''):'<p>Aucun créateur actif.</p>')+'</div>';
 box.innerHTML=h;
 fb.D.get(fb.D.ref(fb.db,'monetreq')).then(function(s){
  var q=s.val()||{};window._mreq=q;
  var pend=Object.keys(q).filter(function(c){return V.monet[c]&&V.monet[c].status==='pending'});
  $('mReq').innerHTML=pend.length?pend.map(function(c){var r=q[c];return '<div style="border-top:1px solid #333;padding:8px 0"><b>'+esc(r.name)+'</b> • '+esc(r.city||'')+'<br>📞 '+esc(r.phone||'')+'<br>💳 '+esc(r.method)+' '+esc(r.payNumber)+'<br>🔗 '+esc(r.social||'-')+'<br>📝 '+esc(r.bio)+'<br><button class="gold" onclick="VIBES.act(\''+c+'\')">✅ Activer</button> <button class="ghost" onclick="VIBES.rej(\''+c+'\')">Refuser</button></div>'}).join(''):'<p>Aucune demande en attente.</p>';
 }).catch(function(){$('mReq').innerHTML='<p>Accès refusé (vérifiez les règles).</p>'});
}
VIBES.payInfo=function(c){var r=(window._mreq||{})[c];if(!r){alert('Infos indisponibles : ouvrez à nouveau la page');return}alert(r.name+'\n'+r.method+' : '+r.payNumber+'\nTéléphone : '+r.phone)};

/* ---------- nav + démarrage ---------- */
function boot(){
 var nav=document.querySelector('.nav');
 if(nav&&!nav.dataset.v){nav.dataset.v=1;var d=document.createElement('div');d.innerHTML='🎬<br>Vibes';d.onclick=function(){VIBES.open()};nav.insertBefore(d,nav.children[2]||null)}
 if(!fab.parentNode)document.body.appendChild(fab);
 start();
 headIcon();
}
setInterval(boot,1200);
})();
