(function() {
  'use strict';

  setTimeout(async function() {
    try {
      const B = "https://www.gstatic.com/firebasejs/12.19.0/";
      const A = await import(B + "firebase-app.js");
      const FS = await import(B + "firebase-firestore.js");

      let app;
      try { app = A.getApp(); } catch(e) { return; }
      const db = FS.getFirestore(app);
      window.__baData = window.__baData || {};

      function addProductToGlobal(p, prefix) {
        const id = prefix + p.id; 
        // ON CHERCHE LA PHOTO PARTOUT !
        const imgUrl = p.img || p.image || p.photo || p.pic || p.avatar || '';
        
        const prodObj = {
          id: id,
          name: p.name,
          price: p.price,
          cat: p.cat || p.category || 'Autres',
          img: imgUrl,
          stock: p.stock !== false,
          date: p.date || Date.now()
        };

        if (typeof S !== 'undefined' && S.products) {
          S.products[id] = prodObj;
        }
        window.__baData[id] = { a: prodObj };
      }

      function refreshStore() {
        if (typeof renderStore === 'function') renderStore();
      }

      FS.onSnapshot(FS.collection(db, 'articles'), (snap) => {
        snap.forEach(doc => {
          const p = doc.data();
          if (p.name && p.price) addProductToGlobal({...p, id: doc.id}, 'fs_art_');
        });
        refreshStore();
      });

      FS.onSnapshot(FS.collection(db, 'boutiques'), (snap) => {
        snap.forEach(doc => {
          const p = doc.data();
          if (p.products && Array.isArray(p.products)) {
             p.products.forEach((prod, i) => {
               addProductToGlobal({...prod, id: doc.id + '_' + i}, 'fs_bou_');
             });
          } else if (p.name && p.price) {
            addProductToGlobal({...p, id: doc.id}, 'fs_bou_');
          }
        });
        refreshStore();
      });

    } catch(e) { console.log('Erreur Pont:', e); }
  }, 2000);

  // --- BOUTONS ON/OFF ---
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
