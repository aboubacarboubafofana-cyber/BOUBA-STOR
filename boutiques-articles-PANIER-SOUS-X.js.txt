// BOUBA STOR - boutiques glissantes avec bouton panier sous X
import { list, mode, lastError, esc, money, intl, shareLinks, homeUrl } from './bouba-data.js';

const css = document.createElement('style');
css.textContent = `
#boutiques-articles{padding:12px}
#boutiques-articles h3{color:#ffd700;text-align:center;margin:8px 0 12px}
.ba-grid{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;padding-bottom:10px}
.ba-grid::-webkit-scrollbar{height:4px}.ba-grid::-webkit-scrollbar-thumb{background:#ffd700;border-radius:4px}
.ba-card{background:#111;border:1px solid #ffd700;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#fff;font-family:Arial,sans-serif;flex:0 0 72%;max-width:270px;scroll-snap-align:start;position:relative}
.ba-card img.ba-m,.ba-card video{width:100%;height:190px;object-fit:cover;background:#000}
.ba-info{padding:10px;display:flex;flex-direction:column;gap:5px;flex:1}
.ba-name{font-weight:bold;font-size:15px}
.ba-price{color:#ffd700;font-size:16px;font-weight:bold}
.ba-desc{font-size:12px;color:#bbb}
.ba-seller{font-size:12px;color:#ffd700}
.ba-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
.ba-b{flex:1;min-width:40px;text-align:center;padding:8px 4px;border-radius:8px;border:none;font-size:13px;font-weight:bold;cursor:pointer;text-decoration:none;color:#000;background:#ffd700;display:flex;align-items:center;justify-content:center}
.ba-g{background:#25D366}.ba-bl{background:#2d7ff9;color:#fff}.ba-d{background:#333;color:#fff}
.ba-share{border-top:1px solid #333;padding-top:6px;margin-top:4px}
.ba-share{display:grid;grid-template-columns:1fr 1fr}
.ba-act{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:2px}
.ba-act button{padding:7px 4px;border-radius:8px;border:1px solid #ffd700;background:#000;color:#ffd700;font-size:11.5px;font-weight:700}
.ba-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:3000;display:flex;align-items:flex-end}
.ba-modal{background:#111;border:1px solid #ffd700;border-radius:16px 16px 0 0;padding:16px;width:100%;max-height:80vh;overflow-y:auto;color:#fff;font-family:Arial,sans-serif}
.ba-modal h3{color:#ffd700;margin:0 0 10px}
.ba-modal .close{float:right;background:none;border:0;color:#ffd700;font-size:20px}
.ba-cart-btn{width:100%;background:linear-gradient(135deg,#ffd700,#b8860b);color:#000;border:0;padding:12px;border-radius:10px;font-weight:900;font-size:14px;margin-top:6px;cursor:pointer;box-shadow:0 2px 10px rgba(255,215,0,.3)}
.ba-cart-btn:active{transform:scale(0.97)}
.ba-toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ffd700;color:#000;padding:12px 20px;border-radius:12px;font-weight:900;z-index:9999;display:none;box-shadow:0 10px 30px rgba(0,0,0,.6)}
`;
document.head.appendChild(css);

