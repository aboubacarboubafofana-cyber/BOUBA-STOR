// Flux produits pour Google Merchant Center (format RSS 2.0 / Google)
const {listArticles}=require('./_art.js');
const esc=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=async(req,res)=>{
 const origin='https://'+(req.headers['x-forwarded-host']||req.headers.host||'bouba-stor.vercel.app');
 let list=[];
 try{list=await listArticles()}catch(e){}
 let items='';
 for(const a of list){
  const price=Math.round(Number(a.price)||0);
  if(!a.name||price<=0)continue;
  const desc=(a.desc&&String(a.desc).trim())||(a.name+' — disponible chez '+(a.shopName||'BOUBA STORE')+' à Abidjan, Côte d\'Ivoire.');
  items+='<item>'
   +'<g:id>'+esc(a.id)+'</g:id>'
   +'<g:title>'+esc(String(a.name).slice(0,150))+'</g:title>'
   +'<g:description>'+esc(desc.slice(0,5000))+'</g:description>'
   +'<g:link>'+origin+'/api/p?id='+encodeURIComponent(a.id)+'</g:link>'
   +'<g:image_link>'+origin+'/api/img?id='+encodeURIComponent(a.id)+(a.date?'&amp;v='+a.date:'')+'</g:image_link>'
   +'<g:availability>in stock</g:availability>'
   +'<g:price>'+price+'.00 XOF</g:price>'
   +'<g:condition>new</g:condition>'
   +'<g:brand>'+esc(a.shopName||'BOUBA STORE')+'</g:brand>'
   +'<g:identifier_exists>no</g:identifier_exists>'
   +(a.cat?'<g:product_type>'+esc(a.cat)+'</g:product_type>':'')
   +'</item>';
 }
 res.setHeader('Content-Type','application/xml; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=3600');
 res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>'
  +'<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel>'
  +'<title>BOUBA STORE</title><link>'+origin+'</link><description>Articles BOUBA STORE</description>'
  +items+'</channel></rss>');
};
