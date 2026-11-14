// Vercel serverless : api/notify.js — variable d'environnement requise : ONESIGNAL_API_KEY
const ADMIN_UID="7W5OEzTeTNbFLzULLO9VsuDKZFN2",FB_KEY="AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4",APP_ID="5672576c-c60f-4364-9bb3-316526fcd35e";
module.exports=async(req,res)=>{
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 try{
  const {token,title,message}=req.body||{};
  const v=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key="+FB_KEY,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:token})}).then(r=>r.json());
  if(!v.users||v.users[0].localId!==ADMIN_UID)return res.status(403).json({error:"Non autorisé"});
  const r=await fetch("https://api.onesignal.com/notifications",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Key "+process.env.ONESIGNAL_API_KEY},body:JSON.stringify({app_id:APP_ID,included_segments:["Total Subscriptions"],headings:{en:title,fr:title},contents:{en:message,fr:message},url:"https://bouba-stor.vercel.app/"})});
  const j=await r.json();return res.status(r.ok?200:500).json(r.ok?{ok:true}:{error:JSON.stringify(j)});
 }catch(e){return res.status(500).json({error:String(e)})}
};
