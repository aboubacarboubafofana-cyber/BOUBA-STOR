/* =============================================================
   GESTION DES RETOURS (Bouton Intelligent Client / Admin)
   ============================================================= */
(function() {
  'use strict';

  // 1. Styles CSS
  var style = document.createElement('style');
  style.innerHTML = `
    #retourModal, #retourAdminModal { position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:999999; display:none; align-items:center; justify-content:center; padding:15px; }
    #retourModal.show, #retourAdminModal.show { display:flex; }
    .rm-box { background:#111; border:1px solid gold; border-radius:15px; width:100%; max-width:450px; max-height:90vh; overflow-y:auto; padding:20px; color:#fff; font-family:Arial, sans-serif; }
    .rm-box h3 { color:gold; text-align:center; margin-bottom:15px; font-size:18px; }
    .rm-label { display:block; margin-bottom:5px; font-size:13px; color:#aaa; }
    .rm-select, .rm-input, .rm-textarea { width:100%; padding:12px; margin-bottom:15px; background:#000; border:1px solid #333; color:#fff; border-radius:8px; font-size:14px; }
    .rm-checkbox-group { background:#1a1a1a; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #333; }
    .rm-checkbox-item { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; cursor:pointer; }
    .rm-checkbox-item input { width:18px; height:18px; accent-color:gold; cursor:pointer; }
    .rm-btn-submit { width:100%; padding:14px; background:gold; color:#000; border:none; border-radius:8px; font-weight:900; font-size:15px; cursor:pointer; margin-bottom:10px; }
    .rm-btn-close { width:100%; padding:12px; background:#333; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; }

    .rt-card { background:#111; border:1px solid #333; border-radius:10px; padding:12px; margin-bottom:10px; color:#fff; }
    .rt-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:8px; }
    .rt-title { color:gold; font-weight:bold; font-size:14px; }
    .rt-status { font-size:11px; padding:3px 8px; border-radius:5px; font-weight:bold; }
    .rt-status.attente { background:#f39c12; color:#000; }
    .rt-status.approuve { background:#25D366; color:#000; }
    .rt-status.refuse { background:#ff4444; color:#fff; }
    .rt-info { font-size:12px; color:#aaa; margin-bottom:5px; }
    .rt-reason { background:#1a1a1a; padding:8px; border-radius:6px; font-size:12px; color:#ddd; margin:8px 0; border-left:3px solid gold; }
    .rt-actions { display:flex; gap:8px; margin-top:10px; }
    .rt-btn { flex:1; padding:10px; border:none; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; }
    .rt-btn-remb { background:#25D366; color:#000; }
    .rt-btn-echange { background:gold; color:#000; }
    .rt-btn-refus { background:#ff4444; color:#fff; }
  `;
  document.head.appendChild(style);

  // 2. Modale Client
  var modal = document.createElement('div');
  modal.id = 'retourModal';
  modal.innerHTML = `
    <div class="rm-box">
      <h3>🔄 Demande de retour</h3>
      <label class="rm-label">Quel article voulez-vous retourner ?</label>
      <select id="rtOrderSelect" class="rm-select"><option value="">Chargement...</option></select>
      <label class="rm-label">Motif du retour :</label>
      <div class="rm-checkbox-group" id="rtReasons">
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Mauvaise taille"> Mauvaise taille</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Mauvaise couleur"> Mauvaise couleur reçue</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Article défectueux"> Article défectueux / Cassé</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Erreur de commande"> Ce n'est pas ce que j'ai commandé</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Article endommagé"> Endommagé à la livraison</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Qualité insuffisante"> Ne correspond pas à la photo</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Autre"> Autre (précisez en bas)</label>
      </div>
      <label class="rm-label">Détails (Optionnel)</label>
      <textarea id="rtDetails" class="rm-textarea" rows="2" placeholder="Expliquez..."></textarea>
      <button class="rm-btn-submit" onclick="submitRetour()">Envoyer ma demande</button>
      <button class="rm-btn-close" onclick="document.getElementById('retourModal').classList.remove('show')">Annuler</button>
    </div>
  `;
  document.body.appendChild(modal);

  // 3. Modale Admin
  var adminModal = document.createElement('div');
  adminModal.id = 'retourAdminModal';
  adminModal.innerHTML = `
    <div class="rm-box" style="max-width: 600px;">
      <h3>🔄 Gestion des Retours (Admin)</h3>
      <div id="adminRetoursList" style="margin-bottom: 15px;"></div>
      <button class="rm-btn-close" onclick="document.getElementById('retourAdminModal').classList.remove('show')">Fermer</button>
    </div>
  `;
  document.body.appendChild(adminModal);

  // 4. LE BOUTON INTELLIGENT
  window.openRetourModal = function() {
    var isAdminUser = (typeof isAdmin !== 'undefined' && isAdmin) || (window.isAdmin === true);
    
    if (isAdminUser) {
      renderAdminRetoursUI();
      document.getElementById('retourAdminModal').classList.add('show');
    } else {
      if (typeof me === 'undefined' || !me || !me.phone) { alert("Connectez-vous pour faire un retour."); return; }
      var select = document.getElementById('rtOrderSelect');
      select.innerHTML = '';
      var allOrders = (window.S && window.S.orders) ? window.S.orders : {};
      var myPhone = (me.phone || '').replace(/\D/g, '');
      
      var userOrders = Object.values(allOrders).filter(function(o) {
        // On compare les numéros de téléphone
        return o && o.phone && o.phone.replace(/\D/g, '') === myPhone && o.status !== 'annulée';
      }).sort(function(a, b) { return b.date - a.date; });

      if (userOrders.length === 0) { 
        select.innerHTML = '<option value="">Aucune commande trouvée pour ce numéro.</option>'; 
      } else {
        select.innerHTML = '<option value="">-- Choisir l\'article à retourner --</option>';
        userOrders.forEach(function(o) {
          if (o.items && o.items.length > 0) {
            o.items.forEach(function(item, index) {
              var opt = document.createElement('option');
              // On stocke l'ID de la commande et l'index de l'article séparés par ||
              opt.value = o.id + '||' + index;
              opt.text = 'Cmd #' + o.id.slice(-4) + ' - ' + item.name + ' (' + item.price + ' F)';
              select.appendChild(opt);
            });
          }
        });
      }
      document.getElementById('retourModal').classList.add('show');
    }
  };

  // 5. Envoi Client
  window.submitRetour = async function() {
    var selectedVal = document.getElementById('rtOrderSelect').value;
    var reasonInput = document.querySelector('input[name="rtReason"]:checked');
    var details = document.getElementById('rtDetails').value.trim();

    if (!selectedVal) { alert("Sélectionnez l'article à retourner."); return; }
    if (!reasonInput) { alert("Cochez un motif."); return; }
    
    // On récupère l'ID de la commande et l'index de l'article
    var parts = selectedVal.split('||');
    var orderId = parts[0];
    var itemIndex = parseInt(parts[1]);
    
    var order = (window.S && window.S.orders) ? window.S.orders[orderId] : null;
    var item = (order && order.items && order.items[itemIndex]) ? order.items[itemIndex] : {};

    var id = 'ret_' + Date.now();
    var obj = {
      id: id, 
      orderId: orderId, 
      clientName: me.name, 
      clientPhone: me.phone,
      productName: item.name || 'Article', 
      amount: item.price * (item.qty || 1), // On prend le prix de l'article spécifique
      reason: reasonInput.value, 
      details: details, 
      status: 'attente', 
      date: Date.now()
    };

    if (typeof window.write === 'function') {
      try {
        await window.write('returns/' + id, obj);
        alert('✅ Demande envoyée ! L\'admin va l\'examiner.');
        document.getElementById('retourModal').classList.remove('show');
      } catch (e) { alert('Erreur : ' + e.message); }
    }
  };

  // 6. Affichage Admin
  function renderAdminRetoursUI() {
    var body = document.getElementById('adminRetoursList');
    var allRetours = (window.S && window.S.returns) ? window.S.returns : {};
    var list = Object.values(allRetours).sort((a, b) => b.date - a.date);
    var html = '';
    
    if (list.length === 0) {
      html += '<p style="text-align:center; color:#888; padding:20px;">Aucune demande de retour pour le moment.</p>';
    } else {
      list.forEach(r => {
        var sTxt = 'En attente', sCls = 'attente';
        if (r.status === 'rembourse') { sTxt = 'Remboursé'; sCls = 'approuve'; }
        if (r.status === 'echange') { sTxt = 'Échangé'; sCls = 'approuve'; }
        if (r.status === 'refuse') { sTxt = 'Refusé'; sCls = 'refuse'; }

        html += `
          <div class="rt-card">
            <div class="rt-header"><span class="rt-title">Cmd #${r.orderId.slice(-4)}</span><span class="rt-status ${sCls}">${sTxt}</span></div>
            <div class="rt-info">Client : <b>${r.clientName}</b> (${r.clientPhone})</div>
            <div class="rt-info">Article : <b>${r.productName}</b> - ${Number(r.amount).toLocaleString('fr-FR')} F</div>
            <div class="rt-info">Motif : <b style="color:gold">${r.reason}</b></div>
            ${r.details ? '<div class="rt-reason">" ' + r.details + ' "</div>' : ''}
        `;
        if (r.status === 'attente') {
          html += `
            <div class="rt-actions">
              <button class="rt-btn rt-btn-remb" onclick="actionRetour('${r.id}', 'rembourse')">💸 Rembourser</button>
              <button class="rt-btn rt-btn-echange" onclick="actionRetour('${r.id}', 'echange')">🔄 Échanger</button>
              <button class="rt-btn rt-btn-refus" onclick="actionRetour('${r.id}', 'refuse')">❌ Refuser</button>
            </div>
          `;
        }
        html += `</div>`;
      });
    }
    body.innerHTML = html;
  }

  // 7. Action Admin
  window.actionRetour = async function(id, action) {
    if (!confirm("Confirmer cette action ?")) return;
    if (typeof window.write === 'function') {
      await window.write('returns/' + id + '/status', action);
      alert('Action validée !');
      renderAdminRetoursUI();
    }
  };

})();
