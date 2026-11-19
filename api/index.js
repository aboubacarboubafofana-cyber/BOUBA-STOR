// api/index.js — Routeur unique pour toutes les API (contourne la limite de 12 fonctions)
module.exports = async (req, res) => {
  // On récupère le chemin demandé (ex: /api/p, /api/img, etc.)
  const url = new URL(req.url, `http://${req.headers.host}`);
  // On extrait le nom de la fonction (ex: 'p' ou 'img')
  const path = url.pathname.replace(/^\/api\//, '').split('/')[0] || 'index';

  try {
    // On va chercher le fichier correspondant DANS le dossier 'lib'
    const handler = require(`./lib/${path}.js`);
    return await handler(req, res);
  } catch (e) {
    console.error(`Route /api/${path} introuvable:`, e.message);
    return res.status(404).json({ error: `Route /api/${path} introuvable` });
  }
};
