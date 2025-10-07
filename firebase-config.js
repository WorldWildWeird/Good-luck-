// ✅ Importation des modules Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ⚙️ Configuration Firebase (copie depuis ton projet Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDwLg7Fiepy6c26k1MFWhrHU1ineHQXlTc",
  authDomain: "weirdos-chat.firebaseapp.com",
  projectId: "weirdos-chat",
  storageBucket: "weirdos-chat.firebasestorage.app",
  messagingSenderId: "398679330507",
  appId: "1:398679330507:web:c705599c052168aa44954e"
};

// 🚀 Initialisation Firebase
const app = initializeApp(firebaseConfig);

// 💾 Connexion à Firestore
const db = getFirestore(app);

// 🔁 Export de la base pour utilisation dans firebase-chat.js
export { app, db };