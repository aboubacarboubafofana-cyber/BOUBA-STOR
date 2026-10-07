/* Admin : le bouton 💬 d'un client ouvre la discussion dans le site (sans WhatsApp) */
document.addEventListener('click',function(e){
  var b=e.target.closest('#adminPage .row button,#adminPage .row .mini');
  if(!b||b.textContent.trim()!=='💬')return;
  var r=b.closest('.row'),m=r&&r.textContent.match(/\+?\d[\d ]{8,}/);
  if(!m)return;
  e.stopPropagation();e.preventDefault();
  location.href='amis.html#tel='+m[0].replace(/\D/g,'');
},true);

/* Onglet "Amis" dans la barre du bas (ajouté ici, sans dépendre des anciens fichiers amis*.js) */
function addAmis(){
  var nav=document.querySelector('.nav');
  if(!nav||document.getElementById('chats'))return;
  var kids=[].slice.call(nav.children),i;
  for(i=0;i<kids.length;i++)if(/Amis/.test(kids[i].textContent))return;
  if(!kids[0])return;
  var c=kids[0].cloneNode(true);
  c.removeAttribute('onclick');c.classList.remove('active','on');
  [].forEach.call(c.querySelectorAll('[id]'),function(x){x.removeAttribute('id')});
  [].forEach.call(c.querySelectorAll('[onclick]'),function(x){x.removeAttribute('onclick')});
  c.id='chats';
  var w=document.createTreeWalker(c,NodeFilter.SHOW_TEXT),t;
  while((t=w.nextNode()))t.nodeValue=t.nodeValue.replace(/Accueil/,'Amis').replace(/🏠/,'💬');
  nav.appendChild(c);
}
addAmis();setInterval(addAmis,1000);
document.addEventListener('click',function(e){
  var n=e.target.closest('#chats');
  if(n){e.stopPropagation();e.preventDefault();location.href='amis.html'}
},true);
