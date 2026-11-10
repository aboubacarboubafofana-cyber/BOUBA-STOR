export default async function handler(req, res) {
  // On autorise seulement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { act, title, body } = req.body;
  const appId = "5672576c-c60f-4364-9bb3-316526fcd35e"; // Ton App ID
  const apiKey = process.env.ONESIGNAL_KEY; // La clé cachée sur Vercel

  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API manquante sur Vercel' });
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["All"], // Envoie à tous les abonnés
        headings: { en: title || "👑 BOUBA STOR", fr: title || "👑 BOUBA STOR" },
        contents: { en: body || "Découvrez nos nouveautés !", fr: body || "Découvrez nos nouveautés !" },
        url: "https://bouba-stor.vercel.app/" // Ouvre ton site au clic
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
