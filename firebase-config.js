import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnLLXpUC35OleB0hCLUXnLU0lMiesY7j4",
  authDomain: "project-f4477c80-7c55-4db7-b2e.firebaseapp.com",
  projectId: "project-f4477c80-7c55-4db7-b2e",
  storageBucket: "project-f4477c80-7c55-4db7-b2e.firebasestorage.app",
  messagingSenderId: "697604298457",
  appId: "1:697604298457:web:4f9a6d66ec6fde9c1990c8"
};

export const db = getFirestore(initializeApp(firebaseConfig));

// ID unique par appareil (pour tester les appels)
export const MON_ID = localStorage.getItem('uid') || (() => {
  const id = 'u' + Math.random().toString(36).slice(2, 8);
  localStorage.setItem('uid', id);
  return id;
})();
