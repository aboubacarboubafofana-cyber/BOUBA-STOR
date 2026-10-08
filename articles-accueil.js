// BOUBA STORE - affiche les articles publiés par les boutiques sur l'accueil
import { list, esc, money, intl, shareLinks, homeUrl } from './bouba-data.js';

const css = document.createElement('style');
css.textContent = `
#boutiques-articles{padding:12px}
#boutiques-articles h3{color:#ffd700;text-align:center;margin:8px 0 12px}
.ba-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ba-card{background:#111;border:1px solid #ffd700;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#fff;font-family:Arial,sans-serif}
.ba-card img{width:100%;height:170px;object-fit:cover}
.ba-info{padding:10px;display:flex;flex-direction:column;gap:5px;flex:1}
.ba-name{font-weight:bold;font-size:15px}
.ba-price{color:#ffd700;font-size:16px;font-weight:bold}
.ba-desc{font-size:12px;color:#bbb}
.ba-seller{font-size:12px;color:#ffd700}
.ba-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
.ba-b{flex:1;min-width:40px;text-align:center;padding:8px 4px;border-radius:8px;border:none;font-size:13px;font-weight:bold;cursor:pointer;text-decoration:none;color:#000;background:#ffd700}
.ba-g{background:#25D366}.ba-bl{background:#2d7ff9;color:#fff}.ba-d{background:#333;color:#fff}
.ba-share{border-top:1px solid #333;padding-top:6px;margin-top:4px}
`;
document.head.appendChild(css);

function box() {
  let el = document.getElementById('boutiques-articles');
  if (!el) {
    el = document.createElement('div');
    el.id = 'boutiques-articles';
    const nav = document.querySelector('.bottom-nav, nav, footer');
    nav ? nav.parentNode.insertBefore(el, nav) : document.body.appendChild(el);
  }
  return el;
}

async function show() {
  try {
    const [shops, arts] = [await list('boutiques'), await list('articles')];
    const open = new Set(shops.filter(s => s.status !== 'closed').map(s => s.id));
    const byId = Object.fromEntries(shops.map(s => [s.id, s]));
    const items = arts.filter(a => open.has(a.shopId)).sort((a, b) => b.date - a.date);
    const el = box();
    if (!items.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<h3>🏪 Articles des boutiques</h3><div class="ba-grid">' + items.map(a => {
      const text = `${a.name} - ${money(a.price)} chez ${a.shopName} sur BOUBA STORE`;
      const s = shareLinks(text, homeUrl()), p = intl(a.phone), sh = byId[a.shopId] || {};
      const av = sh.avatar ? `<img src="${sh.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #ffd700">` : '';
      return `<div class="ba-card"><img src="${a.img}" alt="${esc(a.name)}">
        <div class="ba-info">
          <div class="ba-name">${esc(a.name)}</div>
          <div class="ba-price">${money(a.price)}</div>
          ${a.desc ? `<div class="ba-desc">${esc(a.desc)}</div>` : ''}
          <div class="ba-desc">${esc(a.cat || '')}</div>
          <div class="ba-seller" style="display:flex;align-items:center;gap:8px">${av}<span>🏪 ${esc(a.shopName)}<br>👤 ${esc(a.owner)}</span></div>
          <div class="ba-row">
            <a class="ba-b ba-bl" href="tel:${esc(a.phone)}">📞</a>
            <a class="ba-b ba-g" target="_blank" href="https://wa.me/${p}?text=${encodeURIComponent('Bonjour, je suis intéressé par : ' + a.name)}">💬 Écrire</a>
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
  } catch (e) { console.error('articles-accueil:', e); }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-share]');
  if (!b) return;
  const text = b.dataset.share;
  if (navigator.share) navigator.share({ title: 'BOUBA STORE', text, url: homeUrl() }).catch(() => {});
  else navigator.clipboard && navigator.clipboard.writeText(text + ' ' + homeUrl()).then(() => alert('Lien copié !'));
});

show();
setInterval(show, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });
