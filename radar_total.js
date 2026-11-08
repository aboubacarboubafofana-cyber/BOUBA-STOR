/* =============================================================
   RADAR TOTAL — Surveillance · Vitalité · Auto-réparation · SEO
   ============================================================= */
(function () {
  'use strict';

  var SITE_URL = 'https://bouba-stor.vercel.app';
  var TAB_ID = 'radartotal';
  var TAB_LABEL = '🛰️ Radar Total';
  var bound = false;
  var ERRORS = [];
  var BROKEN_IMGS = [];

  /* Capture d'erreurs */
  window.addEventListener('error', function (e) {
     if (e.message === 'Script error.' || !e.message) return;
    ERRORS.push({ t: Date.now(), msg: String(e.message || 'Erreur').slice(0, 200) });
    if (ERRORS.length > 60) ERRORS.shift();
  });
  window.addEventListener('unhandledrejection', function (e) {
    ERRORS.push({ t: Date.now(), msg: 'Promise: ' + String(e.reason || '').slice(0, 180) });
    if (ERRORS.length > 60) ERRORS.shift();
  });
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.src && t.src.indexOf('data:') !== 0) {
      if (BROKEN_IMGS.indexOf(t.src) < 0) BROKEN_IMGS.push(t.src);
      if (BROKEN_IMGS.length > 80) BROKEN_IMGS.shift();
    }
  }, true);

  function getS() { try { return S; } catch (e) { return {}; } }
  function getOutbox() { try { return outbox; } catch (e) { return []; } }
  function getProds() {
    try { return Object.values(getS().products || {}).filter(function (p) { return p && p.id; }); }
    catch (e) { return []; }
  }
  function getOrders() {
    try { return Object.values(getS().orders || {}).filter(function (o) { return o && o.id; }); }
    catch (e) { return []; }
  }
  function getInfo() { try { return getS().info || {}; } catch (e) { return {}; } }
  function callToast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function callWrite(p, v) { try { if (typeof window.write === 'function') window.write(p, v); } catch (e) {} }
  function callRenderAll() { try { if (typeof window.renderAll === 'function') window.renderAll(); } catch (e) {} }
  function callFlush() { try { if (typeof window.flush === 'function') window.flush(); } catch (e) {} }

  function safeStr(s) { return String(s == null ? '' : s); }
  function escH(s) {
    return safeStr(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtN(n) { return Number(n || 0).toLocaleString('fr-FR'); }

  function audit() {
    var prods = getProds(), orders = getOrders(), info = getInfo(), outbox = getOutbox();
    var noName = prods.filter(function (p) { return !safeStr(p.name).trim(); });
    var noPrice = prods.filter(function (p) { return !p.price || p.price <= 0; });
    var noImg = prods.filter(function (p) { return !p.img; });
    var noCat = prods.filter(function (p) { return !safeStr(p.cat).trim(); });
    var badImg = prods.filter(function (p) { return p.img && BROKEN_IMGS.indexOf(p.img) >= 0; });
    var outOfStock = prods.filter(function (p) { return p.stock === false; });
    var pending = orders.filter(function (o) { return o.status === 'en attente'; });
    var noPhone = orders.filter(function (o) { return !o.phone; });
    var seo = computeSeo(prods);
    var net = true; try { net = !!online; } catch (e) { net = navigator.onLine; }
    var loadTime = 0;
    try { var nav = performance.getEntriesByType('navigation')[0]; if (nav) loadTime = Math.round(nav.duration); } catch (e) {}
    var storageKB = 0;
    try {
      var total = 0;
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('b_') === 0 || k.indexOf('bouba') === 0) total += (localStorage[k] || '').length * 2;
      });
      storageKB = Math.round(total / 1024);
    } catch (e) {}
    var score = 100;
    score -= noName.length * 5; score -= noPrice.length * 5;
    score -= noImg.length * 3; score -= badImg.length * 4;
    score -= noCat.length * 1; score -= ERRORS.length * 3;
    if (!net) score -= 25;
    if (outbox.length) score -= Math.min(15, outbox.length * 2);
    if (storageKB > 4000) score -= 15; else if (storageKB > 2000) score -= 5;
    if (seo < 50) score -= 10; else if (seo < 80) score -= 5;
    score = Math.max(0, Math.min(100, Math.round(score)));
    return {
      prods: prods, orders: orders, outbox: outbox, info: info,
      issues: {
        noName: noName, noPrice: noPrice, noImg: noImg, noCat: noCat,
        badImg: badImg, outOfStock: outOfStock,
        pending: pending, noPhone: noPhone,
        net: net, queue: outbox.length, loadTime: loadTime,
        storageKB: storageKB, errCount: ERRORS.length, seo: seo
      },
      score: score
    };
  }

  function computeSeo(prods) {
    var s = 0;
    if (document.querySelector('meta[name="description"]')) s += 20;
    if (document.querySelector('meta[property="og:title"]')) s += 10;
    if (document.querySelector('meta[property="og:image"]')) s += 10;
    if (document.querySelector('link[rel="manifest"]')) s += 10;
    if (document.querySelector('script[type="application/ld+json"]')) s += 20;
    if (prods.length) {
      var full = prods.filter(function (p) { return p.name && p.price > 0 && p.img; }).length;
      s += Math.round((full / prods.length) * 30);
    }
    return Math.min(100, s);
  }
  function repair() {
  var logs = [], S = getS();
  if (S.products) {
    var fixed = 0;
    Object.keys(S.products).forEach(function (id) {
      var p = S.products[id];
      if (p && p.id && typeof p.stock === 'undefined') { p.stock = true; fixed++; }
    });
    if (fixed) logs.push('✅ ' + fixed + ' produit(s) : champ stock corrigé');
  }
  var ob = getOutbox();
  if (ob.length) { callFlush(); logs.push('⏳ ' + ob.length + ' écriture(s) relancée(s)'); }
  if (S.orders) {
    var cutoff = Date.now() - 90 * 86400000, old = 0;
    Object.keys(S.orders).forEach(function (id) {
      var o = S.orders[id];
      if (o && o.date && o.date < cutoff && o.status === 'livrée') {
        callWrite('orders/' + id, null); old++;
      }
    });
    if (old) logs.push('🧹 ' + old + ' ancienne(s) commande(s) nettoyée(s)');
  }
  callRenderAll();
  return logs;
}

