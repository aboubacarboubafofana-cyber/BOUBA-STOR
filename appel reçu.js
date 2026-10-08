// appel-recu.js
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const db = getFirestore();
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // Serveur STUN gratuit de Google

// Initialiser l'appel
export async function initierAppel(destinataireId) {
    peerConnection = new RTCPeerConnection(config);
    
    // Ajouter la piste audio/vidéo locale
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    // Créer l'offre
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Envoyer l'offre via Firestore
    await setDoc(doc(db, "appels", destinataireId), { 
        appelant: auth.currentUser.uid, 
        offre: offer, 
        statut: "sonnerie" 
    });

    // Écouter la réponse de l'autre utilisateur
    onSnapshot(doc(db, "appels", auth.currentUser.uid), async (docSnap) => {
        const data = docSnap.data();
        if (data && data.reponse) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.reponse));
        }
    });
}