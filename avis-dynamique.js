/* =============================================================
   AVIS CLIENTS DYNAMIQUES (BOuba-STOR)
   ============================================================= */
(function() {
  'use strict';

  // 1. Style et Fenêtre Modale
  var style = document.createElement('style');
  style.innerHTML = `
    .avis-title { color: gold; margin: 0 0 10px 0; font-size: 16px; text-align: center; font-weight: bold; }
    .avis-scroll { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 10px; }
    .avis-card { background: #222; padding: 15px; border-radius: 8px; border-left: 3px solid gold; flex: 0 0 85%; scroll-snap-align: start; }
    .avis-stars { color: #ffd700; font-size: 14px; margin-bottom: 5px; }
    .avis-text { margin: 5px 0; font-size: 13px; color: #ddd; font-style: italic; }
    .avis-name { font-size: 11px; color: #888; }
    .avis-btn-add { display: block; width: 100%; padding: 10px; margin-top: 10px; background: gold; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; }
    
    #avisModal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 99999; display: none; align-items: center; justify-content: center; padding: 20px; }
    #avisModal.show { display: flex; }
    .am-box { background: #111; border: 1px solid gold; border-radius: 15px; width: 100%; max-width: 400px; padding: 20px; }
    .am-box h3 { color: gold; text-align: center; margin-bottom: 15px; }
    .am-input { width: 100%; padding: 10px; margin-bottom: 10px; background: #000; border: 1px solid #333; color: #fff; border-radius: 8px; font-size: 14px; }
    .am-stars { display: flex; gap: 5px; justify-content: center; font-size: 30px; cursor: pointer; margin-bottom: 15px; color: #555; }
    .am-stars span.active { color: gold; }
    .am-close { background: #333; color: #fff; border: none; padding: 10px; border-radius: 8px; width: 100%; margin-top: 10px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // 2. Création de la fenêtre d'ajout d'avis
  var modal = document.createElement('div');
  modal.id = 'avisModal';
  modal.innerHTML = `
    <div class="am-box">
      <h3>⭐ Laisser un avis</h3>
      <input type="text" id="amName" class="am-input" placeholder="Votre nom (ex: Kouassi)">
      <input type="text" id="amCity" class="am-input" placeholder="Votre quartier (ex: Cocody)">
      <div class="am-stars" id="amStars">
        <span onclick="setAvisStars(1)">★</span>
        <span onclick="setAvisStars(2)">★</span>
        <span onclick="setAvisStars(3)">★</span>
        <span onclick="setAvisStars(4)">★</span>
        <span onclick="setAvisStars(5)">★</span>
      </div>
      <textarea id="amText" class="am-input" rows="3" placeholder="Votre message..."></textarea>
      <button class="avis-btn-add" onclick="submitAvis()">Envoyer l'avis</button>
      <button class="am-close" onclick="closeAvisModal()">Annuler</button>
    </div>
  `;
  document.body.appendChild(modal);

  var currentStars = 5;
  window.setAvisStars = function(n) {
    currentStars = n;
    var spans = document.querySelectorAll('#amStars span');
    spans.forEach(function(s, i) { s.classList.toggle('active', i < n); });
  };
  setAvisStars(5);

  window.closeAvisModal = function() { modal.classList.remove('show'); };

  // 3. Envoi de l'avis vers Firebase
  window.submitAvis = function() {
    var name = document.getElementById('amName').value.trim();
    var city = document.getElementById('amCity').value.trim();
    var text = document.getElementById('amText').value.trim();

    if (!name || !text) {
      alert("Veuillez remplir votre nom et votre message.");
      return;
    }

    var id = 'av_' + Date.now();
    var avisObj = {
      id: id, name: name, city: city || 'Abidjan',
      text: text, stars: currentStars, date: Date.now()
    };

    if (typeof window.write === 'function') {
      window.write('reviews/' + id, avisObj);
      alert('✅ Merci ! Votre avis a bien été enregistré.');
      closeAvisModal();
      document.getElementById('amName').value = '';
      document.getElementById('amCity').value = '';
      document.getElementById('amText').value = '';
    } else {
      alert("Erreur : impossible d'enregistrer l'avis pour le moment.");
    }
  };

  // 4. Affichage des avis
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
    html += `<button class="avis-btn-add" onclick="document.getElementById('avisModal').classList.add('show')">✍️ Laisser un avis</button>`;
    container.innerHTML = html;
  }

  // 5. Écoute Firebase
  setTimeout(function() {
    if (window.fb && window.fb.D && window.fb.db) {
      window.fb.D.onValue(window.fb.D.ref(window.fb.db, 'reviews'), function(snap) {
        if (!window.S) window.S = {};
        window.S.reviews = snap.val() || {};
        renderAvis();
      });
    } else {
      setTimeout(renderAvis, 2000);
    }
  }, 1500);

})();
