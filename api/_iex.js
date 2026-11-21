// Routeur unique (plan gratuit) : /api/xxx  ->  api/_lib/xxx.js   (/api/produits.xml -> produits.js)
const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const name = (url.pathname.replace(/^\/api\/?/, '').split('/')[0] || 'index').replace(/\.xml$/i, '');
  // noms simples uniquement : pas de "..", pas de fichier interne (_art)
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name) || name === 'index') return res.status(404).json({ error: 'Route /api/' + name + ' introuvable' });
  if (name === 'art') return res.status(404).json({ error: 'Route /api/art introuvable' });
  // accepte api/_lib/xxx.js ET api/_lib/_xxx.js
  let file = path.join(__dirname, '_lib', name + '.js');
  if (!fs.existsSync(file)) file = path.join(__dirname, '_lib', '_' + name + '.js');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Route /api/' + name + ' introuvable' });
  let handler;
  try { handler = require(file); if (typeof handler !== 'function') handler = handler.default; } catch (e) {
    console.error('Chargement /api/' + name + ' impossible :', e); return res.status(500).json({ error: 'Erreur interne' });
  }
  try { return await handler(req, res); } catch (e) {
    console.error('Erreur /api/' + name + ' :', e);
    if (!res.headersSent) return res.status(500).json({ error: 'Erreur interne' });
  }
};
