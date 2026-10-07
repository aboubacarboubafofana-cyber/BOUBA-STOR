/* Admin : le bouton 💬 des clients ouvre le chat du site au lieu de WhatsApp */
(function(){var o=window.open;window.open=function(u){
 try{var m=String(u).match(/^https:\/\/wa\.me\/(\d+)\?text=Bonjour%2C%20c'est%20BOUBA%20STORE/i);
 if(m){location.href='amis.html#tel='+m[1];return null}}catch(e){}
 return o.apply(window,arguments)}})();
