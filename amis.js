import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const monUid = localStorage.getItem('uid') || '';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function chargerAmis() {
  const list = document.getElementById('friendList');
  list.innerHTML = '<p style="padding:10px;">Chargement…</p>';
  try {
    const snap = await getDocs(collection(db, 'users'));
    let html = '';
    snap.forEach(d => {
      if (d.id === monUid) return;               // ne pas s'afficher soi-même
      const u = d.data();
      const nom = u.name || u.nom || u.displayName || u.email || 'Inconnu';
      const ini = esc(nom.substring(0, 2).toUpperCase());
      const id = encodeURIComponent(d.id);
      html += `
        <div class="friend-item">
          <div class="avatar">${ini}</div>
          <div class="friend-info"><h4>${esc(nom)}</h4><p>Hors ligne</p></div>
          <div class="actions">
            <i class="fas fa-star"></i>
            <i class="fas fa-phone" onclick="location.href='Call.html?call=${id}&video=false'"></i>
            <i class="fas fa-video" onclick="location.href='Call.html?call=${id}&video=true'"></i>
          </div>
        </div>`;
    });
    list.innerHTML = html || '<p style="padding:10px;">Aucun ami trouvé.</p>';
  } catch (e) {
    console.error(e);
    list.innerHTML = '<p style="color:red;padding:10px;">Erreur de chargement des amis.</p>';
  }
}
chargerAmis();
