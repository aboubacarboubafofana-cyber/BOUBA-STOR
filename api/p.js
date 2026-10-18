// BOUBA STORE : page de partage d'un article. Les aperçus WhatsApp / Facebook affichent la photo, le nom et le prix.
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=async(req,res)=>{
 const id=String((req.query&&req.query.id)||'').replace(/[^\w-]/g,'').slice(0,40);
 const host=String(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app').replace(/[^\w.:-]/g,'');
 const base='https://'+host;
 let name='BOUBA STORE',price='',cat='';
 if(id){
  try{
   const g=async k=>(await fetch(DB+'/products/'+id+'/'+k+'.json')).json();
   const [n,p,c]=await Promise.all([g('name'),g('price'),g('cat')]);
   if(n){name=String(n);price=p?String(p):'';cat=c?String(c):''}
  }catch(e){}
 }
 const title=price?name+' • '+Number(price).toLocaleString('fr-FR')+' F':name;
 const desc='Commandez sur BOUBA STORE'+(cat?' • '+cat:'')+' — livraison à Abidjan, paiement Wave / Orange Money.';
 const img=id?base+'/api/img?id='+id:base+'/icon-512.png';
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=300, s-maxage=300');
 res.status(200).send('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title>'+
  '<meta property="og:type" content="website"><meta property="og:site_name" content="BOUBA STORE"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'"><meta property="og:image" content="'+esc(img)+'"><meta property="og:url" content="'+esc(base+'/api/p?id='+id)+'">'+
  '<meta name="twitter:card" content="summary_large_image"><meta http-equiv="refresh" content="0;url=/"></head><body style="background:#000;color:#ffd700;font-family:sans-serif;text-align:center;padding:40px"><p>Ouverture de BOUBA STORE…</p><script>location.replace("/")</script></body></html>');
};
