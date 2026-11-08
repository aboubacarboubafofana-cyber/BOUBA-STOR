/* =============================================================
   PONT FIRESTORE INTELLIGENT (Injecte les articles dans l'index)
   ============================================================= */
(function() {
  'use strict';

  // 1. On attend 2 secondes que le site principal charge
  setTimeout(async function() {
    try {
      const B = "https://www.gstatic.com/firebasejs/12.19.0/";
      const A = await import(B + "firebase-app.js");
      const FS = await import(B + "firebase-firestore.js");

      let app;
      try { app = A.getApp(); } catch(e) { console.log('Firebase non initialisé'); return; }
      const db = FS.getFirestore(app);

      // On s'assure que le cache global existe
      window.__baData = window.__baData || {};

      // Fonction pour ajouter un article dans le système du site
      function addProductToGlobal(p, prefix) {
        const id = prefix + p.id; 
        const prodObj = {
          id: id,
          name: p.name,
          price: p.price,
          cat: p.cat || p.category || 'Autres',
          img: p.img || p.image || '',
          stock: p.stock !== false,
          date: p.date || Date.now()
        };

        // 🔥 LA CLÉ EST ICI : On l'ajoute dans la variable S de ton index.html
        if (typeof S !== 'undefined' && S.products) {
          S.products[id] = prodObj;
        }
        // On l'ajoute aussi dans le cache de secours (pour le panier)
        window.__baData[id] = { a: prodObj };
      }

      // Fonction pour redessiner la boutique
      function refreshStore() {
        if (typeof renderStore === 'function') {
          renderStore(); // Ton site va se mettre à jour tout seul !
        }
      }

      // 2. ÉCOUTE DES ARTICLES (Collection "articles")
      FS.onSnapshot(FS.collection(db, 'articles'), (snap) => {
        snap.forEach(doc => {
          const p = doc.data();
          if (p.name && p.price) {
            addProductToGlobal({...p, id: doc.id}, 'fs_art_');
          }
        });
        refreshStore();
      });

      // 3. ÉCOUTE DES BOUTIQUES (Collection "boutiques")
      FS.onSnapshot(FS.collection(db, 'boutiques'), (snap) => {
        snap.forEach(doc => {
          const p = doc.data();
          // Parfois un document boutique contient un tableau de produits
          if (p.products && Array.isArray(p.products)) {
             p.products.forEach((prod, i) => {
               addProductToGlobal({...prod, id: doc.id + '_' + i}, 'fs_bou_');
             });
          }
          // Parfois le doc lui-même est un article
          else if (p.name && p.price) {
            addProductToGlobal({...p, id: doc.id}, 'fs_bou_');
          }
        });
        refreshStore();
      });

    } catch(e) {
      console.log('Erreur Pont Firestore:', e);
    }
  }, 2500); // 2.5s de délai pour laisser le site charger ses propres articles

  // --- BOUTONS ON/OFF (Catalogue & Turbo) ---
  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  window.addEventListener('load', function() {
    setTimeout(function() {
      if (isCatOn) {
        var catScript = document.createElement('script');
        catScript.src = "catalogue-articles.js";
        document.body.appendChild(catScript);
      }
      if (isTurboOn) {
        var ads = document.createElement('script');
        ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6646794626292067";
        ads.async = true;
        ads.crossOrigin = "anonymous";
        document.head.appendChild(ads);
      }
    }, 1500);
  });

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
