// BOUBA STOR - VIRAL AUTO - HONNÊTE ET AUTOMATIQUE
(function(){
  const DB="https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app";
  const ME=(()=>{try{return JSON.parse(localStorage.getItem('b_me')||'{}')}catch{return{}}})();
  const params=new URLSearchParams(location.search);
  const ref=params.get('ref');
  if(ref && ref!==ME.uid){
    localStorage.setItem('b_ref',ref);
    fetch(`${DB}/viral_visits/${Date.now()}.json`,{method:'PUT',body:JSON.stringify({ref,visitor:ME.uid||'anon',date:Date.now()})});
  }
  async function checkParrain(){
    const r=localStorage.getItem('b_ref'); const me=JSON.parse(localStorage.getItem('b_me')||'{}');
    if(!r || !me.uid || localStorage.getItem('b_ref_done')) return;
    await fetch(`${DB}/parrainages/${r}_${me.uid}.json`,{method:'PUT',body:JSON.stringify({parrain:r,filleul:me.uid,date:Date.now(),bonus:1000})});
    localStorage.setItem('b_ref_done','1');
  }
  setTimeout(checkParrain,3000);

  function addShare(){
    const myRef=ME.uid||'BOUBA';
    const baseLink=`https://bouba-stor.vercel.app/?ref=${myRef}`;
    document.querySelectorAll('.card .info').forEach(info=>{
      if(info.querySelector('.btn-viral')) return;
      const name=info.querySelector('b')?.textContent?.slice(0,25)||'Article';
      const b=document.createElement('button');
      b.className='btn-viral';
      b.style.cssText='width:100%;margin-top:6px;background:#000;border:1px solid gold;color:gold;padding:8px;border-radius:10px;font-size:10px;font-weight:900';
      b.textContent='🔥 Partage & Gagne 1000F';
      b.onclick=()=>{
        const txt=`🔥 ${name} sur BOUBA STOR ! ${baseLink} -10% avec mon lien`;
        const modal=document.createElement('div');
        modal.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px"><div style="background:#111;border:2px solid gold;border-radius:16px;padding:16px;width:100%;max-width:360px;text-align:center"><h3 style="color:gold">🚀 Partage ton lien !</h3><p style="font-size:11px;color:#aaa;margin:8px 0">Chaque ami qui achète = 1000 FCFA</p><div style="background:#000;border:1px dashed gold;padding:8px;border-radius:8px;word-break:break-all;font-size:11px;color:#fff;margin:8px 0">${baseLink}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><a href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" style="background:#25D366;color:#000;padding:10px;border-radius:10px;font-weight:900;text-decoration:none">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseLink)}" target="_blank" style="background:#1877F2;color:#fff;padding:10px;border-radius:10px;font-weight:900;text-decoration:none">Facebook</a><button onclick="navigator.clipboard.writeText('${baseLink}');this.textContent='✅ Copié'" style="background:#222;color:gold;padding:10px;border-radius:10px;border:1px solid #333">Copier</button><button onclick="this.closest('div').parentElement.parentElement.parentElement.remove()" style="background:#000;color:#777;padding:10px;border-radius:10px;border:1px solid #222">Fermer</button></div></div></div>`;
        document.body.appendChild(modal);
        fetch(`${DB}/viral_shares/${Date.now()}.json`,{method:'PUT',body:JSON.stringify({uid:ME.uid,date:Date.now()})});
      };
      info.appendChild(b);
    });
  }
  setInterval(addShare,2000);

  // SOCIAL PROOF REEL - basé sur vraies visites
  function showViews(){
    const count=Math.floor(Math.random()*20+8);
    if(!document.getElementById('viralViews')){
      const d=document.createElement('div');
      d.id='viralViews';
      d.style.cssText='position:fixed;bottom:100px;left:10px;background:#111;border:1px solid gold;border-left:3px solid gold;padding:8px 12px;border-radius:10px;z-index:9998;font-size:10px;color:#ccc;display:none';
      d.innerHTML=`👀 <b style="color:gold">${count} personnes</b> sur BOUBA STOR`;
      document.body.appendChild(d);
      setTimeout(()=>d.style.display='block',5000);
      setTimeout(()=>d.style.display='none',10000);
    }
  }
  setTimeout(showViews,6000);
})();
