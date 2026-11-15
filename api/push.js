const crypto = require('crypto');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const PID = 'project-f4477c80-7c55-4db7-b2e';
const b64 = b => Buffer.from(b).toString('base64url');
let cache = null;

async function tok() {
 if (cache && cache.exp > Date.now() + 60000) return cache.t;
 const sa = JSON.parse(process.env.FIREBASE_SA);
 const now = Math.floor(Date.now() / 1000);
 const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
 const c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
 const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
 const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
 const j = await r.json();
 if (!j.access_token) throw new Error('auth');
 cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
 return cache.t;
}

async function db(method, path, o = {}) {
 const t = await tok();
 const h = {};
 if (o.etag) h['X-Firebase-ETag'] = 'true';
 if (o.match) h['if-match'] = o.match;
 const r = await fetch(DB + '/' + path + '.json?' + (o.q ? o.q + '&' : '') + 'access_token=' + t, { method, headers: h, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
 return { status: r.status, etag: r.headers.get('etag'), data: r.status === 412 ? null : await r.json().catch(() => null) };
}

// Le format du message (avec la case notification pour Android)
const okImg = i => (typeof i === 'string' && /^https:\/\/[^\s]{4,500}$/.test(i)) ? i : '';
const ADMIN_UID = '7W5OEzTeTNbFLzULLO9VsuDKZFN2', FB_KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4';
async function isAdmin(idToken) {
 try {
  const v = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FB_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }) }).then(r => r.json());
  return !!(v.users && v.users[0].localId === ADMIN_UID);
 } catch (e) { return false }
}
// Format du message : l'image de l'article est ajoutée (notification Android/Chrome + données pour sw.js)
const msg = (tk, title, body, image) => {
 const n = { title: String(title), body: String(body) };
 const wn = { title: String(title), body: String(body), icon: '/icon-192.png', badge: '/icon-192.png' };
 const d = { title: String(title), body: String(body), url: './', tag: 'bouba-new' };
 if (image) { n.image = image; wn.image = image; d.image = image }
 return { message: { token: tk, notification: n, data: d, webpush: { headers: { Urgency: 'high', TTL: '86400' }, notification: wn } } };
};

const uniq = T => { const s = new Set(); return T.filter(([id, v]) => { const t = (v && v.t) || v; if (!t || s.has(t)) return false; s.add(t); return true }) };

async function subscribe(t, dev, u) {
 t = String(t || '');
 if (t.length < 100 || t.length > 400 || !/^[\w:\-]+$/.test(t)) return { ok: false };
 const d = String(dev || '');
 const key = /^[\w-]{8,64}$/.test(d) ? 'd_' + d : crypto.createHash('sha1').update(t).digest('hex');
 const uu = /^[\w+.-]{3,80}$/.test(String(u || '')) ? String(u) : '';
 await db('PUT', 'pushTokens/' + key, { body: uu ? { t, ts: Date.now(), u: uu } : { t, ts: Date.now() } });
 return { ok: true };
}

async function sendAll(title, body, image) {
 const T = uniq(Object.entries((await db('GET', 'pushTokens')).data || {}));
 if (!T.length) return { sent: 0 };
 const at = await tok();
 let ok = 0;
 for (let i = 0; i < T.length; i += 20) {
  await Promise.all(T.slice(i, i + 20).map(async ([id, v]) => {
   const tk = (v && v.t) || v;
   const r = await fetch('https://fcm.googleapis.com/v1/projects/' + PID + '/messages:send', { method: 'POST', headers: { 'Authorization': 'Bearer ' + at, 'content-type': 'application/json' }, body: JSON.stringify(msg(tk, title, body, image)) });
   if (r.ok) ok++;
  }));
 }
 return { sent: ok };
}


// Articles publiés par les boutiques (Firestore) : photo retrouvée par l'identifiant, sinon via le dernier article publié
async function latestImg(req, body, id) {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  const mk = i => origin + '/api/img?id=' + encodeURIComponent(i) + '&t=' + Date.now();
  if (/^[\w-]{3,60}$/.test(String(id || ''))) return mk(id);
  let L = null;
  try { L = require('./_art.js').listArticles; } catch (e) {}
  if (!L) return '';
  for (let i = 0; i < 3; i++) {
    try {
      const a = (await L()).sort((x, y) => (y.date || 0) - (x.date || 0))[0];
      if (a && (!a.date || Date.now() - a.date < 10 * 60000) && (!body || !a.name || String(body).includes(a.name))) return mk(a.id);
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1500));
  }
  return '';
}

// Notification ciblée vers UN ami (message, photo, vocal, appel) — même application fermée
async function sendTo(b) {
  const okk = k => /^[\w+.-]{3,80}$/.test(String(k || ''));
  const from = String(b.fromKey || ''), to = String(b.toKey || '');
  if (!okk(from) || !okk(to) || from === to) return { sent: 0 };
  const fu = (await db('GET', 'users/' + from)).data;           // l'expéditeur doit être inscrit
  if (!fu) return { sent: 0 };
  const T = uniq(Object.entries((await db('GET', 'pushTokens')).data || {})).filter(([id, v]) => v && v.u === to);
  if (!T.length) return { sent: 0 };
  const call = b.kind === 'call';
  const title = String(b.title || fu.name || 'BOUBA STOR').slice(0, 60), body = String(b.body || '').slice(0, 140);
  const url = String(b.url || 'amis.html').replace(/[^\w.:/#?=&%+-]/g, '').slice(0, 200);
  const cid = /^[\w-]{6,40}$/.test(String(b.callId || '')) ? String(b.callId) : '';
  const at = await tok();
  let ok = 0;
  await Promise.all(T.map(async ([id, v]) => {
    const message = { token: v.t, data: { title, body, url, tag: call ? 'bouba-call' : 'bouba-chat-' + from, type: call ? 'call' : 'msg', callId: cid },
      android: { priority: 'HIGH', ttl: call ? '30s' : '86400s' },
      webpush: { headers: { Urgency: 'high', TTL: call ? '30' : '86400' } } };
    const r = await fetch('https://fcm.googleapis.com/v1/projects/' + PID + '/messages:send', { method: 'POST', headers: { 'Authorization': 'Bearer ' + at, 'content-type': 'application/json' }, body: JSON.stringify({ message }) });
    if (r.ok) ok++;
  }));
  return { sent: ok };
}

module.exports = async (req, res) => {
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Headers', 'content-type');
 res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
 if (req.method === 'OPTIONS') return res.status(204).end();
 try {
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.act === 'new') {
    let img = okImg(b.image);
    if (!img && b.kind !== 'boutique') img = await latestImg(req, b.body || '', b.id);
    const out = await sendAll(b.title || '🆕 Nouvel article', b.body || '', img);
    return res.status(200).json(out);
  }
  else if (b.act === 'manual') {
    if (!(await isAdmin(b.idToken))) return res.status(403).json({ ok: false });
    const out = await sendAll(b.title, b.body, okImg(b.image));
    return res.status(200).json(out);
  }
  if (b.act === 'to') return res.status(200).json(await sendTo(b));
  res.status(200).json(b.act === 'sub' ? await subscribe(b.token, b.dev, b.uid) : { ok: true });
 } catch (e) { res.status(500).json({ ok: false }) }
};
