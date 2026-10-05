/* BOUBA STORE - module Amis (chat, répertoire, appel vocal/vidéo)
   À charger dans index.html avec : <script src="amis.js"></script> (juste avant </body>) */
(function(){
const ICE={iceServers:[
 {urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}
 /* Pour que les appels marchent sur 4G partout, ajoutez un serveur TURN ici :
 ,{urls:'turn:VOTRE_SERVEUR:443',username:'USER',credential:'MOTDEPASSE'} */
]};
const K=s=>'u'+String(s||'').replace(/\D/g,'').slice(-10);
const ph=k=>String(k||'').slice(1);
let needPw=false,pwErr='';
let DB2=null,AU2=null;
const R=p=>fb.D.ref(DB2,p);
async function init2(){
 if(DB2)return;
 const A=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
 const app=A.initializeApp(FB_CFG,'amis'); /* session séparée de l'admin */
 DB2=fb.D.getDatabase(app);AU2=fb.AU.getAuth(app);
}
let myK='',myU='',offs=[],fr={},rq={},dirRes=[],tab='chats',err='',cur=null,msgOff=null;
let peer='',ringT=null;
let ready=false,booting=false,pc=null,ms=null,cid='',cOffs=[],inc=null,pend=[],role='';

/* ---------- interface ---------- */
const st=document.createElement('style');
st.textContent=`
#chMsgs{height:calc(100vh - 170px);overflow-y:auto;margin:10px 0}
.bub{max-width:80%;padding:8px 11px;border-radius:12px;margin-bottom:6px;background:#222;font-size:14px;word-break:break-word}
.bub.me{background:gold;color:#000;margin-left:auto}
.chIn{position:fixed;left:0;right:0;bottom:0;display:flex;gap:6px;padding:8px;background:#000;border-top:1px solid #d4af37}
.chIn{align-items:center}
.chIn .input{margin:0;flex:1;min-width:0}
.chBtn{width:42px;height:42px;border-radius:50%;border:1px solid gold;background:#111;color:gold;font-size:20px;flex:none}
.chBtn.snd{background:gold;color:#000;font-weight:900}
.bub img,.bub video{max-width:100%;border-radius:8px;display:block}
.bub audio{width:220px;max-width:100%}
.bub a{color:inherit;font-weight:700}
.bub small{display:block;font-size:10px;opacity:.6;margin-top:3px;text-align:right}
#plusMenu{display:none;position:fixed;left:8px;bottom:64px;background:#111;border:1px solid gold;border-radius:12px;padding:6px;z-index:300;flex-direction:column;gap:4px}
#plusMenu.on{display:flex}
#plusMenu button{background:#000;color:#fff;border:0;padding:10px 14px;text-align:left;font-size:14px;border-radius:8px}
#imgView{display:none;position:fixed;inset:0;background:#000e;z-index:700;align-items:center;justify-content:center}
#imgView.on{display:flex}#imgView img{max-width:100%;max-height:100%}
.qb{background:#000;border:1px solid gold;color:gold;border-radius:8px;padding:6px 9px;font-size:16px;margin-left:4px}
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
 <div class="chIn" id="chBar"><button class="chBtn" onclick="amPlus()">＋</button><input id="chText" class="input" placeholder="Écris un message…" onkeypress="if(event.key==='Enter')amSend()"><button class="chBtn" id="chMic" onclick="amRec()">🎤</button><button class="chBtn snd" onclick="amSend()">➤</button></div>
 <div class="chIn" id="recBar" style="display:none"><button class="chBtn" onclick="amRecCancel()">🗑</button><div id="recTime" style="flex:1;color:#f55;font-weight:700;padding-left:8px">🔴 0:00</div><button class="chBtn snd" onclick="amRecSend()">➤</button></div>
 <div id="plusMenu"><button onclick="amPick2('fImg')">🖼️ Photo de la galerie</button><button onclick="amPick2('fCam')">📷 Prendre une photo</button><button onclick="amPick2('fVid')">🎞️ Vidéo</button><button onclick="amPick2('fDoc')">📎 Document / autre fichier</button></div>
 <input type="file" id="fImg" accept="image/*" hidden><input type="file" id="fCam" accept="image/*" capture="environment" hidden><input type="file" id="fVid" accept="video/*" hidden><input type="file" id="fDoc" hidden>
</div>
<div id="imgView" onclick="this.classList.remove('on')"><img id="ivImg"></div>
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
 if(needPw){b.innerHTML='<div class="ctrl"><b style="color:gold">🔐 Mot de passe Amis</b><p style="font-size:12px;color:#aaa;margin:6px 0 10px">Choisis un mot de passe (6 caractères minimum). Si tu en as déjà un, entre-le pour te reconnecter sur ce téléphone.</p><input id="amPw" class="input" type="password" placeholder="Mot de passe"><button class="gold" onclick="amLogin()">Continuer</button>'+(pwErr?'<p style="color:#f66;margin-top:8px">'+esc(pwErr)+'</p>':'')+'</div>';return}
 if(!myK){b.innerHTML='<p style="color:#888">Connexion en cours…</p>';return}
 if(tab==='chats'){
  b.innerHTML=Object.keys(fr).map(k=>'<div class="row" onclick="amOpen(\''+k+'\')"><div class="g"><b>'+esc(fr[k].name||ph(k))+'</b><br><small style="color:#888">'+ph(k)+'</small></div><button class="qb" onclick="event.stopPropagation();amQuick(\''+k+'\',false)">📞</button><button class="qb" onclick="event.stopPropagation();amQuick(\''+k+'\',true)">🎥</button><button class="qb">💬</button></div>').join('')
   ||'<p style="color:#888">Aucun ami pour l\'instant. Ouvre l\'onglet Répertoire pour en ajouter.</p>';
 }else if(tab==='req'){
  b.innerHTML=Object.keys(rq).map(k=>'<div class="ctrl"><b>'+esc(rq[k].name||ph(k))+'</b> veut devenir ton ami<br><button class="mini" onclick="amAcc(\''+k+'\')">✅ Accepter</button> <button class="mini" style="color:#f44;border-color:#f44" onclick="amRef(\''+k+'\')">Refuser</button></div>').join('')
   ||'<p style="color:#888">Aucune demande.</p>';
 }else{
  b.innerHTML='<button class="gold" onclick="amPick()">📲 Choisir dans mon répertoire</button>'
   +'<div class="ctrl" style="margin-top:10px"><input id="amNum" class="input" type="tel" placeholder="Ou entre un numéro (ex: 0787619717)"><button class="mini" onclick="amAddNum()">➕ Ajouter</button></div>'
   +dirRes.map((x,i)=>'<div class="row"><div class="g"><b>'+esc(x.name)+'</b><br><small style="color:#888">'+ph(x.k)+'</small></div>'
    +(fr[x.k]?'✅ ami':x.reg?'<button class="mini" onclick="amAdd(\''+x.k+'\')">➕ Ajouter</button>':'<button class="mini" onclick="amInvite('+i+')">📩 Inviter</button>')+'</div>').join('');
 }
}

/* ---------- répertoire et amis ---------- */
window.amPick=async()=>{
 if(!('contacts' in navigator&&'ContactsManager' in window)){toast('Répertoire non disponible ici : entre le numéro à la main');return}
 try{
  const c=await navigator.contacts.select(['name','tel'],{multiple:true});
  const seen={},L=[];
  c.forEach(x=>(x.tel||[]).forEach(t=>{const k=K(t);if(k.length===11&&k!==myK&&!seen[k]){seen[k]=1;L.push({name:(x.name||[])[0]||ph(k),k})}}));
  await Promise.all(L.slice(0,80).map(async x=>{try{x.reg=(await fb.D.get(R('profiles/'+x.k))).exists()}catch(e){x.reg=false}}));
  dirRes=L.slice(0,80);render();
 }catch(e){}
};
window.amAddNum=async()=>{
 const k=K($('amNum').value);
 if(k.length!==11){toast('Numéro invalide (10 chiffres)');return}
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
 window.open('https://wa.me/225'+ph(x.k)+'?text='+encodeURIComponent(msg),'_blank');
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
const U=u=>/^data:(image|audio|video|application|text)\/[\w.+-]+(;[\w=.+-]+)*;base64,[A-Za-z0-9+\/=]+$/.test(u||'')?u:'';
const hhmm=t=>{const d=new Date(t||0);return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')};
function bubble(m){
 const me=m.from===myK,u=U(m.media);let c;
 if(m.type==='audio'&&u)c='<audio controls preload="none" src="'+u+'"></audio>'+(m.dur?'<small style="text-align:left">🎤 '+Math.floor(m.dur/60)+':'+String(m.dur%60).padStart(2,'0')+'</small>':'');
 else if(m.type==='image'&&u)c='<img src="'+u+'" onclick="amView(this.src)">';
 else if(m.type==='video'&&u)c='<video controls preload="metadata" playsinline src="'+u+'"></video>';
 else if(m.type==='file'&&u)c='<a download="'+esc(m.name||'fichier')+'" href="'+u+'">📎 '+esc(m.name||'fichier')+'</a>';
 else c=esc(m.text);
 return '<div class="bub'+(me?' me':'')+'">'+c+'<small>'+hhmm(m.t)+'</small></div>';
}
window.amView=src=>{$('ivImg').src=src;$('imgView').classList.add('on')};
window.amOpen=k=>{
 cur=k;openPage('chatPage');
 $('chName').textContent=(fr[k]||{}).name||ph(k);$('chMsgs').innerHTML='';
 if(msgOff)msgOff();
 const q=fb.D.query(R('chats/'+myK+'/'+k),fb.D.limitToLast(30));
 msgOff=fb.D.onValue(q,s=>{
  const a=Object.values(s.val()||{}).sort((x,y)=>x.t-y.t),c=$('chMsgs');
  const keep=c.scrollHeight-c.scrollTop-c.clientHeight<120||!c.innerHTML;
  c.innerHTML=a.map(bubble).join('');
  if(keep)c.scrollTop=c.scrollHeight;
 });
};
async function sendMsg(m){
 if(!cur)return false;
 const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const full=Object.assign({from:myK,text:'',t:Date.now()},m),u={};
 u['chats/'+myK+'/'+cur+'/'+id]=full;u['chats/'+cur+'/'+myK+'/'+id]=full;
 try{await fb.D.update(R(''),u);return true}catch(e){toast('Envoi impossible (fichier trop lourd ?)');return false}
}
window.amSend=async()=>{
 const i=$('chText'),t=i.value.trim();if(!t||!cur)return;i.value='';
 if(!(await sendMsg({type:'text',text:t.slice(0,1000)})))i.value=t;
};
window.amQuick=(k,v)=>{cur=k;amCall(v)};

/* ----- pièces jointes ----- */
window.amPlus=()=>$('plusMenu').classList.toggle('on');
window.amPick2=id=>{$('plusMenu').classList.remove('on');$(id).click()};
const toData=(b,cb)=>{const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(b)};
function imgData(file,max,cb){
 const r=new FileReader();
 r.onload=e=>{const i=new Image();i.onload=()=>{
  const k=Math.min(1,max/Math.max(i.width,i.height));
  const c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
  c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',0.62));
 };i.onerror=()=>toast('Image illisible');i.src=e.target.result};
 r.readAsDataURL(file);
}
const MAXB=2.5*1024*1024;
['fImg','fCam'].forEach(id=>$(id).addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 toast('Envoi de la photo…');
 imgData(f,1000,d=>sendMsg({type:'image',text:'🖼️ Photo',media:d}));
}));
$('fVid').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>MAXB){toast('Vidéo trop lourde (max 2,5 Mo). Envoie une vidéo plus courte.');return}
 toast('Envoi de la vidéo…');toData(f,d=>sendMsg({type:'video',text:'🎞️ Vidéo',media:d}));
});
$('fDoc').addEventListener('change',e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>MAXB){toast('Fichier trop lourd (max 2,5 Mo)');return}
 toast('Envoi du fichier…');toData(f,d=>sendMsg({type:'file',text:'📎 '+f.name.slice(0,80),name:f.name.slice(0,80),media:d}));
});

/* ----- messages vocaux ----- */
let rec=null,recChunks=[],recT0=0,recTimer=null,recStream=null;
function recStop(){
 clearInterval(recTimer);
 if(recStream){recStream.getTracks().forEach(t=>t.stop());recStream=null}
 $('chBar').style.display='flex';$('recBar').style.display='none';
}
window.amRec=async()=>{
 if(rec||!cur)return;
 try{
  recStream=await navigator.mediaDevices.getUserMedia({audio:true});
  const mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));
  rec=new MediaRecorder(recStream,mt?{mimeType:mt,audioBitsPerSecond:24000}:{audioBitsPerSecond:24000});
  recChunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)recChunks.push(e.data)};
  rec.start();recT0=Date.now();
  $('chBar').style.display='none';$('recBar').style.display='flex';$('recTime').textContent='🔴 0:00';
  recTimer=setInterval(()=>{
   const s=Math.floor((Date.now()-recT0)/1000);
   $('recTime').textContent='🔴 '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
   if(s>=120)amRecSend();
  },500);
 }catch(e){rec=null;recStop();toast('Micro refusé ou indisponible')}
};
window.amRecCancel=()=>{if(rec){rec.onstop=null;try{rec.stop()}catch(e){}}rec=null;recStop()};
window.amRecSend=()=>{
 if(!rec)return;
 const r=rec,dur=Math.round((Date.now()-recT0)/1000);rec=null;
 r.onstop=()=>{
  const b=new Blob(recChunks,{type:r.mimeType||'audio/webm'});recStop();
  if(dur<1){toast('Message trop court');return}
  toData(b,d=>sendMsg({type:'audio',text:'🎤 Message vocal',media:d,dur:dur}));
 };
 try{r.stop()}catch(e){recStop()}
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
 const callee=cur;peer=callee;
 try{
  await media(video);
  cid='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);role='a';
  makePC();
  const o=await pc.createOffer();await pc.setLocalDescription(o);
  await fb.D.set(R('calls/'+cid),{caller:myK,callee,video:!!video,offer:{type:o.type,sdp:o.sdp},t:Date.now()});
  await fb.D.set(R('incoming/'+callee),{from:myK,name:me.name,id:cid,video:!!video,t:Date.now()});
  showCall('Appel de '+((fr[callee]||{}).name||ph(callee))+'…');
  listenIce('b');
  cOffs.push(fb.D.onValue(R('calls/'+cid+'/answer'),async s=>{
   if(s.exists()&&pc&&!pc.remoteDescription){await pc.setRemoteDescription(s.val());flushIce();fb.D.remove(R('incoming/'+callee)).catch(()=>{})}
  }));
  setTimeout(()=>{if(pc&&pc.connectionState!=='connected'&&role==='a')endCall(false,true)},45000);
 }catch(e){toast('Appel impossible (micro/caméra refusés ?)');endCall(false)}
};

function ring(on){
 clearInterval(ringT);ringT=null;
 if(!on)return;
 const beep=()=>{try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=820;g.gain.value=.15;o.start();setTimeout(()=>{o.stop();c.close()},350)}catch(e){}};
 beep();ringT=setInterval(beep,1400);
}
function onInc(s){
 const v=s.val();
 if(!v){if(inc&&!pc){inc=null;$('callBox').classList.remove('on')}return}
 if(pc||Date.now()-v.t>90000){if(Date.now()-v.t>90000)fb.D.remove(R('incoming/'+myK)).catch(()=>{});return}
 inc=v;showCall('📞 '+v.name+' t\'appelle ('+(v.video?'vidéo':'voix')+')',true);
 if(navigator.vibrate)navigator.vibrate([500,300,500,300,500]);ring(true);
}
window.amAccept=async()=>{
 if(!inc)return;const v=inc;ring(false);
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
 const id=cid||(inc&&inc.id)||'',wasInc=inc;ring(false);
 cOffs.forEach(f=>{try{f()}catch(e){}});cOffs=[];
 if(pc){try{pc.close()}catch(e){}pc=null}
 if(ms){ms.getTracks().forEach(t=>t.stop());ms=null}
 $('rv').srcObject=null;$('lv').srcObject=null;$('callBox').classList.remove('on');
 if(!remote&&fb){
  if(id)fb.D.set(R('calls/'+id+'/end'),true).catch(()=>{});
  if(wasInc)fb.D.remove(R('incoming/'+myK)).catch(()=>{});
  if(role==='a'&&peer)fb.D.remove(R('incoming/'+peer)).catch(()=>{});
 }
 if(timeout)toast('Pas de réponse');
 inc=null;cid='';role='';
}

/* ---------- connexion ---------- */
window.amLogin=async()=>{
 const p=($('amPw')||{}).value||'';
 if(p.length<6){pwErr='6 caractères minimum';render();return}
 const em=ph(K(me.phone))+'@amis.bouba-store.app';
 try{
  await init2();
  try{await fb.AU.createUserWithEmailAndPassword(AU2,em,p)}
  catch(e){
   if(e.code==='auth/email-already-in-use')await fb.AU.signInWithEmailAndPassword(AU2,em,p);
   else throw e;
  }
  pwErr='';needPw=false;render();boot();
 }catch(e){
  pwErr=/wrong-password|invalid-credential/.test(String(e.code))?'Mot de passe incorrect pour ce numéro':'Connexion impossible, réessaie';
  render();
 }
};

/* ---------- démarrage ---------- */
async function boot(){
 if(booting||!fb||typeof me==='undefined'||!me)return;
 booting=true;
 try{
  await init2();const au=AU2;await au.authStateReady();
  if(!au.currentUser){if(!needPw){needPw=true;render()}return}
  needPw=false;
  const u=au.currentUser.uid;
  if(ready&&u===myU)return;
  offs.forEach(f=>f());offs=[];ready=false;
  myU=u;const k=K(me.phone);
  const s=await fb.D.get(R('profiles/'+k));
  if(s.exists()&&s.val().uid!==u){err='Ce numéro est déjà utilisé par un autre compte.';myK='';render();return}
  await fb.D.set(R('profiles/'+k),{uid:u,name:me.name,phone:ph(k),t:Date.now()});
  myK=k;err='';
  offs.push(fb.D.onValue(R('friends/'+myK),s=>{fr=s.val()||{};render()}));
  offs.push(fb.D.onValue(R('requests/'+myK),s=>{rq=s.val()||{};badge();render()}));
  offs.push(fb.D.onValue(R('incoming/'+myK),onInc));
  ready=true;render();
 }catch(e){
  console.log('amis',e);
  err='';
  render();
 }finally{booting=false}
}
setInterval(boot,2500);
})();
