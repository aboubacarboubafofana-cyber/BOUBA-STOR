const PID = 'project-f4477c80-7c55-4db7-b2e', KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const v = f => !f ? undefined : f.stringValue !== undefined ? f.stringValue : f.integerValue !== undefined ? Number(f.integerValue) : f.doubleValue !== undefined ? f.doubleValue : undefined;
async function getShop(id) { try { const r = await fetch(FS + '/boutiques/' + id + '?key=' + KEY); if (!r.ok) return null; const f = (await r.json()).fields || {}, o = { id }; for (const k of Object.keys(f)) { const x = v(f[k]); if (x !== undefined) o[k] = x; } return o; } catch(e) { return null; } }
async function getArticles(id) { try { const r = await fetch(FS + ':runQuery?key=' + KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'articles' }], where: { fieldFilter: { field: { fieldPath: 'shopId' }, op: 'EQUAL', value: { stringValue: id } } }, select: { fields: [{ fieldPath: 'name' }, { fieldPath: 'price' }] }, limit: 12 } }) }); if (!r.ok) return []; return (await r.json()).filter(x => x.document).map(x => { const f = x.document.fields || {}; return { id: x.document.name.split('/').pop(), name: v(f.name), price: v(f.price) }; }); } catch (e) { return []; } }
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').replace(/[^\w-]/g, ''); const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  let shop = null, arts = []; try { [shop, arts] = await Promise.all([getShop(id), getArticles(id)]); } catch (e) {}
  if (!shop) { res.setHeader('Location', origin + '/index.html'); return res.status(302).end(); }
  const name = shop.name || shop.nom || 'Boutique'; const url = origin + '/api/b?id=' + encodeURIComponent(id);
  const ogImg = origin + '/api/og?s=' + id; const title = esc('🏪 ' + name + ' — BOUBA STOR');
  const desc = esc('Découvrez les articles de ' + name + ' · Livraison 24h à Abidjan');
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'public, s-maxage=300');
  res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + title + '</title><meta name="description" content="' + desc + '"><link rel="canonical" href="' + esc(url) + '">'
    + '<meta property="og:type" content="website"><meta property="og:title" content="' + title + '"><meta property="og:description" content="' + desc + '"><meta property="og:url" content="' + esc(url) + '">'
    + '<meta property="og:image" content="' + esc(ogImg) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'
    + '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(ogImg) + '">'
    + '<style>body{margin:0;background:#000;color:#fff;font-family:Georgia,serif}main{max-width:560px;margin:0 auto;padding:18px}'
    + '.top{text-align:center;color:#d4af37;font-weight:800}h1{text-align:center;font-size:26px}.g{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
    + '.c{background:#111;border:1px solid #d4af37;border-radius:14px;overflow:hidden;text-decoration:none;color:#fff}.c img{width:100%;aspect-ratio:1;object-fit:cover}'
    + '.c div{padding:8px;font-size:13px}.c b{display:block;color:#ffd700}a.b{display:block;text-align:center;padding:14px;border-radius:14px;font-weight:800;text-decoration:none;margin:12px 0;background:#d4af37;color:#000}</style></head><body><main>'
    + '<div class="top">BOUBA STOR ❤</div><h1>' + esc(name) + '</h1><div class="g">'
    + arts.map(a => '<a class="c" href="' + esc(origin + '/api/p?id=' + a.id) + '"><img src="' + esc(origin + '/api/img?id=' + a.id) + '"><div>' + esc(a.name) + '<b>' + money(a.price) + '</b></div></a>').join('')
    + '</div><a class="b" href="' + esc(origin + '/index.html') + '">🛒 Voir sur BOUBA STOR</a></main></body></html>');
};
