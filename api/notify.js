// BOUBA STORE : notification ciblée (message, appel) vers un utilisateur précis, via son uid Firestore.
const crypto = require('crypto');
const PID = 'project-f4477c80-7c55-4db7-b2e';
const KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4'; // clé web publique (déjà utilisée par api/p.js et api/img.js)
const b64 = b => Buffer.from(b).toString('base64url');
let cache = null;
async function tok() {
  if (cache && cache.exp > Date.now() + 60000) return cache.t;
  const sa = JSON.parse(process.env.FIREBASE_SA);
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error('auth');
  cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.t;
}
async function getPushToken(uid) {
  if (!/^[\w-]{3,64}$/.test(String(uid || ''))) return null;
  const url = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/users/' + uid;
  let r = await fetch(url + '?key=' + KEY);
  if ((r.status === 401 || r.status === 403) && process.env.FIREBASE_SA) {
    r = await fetch(url, { headers: { authorization: 'Bearer ' + (await tok()) } });
  }
  if (!r.ok) return null;
  const d = await r.json();
  const f = (d.fields || {}).pushToken;
  return f && f.stringValue ? f.stringValue : null;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const toUid = String(b.toUid || '');
    const title = String(b.title || 'BOUBA STOR').slice(0, 60);
    const body = String(b.body || '').slice(0, 150);
    const tag = String(b.tag || 'bouba-chat').slice(0, 30);
    const url = String(b.url || './amis.html').slice(0, 200);
    const tkn = await getPushToken(toUid);
    if (!tkn) return res.status(200).json({ ok: false, reason: 'no-token' });
    const at = await tok();
    const r = await fetch('https://fcm.googleapis.com/v1/projects/' + PID + '/messages:send', {
      method: 'POST', headers: { authorization: 'Bearer ' + at, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { token: tkn, notification: { title, body }, data: { title, body, url, tag }, webpush: { headers: { Urgency: 'high', TTL: '86400' } } } })
    });
    const ok = r.ok;
    if (!ok) {
      const e = JSON.stringify(await r.json().catch(() => ({})));
      if (/UNREGISTERED|NOT_FOUND/.test(e)) { /* jeton périmé : on laisse, sera remplacé à la prochaine ouverture */ }
    }
    return res.status(200).json({ ok });
  } catch (e) {
    console.error(e);
    return res.status(200).json({ ok: false, error: String(e && e.message || e) });
  }
};
