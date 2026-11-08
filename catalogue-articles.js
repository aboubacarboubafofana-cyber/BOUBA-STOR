/* =============================================================
   CATALOGUE DYNAMIQUE — Fiche article & Articles similaires
   ============================================================= */
(function() {
  'use strict';

  // 1. Création du design de la fenêtre (CSS)
  var style = document.createElement('style');
  style.innerHTML = `
    #imgViewer { display: none !important; } /* Désactive l'ancien agrandisseur d'image */
    #prodModal { position:fixed; inset:0; background:rgba(0,0,0,.95); z-index:9999; display:none; overflow-y:auto; padding:15px; backdrop-filter: blur(4px); }
    #prodModal.show { display:block; }
    .pm-box { background:#111; border:1px solid gold; border-radius:20px; max-width:480px; margin:20px auto; padding:15px; color:#fff; position:relative; box-shadow:0 10px 30px rgba(0,0,0,0.8); }
    .pm-close { position:absolute; top:10px; right:10px; background:#333; color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; z-index:10; }
    .pm-img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:12px; margin-bottom:10px; background:#222; }
    .pm-name { color:gold; font-size:20px; margin-bottom:5px; font-weight:900; }
    .pm-price { font-size:18px; font-weight:bold; margin-bottom:10px; color:#fff; }
    .pm-desc { font-size:14px; color:#ccc; margin-bottom:15px; line-height:1.4; }
    .pm-btn { width:100%; padding:14px; border:none; border-radius:10px; font-weight:bold; font-size:16px; margin-bottom:8px; cursor:pointer; }
    .pm-add { background:gold; color:#000; }
    .pm-wa { background:#25D366; color:#fff; }
    .pm-related { margin-top:20px; border-top:1px solid #333; padding-top:15px; }
    .pm-rel-title { font-size:16px; color:gold; margin-bottom:10px; font-weight:900; text-align:center; }
    .pm-rel-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .pm-rel-card { background:#222; border-radius:10px; padding:6px; cursor:pointer; text-align:center; border:1px solid #333; transition:transform 0.2s; }
    .pm-rel-card:active { transform:scale(0.95); }
    .pm-rel-card img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:8px; }
    .pm-rel-card b { font-size:12px; display:block; margin-top:6px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pm-rel-card span { font-size:13px; color:gold; font-weight:bold; }
  `;
  document.head.appendChild(style);

  // 2. Création de la fenêtre vide
  var modal = document.createElement('div');
  modal.id = 'prodModal';
  modal.innerHTML = '<div class="pm-box" id="pmContent"></div>';
  document.body.appendChild(modal);

  modal.addEventListener('click', function(e) {
    if(e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
  window.closePm = closeModal;

  // 3. La logique pour afficher l'article
  function openProduct(id) {
    var S = window.S || {};
    var prods = S.products || {};
    var p = prods[id];
    if(!p) return;

    var content = document.getElementById('pmContent');
    var related = Object.values(prods).filter(function(x) {
      return x.cat === p.cat && x.id !== p.id;
    }).slice(0, 4);

    var wa = (S.info && S.info.whatsapp) ? S.info.whatsapp.replace(/\D/g,'') : '2250787619717';
    var waMsg = encodeURIComponent('Bonjour, je suis intéressé par : ' + p.name + ' (' + p.price + ' F)');

    var html = `
      <button class="pm-close" onclick="closePm()">✕</button>
      <img class="pm-img" src="${p.img || ''}">
      <div class="pm-name">${p.name}</div>
      <div class="pm-price">${Number(p.price).toLocaleString('fr-FR')} F CFA</div>
      <div class="pm-desc">${p.desc || 'Découvrez ce magnifique article de notre boutique BOuba-STOR. Livraison rapide à Abidjan en 24H.'}</div>
      <button class="pm-btn pm-add" onclick="addCart('${p.id}'); closePm();">🛒 Ajouter au panier</button>
      <a href="https://wa.me/${wa}?text=${waMsg}" target="_blank" class="pm-btn pm-wa" style="text-decoration:none; display:block; text-align:center;">📲 Commander sur WhatsApp</a>
    `;

    if(related.length) {
      html += `<div class="pm-related"><div class="pm-rel-title">👀 Vous aimerez aussi</div><div class="pm-rel-grid">`;
      related.forEach(function(r) {
        html += `
          <div class="pm-rel-card" onclick="openPm('${r.id}')">
            <img src="${r.img || ''}">
            <b>${r.name}</b>
            <span>${Number(r.price).toLocaleString('fr-FR')} F</span>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    content.innerHTML = html;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
  }
  window.openPm = openProduct;

  // 4. Détecter le clic sur un article (Partie Texte)
  document.addEventListener('click', function(e) {
    var card = e.target.closest('.card');
    if(!card) return;
    if(e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    // Si on clique sur le texte (pas l'image), on ouvre direct
    if (e.target.tagName !== 'IMG') {
      var id = card.getAttribute('data-pid');
      if(id) {
        e.preventDefault();
        e.stopPropagation();
        openProduct(id);
      }
    }
  }, true);

  // 5. Détourner l'ancien agrandisseur d'image (Partie Image)
  // Quand l'ancien code va essayer d'afficher l'image en grand, on l'intercepte pour ouvrir notre catalogue
  setTimeout(function() {
    var imgViewerPic = document.getElementById('imgViewerPic');
    if (imgViewerPic) {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'src') {
            var src = mutation.target.getAttribute('src');
            var S = window.S || {};
            var prods = S.products || {};
            var prodId = null;
            for (var id in prods) {
              if (prods[id].img === src) { prodId = id; break; }
            }
            if (prodId) {
              openProduct(prodId);
            }
          }
        });
      });
      observer.observe(imgViewerPic, { attributes: true });
    }
  }, 2500);

  console.log('🛍️ Catalogue Dynamique chargé !');
})();
