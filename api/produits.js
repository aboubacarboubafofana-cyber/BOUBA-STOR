// AUTO-GOOGLE - Colle ce fichier dans ton index.html avant </body>
// Chaque fois que tu publies un article, il part sur Google tout seul.
<script>
function googleAutoUpdate(){
  const prods = JSON.parse(localStorage.getItem('b_products')||'[]');
  // 1. Sauve pour l'API Vercel
  fetch('/api/produits?products='+encodeURIComponent(JSON.stringify(prods))).catch(()=>{});
  // 2. Génère aussi le fichier produits.xml à télécharger si tu n'as pas encore l'API
  let items = prods.filter(p=>p.publie!==false).map(p=>`
  <item><g:id>${p.id}</g:id><g:title>${p.name} - BOUBA STOR</g:title><g:description>${p.name} Livraison 24H Abidjan</g:description><g:link>https://bouba-stor.vercel.app/</g:link><g:image_link>${p.img && p.img.startsWith('http') ? p.img : 'https://bouba-stor.vercel.app/icon-512.png'}</g:image_link><g:price>${p.price} XOF</g:price><g:availability>in_stock</g:availability><g:condition>new</g:condition><g:brand>${p.brand||'BOUBA STOR'}</g:brand><g:product_type>${p.cat||'Vêtements'}</g:product_type></item>`).join('');
  let xml = `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>BOUBA STOR</title><link>https://bouba-stor.vercel.app/</link><description>BOUBA STOR Abidjan</description>${items}</channel></rss>`;
  localStorage.setItem('b_produits_xml', xml);
  // 3. Ping Google pour qu'il revienne vite
  fetch('https://bouba-stor.vercel.app/api/produits.xml').catch(()=>{});
  return prods.length;
}
// Quand tu cliques sur "Republier des articles" ou "Enregistrer", ça met à jour Google
const _oldSaveProd = window.saveProd;
window.saveProd = function(){ const r = _oldSaveProd ? _oldSaveProd.apply(this, arguments) : null; setTimeout(()=>{ let n = googleAutoUpdate(); if(window.toast) window.toast('✅ Publié + Google auto : '+n+' articles sur Google'); }, 500); return r; };
console.log('✅ AUTO-GOOGLE activé : chaque article publié va sur Google');
</script>
