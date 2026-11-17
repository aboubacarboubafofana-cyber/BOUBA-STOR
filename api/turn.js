// api/turn.js — serveurs de relais (TURN) pour que les appels passent entre deux réseaux différents (4G <-> Wi-Fi, Orange <-> MTN…)
// Variables Vercel (une seule des deux suffit) :
//   Cloudflare (gratuit) : CF_TURN_KEY_ID  +  CF_TURN_API_TOKEN
//   Metered   (gratuit) : METERED_DOMAIN (ex: monapp.metered.live)  +  METERED_API_KEY
const FALLBACK = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }
];
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, max-age=600');
  let list = [], provider = 'public';
  try {
    if (process.env.CF_TURN_KEY_ID && process.env.CF_TURN_API_TOKEN) {
      const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + process.env.CF_TURN_KEY_ID + '/credentials/generate', {
        method: 'POST', headers: { Authorization: 'Bearer ' + process.env.CF_TURN_API_TOKEN, 'content-type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }) });
      if (r.ok) { const j = await r.json(); const s = j.iceServers; list = Array.isArray(s) ? s : (s ? [s] : []); provider = 'cloudflare'; }
    } else if (process.env.METERED_DOMAIN && process.env.METERED_API_KEY) {
      const r = await fetch('https://' + process.env.METERED_DOMAIN + '/api/v1/turn/credentials?apiKey=' + process.env.METERED_API_KEY);
      if (r.ok) { const j = await r.json(); if (Array.isArray(j)) { list = j; provider = 'metered'; } }
    }
  } catch (e) {}
  res.status(200).json({ iceServers: list.concat(FALLBACK), provider });
};
