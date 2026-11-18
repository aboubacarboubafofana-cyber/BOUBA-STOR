module.exports = async (req, res) => {
  const id = req.query.id;
  const CLOUD_NAME = "vtcqshb";

  if (!id) return res.status(400).send('ID manquant');

  try {
    let imageUrl = null;
    let nom = "Article BOUBA STOR";
    let prix = "";
    let ancienPrix = "";

    // 1. Firestore (Boutiques)
    try {
      const { getArticle } = require('./_art.js');
      const a = await getArticle(id);
      if (a) {
        imageUrl = a.image || a.img || a.photo;
        nom = a.name || nom;
        prix = a.price ? Number(a.price).toLocaleString('fr-FR') + " F" : "";
        ancienPrix = a.oldPrice ? Number(a.oldPrice).toLocaleString('fr-FR') + " F" : "";
      }
    } catch(e) {}

    // 2. Realtime DB (Site principal)
    if (!imageUrl) {
      const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
      const r = await fetch(`${DB}/products/${id}.json`);
      const p = await r.json();
      if (p) {
        imageUrl = p.img || p.image;
        nom = p.name || nom;
        prix = p.price ? Number(p.price).toLocaleString('fr-FR') + " F" : "";
        ancienPrix = p.oldPrice ? Number(p.oldPrice).toLocaleString('fr-FR') + " F" : "";
      }
    }

    if (!imageUrl) {
      return res.redirect('https://bouba-stor.vercel.app/icon-512.png');
    }

    // Nettoyage du texte pour Cloudinary
    const clean = (t) => encodeURIComponent(t.substring(0, 28).toUpperCase());
    const textNom = clean(nom);
    const textPrix = encodeURIComponent(prix);

    // AFFICHE BELLE BELLE - 1200x1200 pour WhatsApp
    const afficheUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/` +
      `w_1200,h_1200,c_pad,b_rgb:0B0B0F/` +
      // Ligne dorée haut
      `l_text:Arial_55_bold:BOUBA%20STOR,co_rgb:FFD700,g_north,y_55/` +
      `l_text:Arial_28:✦%20QUALITE%20PREMIUM%20✦,co_rgb:C9A227,g_north,y_125/` +
      // Photo dans un cadre blanc arrondi
      `l_fetch:${encodeURIComponent(imageUrl)},w_880,h_560,c_fill,g_center,y_-30/` +
      // Badge PROMO en haut à droite de la photo
      `l_text:Arial_45_black:PROMO,co_rgb:000000,g_north_east,x_120,y_210/` +
      // Nom du produit
      `l_text:Arial_58_bold:${textNom},co_rgb:FFFFFF,g_center,y_340/` +
      // Ligne dorée sous le nom
      `l_text:Arial_30:━━━━━━━━━━,co_rgb:FFD700,g_center,y_405/` +
      // Prix GÉANT doré
      `l_text:Arial_110_black:${textPrix},co_rgb:FFD700,g_center,y_500/` +
      // Barre livraison / paiement
      `l_text:Arial_32_bold:LIVRAISON%2024H%20ABIDJAN,co_rgb:FFFFFF,g_south_west,x_80,y_110/` +
      `l_text:Arial_32_bold:WAVE%20|%20ORANGE%20MONEY,co_rgb:FFD700,g_south_east,x_80,y_110/` +
      `l_text:Arial_26:Commandez%20maintenant%20sur%20BOUBA%20STOR,co_rgb:AAAAAA,g_south,y_55/` +
      encodeURIComponent(imageUrl);

    res.redirect(afficheUrl);

  } catch (error) {
    console.error(error);
    res.redirect('https://bouba-stor.vercel.app/icon-512.png');
  }
};
