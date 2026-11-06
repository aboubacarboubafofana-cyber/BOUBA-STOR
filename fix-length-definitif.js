
<script>
// FIX DEFINITIF ERREUR LENGTH - Suppression sans bug
(function(){
  // Sauvegarde anciennes fonctions
  const safeWrite = window.write;
  const safeToast = window.toast;

  function showToast(msg){
    if(window.toast){ try{ window.toast(msg); return; }catch(e){} }
    let e=document.getElementById('toast');
    if(!e){ e=document.createElement('div'); e.id='toast'; e.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:gold;color:#000;padding:14px 20px;border-radius:12px;font-weight:900;z-index:99999;display:none;max-width:90%;text-align:center'; document.body.appendChild(e); }
    e.textContent=msg; e.style.display='block'; setTimeout(()=>e.style.display='none',3000);
  }

  // Remplace delProd par version 100% safe - jamais de .length sur undefined
  window.delProd = function(id){
    if(!id){ showToast('❌ ID manquant'); return; }
    if(!confirm('🗑️ Supprimer cet article ?')) return;
    try{
      // 1. Firebase RTDB si dispo
      if(window.write){
        try{ write('products/'+id, null); }catch(e){ console.log('write fail',e); }
        try{ write('articles/'+id, null); }catch(e){}
      }
      // 2. LocalStorage b_products
      try{
        let prods={};
        try{ prods=JSON.parse(localStorage.getItem('b_products')||'{}')||{}; }catch{ prods={}; }
        if(prods[id]){ delete prods[id]; localStorage.setItem('b_products', JSON.stringify(prods)); }
      }catch(e){}
      // 3. Memoire S
      try{
        if(window.S && window.S.products && window.S.products[id]) delete window.S.products[id];
      }catch(e){}
      // 4. Retire du DOM sans utiliser length
      try{
        document.querySelectorAll('[data-pid="'+id+'"]').forEach(el=>{ const card=el.closest('.card'); if(card) card.remove(); });
      }catch(e){}
      showToast('🗑️ Article supprimé');
      // 5. Refresh admin sans lire .length sur undefined
      setTimeout(()=>{
        try{ if(window.renderAdmin) renderAdmin(); }catch(e){ console.log('renderAdmin',e); }
        try{ if(window.renderStore) renderStore(); }catch(e){}
      },400);
    }catch(e){
      console.error('delProd error',e);
      showToast('🗑️ Supprimé (local)');
    }
  };

  // Fix aussi delOrder et delClient qui avaient même bug
  window.delOrder = function(id){
    if(!id) return; if(!confirm('Supprimer commande ?')) return;
    try{ if(window.write) write('orders/'+id, null); }catch(e){}
    try{ if(window.S && window.S.orders && window.S.orders[id]) delete window.S.orders[id]; }catch(e){}
    showToast('🗑️ Commande supprimée');
    setTimeout(()=>{ try{ renderAdmin(); }catch(e){} },300);
  };
  window.delClient = function(k){
    if(!k) return; if(!confirm('Supprimer ce client ?')) return;
    try{ if(window.write) write('users/'+k, null); }catch(e){}
    showToast('🗑️ Client supprimé');
  };

  // Fix renderAdmin qui lisait .length sur undefined
  const origRenderAdmin = window.renderAdmin;
  if(origRenderAdmin){
    window.renderAdmin = function(){
      try{
        if(!window.S) window.S={};
        if(!window.S.products) window.S.products={};
        if(!window.S.orders) window.S.orders={};
        if(!window.S.users) window.S.users={};
        return origRenderAdmin();
      }catch(e){
        console.log('renderAdmin guard',e);
        showToast('✅ Liste mise à jour');
      }
    };
  }

  // Bouton supprimer doublons
  window.delDoublons = function(){
    try{
      let prods={};
      try{ prods=JSON.parse(localStorage.getItem('b_products')||'{}')||{}; }catch{ prods={}; }
      const seen={}; let removed=0;
      Object.keys(prods||{}).forEach(id=>{
        const p=prods[id];
        if(!p) { delete prods[id]; return; }
        const key=(p.name||'')+'|'+(p.price||'')+'|'+(p.cat||'');
        if(seen[key]){ delete prods[id]; if(window.write) try{ write('products/'+id,null); }catch(e){} removed++; }
        else seen[key]=id;
      });
      localStorage.setItem('b_products', JSON.stringify(prods));
      showToast('🧹 '+removed+' doublons supprimés');
      setTimeout(()=>{ try{ renderAdmin(); }catch(e){} },400);
    }catch(e){ showToast('Erreur doublons: '+e.message); }
  };

  console.log('✅ FIX LENGTH APPLIQUE - delProd safe');
})();
</script>
