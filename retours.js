/* =============================================================
   GESTION DES RETOURS & REMBOURSEMENTS (1/2)
   ============================================================= */
(function() {
  'use strict';

  // 1. Styles CSS
  var style = document.createElement('style');
  style.innerHTML = `
    /* Bouton Client */
    #retourClientBtn { position:fixed; bottom:200px; left:15px; z-index:999; background:#ff4444; color:#fff; padding:12px 18px; border-radius:20px; font-weight:bold; font-family:Arial, sans-serif; font-size:14px; text-decoration:none; box-shadow:0 4px 8px rgba(0,0,0,0.5); display:flex; align-items:center; gap:5px; cursor:pointer; border:none; }
    
    /* Modale Client */
    #retourModal { position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:99999; display:none; align-items:center; justify-content:center; padding:15px; }
    #retourModal.show { display:flex; }
    .rm-box { background:#111; border:1px solid gold; border-radius:15px; width:100%; max-width:450px; max-height:90vh; overflow-y:auto; padding:20px; color:#fff; font-family:Arial, sans-serif; }
    .rm-box h3 { color:gold; text-align:center; margin-bottom:15px; font-size:18px; }
    .rm-label { display:block; margin-bottom:5px; font-size:13px; color:#aaa; }
    .rm-select, .rm-input, .rm-textarea { width:100%; padding:12px; margin-bottom:15px; background:#000; border:1px solid #333; color:#fff; border-radius:8px; font-size:14px; }
    .rm-checkbox-group { background:#1a1a1a; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #333; }
    .rm-checkbox-item { display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; cursor:pointer; }
    .rm-checkbox-item input { width:18px; height:18px; accent-color:gold; cursor:pointer; }
    .rm-btn-submit { width:100%; padding:14px; background:gold; color:#000; border:none; border-radius:8px; font-weight:900; font-size:15px; cursor:pointer; margin-bottom:10px; }
    .rm-btn-close { width:100%; padding:12px; background:#333; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; }

    /* Onglet Admin */
    .rt-card { background:#111; border:1px solid #333; border-radius:10px; padding:12px; margin-bottom:10px; }
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

  // 2. Bouton Client (On l'ajoute dynamiquement au-dessus du bouton Conseil)
  var clientBtn = document.createElement('button');
  clientBtn.id = 'retourClientBtn';
  clientBtn.innerHTML = '🔄 Retourner un article';
  clientBtn.onclick = openRetourModal;
  document.body.appendChild(clientBtn);

  // 3. Modale Client (Le formulaire)
  var modal = document.createElement('div');
  modal.id = 'retourModal';
  modal.innerHTML = `
    <div class="rm-box">
      <h3>🔄 Demande de retour</h3>
      <label class="rm-label">Quel article voulez-vous retourner ?</label>
      <select id="rtOrderSelect" class="rm-select">
        <option value="">Chargement de vos commandes...</option>
      </select>

      <label class="rm-label">Quel est le motif du retour ? (Cochez une case)</label>
      <div class="rm-checkbox-group" id="rtReasons">
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Mauvaise taille"> Mauvaise taille / Taille inadaptée</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Mauvaise couleur"> Mauvaise couleur reçue</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Article défectueux"> Article défectueux / Cassé</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Erreur de commande"> Ce n'est pas ce que j'ai commandé</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Article endommagé"> Article endommagé pendant la livraison</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Qualité insuffisante"> Qualité insuffisante / Ne correspond pas à la photo</label>
        <label class="rm-checkbox-item"><input type="radio" name="rtReason" value="Autre"> Autre (précisez ci-dessous)</label>
      </div>

      <label class="rm-label">Détails supplémentaires (Optionnel)</label>
      <textarea id="rtDetails" class="rm-textarea" rows="3" placeholder="Expliquez-nous brièvement le problème..."></textarea>

      <button class="rm-btn-submit" onclick="submitRetour()">Envoyer ma demande</button>
      <button class="rm-btn-close" onclick="closeRetourModal()">Annuler</button>
    </div>
  `;
  document.body.appendChild(modal);

  window.closeRetourModal = function() {
    modal.classList.remove('show');
  };

  // 4. Logique d'ouverture (Charger les commandes du client)
  window.openRetourModal = function() {
    if (typeof me === 'undefined' || !me || !me.phone) {
      alert("Veuillez vous connecter pour faire une demande de retour.");
      return;
    }

    var select = document.getElementById('rtOrderSelect');
    select.innerHTML = '';

    var S = window.S || {};
    var allOrders = S.orders || {};
    var myPhone = (me.phone || '').replace(/\D/g, '');
    
    // On ne garde que les commandes livrées ou en cours de ce client
    var userOrders = Object.values(allOrders).filter(function(o) {
      return o && o.phone && o.phone.replace(/\D/g, '') === myPhone && o.status !== 'annulée';
    }).sort(function(a, b) { return b.date - a.date; });

    if (userOrders.length === 0) {
      select.innerHTML = '<option value="">Vous n\\'avez aucune commande éligible au retour.</option>';
    } else {
      select.innerHTML = '<option value="">-- Sélectionnez un article --</option>';
      userOrders.forEach(function(o) {
        var item = o.items && o.items[0] ? o.items[0].name : 'Article inconnu';
        var opt = document.createElement('option');
        opt.value = o.id;
        opt.text = 'Commande #' + o.id.replace(/\D/g,'').slice(-6) + ' - ' + item;
        select.appendChild(opt);
      });
    }

    modal.classList.add('show');
  };
    // 5. Envoi de la demande vers Firebase
  window.submitRetour = async function() {
    var orderId = document.getElementById('rtOrderSelect').value;
    var reasonInput = document.querySelector('input[name="rtReason"]:checked');
    var details = document.getElementById('rtDetails').value.trim();

    if (!orderId) { alert("Veuillez sélectionner l'article à retourner."); return; }
    if (!reasonInput) { alert("Veuillez cocher un motif de retour."); return; }
    if (reasonInput.value === "Autre" && !details) { alert("Veuillez préciser le motif dans les détails."); return; }

    var S = window.S || {};
    var order = S.orders[orderId];
    if (!order) { alert("Commande introuvable."); return; }

    var item = order.items && order.items[0] ? order.items[0] : {};
    var id = 'ret_' + Date.now();
    
    var retourObj = {
      id: id,
      orderId: orderId,
      clientName: me.name,
      clientPhone: me.phone,
      productName: item.name || 'Article',
      productImg: item.img || '',
      amount: order.total,
      reason: reasonInput.value,
      details: details,
      status: 'attente', // attente, rembourse, echange, refuse
      date: Date.now()
    };

    if (typeof window.write === 'function') {
      try {
        await window.write('returns/' + id, retourObj);
        alert('✅ Votre demande de retour a été envoyée. L\\'administrateur va l\\'examiner.');
        closeRetourModal();
        document.getElementById('rtDetails').value = '';
        document.getElementById('rtOrderSelect').value = '';
        document.querySelectorAll('input[name="rtReason"]').forEach(r => r.checked = false);
      } catch (e) {
        alert('Erreur lors de l\\'envoi : ' + e.message);
      }
    } else {
      alert("Erreur de connexion. Réessayez.");
    }
  };

  // 6. Création de l'onglet Admin (Injection dans le Contrôle)
  function bindAdmin() {
    if (typeof window.setTab !== 'function' || typeof window.renderAdmin !== 'function') {
      return setTimeout(bindAdmin, 500);
    }

    var TAB_ID = 'retours';
    var TAB_LABEL = '🔄 Retours';

    // Ajouter l'onglet dans la liste TABS
    if (typeof TABS !== 'undefined') {
      var found = false;
      for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === TAB_ID) { found = true; break; }
      if (!found) TABS.push([TAB_ID, TAB_LABEL]);
    }

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
        if (body) renderAdminRetours(body);
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

  // 7. Affichage des retours dans l'Admin
  function renderAdminRetours(container) {
    var S = window.S || {};
    var allReturns = S.returns || {};
    var list = Object.values(allReturns).sort(function(a, b) { return b.date - a.date; });

    var html = '<div style="padding:10px;">';
    
    if (list.length === 0) {
      html += '<p style="text-align:center; color:#888; padding:20px;">Aucune demande de retour pour le moment.</p>';
    } else {
      list.forEach(function(r) {
        var statusTxt = 'En attente';
        var statusClass = 'attente';
        if (r.status === 'rembourse') { statusTxt = 'Remboursé'; statusClass = 'approuve'; }
        if (r.status === 'echange') { statusTxt = 'Échangé'; statusClass = 'approuve'; }
        if (r.status === 'refuse') { statusTxt = 'Refusé'; statusClass = 'refuse'; }

        html += `
          <div class="rt-card">
            <div class="rt-header">
              <span class="rt-title">Commande #${r.orderId.replace(/\D/g,'').slice(-6)}</span>
              <span class="rt-status ${statusClass}">${statusTxt}</span>
            </div>
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
    html += '</div>';
    container.innerHTML = html;
  }

  // 8. Action Admin (Rembourser, Échanger, Refuser)
  window.actionRetour = async function(retourId, action) {
    if (!confirm("Confirmez-vous cette action ? (Le client sera notifié)")) return;

    if (typeof window.write === 'function') {
      try {
        await window.write('returns/' + retourId + '/status', action);
        
        var msg = '';
        if (action === 'rembourse') msg = '💸 Remboursement validé.';
        if (action === 'echange') msg = '🔄 Échange validé.';
        if (action === 'refuse') msg = '❌ Retour refusé.';
        
        alert(msg);
        renderAdminRetours(document.getElementById('adminBody')); // Rafraîchir
      } catch (e) {
        alert('Erreur : ' + e.message);
      }
    }
  };

  // Démarrage
  setTimeout(bindAdmin, 2000);

})();
