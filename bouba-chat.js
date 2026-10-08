// bouba-chat.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Initialisation (assurez-vous que firebase-config.js est chargé avant)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Fonction pour envoyer un message
export async function envoyerMessage(destinataireId, texte) {
    const user = auth.currentUser;
    if (!user) return;

    // On crée un ID de conversation unique basé sur les deux IDs triés
    const conversationId = [user.uid, destinataireId].sort().join("_");

    await addDoc(collection(db, "conversations", conversationId, "messages"), {
        expediteur: user.uid,
        texte: texte,
        timestamp: serverTimestamp()
    });
}

// Fonction pour écouter les messages en temps réel
export function ecouterMessages(destinataireId, callback) {
    const user = auth.currentUser;
    if (!user) return;

    const conversationId = [user.uid, destinataireId].sort().join("_");
    const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("timestamp", "asc")
    );

    // onSnapshot permet de mettre à jour l'interface instantanément
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
    });
}