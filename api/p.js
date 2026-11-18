module.exports = async (req, res) => {
  const id = req.query.id;
  if (!id) return res.redirect('https://bouba-stor.vercel.app/');

  let nom = "Article BOUBA STOR";
  let prix = "";
  let boutique = "BOUBA STORE";

  // Même recherche que toi : Firestore puis Realtime DB
  try {
    const { getArticle } = require('./_art.js');
    const a = await getArticle(id);
    if (a) {
      nom = a.name || nom;
      prix = a.price ? Number(a.price).toLocaleString('fr-FR') + " F" : "";
      boutique = a.shopName || a.boutique || boutique;
    }
  } catch(e) {}

  if (!prix) {
    try {
      const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
      const r = await fetch(`${DB}/products/${id}.json`);
      const p = await r.json();
      if (p) {
        nom = p.name || nom;
        prix = p.price ? Number(p.price).toLocaleString('fr-FR') + " F" : "";
        boutique = p.shopName || boutique;
      }
    } catch(e) {}
  }

  const titre = `${nom} - ${prix} chez ${boutique} sur BOUBA STORE`;
  const belleImage = `https://bouba-stor.vercel.app/api/img?id=${id}`;
  const lienProduit = `https://bouba-stor.vercel.app/?id=${id}`;

  // WhatsApp / Facebook lisent ÇA pour afficher la grande affiche
  res.setHeader('Content-Type', 'text/html');
  return res.send(`
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>${titre}</title>
<meta property="og:type" content="product" />
<meta property="og:title" content="${titre}" />
<meta property="og:description" content="Livraison 24h a Abidjan - Wave - Orange Money" />
<meta property="og:image" content="${belleImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
<meta property="og:url" content="${lienProduit}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${belleImage}" />
<meta http-equiv="refresh" content="0; url=${lienProduit}" />
</head><body><a href="${lienProduit}">Voir l'article</a></body></html>`);
};
