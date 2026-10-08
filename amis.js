import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURATION FIREBASE (Mettez vos vraies clés ici)
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJET.firebaseapp.com",
    projectId: "VOTRE_PROJET_ID",
    storageBucket: "VOTRE_PROJET.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. RÉCUPÉRER LA LISTE DES AMIS DEPUIS FIRESTORE
async function chargerAmis() {
    const friendListDiv = document.getElementById('friendList');
    
    // On vide la liste statique actuelle
    friendListDiv.innerHTML = ''; 

    try {
        // Remplacez "utilisateurs" par le nom de votre collection dans Firestore
        const querySnapshot = await getDocs(collection(db, "utilisateurs")); 
        
        querySnapshot.forEach((doc) => {
            const ami = doc.data();
            const amiId = doc.id; // L'ID unique de l'ami dans Firestore
            const initiales = (ami.nom || "??").substring(0, 2).toUpperCase();

            // On crée le HTML pour chaque ami
            const amiHTML = `
                <div class="friend-item">
                    <div class="avatar">${initiales}</div>
                    <div class="friend-info">
                        <h4>${ami.nom || "Inconnu"}</h4>
                        <p>${ami.statut || "Hors ligne"}</p>
                    </div>
                    <div class="actions">
                        <i class="fas fa-star"></i>
                        <!-- Bouton Appel Vocal -->
                        <i class="fas fa-phone" onclick="window.location.href='Call.html?call=${amiId}&video=false'"></i>
                        <!-- Bouton Appel Vidéo -->
                        <i class="fas fa-video" onclick="window.location.href='Call.html?call=${amiId}&video=true'"></i>
                    </div>
                </div>
            `;
            
            // On ajoute l'ami à la liste
            friendListDiv.innerHTML += amiHTML;
        });
    } catch (error) {
        console.error("Erreur lors du chargement des amis : ", error);
        friendListDiv.innerHTML = '<p style="color:red; padding:10px;">Erreur de chargement des amis.</p>';
    }
}

// Lancer le chargement au démarrage
chargerAmis();