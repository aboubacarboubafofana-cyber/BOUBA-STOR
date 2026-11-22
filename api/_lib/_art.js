// BOUBA STOR : lecture UNIQUE des articles, boutiques et photos.
// Source principale : Firestore ("articles", "boutiques"). Secours : Realtime Database ("products").
// Les photos ne sont jamais chargées avec le reste (champs demandés un par un) => réponses rapides.
const crypto = require('crypto');
const PID = 'project-f4477c80-7c55-4db7-b2e';
const KEY = 'AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4'; // clé web publique
const RTDB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const FS = 'https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents';
const SHOP = 'BOUBA STOR';
const LIGHT = ['name', 'price', 'cat', 'desc', 'date', 'shopId', 'shopName', 'phone', 'owner', 'stock'];
const b64 = b => Buffer.from(b).toString('base64url');
const cleanId = s => { s = String(s == null ? '' : s).replace(/[^\w-]/g, ''); return /^[\w-]{3,60}$/.test(s) ? s : ''; };

// fetch avec délai maximum (évite qu'un lien de partage reste bloqué)
async function tfetch(url, opts, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 4500);
  try { return await fetch(url, Object.assign({}, opts || {}, { signal: c.signal })); } finally { clearTimeout(t); }
}

let cache = null;
async function tok() {
  if (cache && cache.exp > Date.now() + 60000) return cache.t;
  const sa = JSON.parse(process.env.FIREBASE_SA);
  const now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
  const r = await tfetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
  const j = await r.json();
  if (!j.access_token) throw new Error('auth');
  cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cache.t;
}

// Conversion complète des valeurs Firestore (texte, nombres, dates, booléens, listes, objets)
function val(f) {
  if (!f) return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return Number(f.integerValue);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('timestampValue' in f) return Date.parse(f.timestampValue) || undefined;
  if ('nullValue' in f) return null;
  if ('arrayValue' in f) return (f.arrayValue.values || []).map(val);
  if ('mapValue' in f) { const o = {}, m = f.mapValue.fields || {}; for (const k in m) o[k] = val(m[k]); return o; }
  return undefined;
}
function fields(f) { const o = {}; for (const k of Object.keys(f || {})) { const v = val(f[k]); if (v !== undefined) o[k] = v; } return o; }

async function auth(url, opts) {
  let r = await tfetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'key=' + KEY, opts);
  if ((r.status === 401 || r.status === 403) && process.env.FIREBASE_SA) {
    const o = Object.assign({}, opts || {}); o.headers = Object.assign({}, o.headers || {}, { authorization: 'Bearer ' + await tok() });
    r = await tfetch(url, o);
  }
  return r;
}
// Lit un document Firestore en ne demandant que les champs listés
async function fsDoc(path, want) {
  const q = (want || []).map(f => 'mask.fieldPaths=' + encodeURIComponent(f)).join('&');
  const r = await auth(FS + '/' + path + (q ? '?' + q : ''));
  if (!r.ok) return null;
  const d = await r.json();
  return fields(d.fields);
}
async function rtdb(path) {
  try { const r = await tfetch(RTDB + '/' + path + '.json'); return r.ok ? await r.json() : null; } catch (e) { return null; }
}

function norm(id, o, source) {
  if (!o || !o.name) return null;
  return {
    id, name: String(o.name), price: Number(o.price) || 0, cat: o.cat || '', desc: o.desc || '',
    date: Number(o.date) || 0, shopId: o.shopId || '',
    shopName: String(o.shopName || SHOP).replace(/BOUBA\s*STORE/gi, SHOP).replace(/BOuba[\s-]*STOR/g, SHOP),
    phone: o.phone || '', source
  };
}

async function getArticle(id) {
  id = cleanId(id); if (!id) return null;
  try { const a = norm(id, await fsDoc('articles/' + id, LIGHT), 'articles'); if (a) return a; } catch (e) {}
  const g = f => rtdb('products/' + id + '/' + f);
  const [name, price, cat, date, phone, desc] = await Promise.all(['name', 'price', 'cat', 'date', 'phone', 'desc'].map(g));
  return norm(id, { name, price, cat, date, phone, desc }, 'products');
}

