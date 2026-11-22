// Photo brute d'un article (?id=ID) ou d'une boutique (?s=ID) : lue au même endroit que tout le reste
const { getPhoto, getShop, decodePhoto, cleanId, fsDoc, rtdb, rtdbFetch } = require('./_art.js');
module.exports = async (req, res) => {
  let sp; try { sp = new URL(req.url, 'http://x').searchParams; } catch (e) { sp = new URLSearchParams(); }
  const id = cleanId(sp.get('id')), s = cleanId(sp.get('s'));
  if (sp.get('debug') === 'list') {   // /api/img?debug=list : où est la photo de chaque article (aucune photo n'est téléchargée)
    const sh = async p => { try { const r = await rtdbFetch(p + '.json?shallow=true', 6000); return r.ok ? ((await r.json()) || {}) : { _err: 'HTTP ' + r.status }; } catch (e) { return { _err: String((e && e.message) || e).slice(0, 60) }; } };
    const prods = await sh('products'), imgs = await sh('productimgs');
    if (prods._err || imgs._err) { res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.status(200).send('ERREUR lecture base : products=' + (prods._err || 'ok') + ' productimgs=' + (imgs._err || 'ok')); }
    const ids = Object.keys(prods), lines = new Array(ids.length);
    for (let k = 0; k < ids.length; k += 12) await Promise.all(ids.slice(k, k + 12).map(async (pid, j) => {
      const keys = await sh('products/' + pid), nm = await rtdb('products/' + pid + '/name');
      lines[k + j] = pid + ' | ' + String(nm || '?').slice(0, 30) + ' | photo dans products : ' + (keys.img ? 'OUI' : 'NON') + ' | dans productimgs : ' + (imgs[pid] ? 'OUI' : 'NON');
    }));
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(ids.length + ' articles\n' + lines.join('\n'));
  }
  if (sp.get('debug') === '1') {   // diagnostic : /api/img?id=ID&debug=1 (n'affiche aucune photo, seulement l'état des sources)
    const out = { id };
    const probe = async (name, fn) => { try { const v = await fn(); out[name] = v == null ? 'vide' : (typeof v === 'string' ? 'texte, ' + v.length + ' car., début : ' + v.slice(0, 24) : typeof v); } catch (e) { out[name] = 'ERREUR : ' + String((e && e.message) || e).slice(0, 120); } };
    await probe('firestore photos', async () => ((await fsDoc('photos/' + id, ['img'])) || {}).img);
    await probe('firestore articles', async () => ((await fsDoc('articles/' + id, ['img'])) || {}).img);
    await probe('rtdb productimgs', () => rtdb('productimgs/' + id));
    await probe('rtdb products/img', () => rtdb('products/' + id + '/img'));
    await probe('rtdb products/name', () => rtdb('products/' + id + '/name'));
    res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify(out, null, 1));
  }
  let src = null;
  try { src = s ? ((await getShop(s)) || {}).avatar : await getPhoto(id); } catch (e) {}
  const d = decodePhoto(src);
  if (d) {
    res.setHeader('Content-Type', d.type); res.setHeader('Content-Length', d.buf.length);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    return res.status(200).send(d.buf);
  }
  res.setHeader('Location', /^https?:\/\//.test(src || '') ? src : '/icon-512.png');
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(302).end();
};
