/* =============================================================
   GESTIONNAIRE DE MODULES (INTÉGRÉ DANS VITESSE & CONNEXION)
   ============================================================= */
(function() {
  'use strict';

  // 1. État des modules
  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  // 2. Chargement des scripts après l'affichage
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

  // 3. Fonction ON/OFF
  window.MODULES = {
    toggle: function(mod) {
      var key = mod === 'cat' ? 'mod_catalogue' : 'mod_turbo';
      var current = localStorage.getItem(key) !== 'off';
      localStorage.setItem(key, current ? 'off' : 'on');
      location.reload();
    }
  };

  // 4. Injection des boutons DANS la fenêtre "Vitesse & connexion"
  function injecterBoutons() {
    if (document.getElementById('modToggleBox')) return; // Déjà injecté

    // On cherche la fenêtre modale ouverte par SPEED.open()
    var divs = Array.from(document.querySelectorAll('div'));
    var target = null;
    
    // On cherche le conteneur qui a "Vitesse" écrit dedans et qui est affiché au premier plan
    for (var i = divs.length - 1; i >= 0; i--) {
      var d = divs[i];
      var style = window.getComputedStyle(d);
      if (style.position === 'fixed' && parseInt(style.zIndex) > 100 && d.innerText.includes('Vitesse')) {
        target = d;
        break;
      }
    }

    // Si on a trouvé la fenêtre, on ajoute nos boutons à l'intérieur
    if (target) {
      var cOn = localStorage.getItem('mod_catalogue') !== 'off';
      var tOn = localStorage.getItem('mod_turbo') !== 'off';

      var box = document.createElement('div');
      box.id = 'modToggleBox';
      box.style.cssText = 'margin-top:15px; padding:15px; background:#111; border-radius:12px; border:1px solid #333; text-align:left;';

      var html = '<h4 style="color:gold;margin-bottom:10px;font-size:14px;text-align:center;">🧩 Gestion des modules</h4>';

      // Bouton Catalogue
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#1a1a1a;border-radius:8px;margin-bottom:10px;border:1px solid ' + (cOn?'#25D366':'#ff4444') + '">';
      html += '<div><b style="color:#fff;font-size:13px;">🛍️ Catalogue</b><br><span style="font-size:11px;color:#aaa">Fiches articles & similaires</span></div>';
      html += '<button style="padding:6px 14px;background:' + (cOn?'#25D366':'#ff4444') + ';color:#000;font-weight:900;border:none;border-radius:6px;cursor:pointer;" onclick="MODULES.toggle(\'cat\')">' + (cOn?'ON':'OFF') + '</button></div>';

      // Bouton Turbo
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#1a1a1a;border-radius:8px;border:1px solid ' + (tOn?'#25D366':'#ff4444') + '">';
      html += '<div><b style="color:#fff;font-size:13px;">🚀 Turbo Vitesse</b><br><span style="font-size:11px;color:#aaa">Charge pub/chat en différé</span></div>';
      html += '<button style="padding:6px 14px;background:' + (tOn?'#25D366':'#ff4444') + ';color:#000;font-weight:900;border:none;border-radius:6px;cursor:pointer;" onclick="MODULES.toggle(\'turbo\')">' + (tOn?'ON':'OFF') + '</button></div>';

      box.innerHTML = html;
      target.appendChild(box);
    }
  }

  // 5. On écoute le clic sur le bouton "Vitesse & connexion" pour injecter nos boutons juste après
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (btn && btn.innerText.includes('Vitesse & connexion')) {
      setTimeout(injecterBoutons, 300); // Petit délai pour laisser la fenêtre s'ouvrir
    }
  });

})();
