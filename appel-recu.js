// BOUBA STORE – Appels entrants (vocal / vidéo) : affiche « Répondre / Refuser » sur n'importe quelle page de l'appli.
// Ne dépend plus de MON_ID : l'identifiant vient du compte connecté (Firebase Auth), comme dans call.html.
import { db, auth } from "./firebase-config.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const a = auth || getAuth(getApp());
let unsub = null, ring = null;

function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = 660; g.gain.value = 0.06; o.start();
    setTimeout(() => { o.stop(); c.close(); }, 400);
  } catch (e) {}
}
function stopRing() { clearInterval(ring); ring = null; document.getElementById('incoming-call')?.remove(); }

onAuthStateChanged(a, u => {
  if (unsub) { unsub(); unsub = null; }
  if (!u || /call\.html/i.test(location.pathname)) return;
  const q = query(collection(db, 'calls'), where('to', '==', u.uid), where('status', '==', 'ringing'));
  unsub = onSnapshot(q, snap => snap.docChanges().forEach(ch => {
    if (ch.type !== 'added') return;
    const d = ch.doc.data();
    if (Date.now() - (d.createdAt || 0) > 45000) return; // appel périmé
    showIncoming(ch.doc.id, d);
  }), err => console.warn('Appels entrants :', err.code || err.message));
});

function showIncoming(id, d) {
  stopRing();
  const box = document.createElement('div');
  box.id = 'incoming-call';
  box.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;z-index:99999;background:#1c1c1c;border:2px solid #ffd700;border-radius:16px;padding:14px;color:#fff;font-family:Roboto,Arial,sans-serif;box-shadow:0 8px 30px #000';
  box.innerHTML = `
    <div style="font-weight:700;margin-bottom:10px">${d.video ? '📹 Appel vidéo' : '📞 Appel vocal'} entrant</div>
    <div style="display:flex;gap:10px">
      <button id="ic-no"  style="flex:1;padding:12px;border:0;border-radius:10px;background:#e53935;color:#fff;font-weight:700">Refuser</button>
      <button id="ic-yes" style="flex:1;padding:12px;border:0;border-radius:10px;background:#ffd700;color:#000;font-weight:700">Répondre</button>
    </div>`;
  document.body.appendChild(box);
  navigator.vibrate?.([300, 150, 300, 150, 300]);
  beep(); ring = setInterval(() => { beep(); navigator.vibrate?.([300]); }, 2000);
  box.querySelector('#ic-yes').onclick = () => { clearInterval(ring); location.href = 'call.html?answer=' + id; };
  box.querySelector('#ic-no').onclick = async () => { stopRing(); try { await updateDoc(doc(db, 'calls', id), { status: 'declined' }); } catch (e) {} };
  setTimeout(stopRing, 45000);
}
