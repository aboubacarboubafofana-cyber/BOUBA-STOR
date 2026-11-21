// Lien de partage d'un article : /api/p?id=ID  (ou ?n=NOM en secours, ?json=1 pour les données)
// - robots (WhatsApp, Facebook, Telegram...) : lisent les balises => aperçu avec image + infos
// - personnes : redirigées aussitôt dans l'application, directement sur l'article
const { getArticle, findByName, SHOP } = require('./_art.js');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
const intl = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? '225' + d : d; };
const WA_DEFAULT = process.env.WA_NUMBER || '2250787619717';

module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  let sp; try { sp = new URL(req.url, origin).searchParams; } catch (e) { sp = new URLSearchParams(); }
  const id = String(sp.get('id') || '').replace(/[^\w-]/g, '');
  const nm = String(sp.get('n') || '').trim().slice(0, 120);
  let a = null;
  try { if (id) a = await getArticle(id); if (!a && nm) a = await findByName(nm); } catch (e) {}

  if (sp.get('json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(a ? 200 : 404).send(JSON.stringify(a ? { ok: true, article: a } : { ok: false }));
  }

  const html = (o) => '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<script>location.replace(' + JSON.stringify(o.target).replace(/</g, '\\u003c') + ')</script>'
    + '<noscript><meta http-equiv="refresh" content="0;url=' + esc(o.target) + '"></noscript>'
    + '<title>' + o.title + '</title><meta name="description" content="' + o.desc + '">'
    + '<link rel="canonical" href="' + esc(o.url) + '">'
    + '<meta property="og:site_name" content="' + SHOP + '"><meta property="og:locale" content="fr_FR">'
    + '<meta property="og:type" content="' + o.type + '"><meta property="og:title" content="' + o.title + '">'
    + '<meta property="og:description" content="' + o.desc + '"><meta property="og:url" content="' + esc(o.url) + '">'
    + '<meta property="og:image" content="' + esc(o.image) + '"><meta property="og:image:secure_url" content="' + esc(o.image) + '">'
    + '<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'
    + '<meta property="og:image:alt" content="' + o.title + '">'
    + '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + o.title + '">'
    + '<meta name="twitter:description" content="' + o.desc + '"><meta name="twitter:image" content="' + esc(o.image) + '">'
    + (o.extra || '')
    + '<style>body{margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif}main{max-width:520px;margin:0 auto;padding:16px}'
    + 'img{width:100%;border-radius:14px;border:1px solid #ffd700}h1{font-size:22px;margin:14px 0 4px}.p{color:#ffd700;font-size:26px;font-weight:800}.s{color:#bbb;margin-bottom:14px}'
    + '.r{display:flex;gap:10px;margin-top:20px}.r a{flex:1;text-align:center;padding:14px;border-radius:12px;font-weight:800;text-decoration:none;font-size:14px}'
    + '.a{background:#ffd700;color:#000}.w{background:#25D366;color:#fff}</style></head><body><main>' + o.body + '</main></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');

  if (!a) { // article introuvable : aperçu de la boutique + retour à l'accueil (jamais de page cassée)
    return res.status(200).send(html({
      target: origin + '/', url: origin + '/', type: 'website', image: origin + '/og-bouba.jpg',
      title: esc('💝 ' + SHOP + ' — La mode qui fait battre le cœur ❤️'),
      desc: esc('Vêtements & accessoires · Livraison 24h à Abidjan · Wave, Orange Money, WhatsApp'),
      body: '<div style="color:#ffd700;font-weight:800;margin-bottom:10px">' + SHOP + '</div><div class="r"><a class="a" href="' + esc(origin + '/') + '">🛒 Ouvrir la boutique</a></div>'
    }));
  }

  const title = esc('💝 ' + a.name + ' — ' + money(a.price));
  const desc = esc((a.desc ? a.desc + ' · ' : '') + (a.cat ? a.cat + ' · ' : '') + 'chez ' + a.shopName + ' · Livraison 24h à Abidjan');
  const v = a.date ? '&v=' + a.date : '';
  const image = origin + '/api/og?id=' + encodeURIComponent(a.id) + v;
  const raw = origin + '/api/img?id=' + encodeURIComponent(a.id) + v;
  const url = origin + '/api/p?id=' + encodeURIComponent(a.id);
  const target = origin + '/?a=' + encodeURIComponent(a.id) + '&src=share';
  const wa = 'https://wa.me/' + (intl(a.phone) || WA_DEFAULT) + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par : ' + a.name + ' (' + money(a.price) + ')');
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: a.name, image: raw, offers: { '@type': 'Offer', price: String(Math.round(a.price)), priceCurrency: 'XOF' } }).replace(/</g, '\\u003c');
  return res.status(200).send(html({
    target, url, image, title, desc, type: 'product',
    extra: '<meta property="product:price:amount" content="' + Math.round(a.price) + '"><meta property="product:price:currency" content="XOF"><script type="application/ld+json">' + ld + '</script>',
    body: '<div style="color:#ffd700;font-weight:800;margin-bottom:10px">' + SHOP + '</div><img src="' + esc(raw) + '" alt="' + esc(a.name) + '">'
      + '<h1>' + esc(a.name) + '</h1><div class="p">' + money(a.price) + '</div><div class="s">Vendu par ' + esc(a.shopName) + '</div>'
      + '<div class="r"><a class="a" href="' + esc(target) + '">🛒 Commander sur le site</a><a class="w" href="' + esc(wa) + '">💬 WhatsApp</a></div>'
  }));
};
