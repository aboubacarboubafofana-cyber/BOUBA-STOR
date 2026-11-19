module.exports = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\//, '').split('/')[0] || 'index';
  try {
    const handler = require(`./lib/${path}.js`);
    return await handler(req, res);
  } catch (e) {
    return res.status(404).json({ error: `Route /api/${path} introuvable` });
  }
};
