/* ============================================================
   BOUBA LINK-BOT  —  le robot des liens de BOUBA STOR
   Export : liens propres (production) pour tous les partages
   Import : ouvre n'importe quel lien BOUBA STOR dans l'application
   Aucune dépendance. Ne redirige jamais tout seul (zéro boucle).
   ============================================================ */
(function () {
  'use strict';
  if (window.BoubaLinks) return;
  var PROD = window.BOUBA_PROD || 'https://bouba-stor.vercel.app';
  var KEY = 'bl_hist_v1', MAX = 40, here = location.origin, lastNav = 0;

  /* ---------- reconnaître un lien ---------- */
  function isMine(h) {
    return h === location.host || h === new URL(PROD).host || /^bouba-stor[a-z0-9-]*\.vercel\.app$/i.test(h);
  }
  function parse(raw) {
    if (!raw) return null;
    var s = String(raw).trim(), m = s.match(/https?:\/\/[^\s<>"']+/i), u;
    if (!m) { var d = s.match(/bouba-stor[a-z0-9-]*\.vercel\.app[^\s<>"']*/i); if (d) { s = 'https://' + d[0]; m = [s]; } }
    try { u = new URL(m ? m[0] : s, here); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol) || !isMine(u.host)) return null;
    var q = u.searchParams, path = u.pathname.replace(/\/+$/, ''), id;
    if (path === '/api/p') {
      id = q.get('id'); if (id) return { type: 'article', id: id };
      id = q.get('n'); if (id) return { type: 'article', name: id };
    }
    if (path === '/api/b') { id = q.get('id'); if (id) return { type: 'shop', id: id }; }
    id = q.get('a') || q.get('p'); if (id) return { type: 'article', id: id };
    id = q.get('b'); if (id) return { type: 'shop', id: id };
    if (path === '' || path === '/index.html') return { type: 'home' };
    return null;
  }

  /* ---------- fabriquer un lien propre ---------- */
  function make(type, id, direct) {
    id = encodeURIComponent(id);
    if (type === 'shop') return direct ? PROD + '/?b=' + id + '&src=share' : PROD + '/api/b?id=' + id;
    if (type === 'article') return direct ? PROD + '/?a=' + id + '&src=share' : PROD + '/api/p?id=' + id;
    return PROD + '/';
  }
  function norm(s) {
    return typeof s === 'string' ? s.replace(/https?:\/\/bouba-stor[a-z0-9-]*\.vercel\.app/gi, PROD) : s;
  }

  /* ---------- historique (export / import) ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) {} }
  function add(link) {
    var r = parse(link); if (!r || r.type === 'home') return;
    var c = r.id ? make(r.type, r.id) : link;
    save([c].concat(load().filter(function (x) { return x !== c; })));
  }
  function exportAll() { return load().join('\n'); }
  function importText(t) {
    var n = 0, l = String(t || '').match(/https?:\/\/[^\s<>"']+/g) || [];
    l.forEach(function (x) { var r = parse(x); if (r && r.type !== 'home') { add(x); n++; } });
    return n;
  }

  /* ---------- ouvrir un lien DANS l'application ---------- */
  function open(link) {
    var r = parse(link); if (!r) return false;
    var target = r.type === 'home' ? '/' :
      r.id ? '/?' + (r.type === 'shop' ? 'b' : 'a') + '=' + encodeURIComponent(r.id) + '&src=share' :
      '/api/p?n=' + encodeURIComponent(r.name);
    if (target === location.pathname + location.search) return true;       // déjà là : rien à faire
    if (Date.now() - lastNav < 1500) return true;                          // anti-boucle
    lastNav = Date.now(); add(link); location.href = target;              // chemin relatif = reste dans l'app
    return true;
  }

  /* ---------- copier / partager ---------- */
  function copy(t) {
    var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t) : Promise.reject();
    return p.catch(function () {
      var ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove();
    });
  }
  function share(link) {
    var r = parse(link) || {}, name = 'BOUBA STOR';
    try { if (r.id) name = S.products[r.id].name || name; } catch (e) {}
    var t = '🛍️ ' + name + '\nLivraison 24h à Abidjan\n' + link;
    if (window.shareRich) return window.shareRich({ id: r.type === 'article' ? r.id : undefined, title: name, card: { name: name }, text: t, link: link });
    if (navigator.share) return navigator.share({ title: name, text: t, url: link }).catch(function () {});
    return copy(link);
  }

  /* ---------- tous les partages de l'app passent par ici ---------- */
  function wrap() {
    var f = window.shareRich; if (typeof f !== 'function' || f.__bl) return;
    var w = function (o) {
      try {
        o = o || {};
        if (!o.link && o.id) o.link = make('article', o.id);
        o.link = norm(o.link); o.text = norm(o.text);
        if (o.link) add(o.link);
      } catch (e) {}
      return f.call(this, o);
    };
    w.__bl = 1; window.shareRich = w;
  }

  /* ---------- panneau du bouton ---------- */
  var box;
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  function btn(txt, fn, gold) {
    var b = el('button', 'padding:11px 14px;border-radius:12px;border:1px solid #ffd700;font-weight:800;font-size:14px;cursor:pointer;margin:4px 4px 0 0;' +
      (gold ? 'background:linear-gradient(135deg,#ffd700,#c9971c);color:#000' : 'background:#111;color:#ffd700'), txt);
    b.type = 'button'; b.onclick = fn; return b;
  }
  function panel() {
    if (box) box.remove();
    box = el('div', 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.82);display:flex;align-items:flex-end;justify-content:center');
    var sh = el('div', 'width:100%;max-width:520px;max-height:88vh;overflow:auto;background:#0b0b0e;color:#fff;border:1px solid #ffd700;border-radius:22px 22px 0 0;padding:18px;font-family:system-ui,sans-serif');
    var msg = el('div', 'min-height:20px;margin:6px 0;color:#4ade80;font-size:13px');
    function say(t) { msg.textContent = t; }
    box.onclick = function (e) { if (e.target === box) box.remove(); };
    sh.appendChild(el('div', 'font-weight:900;font-size:18px;color:#ffd700;margin-bottom:10px', '🔗 Liens BOUBA STOR'));

    var cur = parse(location.href);
    if (cur && cur.type !== 'home' && cur.id) {
      var cl = make(cur.type, cur.id);
      sh.appendChild(el('div', 'font-size:13px;color:#aaa', cur.type === 'shop' ? 'Boutique ouverte :' : 'Article ouvert :'));
      sh.appendChild(el('div', 'font-size:12px;word-break:break-all;margin:4px 0', cl));
      sh.appendChild(btn('📋 Copier', function () { copy(cl).then(function () { say('✅ Lien copié'); }); }));
      sh.appendChild(btn('📤 Partager', function () { share(cl); }, true));
    }
    sh.appendChild(el('div', 'margin-top:12px;font-size:13px;color:#aaa', 'La boutique :'));
    sh.appendChild(btn('📋 Copier le lien de la boutique', function () { copy(PROD + '/').then(function () { say('✅ Lien copié'); }); }));
    sh.appendChild(btn('📤 Partager la boutique', function () { share(PROD + '/'); }, true));

    sh.appendChild(el('div', 'margin-top:14px;font-size:13px;color:#aaa', 'Ouvrir / importer un lien :'));
    var ta = el('textarea', 'width:100%;box-sizing:border-box;height:70px;margin-top:6px;border-radius:12px;border:1px solid #333;background:#111;color:#fff;padding:10px;font-size:14px');
    ta.placeholder = 'Colle ici un ou plusieurs liens BOUBA STOR';
    sh.appendChild(ta);
    sh.appendChild(btn('📋 Coller', function () {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { ta.value = t; }).catch(function () { say('Colle à la main dans la case'); });
      else say('Colle à la main dans la case');
    }));
    sh.appendChild(btn('🚀 Ouvrir', function () { if (!open(ta.value)) say('❌ Ce n’est pas un lien BOUBA STOR'); }, true));
    sh.appendChild(btn('⬇️ Importer', function () { var n = importText(ta.value); say(n ? '✅ ' + n + ' lien(s) importé(s)' : '❌ Aucun lien valide'); panel(); }));

    var h = load();
    if (h.length) {
      sh.appendChild(el('div', 'margin-top:14px;font-size:13px;color:#aaa', 'Mes derniers liens :'));
      h.slice(0, 8).forEach(function (l) {
        var row = el('div', 'font-size:12px;word-break:break-all;padding:8px;margin-top:6px;border:1px solid #333;border-radius:10px;cursor:pointer', l);
        row.onclick = function () { open(l); }; sh.appendChild(row);
      });
      sh.appendChild(btn('⬆️ Exporter mes liens', function () { copy(exportAll()).then(function () { say('✅ Liste copiée (' + h.length + ')'); }); }));
    }
    sh.appendChild(msg);
    sh.appendChild(btn('Fermer', function () { box.remove(); }));
    box.appendChild(sh); document.body.appendChild(box);
  }

  /* ---------- clics : le robot surveille tous les liens ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target, a = t && t.closest ? t.closest('[data-bouba-liens],a[href]') : null;
    if (!a) return;
    if (a.hasAttribute('data-bouba-liens')) { e.preventDefault(); panel(); return; }
    var h = a.getAttribute('href') || '';
    if (!h || h.charAt(0) === '#' || /^(tel:|mailto:|sms:|javascript:|intent:)/i.test(h)) return;
    var u; try { u = new URL(a.href); } catch (x) { return; }
    var r = parse(a.href);
    if (r && (r.type === 'article' || r.type === 'shop') && /^\/api\/(p|b)$/.test(u.pathname.replace(/\/+$/, ''))) {
      e.preventDefault(); open(a.href); return;                              // lien partagé cliqué dans l'app : on reste dans l'app
    }
    if (u.origin !== location.origin && !isMine(u.host)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  }, true);

  /* ---------- PWA : lien reçu pendant que l'app est ouverte ---------- */
  try {
    if ('launchQueue' in window && window.launchQueue.setConsumer) {
      window.launchQueue.setConsumer(function (p) {
        var r = p && p.targetURL && parse(p.targetURL);
        if (r && (r.type === 'article' || r.type === 'shop')) open(p.targetURL);
      });
    }
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', wrap);
  window.addEventListener('load', function () { wrap(); setTimeout(wrap, 1500); setTimeout(wrap, 4000); });
  wrap();
  var cur0 = parse(location.href); if (cur0 && cur0.type !== 'home') add(location.href);

  window.BoubaLinks = { parse: parse, make: make, open: open, copy: copy, share: share, panel: panel, list: load, exportAll: exportAll, importText: importText, norm: norm };
})();
