// api/index.js — Routeur unique pour toutes les API (contourne la limite de 12 fonctions)
module.exports = async (req, res) => {
  // On récupère le chemin demandé (ex: /api/p, /api/img, etc.)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\//, '').split('/')[0]; // Récupère le premier segment

  try {
    // On charge dynamiquement le bon fichier de logique depuis le dossier _lib
    const handler = require(`./_lib/${path}.js`);
    // On exécute la logique avec les objets req et res de Vercel
    return await handler(req, res);
  } catch (e) {
    console.error(`Route /api/${path} introuvable ou erreur:`, e);
    return res.status(404).json({ error: `Route /api/${path} introuvable` });
  }
};
