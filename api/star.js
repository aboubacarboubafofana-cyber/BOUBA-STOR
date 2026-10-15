/* BOUBA STORE - SUPER STAR : API SERVEUR (Vercel, Node.js)
   - Données publiques (artistes, œuvres) : Firebase Realtime Database (lues par le site)
   - Données privées (jetons, liens payants, commandes, paiements) : MongoDB
   Variables Vercel requises : MONGODB_URI, FIREBASE_SA, CODE_ADMIN
   Variable facultative : FIREBASE_DB_URL */

const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

let _mongo = null;
async function mdb() {
  if (!_mongo) {
    _mongo = new MongoClient(process.env.MONGODB_URI);
    await _mongo.connect();
  }
  return _mongo.db();
}

function fdb() {
  if (!admin.apps.length) {
    const sa = JSON.parse(process.env.FIREBASE_SA);
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      databaseURL: process.env.FIREBASE_DB_URL || ('https://' + sa.project_id + '-default-rtdb.firebaseio.com')
    });
  }
  return admin.database();
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const rnd = (n) => crypto.randomBytes(n).toString('hex');
const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const safeEq = (a, b) => {
  const x = Buffer.from(sha(a)), y = Buffer.from(sha(b));
  return crypto.timingSafeEqual(x, y);
};
const TYPES = ['music', 'clip', 'album', 'photo'];

async function artistAuth(d, M) {
  const cid = str(d.cid, 80), tok = str(d.tok, 100);
  if (!cid || !tok) return null;
  const a = await M.collection('artists').findOne({ _id: cid });
  if (!a || a.tokHash !== sha(tok)) return null;
  return a;
}

