// BOUBA STOR - affiche les articles publiés par toutes les boutiques sur l'accueil
import { list, mode, lastError, esc, money, intl, shareLinks, homeUrl } from './bouba-data.js';

const FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const LOGO = '/icon-192.png';
window.__baImg = window.__baImg || {};

/* ---- Mémoire des photos : elles restent disponibles même hors ligne ou après un rechargement ---- */
const idb = new Promise(r => { try { const q = indexedDB.open('ba-img', 1); q.onupgradeneeded = () => q.result.createObjectStore('i'); q.onsuccess = () => r(q.result); q.onerror = () => r(null); } catch (e) { r(null); } });
const idbGet = async k => { const d = await idb; return d ? new Promise(r => { try { const q = d.transaction('i').objectStore('i').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(); } catch (e) { r(); } }) : undefined; };
const idbPut = async (k, v) => { const d = await idb; if (d) try { d.transaction('i', 'readwrite').objectStore('i').put(v, k); } catch (e) {} };

const css = document.createElement('style');
css.textContent = `
#boutiques-articles{padding:12px}
#boutiques-articles h3{color:#ffd700;text-align:center;margin:8px 0 12px}
.ba-grid{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;padding-bottom:10px}
.ba-grid::-webkit-scrollbar{height:4px}.ba-grid::-webkit-scrollbar-thumb{background:#ffd700;border-radius:4px}
.ba-card{background:#111;border:1px solid #ffd700;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#fff;font-family:Arial,sans-serif;flex:0 0 72%;max-width:270px;scroll-snap-align:start}
.ba-card img.ba-m,.ba-card video{width:100%;height:190px;object-fit:cover;background:#000}
.ba-info{padding:10px;display:flex;flex-direction:column;gap:5px;flex:1}
.ba-name{font-weight:bold;font-size:15px}
.ba-price{color:#ffd700;font-size:16px;font-weight:bold}
.ba-desc{font-size:12px;color:#bbb}
.ba-seller{font-size:12px;color:#ffd700}
.ba-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
.ba-b{flex:1;min-width:40px;text-align:center;padding:8px 4px;border-radius:8px;border:none;font-size:13px;font-weight:bold;cursor:pointer;text-decoration:none;color:#000;background:#ffd700}
.ba-g{background:#25D366}.ba-bl{background:#2d7ff9;color:#fff}.ba-d{background:#333;color:#fff}
.ba-share{border-top:1px solid #333;padding-top:6px;margin-top:4px}
.ba-share{display:grid;grid-template-columns:1fr 1fr}
.ba-act{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:2px}
.ba-act button{padding:7px 4px;border-radius:8px;border:1px solid #ffd700;background:#000;color:#ffd700;font-size:11.5px;font-weight:700}
.ba-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:3000;display:flex;align-items:flex-end}
.ba-modal{background:#111;border:1px solid #ffd700;border-radius:16px 16px 0 0;padding:16px;width:100%;max-height:80vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif}
.ba-modal h3{color:#ffd700;margin:0 0 10px}
.ba-modal .close{float:right;background:none;border:0;color:#ffd700;font-size:20px}
.ba-modal table{width:100%;border-collapse:collapse;font-size:13px}
.ba-modal th,.ba-modal td{border-bottom:1px solid #333;padding:6px 4px;text-align:left}
.ba-look-item{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #222;cursor:pointer}
.ba-look-item img{width:46px;height:46px;border-radius:8px;object-fit:cover;background:#222}
`;
document.head.appendChild(css);

function box() {
  let el = document.getElementById('boutiques-articles');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'boutiques-articles';
  const cand = [...document.querySelectorAll('body *')].find(n =>
    n.children.length === 0 && /^\s*Bienvenue/i.test(n.textContent || ''));
  if (cand) {
    let t = cand;
    while (t.parentElement && t.parentElement !== document.body && t.parentElement.children.length === 1) t = t.parentElement;
    t.parentNode.insertBefore(el, t.nextSibling);
    return el;
  }
  const nav = document.querySelector('.bottom-nav, footer');
  nav ? nav.parentNode.insertBefore(el, nav) : document.body.appendChild(el);
  return el;
}

