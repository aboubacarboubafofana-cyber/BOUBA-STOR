/* =============================================================
   AVIS CLIENTS DYNAMIQUES (Version Anti-Bug "classList")
   ============================================================= */
(function() {
  'use strict';

  let localAvis = {};
  let dbInstance = null;
  let firebaseRef = null;
  let firebaseSet = null;

  // 1. Fonction qui crée la fenêtre HTML (au cas où elle n'existe pas)
  function createAvisModal() {
    if (document.getElementById('avisModal')) return; // Elle existe déjà, on ne fait rien

    var style = document.createElement('style');
    style.innerHTML = `
      #avisModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 999999; display: none; align-items: center; justify-content: center; padding: 20px; }
      #avisModal.show { display: flex !important; }
      .am-box { background: #111; border: 1px solid gold; border-radius: 15px; width: 100%; max-width: 400px; padding: 20px; color: #fff; }
      .am-box h3 { color: gold; text-align: center; margin-bottom: 15px; }
      .am-input { width: 100%; padding: 10px; margin-bottom: 10px; background: #000; border: 1px solid #333; color: #fff; border-radius: 8px; font-size: 14px; }
      .am-stars { display: flex; gap: 5px; justify-content: center; font-size: 30px; cursor: pointer; margin-bottom: 15px; color: #555; }
      .am-stars span.active { color: gold; }
      .am-btn { width: 100%; padding: 14px; background: gold; color: #000; border: none; border-radius: 8px; font-weight: 900; font-size: 15px; cursor: pointer; margin-bottom: 8px; }
      .am-close { width: 100%; padding: 12px; background: #333; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }
    `;
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'avisModal';
    modal.innerHTML = `
      <div class="am-box">
        <h3>⭐ Laisser un avis</h3>
        <input type="text" id="amName" class="am-input" placeholder="Votre nom">
        <input type="text" id="amCity" class="am-input" placeholder="Votre quartier">
        <div class="am-stars" id="amStars">
          <span onclick="window.setAvisStars(1)">★</span>
          <span onclick="window.setAvisStars(2)">★</span>
          <span onclick="window.setAvisStars(3)">★</span>
          <span onclick="window.setAvisStars(4)">★</span>
          <span onclick="window.setAvisStars(5)">★</span>
        </div>
        <textarea id="amText" class="am-input" rows="3" placeholder="Votre message..."></textarea>
        <button class="am-btn" onclick="window.submitAvis()">Envoyer l'avis</button>
        <button class="am-close" onclick="document.getElementById('avisModal').classList.remove('show')">Annuler</button>
      </div>
    `;
    document.body.appendChild(modal);
    window.setAvisStars(5);
  }

  // 2. On la crée au démarrage
  document.addEventListener('DOMContentLoaded', createAvisModal);
  setTimeout(createAvisModal, 1000); // Sécurité

  // 3. Fonctions globales
  var currentStars = 5;
  window.setAvisStars = function(n) {
    currentStars = n;
    var spans = document.querySelectorAll('#amStars span');
    if (spans.length > 0) {
      spans.forEach(function(s, i) { s.classList.toggle('active', i < n); });
    }
  };

  // LA FONCTION MAGIQUE QUI CORRIGE TON ERREUR
  window.openAvisModal = function() {
    createAvisModal(); // On vérifie que la fenêtre existe, sinon on la crée
    var m = document.getElementById('avisModal');
    if (m) {
      m.classList.add('show');
    } else {
      alert("Erreur : impossible de créer la fenêtre d'avis.");
    }
  };

  window.submitAvis = async function() {
    var name = document.getElementById('amName').value.trim();
    var city = document.getElementById('amCity').value.trim();
    var text = document.getElementById('amText').value.trim();

    if (!name || !text) { alert("Veuillez remplir votre nom et votre message."); return; }

    var id = 'av_' + Date.now();
    var avisObj = { id: id, name: name, city: city || 'Abidjan', text: text, stars: currentStars, date: Date.now() };

    if (dbInstance && firebaseSet && firebaseRef) {
      try {
        await firebaseSet(firebaseRef(dbInstance, 'avis/general/' + id), avisObj);
        localAvis[id] = avisObj;
        renderAvis();
        alert("✅ Merci ! Votre avis a bien été enregistré.");
        document.getElementById('avisModal').classList.remove('show');
        document.getElementById('amName').value = '';
        document.getElementById('amCity').value = '';
        document.getElementById('amText').value = '';
      } catch(e) {
        alert("Erreur : impossible de sauvegarder l'avis.");
      }
    } else {
      alert("Erreur : base de données non connectée.");
    }
  };

  // 4. Firebase
  setTimeout(async function() {
    try {
      const B = "https://www.gstatic.com/firebasejs/12.19.0/";
      const A = await import(B + "firebase-app.js");
      const D = await import(B + "firebase-database.js");
      let app;
      try { app = A.getApp(); } catch(e) { return; }
      
      dbInstance = D.getDatabase(app);
      firebaseSet = D.set;
      firebaseRef = D.ref;
      
      D.onValue(D.ref(dbInstance, 'avis/general'), (snap) => {
        localAvis = snap.val() || {};
        renderAvis();
      });
    } catch(e) { console.log('Erreur Firebase Avis:', e); }
  }, 1500);

  // 5. Affichage des avis
  function renderAvis() {
    var container = document.getElementById('avis-container');
    if (!container) return;

    var list = Object.values(localAvis).filter(function(a) { return a && a.name && a.text; });
    list.sort(function(a, b) { return b.date - a.date; });

    var html = '<h3 class="avis-title" style="color:gold;text-align:center;margin-bottom:10px;">⭐ Ce que disent nos clients</h3>';
    
    if (list.length === 0) {
      html += '<p style="color:#888; text-align:center; font-size:13px;">Aucun avis pour le moment. Soyez le premier !</p>';
    } else {
      html += '<div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px;">';
      list.slice(0, 10).forEach(function(a) {
        var stars = '';
        for (var i = 0; i < 5; i++) { stars += (i < a.stars) ? '★' : '☆'; }
        html += `
          <div style="background:#222; padding:15px; border-radius:8px; border-left:3px solid gold; min-width:80%;">
            <div style="color:#ffd700; font-size:14px; margin-bottom:5px;">${stars}</div>
            <p style="margin:5px 0; font-size:13px; color:#ddd; font-style:italic;">"${a.text}"</p>
            <span style="font-size:11px; color:#888;">- ${a.name}, ${a.city}</span>
          </div>
        `;
      });
      html += '</div>';
    }
    html += `<button style="display:block; width:100%; padding:10px; margin-top:10px; background:gold; color:#000; border:none; border-radius:8px; font-weight:bold; cursor:pointer;" onclick="window.openAvisModal()">✍️ Laisser un avis</button>`;
    container.innerHTML = html;
  }

})();
