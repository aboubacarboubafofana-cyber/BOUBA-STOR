// api/og.js — génère une VRAIE affiche publicitaire (fond noir, texte doré, boutons)
const sharp = require('sharp');
const { getArticle } = require('./_art.js');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';

module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  const id = String((req.query && req.query.id) || '').replace(/[^\w-]/g, '');
  const s = String((req.query && req.query.s) || '').replace(/[^\w-]/g, '');
  
  const src = s ? origin + '/api/img?s=' + s : origin + '/api/img?id=' + id;

  try {
    // 1. Récupérer le nom et le prix
    let nom = "BOUTIQUE", prix = "", shop = "BOUBA STOR";
    if (id) {
      try {
        const a = await getArticle(id);
        if (a) { nom = a.name || nom; prix = a.price ? a.price + " FCFA" : ""; shop = a.shopName || shop; }
      } catch(e) {}
      
      if (nom === "BOUTIQUE") { // Si pas trouvé dans Firestore, cherche dans RTDB
        const r = await fetch(`${DB}/products/${id}.json`);
        const p = await r.json();
        if (p) { nom = p.name || nom; prix = p.price ? p.price + " FCFA" : ""; }
      }
    }

    // 2. Nettoyer le texte pour le SVG
    const safeNom = String(nom).substring(0, 25).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safePrix = String(prix).replace(/&/g, '&amp;');
    const safeShop = String(shop).replace(/&/g, '&amp;');

    // 3. Créer le design de l'affiche avec les 2 boutons (SVG)
    const svgImage = `
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <!-- Fond et cadre -->
      <rect width="100%" height="100%" fill="#0a0a0a"/>
      <rect x="25" y="25" width="1150" height="1150" fill="none" stroke="#FFD700" stroke-width="12"/>
      
      <!-- En-tête -->
      <text x="600" y="110" font-family="Arial, sans-serif" font-size="70" font-weight="bold" fill="#FFD700" text-anchor="middle">${safeShop}</text>
      <line x1="200" y1="150" x2="1000" y2="150" stroke="#FFD700" stroke-width="4"/>
      
      <!-- Nom et Prix -->
      <text x="600" y="760" font-family="Arial, sans-serif" font-size="55" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${safeNom}</text>
      <text x="600" y="870" font-family="Arial, sans-serif" font-size="85" font-weight="bold" fill="#FFD700" text-anchor="middle">${safePrix}</text>
      
      <!-- BOUTON 1 : Commander sur le site (Doré) -->
      <rect x="120" y="960" width="450" height="110" rx="20" fill="#FFD700"/>
      <text x="345" y="1028" font-family="Arial, sans-serif" font-size="35" font-weight="bold" fill="#000000" text-anchor="middle">Commander sur le site</text>
      
      <!-- BOUTON 2 : Commander sur WhatsApp (Vert) -->
      <rect x="630" y="960" width="450" height="110" rx="20" fill="#25D366"/>
      <text x="855" y="1028" font-family="Arial, sans-serif" font-size="35" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Commander sur WhatsApp</text>
      
      <!-- Texte livraison en bas -->
      <text x="600" y="1130" font-family="Arial, sans-serif" font-size="30" fill="#AAAAAA" text-anchor="middle">Livraison 24h a Abidjan - Wave - Orange Money</text>
    </svg>`;

    // 4. Récupérer la photo du produit
    const ph = await fetch(src, { redirect: 'follow' });
    if (!ph.ok) throw new Error('photo introuvable');
    const photo = Buffer.from(await ph.arrayBuffer());

    // 5. Redimensionner la photo (un peu plus petite pour faire de la place)
    const win = await sharp(photo).flatten({ background: '#0a0a0a' }).rotate().resize(700, 450, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();

    // 6. Fusionner le design (SVG) et la photo
    const out = await sharp(Buffer.from(svgImage))
      .composite([{ input: win, left: 250, top: 200 }])
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(out);

  } catch (e) {
    console.error(e);
    return res.redirect(302, src); // Si erreur, on renvoie la photo brute
  }
};
