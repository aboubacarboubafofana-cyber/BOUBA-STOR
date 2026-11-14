// api/img.js — sert la photo d'un article (boutiques ET produits) en vraie URL https
// Utilisée par la page /api/p, les aperçus Facebook/WhatsApp et les notifications.
const DB = "https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app";
let getArticle = null;
try { getArticle = require('./_art.js').getArticle; } catch (e) {}
const pick = v => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return pick(v.img || v.data || v.src || v.url || v.photo || v.image);
  return '';
};
const get = p => fetch(DB + '/' + p + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
module.exports = async (req, res) => {
  try {
    const id = String(req.query.id || '').replace(/[^\w-]/g, '');
    if (!id) return res.status(400).end();
    let v = '';
    if (getArticle) { try { v = pick(await getArticle(id)); } catch (e) {} }
    if (!v) {
      const found = await Promise.all(['articles/' + id + '/img', 'products/' + id + '/img', 'photos/' + id, 'imgs/' + id, 'images/' + id, 'img/' + id].map(get));
      v = found.map(pick).find(Boolean) || '';
    }
    if (!v) return res.redirect(302, '/icon-512.png');
    if (/^https?:/.test(v)) return res.redirect(302, v);
    const m = /^data:(image\/[\w+.-]+);base64,([\s\S]*)$/.exec(v);
    if (!m) return res.redirect(302, '/icon-512.png');
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(Buffer.from(m[2], 'base64'));
  } catch (e) { res.redirect(302, '/icon-512.png'); }
};