/* ---- Dessin des cartes (utilisé avec la mémoire locale ET avec les données en ligne) ---- */
function draw(items, byId, diag) {
  window.__baData = window.__baData || {};
  return '<h3>🏪 Boutiques ➜ glisse (' + items.length + ')</h3>' + diag + '<div class="ba-grid">' + items.map(a => {
    const nomBoutique = a.shopName || "Boutique Partenaire";
    const proprietaire = a.owner || "Vendeur";
    const imageArticle = a.img && a.img.trim() !== '' ? a.img : (window.__baImg[a.id] || FALLBACK);
    const telephone = a.phone || (byId[a.shopId] || {}).phone || '';

    window.__baData[a.id] = { a, nomBoutique, telephone };
    const text = `${a.name} - ${money(a.price)} chez ${nomBoutique} sur BOUBA STORE`;
    const link = location.origin + '/api/p?id=' + encodeURIComponent(a.id);
    const chatHref = telephone ? ('amis.html#tel=' + encodeURIComponent(telephone.replace(/\D/g, ''))) : '';
    const s = shareLinks(text, link);
    const sh = byId[a.shopId] || {};
    const av = sh.avatar ? `<img src="${sh.avatar}" alt="" onerror="this.style.display='none'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #ffd700">` : '';

    return `<div class="ba-card" data-aid="${esc(a.id)}">
        ${a.video ? `<video src="${a.video}" poster="${imageArticle}" controls playsinline preload="metadata"></video>` : `<img class="ba-m" data-pid="${a.id}" src="${imageArticle}" alt="${esc(a.name)}" loading="lazy" onerror="if(this.src.indexOf('icon-192')<0)this.src='${LOGO}'">`}
        <div class="ba-info">
          <div class="ba-name">${esc(a.name)}</div>
          <div class="ba-price">${money(a.price)}</div>
          ${a.desc ? `<div class="ba-desc">${esc(a.desc)}</div>` : ''}
          <div class="ba-desc">${esc(a.cat || '')}</div>
          <div class="ba-seller" style="display:flex;align-items:center;gap:8px">${av}<span>🏪 ${esc(nomBoutique)}<br>👤 ${esc(proprietaire)}</span></div>
          <div class="ba-act">
            <button onclick="BA.offer('${esc(a.id)}')">💸 Offre</button>
            <button onclick="BA.gift('${esc(a.id)}')">🎁 Offrir</button>
            <button onclick="BA.size()">❓ Taille</button>
            <button onclick="BA.look('${esc(a.id)}')">👗 Complétez le look</button>
          </div>
          <div class="ba-row">
            <a class="ba-b ba-bl" href="tel:${esc(telephone)}">📞</a>
            <a class="ba-b ba-g" href="${chatHref || '#'}" ${chatHref ? '' : 'onclick="alert(\'Numéro indisponible pour ce vendeur.\');return false;"'}>💬 Discuter</a>
            <a class="ba-b ba-d" href="sms:${esc(telephone)}">✉️</a>
          </div>
          <div class="ba-row ba-share">
            <a class="ba-b ba-g" href="#" onclick="var b=document.getElementById('iaBtn'); if(b){b.click();} setTimeout(function(){var i=document.getElementById('iaInput'); if(i){i.value='Bonjour ${esc(nomBoutique)}, je suis intéressé par : ${esc(a.name)}'; i.focus();}}, 500); return false;">🤖 Discuter avec IA</a>
            <button class="ba-b" style="background:#ffd700;border:0;color:#000;font-weight:800" onclick="if(window.addCart)addCart('${esc(a.id)}')">🛒 Ajouter</button>
            <a class="ba-b ba-bl" target="_blank" href="${s.facebook}">Facebook</a>
            <a class="ba-b ba-d" target="_blank" href="${s.telegram}">Telegram</a>
            <a class="ba-b ba-d" target="_blank" href="${s.x}">X</a>
            <button class="ba-b" data-share="${esc(text)}" data-link="${esc(link)}">📤 Partager</button>
          </div>
        </div></div>`;
  }).join('') + '</div>';
}

/* ---- Après dessin : chargement des photos, mémoire, nouveaux essais, logo en dernier recours ---- */
function afterDraw(el, items) {
  const need = id => { if (window.IMG && typeof window.IMG.need === 'function') window.IMG.need(id); };
  items.forEach(a => need(a.id));
  el.querySelectorAll('img.ba-m[data-pid]').forEach(im => {
    if (im.src === FALLBACK) idbGet(im.dataset.pid).then(v => { if (v && im.src === FALLBACK) im.src = v; });
  });
  [3000, 8000, 15000, 30000].forEach((t, i) => setTimeout(() => {
    el.querySelectorAll('img.ba-m[data-pid]').forEach(im => {
      if (im.src !== FALLBACK && im.naturalWidth > 1) return;
      const id = im.dataset.pid;
      if (window.__baImg[id]) im.src = window.__baImg[id];
      else need(id);
      if (i === 3 && im.src === FALLBACK) im.src = LOGO;
    });
  }, t));
}

