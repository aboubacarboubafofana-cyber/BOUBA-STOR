/* =============================================================
   ESPACE CLIENT COMPLET & HISTORIQUE DES COMMANDES (1/2)
   ============================================================= */
(function() {
  'use strict';

  // 1. Création du design (Thème Noir & Or)
  var style = document.createElement('style');
  style.innerHTML = `
    /* --- PAGE PROFIL --- */
    #profilAvancePage { position:fixed; inset:0; background:#000; z-index:99999; display:none; flex-direction:column; overflow-y:auto; font-family: Arial, sans-serif; color: #fff; padding-bottom: 80px; }
    #profilAvancePage.show { display: flex; }
    .pa-header { background: #111; padding: 15px; border-bottom: 1px solid #333; display: flex; align-items: center; gap: 10px; position: sticky; top:0; z-index: 10; }
    .pa-close { background: #333; color: #fff; border: none; padding: 8px 15px; border-radius: 20px; font-weight: bold; cursor: pointer; font-size: 14px; }
    .pa-user { padding: 20px 15px; background: #111; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #333; }
    .pa-avatar { width: 60px; height: 60px; border-radius: 50%; background: gold; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #000; font-weight: bold; }
    .pa-user-info h3 { margin: 0; font-size: 18px; color: gold; }
    .pa-user-info p { margin: 4px 0 0; font-size: 13px; color: #aaa; }
    .pa-credit { padding: 15px; background: #1a1500; border-bottom: 1px solid #333; display: flex; align-items: center; gap: 10px; color: gold; font-weight: bold; font-size: 14px; }
    .pa-actions { padding: 15px; display: flex; gap: 10px; background: #000; border-bottom: 10px solid #111; }
    .pa-actions button { flex: 1; padding: 14px; border-radius: 10px; border: none; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
    .pa-btn-chat { background: #25D366; color: #000; }
    .pa-btn-cart { background: gold; color: #000; }
    .pa-section-title { padding: 15px 15px 5px; font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; background: #000; }
    .pa-list { background: #111; margin-bottom: 10px; border-top: 1px solid #333; border-bottom: 1px solid #333; }
    .pa-item { display: flex; align-items: center; padding: 16px 15px; border-bottom: 1px solid #222; cursor: pointer; text-decoration: none; color: #fff; }
    .pa-item:last-child { border-bottom: none; }
    .pa-item-icon { width: 30px; font-size: 18px; text-align: center; margin-right: 15px; color: gold; }
    .pa-item-text { flex: 1; font-size: 15px; font-weight: 600; }
    .pa-item-arrow { color: #555; font-size: 18px; }
    .pa-logout { text-align: center; color: #ff4444; font-weight: bold; padding: 20px; font-size: 16px; cursor: pointer; background: #111; border: 1px solid #ff4444; border-radius: 10px; width: calc(100% - 30px); margin: 15px auto; display: block; }

    /* --- PAGE COMMANDES --- */
    #myOrdersPage { position:fixed; inset:0; background:#000; z-index:100000; display:none; flex-direction:column; overflow-y:auto; font-family: Arial, sans-serif; color: #fff; padding-bottom: 20px; }
    #myOrdersPage.show { display: flex; }
    .mo-tabs { display: flex; background: #111; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10; }
    .mo-tab { flex: 1; text-align: center; padding: 15px; font-weight: bold; color: #888; cursor: pointer; font-size: 14px; }
    .mo-tab.active { color: gold; border-bottom: 3px solid gold; }
    .mo-list { padding: 10px; }
    .mo-card { background: #111; border-radius: 10px; padding: 10px; margin-bottom: 10px; display: flex; gap: 10px; border: 1px solid #222; }
    .mo-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; background: #222; }
    .mo-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .mo-name { font-size: 13px; font-weight: bold; color: #fff; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .mo-id { font-size: 11px; color: #888; }
    .mo-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin: 6px 0; width: fit-content; }
    .badge-livre { background: #25D366; color: #000; }
    .badge-annule { background: #555; color: #fff; }
    .badge-cours { background: #f39c12; color: #000; }
    .badge-retour { background: #00bcd4; color: #000; }
    .mo-date { font-size: 11px; color: #aaa; font-weight: bold; }
    .mo-empty { text-align: center; color: #888; padding: 40px 20px; font-size: 14px; }
  `;
  document.head.appendChild(style);

  // 2. Structure de la page Profil
  var page = document.createElement('div');
  page.id = 'profilAvancePage';
  page.innerHTML = `
    <div class="pa-header">
      <button class="pa-close" onclick="closeProfilAvance()">← Retour</button>
      <b style="color:gold; font-size:16px;">Mon Espace Client</b>
    </div>
    <div class="pa-user">
      <div class="pa-avatar" id="pa-avatar-txt">👤</div>
      <div class="pa-user-info">
        <h3 id="pa-name">Chargement...</h3>
        <p id="pa-phone">...</p>
      </div>
    </div>
    <div class="pa-credit">
      <span style="background:gold; color:#000; padding:2px 6px; border-radius:4px; font-size:12px;">BOuba</span>
      Solde de crédit : <span id="pa-balance">0 FCFA</span>
    </div>
    <div class="pa-actions">
      <button class="pa-btn-chat" onclick="location.href='amis.html'">💬 Chat du Site</button>
      <button class="pa-btn-cart" onclick="openPage('cartPage'); closeProfilAvance();">🛒 Mon Panier</button>
    </div>
    <div class="pa-section-title">Mes Activités</div>
    <div class="pa-list">
      <div class="pa-item" onclick="openMyOrders()">
        <div class="pa-item-icon">📦</div>
        <div class="pa-item-text">Mes commandes</div>
        <div class="pa-item-arrow">›</div>
      </div>
      <div class="pa-item" onclick="location.href='amis.html'">
        <div class="pa-item-icon">✉️</div>
        <div class="pa-item-text">Mes messages</div>
        <div class="pa-item-arrow">›</div>
      </div>
      <div class="pa-item" onclick="location.href='avis.html'">
        <div class="pa-item-icon">⭐</div>
        <div class="pa-item-text">Mes avis et notes</div>
        <div class="pa-item-arrow">›</div>
      </div>
      <div class="pa-item" onclick="openPage('sharePage')">
        <div class="pa-item-icon">❤️</div>
        <div class="pa-item-text">Mes favoris</div>
        <div class="pa-item-arrow">›</div>
      </div>
    </div>
    <div class="pa-section-title">Mes Paramètres</div>
    <div class="pa-list">
      <div class="pa-item" onclick="openPage('profilePage'); closeProfilAvance();">
        <div class="pa-item-icon">👤</div>
        <div class="pa-item-text">Modifier mon profil</div>
        <div class="pa-item-arrow">›</div>
      </div>
      <div class="pa-item" onclick="location.href='confidentialite.html'">
        <div class="pa-item-icon">🔒</div>
        <div class="pa-item-text">Confidentialité</div>
        <div class="pa-item-arrow">›</div>
      </div>
    </div>
    <button class="pa-logout" onclick="logout(); closeProfilAvance();">🚪 Se Déconnecter</button>
  `;
  document.body.appendChild(page);

  // 3. Structure de la page Commandes
  var ordersPage = document.createElement('div');
  ordersPage.id = 'myOrdersPage';
  ordersPage.innerHTML = `
    <div class="pa-header">
      <button class="pa-close" onclick="closeMyOrders()">← Retour</button>
      <b style="color:gold; font-size:16px;">Mes Commandes</b>
    </div>
    <div class="mo-tabs">
      <div class="mo-tab active" id="tab-cours" onclick="switchOrderTab('cours')">EN COURS / LIVRÉES</div>
      <div class="mo-tab" id="tab-annule" onclick="switchOrderTab('annule')">ANNULÉES / RETOURS</div>
    </div>
    <div class="mo-list" id="ordersList">
      <div class="mo-empty">Chargement de vos commandes...</div>
    </div>
  `;
  document.body.appendChild(ordersPage);
    // 4. Logique de la page Profil
  window.openProfilAvance = function() {
    if (typeof me !== 'undefined' && me) {
      document.getElementById('pa-name').innerText = 'Bienvenue, ' + (me.name || 'Client') + ' !';
      document.getElementById('pa-phone').innerText = me.phone || '';
      document.getElementById('pa-avatar-txt').innerText = (me.name || 'C').charAt(0).toUpperCase();
    } else {
      document.getElementById('pa-name').innerText = 'Bienvenue !';
      document.getElementById('pa-phone').innerText = 'Connectez-vous pour voir vos infos';
    }
    page.classList.add('show');
  };

  window.closeProfilAvance = function() {
    page.classList.remove('show');
  };

  // 5. Logique de la page Commandes
  var currentOrderTab = 'cours';

  window.openMyOrders = function() {
    if (typeof me === 'undefined' || !me || !me.phone) {
      alert("Veuillez vous connecter pour voir vos commandes.");
      return;
    }
    ordersPage.classList.add('show');
    renderMyOrders();
  };

  window.closeMyOrders = function() {
    ordersPage.classList.remove('show');
  };

  window.switchOrderTab = function(tab) {
    currentOrderTab = tab;
    document.getElementById('tab-cours').classList.toggle('active', tab === 'cours');
    document.getElementById('tab-annule').classList.toggle('active', tab === 'annule');
    renderMyOrders();
  };

  function renderMyOrders() {
    var list = document.getElementById('ordersList');
    list.innerHTML = '<div class="mo-empty">Recherche de vos commandes...</div>';

    // On récupère les commandes depuis la mémoire de ton site
    var S = window.S || {};
    var allOrders = S.orders || {};
    var myPhone = (me.phone || '').replace(/\D/g, '');
    
    // On filtre pour ne garder que les commandes de ce client
    var userOrders = Object.values(allOrders).filter(function(o) {
      return o && o.phone && o.phone.replace(/\D/g, '') === myPhone;
    }).sort(function(a, b) { return b.date - a.date; });

    if (userOrders.length === 0) {
      list.innerHTML = '<div class="mo-empty">Vous n\'avez pas encore de commande.</div>';
      return;
    }

    var html = '';
    userOrders.forEach(function(o) {
      var statusText = 'EN COURS';
      var badgeClass = 'badge-cours';

      if (o.status === 'livrée') { statusText = 'COLIS LIVRÉ'; badgeClass = 'badge-livre'; }
      else if (o.status === 'annulée') { statusText = 'ANNULÉE'; badgeClass = 'badge-annule'; }
      else if (o.status === 'retour') { statusText = 'RETOUR EN COURS'; badgeClass = 'badge-retour'; }

      var isCancelled = (o.status === 'annulée' || o.status === 'retour');
      
      // Gestion des onglets
      if (currentOrderTab === 'cours' && isCancelled) return;
      if (currentOrderTab === 'annule' && !isCancelled) return;

      // Image du premier article
      var firstItem = o.items && o.items[0] ? o.items[0] : {};
      var imgSrc = '';
      
      // On cherche la photo de l'article
      if (firstItem.id && S.products && S.products[firstItem.id]) {
        imgSrc = S.products[firstItem.id].img;
      } else if (firstItem.id && window.__baData && window.__baData[firstItem.id]) {
        imgSrc = window.__baData[firstItem.id].a.img;
      }
      if(!imgSrc) imgSrc = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

      var itemName = firstItem.name || 'Article';
      var d = new Date(o.date);
      var dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' });

      html += `
        <div class="mo-card">
          <img src="${imgSrc}" class="mo-img">
          <div class="mo-info">
            <div>
              <div class="mo-name">${itemName}</div>
              <div class="mo-id">Commande #${o.id.replace(/\D/g,'').slice(-9)}</div>
              <div class="mo-badge ${badgeClass}">${statusText}</div>
            </div>
            <div class="mo-date">Le ${dateStr}</div>
          </div>
        </div>
      `;
    });

    if (html === '') {
      list.innerHTML = '<div class="mo-empty">Aucune commande dans cette catégorie.</div>';
    } else {
      list.innerHTML = html;
    }
  }

})();
