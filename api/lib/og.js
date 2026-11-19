const sharp = require('sharp');
const { getArticle } = require('./_art.js');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';

module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  const id = String((req.query && req.query.id) || '').replace(/[^\w-]/g, '');
  const s = String((req.query && req.query.s) || '').replace(/[^\w-]/g, '');
  const src = s ? origin + '/api/img?s=' + s : origin + '/api/img?id=' + id;

  try {
    let nom = "BOUTIQUE", prix = "", shop = "BOUBA STOR";
    if (id) {
      try { const a = await getArticle(id); if (a) { nom = a.name || nom; prix = a.price ? a.price + " F" : ""; shop = a.shopName || shop; } } catch(e) {}
      if (nom === "BOUTIQUE") { const r = await fetch(`${DB}/products/${id}.json`); const p = await r.json(); if (p) { nom = p.name || nom; prix = p.price ? p.price + " F" : ""; } }
    }
    const safeNom = String(nom).substring(0, 25).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safePrix = String(prix).replace(/&/g, '&amp;');
    const safeShop = String(shop).replace(/&/g, '&amp;');

    const svgImage = `
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0a0a0a"/>
      <rect x="20" y="20" width="1160" height="1160" fill="none" stroke="#FFD700" stroke-width="10"/>
      <text x="600" y="100" font-family="Arial, sans-serif" font-size="65" font-weight="bold" fill="#FFD700" text-anchor="middle">${safeShop}</text>
      <line x1="200" y1="130" x2="1000" y2="130" stroke="#FFD700" stroke-width="3"/>
      <text x="600" y="680" font-family="Arial, sans-serif" font-size="55" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${safeNom}</text>
      <text x="600" y="800" font-family="Arial, sans-serif" font-size="85" font-weight="bold" fill="#FFD700" text-anchor="middle">${safePrix}</text>
      <rect x="100" y="880" width="480" height="120" rx="20" fill="#FFD700"/>
      <text x="340" y="955" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#000000" text-anchor="middle">Commander sur le site</text>
      <rect x="620" y="880" width="480" height="120" rx="20" fill="#25D366"/>
      <text x="860" y="955" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Commander sur WhatsApp</text>
      <text x="600" y="1080" font-family="Arial, sans-serif" font-size="30" fill="#AAAAAA" text-anchor="middle">Livraison 24h a Abidjan - Wave - Orange Money</text>
    </svg>`;

    const ph = await fetch(src, { redirect: 'follow' });
    if (!ph.ok) throw new Error('photo');
    const photo = Buffer.from(await ph.arrayBuffer());
    const win = await sharp(photo).flatten({ background: '#0a0a0a' }).rotate().resize(650, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();

    const out = await sharp(Buffer.from(svgImage)).composite([{ input: win, left: 275, top: 200 }]).jpeg({ quality: 90 }).toBuffer();
    res.setHeader('Content-Type', 'image/jpeg'); res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.status(200).send(out);
  } catch (e) { return res.redirect(302, src); }
};
