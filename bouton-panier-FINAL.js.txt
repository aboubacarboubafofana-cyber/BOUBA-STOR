/* BOUBA STOR - Bouton Ajouter au panier SOUS le bouton X - Version FINALE qui marche */
(function(){
  const CSS=`
    .btn-panier-sous-x{
      width:100% !important;
      margin-top:8px !important;
      background:linear-gradient(135deg,#d4af37,#b8860b) !important;
      color:#000 !important;
      border:0 !important;
      padding:12px !important;
      border-radius:10px !important;
      font-weight:900 !important;
      font-size:13px !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      gap:6px !important;
      cursor:pointer !important;
      box-shadow:0 2px 10px rgba(212,175,55,.3) !important;
      animation:fadeInPanier .3s ease;
    }
    .btn-panier-sous-x.added{
      background:#25D366 !important;
      color:#fff !important;
    }
    .btn-panier-sous-x:active{transform:scale(.96) !important}
    @keyframes fadeInPanier{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `;
  const style=document.createElement('style');
  style.textContent=CSS;
  document.head.appendChild(style);

  function getCart(){ try{ return JSON.parse(localStorage.getItem('b_cart')||'[]'); }catch(e){ return []; } }
  function saveCart(c){ localStorage.setItem('b_cart',JSON.stringify(c)); }

  function addToCart(pid, btn){
    let cart=getCart();
    const found=cart.find(x=>x.id===pid);
    if(found) found.qty++; else cart.push({id:pid, qty:1});
    saveCart(cart);
    
    // notif
    btn.innerHTML='✅ Ajouté !';
    btn.classList.add('added');
    if(navigator.vibrate) navigator.vibrate(50);
    
    // met à jour compteur si existe
    const cnt=document.getElementById('cartCount')||document.getElementById('cartN');
    if(cnt){
      const total=cart.reduce((s,x)=>s+x.qty,0);
      cnt.textContent=total;
      cnt.style.display='flex';
    }
    if(typeof renderCart==='function') try{ renderCart(); }catch(e){}
    
    // toast
    let toast=document.getElementById('toast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='toast';
      toast.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;border:1px solid gold;color:#fff;padding:10px 18px;border-radius:24px;font-size:13px;font-weight:700;z-index:9999;display:flex;gap:8px;align-items:center';
      toast.innerHTML='✅ Ajouté au panier';
      document.body.appendChild(toast);
    }
    toast.style.display='flex';
    setTimeout(()=>{ toast.style.display='none'; },2000);
    
    setTimeout(()=>{
      btn.innerHTML='🛒 Ajouter au panier';
      btn.classList.remove('added');
    },1500);
  }

  function inject(){
    // sélection très large pour trouver les cartes comme sur ton screenshot
    const cards=document.querySelectorAll('#grid .card, .grid .card, [data-pid], .card');
    cards.forEach(card=>{
      if(card.querySelector('.btn-panier-sous-x')) return;
      
      // essaie de trouver l'id du produit
      let pid=null;
      // 1. data-pid
      if(card.dataset.pid) pid=card.dataset.pid;
      // 2. dataset pid dans attribut
      if(!pid) pid=card.getAttribute('data-pid');
      // 3. onclick addCart('xxx')
      if(!pid){
        const btn=card.querySelector('[onclick*="addCart"]');
        if(btn){
          const m=btn.getAttribute('onclick')?.match(/addCart\(['\"]([^'\"]+)['\"]\)/);
          if(m) pid=m[1];
        }
      }
      // 4. img src ou autre
      if(!pid){
        const anyBtn=card.querySelector('button');
        // on cherche dans tout le card
        const html=card.innerHTML;
        const m=html.match(/['\"]([a-zA-Z0-9_-]{8,})['\"]/);
        // fallback : on utilise le nom comme id
        const nameEl=card.querySelector('b');
        if(nameEl) pid=nameEl.textContent.trim().slice(0,20).replace(/\s+/g,'_');
      }
      if(!pid) return;
      
      // trouve le conteneur du bouton X
      const allButtons=[...card.querySelectorAll('button')];
      // le bouton X est celui dont le texte est exactement "X"
      let xBtn=allButtons.find(b=>{
        const t=b.textContent.trim();
        return t==='X' || t===' X ' || /^X$/.test(t);
      });
      
      // crée le bouton panier
      const btn=document.createElement('button');
      btn.className='btn-panier-sous-x';
      btn.innerHTML='🛒 Ajouter au panier';
      btn.type='button';
      btn.onclick=(e)=>{
        e.preventDefault();
        e.stopPropagation();
        addToCart(pid, btn);
      };
      
      // insère juste après le groupe qui contient X
      if(xBtn){
        const parent=xBtn.closest('div') || xBtn.parentElement;
        // si le parent est dans .info ou card, on met après ce parent
        const info=card.querySelector('.info') || card;
        // si X est dans une ligne (row2), on met le bouton après cette ligne
        if(parent && parent.parentElement){
          parent.parentElement.insertBefore(btn, parent.nextSibling);
          // si parent.nextSibling est null, append à la fin
          if(!btn.parentElement) parent.parentElement.appendChild(btn);
        } else {
          (card.querySelector('.info')||card).appendChild(btn);
        }
      } else {
        // pas de X trouvé, on met à la fin de la carte
        const info=card.querySelector('.info') || card;
        info.appendChild(btn);
      }
    });
  }

  // lance plusieurs fois car les cartes se chargent en async (Firebase)
  const origRender=window.renderStore;
  if(origRender){
    window.renderStore=function(){
      origRender();
      setTimeout(inject, 200);
      setTimeout(inject, 800);
    };
  }
  // aussi patch extra() de file857
  const origExtra=window.extra || (()=>{});
  
  setInterval(inject, 1500);
  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(inject,500); setTimeout(inject,1500); });
  window.addEventListener('load', ()=>{ setTimeout(inject,800); });
  
  // expose pour test
  window.injectPanier=inject;
})();