function prodJsonLd(p) {
  return {
    '@context': 'https://schema.org/', '@type': 'Product',
    'name': p.name || 'Article',
    'image': p.img || (SITE_URL + '/icon-512.png'),
    'description': (p.name || '') + ' — ' + (p.cat || 'Article') + ' chez BOUBA STOR. Livraison Abidjan 24H.',
    'sku': p.id,
    'brand': { '@type': 'Brand', 'name': 'BOUBA STOR' },
    'offers': {
      '@type': 'Offer',
      'url': SITE_URL + '/#p-' + p.id,
      'priceCurrency': 'XOF',
      'price': p.price || 0,
      'availability': p.stock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      'itemCondition': 'https://schema.org/NewCondition',
      'seller': { '@type': 'Organization', 'name': 'BOUBA STOR' }
    }
  };
}

function genSitemap() {
  var prods = getProds(), today = new Date().toISOString().slice(0, 10);
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url><loc>' + SITE_URL + '/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>' + today + '</lastmod></url>\n';
  prods.forEach(function (p) {
    xml += '  <url><loc>' + SITE_URL + '/#p-' + encodeURIComponent(p.id) + '</loc>';
    xml += '<changefreq>weekly</changefreq><priority>0.8</priority>';
    if (p.date) xml += '<lastmod>' + new Date(p.date).toISOString().slice(0, 10) + '</lastmod>';
    xml += '</url>\n';
  });
  return xml + '</urlset>';
}

function genRobots() {
  return 'User-agent: *\nAllow: /\nSitemap: ' + SITE_URL + '/sitemap.xml\n';
}

