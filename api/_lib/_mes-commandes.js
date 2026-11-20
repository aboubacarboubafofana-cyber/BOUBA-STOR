// api/mes-commandes.js — renvoie UNIQUEMENT les commandes du client identifié par sa clé de compte
const crypto = require('crypto');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const b64 = b => Buffer.from(b).toString('base64url');
let cache = null;
async function tok() {
  if (cache && cache.exp > Date.now() + 60000) return cache.t;
  const sa = JSON.parse(process.env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error('auth');
  cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.t;
}
const get = async p => (await fetch(DB + '/' + p + '.json?access_token=' + await tok())).json();
const d8 = s => String(s || '').replace(/\D/g, '').slice(-8);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const key = String((req.query && req.query.key) || '');
    if (!/^[\w-]{3,80}$/.test(key)) return res.status(400).json({ orders: [] });
    const u = await get('users/' + key);
    if (!u) return res.status(403).json({ orders: [] });
    const ph = d8(u.phone), em = String(u.email || '').toLowerCase();
    const all = (await get('orders')) || {};
    const orders = Object.values(all).filter(o => o && o.id && (o.key === key || (ph && d8(o.phone) === ph) || (em && String(o.email || '').toLowerCase() === em)))
      .map(o => ({ id: o.id, date: o.date, status: o.status, total: o.total, items: o.items || [], methode: o.methode || '', paiement: o.paiement || '', transaction: o.transaction ? 'oui' : '' }))
      .sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 100);
    res.status(200).json({ orders });
  } catch (e) { res.status(500).json({ orders: [] }); }
};