// Toast
let toastEl = document.getElementById('baToast');
if(!toastEl){
  toastEl=document.createElement('div');
  toastEl.id='baToast';
  toastEl.className='ba-toast';
  document.body.appendChild(toastEl);
}
function toast(msg){
  toastEl.textContent=msg;
  toastEl.style.display='block';
  setTimeout(()=>toastEl.style.display='none',2000);
  if(navigator.vibrate) navigator.vibrate(40);
}

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
    const diag = md === 'local' ? '<div style="background:#3a0000;border:1px solid #ff5a5a;border-radius:10px;color:#ffb3b3;font-size:12px;padding:8px;margin:0 0 10px;text-align:center">⚠️ Base en ligne inaccessible</div>' : (adm0 ? '<div style="color:#888;font-size:11px;text-align:center;margin-bottom:6px">🟢 Base en ligne • ' + shops.length + ' boutique(s) • ' + arts.length + ' article(s)</div>' : '');
    const byId = Object.fromEntries(shops.map(s => [s.id, s]));
    window.__baData = window.__baData || {};
    const items = arts.slice().sort((a, b) => (b.date || 0) - (a.date || 0));
    
    if (!items.length) { el.innerHTML = diag; return; }
    const fallbackImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    el.innerHTML = '<h3>🏪 Boutiques ➜ glisse (' + items.length + ')</h3>' + diag + '<div class="ba-grid">' + items.map(a => {
      const nomBoutique = a.shopName || "Boutique Partenaire";
      const proprietaire = a.owner || "Vendeur";
      const imageArticle = a.img && a.img.trim() !== '' ? a.img : fallbackImg;
      const telephone = a.phone || (byId[a.shopId]||{}).phone || '';
      window.__baData[a.id] = { a, nomBoutique, telephone };
      const text = `${a.name} - ${money(a.price)} chez ${nomBoutique} sur BOUBA STORE`;
      const link = location.origin + '/api/p?id=' + encodeURIComponent(a.id);
      const chatHref = telephone ? ('amis.html#tel=' + encodeURIComponent(telephone.replace(/\D/g,''))) : '';
      const s = shareLinks(text, link);
      const sh = byId[a.shopId] || {};
      const av = sh.avatar ? `<img src="${sh.avatar}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #ffd700">` : '';
      
      return `<div class="ba-card" data-aid="${esc(a.id)}">
        ${a.video ? `<video src="${a.video}" poster="${imageArticle}" controls playsinline preload="metadata"></video>` : `<img class="ba-m" data-pid="${a.id}" src="${imageArticle}" alt="${esc(a.name)}" loading="lazy">`}
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
            <a class="ba-b ba-g" href="${chatHref || '#'}" ${chatHref ? '' : 'onclick="alert(\\'Numéro indisponible\\');return false;"'}>💬 Discuter</a>
            <a class="ba-b ba-d" href="sms:${esc(telephone)}">✉️</a>
          </div>
          <div class="ba-row ba-share">
            <a class="ba-b ba-g" href="#" onclick="var b=document.getElementById('iaBtn'); if(b){b.click();} setTimeout(function(){var i=document.getElementById('iaInput'); if(i){i.value='Bonjour ${esc(nomBoutique)}, je suis intéressé par : ${esc(a.name)}'; i.focus();}}, 500); return false;">🤖 Discuter avec IA</a>
            <a class="ba-b ba-bl" target="_blank" href="${s.facebook}">Facebook</a>
            <a class="ba-b ba-d" target="_blank" href="${s.telegram}">Telegram</a>
            <a class="ba-b ba-d" target="_blank" href="${s.x}">X</a>
            <button class="ba-b" data-share="${esc(text)}" data-link="${esc(link)}" style="grid-column:span 2">📤 Partager</button>
          </div>
          
          <!-- BOUTON PANIER EN BAS DU BOUTON X - DEMANDÉ PAR LE CLIENT -->
          <button class="ba-cart-btn" onclick="BA.addCart('${esc(a.id)}')">
            🛒 Ajouter au panier
          </button>
          
        </div></div>`;
    }).join('') + '</div>';

    if (window.IMG && typeof window.IMG.need === 'function') {
      items.forEach(a => { window.IMG.need(a.id); });
    }
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
    el.innerHTML = '<div style="color:#888;font-size:11px;padding:6px;text-align:center">Erreur: ' + String(e.message || e) + '</div>'; 
  }
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-share]');
  if (!b) return;
  const text = b.dataset.share;
  if (navigator.share) navigator.share({ title: 'BOUBA STOR', text, url: b.dataset.link || homeUrl() }).catch(() => {});
  else navigator.clipboard && navigator.clipboard.writeText(text + ' ' + (b.dataset.link || homeUrl())).then(() => toast('Lien copié !'));
});

function baModal(title, bodyHtml) {
  let bg = document.getElementById('baModalBg');
  if (bg) bg.remove();
  bg = document.createElement('div');
  bg.id = 'baModalBg'; bg.className = 'ba-modal-bg';
  bg.innerHTML = '<div class="ba-modal"><button class="close" onclick="document.getElementById(\'baModalBg\').remove()">✕</button><h3>' + title + '</h3>' + bodyHtml + '</div>';
  bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg);
}

