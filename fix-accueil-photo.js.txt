
<script>
// FIX 1 ACCUEIL + FIX 2 PHOTO OBLIGATOIRE
(function(){
  // --- FIX 1 : ACCUEIL - CARTES COUPEES / CHEVAUCHEMENT ---
  const css = document.createElement('style');
  css.textContent = `
    /* Boutiques glissantes - ne pas couper */
    .grid, #grid, .boutiques-scroll, .shop-scroll{
      display:flex !important;
      flex-wrap:nowrap !important;
      overflow-x:auto !important;
      gap:10px !important;
      padding:10px !important;
      scroll-snap-type:x mandatory !important;
      align-items:flex-start !important;
    }
    .grid .card, #grid .card, .boutiques-scroll .card{
      flex:0 0 85% !important;
      width:85% !important;
      min-width:85% !important;
      max-width:85% !important;
      scroll-snap-align:start !important;
      box-sizing:border-box !important;
      overflow:hidden !important;
    }
    .grid .card img, #grid .card img{
      width:100% !important;
      height:auto !important;
      aspect-ratio:1/1 !important;
      object-fit:cover !important;
    }
    /* Barre bas ne chevauche plus */
    .nav{position:fixed !important;bottom:0 !important;left:0 !important;right:0 !important;z-index:100 !important;background:#000 !important;border-top:2px solid gold !important}
    .cart-bar{bottom:60px !important}
    /* Boutons Conseils / Aide ne chevauchent pas */
    #aideBtn, .aide-float, button[onclick*="Aide"]{
      position:fixed !important;bottom:80px !important;left:10px !important;z-index:90 !important;
    }
    /* Corrige titre coupé Robe sexy */
    .card .info b, .card .info h3{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;word-break:break-word !important}
  `;
  document.head.appendChild(css);

  function fixAccueil(){
    document.querySelectorAll('#grid, .grid').forEach(g=>{
      g.style.display='flex'; g.style.overflowX='auto'; g.style.gap='10px';
      g.querySelectorAll(':scope > .card').forEach(card=>{
        card.style.flex='0 0 85%'; card.style.width='85%'; card.style.minWidth='85%'; card.style.maxWidth='85%';
        card.style.scrollSnapAlign='start'; card.style.overflow='hidden';
      });
    });
  }
  setInterval(fixAccueil, 1500);
  fixAccueil();

  // --- FIX 2 : PHOTO OBLIGATOIRE ALORS QUE PHOTO CHOISIE ---
  // Le bug : saveProd() vérifiait tmpImg mais tmpImg était vide car compress() n'avait pas fini
  // Fix : quand tu choisis un fichier, on met tmpImg tout de suite + on utilise l'aperçu comme secours

  // 1. Surveille le choix de fichier et remplit tmpImg immédiatement
  document.addEventListener('change', function(e){
    const input = e.target;
    if(input && input.type==='file' && input.files && input.files[0]){
      const f = input.files[0];
      const r = new FileReader();
      r.onload = function(ev){
        const img = new Image();
        img.onload = function(){
          const c = document.createElement('canvas');
          const k = Math.min(1, 800/Math.max(img.width, img.height));
          c.width = img.width*k; c.height = img.height*k;
          c.getContext('2d').drawImage(img,0,0,c.width,c.height);
          const data = c.toDataURL('image/jpeg', 0.7);
          window.tmpImg = data;
          // Met aussi dans tous les aperçus possibles
          ['lPrev','pPrev','imgPrev'].forEach(id=>{
            const el=document.getElementById(id);
            if(el){ el.src=data; el.style.display='block'; }
          });
          console.log('✅ Photo chargée tmpImg OK', data.length);
        };
        img.src = ev.target.result;
      };
      r.readAsDataURL(f);
    }
  });

  // 2. Patch saveProd pour accepter l'aperçu si tmpImg est vide
  const origSaveProd = window.saveProd;
  window.saveProd = function(){
    // Si tmpImg vide mais aperçu a une image, on l'utilise
    if(!window.tmpImg){
      const prev = document.getElementById('lPrev') || document.getElementById('pPrev');
      if(prev && prev.src && prev.src.startsWith('data:image') && prev.src.length>1000){
        window.tmpImg = prev.src;
        console.log('✅ Photo récupérée depuis aperçu');
      }
      // Si editId existe, on a déjà une image
      if(window.editId && window.S && window.S.products && window.S.products[window.editId]){
        window.tmpImg = window.S.products[window.editId].img || window.tmpImg;
      }
    }
    // Si toujours pas de photo, on bloque avec message clair
    if(!window.tmpImg && !window.editId){
      // Vérifie si un fichier est choisi mais pas encore lu
      const fileInput = document.querySelector('input[type="file"]');
      if(fileInput && fileInput.files && fileInput.files[0]){
        alert('⏳ Photo en cours de chargement, attends 2 secondes et re-clique Enregistrer');
        return;
      }
      // Appel original qui affichera "Photo obligatoire" mais maintenant tmpImg est rempli
    }
    if(origSaveProd) return origSaveProd();
    // Fallback si origSaveProd absent
    const n = document.getElementById('pName')?.value?.trim();
    const pr = Number(document.getElementById('pPrice')?.value);
    const cat = document.getElementById('pCat')?.value?.trim() || 'Homme';
    if(!n || !pr){ alert('Nom et prix obligatoires'); return; }
    if(!window.tmpImg){ alert('❌ Photo obligatoire'); return; }
    const id = window.editId || 'prod_'+Date.now();
    const data = {id, name:n, price:pr, cat, img:window.tmpImg, date:Date.now(), publie:true, stock:true};
    if(window.write) window.write('products/'+id, data);
    window.tmpImg=''; window.editId='';
    if(window.toast) window.toast('✅ Article publié !');
    else alert('✅ Article publié !');
  };

  console.log('✅ FIX ACCUEIL + PHOTO OBLIGATOIRE APPLIQUÉ');
})();
</script>
