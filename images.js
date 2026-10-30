/* BOUBA STORE – Images rapides et compatibles WhatsApp : 
   Les images sont compressées localement, hébergées en ligne sous forme d'URL réelles (https://) pour WhatsApp,
   puis mises en cache IndexedDB pour une ouverture instantanée sur le téléphone. */
(function(){
var db=null,seen={},q=[],busy=0,dbp=null;

function open(){
 if(dbp)return dbp;
 return dbp=new Promise(function(res){try{var r=indexedDB.open('bouba-img',1);r.onupgradeneeded=function(){r.result.createObjectStore('i')};r.onsuccess=function(){db=r.result;res(db)};r.onerror=function(){res(null)}}catch(e){res(null)}});
}

function getC(k){return open().then(function(d){return d?new Promise(function(res){try{var t=d.transaction('i').objectStore('i').get(k);t.onsuccess=function(){res(t.result||null)};t.onerror=function(){res(null)}}catch(e){res(null)}}):null})}
function putC(k,v){open().then(function(d){if(d)try{d.transaction('i','readwrite').objectStore('i').put(v,k)}catch(e){}})}

// Vérifie si la donnée est une image valide (Base64 ou URL standard)
function ok(d){return typeof d==='string' && (d.indexOf('data:image')===0 || d.indexOf('http')===0)}

function apply(id,d){
 var p=(S.products||{})[id];if(p)p.img=d;
 try{[].forEach.call(document.querySelectorAll('img[data-pid="'+id+'"]'),function(i){i.src=d})}catch(e){}
}

function pump(){
 while(busy<4&&q.length){
  var j=q.shift();busy++;
  (function(id,iv){
   fb.D.get(fb.D.ref(fb.db,'productimgs/'+id)).then(function(s){
    var d=s.val();if(ok(d)){putC(id,{iv:iv,d:d});apply(id,d)}
   }).catch(function(){seen[id]=0}).then(function(){busy--;pump()});
  })(j[0],j[1]);
 }
}

function load(id){
 if(seen[id])return Promise.resolve();seen[id]=1;
 var p=(S.products||{})[id];if(!p||ok(p.img))return Promise.resolve();
 var iv=p.iv||0;
 return getC(id).then(function(c){
  if(c&&ok(c.d)&&(c.iv||0)===iv){apply(id,c.d);return}
  if(typeof fb==='undefined'||!fb||!fb.D){seen[id]=0;return}
  q.push([id,iv]);pump();
 });
}

var idle=0;
function ensure(){
 var P=S.products||{},ids=[];
 Object.keys(P).forEach(function(id){var p=P[id];if(p&&ok(p.img)){var k=id+':'+(p.iv||0)+':'+p.img.length;if(!seen[k]){seen[k]=1;putC(id,{iv:p.iv||0,d:p.img})}}});
 [].forEach.call(document.querySelectorAll('#grid img[data-pid], #boutiques-articles img[data-pid]'),function(i){ids.push(i.getAttribute('data-pid'))});
 ids.forEach(function(id){var p=P[id];if(p&&!ok(p.img))load(id)});
 if(!idle&&!window.LITE){idle=1;var f=function(){Object.keys(S.products||{}).slice(0,80).forEach(function(id){var p=S.products[id];if(p&&!ok(p.img))load(id)});idle=0};(window.requestIdleCallback||function(c){setTimeout(c,3000)})(f,{timeout:6000})}
}

/* --- Compression locale de l'image de l'annonce --- */
function recompress(url,max,qual){return new Promise(function(res){var i=new Image();i.onload=function(){var k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',qual))};i.onerror=function(){res(null)};i.src=url})}

/* --- Téléchargement de l'image sur ImgBB pour obtenir une URL valide pour WhatsApp --- */
function split(id){
 var p=(S.products||{})[id];if(!p||!ok(p.img))return Promise.resolve(false);
 return recompress(p.img,560,0.62).then(function(t){
  if(!t)return false;
  var iv=Date.now();
  
  // Extraction de la chaîne brute Base64
  var cleanBase64 = t.split(',')[1];
  var formData = new FormData();
  formData.append("image", cleanBase64);

  // 🔥 REMPLACEZ "VOTRE_CLE_API_IMGBB" ci-dessous par votre propre clé API ImgBB
  return fetch("https://imgbb.com", {
    method: "POST",
    body: formData
  })
  .then(function(res){ return res.json(); })
  .then(function(json){
    if(json && json.success) {
      var realUrl = json.data.url; // L'URL finale sécurisée (https://...) accessible par WhatsApp

      // Sauvegarde de la vraie URL de l'image dans Firebase
      write('productimgs/'+id, realUrl);
      write('products/'+id+'/img', realUrl);
      write('products/'+id+'/iv', iv);
      
      putC(id,{iv:iv,d:realUrl});
      setTimeout(function(){var q=(S.products||{})[id];if(q){q.img=realUrl;q.iv=iv}apply(id,realUrl)},60);
      return true;
    }
    return false;
  }).catch(function(err){
    console.error("Erreur d'envoi de la photo sur ImgBB :", err);
    return false;
  });
 });
}

window.IMG={
 need:function(id){return load(id)},
 fetchNow:function(id){seen[id]=0;return load(id).then(function(){return new Promise(function(r){var n=0,t=setInterval(function(){var p=(S.products||{})[id];if((p&&ok(p.img))||++n>40){clearInterval(t);r()}},150)})})},
 split:split,
 cache:function(id,iv,d){putC(id,{iv:iv,d:d})}
};

/* --- Branchements sur le cycle de vie de l'application --- */
var _rs=window.renderStore;
window.renderStore=function(){_rs();ensure()};
var _ep=window.editProd;
if(_ep)window.editProd=function(id){IMG.fetchNow(id).then(function(){_ep(id)})};
var _sp=window.saveProd;
if(_sp)window.saveProd=function(){
 var eid=editId,before=Object.keys(S.products||{});
 _sp();
 setTimeout(function(){
  var ids=eid?[eid]:Object.keys(S.products||{}).filter(function(k){return before.indexOf(k)<0});
  ids.forEach(function(id){split(id)});
 },700);
};
var _dp=window.delProd;
if(_dp)window.delProd=function(id){_dp(id);setTimeout(function(){if(!(S.products||{})[id])write('productimgs/'+id,null)},800)};
open();
})();
   
