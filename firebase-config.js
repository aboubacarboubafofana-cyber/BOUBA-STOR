// Remplacez par VOTRE config (Firebase Console > Paramètres du projet > Vos applications)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJET.firebaseapp.com",
  projectId: "VOTRE_PROJET_ID",
  storageBucket: "VOTRE_PROJET.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

export const db = getFirestore(initializeApp(firebaseConfig));

// Identifiant de l'utilisateur connecté (à adapter à votre système de connexion)
export const MON_ID = localStorage.getItem('uid') || '';