let listened = false;
async function show() {
  const el = box();
  if (!listened) {
    listened = true;
    // on mémorise chaque photo dès qu'elle est chargée
    el.addEventListener('load', e => {
      const im = e.target;
      if (!im || im.tagName !== 'IMG' || !im.dataset || !im.dataset.pid) return;
      if (im.src === FALLBACK || im.src.indexOf('icon-192') >= 0 || im.naturalWidth <= 1) return;
      window.__baImg[im.dataset.pid] = im.src;
      if (im.src.startsWith('data:') && im.src.length < 600000) idbPut(im.dataset.pid, im.src);
    }, true);
  }

  const hasCards = !!el.querySelector('.ba-card[data-aid]');
  if (!hasCards) {
    // affichage immédiat des derniers articles connus (mémoire du téléphone), sinon squelette
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem('ba_cache') || 'null'); } catch (e) {}
    if (cached && cached.length) { el.innerHTML = draw(cached, {}, ''); afterDraw(el, cached); }
    else if (!el.innerHTML.trim()) {
      el.innerHTML = '<h3>🏪 Boutiques</h3><div class="ba-grid">' +
        Array(3).fill('<div class="ba-card" style="height:350px;"><div style="height:190px;background:#222;"></div><div class="ba-info"><div style="height:15px;width:80%;background:#333;margin-bottom:8px;border-radius:4px;"></div><div style="height:15px;width:40%;background:#333;border-radius:4px;"></div></div></div>').join('') +
        '</div>';
    }
  }

  try {
    const [shops, arts] = [await list('boutiques'), await list('articles')];
    const md = await mode(), adm0 = (typeof isAdmin !== 'undefined' && isAdmin);

    const diag = md === 'local' ? '<div style="background:#3a0000;border:1px solid #ff5a5a;border-radius:10px;color:#ffb3b3;font-size:12px;padding:8px;margin:0 0 10px;text-align:center">⚠️ La base en ligne est inaccessible : seuls les articles de CE téléphone s\'affichent.' + (adm0 ? '<br>Cause : <b>' + esc(lastError() || 'inconnue') + '</b>' : '') + '</div>' : (adm0 ? '<div style="color:#888;font-size:11px;text-align:center;margin-bottom:6px">🟢 Base en ligne • ' + shops.length + ' boutique(s) • ' + arts.length + ' article(s)</div>' : '');

    const byId = Object.fromEntries(shops.map(s => [s.id, s]));
    window.__baData = window.__baData || {};

    // tous les articles, sans filtrage sur le statut de la boutique
    const items = arts.slice().sort((a, b) => (b.date || 0) - (a.date || 0));
    if (!items.length) { el.innerHTML = diag; return; }

    el.innerHTML = draw(items, byId, diag);
    afterDraw(el, items);

    // mémoire locale légère (textes seulement) pour un affichage instantané au prochain passage
    try {
      localStorage.setItem('ba_cache', JSON.stringify(items.slice(0, 60).map(a => ({
        id: a.id, name: a.name, price: a.price, desc: a.desc, cat: a.cat, date: a.date, shopId: a.shopId, shopName: a.shopName, owner: a.owner,
        phone: a.phone || (byId[a.shopId] || {}).phone || '', img: /^https?:/.test(a.img || '') ? a.img : ''
      }))));
    } catch (e) {}

    // Lien partagé (?a=ID) : on fait défiler jusqu'à l'article et on l'entoure
    const want = new URLSearchParams(location.search).get('a');
    if (want && !window.__baDone) {
      const card = el.querySelector('[data-aid="' + String(want).replace(/["\\]/g, '') + '"]');
      if (card) {
        window.__baDone = 1;
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          card.style.boxShadow = '0 0 0 3px #ffd700, 0 0 20px #ffd700';
        }, 400);
      }
    }
  } catch (e) {
    console.error('articles-accueil:', e);
    if (!el.querySelector('.ba-card[data-aid]'))
      el.innerHTML = '<div style="color:#888;font-size:11px;padding:6px;text-align:center">Articles boutiques : ' + String(e.message || e) + '</div>';
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-share]');
  if (!b) return;
  const text = b.dataset.share;
  if (navigator.share) navigator.share({ title: 'BOUBA STOR', text, url: b.dataset.link || homeUrl() }).catch(() => {});
  else navigator.clipboard && navigator.clipboard.writeText(text + ' ' + (b.dataset.link || homeUrl())).then(() => alert('Lien copié !'));
});

/* ===== Fenêtre réutilisable (Taille / Complétez le look) ===== */
function baModal(title, bodyHtml) {
  let bg = document.getElementById('baModalBg');
  if (bg) bg.remove();
  bg = document.createElement('div');
  bg.id = 'baModalBg'; bg.className = 'ba-modal-bg';
  bg.innerHTML = '<div class="ba-modal"><button class="close" onclick="document.getElementById(\'baModalBg\').remove()">✕</button><h3>' + title + '</h3>' + bodyHtml + '</div>';
  bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg);
}

