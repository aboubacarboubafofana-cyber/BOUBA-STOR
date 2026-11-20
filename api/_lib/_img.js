// Photo brute d'un article (?id=ID) ou d'une boutique (?s=ID) : lue au même endroit que tout le reste
const { getPhoto, getShop, decodePhoto, cleanId } = require('./_art.js');
module.exports = async (req, res) => {
  let sp; try { sp = new URL(req.url, 'http://x').searchParams; } catch (e) { sp = new URLSearchParams(); }
  const id = cleanId(sp.get('id')), s = cleanId(sp.get('s'));
  let src = null;
  try { src = s ? ((await getShop(s)) || {}).avatar : await getPhoto(id); } catch (e) {}
  const d = decodePhoto(src);
  if (d) {
    res.setHeader('Content-Type', d.type); res.setHeader('Content-Length', d.buf.length);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).send(d.buf);
  }
  res.setHeader('Location', /^https?:\/\//.test(src || '') ? src : '/icon-512.png');
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(302).end();
};
