module.exports = async (req, res) => {
  const id = req.query.id;
  const CLOUD_NAME = "vtcqshb";
  if (!id) return res.status(400).send('ID manquant');

  try {
    let imageUrl = null, nom = "Article BOUBA STOR", prix = "";

    try {
      const { getArticle } = require('./_art.js');
      const a = await getArticle(id);
      if (a) {
        imageUrl = a.image || a.img || a.photo;
        nom = a.name || nom;
        prix = a.price ? Number(a.price).toLocaleString('fr-FR') + " F" : "";
      }
    } catch(e) {}

    if (!imageUrl) {
      const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
      const r = await fetch(`${DB}/products/${id}.json`);
      const p = await r.json();
      if (p) {
        imageUrl = p.img || p.image;
        nom = p.name || nom;
        prix = p.price ? Number(p.price).toLocaleString('fr-FR') + " F" : "";
      }
    }

    if (!imageUrl) return res.redirect('https://bouba-stor.vercel.app/icon-512.png');

    const textNom = encodeURIComponent(nom.substring(0, 30).toUpperCase());
    const textPrix = encodeURIComponent(prix);

    const afficheUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/` +
      `w_1200,h_1200,c_pad,b_rgb:0B0B0F/` +
      `l_text:Arial_60_bold:BOUBA%20STOR,co_rgb:FFD700,g_north,y_55/` +
      `l_fetch:${encodeURIComponent(imageUrl)},w_880,h_580,c_fill,g_center,y_-20/` +
      `l_text:Arial_58_bold:${textNom},co_rgb:FFFFFF,g_center,y_350/` +
      `l_text:Arial_110_black:${textPrix},co_rgb:FFD700,g_center,y_500/` +
      `l_text:Arial_30_bold:Livraison%2024h%20Abidjan%20-%20Wave%20-%20Orange%20Money,co_rgb:AAAAAA,g_south,y_60/` +
      encodeURIComponent(imageUrl);

    res.redirect(afficheUrl);
  } catch(e) {
    res.redirect('https://bouba-stor.vercel.app/icon-512.png');
  }
};
