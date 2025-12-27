// setAdmin.js — Habilitar rol admin en Firebase Auth
// Ejecutar con:  node setAdmin.js

const admin = require("firebase-admin");

// Asegúrate de que serviceAccountKey.json está en la misma carpeta
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminRole() {
  const email = "admin@pizzasjarochos.com"; // Tu correo admin

  try {
    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
    });

    console.log("✔️ Rol admin asignado correctamente a:", email);
    console.log("💡 IMPORTANTE: Cierra sesión y vuelve a ingresar en tu app.");
  } catch (err) {
    console.error("❌ Error al asignar rol admin:", err);
  }
}

setAdminRole();
