import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAnLLXUpC3501e80HCXLUNIOiWisY7j4",
  authDomain: "project-f4477c80-7c55-4db7-b2e.firebaseapp.com",
  projectId: "project-f4477c80-7c55-4db7-b2e",
  storageBucket: "project-f4477c80-7c55-4db7-b2e.firebasestorage.app",
  messagingSenderId: "697604298457",
  appId: "1:697604298457:web:4f9a6d66ec5fde9c1990c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
