/* =============================================================
   VITESSE TURBO — Charge les articles d'abord, le reste après
   ============================================================= */
(function() {
  'use strict';

  // On attend que la page principale (tes articles) soit affichée
  window.addEventListener('load', function() {
    
    // On attend 2 secondes pour laisser le client voir la boutique
    setTimeout(function() {
      
      // 1. On charge la publicité Google AdSense
      var ads = document.createElement('script');
      ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6646794626292067";
      ads.async = true;
      ads.crossOrigin = "anonymous";
      document.head.appendChild(ads);

      // 2. On charge le module d'alertes
      var alertes = document.createElement('script');
      alertes.type = "module";
      alertes.src = "alertes.js";
      document.body.appendChild(alertes);

      // 3. On charge le chat des amis
      var amis = document.createElement('script');
      amis.src = "amis5.js";
      document.body.appendChild(amis);

      // 4. On charge le chat de la boutique
      var chat = document.createElement('script');
      chat.src = "bouba-chat.js";
      document.body.appendChild(chat);

      console.log('🚀 Turbo Vitesse : Scripts lourds chargés en arrière-plan !');
      
    }, 2000); // Délai de 2 secondes
  });
})();
