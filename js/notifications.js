// js/notifications.js
// Lógica específica para notifications.html - IMPLEMENTACIÓN COMPLETA

import { 
    initAuthAndHeader, 
    getNotifications,  
    markNotificationAsRead,
    markAllNotificationsAsRead, 
    showToast,
    auth,
    deleteAllNotifications,
    deleteSelectedNotifications
} from "./common.js"; 

import { sendChatMessage, listenChat } from "./notification-service.js";
// ----------------- REFERENCIAS UI -----------------
const notificationsContainer = document.getElementById('notifications-container');
const markAllReadButton = document.getElementById('mark-all-read-button'); 
const clearPanelButton = document.getElementById('clear-panel-button'); 
const deleteSelectedButton = document.getElementById('delete-selected-button');

let selectionModeActive = false;
let currentUser = null;

// ----------------- UTILIDADES -----------------
function getIconForType(type) {
    switch(type) {
        case 'delivery': return 'two_wheeler';
        case 'payment': return 'payments';
        case 'promotion': return 'local_offer'; 
        case 'status': return 'info';
        case 'message': return 'chat'; 
        case 'admin': return 'manage_accounts';
        default: return 'mail';
    }
}

function formatTime(timestamp) {
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(d)) return 'Desconocido';

    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} hr`;

    return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ----------------- RENDER -----------------
function createReplyHTML(replies = []) {
    if (!replies.length) return '';

    return `
        <div class="reply-messages">
            ${replies.map(r => `
                <div class="reply-message reply-${r.senderRole}">
                    ${r.text}
                    <span class="reply-time">${formatTime(r.timestamp)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function createNotificationItemHTML(n) {
  const date = formatTime(
    n.createdAt?.toDate ? n.createdAt.toDate() : n.timestamp
  );

  return `
    <div class="notification-item ${n.read ? "read" : "unread"}" data-id="${n.id}">
      <span class="notification-icon material-icons">mail</span>

      <div class="notification-content">
        <div class="header-line">
          <strong>${n.title || "Mensaje del administrador"}</strong>
          <span class="notification-time">${date}</span>
        </div>

        <p>${n.message || ""}</p>

<div class="reply-messages" id="replies-${n.conversationId}"></div>

<form 
  class="reply-form" 
  data-notification-id="${n.id}" 
  data-conversation-id="${n.conversationId || n.id}"
>

          <input type="text" placeholder="Responder..." required />
          <button>Enviar</button>
        </form>
      </div>
    </div>
  `;
}

function renderNotifications() {
  const notifications = getNotifications();
  notificationsContainer.innerHTML = "";

  if (!notifications.length) {
    notificationsContainer.innerHTML =
      '<p class="empty-notifications-message">🎉 No tienes notificaciones.</p>';
    return;
  }

  // 🔹 Agrupar notificaciones por conversationId
  const conversations = {};
  notifications.forEach(n => {
    if (!n.conversationId) return;
    if (!conversations[n.conversationId]) {
      conversations[n.conversationId] = n;
    }
  });

  // 🔹 Renderizar un solo bloque por conversación
  Object.values(conversations).forEach(n => {
    notificationsContainer.insertAdjacentHTML(
      "beforeend",
      createNotificationItemHTML(n)
    );

    const box = document.getElementById(`replies-${n.conversationId}`);
    if (!box) return;

    // 🔹 Escuchar mensajes completos de chats/{conversationId}/messages
    listenChat(n.conversationId, messages => {
      if (!box) return;

      box.innerHTML = messages.map(m => `
        <div class="reply-message reply-${m.senderRole}">
          <div class="reply-text">${m.text}</div>
          <div class="reply-time">${
            m.timestamp?.toDate
              ? m.timestamp.toDate().toLocaleString("es-MX")
              : ""
          }</div>
        </div>
      `).join("");

      // 🔹 Scroll automático al último mensaje
      box.scrollTop = box.scrollHeight;
    });
  });

  // 🔹 Activar formularios y botones
  addListeners();
}



// ----------------- SELECCIÓN -----------------
function updateSelectionMode() {
    const checked = document.querySelectorAll('.notification-checkbox:checked').length;

    if (checked > 0) {
        selectionModeActive = true;
        deleteSelectedButton.style.display = 'inline-flex';
        deleteSelectedButton.textContent = `Eliminar (${checked})`;
        notificationsContainer.classList.add('selection-mode');
    } else {
        selectionModeActive = false;
        deleteSelectedButton.style.display = 'none';
        notificationsContainer.classList.remove('selection-mode');
    }
}

// ----------------- EVENTOS -----------------
function addListeners() {

  document.querySelectorAll('.notification-item').forEach(item => {
    item.onclick = () => {
      if (!selectionModeActive && item.classList.contains('unread')) {
        markNotificationAsRead(item.dataset.id);
        item.classList.remove('unread');
        item.classList.add('read');
      }
    };
  });

  document.querySelectorAll('.notification-checkbox').forEach(cb => {
    cb.onchange = updateSelectionMode;
  });

  // 💬 RESPUESTAS CHAT
  document.querySelectorAll(".reply-form").forEach(form => {
    form.onsubmit = e => {
      e.preventDefault();

      const input = form.querySelector("input");
      const text = input.value.trim();
      if (!text) return;

      const conversationId = form.dataset.conversationId;

      if (!conversationId) {
        console.error("❌ conversationId indefinido");
        showToast("Error", "Conversación inválida", "error");
        return;
      }

      sendChatMessage(
        auth.currentUser.uid,
        conversationId,
        "user",
        text
      );

      input.value = "";
    };
  });

  markAllReadButton.onclick = markAllNotificationsAsRead;

  clearPanelButton.onclick = () => {
    if (confirm('¿Eliminar todas las notificaciones?')) {
      deleteAllNotifications();
      showToast('🗑️ Limpio', 'Panel vacío', 'success');
    }
  };

  deleteSelectedButton.onclick = () => {
    const ids = [...document.querySelectorAll('.notification-checkbox:checked')]
      .map(c => c.dataset.id);

    if (!ids.length) return;

    if (confirm(`Eliminar ${ids.length} notificación(es)?`)) {
      deleteSelectedNotifications(ids);
      showToast('🗑️ Eliminadas', 'Notificaciones eliminadas', 'success');
    }
  };
}

// ----------------- INIT -----------------
function initNotificationsPage() {
    window.addEventListener('notificationsUpdated', renderNotifications);
    initAuthAndHeader(user => {
        currentUser = user;
        renderNotifications();
    });
}

document.addEventListener('DOMContentLoaded', initNotificationsPage);
