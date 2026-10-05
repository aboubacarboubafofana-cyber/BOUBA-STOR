/* BOUBA STORE : inscription mondiale, installation de l'app, alertes nouveaux articles */
(function(){
 var LS=window.localStorage;
 function g(k){try{return LS.getItem(k)}catch(e){return null}}
 function s(k,v){try{LS.setItem(k,v)}catch(e){}}
 function $(i){return document.getElementById(i)}
 function recent(k){return Date.now()-(+g(k)||0)<1728e5}

 /* ========== 1. Inscription : indicatif mondial + e-mail ========== */
 var RAW="AF,93,Afghanistan;AL,355,Albanie;DZ,213,Algérie;DE,49,Allemagne;AD,376,Andorre;AO,244,Angola;AG,1268,Antigua-et-Barbuda;SA,966,Arabie saoudite;AR,54,Argentine;AM,374,Arménie;AU,61,Australie;AT,43,Autriche;AZ,994,Azerbaïdjan;BS,1242,Bahamas;BH,973,Bahreïn;BD,880,Bangladesh;BB,1246,Barbade;BE,32,Belgique;BZ,501,Belize;BJ,229,Bénin;BT,975,Bhoutan;BY,375,Biélorussie;MM,95,Birmanie;BO,591,Bolivie;BA,387,Bosnie-Herzégovine;BW,267,Botswana;BR,55,Brésil;BN,673,Brunei;BG,359,Bulgarie;BF,226,Burkina Faso;BI,257,Burundi;KH,855,Cambodge;CM,237,Cameroun;CA,1,Canada;CV,238,Cap-Vert;CF,236,Centrafrique;CL,56,Chili;CN,86,Chine;CY,357,Chypre;CO,57,Colombie;KM,269,Comores;CG,242,Congo;CD,243,Congo (RDC);KR,82,Corée du Sud;KP,850,Corée du Nord;CR,506,Costa Rica;CI,225,Côte d'Ivoire;HR,385,Croatie;CU,53,Cuba;DK,45,Danemark;DJ,253,Djibouti;DM,1767,Dominique;EG,20,Égypte;SV,503,Salvador;AE,971,Émirats arabes unis;EC,593,Équateur;ER,291,Érythrée;ES,34,Espagne;EE,372,Estonie;SZ,268,Eswatini;US,1,États-Unis;ET,251,Éthiopie;FJ,679,Fidji;FI,358,Finlande;FR,33,France;GA,241,Gabon;GM,220,Gambie;GE,995,Géorgie;GH,233,Ghana;GR,30,Grèce;GD,1473,Grenade;GP,590,Guadeloupe;GT,502,Guatemala;GN,224,Guinée;GQ,240,Guinée équatoriale;GW,245,Guinée-Bissau;GY,592,Guyana;GF,594,Guyane;HT,509,Haïti;HN,504,Honduras;HK,852,Hong Kong;HU,36,Hongrie;IN,91,Inde;ID,62,Indonésie;IQ,964,Irak;IR,98,Iran;IE,353,Irlande;IS,354,Islande;IL,972,Israël;IT,39,Italie;JM,1876,Jamaïque;JP,81,Japon;JO,962,Jordanie;KZ,7,Kazakhstan;KE,254,Kenya;KG,996,Kirghizistan;KI,686,Kiribati;KW,965,Koweït;LA,856,Laos;LS,266,Lesotho;LV,371,Lettonie;LB,961,Liban;LR,231,Libéria;LY,218,Libye;LI,423,Liechtenstein;LT,370,Lituanie;LU,352,Luxembourg;MO,853,Macao;MK,389,Macédoine du Nord;MG,261,Madagascar;MY,60,Malaisie;MW,265,Malawi;MV,960,Maldives;ML,223,Mali;MT,356,Malte;MA,212,Maroc;MQ,596,Martinique;MU,230,Maurice;MR,222,Mauritanie;YT,262,Mayotte;MX,52,Mexique;MD,373,Moldavie;MC,377,Monaco;MN,976,Mongolie;ME,382,Monténégro;MZ,258,Mozambique;NA,264,Namibie;NP,977,Népal;NI,505,Nicaragua;NE,227,Niger;NG,234,Nigéria;NO,47,Norvège;NC,687,Nouvelle-Calédonie;NZ,64,Nouvelle-Zélande;OM,968,Oman;UG,256,Ouganda;UZ,998,Ouzbékistan;PK,92,Pakistan;PS,970,Palestine;PA,507,Panama;PG,675,Papouasie-Nouvelle-Guinée;PY,595,Paraguay;NL,31,Pays-Bas;PE,51,Pérou;PH,63,Philippines;PL,48,Pologne;PF,689,Polynésie française;PT,351,Portugal;QA,974,Qatar;DO,1809,République dominicaine;CZ,420,Tchéquie;RE,262,La Réunion;RO,40,Roumanie;GB,44,Royaume-Uni;RU,7,Russie;RW,250,Rwanda;KN,1869,Saint-Christophe-et-Niévès;SM,378,Saint-Marin;VC,1784,Saint-Vincent;LC,1758,Sainte-Lucie;SB,677,Îles Salomon;WS,685,Samoa;ST,239,Sao Tomé-et-Principe;SN,221,Sénégal;RS,381,Serbie;SC,248,Seychelles;SL,232,Sierra Leone;SG,65,Singapour;SK,421,Slovaquie;SI,386,Slovénie;SO,252,Somalie;SD,249,Soudan;SS,211,Soudan du Sud;LK,94,Sri Lanka;SE,46,Suède;CH,41,Suisse;SR,597,Suriname;SY,963,Syrie;TJ,992,Tadjikistan;TW,886,Taïwan;TZ,255,Tanzanie;TD,235,Tchad;TH,66,Thaïlande;TL,670,Timor oriental;TG,228,Togo;TO,676,Tonga;TT,1868,Trinité-et-Tobago;TN,216,Tunisie;TM,993,Turkménistan;TR,90,Turquie;UA,380,Ukraine;UY,598,Uruguay;VU,678,Vanuatu;VA,379,Vatican;VE,58,Venezuela;VN,84,Vietnam;YE,967,Yémen;ZM,260,Zambie;ZW,263,Zimbabwe;ZA,27,Afrique du Sud";
 var CC={},LIST=RAW.split(";").map(function(x){var a=x.split(",");CC[a[0]]=a[1];return a}).sort(function(a,b){return a[2].localeCompare(b[2],"fr")});
 function flag(i){return String.fromCodePoint(127397+i.charCodeAt(0),127397+i.charCodeAt(1))}
 function buildGate(){
  var ph=$("uPhone");if(!ph||$("uCode"))return;
  var se=document.createElement("select");se.id="uCode";se.className="input";
  se.setAttribute("aria-label","Indicatif du pays");
  se.innerHTML=LIST.map(function(a){return'<option value="'+a[0]+'">'+flag(a[0])+" "+a[2]+" (+"+a[1]+")</option>"}).join("");
  var r=((navigator.language||"").split("-")[1]||"").toUpperCase();
  se.value=CC[r]?r:"CI";
  ph.parentNode.insertBefore(se,ph);
  ph.placeholder="Numéro (sans l'indicatif)";
  var em=document.createElement("input");em.id="uMail";em.type="email";em.className="input";em.placeholder="Ou e-mail / Gmail";em.autocomplete="email";
  ph.parentNode.insertBefore(em,ph.nextSibling);
 }
 document.addEventListener("click",function(e){
  if(!e.target.closest("#gate .gold"))return;
  var ph=$("uPhone"),em=$("uMail"),se=$("uCode"),ci=$("uCity");if(!ph||!em||!se)return;
  var raw=ph.value.trim(),mail=em.value.trim(),d=raw.replace(/\D/g,"");
  if(d&&raw.indexOf("@")<0&&raw[0]!=="+"){
   if(raw.indexOf("00")===0)ph.value="+"+d.slice(2);
   else{var c=CC[se.value];if(c!=="225")d=d.replace(/^0+/,"");ph.value="+"+c+d}
  }
  if(!d&&/.+@.+\..+/.test(mail))ph.value=mail;
  else if(d&&/.+@.+\..+/.test(mail)&&ci&&ci.value.indexOf("|")<0)ci.value=(ci.value+" | "+mail).trim();
 },true);
 buildGate();

 /* ========== 2. Bandeau : installer l'app / activer les alertes ========== */
 var bar=null,dp=null,ua=navigator.userAgent;
 var standalone=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone;
 var ios=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
 var inapp=/FBAN|FBAV|Instagram|TikTok|musical_ly|WhatsApp|Snapchat|Line\/|; wv\)/i.test(ua);
 function hide(){if(bar){bar.remove();bar=null}}
 function show(html,btns){
  hide();bar=document.createElement("div");
  bar.style.cssText="position:fixed;left:10px;right:10px;bottom:78px;z-index:9998;background:#111;border:2px solid #d4af37;border-radius:14px;padding:12px;color:#fff;font:14px Arial,sans-serif;box-shadow:0 4px 20px #000";
  bar.innerHTML="<div>"+html+'</div><div style="display:flex;gap:8px;margin-top:10px"></div>';
  btns.forEach(function(b){var x=document.createElement("button");x.textContent=b[0];
   x.style.cssText="flex:1;padding:10px;border-radius:10px;font-weight:700;border:1px solid #d4af37;"+(b[2]?"background:#d4af37;color:#000":"background:transparent;color:#d4af37");
   x.onclick=b[1];bar.lastChild.appendChild(x)});
  document.body.appendChild(bar);
 }
 function later(k,next){return function(){s(k,Date.now());hide();if(next)next()}}
 function askNotif(){
  if(!("Notification" in window)||Notification.permission!=="default"||recent("notNo"))return;
  show("🔔 Reçois une alerte dès qu'un <b>nouvel article</b> est publié.",[["Activer",function(){Notification.requestPermission().then(function(){hide();if(window.boubaPush)boubaPush()})},1],["Plus tard",later("notNo")]]);
 }
 function askInstall(){
  if(standalone||recent("instNo"))return false;
  if(dp){show("📲 <b>Installe BOUBA STORE</b> sur ton appareil : plus rapide, comme une vraie application.",[["Installer",function(){var p=dp;dp=null;hide();p.prompt();p.userChoice.then(function(){askNotif()})},1],["Plus tard",later("instNo",askNotif)]]);return true}
  if(inapp){show("📲 Pour installer l'application, ouvre cette page dans ton navigateur (menu ⋮ ou ⋯ puis « Ouvrir dans le navigateur »).",ua.indexOf("Android")>-1?[["Ouvrir Chrome",function(){location.href="intent://"+location.host+location.pathname+location.search+"#Intent;scheme=https;package=com.android.chrome;end"},1],["Plus tard",later("instNo",askNotif)]]:[["OK",later("instNo",askNotif),1]]);return true}
  if(ios){show("📲 <b>Installe BOUBA STORE</b> : touche <b>Partager ⬆︎</b> puis <b>« Sur l'écran d'accueil »</b>.",[["Compris",later("instNo",askNotif),1]]);return true}
  return false;
 }
 window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();dp=e;if(!recent("instNo"))askInstall()});
 window.addEventListener("appinstalled",function(){hide();dp=null});
 setTimeout(function(){if(!askInstall())setTimeout(askNotif,3000)},4000);

 /* ========== 3. Alerte « nouvel article » ========== */
 var seen=null,t0=Date.now();
 try{seen=JSON.parse(g("pSeen"))}catch(e){}
 var learn=!seen;seen=seen||[];
 function items(){
  var out=[];
  [].forEach.call(document.querySelectorAll("#grid .card"),function(c){
   var el=c.querySelector(".info")||c;
   var l=(el.innerText||"").split("\n").map(function(x){return x.trim()}).filter(Boolean);
   if(l[0])out.push({n:l[0],p:l[1]||""});
  });
  return out;
 }
 function noFilter(){var q=$("qIn"),a=document.querySelector(".cat.active");return(!q||!q.value)&&(!a||/^\s*Tout/i.test(a.textContent))}
 function topBanner(t,b){
  var d=document.createElement("div");
  d.style.cssText="position:fixed;top:0;left:0;right:0;z-index:9999;background:#d4af37;color:#000;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;font:700 14px Arial,sans-serif;white-space:pre-line;box-shadow:0 2px 12px #000";
  d.textContent=t+"\n"+b;d.onclick=function(){d.remove();scrollTo(0,0)};
  document.body.appendChild(d);setTimeout(function(){d.remove()},9000);
 }
 function sysNotif(t,b){
  if(!("Notification" in window)||Notification.permission!=="granted")return;
  var o={body:b,icon:"icon-192.png",badge:"icon-192.png",tag:"bouba-new"};
  function plain(){try{new Notification(t,o)}catch(e){}}
  if(navigator.serviceWorker)navigator.serviceWorker.getRegistration().then(function(r){r?r.showNotification(t,o):plain()}).catch(plain);else plain();
 }
 function scan(){
  if(typeof isAdmin!=="undefined"&&isAdmin&&window.boubaNotify)boubaNotify();
  if(!noFilter())return;
  var L=items();if(!L.length)return;
  var f=L.filter(function(x){return seen.indexOf(x.n)<0});if(!f.length)return;
  f.forEach(function(x){seen.push(x.n)});s("pSeen",JSON.stringify(seen.slice(-500)));
  if(learn&&Date.now()-t0<15000)return;
  var t=f.length===1?"🆕 Nouvel article : "+f[0].n:"🆕 "+f.length+" nouveaux articles";
  var b=f.slice(0,4).map(function(x){return x.n+(x.p?" — "+x.p:"")}).join("\n")+(f.length>4?"\n…":"");
  topBanner(t,b);sysNotif(t,b);
 }
 var tm,gr=$("grid");
 if(gr)new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(scan,1500)}).observe(gr,{childList:true,subtree:true});
 setTimeout(scan,2500);
 var ps=document.createElement("script");ps.src="alertes.js";document.body.appendChild(ps);
})();
