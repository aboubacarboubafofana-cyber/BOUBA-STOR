// Flux produits pour Google Merchant Center (format RSS 2.0 / Google)
const {listArticles}=require('./_art.js');
const esc=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---- Détection automatique : catégorie Google, taille, couleur, genre (d'après le nom, la catégorie et la description)
const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const COLORS=['bleu ciel','bleu marine','bleu','blanc','noir','rouge','vert','jaune','orange','violet','mauve','rose','gris','marron','beige','dore','argent','bordeaux','kaki','turquoise','multicolore','creme','saumon','fuchsia'];
const SIZES=['xxs','xs','s','m','l','xl','xxl','xxxl','2xl','3xl','4xl','5xl'];
function attrs(a){
 const raw=[a.name,a.desc].filter(Boolean).join(' / ');
 const all=norm(raw+' '+(a.cat||''));
 const o={};
 let cat='';
 if(/parfum|eau de|cologne/.test(all))cat='479';
 else if(/chaussure|sandale|basket|crepe|sneaker|mocassin|escarpin|claquette/.test(all))cat='187';
 else if(/montre/.test(all))cat='201';
 else if(/telephone|samsung|iphone|tecno|infinix|itel|redmi|xiaomi|smartphone/.test(all))cat='267';
 else if(/cosmetique|creme|maquillage|rouge a levres|savon|lotion|vernis/.test(all))cat='2915';
 else if(/ensemble|robe|jupe|pantalon|haut|chemise|molante|short|polo|t-shirt|tee-shirt|veste|pagne|boubou|complet|combinaison|crop|jean|vetement|tenue|pull|manteau/.test(all))cat='1604';
 if(cat)o.cat=cat;
 const wear=cat==='1604'||cat==='187';
 if(wear){
  // taille : chaque morceau séparé par "/" ou un espace
  const found=[];
  for(const seg of norm(raw).split('/')){
   const t=seg.trim();
   if(SIZES.includes(t)&&!found.includes(t))found.push(t);
   for(const w of t.split(/[\s,;()-]+/))if(w.length>1&&SIZES.includes(w)&&!found.includes(w))found.push(w);
  }
  if(found.length)o.size=found.slice(0,3).map(x=>x.toUpperCase()).join('/');
  // couleur
  const findCols=txt=>{let rest=' '+norm(txt)+' ';const r=[];
   for(const c of COLORS){const re=new RegExp('[\\s/,;()-]'+c+'(?=[\\s/,;()-])');
    if(re.test(rest)){r.push(c==='dore'?'Doré':c[0].toUpperCase()+c.slice(1));rest=rest.replace(re,' ');}}
   return r};
  // la couleur du nom prime ; sinon on regarde la description
  let cols=findCols(a.name);if(!cols.length)cols=findCols(a.desc);
  if(cols.length)o.color=cols.slice(0,3).join('/');
  // genre et âge
  const kids=/enfant|bebe|garcon|fille\b|bambin/.test(all);
  if(kids){o.age='kids';if(/garcon/.test(all))o.gender='male';else if(/fille/.test(all))o.gender='female'}
  else{
   if(/\bhomme|monsieur|masculin/.test(all))o.gender='male';
   else if(/femme|dame|madame|feminin|robe|jupe|molante|crop|escarpin/.test(all))o.gender='female';
   else if(/unisexe|pour tous|mixte/.test(all))o.gender='unisex';
   if(o.gender)o.age='adult';
  }
 }
 return o;
}
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
   +(()=>{const x=attrs(a);return (x.cat?'<g:google_product_category>'+x.cat+'</g:google_product_category>':'')
     +(x.gender?'<g:gender>'+x.gender+'</g:gender>':'')
     +(x.age?'<g:age_group>'+x.age+'</g:age_group>':'')
     +(x.color?'<g:color>'+esc(x.color)+'</g:color>':'')
     +(x.size?'<g:size>'+esc(x.size)+'</g:size>':'')})()
   +'</item>';
 }
 res.setHeader('Content-Type','application/xml; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=3600');
 res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>'
  +'<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel>'
  +'<title>BOUBA STORE</title><link>'+origin+'</link><description>Articles BOUBA STORE</description>'
  +items+'</channel></rss>');
};

module.exports.attrs=attrs;
