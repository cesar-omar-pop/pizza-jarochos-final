// firebase-config.js (ACTUALIZADO)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js"; 
// >>> Nuevo: Importar getFirestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; 

// Tu configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyAn-FiM3C0YY0h-iGo7qAfc-HMTHkrZVsE",
  authDomain: "proyecto1-538ad.firebaseapp.com",
  projectId: "proyecto1-538ad",
  storageBucket: "proyecto1-538ad.firebasestorage.app",
  messagingSenderId: "62948047378",
  appId: "1:62948047378:web:ba355ea935b75e65a176cb",
  measurementId: "G-549TZ96JL8"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// >>> Nuevo: Inicializar Firestore
const db = getFirestore(app);

// Exporta lo que necesitas usar en otros archivos
// >>> Nuevo: Exportar la instancia de db (base de datos)
export { auth, db };