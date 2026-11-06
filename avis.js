// FIX AVIS CLIENTS - espace trop grand, écritures fines
(function(){
  const style=document.createElement('style');
  style.textContent=`
    /* === FIX AVIS CLIENTS - FIN ET COMPACT === */
    #avisClients, div:has(> h3:has-text("Ce que disent")){padding:8px 10px !important;margin:6px 0 !important}
    #avisClients h3, h3:has-text("Ce que disent"){font-size:14px !important;margin:0 0 8px 0 !important;font-weight:800 !important}
    #reviewsList, div[style*="scroll-snap-type"]{
      gap:8px !important;
      align-items:flex-start !important;
      padding-bottom:2px !important;
    }
    #reviewsList > div, div[style*="flex: 0 0 85%"]{
      flex:0 0 78% !important;
      max-width:300px !important;
      padding:10px 12px !important;
      border-radius:12px !important;
      border-left:2px solid gold !important;
      border:1px solid #222 !important;
      border-left:2px solid gold !important;
      background:#181818 !important;
      height:auto !important;
      min-height:0 !important;
      display:flex !important;
      flex-direction:column !important;
      gap:4px !important;
    }
    #reviewsList > div div:first-child, div[style*="flex: 0 0 85%"] div:first-child{
      font-size:11px !important;
      letter-spacing:1px !important;
      line-height:1 !important;
    }
    #reviewsList > div p, div[style*="flex: 0 0 85%"] p{
      font-size:12px !important;
      font-weight:300 !important;
      line-height:1.35 !important;
      margin:4px 0 !important;
      color:#ccc !important;
      font-style:italic !important;
      letter-spacing:0.2px !important;
    }
    #reviewsList > div span, div[style*="flex: 0 0 85%"] span{
      font-size:10px !important;
      color:#777 !important;
      font-weight:400 !important;
      margin-top:2px !important;
    }
    /* Cache la scrollbar moche */
    div[style*="overflow-x: auto"]::-webkit-scrollbar{display:none}
    div[style*="overflow-x: auto"]{scrollbar-width:none;-ms-overflow-style:none}
  `;
  document.head.appendChild(style);

  function fixAvis(){
    // Trouve la section avis
    const sections=document.querySelectorAll('div');
    sections.forEach(sec=>{
      if(sec.textContent.includes('Ce que disent nos clients')){
        sec.style.padding='8px 10px';
        sec.style.margin='6px 0';
        sec.style.background='#0e0e0e';
        sec.style.borderTop='1px solid #222';
        sec.style.borderBottom='1px solid #222';
        const h3=sec.querySelector('h3');
        if(h3){
          h3.style.fontSize='14px';
          h3.style.fontWeight='800';
          h3.style.margin='0 0 8px 0';
          h3.style.textAlign='center';
        }
        const container=sec.querySelector('div[style*="display: flex"]')||sec.querySelector('div[style*="overflow-x"]');
        if(container){
          container.style.display='flex';
          container.style.gap='8px';
          container.style.alignItems='flex-start';
          container.style.overflowX='auto';
          container.style.paddingBottom='2px';
          container.querySelectorAll(':scope > div').forEach(card=>{
            card.style.flex='0 0 78%';
            card.style.maxWidth='300px';
            card.style.padding='10px 12px';
            card.style.borderRadius='12px';
            card.style.background='#181818';
            card.style.border='1px solid #222';
            card.style.borderLeft='2px solid gold';
            card.style.height='auto';
            card.style.minHeight='0';
            card.style.display='flex';
            card.style.flexDirection='column';
            card.style.gap='4px';
            // Ecritures fines
            const stars=card.querySelector('div');
            if(stars) stars.style.fontSize='11px';
            const p=card.querySelector('p');
            if(p){
              p.style.fontSize='12px';
              p.style.fontWeight='300';
              p.style.lineHeight='1.35';
              p.style.margin='4px 0';
              p.style.letterSpacing='0.2px';
            }
            const span=card.querySelector('span');
            if(span){
              span.style.fontSize='10px';
              span.style.fontWeight='400';
            }
          });
        }
      }
    });
  }

  // Lance au chargement + toutes les secondes (car Firebase peut recharger)
  setInterval(fixAvis, 1000);
  document.addEventListener('DOMContentLoaded', ()=>setTimeout(fixAvis,500));
  window.addEventListener('load', ()=>setTimeout(fixAvis,800));
  fixAvis();
})();
