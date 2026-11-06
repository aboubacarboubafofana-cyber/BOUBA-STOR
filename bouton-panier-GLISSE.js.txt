/* BOUBA STOR - Bouton Ajouter au panier DANS LES CARRES QUI GLISSENT - Version ULTIME */
(function(){
  const CSS=`
    .btn-panier-glisse{
      width:100% !important;
      margin-top:8px !important;
      background:linear-gradient(135deg,#d4af37,#b8860b) !important;
      color:#000 !important;
      border:0 !important;
      padding:11px !important;
      border-radius:10px !important;
      font-weight:900 !important;
      font-size:13px !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      gap:6px !important;
      cursor:pointer !important;
      box-shadow:0 2px 10px rgba(212,175,55,.3) !important;
    }
    .btn-panier-glisse.added{
      background:#25D366 !important;
      color:#fff !important;
    }
    .btn-panier-glisse:active{transform:scale(.96) !important}
  `;
  let s=document.createElement('style');
  s.textContent=CSS;
  document.head.appendChild(s);

  function getCart(){ try{ return JSON.parse(localStorage.getItem('b_cart')||'[]'); }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem('b_cart',JSON.stringify(c)); }

  function addToCart(pid, btn){
    let cart=getCart();
    const f=cart.find(x=>x.id===pid);
    if(f) f.qty++; else cart.push({id:pid, qty:1});
    saveCart(cart);
    btn.innerHTML='✅ Ajouté !';
    btn.classList.add('added');
    if(navigator.vibrate) navigator.vibrate(50);
    setTimeout(()=>{ btn.innerHTML='🛒 Ajouter au panier'; btn.classList.remove('added'); },1500);
    
    const cnt=document.getElementById('cartCount')||document.getElementById('cartN');
    if(cnt){
      const total=cart.reduce((a,b)=>a+b.qty,0);
      cnt.textContent=total;
      cnt.style.display='flex';
    }
  }

  function findPid(card){
    // essaie toutes les méthodes
    if(card.dataset.pid) return card.dataset.pid;
    if(card.dataset.id) return card.dataset.id;
    let m=card.innerHTML.match(/addCart\(['\"]([^'\"]+)['\"]\)/);
    if(m) return m[1];
    m=card.innerHTML.match(/offre.*['\"]([a-zA-Z0-9_-]{6,})['\"]/i);
    // fallback: nom
    const b=card.querySelector('b');
    if(b) return b.textContent.trim().replace(/\s+/g,'_').slice(0,25);
    return null;
  }

  function inject(){
    // CIBLE TOUT : grille + carrés qui glissent
    // Les carrés qui glissent sont dans "Boutiques -> glisse" : ce sont des div avec overflow-x
    const allCards=document.querySelectorAll('.card, #grid .card, .boutique-card, .slide-card, [class*="boutique"] .card, div[style*="scroll"] .card, div[style*="overflow"] > div');
    
    // Méthode plus fiable : cherche tous les éléments qui contiennent le bouton "Offre"
    const offreBtns=document.querySelectorAll('button');
    offreBtns.forEach(btn=>{
      const txt=btn.textContent.trim();
      if(!txt.includes('Offre') && !txt.includes('Offrir')) return;
      
      const card=btn.closest('.card') || btn.closest('div[style*="border"]') || btn.parentElement.parentElement;
      if(!card) return;
      if(card.querySelector('.btn-panier-glisse')) return;
      
      const pid=findPid(card);
      if(!pid) return;
      
      // Crée le bouton
      const newBtn=document.createElement('button');
      newBtn.className='btn-panier-glisse';
      newBtn.innerHTML='🛒 Ajouter au panier';
      newBtn.type='button';
      newBtn.onclick=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        addToCart(pid, newBtn);
      };
      
      // Trouve où l'insérer : après le dernier bouton du groupe
      // Dans tes carrés qui glissent, les boutons sont en groupes de 2
      // On veut le mettre tout en bas, après Facebook / Telegram / X
      const info=card.querySelector('.info') || card;
      // cherche le dernier groupe de boutons
      const groups=info.querySelectorAll('div, .pact, .row2');
      let lastGroup=null;
      groups.forEach(g=>{
        if(g.querySelector('button')) lastGroup=g;
      });
      
      if(lastGroup){
        // insère après le dernier groupe
        lastGroup.parentElement.insertBefore(newBtn, lastGroup.nextSibling);
      } else {
        info.appendChild(newBtn);
      }
    });
  }

  // Lance très souvent car les carrés qui glissent chargent en async
  setInterval(inject, 1000);
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(inject,500); setTimeout(inject,1500); setTimeout(inject,3000); });
  window.addEventListener('load', ()=>{ setTimeout(inject,800); setTimeout(inject,2000); });
  
  // Patch renderStore aussi
  const orig=window.renderStore;
  if(orig){
    window.renderStore=function(){ orig(); setTimeout(inject,300); setTimeout(inject,1000); };
  }
  
  window.injectPanier=inject;
})();
