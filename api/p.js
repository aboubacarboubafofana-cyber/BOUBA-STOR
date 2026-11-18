// Page d'un article : aperçu de partage (image + infos) + vraie page produit (lisible par Google)
// Fonctionne pour les articles des boutiques (Firestore) ET pour les produits du site (base temps réel)
const {getArticle}=require('./_art.js');
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' F';
async function getProduct(id){
 try{
  if(!/^[\w-]{3,60}$/.test(id))return null;
  const g=f=>fetch(DB+'/products/'+id+'/'+f+'.json').then(r=>r.ok?r.json():null).catch(()=>null);
  const [name,price,cat,date]=await Promise.all([g('name'),g('price'),g('cat'),g('date')]);
  if(!name)return null;
  return {id,name,price,cat,date,shopName:'BOUBA STORE',desc:''};
 }catch(e){return null}
}
module.exports=async(req,res)=>{
 const id=String((req.query&&req.query.id)||'');
 const origin='https://'+(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app');
 let a=null;
 try{a=await getArticle(id)}catch(e){}
 if(!a)a=await getProduct(id);
 if(!a){res.setHeader('Location',origin+'/index.html');return res.status(302).end()}
 const shop=a.shopName||'BOUBA STORE';
 const title=esc('💝 '+a.name+' — '+money(a.price));
 const desc=esc((a.desc?a.desc+' · ':'')+(a.cat?a.cat+' · ':'')+'chez '+shop+' sur BOUBA STORE · Livraison 24h à Abidjan · Wave, Orange Money, WhatsApp');
 const img=origin+'/api/og?id='+encodeURIComponent(id)+(a.date?'&v='+a.date:'');
 const rawImg=origin+'/api/img?id='+encodeURIComponent(id)+(a.date?'&v='+a.date:'');
 const url=origin+'/api/p?id='+encodeURIComponent(id);
 const shopLink=origin+'/index.html?a='+encodeURIComponent(id);
 
 // Préparation du lien WhatsApp
 const tel=String(a.phone||'').replace(/[^\d+]/g,'');
 const waNum = tel ? tel.replace(/\D/g,'') : '2250787619717'; // Utilise le numéro du vendeur ou celui par défaut
 const waMsg = encodeURIComponent('Bonjour, je suis intéressé par l\'article : ' + a.name + ' (' + money(a.price) + ')');
 const waLink = 'https://wa.me/' + waNum + '?text=' + waMsg;

 const ld=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:a.name,image:rawImg,
  description:(a.desc||a.name+' chez '+shop),brand:{'@type':'Brand',name:shop},
  offers:{'@type':'Offer',url:url,priceCurrency:'XOF',price:String(Math.round(Number(a.price)||0)),
  availability:'https://schema.org/InStock',itemCondition:'https://schema.org/NewCondition'}}).replace(/</g,'\\u003c');
 
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
 res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
 +'<meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<title>'+title+'</title><meta name="description" content="'+desc+'">'
 +'<link rel="canonical" href="'+esc(url)+'">'
 +'<meta property="og:type" content="product"><meta property="og:site_name" content="BOUBA STORE"><meta property="og:locale" content="fr_FR">'
 +'<meta property="og:title" content="'+title+'"><meta property="og:description" content="'+desc+'">'
 +'<meta property="og:image" content="'+esc(img)+'"><meta property="og:image:secure_url" content="'+esc(img)+'">'
 +'<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'
 +'<meta property="og:image:alt" content="'+esc(a.name)+'"><meta property="og:url" content="'+esc(url)+'">'
 +'<meta property="product:price:amount" content="'+esc(Math.round(Number(a.price)||0))+'"><meta property="product:price:currency" content="XOF">'
 +'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+title+'">'
 +'<meta name="twitter:description" content="'+desc+'"><meta name="twitter:image" content="'+esc(img)+'">'
 +'<script type="application/ld+json">'+ld+'</script>'
 +'<style>'
 +'body{margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif}'
 +'main{max-width:520px;margin:0 auto;padding:16px}'
 +'img{width:100%;border-radius:14px;border:1px solid #ffd700;background:#111}'
 +'h1{font-size:22px;margin:14px 0 4px}'
 +'.p{color:#ffd700;font-size:26px;font-weight:800;margin:4px 0}'
 +'.s{color:#bbb;margin:4px 0 14px}'
 +'/* CSS pour les 2 boutons côte à côte */'
 +'.btns-row{display:flex;gap:10px;margin-top:20px;margin-bottom:20px}'
 +'.btns-row a{flex:1;display:flex;align-items:center;justify-content:center;padding:14px;border-radius:12px;font-weight:800;text-decoration:none;text-align:center;font-size:14px}'
 +'.btn-site{background:#ffd700;color:#000}'
 +'.btn-wa{background:#25D366;color:#fff}'
 +'</style></head><body><main>'
 +'<div style="color:#ffd700;font-weight:800;margin-bottom:10px">BOUBA STORE</div>'
 +'<img src="'+esc(rawImg)+'" alt="'+esc(a.name)+'" onerror="this.onerror=null;this.src=\'/icon-512.png\'">'
 +'<h1>'+esc(a.name)+'</h1><div class="p">'+money(a.price)+'</div>'
 +'<div class="s">Vendu par '+esc(shop)+(a.cat?' · '+esc(a.cat):'')+'</div>'
 +(a.desc?'<p style="color:#ccc;font-size:14px;line-height:1.5;">'+esc(a.desc)+'</p>':'')
 
 // Les 2 boutons côte à côte
 +'<div class="btns-row">'
 +'  <a class="btn-site" href="'+esc(shopLink)+'">🛒 Commander sur le site</a>'
 +'  <a class="btn-wa" href="'+waLink+'" target="_blank">💬 Commander sur WhatsApp</a>'
 +'</div>'
 
 +'</main></body></html>');
};
                                          
