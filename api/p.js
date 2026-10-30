// Page de partage d'un article : aperçu (photo, nom, prix) puis ouverture de la boutique sur cet article
const {getArticle}=require('./_art.js');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' F';
module.exports=async(req,res)=>{
 const id=String((req.query&&req.query.id)||'');
 const origin='https://'+(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app');
 let a=null;
 try{a=await getArticle(id)}catch(e){}
 if(!a){res.setHeader('Location',origin+'/index.html');return res.status(302).end()}
 const title=esc(a.name+' — '+money(a.price));
 const desc=esc((a.desc?a.desc+' · ':'')+'chez '+(a.shopName||'BOUBA STORE')+' sur BOUBA STORE');
 const img=origin+'/api/img?id='+encodeURIComponent(id)+(a.date?'&v='+a.date:'');
 const url=origin+'/api/p?id='+encodeURIComponent(id);
 const go=origin+'/index.html?a='+encodeURIComponent(id);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=3600');
 res.status(200).send('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">'
 +'<meta name="viewport" content="width=device-width,initial-scale=1">'
 +'<title>'+title+'</title>'
 +'<meta property="og:type" content="product"><meta property="og:site_name" content="BOUBA STORE">'
 +'<meta property="og:title" content="'+title+'"><meta property="og:description" content="'+desc+'">'
 +'<meta property="og:image" content="'+esc(img)+'"><meta property="og:url" content="'+esc(url)+'">'
 +'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+title+'">'
 +'<meta name="twitter:image" content="'+esc(img)+'">'
 +'</head><body style="background:#000;color:#ffd700;font-family:sans-serif;text-align:center;padding:40px">'
 +'<p>Ouverture de BOUBA STORE…</p><p><a style="color:#ffd700" href="'+esc(go)+'">Voir l\'article</a></p>'
 +'<script>location.replace('+JSON.stringify(go)+')</script></body></html>');
};
