// api/b.js — page d'une boutique : aperçu de partage (photo + infos) + vraie page lisible par Google
const PID = 'project-f4477c80-7c55-4db7-b2e', KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const v = f => !f ? undefined : f.stringValue !== undefined ? f.stringValue : f.integerValue !== undefined ? Number(f.integerValue) : f.doubleValue !== undefined ? f.doubleValue : undefined;
async function getShop(id) {
  const r = await fetch(FS + '/boutiques/' + id + '?key=' + KEY);
  if (!r.ok) return null;
  const f = (await r.json()).fields || {}, o = { id };
  for (const k of Object.keys(f)) { if (k === 'avatar' || k === 'password') continue; const x = v(f[k]); if (x !== undefined) o[k] = x; }
  return o;
}
async function getArticles(id) {
  try {
    const r = await fetch(FS + ':runQuery?key=' + KEY, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'articles' }], where: { fieldFilter: { field: { fieldPath: 'shopId' }, op: 'EQUAL', value: { stringValue: id } } },
        select: { fields: [{ fieldPath: 'name' }, { fieldPath: 'price' }, { fieldPath: 'date' }] }, limit: 24 } }) });
    if (!r.ok) return [];
    return (await r.json()).filter(x => x.document).map(x => { const f = x.document.fields || {}; return { id: x.document.name.split('/').pop(), name: v(f.name), price: v(f.price), date: v(f.date) || 0 }; })
      .sort((a, b) => b.date - a.date);
  } catch (e) { return []; }
}
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').replace(/[^\w-]/g, '');
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  let shop = null, arts = [];
  try { [shop, arts] = await Promise.all([getShop(id), getArticles(id)]); } catch (e) {}
  if (!shop) { res.setHeader('Location', origin + '/index.html'); return res.status(302).end(); }
  const name = shop.name || shop.nom || shop.shopName || shop.title || 'Boutique', owner = shop.owner || shop.proprietaire || '';
  const url = origin + '/api/b?id=' + encodeURIComponent(id);
  const hasAvatar = !!(await fetch(origin + '/api/img?s=' + id, { method: 'HEAD', redirect: 'manual' }).then(r => r.status === 200).catch(() => false));
  const ogImg = hasAvatar ? origin + '/api/og?s=' + id : arts[0] ? origin + '/api/og?id=' + arts[0].id : origin + '/og-bouba.jpg';
  const title = esc('🏪 ' + name + ' — BOUBA STOR ❤');
  const desc = esc('💝 ' + (arts.length ? arts.length + ' article' + (arts.length > 1 ? 's' : '') + ' · ' : '') + (owner ? 'par ' + owner + ' · ' : '') + 'Livraison 24h à Abidjan · Wave, Orange Money, WhatsApp');
  const tel = String(shop.phone || '').replace(/[^\d+]/g, ''), wa = tel.replace(/\D/g, '').length === 10 ? '225' + tel.replace(/\D/g, '') : tel.replace(/\D/g, '');
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Store', name, image: ogImg, url }).replace(/</g, '\\u003c');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + title + '</title><meta name="description" content="' + desc + '"><link rel="canonical" href="' + esc(url) + '">'
    + '<meta property="og:type" content="website"><meta property="og:site_name" content="BOUBA STOR"><meta property="og:locale" content="fr_FR">'
    + '<meta property="og:title" content="' + title + '"><meta property="og:description" content="' + desc + '"><meta property="og:url" content="' + esc(url) + '">'
    + '<meta property="og:image" content="' + esc(ogImg) + '"><meta property="og:image:secure_url" content="' + esc(ogImg) + '"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'
    + '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + title + '"><meta name="twitter:description" content="' + desc + '"><meta name="twitter:image" content="' + esc(ogImg) + '">'
    + '<script type="application/ld+json">' + ld + '</script>'
    + '<style>body{margin:0;background:radial-gradient(circle at 50% 0,#3a0b1a,#000 60%);color:#fff;font-family:Georgia,serif;min-height:100vh}main{max-width:560px;margin:0 auto;padding:18px}'
    + '.top{text-align:center;color:#d4af37;font-weight:800;letter-spacing:1px}.av{width:120px;height:120px;border-radius:50%;object-fit:cover;border:3px solid #d4af37;display:block;margin:14px auto;background:#111}'
    + 'h1{text-align:center;font-size:26px;margin:6px 0}.s{text-align:center;color:#e8a3a3;font-style:italic;margin-bottom:16px}'
    + '.g{display:grid;grid-template-columns:1fr 1fr;gap:12px}.c{background:#120508;border:1px solid #d4af37;border-radius:14px;overflow:hidden;text-decoration:none;color:#fff}'
    + '.c img{width:100%;aspect-ratio:1;object-fit:cover;background:#111;display:block}.c div{padding:8px 10px;font-size:13px}.c b{display:block;color:#ffd700;margin-top:3px}'
    + 'a.b{display:block;text-align:center;padding:14px;border-radius:14px;font-weight:800;text-decoration:none;margin:12px 0;font-family:system-ui,sans-serif}.y{background:#d4af37;color:#000}.k{border:1px solid #d4af37;color:#d4af37}</style></head><body><main>'
    + '<div class="top">BOUBA STOR ❤</div>'
    + (hasAvatar ? '<img class="av" src="' + esc(origin + '/api/img?s=' + id) + '" alt="' + esc(name) + '">' : '')
    + '<h1>' + esc(name) + '</h1><div class="s">' + (owner ? 'par ' + esc(owner) + ' · ' : '') + 'La mode qui fait battre le cœur</div>'
    + '<div class="g">' + arts.slice(0, 12).map(a => '<a class="c" href="' + esc(origin + '/api/p?id=' + a.id) + '"><img loading="lazy" src="' + esc(origin + '/api/img?id=' + a.id) + '" alt="' + esc(a.name) + '"><div>' + esc(a.name) + '<b>' + money(a.price) + '</b></div></a>').join('') + '</div>'
    + '<a class="b y" href="' + esc(origin + '/index.html') + '">🛒 Voir la boutique sur BOUBA STOR</a>'
    + (wa ? '<a class="b k" href="https://wa.me/' + wa + '">💬 Écrire à la boutique</a>' : '')
    + '</main></body></html>');
};
