// BOUBA STORE - données partagées (boutiques + articles)
// Utilise Firebase (firebase-config.js) si possible, sinon le stockage de l'appareil.
const K = 'bouba_local_';
let B = null;

async function init() {
  if (B) return B;
  try {
    const cfg = await import('./firebase-config.js');
    const db = cfg.db || cfg.default || window.db;
    if (!db) throw new Error('no db');
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await fs.getDocs(fs.collection(db, 'boutiques')); // test de connexion
    B = { db, fs };
  } catch (e) {
    B = { local: true };
  }
  return B;
}

export async function mode() { await init(); return B.local ? 'local' : 'online'; }

function lread(c) { try { return JSON.parse(localStorage.getItem(K + c) || '[]'); } catch (e) { return []; } }
function lwrite(c, a) { localStorage.setItem(K + c, JSON.stringify(a)); }

export async function list(c) {
  await init();
  if (B.local) return lread(c);
  const s = await B.fs.getDocs(B.fs.collection(B.db, c));
  return s.docs.map(d => ({ ...d.data(), id: d.id }));
}
export async function put(c, o) {
  await init();
  if (B.local) { const a = lread(c).filter(x => x.id !== o.id); a.push(o); lwrite(c, a); return; }
  await B.fs.setDoc(B.fs.doc(B.db, c, o.id), o);
}
export async function patch(c, id, p) {
  await init();
  if (B.local) { lwrite(c, lread(c).map(x => x.id === id ? { ...x, ...p } : x)); return; }
  await B.fs.updateDoc(B.fs.doc(B.db, c, id), p);
}
export async function remove(c, id) {
  await init();
  if (B.local) { lwrite(c, lread(c).filter(x => x.id !== id)); return; }
  await B.fs.deleteDoc(B.fs.doc(B.db, c, id));
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = n => Number(n).toLocaleString('fr-FR') + ' F';
// Numéro international (Côte d'Ivoire par défaut : 225 + 10 chiffres)
export const intl = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? '225' + d : d; };

export function compress(file, max = 700) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

export function shareLinks(text, url) {
  const t = encodeURIComponent(text), u = encodeURIComponent(url);
  return {
    whatsapp: 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url),
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u,
    telegram: 'https://t.me/share/url?url=' + u + '&text=' + t,
    x: 'https://twitter.com/intent/tweet?text=' + t + '&url=' + u
  };
}
export const homeUrl = () => new URL('index.html', location.href).href;
