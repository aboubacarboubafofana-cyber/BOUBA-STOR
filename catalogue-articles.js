(function() {
  'use strict';

  var style = document.createElement('style');
  style.innerHTML = `
    #imgViewer { display: none !important; }
    #prodModal { position:fixed; inset:0; background:rgba(0,0,0,.95); z-index:9999; display:none; overflow-y:auto; padding:15px; backdrop-filter: blur(4px); }
    #prodModal.show { display:block; }
    .pm-box { background:#111; border:1px solid gold; border-radius:20px; max-width:480px; margin:20px auto; padding:15px; color:#fff; position:relative; }
    .pm-close { position:absolute; top:10px; right:10px; background:#333; color:#fff; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; z-index:10; }
    .pm-img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:12px; margin-bottom:10px; background:#222; }
    .pm-name { color:gold; font-size:20px; margin-bottom:5px; font-weight:900; }
    .pm-price { font-size:18px; font-weight:bold; margin-bottom:10px; color:#fff; }
    .pm-btn { width:100%; padding:14px; border:none; border-radius:10px; font-weight:bold; font-size:16px; margin-bottom:8px; cursor:pointer; display:block; text-align:center; text-decoration:none; }
    .pm-add { background:gold; color:#000; }
    .pm-wa { background:#25D366; color:#fff; }
    .pm-related { margin-top:20px; border-top:1px solid #333; padding-top:15px; }
    .pm-rel-title { font-size:16px; color:gold; margin-bottom:10px; font-weight:900; text-align:center; }
    .pm-rel-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .pm-rel-card { background:#222; border-radius:10px; padding:6px; cursor:pointer; text-align:center; border:1px solid #333; }
    .pm-rel-card img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:8px; }
    .pm-rel-card b { font-size:12px; display:block; margin-top:6px; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pm-rel-card span { font-size:13px; color:gold; font-weight:bold; }
  `;
  document.head.appendChild(style);

  var modal = document.createElement('div');
  modal.id = 'prodModal';
  modal.innerHTML = '<div class="pm-box" id="pmContent"></div>';
  document.body.appendChild(modal);

  window.closePm = function() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  };

  function openProduct(id) {
    var S = window.S || {};
    var prods = S.products || {};
    var p = prods[id];
    
    // On cherche aussi dans les articles des boutiques (Firestore)
    if(!p && window.__baData && window.__baData[id]) {
      p = window.__baData[id].a;
    }
    
    if(!p) return;

    var related = Object.values(prods).filter(function(x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    
    if(related.length === 0 && window.__baData) {
      related = Object.values(window.__baData).map(x=>x.a).filter(function(x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    }

    var wa = (S.info && S.info.whatsapp) ? S.info.whatsapp.replace(/\D/g,'') : '2250787619717';
    var waMsg = encodeURIComponent('Bonjour, je suis intéressé par : ' + p.name + ' (' + p.price + ' F)');

    var html = `
      <button class="pm-close" onclick="closePm()">✕</button>
      <img class="pm-img" src="${p.img || ''}">
      <div class="pm-name">${p.name}</div>
      <div class="pm-price">${Number(p.price).toLocaleString('fr-FR')} F CFA</div>
      <button class="pm-btn pm-add" onclick="addCart('${p.id}'); closePm();">🛒 Ajouter au panier</button>
      <a href="https://wa.me/${wa}?text=${waMsg}" target="_blank" class="pm-btn pm-wa">📲 Commander sur WhatsApp</a>
    `;

    if(related.length) {
      html += `<div class="pm-related"><div class="pm-rel-title">👀 Vous aimerez aussi</div><div class="pm-rel-grid">`;
      related.forEach(function(r) {
        html += `<div class="pm-rel-card" onclick="openPm('${r.id}')"><img src="${r.img || ''}"><b>${r.name}</b><span>${Number(r.price).toLocaleString('fr-FR')} F</span></div>`;
      });
      html += `</div></div>`;
    }

    document.getElementById('pmContent').innerHTML = html;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
  }
  window.openPm = openProduct;

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.card');
    if(!card) return;
    if(e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    var id = card.getAttribute('data-pid');
    if(id) {
      e.preventDefault();
      e.stopPropagation();
      openProduct(id);
    }
  }, true);
})();
