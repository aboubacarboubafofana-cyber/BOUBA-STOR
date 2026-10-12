/* BOUBA STORE – Assistant d'aide instantané (sans internet ni serveur) : répond sur toutes les fonctionnalités.
   Remplace PLUS.aide() : le bouton vert « Aide » et la case « Aide » du Menu ouvrent cet assistant. */
(function(){
var waNum=function(){return (((S.info||{}).whatsapp||DEFAULT_WA)+'').replace(/\D/g,'')};
var norm=function(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ')};

/* k = mots-clés, q = question affichée, a = réponse, b = [libellé, action] */
var FAQ=[
{k:['commander','commande','acheter','achat','panier','passer'],q:'Comment commander ?',a:'Ajoutez vos articles au panier, choisissez votre commune pour la livraison, puis touchez « Commander » : un message WhatsApp part vers BOUBA STORE avec votre commande.',b:['Ouvrir mon panier',"openPage('cartPage')"]},
{k:['payer','paiement','wave','orange','money','argent','payer livraison'],q:'Comment payer ?',a:'Par Wave ou Orange Money, à confirmer avec nous sur WhatsApp après votre commande. Vous pouvez aussi payer avec votre portefeuille BOUBA.',b:['Mon portefeuille',"PRO.wallet()"]},
{k:['livraison','livrer','livre','delai','frais','commune','abidjan'],q:'Quels sont les frais et délais de livraison ?',a:'Livraison en 24h à Abidjan. Les frais dépendent de votre commune et s\'affichent dans le panier. Avec BOUBA+ la livraison est à -50 %, et le retrait en point relais est gratuit.',b:['Voir les tarifs',"PM.open()"]},
{k:['suivre','suivi','ou est','statut','etat commande','mes commandes','livreur'],q:'Où est ma commande ?',a:'Ouvrez « Commandes & livraisons » : vous voyez l\'état de chaque commande et, quand elle part, le nom et le numéro du livreur.',b:['Mes commandes',"PRO.orders()"]},
{k:['bienvenue','10','reduction','premiere','promo','code promo'],q:'Comment avoir -10 % ?',a:'La réduction de bienvenue de -10 % s\'applique automatiquement à votre première commande, dans le panier.'},
{k:['points','fidelite','point','credit','solde'],q:'Comment gagner des points ?',a:'1 point par visite du jour, 10 points par commande. À 50 points : 1 000 F de crédit à échanger dans « Mes avantages ».',b:['Mes avantages',"openPage('promoPage')"]},
{k:['parrain','parrainage','ami','inviter','code ami'],q:'Comment parrainer un ami ?',a:'Envoyez votre code (dans « Mes avantages ») à votre ami. Quand il passe sa première commande, vous gagnez chacun 1 000 F.',b:['Mon code',"openPage('promoPage')"]},
{k:['roue','chance','jeu','jeux','gagner','tour'],q:'Comment jouer à la roue ?',a:'Un tour gratuit par jour dans « Jeux & cadeaux ». Vous pouvez gagner du crédit ou des points.',b:['Jouer',"PLAY.open()"]},
{k:['flash','vente flash','promotion du jour'],q:'C\'est quoi la vente flash ?',a:'Un article à prix réduit pendant 24h, avec un compte à rebours sur l\'accueil. Activez les notifications pour ne pas la rater.'},
{k:['notification','notifications','alerte','recois pas','recoit pas','sonne'],q:'Je ne reçois pas les notifications',a:'1) Touchez « Activer les notifications » sur l\'accueil. 2) Autorisez-les dans les paramètres du site (cadenas du navigateur). 3) Désactivez le mode « Ne pas déranger » et l\'économie de batterie pour votre navigateur.'},
{k:['installer','installation','application','ecran accueil','apk','telecharger'],q:'Comment installer l\'application ?',a:'Touchez « Installer l\'application » (accueil ou Menu). Sinon, dans le menu ⋮ de Chrome : « Installer l\'application ». Sur iPhone : Partager, puis « Sur l\'écran d\'accueil ».',b:['Installer',"PLUS.install()"]},
{k:['avis','note','noter','etoile','commentaire'],q:'Comment donner un avis ?',a:'Sous chaque article, touchez « Donner un avis », choisissez les étoiles, écrivez un commentaire et ajoutez une photo si vous voulez.'},
{k:['favori','favoris','coeur','liste souhait','souhaits'],q:'Comment mettre un article en favori ?',a:'Touchez le cœur 🤍 sur la photo de l\'article. Retrouvez vos favoris dans « Mon espace », et partagez votre liste de souhaits sur WhatsApp.',b:['Mon espace',"PLUS.open()"]},
{k:['offre','marchander','negocier','prix','baisse'],q:'Puis-je proposer mon prix ?',a:'Oui : touchez « 💸 Offre » sur l\'article, proposez votre prix et envoyez-le sur WhatsApp. Nous vous répondons rapidement.'},
{k:['offrir','cadeau','anniversaire','ami cadeau'],q:'Comment offrir un article ?',a:'Touchez « 🎁 Offrir » sur l\'article, entrez le prénom de votre ami et un message : une carte cadeau part sur WhatsApp. Vous pouvez aussi acheter un bon cadeau.',b:['Bons cadeaux',"PL2.open()"]},
{k:['bon','bon cadeau','code bon','utiliser bon'],q:'Comment utiliser un bon cadeau ?',a:'Dans « Boutiques, bons & plus », entrez le code reçu puis touchez « Utiliser mon bon » : le montant s\'ajoute à votre crédit.',b:['Utiliser un bon',"PL2.open()"]},
{k:['portefeuille','recharger','recharge','wallet'],q:'Comment recharger mon portefeuille ?',a:'Dans « Portefeuille & tombola », choisissez un montant : un message WhatsApp part vers nous. Après votre paiement Wave ou Orange Money, nous créditons votre solde.',b:['Mon portefeuille',"PRO.wallet()"]},
{k:['tombola','ticket','loterie'],q:'Comment participer à la tombola ?',a:'Achetez un ticket avec votre portefeuille ou par WhatsApp. Plus vous avez de tickets, plus vous avez de chances. Le tirage est fait par BOUBA STORE.',b:['Voir la tombola',"PRO.wallet()"]},
{k:['enchere','encheres','encherir','miser'],q:'Comment participer à une enchère ?',a:'Dans « BOUBA+ & enchères », entrez une offre supérieure à l\'offre actuelle. Le meilleur offrant à la fin du temps gagne l\'article.',b:['Voir les enchères',"PM.open()"]},
{k:['precommande','reserver','acompte','reservation'],q:'Comment précommander ?',a:'Sur un article « Précommander », touchez le bouton : l\'acompte est calculé et envoyé sur WhatsApp. Le reste se paie à l\'arrivée.',b:['Voir les précommandes',"PM.open()"]},
{k:['groupe','groupee','achat groupe'],q:'C\'est quoi l\'achat groupé ?',a:'Quand assez de personnes rejoignent le groupe sur un article, tout le monde profite de la réduction. Touchez « 👥 Groupé » sur l\'article et invitez vos amis.'},
{k:['vip','niveau','bronze','argent','or','statut vip'],q:'C\'est quoi les niveaux VIP ?',a:'Bronze au départ, Argent à 30 000 F dépensés (-3 % permanent), Or à 100 000 F (-5 %).',b:['Mon niveau',"BON.open()"]},
{k:['boutique','vendeur','vendre','vendeuse','creer boutique','ouvrir boutique'],q:'Comment vendre sur BOUBA STORE ?',a:'Touchez « Créer ma boutique » : 3 mois gratuits pour les premiers vendeurs, puis 2 000 F par mois. Vous publiez vos articles et ils apparaissent sur l\'accueil.'},
{k:['pub','publicite','annonce','banniere'],q:'Comment faire de la pub ?',a:'Votre photo en grand sur l\'accueil : 1 000 F le jour, 5 000 F la semaine, 15 000 F le mois. Écrivez-nous sur WhatsApp pour réserver.',b:['Réserver une pub','PLUS.aide_wa("Bonjour, je veux faire de la publicité sur BOUBA STORE.")']},
{k:['occasion','seconde main','revendre'],q:'Comment vendre un article d\'occasion ?',a:'Dans « Niveau & missions », section Occasion : ajoutez nom, prix, état et photo. Nous validons avant la publication.',b:['Ouvrir',"BON.open()"]},
{k:['ambassadeur','influenceur','commission','affiliation'],q:'Comment devenir ambassadeur ?',a:'Un ambassadeur reçoit un lien personnel et gagne une commission sur chaque commande passée avec son lien. Demandez-nous sur WhatsApp.',b:['Devenir ambassadeur',"PM.beAmb()"]},
{k:['gros','revendeur','quantite','en gros'],q:'Y a-t-il des prix de gros ?',a:'Oui, sur certains articles : une réduction automatique dans le panier à partir d\'une quantité. Écrivez-nous pour un tarif revendeur.',b:['Prix de gros',"PRO.gros()"]},
{k:['taille','pointure','xl','xxl','3xl','mesure'],q:'Comment choisir ma taille ?',a:'Touchez « ❓ Taille » sous l\'article : vous voyez le guide des tailles et pouvez poser une question au vendeur.'},
{k:['bouba+','abonnement','plus'],q:'C\'est quoi BOUBA+ ?',a:'Un abonnement à 2 000 F par mois : livraison à -50 % sur toutes vos commandes.',b:['Découvrir BOUBA+',"PM.open()"]},
{k:['mot de passe','oublie','connexion','compte','connecter','pseudo'],q:'J\'ai oublié mon mot de passe / je n\'arrive pas à me connecter',a:'Écrivez-nous sur WhatsApp avec votre numéro : nous retrouvons votre compte. Pour une boutique, nous pouvons aussi vous aider à récupérer l\'accès.',b:['Écrire à BOUBA STORE','PLUS.aide_wa("Bonjour, j\'ai un problème de connexion à mon compte BOUBA STORE.")']},
{k:['probleme','erreur','bug','marche pas','fonctionne pas','remboursement','rembourser','retour','echange','defectueux'],q:'J\'ai un problème avec ma commande',a:'Désolé ! Écrivez-nous sur WhatsApp avec votre numéro de commande et une photo : nous répondons le plus vite possible.',b:['Écrire à BOUBA STORE','PLUS.aide_wa("Bonjour, j\'ai un problème avec ma commande.")']},
{k:['contact','telephone','numero','whatsapp','joindre','appeler'],q:'Comment vous contacter ?',a:'Par WhatsApp au +225 07 87 61 97 17. Nous répondons le plus vite possible.',b:['Ouvrir WhatsApp','PLUS.aide_wa("Bonjour BOUBA STORE !")']}
];
var TOP=[0,1,2,3,10,5,6,7];

/* ---------- page ---------- */
var css=document.createElement('style');
css.textContent='.hq{display:flex;gap:8px;margin:10px 0}.chip{display:inline-block;background:#111;border:1px solid #d4af37;border-radius:18px;padding:8px 12px;margin:4px 4px 0 0;color:#ffd700;font-size:13px;font-weight:700;cursor:pointer}.ans{background:#111;border:1px solid #d4af37;border-radius:12px;padding:12px;margin:10px 0}.ans h3{color:gold;font-size:15px;margin:0 0 6px}.ans p{font-size:14px;color:#eee;margin:4px 0 8px;line-height:1.45}';
document.head.appendChild(css);
var pg=document.createElement('div');pg.id='aidePage';pg.className='page';

function card(i){var f=FAQ[i];return '<div class="ans"><h3>'+esc(f.q)+'</h3><p>'+esc(f.a)+'</p>'+(f.b?'<button class="gold" onclick="'+f.b[1].replace(/"/g,'&quot;')+'">'+esc(f.b[0])+'</button>':'')+'</div>'}
function search(q){
 var n=norm(q).trim(),res=[];
 if(!n)return home();
 var words=n.split(/\s+/).filter(function(w){return w.length>1});
 FAQ.forEach(function(f,i){
  var s=0;
  f.k.forEach(function(k){var kk=norm(k).trim();if(n.indexOf(kk)>-1)s+=3+kk.length/4;else words.forEach(function(w){if(w.length>2&&(kk.indexOf(w)>-1||(kk.length>3&&w.indexOf(kk)>-1)))s+=1})});
  if(norm(f.q).indexOf(n)>-1)s+=4;
  if(s>0)res.push({i:i,s:s});
 });
 res.sort(function(a,b){return b.s-a.s});
 var h=res.length?res.slice(0,3).map(function(r){return card(r.i)}).join(''):'<div class="ans"><h3>Je n\'ai pas trouvé de réponse</h3><p>Posez votre question à notre équipe sur WhatsApp, nous répondons vite.</p><button class="gold" onclick="PLUS.aide_wa(\''+esc(q).replace(/'/g,'’')+'\')">💬 Écrire sur WhatsApp</button></div>';
 $('hRes').innerHTML=h;
}
function home(){
 $('hRes').innerHTML='<p style="color:#aaa;font-size:13px">Questions fréquentes :</p>'+TOP.map(function(i){return '<span class="chip" onclick="HELP.ask('+i+')">'+esc(FAQ[i].q)+'</span>'}).join('')+'<div class="ans" style="margin-top:14px"><h3>Besoin d\'un humain ?</h3><p>Notre équipe répond sur WhatsApp.</p><button class="gold" onclick="PLUS.aide_wa(\'Bonjour BOUBA STORE !\')">💬 Écrire sur WhatsApp</button></div>';
}
function open(){
 pg.innerHTML='<button class="mini" onclick="closeAll()">← Retour</button><h2 style="color:gold;margin:10px 0">💬 AIDE</h2><div class="hq"><input id="hQ" class="input" style="margin:0;flex:1" placeholder="Posez votre question…" autocomplete="off"><button class="gold" onclick="HELP.go()">🔎</button></div><div id="hRes"></div>';
 openPage('aidePage');home();
 var q=$('hQ');q.oninput=function(){search(q.value)};q.onkeydown=function(e){if(e.key==='Enter')search(q.value)};
}
window.HELP={
 open:open,go:function(){search($('hQ').value)},
 ask:function(i){$('hRes').innerHTML=card(i);$('hQ').value=FAQ[i].q;window.scrollTo(0,0)}
};
function boot(){
 if(!$('grid')||!window.PLUS)return;
 if(!pg.parentNode)document.body.appendChild(pg);
 if(!PLUS._h){PLUS._h=1;
  PLUS.aide=open;
  PLUS.aide_wa=function(t){window.open('https://wa.me/'+waNum()+'?text='+encodeURIComponent(t+((me&&me.name)?'\nClient : '+me.name+' / '+(me.phone||''):'')),'_blank')};
 }
}
setInterval(boot,1000);
})();