function genRss() {
  var prods = getProds().sort(function (a, b) { return (b.date || 0) - (a.date || 0); }).slice(0, 50);
  var rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n';
  rss += '<title>BOUBA STOR</title><link>' + SITE_URL + '</link>\n';
  rss += '<description>Boutique en ligne en Côte d\'Ivoire</description>\n';
  rss += '<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>\n';
  prods.forEach(function (p) {
    rss += '<item><title>' + escH(p.name || 'Article') + '</title>';
    rss += '<link>' + SITE_URL + '/#p-' + p.id + '</link>';
    rss += '<description>' + escH((p.name || '') + ' — ' + fmtN(p.price) + ' F') + '</description>';
    rss += '<pubDate>' + new Date(p.date || Date.now()).toUTCString() + '</pubDate></item>\n';
  });
  return rss + '</channel></rss>';
}

function csvE(s) { s = String(s == null ? '' : s); if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; }

function genMerchant() {
  var rows = ['id,title,description,link,image_link,price,availability,condition,brand'];
  getProds().forEach(function (p) {
    rows.push([
      csvE(p.id), csvE(p.name || 'Article'),
      csvE((p.name || '') + ' — ' + (p.cat || 'Article') + ' chez BOUBA STOR. Livraison Abidjan 24H.'),
      SITE_URL + '/#p-' + p.id, p.img || (SITE_URL + '/icon-512.png'),
      (p.price || 0) + ' XOF',
      p.stock === false ? 'out of stock' : 'in stock',
      'new', 'BOUBA STOR'
    ].join(','));
  });
  return rows.join('\n');
}

function genFullJsonLd() {
  var prods = getProds(), info = getInfo();
  var shop = {
    '@context': 'https://schema.org/', '@type': 'Store',
    'name': info.name || 'BOUBA STOR',
    'image': info.logo || (SITE_URL + '/icon-512.png'),
    'description': 'Boutique en ligne en Côte d\'Ivoire. Livraison Abidjan 24H.',
    'address': { '@type': 'PostalAddress', 'addressLocality': 'Abidjan', 'addressCountry': 'CI' },
    'url': SITE_URL, 'priceRange': '5000 - 50000 XOF'
  };
  var list = {
    '@context': 'https://schema.org/', '@type': 'ItemList',
    'numberOfItems': prods.length,
    'itemListElement': prods.slice(0, 100).map(function (p, i) {
      return { '@type': 'ListItem', 'position': i + 1, 'item': prodJsonLd(p) };
    })
  };
  return { shop: shop, list: list, prods: prods.map(prodJsonLd) };
}
  function row(label, value) {
  return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #222;font-size:13px">' +
    '<span style="color:#aaa">' + label + '</span><span style="color:#fff;font-weight:700">' + value + '</span></div>';
}
function issue(label, n, lvl) {
  var color = n === 0 ? '#25D366' : lvl === 'err' ? '#ff4444' : '#ffd700';
  var icon = n === 0 ? '✅' : lvl === 'err' ? '❌' : '⚠️';
  return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #222;font-size:13px">' +
    '<span style="color:#ddd">' + icon + ' ' + label + '</span><span style="color:' + color + ';font-weight:700">' + n + '</span></div>';
}