window.BA = {
  offer(id) {
    const d = (window.__baData || {})[id]; if (!d) return;
    const { a, nomBoutique, telephone } = d;
    const v = prompt('Votre offre pour « ' + a.name + ' »\nPrix actuel : ' + money(a.price) + '\nProposez votre prix (en F) :');
    if (v === null) return;
    const n = Number(String(v).replace(/\D/g, ''));
    if (!n || n >= Number(a.price)) { alert('Proposez un prix inférieur au prix actuel.'); return; }
    if (n < Number(a.price) * 0.5) { alert('Offre trop basse.'); return; }
    if (!telephone) { alert('Numéro indisponible.'); return; }
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
    baModal('📏 Guide des tailles',
      '<p style="color:#aaa;font-size:12px">Mesure du tour de poitrine. Écrivez au vendeur via Discuter.</p>' +
      '<table><tr><th>Taille</th><th>Poitrine (cm)</th></tr>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table>');
  },
  look(id) {
    const d = (window.__baData || {})[id]; if (!d) return;
    const shopId = d.a.shopId;
    const all = Object.values(window.__baData || {}).map(x => x.a).filter(x => x.shopId === shopId && x.id !== id).slice(0, 6);
    if (!all.length) { baModal('👗 Complétez le look', '<p style="color:#aaa">Pas d\'autre article pour cette boutique.</p>'); return; }
    const html = all.map(p => '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #222;cursor:pointer" onclick="document.getElementById(\'baModalBg\').remove();BA.goTo(\'' + p.id + '\')"><img src="' + esc(p.img || '') + '" style="width:46px;height:46px;border-radius:8px;object-fit:cover;background:#222"><div><b>' + esc(p.name) + '</b><br><span style="color:#ffd700">' + money(p.price) + '</span></div></div>').join('');
    baModal('👗 Complétez le look — ' + d.nomBoutique, html);
  },
  goTo(id) {
    const card = document.querySelector('[data-aid="' + id + '"]');
    if (card) { card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); card.style.boxShadow = '0 0 0 3px #ffd700, 0 0 20px #ffd700'; setTimeout(() => card.style.boxShadow = '', 3000); }
  },
  addCart(id){
    const d=(window.__baData||{})[id];
    if(!d){ toast('Article introuvable'); return; }
    const a=d.a;
    // Utilise le système de panier existant de index.html si disponible
    try{
      if(typeof addToCart==='function'){
        addToCart(a.id);
        toast('✅ '+a.name+' ajouté au panier');
        return;
      }
      if(typeof cart!=='undefined' && window.SV){
        const c = JSON.parse(localStorage.getItem('b_cart')||'[]');
        const ex=c.find(x=>x.id===a.id);
        if(ex) ex.qty=(ex.qty||1)+1; else c.push({id:a.id, qty:1});
        localStorage.setItem('b_cart', JSON.stringify(c));
        if(typeof renderCart==='function') renderCart();
        if(typeof renderStore==='function') renderStore();
        toast('✅ '+a.name+' ajouté au panier');
        // Affiche barre panier
        const bar=document.getElementById('cartBar');
        if(bar) bar.style.display='flex';
        return;
      }
      // Fallback simple
      let localCart=JSON.parse(localStorage.getItem('bouba_panier')||'[]');
      localCart.push({name:a.name, price:a.price, id:a.id, date:Date.now()});
      localStorage.setItem('bouba_panier', JSON.stringify(localCart));
      toast('✅ '+a.name+' ajouté - Va dans Panier pour payer sur 0787619717');
    }catch(e){ console.log(e); toast('✅ Ajouté au panier'); }
  }
};

window.__baShow = show;
show();
setInterval(() => { if (!document.hidden) show(); }, 120000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });

// Flux Google
window.genererFluxGoogle = async function() {
  try {
    const [shops, arts] = [await list('boutiques'), await list('articles')];
    let xml = `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://google.com" version="2.0"><channel><title>BOUBA STORE</title><link>${homeUrl()}</link><description>Flux produits</description>`;
    arts.forEach(a => {
      const nomBoutique = a.shopName || "BOUBA STORE";
      xml += `<item><g:id>${esc(a.id || '')}</g:id><title>${esc(a.name || '')}</title><description>${esc(a.desc || a.name || '')}</description><link>${homeUrl()}?item=${esc(a.id || '')}</link><g:image_link>${a.img || ''}</g:image_link><g:condition>new</g:condition><g:availability>in_stock</g:availability><g:price>${a.price} XOF</g:price><g:brand>${esc(nomBoutique)}</g:brand></item>`;
    });
    xml += `</channel></rss>`;
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'google-shopping-feed.xml'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch (e) { console.error(e); }
};
