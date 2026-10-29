// BOUBA STORE - affiche les articles publiés par les boutiques sur l'accueil
import { list, mode, lastError, esc, money, intl, shareLinks, homeUrl } from './bouba-data.js';

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

async function show() {
  const el = box();
  
  if (!el.innerHTML.trim() || el.innerHTML.includes('ba-card')) {
    el.innerHTML = '<h3>🏪 Boutiques</h3><div class="ba-grid">' + 
      Array(3).fill('<div class="ba-card" style="height:350px;"><div style="height:190px;background:#222;"></div><div class="ba-info"><div style="height:15px;width:80%;background:#333;margin-bottom:8px;border-radius:4px;"></div><div style="height:15px;width:40%;background:#333;border-radius:4px;"></div></div></div>').join('') + 
      '</div>';
  }

  try {
    const [shops, arts] = [await list('boutiques'), await list('articles')];
    const md = await mode(), adm0 = (typeof isAdmin !== 'undefined' && isAdmin);
    const diag = md === 'local' ? '<div style="background:#3a0000;border:1px solid #ff5a5a;border-radius:10px;color:#ffb3b3;font-size:12px;padding:8px;margin:0 0 10px;text-align:center">⚠️ La base en ligne est inaccessible : seuls les articles de CE téléphone s\'affichent.' + (adm0 ? '<br>Cause : <b>' + esc(lastError() || 'inconnue') + '</b>' : '') + '</div>' : (adm0 ? '<div style="color:#888;font-size:11px;text-align:center;margin-bottom:6px">🟢 Base en ligne • ' + shops.length + ' boutique(s) • ' + arts.length + ' article(s)</div>' : '');
    const open = new Set(shops.filter(s => s.status !== 'closed').map(s => s.id));
    const byId = Object.fromEntries(shops.map(s => [s.id, s]));
    const all = arts.slice().sort((a, b) => (b.date || 0) - (a.date || 0));
    const visible = all.filter(a => open.has(a.shopId)), hidden = all.filter(a => !open.has(a.shopId));
    const adm = (typeof isAdmin !== 'undefined' && isAdmin);
    const items = (adm && window.__baHidden) ? all : visible;
    const note = (adm && hidden.length) ? '<div style="background:#2a2200;border:1px solid #ffd700;border-radius:10px;color:#ffd700;font-size:12px;padding:8px;margin:0 0 10px;text-align:center">⚠️ ' + hidden.length + ' article(s) masqué(s) : leur boutique est fermée ou supprimée.<br><button class="ba-b" style="margin-top:6px;flex:none;padding:6px 12px" onclick="window.__baHidden=!window.__baHidden;window.__baShow()">' + (window.__baHidden ? 'Les cacher' : 'Les afficher') + '</button></div>' : '';
    
    if (!items.length) { el.innerHTML = diag + note; return; }
    
    const blankImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    el.innerHTML = '<h3>🏪 Boutiques ➜ glisse (' + items.length + ')</h3>' + diag + note + '<div class="ba-grid">' + items.map(a => {
      const text = `${a.name} - ${money(a.price)} chez ${a.shopName} sur BOUBA STORE`;
      const s = shareLinks(text, homeUrl()), p = intl(a.phone), sh = byId[a.shopId] || {};
      const av = sh.avatar ? `<img src="${sh.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #ffd700">` : '';
      const off = !open.has(a.shopId) ? '<div style="background:#a00;color:#fff;font-size:11px;text-align:center;padding:3px">Boutique fermée ou supprimée</div>' : '';
      return `<div class="ba-card">${off}${a.video ? `<video src="${a.video}" poster="${a.img || blankImg}" controls playsinline preload="metadata"></video>` : `<img class="ba-m" src="${a.img || blankImg}" alt="${esc(a.name)}" loading="lazy">`}
        <div class="ba-info">
          <div class="ba-name">${esc(a.name)}</div>
          <div class="ba-price">${money(a.price)}</div>
          ${a.desc ? `<div class="ba-desc">${esc(a.desc)}</div>` : ''}
          <div class="ba-desc">${esc(a.cat || '')}</div>
          <div class="ba-seller" style="display:flex;align-items:center;gap:8px">${av}<span>🏪 ${esc(a.shopName)}<br>👤 ${esc(a.owner)}</span></div>
          <div class="ba-row">
            <a class="ba-b ba-bl" href="tel:${esc(a.phone)}">📞</a>
            <a class="ba-b ba-g" href="#" onclick="if(window.ouvrirChat)window.ouvrirChat('${esc(a.shopName)}', '${esc(a.name)}'); return false;">💬 Discuter</a>
            <a class="ba-b ba-d" href="sms:${esc(a.phone)}">✉️</a>
          </div>
          <div class="ba-row ba-share">
            <a class="ba-b ba-g" target="_blank" href="${s.whatsapp}">WhatsApp</a>
            <a class="ba-b ba-bl" target="_blank" href="${s.facebook}">Facebook</a>
            <a class="ba-b ba-d" target="_blank" href="${s.telegram}">Telegram</a>
            <a class="ba-b ba-d" target="_blank" href="${s.x}">X</a>
            <button class="ba-b" data-share="${esc(text)}">📤 Partager</button>
          </div>
        </div></div>`;
    }).join('') + '</div>';
  } catch (e) { console.error('articles-accueil:', e); el.innerHTML = '<div style="color:#888;font-size:11px;padding:6px;text-align:center">Articles boutiques : ' + String(e.message || e) + '</div>'; }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-share]');
  if (!b) return;
  const text = b.dataset.share;
  if (navigator.share) navigator.share({ title: 'BOUBA STORE', text, url: homeUrl() }).catch(() => {});
  else navigator.clipboard && navigator.clipboard.writeText(text + ' ' + homeUrl()).then(() => alert('Lien copié !'));
});

