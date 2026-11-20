// Carte d'aperçu 1200x1200 : photo + nom + prix + infos (texte dessiné en tracés : jamais de carrés, même sans police sur Vercel)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { getArticle, getPhoto, getShop, decodePhoto, tfetch, cleanId, SHOP } = require('./_art.js');

let FONT = null, FONT_ERR = false;
function font() {
  if (FONT || FONT_ERR) return FONT;
  try {
    const opentype = require('opentype.js');
    const rel = '@fontsource/roboto/files/roboto-latin-700-normal.woff';
    const cands = [];
    try { cands.push(require.resolve(rel)); } catch (e) {}
    cands.push(path.join(process.cwd(), 'node_modules', rel));
    cands.push(path.join(__dirname, '..', '..', 'node_modules', rel));
    const f = cands.find(p => fs.existsSync(p));
    const b = fs.readFileSync(f);
    FONT = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  } catch (e) { FONT_ERR = true; console.error('police introuvable :', e && e.message); }
  return FONT;
}
const clean = t => String(t == null ? '' : t).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim();
const escx = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const money = n => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F';
function width(t, size) { const f = font(); return f ? f.getAdvanceWidth(t, size) : t.length * size * 0.55; }
function T(t, x, y, size, fill, anchor) {
  t = clean(t); if (!t) return '';
  const w = width(t, size), x0 = anchor === 'middle' ? x - w / 2 : x, f = font();
  if (f) return '<path fill="' + fill + '" d="' + f.getPath(t, x0, y, size).toPathData(2) + '"/>';
  return '<text x="' + x + '" y="' + y + '" font-family="sans-serif" font-size="' + size + '" font-weight="bold" fill="' + fill + '" text-anchor="' + (anchor || 'start') + '">' + escx(t) + '</text>';
}
function wrap(t, size, max, nb) {
  const words = clean(t).split(' '), lines = []; let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (width(tt, size) > max && cur) { lines.push(cur); cur = w; } else cur = tt; }
  if (cur) lines.push(cur);
  if (lines.length > nb) { lines.length = nb; let l = lines[nb - 1]; while (l.length > 1 && width(l + '...', size) > max) l = l.slice(0, -1); lines[nb - 1] = l + '...'; }
  return lines;
}
async function photoBuffer(src, origin) {
  try {
    const d = decodePhoto(src); if (d) return d.buf;
    if (/^https?:\/\//.test(src || '')) { const r = await tfetch(src, {}, 4000); if (r.ok) return Buffer.from(await r.arrayBuffer()); }
  } catch (e) {}
  try { const r = await tfetch(origin + '/icon-512.png', {}, 4000); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch (e) {}
  return null;
}

module.exports = async (req, res) => {
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'bouba-stor.vercel.app');
  let sp; try { sp = new URL(req.url, origin).searchParams; } catch (e) { sp = new URLSearchParams(); }
  const id = cleanId(sp.get('id')), s = cleanId(sp.get('s'));
  try {
    let name = SHOP, price = 0, shop = '', src = null;
    if (id) {
      const a = await getArticle(id); if (a) { name = a.name; price = a.price; shop = a.shopName; }
      src = await getPhoto(id).catch(() => null);
    } else if (s) {
      const sh = await getShop(s); if (sh) { name = sh.name || SHOP; src = sh.avatar; }
    }
    const showShop = shop && shop !== SHOP, top = showShop ? 190 : 165, PH = showShop ? 620 : 645;
    const lines = wrap(name, 54, 1000, 2);
    const ny = top + PH + 85;
    let svg = '<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="1200" fill="#0a0a0a"/>'
      + '<rect x="20" y="20" width="1160" height="1160" rx="30" fill="none" stroke="#FFD700" stroke-width="8"/>'
      + '<rect x="40" y="40" width="1120" height="1120" rx="22" fill="none" stroke="#FFD700" stroke-opacity=".45" stroke-width="2"/>'
      + T(SHOP, 600, 108, 66, '#FFD700', 'middle') + (showShop ? T('chez ' + shop, 600, 158, 34, '#BBBBBB', 'middle') : '')
      + '<rect x="100" y="' + top + '" width="1000" height="' + PH + '" rx="36" fill="#141414"/>';
    lines.forEach((l, i) => { svg += T(l, 600, ny + i * 62, 54, '#FFFFFF', 'middle'); });
    const py = ny + (lines.length - 1) * 62 + 38;
    if (price > 0) {
      const pt = money(price), pw = Math.min(900, width(pt, 70) + 90);
      svg += '<rect x="' + (600 - pw / 2) + '" y="' + py + '" width="' + pw + '" height="92" rx="46" fill="#FFD700"/>' + T(pt, 600, py + 67, 70, '#000000', 'middle');
    }
    svg += T('Livraison 24h a Abidjan  -  Wave  -  Orange Money  -  WhatsApp', 600, 1128, 30, '#AAAAAA', 'middle')
      + T('bouba-stor.vercel.app', 600, 1166, 28, '#FFD700', 'middle') + '</svg>';

    const layers = [];
    try {
      const buf = await photoBuffer(src, origin);
      if (buf) {
        const mask = Buffer.from('<svg width="1000" height="' + PH + '" xmlns="http://www.w3.org/2000/svg"><rect width="1000" height="' + PH + '" rx="36" fill="#fff"/></svg>');
        const pic = await sharp(buf).rotate().flatten({ background: '#141414' }).resize(1000, PH, { fit: 'contain', background: '#141414' })
          .ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
        layers.push({ input: pic, left: 100, top });
      }
    } catch (e) { console.error('photo ignorée :', e && e.message); }
    layers.push({ input: Buffer.from('<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="100" y="' + top + '" width="1000" height="' + PH + '" rx="36" fill="none" stroke="#FFD700" stroke-width="5"/></svg>'), left: 0, top: 0 });

    const out = await sharp(Buffer.from(svg)).composite(layers).jpeg({ quality: 88 }).toBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(out);
  } catch (e) {
    console.error('og :', e);
    res.setHeader('Location', origin + '/og-bouba.jpg'); res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(302).end();
  }
};