/* ===== Boutons Offre / Offrir / Taille / Complétez le look ===== */
window.BA = {
  offer(id) {
    const d = (window.__baData || {})[id]; if (!d) return;
    const { a, nomBoutique, telephone } = d;
    const v = prompt('Votre offre pour « ' + a.name + ' »\nPrix actuel : ' + money(a.price) + '\nProposez votre prix (en F) :');
    if (v === null) return;
    const n = Number(String(v).replace(/\D/g, ''));
    if (!n || n >= Number(a.price)) { alert('Proposez un prix inférieur au prix actuel.'); return; }
    if (n < Number(a.price) * 0.5) { alert('Offre trop basse. Essayez un prix plus proche.'); return; }
    if (!telephone) { alert('Numéro indisponible pour ce vendeur.'); return; }
    const wa = telephone.replace(/\D/g, '');
    const msg = 'Bonjour ' + nomBoutique + ', je propose ' + n.toLocaleString('fr-FR') + ' F pour « ' + a.name + ' » (prix affiché : ' + money(a.price) + ').';
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
  },
  gift(id) {
    const d = (window.__baData || {})[id]; if (!d) return;
    const { a, nomBoutique } = d;
    const n = prompt("Prénom de votre ami(e) :"); if (n === null) return;
    const m = prompt('Votre message (facultatif) :') || '';
    const link = location.origin + '/api/p?id=' + encodeURIComponent(a.id);
    const msg = '🎁 Pour ' + n + ' : je t\'offre « ' + a.name + ' » (' + money(a.price) + ') chez ' + nomBoutique + ' sur BOUBA STORE !' + (m ? '\n« ' + m + ' »' : '') + '\n' + link;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  },
  size() {
    const rows = [['XS', '78-82'], ['S', '83-87'], ['M', '88-93'], ['L', '94-99'], ['XL', '100-106'], ['XXL', '107-114'], ['3XL', '115-122']];
    baModal('📏 Guide des tailles (indicatif)',
      '<p style="color:#aaa;font-size:12px">Mesure du tour de poitrine. En cas de doute, écrivez au vendeur via Discuter.</p>' +
      '<table><tr><th>Taille</th><th>Poitrine (cm)</th></tr>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table>');
  },
  look(id) {
    const d = (window.__baData || {})[id]; if (!d) return;
    const shopId = d.a.shopId;
    const all = Object.values(window.__baData || {}).map(x => x.a).filter(x => x.shopId === shopId && x.id !== id).slice(0, 6);
    if (!all.length) { baModal('👗 Complétez le look', '<p style="color:#aaa">Pas d\'autre article pour cette boutique pour le moment.</p>'); return; }
    const html = all.map(p => '<div class="ba-look-item" onclick="document.getElementById(\'baModalBg\').remove();BA.goTo(\'' + p.id + '\')"><img src="' + esc(p.img || window.__baImg[p.id] || LOGO) + '" onerror="this.onerror=null;this.src=\'' + LOGO + '\'"><div><b>' + esc(p.name) + '</b><br><span style="color:#ffd700">' + money(p.price) + '</span></div></div>').join('');
    baModal('👗 Complétez le look — ' + d.nomBoutique, html);
  },
  goTo(id) {
    const card = document.querySelector('[data-aid="' + id + '"]');
    if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); card.style.boxShadow = '0 0 0 3px #ffd700, 0 0 20px #ffd700'; setTimeout(() => card.style.boxShadow = '', 3000); }
  }
};

window.__baShow = show;
show();
setInterval(() => { if (!document.hidden) show(); }, 120000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });

// Génération du catalogue XML complet pour Google Merchant Center
window.genererFluxGoogle = async function () {
  try {
    const arts = await list('articles');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>BOUBA STORE - Catalogue Articles</title>
    <link>${homeUrl()}</link>
    <description>Flux de produits synchronisés pour Google Merchant Center</description>`;

    arts.forEach(a => {
      const nomBoutique = a.shopName || "BOUBA STORE";
      const imgUrl = /^https?:/.test(a.img || '') ? a.img : (location.origin + '/api/img?id=' + encodeURIComponent(a.id || ''));
      xml += `
    <item>
      <g:id>${esc(a.id || '')}</g:id>
      <title>${esc(a.name || '')}</title>
      <description>${esc(a.desc || a.name || '')}</description>
      <link>${location.origin}/api/p?id=${encodeURIComponent(a.id || '')}</link>
      <g:image_link>${esc(imgUrl)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${Number(a.price) || 0} XOF</g:price>
      <g:brand>${esc(nomBoutique)}</g:brand>
    </item>`;
    });

    xml += `
  </channel>
</rss>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const l = document.createElement('a');
    l.href = url;
    l.download = 'google-shopping-feed.xml';
    document.body.appendChild(l);
    l.click();
    document.body.removeChild(l);
    URL.revokeObjectURL(url);
    console.log('Flux Google Merchant généré avec succès !');
  } catch (e) {
    console.error('Erreur lors de la génération du flux Google:', e);
  }
};
