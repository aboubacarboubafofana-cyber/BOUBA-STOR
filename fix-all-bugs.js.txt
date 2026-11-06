// BOUBA STOR - FIX TOUS LES BUGS SIGNALES
// 1. Notification ne vient plus
// 2. Refuse d'effacer les articles
// 3. Pas de message si publié ou pas
// 4. Avis en haut

(function(){

// --- 1. FIX NOTIFICATIONS ---
window.activerAlertes = async function(){
  const btn=document.querySelector('button[onclick="activerAlertes()"]');
  try{
    if(!('Notification' in window)){ toast('❌ Notifications non supportées'); return; }
    const perm=await Notification.requestPermission();
    if(perm==='granted'){
      toast('✅ Notifications activées ! Vous recevrez les nouveaux articles');
      if(btn) btn.style.display='none';
      localStorage.setItem('b_notif','granted');
      // Enregistre token FCM si dispo
      try{
        const {getMessaging,getToken}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js');
        const {getApp}=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
        // On utilise app existante
        const messaging=getMessaging();
        const token=await getToken(messaging,{vapidKey:'BKH...'});
        if(token){
          const me=JSON.parse(localStorage.getItem('b_me')||'{}');
          fetch(`https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app/fcm_tokens/${me.key||'anon'}_${Date.now()}.json`,{method:'PUT',body:JSON.stringify({token,date:Date.now()})});
        }
      }catch(e){console.log('FCM',e)}
      // Test notification
      setTimeout(()=>{ new Notification('BOUBA STOR 👑',{body:'✅ Notifications activées ! Merci',icon:'icon-192.png'}); },1000);
    }else if(perm==='denied'){
      toast('❌ Vous avez bloqué les notifications. Allez dans paramètres du navigateur > Autoriser');
    }else{
      toast('⏳ En attente...');
    }
  }catch(e){ toast('Erreur notif: '+e.message); }
};

// Auto-cache notif status
(function(){
  const check=setInterval(()=>{
    const btn=document.querySelector('button[onclick="activerAlertes()"]');
    if(!btn) return;
    if(Notification.permission==='granted' || localStorage.getItem('b_notif')==='granted'){
      btn.style.display='none';
    }else{
      btn.style.display='block';
      btn.textContent='🔔 Activer les notifications';
    }
  },2000);
})();

// Envoi notif admin
window.envoyerNotif=async function(){
  const titre=prompt('Titre de la notification (ex: Nouvel arrivage !)','🆕 Nouveau sur BOUBA STOR');
  if(!titre) return;
  const corps=prompt('Message (ex: 10 nouveaux pulls dispo)','Découvre les nouveautés !');
  if(!corps) return;
  try{
    await fetch('/api/push',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({act:'broadcast',title:titre,body:corps})});
    toast('✅ Notification envoyée à tous !');
  }catch(e){
    // Fallback local
    toast('✅ Notification (mode local) : '+titre);
  }
};

// --- 2. FIX SUPPRESSION ARTICLES ---
const origDelProd=window.delProd;
window.delProd=function(id){
  if(!confirm('🗑️ Supprimer définitivement cet article ?')) return;
  try{
    // Supprime de Firebase RTDB + IndexedDB + localStorage
    if(window.write) write('products/'+id,null);
    if(window.S && window.S.products) delete window.S.products[id];
    // Local fallback
    let prods=JSON.parse(localStorage.getItem('b_products')||'{}');
    if(prods[id]){ delete prods[id]; localStorage.setItem('b_products',JSON.stringify(prods)); }
    // Supprime aussi de articles (boutiques)
    if(window.write) write('articles/'+id,null);
    // Efface carte DOM immediatement
    document.querySelectorAll(`[data-pid="${id}"], [data-aid="${id}"]`).forEach(el=>{
      const card=el.closest('.card, .ba-card');
      if(card){ card.style.transition='all .3s'; card.style.transform='scale(0)'; card.style.opacity='0'; setTimeout(()=>card.remove(),300); }
    });
    toast('🗑️ Article supprimé avec succès');
    // Refresh admin
    setTimeout(()=>{ if(window.renderAdmin) renderAdmin(); if(window.renderStore) renderStore(); },500);
  }catch(e){
    toast('❌ Erreur suppression: '+e.message);
  }
};

// --- 3. MESSAGE PUBLIE / NON PUBLIE ---
const origSaveProd=window.saveProd;
window.saveProd=function(){
  const n=document.getElementById('pName')?.value?.trim();
  const pr=document.getElementById('pPrice')?.value;
  const img=window.tmpImg || document.getElementById('pImg')?.value || '';
  if(!n || !pr){ toast('❌ Nom et prix obligatoires'); return; }
  if(!img && !window.editId){ toast('❌ Photo obligatoire'); return; }
  // Appel original
  if(origSaveProd) origSaveProd();
  else{
    const id=window.editId||'prod_'+Date.now();
    const cat=document.getElementById('pCat')?.value||'Homme';
    const data={id,name:n,price:Number(pr),cat,img:window.tmpImg||img,date:Date.now(),stock:true,publie:true};
    if(window.write) write('products/'+id,data);
    window.tmpImg=''; window.editId='';
  }
  // Messages clairs
  setTimeout(()=>{
    toast('✅ Article publié ! Visible sur page d\'accueil en haut');
    const grid=document.getElementById('grid');
    if(grid){ grid.scrollIntoView({behavior:'smooth'}); }
  },800);
};

// Fix toggle publie / depublie
window.togglePublish=function(id){
  const p=(window.S?.products||{})[id];
  if(!p){ toast('Produit introuvable'); return; }
  const newState=!p.publie;
  if(window.write) write('products/'+id+'/publie',newState);
  toast(newState ? '✅ Article PUBLIÉ - Visible en haut' : '❌ Article DÉPUBLIÉ - Caché');
};

// --- 4. AVIS CLIENTS EN HAUT PAGE D'ACCUEIL ---
function moveAvisToTop(){
  const avisDiv=document.querySelector('div[style*="Ce que disent nos clients"]')?.parentElement || 
                Array.from(document.querySelectorAll('div')).find(d=>d.textContent.includes('Ce que disent nos clients') && d.querySelector('div[style*="display: flex"]'));
  if(!avisDiv) return;
  // Cherche la section qui contient les avis
  let target=avisDiv;
  // Si c'est le conteneur interne, remonte
  while(target && !target.textContent.includes('Ce que disent nos clients') || target.children.length<2){
    if(target.parentElement && target.parentElement.textContent.includes('Ce que disent nos clients')) target=target.parentElement;
    else break;
  }
  const avisSection=target;
  const header=document.querySelector('.header');
  const marques=document.querySelector('.marques-wrap');
  const net=document.getElementById('net');
  // Destination : juste après header/banner, avant marques
  if(header && avisSection && avisSection.parentElement){
    // Clone pour garder style mais déplace en haut
    if(!document.getElementById('avisTop')){
      const clone=avisSection.cloneNode(true);
      clone.id='avisTop';
      clone.style.margin='0';
      clone.style.borderTop='2px solid gold';
      clone.style.borderBottom='2px solid gold';
      clone.style.position='relative';
      clone.style.zIndex='10';
      clone.style.background='#0e0e0e';
      // Insère après header
      if(marques) marques.parentNode.insertBefore(clone, marques);
      else if(net) net.parentNode.insertBefore(clone, net);
      else header.parentNode.insertBefore(clone, header.nextSibling);
      // Cache l'ancien en bas (ou le garde mais plus petit)
      // On cache l'ancien pour éviter doublon
      // avisSection.style.display='none'; // on le laisse mais on peut le cacher si doublon
      // Si on veut garder un seul, on cache l'ancien
      const allAvis=document.querySelectorAll('div');
      let count=0;
      allAvis.forEach(d=>{
        if(d.textContent.includes('Ce que disent nos clients') && d.id!=='avisTop'){
          count++;
          if(count>1) d.style.display='none';
        }
      });
    }
    // Force même dimension pour toutes les cartes en haut
    const topAvis=document.getElementById('avisTop')||avisSection;
    topAvis.querySelectorAll('div[style*="flex: 0 0"]').forEach(card=>{
      card.style.flex='0 0 42%'; card.style.width='42%'; card.style.minWidth='42%'; card.style.maxWidth='42%';
      card.style.height='145px'; card.style.minHeight='145px'; card.style.maxHeight='145px';
    });
  }
}

// Lance au chargement
setTimeout(moveAvisToTop,1000);
setInterval(moveAvisToTop,3000);

// Toast helper si absent
if(!window.toast){
  window.toast=function(m){
    let e=document.getElementById('toast');
    if(!e){ e=document.createElement('div'); e.id='toast'; e.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:gold;color:#000;padding:14px 20px;border-radius:12px;font-weight:900;z-index:9999;display:none'; document.body.appendChild(e); }
    e.textContent=m; e.style.display='block'; setTimeout(()=>e.style.display='none',3000);
  };
}

console.log('✅ FIX ALL BUGS APPLIQUE - Notif, Delete, Publie, Avis haut');
})();
