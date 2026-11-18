module.exports = async (req, res) => {
  const id = req.query.id;
  const CLOUD_NAME = "vtcqshb"; // Ton Cloud Name

  if (!id) return res.status(400).send('ID manquant');

  try {
    let imageUrl = null;
    let nom = "Article BOUBA STOR";
    let prix = "";

    // 1. Chercher l'article dans Firestore (Boutiques)
    try {
      const { getArticle } = require('./_art.js');
      const a = await getArticle(id);
      if (a) {
        imageUrl = a.image || a.img || a.photo;
        nom = a.name || nom;
        prix = a.price ? a.price + " F" : "";
      }
    } catch(e) {}

    // 2. Si pas trouvé, chercher dans la base temps réel (Site principal)
    if (!imageUrl) {
      const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
      const r = await fetch(`${DB}/products/${id}.json`);
      const p = await r.json();
      if (p) {
        imageUrl = p.img || p.image;
        nom = p.name || nom;
        prix = p.price ? p.price + " F" : "";
      }
    }

    // 3. Si aucune image trouvée, afficher le logo
    if (!imageUrl) {
      return res.redirect('https://bouba-stor.vercel.app/icon-512.png');
    }

    // 4. On demande à Cloudinary de créer l'affiche PRO
    // On encode les textes pour qu'ils s'affichent bien dans l'URL
    const textNom = encodeURIComponent(nom.substring(0, 30)); 
    const textPrix = encodeURIComponent(prix);
    
    // L'URL magique de Cloudinary
    const afficheUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/` +
      `w_1080,h_1080,c_pad,b_rgb:0a0a0a/` + // Fond noir carré
      `l_text:Arial_70_bold:BOUBA%20STOR,co_rgb:FFD700,g_center,y_-380/` + // Titre doré
      `l_fetch:${encodeURIComponent(imageUrl)},w_800,h_500,c_pad,b_transparent,g_center,y_-50/` + // Photo au centre
      `l_text:Arial_55_bold:${textNom},co_rgb:FFFFFF,g_center,y_350/` + // Nom en blanc
      `l_text:Arial_85_bold:${textPrix},co_rgb:FFD700,g_center,y_440/` + // Prix en gros doré
      `l_text:Arial_30:Livraison%2024h%20a%20Abidjan%20-%20Wave%20-%20Orange%20Money,co_rgb:AAAAAA,g_center,y_500/` + // Bas de page
      encodeURIComponent(imageUrl); // L'image source

    // 5. On redirige WhatsApp vers cette belle affiche
    res.redirect(afficheUrl);

  } catch (error) {
    console.error(error);
    res.redirect('https://bouba-stor.vercel.app/icon-512.png');
  }
};
