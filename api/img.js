// BOUBA STORE : sert la photo d'un article en vraie image (utile pour les aperçus WhatsApp / Facebook).
const DB='https://project-f4477c80-7c55-4db7-b2e-default-rtdb.europe-west1.firebasedatabase.app';
module.exports=async(req,res)=>{
 const id=String((req.query&&req.query.id)||'').replace(/[^\w-]/g,'').slice(0,40);
 if(!id){res.status(404).end();return}
 let v=null;
 try{v=await (await fetch(DB+'/products/'+id+'/img.json')).json()}catch(e){}
 const m=/^data:(image\/[a-z+]+);base64,([\s\S]+)$/.exec(String(v||''));
 if(m){
  res.setHeader('Content-Type',m[1]);
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=3600');
  res.status(200).send(Buffer.from(m[2],'base64'));return;
 }
 if(/^https:\/\//.test(String(v||''))){res.writeHead(302,{Location:v});res.end();return}
 res.status(404).end();
};
