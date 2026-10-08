// À inclure sur TOUTES les pages (index.html, amis.html...) :
// <script type="module" src="appel-recu.js"></script>
import { db, MON_ID } from "./firebase-config.js";
import { collection, query, where, onSnapshot, updateDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (MON_ID && !location.pathname.toLowerCase().includes('call.html')) {
  const q = query(collection(db, 'calls'), where('to', '==', MON_ID), where('status', '==', 'ringing'));
  onSnapshot(q, snap => snap.docChanges().forEach(ch => {
    if (ch.type !== 'added') return;
    const d = ch.doc.data();
    if (Date.now() - (d.createdAt || 0) > 45000) return; // appel périmé
    showIncoming(ch.doc.id, d);
  }));
}

function showIncoming(id, d) {
  document.getElementById('incoming-call')?.remove();
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
  box.querySelector('#ic-yes').onclick = () => location.href = 'Call.html?answer=' + id;
  box.querySelector('#ic-no').onclick = async () => { box.remove(); await updateDoc(doc(db, 'calls', id), { status: 'declined' }); };
  setTimeout(() => box.remove(), 45000);
}
