/* =============================================================
   GESTIONNAIRE DE MODULES & PONT FIRESTORE
   ============================================================= */
(function() {
  'use strict';

  // 1. Pont Firestore
  async function initBridge() {
    if (window._bridgeInitialized) return;
    window._bridgeInitialized = true;

    try {
      const cfg = await import('./firebase-config.js');
      const db = cfg.db || cfg.default || window.db;
      if (!db) return console.log('Pont: Firebase introuvable');

      const fs = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      window.__baData = window.__baData || {};

      const cols = ['articles', 'products', 'boutiques'];

      cols.forEach(col => {
        fs.onSnapshot(fs.collection(db, col), (snap) => {
          snap.forEach(doc => {
            const p = doc.data();
            if (p.name && p.price) {
              const id = 'fs_' + doc.id;
              window.__baData[id] = { a: {
                id: id,
                name: p.name,
                price: p.price,
                cat: p.cat || p.category || 'Autres',
                img: p.img || p.image || '',
                stock: p.stock !== false,
                date: p.date || Date.now()
              }};
            }
          });
          if (window.renderStore) window.renderStore();
        });
      });

      // On enveloppe le renderStore pour ajouter nos articles à la suite
      if (window.renderStore && !window._bridgePatched) {
        window._bridgePatched = true;
        const _orig = window.renderStore;
        window.renderStore = function() {
          _orig.apply(this, arguments);
          
          const grid = document.getElementById('grid');
          if (!grid) return;

          const activeCatBtn = document.querySelector('#cats .cat.active');
          const activeCat = activeCatBtn ? (activeCatBtn.textContent === 'Tout' ? 'all' : activeCatBtn.textContent) : 'all';
          const searchVal = (document.getElementById('qIn')?.value || '').toLowerCase();

          const fsItems = Object.values(window.__baData).filter(x => {
            let p = x.a;
            if (activeCat !== 'all' && p.cat !== activeCat) return false;
            if (searchVal && !p.name.toLowerCase().includes(searchVal)) return false;
            return true;
          }).map(x => x.a);

          if (fsItems.length === 0) return;

          const fsHtml = fsItems.map(p => `
            <div class="card" data-pid="${p.id}">
              ${p.stock === false ? '<span class="badge">ÉPUISÉ</span>' : ''}
              <img loading="lazy" decoding="async" src="${p.img}">
              <div class="info">
                <b>${p.name}</b><br>
                <span style="color:gold">${Number(p.price).toLocaleString('fr-FR')} F</span>
                <button class="btn" ${p.stock === false ? 'disabled' : ''} onclick="addCart('${p.id}')">🛒 Ajouter</button>
              </div>
            </div>
          `).join('');
          
          grid.innerHTML += fsHtml;
        };
      }
    } catch(e) {
      console.log('Erreur Pont Firestore:', e);
    }
  }

  // 2. État des modules
  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  window.addEventListener('load', function() {
    setTimeout(function() {
      initBridge(); // On active le pont

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
    }, 1500);
  });

  // 3. Boutons
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
