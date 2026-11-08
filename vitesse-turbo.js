/* =============================================================
   GESTIONNAIRE DE MODULES & PONT FIRESTORE
   ============================================================= */
(function() {
  'use strict';

  // 1. Fonction pour aller chercher les articles sur Firestore (Boutons boutiques)
  async function chargerArticlesFirestore() {
    try {
      // On importe la config de ton site
      const cfg = await import('./firebase-config.js');
      const app = cfg.app || (cfg.db && cfg.db.app);
      if (!app) return console.log('Pont: App Firebase introuvable');
      
      const fs = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const db = fs.getFirestore(app);
      
      // On écoute les collections où tes boutiques enregistrent leurs articles
      const collections = ['articles', 'products', 'boutiques'];
      
      collections.forEach(colName => {
        fs.onSnapshot(fs.collection(db, colName), (snap) => {
          if (!window.S) window.S = {};
          if (!window.S.products) window.S.products = {};
          
          snap.forEach(doc => {
            const p = doc.data();
            // On vérifie que c'est bien un article avec un nom et un prix
            if (p.name && p.price) {
              const id = 'fs_' + doc.id; // On ajoute 'fs_' pour ne pas écraser tes propres articles
              window.S.products[id] = {
                id: id,
                name: p.name,
                price: p.price,
                cat: p.cat || p.category || 'Autres',
                img: p.img || p.image || '',
                stock: p.stock !== false,
                date: p.date || Date.now(),
                isFirestore: true
              };
            }
          });
          
          // On demande à ton site de se mettre à jour pour afficher ces nouveaux articles
          if (typeof window.renderStore === 'function') {
            window.renderStore();
          }
        });
      });
    } catch(e) {
      console.log('Erreur Pont Firestore:', e);
    }
  }

  // 2. État des modules
  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  // 3. Chargement des scripts
  window.addEventListener('load', function() {
    setTimeout(function() {
      
      // On active le pont pour les autres boutiques
      chargerArticlesFirestore();

      // Si le bouton Catalogue est sur ON
      if (isCatOn) {
        var catScript = document.createElement('script');
        catScript.src = "catalogue-articles.js";
        document.body.appendChild(catScript);
      }

      // Si le bouton Turbo est sur ON
      if (isTurboOn) {
        var ads = document.createElement('script');
        ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6646794626292067";
        ads.async = true;
        ads.crossOrigin = "anonymous";
        document.head.appendChild(ads);

        var alertes = document.createElement('script');
        alertes.type = "module";
        alertes.src = "alertes.js";
        document.body.appendChild(alertes);

        var amis = document.createElement('script');
        amis.src = "amis5.js";
        document.body.appendChild(amis);

        var chat = document.createElement('script');
        chat.src = "bouba-chat.js";
        document.body.appendChild(chat);
      }
    }, 2000); // On attend 2 secondes que la page principale charge
  });

  // 4. Fonctions pour les boutons ON/OFF
  window.toggleModule = function(mod) {
    var key = mod === 'cat' ? 'mod_catalogue' : 'mod_turbo';
    var current = localStorage.getItem(key) !== 'off';
    localStorage.setItem(key, current ? 'off' : 'on');
    location.reload();
  };

  window.updateButtons = function() {
    var cOn = localStorage.getItem('mod_catalogue') !== 'off';
    var tOn = localStorage.getItem('mod_turbo') !== 'off';
    var bCat = document.getElementById('btn-mod-cat');
    var bTur = document.getElementById('btn-mod-turbo');
    if (bCat) { bCat.innerText = cOn ? 'ON' : 'OFF'; bCat.style.background = cOn ? '#25D366' : '#ff4444'; bCat.style.color = '#000'; }
    if (bTur) { bTur.innerText = tOn ? 'ON' : 'OFF'; bTur.style.background = tOn ? '#25D366' : '#ff4444'; bTur.style.color = '#000'; }
  };
  
  setInterval(window.updateButtons, 1000);

})();
