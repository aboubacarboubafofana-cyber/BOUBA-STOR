/* BOUBA STORE - module Amis (chat, répertoire, appel vocal/vidéo)
   À charger dans index.html avec : <script src="amis.js"></script> (juste avant </body>) */
(function(){
const ICE={iceServers:[
 {urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}
 /* Pour que les appels marchent sur 4G partout, ajoutez un serveur TURN ici :
 ,{urls:'turn:VOTRE_SERVEUR:443',username:'USER',credential:'MOTDEPASSE'} */
]};
const K=s=>String(s||'').replace(/\D/g,'').slice(-10);
const R=p=>fb.D.ref(fb.db,p);
let myK='',myU='',offs=[],fr={},rq={},dirRes=[],tab='chats',err='',cur=null,msgOff=null;
let ready=false,booting=false,pc=null,ms=null,cid='',cOffs=[],inc=null,pend=[],role='';

/* ---------- interface ---------- */
const st=document.createElement('style');
st.textContent=`
#chMsgs{height:calc(100vh - 170px);overflow-y:auto;margin:10px 0}
.bub{max-width:80%;padding:8px 11px;border-radius:12px;margin-bottom:6px;background:#222;font-size:14px;word-break:break-word}
.bub.me{background:gold;color:#000;margin-left:auto}
.chIn{position:fixed;left:0;right:0;bottom:0;display:flex;gap:6px;padding:8px;background:#000;border-top:1px solid #d4af37}
.chIn .input{margin:0;flex:1}.chIn .gold{width:60px;margin:0}
#callBox{display:none;position:fixed;inset:0;background:#000;z-index:600;flex-direction:column;align-items:center;justify-content:center}
#callBox.on{display:flex}
#rv{width:100%;max-height:70vh;background:#111}
#lv{position:absolute;right:10px;top:10px;width:90px;border:1px solid gold;border-radius:8px;background:#111}
#callTxt{color:gold;font-weight:700;margin:14px;text-align:center}
.callBtns{display:flex;gap:24px}
.callBtns button{width:66px;height:66px;border-radius:50%;border:0;font-size:26px}
`;
document.head.appendChild(st);
document.body.insertAdjacentHTML('beforeend',`
<div id="amisPage" class="page">
 <button class="mini" onclick="closeAll()">← Retour</button>
 <h2 style="color:gold;margin:10px 0">💬 AMIS</h2>
 <div class="tabs" id="amTabs"></div>
 <div id="amBody"></div>
</div>
<div id="chatPage" class="page">
 <div style="display:flex;gap:8px;align-items:center">
  <button class="mini" onclick="amBack()">←</button>
  <b id="chName" style="flex:1;color:gold"></b>
  <button class="mini" onclick="amCall(false)">📞</button>
  <button class="mini" onclick="amCall(true)">🎥</button>
 </div>
 <div id="chMsgs"></div>
 <div class="chIn"><input id="chText" class="input" placeholder="Écris un message…" onkeypress="if(event.key==='Enter')amSend()"><button class="gold" onclick="amSend()">➤</button></div>
</div>
<div id="callBox">
 <video id="rv" autoplay playsinline></video>
 <video id="lv" autoplay playsinline muted></video>
 <div id="callTxt"></div>
 <div class="callBtns"><button id="cAcc" style="background:#25D366" onclick="amAccept()">✅</button><button style="background:#d33" onclick="amHang()">📵</button></div>
</div>`);
document.querySelector('.nav').insertAdjacentHTML('beforeend','<div onclick="amisOpen()">💬<br>Amis <b id="amBadge" style="color:gold"></b></div>');

window.amisOpen=()=>{
 if(typeof me==='undefined'||!me){toast('Crée ton compte d\'abord');return}
 openPage('amisPage');render();
};
window.amTab=t=>{tab=t;render()};
window.amBack=()=>{if(msgOff){msgOff();msgOff=null}cur=null;openPage('amisPage');render()};

function badge(){const n=Object.keys(rq).length;const b=document.getElementById('amBadge');if(b)b.textContent=n?'('+n+')':''}

function render(){
 const T=[['chats','👥 Amis'],['dir','📒 Répertoire'],['req','🔔 Demandes'+(Object.keys(rq).length?' ('+Object.keys(rq).length+')':'')]];
 $('amTabs').innerHTML=T.map(t=>'<button class="'+(t[0]===tab?'on':'')+'" onclick="amTab(\''+t[0]+'\')">'+t[1]+'</button>').join('');
 const b=$('amBody');
 if(err){b.innerHTML='<p style="color:#f66">'+esc(err)+'</p>';return}
 if(!myK){b.innerHTML='<p style="color:#888">Connexion en cours…</p>';return}
 if(tab==='chats'){
  b.innerHTML=Object.keys(fr).map(k=>'<div class="row" onclick="amOpen(\''+k+'\')"><div class="g"><b>'+esc(fr[k].name||k)+'</b><br><small style="color:#888">'+k+'</small></div>💬</div>').join('')
   ||'<p style="color:#888">Aucun ami pour l\'instant. Ouvre l\'onglet Répertoire pour en ajouter.</p>';
 }else if(tab==='req'){
  b.innerHTML=Object.keys(rq).map(k=>'<div class="ctrl"><b>'+esc(rq[k].name||k)+'</b> veut devenir ton ami<br><button class="mini" onclick="amAcc(\''+k+'\')">✅ Accepter</button> <button class="mini" style="color:#f44;border-color:#f44" onclick="amRef(\''+k+'\')">Refuser</button></div>').join('')
   ||'<p style="color:#888">Aucune demande.</p>';
 }else{
  b.innerHTML='<button class="gold" onclick="amPick()">📲 Choisir dans mon répertoire</button>'
   +'<div class="ctrl" style="margin-top:10px"><input id="amNum" class="input" type="tel" placeholder="Ou entre un numéro (ex: 0787619717)"><button class="mini" onclick="amAddNum()">➕ Ajouter</button></div>'
   +dirRes.map((x,i)=>'<div class="row"><div class="g"><b>'+esc(x.name)+'</b><br><small style="color:#888">'+x.k+'</small></div>'
    +(fr[x.k]?'✅ ami':x.reg?'<button class="mini" onclick="amAdd(\''+x.k+'\')">➕ Ajouter</button>':'<button class="mini" onclick="amInvite('+i+')">📩 Inviter</button>')+'</div>').join('');
 }
}

/* ---------- répertoire et amis ---------- */
window.amPick=async()=>{
 if(!('contacts' in navigator&&'ContactsManager' in window)){toast('Répertoire non disponible ici : entre le numéro à la main');return}
 try{
  const c=await navigator.contacts.select(['name','tel'],{multiple:true});
  const seen={},L=[];
  c.forEach(x=>(x.tel||[]).forEach(t=>{const k=K(t);if(k.length===10&&k!==myK&&!seen[k]){seen[k]=1;L.push({name:(x.name||[])[0]||k,k})}}));
  await Promise.all(L.slice(0,80).map(async x=>{try{x.reg=(await fb.D.get(R('profiles/'+x.k))).exists()}catch(e){x.reg=false}}));
  dirRes=L.slice(0,80);render();
 }catch(e){}
};
window.amAddNum=async()=>{
 const k=K($('amNum').value);
 if(k.length!==10){toast('Numéro invalide (10 chiffres)');return}
 if(k===myK){toast('C\'est ton numéro');return}
 try{
  if(!(await fb.D.get(R('profiles/'+k))).exists()){toast('Ce numéro n\'est pas inscrit sur BOUBA STORE');return}
  await window.amAdd(k);
 }catch(e){toast('Erreur')}
};
window.amAdd=async k=>{
 try{await fb.D.set(R('requests/'+k+'/'+myK),{name:me.name,t:Date.now()});toast('✅ Demande envoyée')}
 catch(e){toast('Demande impossible')}
};
window.amInvite=i=>{
 const x=dirRes[i];if(!x)return;
 const msg='Rejoins-moi sur BOUBA STORE : '+location.href.split('#')[0];
 window.open('https://wa.me/225'+x.k+'?text='+encodeURIComponent(msg),'_blank');
};
window.amAcc=async k=>{
 try{
  const u={};
  u['friends/'+myK+'/'+k]={name:(rq[k]||{}).name||k};
  u['friends/'+k+'/'+myK]={name:me.name};
  u['requests/'+myK+'/'+k]=null;
  await fb.D.update(R(''),u);toast('✅ Ami ajouté');
 }catch(e){toast('Erreur')}
};
window.amRef=async k=>{try{await fb.D.remove(R('requests/'+myK+'/'+k))}catch(e){}};

/* ---------- messagerie ---------- */
window.amOpen=k=>{
 cur=k;openPage('chatPage');
 $('chName').textContent=(fr[k]||{}).name||k;$('chMsgs').innerHTML='';
 if(msgOff)msgOff();
 const q=fb.D.query(R('chats/'+myK+'/'+k),fb.D.limitToLast(100));
 msgOff=fb.D.onValue(q,s=>{
  const a=Object.values(s.val()||{}).sort((x,y)=>x.t-y.t),c=$('chMsgs');
  c.innerHTML=a.map(m=>'<div class="bub'+(m.from===myK?' me':'')+'">'+esc(m.text)+'</div>').join('');
  c.scrollTop=c.scrollHeight;
 });
};
window.amSend=async()=>{
 const i=$('chText'),t=i.value.trim();if(!t||!cur)return;i.value='';
 const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const m={from:myK,text:t.slice(0,1000),t:Date.now()},u={};
 u['chats/'+myK+'/'+cur+'/'+id]=m;u['chats/'+cur+'/'+myK+'/'+id]=m;
 try{await fb.D.update(R(''),u)}catch(e){toast('Message non envoyé');i.value=t}
};

/* ---------- appels voix / vidéo (WebRTC) ---------- */
function showCall(txt,ringing){
 $('callBox').classList.add('on');$('callTxt').textContent=txt;
 $('cAcc').style.display=ringing?'':'none';
}
async function media(video){
 ms=await navigator.mediaDevices.getUserMedia({audio:true,video:!!video});
 $('lv').srcObject=ms;$('lv').style.display=video?'':'none';
}
function makePC(){
 pc=new RTCPeerConnection(ICE);pend=[];
 ms.getTracks().forEach(t=>pc.addTrack(t,ms));
 pc.ontrack=e=>{$('rv').srcObject=e.streams[0]};
 pc.onicecandidate=e=>{if(e.candidate)fb.D.push(R('calls/'+cid+'/ice_'+role),e.candidate.toJSON())};
 pc.onconnectionstatechange=()=>{
  if(pc&&pc.connectionState==='connected')$('callTxt').textContent='🟢 En communication';
  if(pc&&(pc.connectionState==='failed'||pc.connectionState==='closed'))endCall(true);
 };
}
function listenIce(other){
 cOffs.push(fb.D.onChildAdded(R('calls/'+cid+'/ice_'+other),s=>{
  if(!pc)return;
  if(pc.remoteDescription)pc.addIceCandidate(s.val()).catch(()=>{});else pend.push(s.val());
 }));
 cOffs.push(fb.D.onValue(R('calls/'+cid+'/end'),s=>{if(s.val())endCall(true)}));
}
async function flushIce(){for(const c of pend)await pc.addIceCandidate(c).catch(()=>{});pend=[]}

window.amCall=async video=>{
 if(pc||!cur)return;
 const callee=cur;
 try{
  await media(video);
  cid='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);role='a';
  makePC();
  const o=await pc.createOffer();await pc.setLocalDescription(o);
  await fb.D.set(R('calls/'+cid),{caller:myK,callee,video:!!video,offer:{type:o.type,sdp:o.sdp},t:Date.now()});
  await fb.D.set(R('incoming/'+callee),{from:myK,name:me.name,id:cid,video:!!video,t:Date.now()});
  showCall('Appel de '+((fr[callee]||{}).name||callee)+'…');
  listenIce('b');
  cOffs.push(fb.D.onValue(R('calls/'+cid+'/answer'),async s=>{
   if(s.exists()&&pc&&!pc.remoteDescription){await pc.setRemoteDescription(s.val());flushIce();fb.D.remove(R('incoming/'+callee)).catch(()=>{})}
  }));
  setTimeout(()=>{if(pc&&pc.connectionState!=='connected'&&role==='a')endCall(false,true)},45000);
 }catch(e){toast('Appel impossible (micro/caméra refusés ?)');endCall(false)}
};

function onInc(s){
 const v=s.val();
 if(!v){if(inc&&!pc){inc=null;$('callBox').classList.remove('on')}return}
 if(pc||Date.now()-v.t>90000){if(Date.now()-v.t>90000)fb.D.remove(R('incoming/'+myK)).catch(()=>{});return}
 inc=v;showCall('📞 '+v.name+' t\'appelle ('+(v.video?'vidéo':'voix')+')',true);
 if(navigator.vibrate)navigator.vibrate([500,300,500,300,500]);
}
window.amAccept=async()=>{
 if(!inc)return;const v=inc;
 try{
  await media(v.video);cid=v.id;role='b';makePC();
  const c=(await fb.D.get(R('calls/'+cid))).val();
  await pc.setRemoteDescription(c.offer);
  const a=await pc.createAnswer();await pc.setLocalDescription(a);
  await fb.D.update(R('calls/'+cid),{answer:{type:a.type,sdp:a.sdp}});
  fb.D.remove(R('incoming/'+myK)).catch(()=>{});
  showCall('Connexion…');listenIce('a');flushIce();
 }catch(e){toast('Impossible de répondre');endCall(true)}
};
window.amHang=()=>endCall(false);

function endCall(remote,timeout){
 const id=cid,wasInc=inc;
 cOffs.forEach(f=>{try{f()}catch(e){}});cOffs=[];
 if(pc){try{pc.close()}catch(e){}pc=null}
 if(ms){ms.getTracks().forEach(t=>t.stop());ms=null}
 $('rv').srcObject=null;$('lv').srcObject=null;$('callBox').classList.remove('on');
 if(!remote&&fb){
  if(id)fb.D.set(R('calls/'+id+'/end'),true).catch(()=>{});
  if(wasInc&&!id)fb.D.remove(R('incoming/'+myK)).catch(()=>{});
  if(role==='a'&&cur)fb.D.remove(R('incoming/'+cur)).catch(()=>{});
 }
 if(timeout)toast('Pas de réponse');
 inc=null;cid='';role='';
}

/* ---------- démarrage ---------- */
async function boot(){
 if(booting||!fb||typeof me==='undefined'||!me)return;
 const au=fb.auth;booting=true;
 try{
  if(au.currentUser&&au.currentUser.uid===ADMIN_UID){
   if(!err){err='Déconnecte-toi du mode admin (⚙️ Contrôle → Déconnexion admin) pour utiliser Amis.';ready=false;myK='';render()}
   return;
  }
  if(!au.currentUser)await fb.AU.signInAnonymously(au);
  const u=au.currentUser.uid;
  if(ready&&u===myU)return;
  offs.forEach(f=>f());offs=[];ready=false;
  myU=u;const k=K(me.phone);
  const s=await fb.D.get(R('profiles/'+k));
  if(s.exists()&&s.val().uid!==u){err='Ce numéro est déjà lié à un autre appareil.';myK='';render();return}
  await fb.D.set(R('profiles/'+k),{uid:u,name:me.name,phone:k,t:Date.now()});
  myK=k;err='';
  offs.push(fb.D.onValue(R('friends/'+myK),s=>{fr=s.val()||{};render()}));
  offs.push(fb.D.onValue(R('requests/'+myK),s=>{rq=s.val()||{};badge();render()}));
  offs.push(fb.D.onValue(R('incoming/'+myK),onInc));
  ready=true;render();
 }catch(e){
  console.log('amis',e);
  err=/operation-not-allowed|admin-restricted/.test(String(e.code))?'Active la connexion « Anonyme » dans Firebase → Authentication → Méthode de connexion.':'';
  render();
 }finally{booting=false}
}
setInterval(boot,2500);
})();
