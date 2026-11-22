/* ============================================================
   BOUBA — DIEU DES IMAGES  (gardien des images + santé de l'application)
   • Photos ajoutées : redimensionnées et allégées automatiquement
   • Photos cassées / vides / trop lourdes : réparées toutes seules
   • Bouton « Dieu des images » : diagnostic + réparation en un clic
   Aucune dépendance. À la racine du dépôt, à côté de index.html.
   ============================================================ */
(function () {
  'use strict';
  if (window.BoubaImages) return;

  var FALLBACK = '/icon-512.png';
  var MAX_SIDE = 1280;            // côté maximum d'une photo ajoutée (px)
  var TARGET_BYTES = 180 * 1024;  // poids visé pour une photo ajoutée
  var HEAVY_DATA = 350000;        // une image « data: » plus longue que ça est allégée à l'affichage
  var errors = [], lightCache = {}, stats = { fixed: 0, lightened: 0, optimized: 0, saved: 0 };

  /* ---------- 1. photos ajoutées : redimension + compression ---------- */
  function toBlob(c, q) { return new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', q); }); }
  async function optimize(file, max, target) {
    max = max || MAX_SIDE; target = target || TARGET_BYTES;
    var bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { return file; } // format illisible : on laisse tel quel
    var w = bmp.width, h = bmp.height, sc = Math.min(1, max / Math.max(w, h));
    if (sc === 1 && file.size <= target && /jpe?g|webp/i.test(file.type)) { if (bmp.close) bmp.close(); return file; }
    var best = null, cw = Math.round(w * sc), ch = Math.round(h * sc);
    for (var round = 0; round < 5; round++) {
      var c = document.createElement('canvas'); c.width = cw; c.height = ch;
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch); g.drawImage(bmp, 0, 0, cw, ch);
      for (var q = 0.88; q >= 0.5; q -= 0.08) {
        var b = await toBlob(c, q); if (!b) break;
        if (!best || b.size < best.size) best = b;
        if (b.size <= target) { best = b; round = 9; break; }
      }
      if (round >= 9) break;
      cw = Math.round(cw * 0.82); ch = Math.round(ch * 0.82); if (Math.min(cw, ch) < 480) break;
    }
    if (bmp.close) bmp.close();
    if (!best || (best.size >= file.size && sc === 1 && /jpe?g|webp/i.test(file.type))) return file;
    stats.optimized++; stats.saved += Math.max(0, file.size - best.size);
    return new File([best], (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
  }
  document.addEventListener('change', async function (e) {
    var i = e.target;
    if (!i || i.tagName !== 'INPUT' || i.type !== 'file' || i.__ig || !i.files || !i.files.length) return;
    var list = Array.prototype.slice.call(i.files);
    if (!list.some(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name || ''); })) return;
    e.stopImmediatePropagation();                       // l'application recevra la photo une fois allégée
    try {
      var out = [];
      for (var k = 0; k < list.length; k++) out.push(/^image\//.test(list[k].type) && !/gif/i.test(list[k].type) ? await optimize(list[k]) : list[k]);
      var dt = new DataTransfer(); out.forEach(function (f) { dt.items.add(f); }); i.files = dt.files;
    } catch (err) { log('optimisation : ' + (err && err.message)); }
    i.__ig = 1; i.dispatchEvent(new Event('change', { bubbles: true })); i.__ig = 0;
  }, true);

  /* ---------- 2. réparation des images cassées ---------- */
  function pidOf(img) {
    var c = img.closest ? img.closest('[data-pid],[data-aid]') : null;
    return img.dataset.pid || (c && (c.dataset.pid || c.dataset.aid)) || '';
  }
  function dead(img) { img.dataset.igDead = '1'; if (img.src.indexOf(FALLBACK) < 0) img.src = FALLBACK; }
  function heal(img) {
    if (!img || img.dataset.igDead || (img.src || '').indexOf(FALLBACK) >= 0) return;
    var n = +(img.dataset.igTry || 0); if (n >= 3) return dead(img);
    img.dataset.igTry = n + 1; stats.fixed++;
    var src = img.currentSrc || img.src || '', pid = pidOf(img);
    if (n === 0 && /^https?:/.test(src) && src.indexOf('/api/img') < 0) { img.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'r=' + Date.now(); return; }
    if (n <= 1 && pid) { img.src = '/api/img?id=' + encodeURIComponent(pid) + (n ? '&r=' + Date.now() : ''); return; }
    dead(img);
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') return heal(t);
    log((e.message || 'erreur') + (e.filename ? ' — ' + String(e.filename).split('/').pop() + ':' + e.lineno : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) { log('promesse : ' + String((e.reason && e.reason.message) || e.reason).slice(0, 120)); });
  function log(m) { errors.push(new Date().toLocaleTimeString('fr-FR') + ' ' + String(m).slice(0, 140)); if (errors.length > 20) errors.shift(); }

  /* ---------- 3. images trop lourdes (data:) allégées à l'affichage ---------- */
  function lighten(img) {
    var s = img.src || ''; if (s.slice(0, 11) !== 'data:image/' || s.length < HEAVY_DATA || img.dataset.igLight) return;
    img.dataset.igLight = '1';
    var key = s.length + s.slice(40, 90);
    if (lightCache[key]) { img.src = lightCache[key]; return; }
    var im = new Image();
    im.onload = function () {
      try {
        var sc = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        var d = c.toDataURL('image/jpeg', 0.8);
        if (d.length < s.length) { lightCache[key] = d; img.src = d; stats.lightened++; }
      } catch (e) { log('allègement : ' + e.message); }
    };
    im.src = s;
  }

  /* ---------- 4. balayage des images de la page ---------- */
  function scan(fix) {
    var imgs = document.images, r = { total: imgs.length, ok: 0, broken: 0, heavy: 0, empty: 0 }, light = 0;
    for (var k = 0; k < imgs.length; k++) {
      var im = imgs[k], s = im.getAttribute('src') || '';
      if (!s || /\/(undefined|null)(\?|$)/.test(s) || s === '#') { r.empty++; if (fix) heal(im); continue; }
      if (im.complete && im.naturalWidth === 0 && s.indexOf(FALLBACK) < 0) { r.broken++; if (fix) heal(im); continue; }
      if (s.slice(0, 11) === 'data:image/' && s.length >= HEAVY_DATA && !im.dataset.igLight) { r.heavy++; if (fix && light++ < 4) lighten(im); }
      r.ok++;
      if (fix && !im.hasAttribute('decoding')) im.decoding = 'async';
      if (fix && k > 7 && !im.hasAttribute('loading')) im.loading = 'lazy';
    }
    return r;
  }
  var timer = 0;
  function later() { clearTimeout(timer); timer = setTimeout(function () { scan(true); }, 400); }
  try { new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  window.addEventListener('load', function () { later(); setInterval(function () { scan(true); }, 15000); });

  /* ---------- 5. santé de l'application ---------- */
  async function checks() {
    var out = [], p = scan(false);
    out.push([navigator.onLine ? 'ok' : 'ko', 'Connexion internet', navigator.onLine ? 'en ligne' : 'hors ligne']);
    out.push([p.broken + p.empty ? 'warn' : 'ok', 'Images de la page', p.total + ' au total — ' + p.ok + ' bonnes, ' + p.broken + ' cassées, ' + p.empty + ' vides, ' + p.heavy + ' lourdes']);
    var pid = ''; try { pid = Object.keys(S.products || {})[0] || ''; } catch (e) {}
    if (pid) {
      try {
        var r = await fetch('/api/img?id=' + encodeURIComponent(pid), { cache: 'no-store' });
        var ct = r.headers.get('content-type') || '', def = (r.url || '').indexOf('icon-') >= 0;
        out.push([r.ok && /image/.test(ct) && !def ? 'ok' : 'warn', 'Serveur des photos', r.ok ? (def ? 'répond, mais renvoie le logo' : 'répond avec une photo') : 'erreur ' + r.status]);
      } catch (e) { out.push(['ko', 'Serveur des photos', 'injoignable']); }
    }
    try { var m = await fetch('/manifest.json', { cache: 'no-store' }); out.push([m.ok ? 'ok' : 'ko', 'Application installable (manifest)', m.ok ? 'lisible' : 'erreur ' + m.status]); } catch (e) { out.push(['ko', 'Application installable (manifest)', 'injoignable']); }
    try { var rs = await navigator.serviceWorker.getRegistrations(); out.push([rs.length ? 'ok' : 'warn', 'Mode hors ligne (service worker)', rs.length ? 'actif' : 'non installé']); } catch (e) {}
    try { var es = await navigator.storage.estimate(), pc = Math.round(es.usage / es.quota * 100); out.push([pc > 80 ? 'warn' : 'ok', 'Stockage du téléphone', Math.round(es.usage / 1048576) + ' Mo utilisés (' + pc + ' %)']); } catch (e) {}
    out.push([errors.length ? 'warn' : 'ok', 'Erreurs de l’application', errors.length ? errors.length + ' enregistrée(s)' : 'aucune']);
    out.push(['ok', 'Réparations faites', stats.fixed + ' images réparées, ' + stats.lightened + ' allégées, ' + stats.optimized + ' photos optimisées (' + Math.round(stats.saved / 1024) + ' Ko gagnés)']);
    return out;
  }
  function report(rows) {
    return 'BOUBA — rapport de santé ' + new Date().toLocaleString('fr-FR') + '\n' + rows.map(function (r) { return '[' + r[0] + '] ' + r[1] + ' : ' + r[2]; }).join('\n') + (errors.length ? '\nErreurs :\n' + errors.join('\n') : '');
  }

  /* ---------- panneau ---------- */
  var box;
  function el(t, css, txt) { var e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
  function btn(txt, fn, gold) {
    var b = el('button', 'padding:11px 14px;border-radius:12px;border:1px solid #ffd700;font-weight:800;font-size:14px;cursor:pointer;margin:4px 4px 0 0;' + (gold ? 'background:linear-gradient(135deg,#ffd700,#c9971c);color:#000' : 'background:#111;color:#ffd700'), txt);
    b.type = 'button'; b.onclick = fn; return b;
  }
  async function panel() {
    if (box) box.remove();
    box = el('div', 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.82);display:flex;align-items:flex-end;justify-content:center');
    var sh = el('div', 'width:100%;max-width:520px;max-height:90vh;overflow:auto;background:#0b0b0e;color:#fff;border:1px solid #ffd700;border-radius:22px 22px 0 0;padding:18px;font-family:system-ui,sans-serif');
    box.onclick = function (e) { if (e.target === box) box.remove(); };
    sh.appendChild(el('div', 'font-weight:900;font-size:18px;color:#ffd700;margin-bottom:8px', '🖼️ Dieu des images'));
    var body = el('div', 'font-size:13px', 'Analyse en cours…'), msg = el('div', 'min-height:20px;margin:8px 0;color:#4ade80;font-size:13px'), rows = [];
    sh.appendChild(body); sh.appendChild(msg);
    sh.appendChild(btn('🔧 Tout réparer', async function () { msg.textContent = 'Réparation…'; scan(true); await new Promise(function (r) { setTimeout(r, 1200); }); show(); msg.textContent = '✅ Réparation lancée'; }, true));
    sh.appendChild(btn('📋 Copier le rapport', function () { (navigator.clipboard ? navigator.clipboard.writeText(report(rows)) : Promise.reject()).then(function () { msg.textContent = '✅ Rapport copié'; }).catch(function () { msg.textContent = 'Copie impossible'; }); }));
    sh.appendChild(btn('🧹 Vider le cache et recharger', async function () {
      try { var ks = await caches.keys(); await Promise.all(ks.map(function (k) { return caches.delete(k); })); } catch (e) {}
      location.reload();
    }));
    sh.appendChild(btn('Fermer', function () { box.remove(); }));
    if (errors.length) { var d = el('details', 'margin-top:10px;font-size:12px;color:#aaa'); d.appendChild(el('summary', '', 'Dernières erreurs (' + errors.length + ')')); d.appendChild(el('div', 'white-space:pre-wrap;margin-top:6px', errors.join('\n'))); sh.appendChild(d); }
    box.appendChild(sh); document.body.appendChild(box);
    async function show() {
      rows = await checks(); body.textContent = '';
      rows.forEach(function (r) {
        var line = el('div', 'padding:8px 0;border-bottom:1px solid #222');
        line.appendChild(el('span', 'margin-right:6px', r[0] === 'ok' ? '✅' : r[0] === 'warn' ? '⚠️' : '❌'));
        line.appendChild(el('b', '', r[1] + ' : ')); line.appendChild(document.createTextNode(r[2])); body.appendChild(line);
      });
    }
    show();
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-bouba-dieu]') : null;
    if (t) { e.preventDefault(); panel(); }
  }, true);

  window.BoubaImages = { optimize: optimize, heal: heal, scan: scan, panel: panel, checks: checks, report: report, stats: stats };
})();
