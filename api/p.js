// Page d'un article : aperçu de partage + vraie page produit (lisible par Google)
const {getArticle}=require('./_art.js');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' F';
module.exports=async(req,res)=>{
 const id=String((req.query&&req.query.id)||'');
 const origin='https://'+(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app');
 let a=null;
 try{a=await getArticle(id)}catch(e){}
 if(!a){res.setHeader('Location',origin+'/index.html');return res.status(302).end()}
 const shop=a.shopName||'BOUBA STORE';
 const title=esc(a.name+' — '+money(a.price));
 const desc=esc((a.desc?a.desc+' · ':'')+'chez '+shop+' sur BOUBA STORE');
 const img=origin+'/api/img?id='+encodeURIComponent(id)+(a.date?'&v='+a.date:'');
 const url=origin+'/api/p?id='+encodeURIComponent(id);
 const shopLink=origin+'/index.html?a='+encodeURIComponent(id);
 const ld=JSON.stringify({'@context':'https://schema.org','@type':'Product',name:a.name,image:img,
  description:(a.desc||a.name+' chez '+shop),brand:{'@type':'Brand',name:shop},
  offers:{'@type':'Offer',url:url,priceCurrency:'XOF',price:String(Math.round(Number(a.price)||0)),
  availability:'https://schema.org/InStock',itemCondition:'https://schema.org/NewCondition'}}).replace(/</g,'\\u003c');
 const tel=String(a.phone||'').replace(/[^\d+]/g,'');
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
 res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
 +'<meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<title>'+title+'</title><meta name="description" content="'+desc+'">'
 +'<link rel="canonical" href="'+esc(url)+'">'
 +'<meta property="og:type" content="product"><meta property="og:site_name" content="BOUBA STORE">'
 +'<meta property="og:title" content="'+title+'"><meta property="og:description" content="'+desc+'">'
 +'<meta property="og:image" content="'+esc(img)+'"><meta property="og:url" content="'+esc(url)+'">'
 +'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+title+'">'
 +'<meta name="twitter:image" content="'+esc(img)+'">'
 +'<script type="application/ld+json">'+ld+'</script>'
 +'<style>body{margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif}main{max-width:520px;margin:0 auto;padding:16px}'
 +'img{width:100%;border-radius:14px;border:1px solid #ffd700;background:#111}h1{font-size:22px;margin:14px 0 4px}'
 +'.p{color:#ffd700;font-size:26px;font-weight:800;margin:4px 0}.s{color:#bbb;margin:4px 0 14px}'
 +'a.b{display:block;text-align:center;padding:14px;border-radius:12px;font-weight:800;text-decoration:none;margin:10px 0}'
 +'.y{background:#ffd700;color:#000}.g{border:1px solid #ffd700;color:#ffd700}</style></head><body><main>'
 +'<div style="color:#ffd700;font-weight:800;margin-bottom:10px">BOUBA STORE</div>'
 +'<img src="'+esc(img)+'" alt="'+esc(a.name)+'">'
 +'<h1>'+esc(a.name)+'</h1><div class="p">'+money(a.price)+'</div>'
 +'<div class="s">Vendu par '+esc(shop)+(a.cat?' · '+esc(a.cat):'')+'</div>'
 +(a.desc?'<p>'+esc(a.desc)+'</p>':'')
 +'<a class="b y" href="'+esc(shopLink)+'">🛒 Commander dans la boutique</a>'
 +(tel?'<a class="b g" href="tel:'+esc(tel)+'">📞 Appeler le vendeur</a>':'')
 +'</main></body></html>');
};