window.__baShow = show;
show();
setInterval(() => { if (!document.hidden) show(); }, 120000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });

window.genererFluxGoogle = async function() {
  try {
    const [shops, arts] = [await list('boutiques'), await list('articles')];
    const open = new Set(shops.filter(s => s.status !== 'closed').map(s => s.id));
    const visibles = arts.filter(a => open.has(a.shopId));
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n<channel>\n<title>BOuba STOR</title>\n<link>https://bouba-stor.vercel.app/</link>\n<description>Boutique en ligne</description>\n`;
    
    visibles.forEach(a => {
      xml += `<item>\n`;
      xml += `<g:id>${a.id}</g:id>\n`;
      xml += `<g:title>${a.name}</g:title>\n`;
      xml += `<g:description>${a.desc || a.name}</g:description>\n`;
      xml += `<g:link>https://bouba-stor.vercel.app/</g:link>\n`;
      xml += `<g:image_link>${a.img}</g:image_link>\n`;
      xml += `<g:price>${a.price} XOF</g:price>\n`;
      xml += `<g:availability>in stock</g:availability>\n`;
      xml += `<g:condition>new</g:condition>\n`;
      xml += `</item>\n`;
    });
    
    xml += `</channel>\n</rss>`;
    alert("FLUX PRÊT ! Copie ce texte et colle-le dans ton fichier produits.xml sur GitHub :\n\n" + xml);
  } catch (e) {
    alert("Erreur : " + e.message);
  }
};

// Fonction pour ouvrir le chat avec le produit pré-rempli
window.ouvrirChat = function(vendeur, produit) {
  const btnAide = document.getElementById('iaBtn') || document.querySelector('.chat-fab, .fab');
  if (btnAide) btnAide.click();
  
  setTimeout(() => {
    const input = document.getElementById('iaInput') || document.querySelector('input[placeholder*="message"]');
    if (input) {
      input.value = `Bonjour ${vendeur}, je suis intéressé par : ${produit}`;
      input.focus();
    }
  }, 600);
};
