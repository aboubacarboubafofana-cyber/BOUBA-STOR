// BOUBA STORE : vérification du code administrateur côté serveur (Vercel).
// Le vrai code est dans la variable d'environnement ADMIN_CODE, jamais dans le dépôt.
const crypto = require('crypto');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const code = String((b && b.code) || '');
  const real = String(process.env.ADMIN_CODE || '');
  const ha = crypto.createHash('sha256').update(code).digest();
  const hb = crypto.createHash('sha256').update(real).digest();
  const ok = !!real && crypto.timingSafeEqual(ha, hb);
  if (!ok) await new Promise(r => setTimeout(r, 700));
  res.status(200).json({ ok });
};
