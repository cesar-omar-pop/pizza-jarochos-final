// ===============================
// 1. IMPORTACIONES DE FIREBASE
// ===============================
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// ===============================
// 2. CONFIGURACIÓN DEL PROYECTO
// ===============================

const firebaseConfig = {
  apiKey: "AIzaSyAn-FiM3C0YY0h-iGo7qAfc-HMTHkrZVsE",
  authDomain: "proyecto1-538ad.firebaseapp.com",
  projectId: "proyecto1-538ad",
  storageBucket: "proyecto1-538ad.firebasestorage.app",
  messagingSenderId: "62948047378",
  appId: "1:62948047378:web:ba355ea935b75e65a176cb",
  measurementId: "G-549TZ96JL8"
};

// ===============================
// 3. INICIALIZACIÓN DE FIREBASE
// ===============================

const app = initializeApp(firebaseConfig);

// ===============================
// 4. EXPORTAR SERVICIOS
// ===============================

// Auth (Login, registro, logout, etc.)
export const auth = getAuth(app);

// Firestore (Base de datos)
export const db = getFirestore(app);
export const storage = getStorage(app);
// Analytics (opcional — solo funciona en producción HTTPS)
getAnalytics(app);