async function stats(M, cid) {
  const paidOrders = await M.collection('orders').find({ cid: cid, status: 'paid' }).toArray();
  const earned = paidOrders.reduce((s, o) => s + (o.share || 0), 0);
  const pays = await M.collection('payouts').find({ cid: cid }).toArray();
  const paid = pays.reduce((s, p) => s + (p.amount || 0), 0);
  return { sales: paidOrders.length, earned: earned, paid: paid, due: Math.max(0, earned - paid) };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const send = (o) => res.status(200).json(o);
  try {
    if (req.method !== 'POST') return send({ ok: false, err: 'Méthode non autorisée.' });
    let d = req.body;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }
    d = d || {};
    const a = d.a;
    const M = await mdb();

    /* ---------- INSCRIPTION ARTISTE ---------- */
    if (a === 'register') {
      const cid = str(d.cid, 80), name = str(d.name, 40), pn = str(d.payNumber, 30);
      if (cid.length < 3) return send({ ok: false, err: 'Identifiant invalide. Ouvrez Vibes une fois puis réessayez.' });
      if (name.length < 2 || pn.replace(/\D/g, '').length < 8) return send({ ok: false, err: 'Nom de scène et numéro de paiement obligatoires.' });
      const old = await M.collection('artists').findOne({ _id: cid });
      if (old) return send({ ok: false, err: 'Un compte artiste existe déjà pour cet identifiant.' });
      const tok = rnd(24);
      const img = String(d.img || '').slice(0, 300000);
      const now = Date.now();
      await M.collection('artists').insertOne({
        _id: cid, tokHash: sha(tok), name: name, method: str(d.method, 20), pn: pn,
        phone: str(d.phone, 30), date: now
      });
      await fdb().ref('artists/' + cid).set({
        cid: cid, name: name, bio: str(d.bio, 200), city: str(d.city, 40), img: img, date: now
      });
      return send({ ok: true, tok: tok });
    }

    /* ---------- ESPACE ARTISTE ---------- */
    if (a === 'me') {
      const ar = await artistAuth(d, M);
      if (!ar) return send({ ok: false, err: 'Session artiste invalide.' });
      const s = await stats(M, ar._id);
      const orders = await M.collection('orders').find({ cid: ar._id, status: 'paid' }).sort({ date: -1 }).limit(10).toArray();
      s.orders = orders.map((o) => ({ title: o.title, share: o.share, buyer: (o.buyer && o.buyer.name) || '' }));
      s.ok = true;
      return send(s);
    }

    /* ---------- PUBLIER UNE ŒUVRE ---------- */
    if (a === 'publish') {
      const ar = await artistAuth(d, M);
      if (!ar) return send({ ok: false, err: 'Session artiste invalide.' });
      const type = str(d.type, 10), title = str(d.title, 80), url = str(d.url, 600), pv = str(d.preview, 600);
      const price = Math.floor(Number(d.price) || 0);
      if (TYPES.indexOf(type) < 0) return send({ ok: false, err: 'Type invalide.' });
      if (title.length < 2) return send({ ok: false, err: 'Titre obligatoire.' });
      if (!/^https:\/\//.test(url)) return send({ ok: false, err: 'Le lien doit commencer par https://' });
      if (pv && !/^https:\/\//.test(pv)) return send({ ok: false, err: 'Le lien d\'aperçu doit commencer par https://' });
      if (price !== 0 && (price < 100 || price > 500000)) return send({ ok: false, err: 'Prix : 0 (gratuit) ou entre 100 et 500000 F.' });
      const id = 'w' + Date.now().toString(36) + rnd(3);
      const now = Date.now();
      const cover = String(d.cover || '').slice(0, 300000);
      await M.collection('works').insertOne({ _id: id, cid: ar._id, url: url, price: price, title: title, date: now });
      const pub = { id: id, cid: ar._id, an: ar.name, type: type, title: title, desc: str(d.desc, 300), price: price, cover: cover, pv: pv, date: now };
      if (price === 0) pub.url = url; /* le lien d'une œuvre payante n'est jamais publié */
      await fdb().ref('works/' + id).set(pub);
      return send({ ok: true, id: id });
    }

    /* ---------- SUPPRIMER UNE ŒUVRE ---------- */
    if (a === 'remove') {
      const ar = await artistAuth(d, M);
      if (!ar) return send({ ok: false, err: 'Session artiste invalide.' });
      const id = str(d.id, 60);
      const w = await M.collection('works').findOne({ _id: id });
      if (!w || w.cid !== ar._id) return send({ ok: false, err: 'Œuvre introuvable.' });
      await M.collection('works').deleteOne({ _id: id });
      await fdb().ref('works/' + id).remove();
      return send({ ok: true });
    }

    /* ---------- ACHAT ---------- */
    if (a === 'buy') {
      const wid = str(d.work, 60), bcid = str(d.bcid, 80);
      const w = await M.collection('works').findOne({ _id: wid });
      if (!w) return send({ ok: false, err: 'Œuvre introuvable.' });
      const ar = await M.collection('artists').findOne({ _id: w.cid });
      if (!w.price) return send({ ok: true, free: true });
      const exist = await M.collection('orders').findOne({ wid: wid, bcid: bcid, status: 'pending' });
      if (exist) return send({ ok: true, oid: exist._id, btok: exist.btok, title: w.title, an: ar ? ar.name : '', price: w.price });
      const oid = 'BS' + Math.floor(100000 + Math.random() * 900000);
      const btok = rnd(16);
      const share = Math.floor(w.price * 0.9);
      await M.collection('orders').insertOne({
        _id: oid, btok: btok, wid: wid, cid: w.cid, bcid: bcid, title: w.title, price: w.price, share: share,
        status: 'pending', buyer: { name: str(d.name, 60), phone: str(d.phone, 30) }, date: Date.now()
      });
      return send({ ok: true, oid: oid, btok: btok, title: w.title, an: ar ? ar.name : '', price: w.price });
    }

    /* ---------- STATUT / RÉCUPÉRER LE LIEN ---------- */
    if (a === 'status' || a === 'get') {
      const o = await M.collection('orders').findOne({ _id: str(d.oid, 20) });
      if (!o || o.btok !== str(d.btok, 60)) return send({ ok: false, err: 'Commande introuvable.' });
      if (a === 'status') return send({ ok: true, status: o.status === 'paid' ? 'paid' : (o.status === 'rejected' ? 'rejected' : 'pending') });
      if (o.status !== 'paid') return send({ ok: false, err: 'Paiement pas encore validé.' });
      const w = await M.collection('works').findOne({ _id: o.wid });
      if (!w) return send({ ok: false, err: 'Œuvre indisponible.' });
      return send({ ok: true, url: w.url, title: w.title });
    }

    /* ---------- ADMIN ---------- */
    if (a && a.indexOf('admin_') === 0) {
      const code = String(d.code || '').trim();
      const real = String(process.env.CODE_ADMIN || '').replace(/[\s\u200B-\u200D\uFEFF]/g, '');
      if (!real || !code || !safeEq(code.replace(/[\s\u200B-\u200D\uFEFF]/g, ''), real)) return send({ ok: false, err: 'Code administrateur incorrect.' });

      if (a === 'admin_overview') {
        const paidOrders = await M.collection('orders').find({ status: 'paid' }).toArray();
        const revenue = paidOrders.reduce((s, o) => s + o.price, 0);
        const shares = paidOrders.reduce((s, o) => s + o.share, 0);
        const pending = await M.collection('orders').find({ status: 'pending' }).sort({ date: -1 }).limit(50).toArray();
        const arts = await M.collection('artists').find({}).toArray();
        const list = [];
        for (const ar of arts) {
          const s = await stats(M, ar._id);
          if (s.sales || s.paid) list.push({ cid: ar._id, name: ar.name, pm: ar.method, pn: ar.pn, sales: s.sales, earned: s.earned, paid: s.paid, due: s.due });
        }
        return send({
          ok: true, revenue: revenue, commission: revenue - shares,
          orders: pending.map((o) => ({ oid: o._id, title: o.title, price: o.price, buyer: o.buyer })),
          artists: list
        });
      }
      if (a === 'admin_validate' || a === 'admin_reject') {
        const r = await M.collection('orders').updateOne(
          { _id: str(d.oid, 20) },
          { $set: { status: a === 'admin_validate' ? 'paid' : 'rejected', doneAt: Date.now() } }
        );
        return send({ ok: r.matchedCount > 0, err: r.matchedCount ? undefined : 'Commande introuvable.' });
      }
      if (a === 'admin_payout') {
        const amount = Math.floor(Number(d.amount) || 0);
        if (amount <= 0) return send({ ok: false, err: 'Montant invalide.' });
        await M.collection('payouts').insertOne({ cid: str(d.cid, 80), amount: amount, date: Date.now() });
        return send({ ok: true });
      }
    }

    return send({ ok: false, err: 'Action inconnue.' });
  } catch (e) {
    console.error('STAR API ERROR:', e && e.stack ? e.stack : e);
    return res.status(200).json({ ok: false, err: 'Erreur serveur : ' + String((e && e.message) || e).slice(0, 120) });
  }
};
