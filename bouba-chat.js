/* Admin : le bouton 💬 d'un client ouvre la discussion dans le site (sans WhatsApp) */
document.addEventListener('click',function(e){
  var b=e.target.closest('#adminPage .row button,#adminPage .row .mini');
  if(!b||b.textContent.trim()!=='💬')return;
  var r=b.closest('.row'),m=r&&r.textContent.match(/\+?\d[\d ]{8,}/);
  if(!m)return;
  e.stopPropagation();e.preventDefault();
  location.href='amis.html#tel='+m[0].replace(/\D/g,'');
},true);
