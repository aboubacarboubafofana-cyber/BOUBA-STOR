// /api/produits.js - BOUBA STOR - Produits.xml AUTOMATIQUE
// Chaque article publié dans Contrôle Total apparaît sur Google tout seul.
// Google Merchant doit pointer sur : https://bouba-stor.vercel.app/api/produits.xml
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  // 1. Essaie de lire depuis Firebase Realtime DB (si configuré)
  let products = [];
  try {
    const fbUrl = process.env.FIREBASE_DB_URL; // ex: https://bouba-stor-default-rtdb.firebaseio.com
    if (fbUrl) {
      const r = await fetch(fbUrl + '/products.json');
      const data = await r.json();
      if (data) {
        if (Array.isArray(data)) products = data;
        else products = Object.values(data);
      }
    }
  } catch(e) {}
  // 2. Si Firebase vide, utilise la liste de secours (tes 182 produits sont dans ton site)
  // Le site envoie aussi ses produits via ?products=... si tu utilises le bouton Republier
  if (!products.length && req.query.products) {
    try { products = JSON.parse(req.query.products); } catch(e) {}
  }
  const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const items = products.filter(p=>p && p.publie!==false).map(p=>`
  <item>
    <g:id>${esc(p.id)}</g:id>
    <g:title>${esc(p.name)} - BOUBA STOR</g:title>
    <g:description>${esc(p.name)} - Livraison 24H à Abidjan. Paiement Wave / Orange Money. -10% 1ère commande.</g:description>
    <g:link>https://bouba-stor.vercel.app/</g:link>
    <g:image_link>${esc(p.img && p.img.startsWith('http') ? p.img : 'https://bouba-stor.vercel.app/icon-512.png')}</g:image_link>
    <g:price>${Number(p.price||0)} XOF</g:price>
    <g:availability>in_stock</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${esc(p.brand||'BOUBA STOR')}</g:brand>
    <g:product_type>${esc(p.cat||'Vêtements')}</g:product_type>
  </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>BOUBA STOR</title>
<link>https://bouba-stor.vercel.app/</link>
<description>BOUBA STOR - Boutique en ligne à Abidjan. Livraison 24H. Paiement Wave / Orange Money.</description>
${items}
</channel>
</rss>`;
  res.status(200).send(xml);
}
