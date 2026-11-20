/* BOUBA STOR : ouvre directement l'article d'un lien partagé (?a=ID) et fournit des liens de partage toujours justes */
(function () {
  var ORIGIN = location.origin;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F'; };
  var box = null;

  window.lienProduit = function (id) { return ORIGIN + '/api/p?id=' + encodeURIComponent(id); };
  window.lienProduitParNom = function (nom) {
    try {
      var P = (typeof S !== 'undefined' && S && S.products) || {}, n = String(nom || '').trim().toLowerCase();
      for (var k in P) if (P[k] && String(P[k].name || '').trim().toLowerCase() === n) return window.lienProduit(k);
    } catch (e) {}
    return nom ? ORIGIN + '/api/p?n=' + encodeURIComponent(String(nom).trim().slice(0, 120)) : ORIGIN + '/';
  };
  function tell(m) { try { toast(m); } catch (e) {} }
  function close() {
    if (box) { box.remove(); box = null; }
    try { var u = new URL(location.href); u.searchParams.delete('a'); u.searchParams.delete('src'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
  }
  function show(a) {
    if (box) box.remove();
    var inCart = false, wa = '2250787619717';
    try { inCart = typeof addCart === 'function' && typeof S !== 'undefined' && S.products && S.products[a.id]; } catch (e) {}
    try { if (typeof iaWa === 'function') wa = iaWa() || wa; } catch (e) {}
    var tel = String(a.phone || '').replace(/\D/g, ''); if (tel.length === 10) tel = '225' + tel; if (tel) wa = tel;
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.94);overflow:auto;padding:16px;font-family:Arial,sans-serif;color:#fff';
    box.innerHTML = '<div style="max-width:480px;margin:0 auto"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="color:#ffd700">BOUBA STOR</b><button id="dlX" style="background:#222;border:0;color:#fff;width:34px;height:34px;border-radius:50%;font-size:16px">✕</button></div>'
      + '<img src="/api/img?id=' + encodeURIComponent(a.id) + '" alt="" style="width:100%;border-radius:14px;border:1px solid #ffd700;background:#111;aspect-ratio:1/1;object-fit:contain">'
      + '<h2 style="margin:14px 0 4px;font-size:22px">' + esc(a.name) + '</h2><div style="color:#ffd700;font-size:26px;font-weight:800">' + money(a.price) + '</div>'
      + '<div style="color:#bbb;margin:4px 0 14px">Vendu par ' + esc(a.shopName || 'BOUBA STOR') + (a.cat ? ' · ' + esc(a.cat) : '') + '</div>'
      + (a.desc ? '<p style="color:#ddd;margin-bottom:14px">' + esc(a.desc) + '</p>' : '')
      + (inCart ? '<button id="dlCart" class="gold" style="width:100%;padding:13px;background:gold;border:0;border-radius:10px;font-weight:900;margin-bottom:8px">🛒 Ajouter au panier</button>' : '')
      + '<a id="dlWa" target="_blank" href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par : ' + a.name + ' (' + money(a.price) + ')') + '" style="display:block;text-align:center;background:#25D366;color:#fff;font-weight:800;padding:13px;border-radius:10px;text-decoration:none;margin-bottom:8px">💬 Commander sur WhatsApp</a>'
      + '<button id="dlShare" style="width:100%;padding:13px;background:#222;color:#ffd700;border:1px solid #ffd700;border-radius:10px;font-weight:800;margin-bottom:8px">📤 Partager</button>'
      + '<button id="dlShop" style="width:100%;padding:13px;background:transparent;color:#fff;border:1px solid #555;border-radius:10px">Voir toute la boutique</button></div>';
    document.body.appendChild(box);
    box.querySelector('#dlX').onclick = close; box.querySelector('#dlShop').onclick = close;
    var c = box.querySelector('#dlCart'); if (c) c.onclick = function () { try { addCart(a.id); tell('🛒 Ajouté au panier'); } catch (e) {} };
    box.querySelector('#dlShare').onclick = function () {
      if (typeof shareRich !== 'function') return;
      shareRich({ mode: 'card', id: a.id, link: window.lienProduit(a.id), card: { name: a.name, price: a.price, shop: a.shopName, cat: a.cat }, title: a.name, text: '💝 ' + a.name + ' — ' + money(a.price) + '\n' + (a.shopName || 'BOUBA STOR') + ' · Livraison 24h à Abidjan' });
    };
  }
  window.openArticle = function (id) {
    id = String(id || '').replace(/[^\w-]/g, ''); if (!id) return;
    fetch('/api/p?id=' + encodeURIComponent(id) + '&json=1').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.ok) show(d.article); else tell('Article introuvable : voici la boutique'); })
      .catch(function () { tell('Connexion lente : réessayez'); });
  };
  /* --- Lien partagé (?a=ID) : fenêtre produit de l'appli si l'article est connu, sinon fiche complète du serveur --- */
  var id = new URLSearchParams(location.search).get('a');
  function tryPm(i, n) {
    var known = false;
    try { known = !!(window.pmFind && window.pmFind(i)); } catch (e) {}
    if (known && typeof window.openPm === 'function') return window.openPm(i);
    if (n < 10) return setTimeout(function () { tryPm(i, n + 1); }, 400);
    window.openArticle(i);
  }
  if (id) { id = id.replace(/[^\w-]/g, ''); var go = function () { setTimeout(function () { tryPm(id, 0); }, 400); }; document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go(); }
})();
