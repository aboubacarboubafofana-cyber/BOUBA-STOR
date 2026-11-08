/* =============================================================
   GESTIONNAIRE DE MODULES & VITESSE TURBO
   ============================================================= */
(function() {
  'use strict';

  // 1. État des modules (ON par défaut)
  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  // 2. Chargement des scripts après l'affichage de la page
  window.addEventListener('load', function() {
    setTimeout(function() {
      
      // Si le catalogue est activé, on le charge
      if (isCatOn) {
        var catScript = document.createElement('script');
        catScript.src = "catalogue-articles.js";
        document.body.appendChild(catScript);
        console.log('🛍️ Catalogue chargé');
      }

      // Si la Vitesse Turbo est activée, on charge le reste
      if (isTurboOn) {
        // Pub Google
        var ads = document.createElement('script');
        ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6646794626292067";
        ads.async = true;
        ads.crossOrigin = "anonymous";
        document.head.appendChild(ads);

        // Chat & Alertes
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
        
        console.log('🚀 Turbo Vitesse chargé');
      }
    }, 1500); // 1.5 seconde de délai
  });

  // 3. Fonction pour activer/désactiver depuis le contrôle
  window.MODULES = {
    toggle: function(mod) {
      var key = mod === 'cat' ? 'mod_catalogue' : 'mod_turbo';
      var current = localStorage.getItem(key) !== 'off';
      localStorage.setItem(key, current ? 'off' : 'on');
      location.reload(); // On recharge la page pour appliquer
    }
  };

  // 4. Création du menu dans le Contrôle Admin
  var bound = false;
  function tryBind() {
    if (typeof window.setTab !== 'function' || typeof window.renderAdmin !== 'function' || typeof TABS === 'undefined') {
      return setTimeout(tryBind, 500);
    }
    if (bound) return;
    bound = true;

    var TAB_ID = 'modules';
    var TAB_LABEL = '🧩 Modules';

    var found = false;
    for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === TAB_ID) { found = true; break; }
    if (!found) TABS.push([TAB_ID, TAB_LABEL]);

    var _origSetTab = window.setTab;
    var _origRender = window.renderAdmin;

    window.renderAdmin = function() {
      var curTab = 'stats';
      try { curTab = tab; } catch(e) {}
      
      if (curTab === TAB_ID) {
        var tabsEl = document.getElementById('tabs');
        if (tabsEl) {
          tabsEl.innerHTML = TABS.map(function(t) {
            return '<button class="' + (t[0] === curTab ? 'on' : '') + '" onclick="setTab(\'' + t[0] + '\')">' + t[1] + '</button>';
          }).join('');
        }
        var body = document.getElementById('adminBody');
        if (body) {
          var cOn = localStorage.getItem('mod_catalogue') !== 'off';
          var tOn = localStorage.getItem('mod_turbo') !== 'off';

          var html = '<div class="ctrl"><h4 style="color:gold;margin-bottom:12px">🧩 Gestion des modules</h4>';
          html += '<p style="font-size:12px;color:#aaa;margin-bottom:15px">Activez ou désactivez les fonctionnalités de votre site en 1 clic.</p>';

          // Bouton Catalogue
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1a1a1a;border-radius:10px;margin-bottom:10px;border:1px solid ' + (cOn?'#25D366':'#ff4444') + '">';
          html += '<div><b style="color:#fff">🛍️ Catalogue Dynamique</b><br><span style="font-size:11px;color:#aaa">Fiche article + Similaires</span></div>';
          html += '<button class="gold" style="width:auto;padding:8px 16px;background:' + (cOn?'#25D366':'#ff4444') + ';color:#000;font-weight:900" onclick="MODULES.toggle(\'cat\')">' + (cOn?'ON':'OFF') + '</button></div>';

          // Bouton Turbo
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1a1a1a;border-radius:10px;border:1px solid ' + (tOn?'#25D366':'#ff4444') + '">';
          html += '<div><b style="color:#fff">🚀 Vitesse Turbo</b><br><span style="font-size:11px;color:#aaa">Charge les pubs et chats en différé</span></div>';
          html += '<button class="gold" style="width:auto;padding:8px 16px;background:' + (tOn?'#25D366':'#ff4444') + ';color:#000;font-weight:900" onclick="MODULES.toggle(\'turbo\')">' + (tOn?'ON':'OFF') + '</button></div>';

          html += '</div>';
          body.innerHTML = html;
        }
        return;
      }
      return _origRender.apply(this, arguments);
    };

    window.setTab = function(t) {
      if (t === TAB_ID) {
        try { tab = TAB_ID; } catch(e) {}
        return window.renderAdmin();
      }
      return _origSetTab.apply(this, arguments);
    };
  }

  setTimeout(tryBind, 1500);
})();
