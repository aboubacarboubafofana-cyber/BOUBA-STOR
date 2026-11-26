/* ============================================================
   🐍 HYDRE-9 — le robot de contrôle de BOUBA STOR
   Résumé • Articles (audit) • Commandes (chiffres) • Images • Texte • Outils
   Lecture seule sur tes données (aucune suppression). Exports CSV / JSON.
   À la racine du dépôt, à côté de index.html.
   ============================================================ */
(function () {
  'use strict';
  if (window.Hydre9) return;

  var ST = ['en attente', 'confirmée', 'livrée', 'annulée'];
  var errors = [];
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName) return;
    errors.push(new Date().toLocaleTimeString('fr-FR') + ' ' + String(e.message || 'erreur').slice(0, 140));
    if (errors.length > 25) errors.shift();
  });

  var money = function (n) { return Number(n || 0).toLocaleString('fr-FR'); };
  var norm = function (s) { return String(s || '').trim().toLowerCase(); };
  function data() {
    var s = {}; try { s = (typeof S !== 'undefined' && S) || {}; } catch (e) {}
    return {
      prods: Object.keys(s.products || {}).map(function (k) { var p = s.products[k]; return p && Object.assign({ id: k }, p); }).filter(Boolean),
      orders: Object.keys(s.orders || {}).map(function (k) { var o = s.orders[k]; return o && Object.assign({ id: k }, o); }).filter(Boolean),
      info: s.info || {}
    };
  }

  /* ---------- audit (fonctions pures, testables) ---------- */
  function audit(d) {
    d = d || data();
    var cnt = {}, dup = {};
    d.prods.forEach(function (p) { var n = norm(p.name); if (n) cnt[n] = (cnt[n] || 0) + 1; });
    Object.keys(cnt).forEach(function (n) { if (cnt[n] > 1) dup[n] = cnt[n]; });
    var flags = {}, sum = { total: d.prods.length, sansPhoto: 0, sansPrix: 0, sansNom: 0, horsStock: 0, doublons: 0, sansCat: 0 };
    d.prods.forEach(function (p) {
      var f = [];
      if (!p.img) { f.push('photo'); sum.sansPhoto++; }
      if (!(+p.price > 0)) { f.push('prix'); sum.sansPrix++; }
      if (!norm(p.name)) { f.push('nom'); sum.sansNom++; }
      if (p.stock === false) { f.push('stock'); sum.horsStock++; }
      if (dup[norm(p.name)]) { f.push('doublon'); sum.doublons++; }
      if (!norm(p.cat)) { f.push('cat'); sum.sansCat++; }
      flags[p.id] = f;
    });
    var by = {}, ca = { livree: 0, attente: 0, total: 0 }, top = {}, now = Date.now(), j7 = 0, today = 0, d0 = new Date(); d0.setHours(0, 0, 0, 0);
    ST.forEach(function (s) { by[s] = { n: 0, sum: 0 }; });
    d.orders.forEach(function (o) {
      var s = ST.indexOf(o.status) >= 0 ? o.status : 'en attente', t = +o.total || 0;
      by[s].n++; by[s].sum += t;
      if (s !== 'annulée') {
        ca.total += t; if (s === 'livrée') ca.livree += t; else ca.attente += t;
        if (+o.date >= now - 7 * 864e5) j7 += t;
        if (+o.date >= d0.getTime()) today += t;
        (o.items || []).forEach(function (i) { var k = String(i.name || '?'); top[k] = (top[k] || 0) + (+i.qty || 1); });
      }
    });
    var tops = Object.keys(top).map(function (k) { return [k, top[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    return { sum: sum, flags: flags, by: by, ca: ca, j7: j7, today: today, tops: tops, nOrders: d.orders.length };
  }
  function csvCell(v) { v = String(v == null ? '' : v); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCsv(rows) { return '\ufeff' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n'); }
  function csvProducts(d) {
    return toCsv([['id', 'nom', 'prix', 'categorie', 'stock', 'photo (oui/non)', 'date']].concat(d.prods.map(function (p) {
      return [p.id, p.name, p.price, p.cat, p.stock === false ? 'non' : 'oui', p.img ? 'oui' : 'non', p.date ? new Date(+p.date).toLocaleString('fr-FR') : ''];
    })));
  }
  function csvOrders(d) {
    return toCsv([['commande', 'date', 'statut', 'client', 'telephone', 'ville', 'articles', 'total']].concat(d.orders.map(function (o) {
      return [o.id, o.date ? new Date(+o.date).toLocaleString('fr-FR') : '', o.status, o.name, o.phone, o.city || o.quartier || '', (o.items || []).map(function (i) { return i.name + ' x' + (i.qty || 1); }).join(', '), o.total];
    })));
  }

  /* ---------- petites briques d'interface ---------- */
  function el(t, css, txt) { var e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  var C = { bg: '#0d1117', card: '#161b22', line: '#30363d', pur: '#a371f7', blue: '#58a6ff', txt: '#c9d1d9', ok: '#3fb950', warn: '#d29922', ko: '#f85149' };
  function btn(txt, fn, on) {
    var b = el('button', 'padding:9px 12px;border-radius:10px;border:1px solid ' + C.pur + ';font-weight:800;font-size:13px;margin:3px 4px 3px 0;cursor:pointer;' + (on ? 'background:' + C.pur + ';color:#fff' : 'background:#0d1117;color:#d2b8ff'), txt);
    b.type = 'button'; b.onclick = fn; return b;
  }
  function box(title) { var d = el('div', 'background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:10px;padding:10px;margin-bottom:10px'); if (title) d.appendChild(el('div', 'color:' + C.blue + ';font-weight:800;margin-bottom:6px', title)); return d; }
  function line(a, b, col) { var r = el('div', 'display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid #21262d;font-size:13px'); r.appendChild(el('span', '', a)); r.appendChild(el('b', col ? 'color:' + col : '', b)); return r; }
  function copy(t, say) { var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject(); p.then(function () { say('✅ Copié'); }).catch(function () { say('Copie impossible'); }); }
  function download(name, text, mime) {
    var a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function linkOf(id) { return (window.BoubaLinks ? window.BoubaLinks.make('article', id) : location.origin + '/api/p?id=' + encodeURIComponent(id)); }

  /* ---------- fenêtre ---------- */
  var root, body, msg, tab = 'resume', state = { filter: 'tous', q: '', status: 'tous', serverPhoto: {}, checking: false };
  function say(t) { if (msg) msg.textContent = t; }
  function open() {
    if (root) root.remove();
    root = el('div', 'position:fixed;inset:0;z-index:2147483100;background:' + C.bg + ';color:#fff;overflow-y:auto;padding:12px;box-sizing:border-box;font-family:system-ui,sans-serif');
    var top = el('div', 'display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid ' + C.pur + ';padding-bottom:8px;margin-bottom:10px');
    top.appendChild(el('h2', 'margin:0;color:' + C.pur + ';font-size:20px', '🐍 HYDRE-9'));
    var x = el('button', 'background:#ff4444;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:800;font-size:15px', '✕ Fermer'); x.type = 'button'; x.onclick = function () { root.remove(); root = null; }; top.appendChild(x);
    var tabs = el('div', 'display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;padding-bottom:4px');
    [['resume', '📊 Résumé'], ['articles', '📦 Articles'], ['commandes', '🧾 Commandes'], ['images', '📷 Images'], ['texte', '📝 Texte'], ['outils', '🧰 Outils']].forEach(function (t) {
      var b = btn(t[1], function () { tab = t[0]; draw(); }, tab === t[0]); b.dataset.t = t[0]; b.style.whiteSpace = 'nowrap'; tabs.appendChild(b);
    });
    msg = el('div', 'min-height:18px;color:' + C.ok + ';font-size:13px;margin-bottom:6px');
    body = el('div');
    root.appendChild(top); root.appendChild(tabs); root.appendChild(msg); root.appendChild(body);
    document.body.appendChild(root); root.__tabs = tabs; draw();
  }
  function draw() {
    if (!root) return;
    [].forEach.call(root.__tabs.children, function (b) { var on = b.dataset.t === tab; b.style.background = on ? C.pur : '#0d1117'; b.style.color = on ? '#fff' : '#d2b8ff'; });
    body.textContent = ''; say('');
    ({ resume: vResume, articles: vArticles, commandes: vCommandes, images: vImages, texte: vTexte, outils: vOutils })[tab]();
  }

  /* ---------- 📊 Résumé ---------- */
  function vResume() {
    var d = data(), a = audit(d), s = a.sum;
    var b1 = box('📦 Articles'); b1.appendChild(line('Total', s.total));
    [['Sans photo (dans la liste locale)', s.sansPhoto, 'photo'], ['Sans prix ou prix à 0', s.sansPrix, 'prix'], ['Hors stock', s.horsStock, 'stock'], ['Noms en double', s.doublons, 'doublon'], ['Sans catégorie', s.sansCat, 'cat']].forEach(function (r) {
      var l = line(r[0], r[1], r[1] ? C.warn : C.ok); if (r[1]) { l.style.cursor = 'pointer'; l.onclick = function () { tab = 'articles'; state.filter = r[2]; draw(); }; } b1.appendChild(l);
    });
    body.appendChild(b1);
    var b2 = box('🧾 Commandes (' + a.nOrders + ')');
    ST.forEach(function (st) { b2.appendChild(line(st[0].toUpperCase() + st.slice(1), a.by[st].n + ' • ' + money(a.by[st].sum) + ' F')); });
    b2.appendChild(line('Aujourd’hui (hors annulées)', money(a.today) + ' F', C.ok)); b2.appendChild(line('7 derniers jours', money(a.j7) + ' F', C.ok)); b2.appendChild(line('Livré au total', money(a.ca.livree) + ' F', C.ok));
    body.appendChild(b2);
    var im = pageImages(), b3 = box('📷 Images de la page'); b3.appendChild(line('Au total', im.length)); b3.appendChild(line('Cassées / vides', im.filter(function (i) { return i.st !== 'ok' && i.st !== 'lourde'; }).length, C.warn)); b3.appendChild(line('Lourdes', im.filter(function (i) { return i.st === 'lourde'; }).length, C.warn));
    body.appendChild(b3);
    var b4 = box('🐞 Erreurs récentes'); if (errors.length) b4.appendChild(el('div', 'white-space:pre-wrap;font-size:12px;color:' + C.ko, errors.join('\n'))); else b4.appendChild(el('div', 'font-size:13px;color:' + C.ok, 'Aucune erreur enregistrée.'));
    body.appendChild(b4);
  }

  /* ---------- 📦 Articles ---------- */
  var FLT = [['tous', 'Tous'], ['photo', 'Sans photo'], ['prix', 'Sans prix'], ['stock', 'Hors stock'], ['doublon', 'Doublons'], ['cat', 'Sans catégorie']];
  function vArticles() {
    var d = data(), a = audit(d);
    var bar = el('div', 'margin-bottom:8px'); FLT.forEach(function (f) { var b = btn(f[1], function () { state.filter = f[0]; draw(); }, state.filter === f[0]); bar.appendChild(b); }); body.appendChild(bar);
    var q = el('input', 'width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid ' + C.line + ';background:#0d1117;color:#fff;margin-bottom:8px;font-size:14px'); q.placeholder = 'Rechercher un article…'; q.value = state.q;
    var list = el('div'); body.appendChild(q);
    var chk = btn('🔍 Vérifier sur le serveur les articles « sans photo »', function () { checkServer(d, a, list, rows); }); body.appendChild(chk); body.appendChild(list);
    function rows() {
      list.textContent = '';
      var qq = norm(q.value), n = 0;
      d.prods.forEach(function (p) {
        var f = a.flags[p.id] || [];
        if (state.filter !== 'tous' && f.indexOf(state.filter) < 0) return;
        if (qq && norm(p.name + ' ' + p.cat + ' ' + p.id).indexOf(qq) < 0) return;
        if (++n > 80) return;
        var r = el('div', 'background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:10px;padding:8px;margin-bottom:6px');
        r.appendChild(el('div', 'font-weight:800;font-size:14px', (p.name || '(sans nom)') + ' — ' + money(p.price) + ' F'));
        var sp = state.serverPhoto[p.id], tags = f.map(function (x) { return x === 'photo' ? (sp === 'ok' ? 'photo OK (serveur)' : sp === 'none' ? 'AUCUNE photo' : 'photo ?') : x; });
        r.appendChild(el('div', 'font-size:12px;color:' + (tags.length ? C.warn : C.ok) + ';margin:3px 0', (p.cat || '—') + ' • ' + (tags.length ? tags.join(', ') : 'OK') + ' • ' + p.id));
        r.appendChild(btn('🔗 Lien', function () { copy(linkOf(p.id), say); }));
        if (typeof window.shareProd === 'function') r.appendChild(btn('📤 Partager', function () { window.shareProd(p.id); }));
        list.appendChild(r);
      });
      if (!n) list.appendChild(el('div', 'color:#8b949e;padding:10px', 'Aucun article dans ce filtre.'));
      else if (n > 80) list.appendChild(el('div', 'color:#8b949e;padding:6px;font-size:12px', '… ' + (n - 80) + ' autres (affine la recherche)'));
    }
    q.oninput = function () { state.q = q.value; rows(); }; rows();
  }
  async function checkServer(d, a, list, redraw) {
    if (state.checking) return; state.checking = true;
    var todo = d.prods.filter(function (p) { return (a.flags[p.id] || []).indexOf('photo') >= 0 && !state.serverPhoto[p.id]; }), done = 0, k = 0;
    async function worker() {
      while (k < todo.length && root) {
        var p = todo[k++];
        try {
          var c = new AbortController(), t = setTimeout(function () { c.abort(); }, 8000);
          var r = await fetch('/api/img?id=' + encodeURIComponent(p.id), { method: 'HEAD', signal: c.signal, cache: 'no-store' }); clearTimeout(t);
          state.serverPhoto[p.id] = r.ok && /image/.test(r.headers.get('content-type') || '') && (r.url || '').indexOf('icon-') < 0 ? 'ok' : 'none';
        } catch (e) { state.serverPhoto[p.id] = 'err'; }
        if (++done % 5 === 0) say('Vérification : ' + done + ' / ' + todo.length);
      }
    }
    say('Vérification de ' + todo.length + ' articles…');
    await Promise.all([worker(), worker(), worker()]);
    state.checking = false; var none = todo.filter(function (p) { return state.serverPhoto[p.id] === 'none'; }).length;
    say('✅ Terminé : ' + none + ' article(s) sans aucune photo sur le serveur, sur ' + todo.length + ' vérifiés.'); redraw();
  }

  /* ---------- 🧾 Commandes ---------- */
  function vCommandes() {
    var d = data(), a = audit(d);
    var bar = el('div', 'margin-bottom:8px'); ['tous'].concat(ST).forEach(function (s) { bar.appendChild(btn(s === 'tous' ? 'Toutes' : s[0].toUpperCase() + s.slice(1) + ' (' + a.by[s].n + ')', function () { state.status = s; draw(); }, state.status === s)); }); body.appendChild(bar);
    var bt = box('🏆 Les plus vendus (hors annulées)'); if (a.tops.length) a.tops.forEach(function (t) { bt.appendChild(line(t[0].slice(0, 38), '× ' + t[1])); }); else bt.appendChild(el('div', 'color:#8b949e;font-size:13px', 'Aucune vente pour l’instant.')); body.appendChild(bt);
    var list = d.orders.filter(function (o) { return state.status === 'tous' || (ST.indexOf(o.status) >= 0 ? o.status : 'en attente') === state.status; }).sort(function (x, y) { return (+y.date || 0) - (+x.date || 0); }).slice(0, 40);
    if (!list.length) body.appendChild(el('div', 'color:#8b949e;padding:10px', 'Aucune commande chargée.'));
    list.forEach(function (o) {
      var r = el('div', 'background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:10px;padding:8px;margin-bottom:6px');
      r.appendChild(el('div', 'font-weight:800;font-size:14px', '#' + o.id + ' • ' + money(o.total) + ' F • ' + String(o.status || '').toUpperCase()));
      r.appendChild(el('div', 'font-size:12px;color:#8b949e;margin:3px 0', (o.date ? new Date(+o.date).toLocaleString('fr-FR') : '') + ' • ' + (o.name || '') + ' • ' + (o.phone || '')));
      r.appendChild(el('div', 'font-size:12px;color:' + C.txt, (o.items || []).map(function (i) { return i.name + ' ×' + (i.qty || 1); }).join(', ')));
      var ph = String(o.phone || '').replace(/\D/g, ''); if (ph) { var w = btn('💬 WhatsApp', function () { window.open('https://wa.me/' + ph, '_blank', 'noopener'); }); r.appendChild(w); }
      body.appendChild(r);
    });
  }

  /* ---------- 📷 Images ---------- */
  function pageImages() {
    return [].map.call(document.images, function (im) {
      var s = im.getAttribute('src') || '', st = 'ok';
      if (!s || /\/(undefined|null)(\?|$)/.test(s)) st = 'vide';
      else if (im.complete && im.naturalWidth === 0 && s.indexOf('icon-') < 0) st = 'cassée';
      else if (s.slice(0, 11) === 'data:image/' && s.length > 350000) st = 'lourde';
      return { src: s, st: st, kb: s.slice(0, 5) === 'data:' ? Math.round(s.length * 0.75 / 1024) : 0, w: im.naturalWidth, h: im.naturalHeight };
    });
  }
  function vImages() {
    var im = pageImages();
    var row = el('div', 'margin-bottom:8px');
    row.appendChild(btn('🔧 Réparer les images', function () { if (window.BoubaImages) { window.BoubaImages.scan(true); say('✅ Réparation lancée'); setTimeout(draw, 1500); } else say('Dieu des images non chargé'); }, true));
    row.appendChild(btn('🖼️ Dieu des images', function () { if (window.BoubaImages) window.BoubaImages.panel(); else say('Dieu des images non chargé'); })); body.appendChild(row);
    body.appendChild(el('div', 'font-size:13px;margin-bottom:8px', im.length + ' images • ' + im.filter(function (i) { return i.st === 'ok'; }).length + ' bonnes'));
    im.filter(function (i) { return i.st !== 'ok'; }).concat(im.filter(function (i) { return i.st === 'ok'; })).slice(0, 60).forEach(function (i) {
      var r = el('div', 'display:flex;gap:10px;align-items:center;background:' + C.card + ';border:1px solid ' + C.line + ';border-radius:10px;padding:6px;margin-bottom:6px');
      var t = el('img', 'width:54px;height:54px;object-fit:cover;border-radius:8px;background:#000'); t.loading = 'lazy'; if (i.src) t.src = i.src; r.appendChild(t);
      var c = el('div', 'font-size:12px;min-width:0;flex:1');
      c.appendChild(el('b', 'color:' + (i.st === 'ok' ? C.ok : C.warn), i.st.toUpperCase() + (i.w ? ' • ' + i.w + '×' + i.h : '') + (i.kb ? ' • ' + i.kb + ' Ko' : '')));
      c.appendChild(el('div', 'color:#8b949e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', i.src.slice(0, 5) === 'data:' ? 'image intégrée (data)' : i.src)); r.appendChild(c); body.appendChild(r);
    });
  }

  /* ---------- 📝 Texte ---------- */
  function vTexte() {
    var q = el('input', 'width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid ' + C.line + ';background:#0d1117;color:#fff;margin-bottom:8px;font-size:14px'); q.placeholder = 'Chercher dans le texte de la page…';
    var out = el('div', 'white-space:pre-wrap;word-break:break-word;font-size:13px;color:' + C.txt + ';background:' + C.card + ';border-radius:10px;padding:10px');
    var lines = (document.body.innerText || '').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s && s.indexOf('HYDRE-9') < 0; });
    function show() { var qq = norm(q.value), l = qq ? lines.filter(function (s) { return norm(s).indexOf(qq) >= 0; }) : lines; out.textContent = l.slice(0, 300).join('\n') + (l.length > 300 ? '\n… (' + (l.length - 300) + ' lignes de plus)' : '') || 'Rien trouvé.'; }
    q.oninput = show; show(); body.appendChild(q); body.appendChild(out);
  }

  /* ---------- 🧰 Outils ---------- */
  function report() {
    var d = data(), a = audit(d), s = a.sum;
    return ['HYDRE-9 — ' + new Date().toLocaleString('fr-FR'),
      'Articles : ' + s.total + ' • sans photo (local) ' + s.sansPhoto + ' • sans prix ' + s.sansPrix + ' • hors stock ' + s.horsStock + ' • doublons ' + s.doublons + ' • sans catégorie ' + s.sansCat,
      'Commandes : ' + a.nOrders + ' • ' + ST.map(function (x) { return x + ' ' + a.by[x].n; }).join(' • ') + ' • livré ' + money(a.ca.livree) + ' F • aujourd’hui ' + money(a.today) + ' F',
      'Images page : ' + pageImages().length + ' • non bonnes ' + pageImages().filter(function (i) { return i.st !== 'ok'; }).length,
      errors.length ? 'Erreurs :\n' + errors.join('\n') : 'Erreurs : aucune'].join('\n');
  }
  function vOutils() {
    var d = data(), day = new Date().toISOString().slice(0, 10);
    var b1 = box('📤 Exports (ouvrent dans Excel)');
    b1.appendChild(btn('📦 Articles (CSV)', function () { download('articles-' + day + '.csv', csvProducts(d)); say('✅ Fichier créé'); }));
    b1.appendChild(btn('🧾 Commandes (CSV)', function () { download('commandes-' + day + '.csv', csvOrders(d)); say('✅ Fichier créé'); }));
    b1.appendChild(btn('💾 Sauvegarde (JSON)', function () { download('sauvegarde-bouba-' + day + '.json', JSON.stringify({ date: Date.now(), info: d.info, products: d.prods, orders: d.orders }, null, 1), 'application/json'); say('✅ Sauvegarde créée'); }));
    b1.appendChild(el('div', 'font-size:11px;color:#8b949e;margin-top:6px', 'La sauvegarde contient les articles et les commandes (donc des numéros de clients). Garde-la en lieu sûr.'));
    body.appendChild(b1);
    var b2 = box('🧰 Autres robots');
    b2.appendChild(btn('🖼️ Dieu des images', function () { if (window.BoubaImages) window.BoubaImages.panel(); else say('Non chargé'); }));
    b2.appendChild(btn('🔗 Liens', function () { if (window.BoubaLinks) window.BoubaLinks.panel(); else say('Non chargé'); }));
    body.appendChild(b2);
    var b3 = box('🩺 Maintenance');
    b3.appendChild(btn('📋 Copier le rapport', function () { copy(report(), say); }, true));
    b3.appendChild(btn('🧹 Vider le cache et recharger', async function () { try { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); } catch (e) {} location.reload(); }));
    body.appendChild(b3);
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-hydre9]') : null;
    if (t) { e.preventDefault(); open(); }
  }, true);

  window.Hydre9 = { open: open, audit: audit, csvProducts: csvProducts, csvOrders: csvOrders, report: report };
})();
