// js/auth-guard.js
// Lógica de inicio de sesión y redirección diferenciando admin y usuario
import { auth } from "./firebase-config.js";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserSessionPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    // ------------------------------
    // PERSISTENCIA TEMPORAL
    // ------------------------------
    setPersistence(auth, browserSessionPersistence)
        .then(() => signOut(auth)) // cierra cualquier sesión activa al iniciar
        .catch(err => console.error("Error estableciendo persistencia:", err));

    // ------------------------------
    // ELEMENTOS DEL DOM
    // ------------------------------
    const loginForm = document.getElementById('login-form');
    const googleSignInBtn = document.getElementById('google-signin-btn');

    // ------------------------------
    // FUNCIONES DE UTILIDAD
    // ------------------------------
    const redirectUser = (user) => {
        if (!user) return;
        // Admin directo a admin.html
        if (user.email === "admin@pizzasjarochos.com") {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'menu.html';
        }
    };

    const displayAlert = (message) => {
        alert(message);
    };

    // ------------------------------
    // REDIRECCIÓN SI YA ESTÁ LOGUEADO
    // ------------------------------
    onAuthStateChanged(auth, (user) => {
        if (user) {
            redirectUser(user);
        }
        // Si no hay usuario, se queda en index.html
    });

    // ------------------------------
    // LOGIN CON EMAIL Y CONTRASEÑA
    // ------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('#email').value.trim();
            const password = loginForm.querySelector('#password').value.trim();
            const loginButton = loginForm.querySelector('#login-button');

            loginButton.textContent = 'Iniciando...';
            loginButton.disabled = true;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Redirección será manejada automáticamente por onAuthStateChanged
                console.log("Login exitoso:", userCredential.user.email);
            } catch (error) {
                console.error("Error de login:", error.code, error.message);
                let errorMessage = "Error de inicio de sesión. Revisa tu correo y contraseña.";
                if (error.code === 'auth/user-not-found') {
                    errorMessage = "No hay un usuario registrado con ese correo.";
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = "Contraseña incorrecta.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "El correo electrónico tiene un formato inválido.";
                }
                displayAlert(errorMessage);
            } finally {
                loginButton.textContent = 'Iniciar sesión';
                loginButton.disabled = false;
            }
        });
    }

    // ------------------------------
    // LOGIN CON GOOGLE
    // ------------------------------
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                // Redirección será manejada automáticamente por onAuthStateChanged
            } catch (error) {
                console.error("Error login Google:", error.code, error.message);
                let errorMessage = "Error al iniciar sesión con Google.";
                if (error.code === 'auth/popup-closed-by-user') {
                    errorMessage = "Has cerrado la ventana de inicio de sesión de Google.";
                }
                displayAlert(errorMessage);
            }
        });
    }

});
