/* =============================================================
   AVIS CLIENTS DYNAMIQUES (Version Affichage Instantané)
   ============================================================= */
(function() {
  'use strict';

  // 1. On crée la fenêtre immédiatement au chargement
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('avisModal')) return;

    var style = document.createElement('style');
    style.innerHTML = `
      #avisModal { position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:99999; display:none; align-items:center; justify-content:center; padding:20px; }
      #avisModal.show { display:flex; }
      .am-box { background:#111; border:1px solid gold; border-radius:15px; width:100%; max-width:400px; padding:20px; color:#fff; }
      .am-box h3 { color:gold; text-align:center; margin-bottom:15px; }
      .am-input { width:100%; padding:10px; margin-bottom:10px; background:#000; border:1px solid #333; color:#fff; border-radius:8px; font-size:14px; }
      .am-stars { display:flex; gap:5px; justify-content:center; font-size:30px; cursor:pointer; margin-bottom:15px; color:#555; }
      .am-stars span.active { color:gold; }
      .am-btn { width:100%; padding:14px; background:gold; color:#000; border:none; border-radius:8px; font-weight:900; font-size:15px; cursor:pointer; margin-bottom:8px; }
      .am-close { width:100%; padding:12px; background:#333; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; }
      
      .avis-title { color: gold; margin: 0 0 10px 0; font-size: 16px; text-align: center; font-weight: bold; }
      .avis-scroll { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px; }
      .avis-card { background: #222; padding: 15px; border-radius: 8px; border-left: 3px solid gold; flex: 0 0 85%; scroll-snap-align: start; }
      .avis-stars { color: #ffd700; font-size: 14px; margin-bottom: 5px; }
      .avis-text { margin: 5px 0; font-size: 13px; color: #ddd; font-style: italic; }
      .avis-name { font-size: 11px; color: #888; }
      .avis-btn-add { display: block; width: 100%; padding: 10px; margin-top: 10px; background: gold; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; }
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
  });

  // 2. Fonctions
  var currentStars = 5;
  window.setAvisStars = function(n) {
    currentStars = n;
    var spans = document.querySelectorAll('#amStars span');
    spans.forEach(function(s, i) { s.classList.toggle('active', i < n); });
  };

  window.openAvisModal = function() {
    var m = document.getElementById('avisModal');
    if (m) m.classList.add('show');
  };

  window.submitAvis = function() {
    var name = document.getElementById('amName').value.trim();
    var city = document.getElementById('amCity').value.trim();
    var text = document.getElementById('amText').value.trim();

    if (!name || !text) { alert("Veuillez remplir votre nom et votre message."); return; }

    var id = 'av_' + Date.now();
    var avisObj = { id: id, name: name, city: city || 'Abidjan', text: text, stars: currentStars, date: Date.now() };

    if (typeof window.write === 'function') {
      // On sauvegarde dans Firebase
      window.write('reviews/' + id, avisObj);
      
      // 🔥 C'EST ICI LA MAGIE : On l'ajoute directement à l'écran pour un affichage instantané !
      if (!window.S) window.S = {};
      if (!window.S.reviews) window.S.reviews = {};
      window.S.reviews[id] = avisObj;
      renderAvis(); 

      alert('✅ Merci ! Votre avis a bien été enregistré.');
      document.getElementById('avisModal').classList.remove('show');
      document.getElementById('amName').value = '';
      document.getElementById('amCity').value = '';
      document.getElementById('amText').value = '';
    } else {
      alert("Erreur : impossible d'enregistrer l'avis.");
    }
  };

  // 3. Affichage des avis sur la page
  function renderAvis() {
    var container = document.getElementById('avis-container');
    if (!container) return;

    var S = window.S || {};
    var allAvis = S.reviews || {};
    var list = Object.values(allAvis).filter(function(a) { return a && a.name && a.text; });
    list.sort(function(a, b) { return b.date - a.date; });

    var html = '<h3 class="avis-title">⭐ Ce que disent nos clients</h3>';
    
    if (list.length === 0) {
      html += '<p style="color:#888; text-align:center; font-size:13px;">Aucun avis pour le moment. Soyez le premier !</p>';
    } else {
      html += '<div class="avis-scroll">';
      list.slice(0, 10).forEach(function(a) {
        var stars = '';
        for (var i = 0; i < 5; i++) { stars += (i < a.stars) ? '★' : '☆'; }
        html += `
          <div class="avis-card">
            <div class="avis-stars">${stars}</div>
            <p class="avis-text">"${a.text}"</p>
            <span class="avis-name">- ${a.name}, ${a.city}</span>
          </div>
        `;
      });
      html += '</div>';
    }
    html += `<button class="avis-btn-add" onclick="window.openAvisModal()">✍️ Laisser un avis</button>`;
    container.innerHTML = html;
  }

  // 4. Écouter les changements Firebase pour les autres visiteurs
  setTimeout(function() {
    if (window.fb && window.fb.D && window.fb.db) {
      window.fb.D.onValue(window.fb.D.ref(window.fb.db, 'reviews'), function(snap) {
        if (!window.S) window.S = {};
        window.S.reviews = snap.val() || {};
        renderAvis(); // On met à jour quand quelqu'un d'autre poste un avis
      });
    } else {
      setTimeout(renderAvis, 2000); // Sécurité
    }
  }, 1500);

})();