// Recherche par nom (secours quand le lien n'a pas d'identifiant)
async function findByName(name) {
  name = String(name || '').trim().slice(0, 120); if (!name) return null;
  try {
    const body = JSON.stringify({ structuredQuery: { from: [{ collectionId: 'articles' }], where: { fieldFilter: { field: { fieldPath: 'name' }, op: 'EQUAL', value: { stringValue: name } } }, select: { fields: LIGHT.map(f => ({ fieldPath: f })) }, limit: 1 } });
    const r = await auth(FS + ':runQuery', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    if (r.ok) { const arr = await r.json(); const d = (arr || []).find(x => x.document); if (d) return norm(d.document.name.split('/').pop(), fields(d.document.fields), 'articles'); }
  } catch (e) {}
  return null;
}

async function getPhoto(id) {
  id = cleanId(id); if (!id) return null;
  try { const o = await fsDoc('photos/' + id, ['img']); if (o && o.img) return o.img; } catch (e) {}
  try { const o = await fsDoc('articles/' + id, ['img']); if (o && o.img) return o.img; } catch (e) {}
  // produits de l'accueil : la photo est rangée à part, dans productimgs/ID
  const v = await rtdb('productimgs/' + id);
  if (typeof v === 'string' && v) return v;
  const w = await rtdb('products/' + id + '/img');
  return typeof w === 'string' ? w : null;
}
// Articles d'une boutique (sans photo)
async function listByShop(sid, n) {
  sid = cleanId(sid); if (!sid) return [];
  try {
    const body = JSON.stringify({ structuredQuery: { from: [{ collectionId: 'articles' }], where: { fieldFilter: { field: { fieldPath: 'shopId' }, op: 'EQUAL', value: { stringValue: sid } } }, select: { fields: LIGHT.map(f => ({ fieldPath: f })) }, limit: n || 12 } });
    const r = await auth(FS + ':runQuery', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    if (!r.ok) return [];
    return ((await r.json()) || []).filter(x => x.document).map(d => norm(d.document.name.split('/').pop(), fields(d.document.fields), 'articles')).filter(Boolean).sort((a, b) => b.date - a.date);
  } catch (e) { return []; }
}
async function getShop(sid, want) {
  sid = cleanId(sid); if (!sid) return null;
  try { const o = await fsDoc('boutiques/' + sid, want || ['name', 'desc', 'avatar']); return o && o.name ? o : null; } catch (e) { return null; }
}
function decodePhoto(s) {
  s = String(s || '');
  if (s.slice(0, 11) !== 'data:image/') return null;
  const i = s.indexOf(';base64,'); if (i < 0) return null;
  const buf = Buffer.from(s.slice(i + 8), 'base64');
  return buf.length > 200 ? { type: s.slice(5, i), buf } : null;
}

// Tous les articles (sans photo) : flux Google, etc.
async function listArticles() {
  const want = ['id', 'name', 'price', 'shopName', 'cat', 'desc', 'date', 'phone'];
  const base = FS + '/articles?pageSize=300&' + want.map(f => 'mask.fieldPaths=' + f).join('&');
  const out = []; let page = '', n = 0;
  do {
    const r = await auth(base + (page ? '&pageToken=' + encodeURIComponent(page) : ''));
    if (!r.ok) break;
    const d = await r.json();
    for (const doc of d.documents || []) { const o = fields(doc.fields); o.id = doc.name.split('/').pop(); if (o.shopName) o.shopName = norm(o.id, { name: 'x', shopName: o.shopName }).shopName; out.push(o); }
    page = d.nextPageToken || '';
  } while (page && ++n < 10);
  return out;
}
module.exports = { getArticle, findByName, listByShop, getPhoto, getShop, decodePhoto, listArticles, tfetch, cleanId, SHOP, fsDoc, rtdb, RTDB };