function renderTotal(body) {
  var A = audit(), I = A.issues;
  var color = A.score >= 80 ? '#25D366' : A.score >= 50 ? '#ffd700' : '#ff4444';
  var h = '<div class="ctrl" style="text-align:center">';
  h += '<h3 style="color:gold;margin-bottom:6px">🛰️ Radar Total</h3>';
  h += '<div style="font-size:48px;font-weight:900;color:' + color + '">' + A.score +
       '<span style="font-size:20px;color:#888">/100</span></div>';
  h += '<div style="color:#aaa;font-size:12px">Santé globale du site</div></div>';

  h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">💓 Vitalité</h4>';
  h += row('🌐 Connexion', I.net ? '🟢 En ligne' : '🔴 Hors ligne');
  h += row('📤 File d\'attente', I.queue > 0 ? '🟠 ' + I.queue : '🟢 0');
  h += row('⚡ Chargement', I.loadTime ? I.loadTime + ' ms' : '—');
  h += row('💾 Stockage local', I.storageKB + ' Ko');
  h += row('⚠️ Erreurs JS', I.errCount > 0 ? '🟠 ' + I.errCount : '🟢 0');
  h += '</div>';

  h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">🔍 Problèmes détectés</h4>';
  h += issue('Articles sans nom', I.noName.length, 'err');
  h += issue('Articles sans prix', I.noPrice.length, 'err');
  h += issue('Articles sans image', I.noImg.length, 'warn');
  h += issue('Articles sans catégorie', I.noCat.length, 'warn');
  h += issue('Images cassées (produits)', I.badImg.length, 'err');
  h += issue('Articles épuisés', I.outOfStock.length, 'ok');
  h += issue('Commandes en attente', I.pending.length, 'ok');
  h += issue('Commandes sans téléphone', I.noPhone.length, 'warn');
  h += issue('Images cassées (site)', BROKEN_IMGS.length, 'warn');
  h += '</div>';

  h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">🛠️ Auto-réparation</h4>';
  h += '<button class="gold" onclick="RADAR_TOTAL.repairNow()">🛠️ Réparer maintenant</button>';
  h += '<div id="rt-log" style="margin-top:8px;font-size:12px;color:#aaa"></div></div>';

  h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">🚀 SEO & Viralité</h4>';
  h += row('Score SEO', I.seo + '/100');
  h += row('Articles publiés', A.prods.length);
  h += '<button class="gold" onclick="RADAR_TOTAL.dlSitemap()" style="margin-top:8px">📥 sitemap.xml</button>';
  h += '<button class="gold" onclick="RADAR_TOTAL.dlRobots()" style="margin-top:6px">📥 robots.txt</button>';
  h += '<button class="gold" onclick="RADAR_TOTAL.dlRss()" style="margin-top:6px">📥 flux RSS</button>';
  h += '<button class="gold" onclick="RADAR_TOTAL.dlMerchant()" style="margin-top:6px">📥 Google Merchant (CSV)</button>';
  h += '<button class="gold" onclick="RADAR_TOTAL.injectLd()" style="margin-top:6px">💉 Injecter JSON-LD</button>';
  h += '<button class="ghost" onclick="RADAR_TOTAL.copyLd()" style="margin-top:6px">📋 Copier JSON-LD</button></div>';

  h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">📖 Guide viral</h4>';
  h += '<div style="font-size:12px;color:#ddd;line-height:1.7">' +
    '1️⃣ Télécharge <b>sitemap.xml</b> + <b>robots.txt</b> → racine du site<br>' +
    '2️⃣ Va sur <b>search.google.com/search-console</b><br>' +
    '3️⃣ Valide le site + soumets le sitemap<br>' +
    '4️⃣ Va sur <b>merchants.google.com</b> → importe le CSV<br>' +
    '5️⃣ Partage tes articles sur WhatsApp, Facebook, TikTok<br>' +
    '6️⃣ Publie régulièrement de nouveaux articles<br></div></div>';

  if (ERRORS.length) {
    h += '<div class="ctrl"><h4 style="color:gold;margin-bottom:6px">📋 Journal (' + ERRORS.length + ')</h4>';
    h += ERRORS.slice(-8).reverse().map(function (e) {
      return '<div style="font-size:11px;color:#ff8888;padding:4px;background:#1a0000;border-radius:4px;margin-bottom:4px">' +
        new Date(e.t).toLocaleTimeString('fr-FR') + ' — ' + escH(e.msg) + '</div>';
    }).join('');
    h += '<button class="ghost" onclick="RADAR_TOTAL.clearErrors()" style="margin-top:6px">🧹 Vider</button></div>';
  }
  body.innerHTML = h;
}
    function download(filename, content, mime) {
    try {
      var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 800);
    } catch (e) { callToast('Erreur téléchargement'); }
  }

  window.RADAR_TOTAL = {
    audit: audit,
    repairNow: function () {
      var log = document.getElementById('rt-log');
      if (log) log.textContent = '⏳ En cours...';
      setTimeout(function () {
        var msgs = repair();
        if (log) log.innerHTML = msgs.length ? msgs.join('<br>') : '✅ Rien à réparer';
        callToast('🛠️ Réparation terminée');
      }, 150);
    },
    dlSitemap: function () { download('sitemap.xml', genSitemap(), 'application/xml'); callToast('✅ sitemap.xml'); },
    dlRobots: function () { download('robots.txt', genRobots()); callToast('✅ robots.txt'); },
    dlRss: function () { download('feed.xml', genRss(), 'application/rss+xml'); callToast('✅ feed.xml'); },
    dlMerchant: function () { download('google-merchant.csv', genMerchant(), 'text/csv'); callToast('✅ CSV'); },
    injectLd: function () {
      try {
        var d = genFullJsonLd();
        document.querySelectorAll('script[data-radar-ld]').forEach(function (s) { s.remove(); });
        [d.shop, d.list].forEach(function (obj) {
          var s = document.createElement('script');
          s.type = 'application/ld+json';
          s.setAttribute('data-radar-ld', '1');
          s.textContent = JSON.stringify(obj);
          document.head.appendChild(s);
        });
        try { localStorage.setItem('radar_jsonld', '1'); } catch (e) {}
        callToast('💉 JSON-LD injecté (' + d.prods.length + ' produits)');
      } catch (e) { callToast('Erreur JSON-LD'); }
    },
    copyLd: function () {
      var d = genFullJsonLd();
      var json = JSON.stringify([d.shop, d.list].concat(d.prods.slice(0, 20)), null, 2);
      if (navigator.clipboard) navigator.clipboard.writeText(json).then(function () { callToast('📋 JSON-LD copié'); });
      else callToast('Copie non supportée');
    },
    clearErrors: function () {
      ERRORS.length = 0; BROKEN_IMGS.length = 0;
      var body = document.getElementById('adminBody');
      if (body) renderTotal(body);
      callToast('🧹 Journal vidé');
    }
  };

  function tryBind() {
    if (typeof window.setTab !== 'function' || typeof window.renderAdmin !== 'function') {
      return setTimeout(tryBind, 300);
    }
    var tabsReady = false;
    try { tabsReady = typeof TABS !== 'undefined'; } catch (e) {}
    if (!tabsReady) return setTimeout(tryBind, 300);
    if (bound) return;
    bound = true;

    var found = false;
    for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === TAB_ID) { found = true; break; }
    if (!found) TABS.push([TAB_ID, TAB_LABEL]);

    var _origSetTab = window.setTab;
    var _origRender = window.renderAdmin;

    window.renderAdmin = function () {
      var curTab = 'stats';
      try { curTab = tab; } catch (e) {}
      if (curTab === TAB_ID) {
        var tabsEl = document.getElementById('tabs');
        if (tabsEl) {
          tabsEl.innerHTML = TABS.map(function (t) {
            return '<button class="' + (t[0] === curTab ? 'on' : '') +
              '" onclick="setTab(\'' + t[0] + '\')">' + t[1] + '</button>';
          }).join('');
        }
        var body = document.getElementById('adminBody');
        if (body) renderTotal(body);
        return;
      }
      return _origRender.apply(this, arguments);
    };

    window.setTab = function (t) {
      if (t === TAB_ID) {
        try { tab = TAB_ID; } catch (e) {}
        return window.renderAdmin();
      }
      return _origSetTab.apply(this, arguments);
    };

    console.log('🛰️ Radar Total prêt');
  }

  tryBind();

  try {
    if (localStorage.getItem('radar_jsonld') === '1') {
      setTimeout(function () { window.RADAR_TOTAL.injectLd(); }, 2500);
    }
  } catch (e) {}

  setInterval(function () {
    try {
      var curTab = 'stats';
      try { curTab = tab; } catch (e) {}
      if (curTab === TAB_ID) {
        var ap = document.getElementById('adminPage');
        var body = document.getElementById('adminBody');
        if (ap && ap.classList.contains('active') && body) renderTotal(body);
      }
    } catch (e) {}
  }, 30000);

})();
