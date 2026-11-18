const crypto = require('crypto');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const b64 = b => Buffer.from(b).toString('base64url');
let cache = null;

async function tok() {
  if (cache && cache.exp > Date.now() + 60000) return cache.t;
  const sa = JSON.parse(process.env.FIREBASE_SA), now = Math.floor(Date.now() / 1000);
  const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' })), c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://googleapis.com https://googleapis.com', aud: 'https://googleapis.com', iat: now, exp: now + 3600 }));
  const sig = crypto.createSign('RSA-SHA256').update(h + '.' + c).sign(sa.private_key, 'base64url');
  const r = await fetch('https://googleapis.com', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + h + '.' + c + '.' + sig });
  const j = await r.json(); if (!j.access_token) throw new Error('auth');
  cache = { t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }; return cache.t;
}

async function db(method, path, body) {
  const t = await tok();
  const r = await fetch(DB + '/' + path + '.json?access_token=' + t, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.json().catch(() => null);
}

const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const eq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const route = (req.query && req.query._route) || '';

  // Route 1 : ex-social.js
  if (route === 'social') {
    try {
      const id = String(b.id || '').replace(/[^\w-]/g, '').slice(0, 40);
      if (!id) return res.status(200).json({ ok: false, err: 'Article manquant.' });
      const PAGE = process.env.FB_PAGE_ID, TOKEN = process.env.FB_PAGE_TOKEN, HOOK = process.env.SOCIAL_WEBHOOK_URL;
      if (!(PAGE && TOKEN) && !HOOK) return res.status(200).json({ ok: false, err: 'non configuré', configured: false });
      if (b.force) {
        const real = String(process.env.ADMIN_CODE || '');
        if (!real || !eq(sha(b.code || ''), sha(real))) { await sleep(700); return res.status(200).json({ ok: false, err: 'Code administrateur incorrect.' }); }
      } else {
        if (await db('GET', 'socialposted/' + id)) return res.status(200).json({ ok: true, already: true });
        const last = +(await db('GET', 'socialrate')) || 0;
        if (Date.now() - last < 3000) return res.status(200).json({ ok: false, err: 'Trop de demandes, réessayez.' });
      }
      await db('PUT', 'socialrate', Date.now());
      let p = null;
      for (let i = 0; i < 4; i++) { p = await db('GET', 'products/' + id); if (p && p.name) break; await sleep(1200); }
      if (!p || !p.name) return res.status(200).json({ ok: false, err: 'Article introuvable.' });
      const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app').replace(/[^\w.:-]/g, '');
      const site = 'https://' + host, link = site + '/api/p?id=' + id;
      const msg = '🆕 ' + p.name + '\n💰 ' + Number(p.price || 0).toLocaleString('fr-FR') + ' F' + (p.cat ? ' • ' + p.cat : '') + '\n🛒 Commandez sur BOUBA STORE : ' + site + '\n💬 WhatsApp : +225 07 87 61 97 17';
      const out = {};
      if (PAGE && TOKEN) {
        try {
          const m = /^data:(image\/[a-z]+);base64,([\s\S]+)$/.exec(String(p.img || '')); let r;
          if (m) { const fd = new FormData(); fd.append('source', new Blob([Buffer.from(m[2], 'base64')], { type: m[1] }), 'article.jpg'); fd.append('caption', msg); fd.append('access_token', TOKEN); r = await fetch('https://facebook.com' + PAGE + '/photos', { method: 'POST', body: fd }); }
          else r = await fetch('https://facebook.com' + PAGE + '/feed', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: msg, link: site, access_token: TOKEN }) });
          const j = await r.json();
          out.facebook = (j.id || j.post_id) ? { ok: true, id: j.post_id || j.id } : { ok: false, err: (j.error && j.error.message) || 'Erreur Facebook' };
        } catch (e) { out.facebook = { ok: false, err: 'Facebook injoignable' }; }
      }
      if (HOOK) {
        try { const r = await fetch(HOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: 'new_article', id: id, name: p.name, price: p.price, category: p.cat || '', message: msg, link: link, imageUrl: site + '/api/img?id=' + id, site: site }) }); out.webhook = { ok: r.ok }; }
        catch (e) { out.webhook = { ok: false, err: 'Webhook injoignable' }; }
      }
      const any = Object.values(out).some(x => x && x.ok);
      if (any) await db('PUT', 'socialposted/' + id, { date: Date.now(), facebook: !!(out.facebook && out.facebook.ok), webhook: !!(out.webhook && out.webhook.ok) });
      return res.status(200).json({ ok: any, results: out, configured: true });
    } catch (e) { return res.status(200).json({ ok: false, err: 'Erreur du serveur. Vérifiez FIREBASE_SA, FB_PAGE_ID et FB_PAGE_TOKEN sur Vercel.' }); }
  }

  // Route 2 : ex-admin.js
  const code = String(b.code || '');
  const real = String(process.env.ADMIN_CODE || '');
  const ha = crypto.createHash('sha256').update(code).digest();
  const hb = crypto.createHash('sha256').update(real).digest();
  const ok = !!real && crypto.timingSafeEqual(ha, hb);
  if (!ok) await new Promise(r => setTimeout(r, 700));
  res.status(200).json({ ok });
};
    
