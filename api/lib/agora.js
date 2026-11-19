// api/agora.js — donne un accès temporaire (jeton) pour rejoindre un appel Agora
// Variables Vercel à créer :  AGORA_APP_ID  et  AGORA_APP_CERTIFICATE  (Agora Console > ton projet > Configure)
const DB = 'https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const channel = String((req.query && req.query.channel) || ''), key = String((req.query && req.query.key) || '');
    if (!/^[\w-]{6,40}$/.test(channel) || !/^[\w+.-]{3,80}$/.test(key)) return res.status(400).json({ error: 'paramètres invalides' });
    const appId = process.env.AGORA_APP_ID, cert = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !cert) return res.status(500).json({ error: 'Agora non configuré sur Vercel (AGORA_APP_ID / AGORA_APP_CERTIFICATE)' });
    // seuls les comptes inscrits sur BOUBA STOR obtiennent un jeton
    const nm = await fetch(DB + '/users/' + encodeURIComponent(key) + '/name.json').then(r => r.ok ? r.json() : null).catch(() => null);
    if (!nm) return res.status(403).json({ error: 'compte inconnu' });
    const { RtcTokenBuilder, RtcRole } = require('agora-token');
    const ttl = 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(appId, cert, channel, 0, RtcRole.PUBLISHER, ttl, ttl);
    res.status(200).json({ appId, token, channel });
  } catch (e) { res.status(500).json({ error: 'erreur serveur' }); }
};

