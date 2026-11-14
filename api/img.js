// Vercel : api/img.js — sert la photo d'un article en vraie URL https (nécessaire pour les notifications)
const DB="https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app";
module.exports=async(req,res)=>{
 try{
  const id=String(req.query.id||"").replace(/[^\w-]/g,"");
  const v=await fetch(DB+"/products/"+id+"/img.json").then(r=>r.json());
  if(!v)return res.status(404).end();
  if(/^https?:/.test(v))return res.redirect(302,v);
  const m=/^data:(image\/[\w+.-]+);base64,(.*)$/s.exec(v);
  if(!m)return res.status(404).end();
  res.setHeader("Content-Type",m[1]);res.setHeader("Cache-Control","public, max-age=86400");
  res.status(200).send(Buffer.from(m[2],"base64"));
 }catch(e){res.status(500).end()}
};
