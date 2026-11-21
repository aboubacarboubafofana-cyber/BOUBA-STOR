// Lien de partage d'une BOUTIQUE : /api/b?id=ID  -> aperçu (logo + nom) pour les robots, ouverture directe dans l'appli pour les personnes
const { getShop, SHOP } = require('./_art.js');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const OPEN_APP = "(function(t){var ua=navigator.userAgent||'',sa=window.matchMedia&&matchMedia('(display-mode: standalone)').matches;if(/Android/i.test(ua)&&!sa){try{var u=new URL(t);location.href='intent://'+u.host+u.pathname+u.search+'#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url='+encodeURIComponent(t)+';end'}catch(e){}setTimeout(function(){location.replace(t)},1800)}else{location.replace(t)}})";
module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  let sp; try { sp = new URL(req.url, origin).searchParams; } catch (e) { sp = new URLSearchParams(); }
  const id = String(sp.get('id') || '').replace(/[^\w-]/g, '');
  let sh = null; try { sh = await getShop(id, ['name', 'desc']); } catch (e) {}
  const name = sh ? String(sh.name) : SHOP;
  const title = esc(sh ? '🏪 ' + name + ' sur ' + SHOP : '💝 ' + SHOP + ' — La mode qui fait battre le cœur ❤️');
  const desc = esc((sh && sh.desc ? String(sh.desc).slice(0, 120) + ' · ' : '') + 'Découvrez tous les articles · Livraison 24h à Abidjan · Wave, Orange Money, WhatsApp');
  const url = origin + '/api/b?id=' + encodeURIComponent(id);
  const target = sh ? origin + '/?b=' + encodeURIComponent(id) + '&src=share' : origin + '/';
  const image = sh ? origin + '/api/og?s=' + encodeURIComponent(id) : origin + '/og-bouba.jpg';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  return res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<script>' + OPEN_APP + '(' + JSON.stringify(target).replace(/</g, '\\u003c') + ')</script>'
    + '<noscript><meta http-equiv="refresh" content="0;url=' + esc(target) + '"></noscript>'
    + '<title>' + title + '</title><meta name="description" content="' + desc + '"><link rel="canonical" href="' + esc(url) + '">'
    + '<meta property="og:site_name" content="' + SHOP + '"><meta property="og:locale" content="fr_FR"><meta property="og:type" content="website">'
    + '<meta property="og:title" content="' + title + '"><meta property="og:description" content="' + desc + '"><meta property="og:url" content="' + esc(url) + '">'
    + '<meta property="og:image" content="' + esc(image) + '"><meta property="og:image:secure_url" content="' + esc(image) + '"><meta property="og:image:type" content="image/jpeg">'
    + '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'
    + '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + title + '"><meta name="twitter:description" content="' + desc + '"><meta name="twitter:image" content="' + esc(image) + '">'
    + '<style>body{margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:40px 16px}a{display:inline-block;margin-top:20px;background:#ffd700;color:#000;font-weight:800;padding:14px 22px;border-radius:12px;text-decoration:none}</style>'
    + '</head><body><div style="color:#ffd700;font-weight:800;font-size:22px">' + SHOP + '</div><h1>' + esc(name) + '</h1><a href="' + esc(target) + '">🛒 Ouvrir la boutique</a></body></html>');
};
