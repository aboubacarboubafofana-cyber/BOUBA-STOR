---

#### B. Fichier `api/orders.js` (regroupe `mes-commandes.js` et `shop-orders.js`)
```javascript
const crypto = require('crypto');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const PID = 'project-f4477c80-7c55-4db7-b2e', KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4';
const b64 = b => Buffer.from(b).toString('base64url');
let cache = null;

async function tok() {
  if (cache && cache.exp > Date.now() + 60000) return cache.t;
  const sa = JSON.parse(process.env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error('auth');
  cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.t;
}

const rdb = async (m, p, body) => {
  const r = await fetch(DB + '/' + p + '.json?access_token=' + await tok(), { method: m, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json();
};

async function shopOk(id, sig) {
  if (!/^[\w-]{3,60}$/.test(id) || !sig) return false;
  const u = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/boutiques/' + id;
  let r = await fetch(u + '?key=' + KEY);
  if (r.status === 401 || r.status === 403) r = await fetch(u, { headers: { authorization: 'Bearer ' + await tok() } });
  if (!r.ok) return false;
  const f = (await r.json()).fields || {};
  const pw = f.password && f.password.stringValue, st = f.status && f.status.stringValue;
  return pw === sig && st !== 'closed';
}

const d8 = s => String(s || '').replace(/\D/g, '').slice(-8);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const route = (req.query && req.query._route) || '';

  // Route 1 : ex-shop-orders.js
  if (route === 'shop') {
    try {
      const q = req.method === 'POST' ? (req.body || {}) : (req.query || {});
      const shopId = String(q.shopId || ''), sig = String(q.sig || '');
      if (!(await shopOk(shopId, sig))) return res.status(403).json({ orders: [], error: 'refusé' });
      if (req.method === 'POST') {
        const st = String(q.status || ''), id = String(q.orderId || '').replace(/[^\w-]/g, '');
        if (!['confirmée', 'livrée', 'annulée'].includes(st) || !id) return res.status(400).json({ error: 'statut' });
        const o = await rdb('GET', 'orders/' + id);
        if (!o || !(o.items || []).some(x => x.shopId === shopId)) return res.status(403).json({ error: 'pas votre commande' });
        await rdb('PUT', 'orders/' + id + '/status', st);
        return res.status(200).json({ ok: true });
      }
      const all = (await rdb('GET', 'orders')) || {};
      const orders = Object.values(all).filter(o => o && o.id && (o.items || []).some(x => x.shopId === shopId))
        .map(o => { const it = o.items.filter(x => x.shopId === shopId);
          return { id: o.id, date: o.date, status: o.status, name: o.name, phone: o.phone, commune: o.commune || o.city || '', paiement: o.paiement || '', methode: o.methode || '', paye: o.transaction ? 1 : 0, items: it, total: it.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0) }; })
        .sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 100);
      return res.status(200).json({ orders });
    } catch (e) { return res.status(500).json({ orders: [], error: 'erreur' }); }
  }

  // Route 2 : ex-mes-commandes.js
  try {
    const key = String((req.query && req.query.key) || '');
    if (!/^[\w-]{3,80}$/.test(key)) return res.status(400).json({ orders: [] });
    const u = await rdb('GET', 'users/' + key);
    if (!u) return res.status(403).json({ orders: [] });
    const ph = d8(u.phone), em = String(u.email || '').toLowerCase();
    const all = (await rdb('GET', 'orders')) || {};
    const orders = Object.values(all).filter(o => o && o.id && (o.key === key || (ph && d8(o.phone) === ph) || (em && String(o.email || '').toLowerCase() === em)))
      .map(o => ({ id: o.id, date: o.date, status: o.status, total: o.total, items: o.items || [], methode: o.methode || '', paiement: o.paiement || '', transaction: o.transaction ? 'oui' : '' }))
      .sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 100);
    res.status(200).json({ orders });
  } catch (e) { res.status(500).json({ orders: [] }); }
};
