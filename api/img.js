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
const PID = 'project-f4477c80-7c55-4db7-b2e', FKEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4';
async function shopAvatar(id) {
  try {
    const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/boutiques/' + id + '?key=' + FKEY);
    if (!r.ok) return '';
    const f = (await r.json()).fields || {};
    for (const k of ['avatar', 'logo', 'photo', 'img', 'image']) if (f[k] && f[k].stringValue) return f[k].stringValue;
  } catch (e) {}
  return '';
}
const get = p => fetch(DB + '/' + p + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
module.exports = async (req, res) => {
  try {
    const sid = String(req.query.s || '').replace(/[^\w-]/g, '');
    const id = String(req.query.id || '').replace(/[^\w-]/g, '');
    if (!id && !sid) return res.status(400).end();
    let v = '';
    if (sid) v = await shopAvatar(sid);
    if (!v && id && getArticle) { try { v = pick(await getArticle(id)); } catch (e) {} }
    if (!v && id) {
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
