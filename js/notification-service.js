// js/notification-service.js
import { db } from "./common.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  collectionGroup,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/**
 * Envía un mensaje al historial del chat
 * (usuario ↔ admin)
 */
export async function sendChatMessage(
  userId,
  conversationId,
  senderRole,
  text
) {
  if (!userId || !conversationId || !senderRole || !text) return;

  try {
    // 🔑 Guardar en chat compartido (admin y usuario)
    await addDoc(
      collection(db, "chats", conversationId, "messages"),
      {
        senderRole,
        text,
        timestamp: serverTimestamp()
      }
    );

    console.log("✅ Mensaje guardado en chats:", conversationId);

    // 🔔 Opcional: notificación visual para el usuario
    await addDoc(
      collection(db, "userNotifications", userId, "items"),
      {
        type: "admin_message",
        title: senderRole === "admin" ? "📩 Mensaje del administrador" : "💬 Mensaje tuyo",
        message: text,
        conversationId,
        read: false,
        createdAt: serverTimestamp()
      }
    );

  } catch (e) {
    console.error("❌ Error al insertar mensaje en Firestore:", e);
    throw e;
  }
} 


/**
 * Escucha mensajes en tiempo real de una conversación
 */
export function listenChat(conversationId, callback) {
  if (!conversationId) return;

  const q = query(
    collection(db, "chats", conversationId, "messages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(
    q,
    snap => {
      const messages = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      callback(messages);
    },
    err => {
      console.warn("🔕 Chat listener cancelado:", err.code);
    }
  );
}
