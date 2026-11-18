// api/og.js — image d'aperçu de partage : la photo dans un cadre doré romantique (cœurs, étincelles, « BOUBA STOR »)
//   /api/og?id=<article ou produit>   |   /api/og?s=<boutique>
// Si quoi que ce soit échoue, on renvoie simplement la photo : l'aperçu n'est jamais cassé.
let sharp = null; try { sharp = require('sharp'); } catch (e) {}
let frame = null;
async function getFrame(origin) {
  if (frame) return frame;
  const r = await fetch(origin + '/og-frame.png');
  if (!r.ok) throw new Error('cadre');
  frame = Buffer.from(await r.arrayBuffer());
  return frame;
}
module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  const id = String((req.query && req.query.id) || '').replace(/[^\w-]/g, ''), s = String((req.query && req.query.s) || '').replace(/[^\w-]/g, '');
  const src = s ? origin + '/api/img?s=' + s : origin + '/api/img?id=' + id;
  try {
    if (!sharp) throw new Error('sharp');
    const [fr, ph] = await Promise.all([getFrame(origin), fetch(src, { redirect: 'follow' })]);
    if (!ph.ok) throw new Error('photo');
    const photo = Buffer.from(await ph.arrayBuffer());
    const win = await sharp(photo).flatten({ background: '#ffffff' }).rotate().resize(900, 900, { fit: 'cover', position: 'attention' }).toBuffer();
    const out = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite([{ input: win, left: 150, top: 115 }, { input: fr, left: 0, top: 0 }]).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(out);
  } catch (e) { return res.redirect(302, src); }
};
