(function() {
  'use strict';
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };

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
    .pm-shop { color:#bbb; font-size:13px; margin-bottom:10px; }
    .pm-btn { width:100%; padding:14px; border:none; border-radius:10px; font-weight:bold; font-size:16px; margin-bottom:8px; cursor:pointer; display:block; text-align:center; text-decoration:none; }
    .pm-add { background:gold; color:#000; }
    .pm-wa { background:#25D366; color:#fff; }
    .pm-share { background:#222; color:gold; border:1px solid gold; }
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

  // Un article vient soit de l'accueil (S.products), soit d'une boutique (pont Firestore __baData)
  function find(id) {
    var S = window.S || {};
    var p = (S.products || {})[id];
    if (!p && window.__baData && window.__baData[id]) p = window.__baData[id].a;
    return p || null;
  }

  function openProduct(id) {
    var S = window.S || {};
    var prods = S.products || {};
    var p = find(id);
    if (!p) return;

    var related = Object.values(prods).filter(function(x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    if (related.length === 0 && window.__baData) {
      related = Object.values(window.__baData).map(function(x) { return x.a; }).filter(function(x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    }

    var wa = (S.info && S.info.whatsapp) ? S.info.whatsapp.replace(/\D/g, '') : '2250787619717';
    var tel = String(p.phone || '').replace(/\D/g, ''); if (tel.length === 10) tel = '225' + tel; if (tel) wa = tel;
    var waMsg = encodeURIComponent('Bonjour, je suis intéressé par : ' + p.name + ' (' + fmt(p.price) + ' F)');

    var imgSrc = p.img || p.image || p.photo || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    var pid = esc(p.id);

    var html = `
      <button class="pm-close" onclick="closePm()">✕</button>
      <img class="pm-img" src="${esc(imgSrc)}" alt="${esc(p.name)}">
      <div class="pm-name">${esc(p.name)}</div>
      <div class="pm-price">${fmt(p.price)} F CFA</div>
      ${p.shopName ? '<div class="pm-shop">🏪 ' + esc(p.shopName) + '</div>' : ''}
      <button class="pm-btn pm-add" onclick="addCart('${pid}'); closePm();">🛒 Ajouter au panier</button>
      <a href="https://wa.me/${wa}?text=${waMsg}" target="_blank" class="pm-btn pm-wa">📲 Commander sur WhatsApp</a>
      <button class="pm-btn pm-share" onclick="pmShare('${pid}')">📤 Partager (photo + infos)</button>
    `;

    if (related.length) {
      html += `<div class="pm-related"><div class="pm-rel-title">👀 Vous aimerez aussi</div><div class="pm-rel-grid">`;
      related.forEach(function(r) {
        html += `<div class="pm-rel-card" onclick="openPm('${esc(r.id)}')"><img src="${esc(r.img || '')}" alt=""><b>${esc(r.name)}</b><span>${fmt(r.price)} F</span></div>`;
      });
      html += `</div></div>`;
    }

    document.getElementById('pmContent').innerHTML = html;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
  }
  window.openPm = openProduct;

  // Partage avec photo + infos, lien direct vers l'article (aperçu complet sur WhatsApp, Facebook, Telegram)
  window.pmShare = function(id) {
    var p = find(id); if (!p) return;
    var shop = p.shopName || 'BOUBA STOR';
    var o = {
      mode: 'card', id: id,
      link: window.lienProduit ? window.lienProduit(id) : location.origin + '/api/p?id=' + encodeURIComponent(id),
      card: { name: p.name, price: p.price, shop: shop, cat: p.cat },
      title: p.name,
      text: '💝 ' + p.name + ' — ' + fmt(p.price) + ' F\n' + shop + ' · Livraison 24h à Abidjan'
    };
    if (window.shareRich) window.shareRich(o);
    else if (navigator.share) navigator.share({ title: o.title, text: o.text, url: o.link }).catch(function() {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(o.text + '\n' + o.link), '_blank');
  };
  window.pmFind = find;

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.card');
    if (!card) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    var id = card.getAttribute('data-pid');
    if (id) {
      e.preventDefault();
      e.stopPropagation();
      openProduct(id);
    }
  }, true);
})();
