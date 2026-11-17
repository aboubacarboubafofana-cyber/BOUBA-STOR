const { getArticle } = require('./_art.js');
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';

module.exports = async (req, res) => {
  const id = req.query.id;
  try {
    let imageUrl = null;

    // 1. On cherche d'abord dans les articles des boutiques (Firestore)
    try {
      const a = await getArticle(id);
      if (a && (a.image || a.img || a.photo)) {
        imageUrl = a.image || a.img || a.photo; // Adaptez selon le nom de votre champ photo
      }
    } catch(e) {}

    // 2. Si pas trouvé, on cherche dans les produits du site (Base temps réel)
    if (!imageUrl) {
      const response = await fetch(`${DB}/products/${id}/image.json`);
      const imgData = await response.json();
      imageUrl = Array.isArray(imgData) ? imgData[0] : imgData;
    }

    // 3. On redirige vers l'image
    if (imageUrl && typeof imageUrl === 'string') {
      res.writeHead(302, { Location: imageUrl });
      res.end();
    } else {
      // Image par défaut si aucune photo n'est trouvée
      res.writeHead(302, { Location: 'https://bouba-stor.vercel.app/icon-512.png' });
      res.end();
    }
  } catch (error) {
    res.status(500).send('Erreur image');
  }
};
