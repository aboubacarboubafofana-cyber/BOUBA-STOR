// Sert la photo d'un article comme vraie image https (nécessaire pour l'aperçu WhatsApp/Facebook)
const {getArticle}=require('./_art.js');
module.exports=async(req,res)=>{
 try{
  const a=await getArticle(req.query&&req.query.id);
  if(!a||!a.img)return res.status(404).end();
  const m=/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(a.img);
  if(m){
   res.setHeader('Content-Type',m[1]);
   res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
   return res.status(200).send(Buffer.from(m[2],'base64'));
  }
  if(/^https?:\/\//.test(a.img)){res.setHeader('Location',a.img);return res.status(302).end()}
  res.status(404).end();
 }catch(e){res.status(500).end()}
};
