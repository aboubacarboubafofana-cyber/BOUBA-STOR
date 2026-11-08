(function() {
  'use strict';

  var isCatOn = localStorage.getItem('mod_catalogue') !== 'off';
  var isTurboOn = localStorage.getItem('mod_turbo') !== 'off';

  window.addEventListener('load', function() {
    setTimeout(function() {
      
      // Si le bouton Catalogue est sur ON, on charge la fiche article
      if (isCatOn) {
        var catScript = document.createElement('script');
        catScript.src = "catalogue-articles.js";
        document.body.appendChild(catScript);
      }

      // Si le bouton Turbo est sur ON, on charge la pub, le chat et les alertes
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
    }, 1500); // Délai d'1,5 seconde
  });
})();
