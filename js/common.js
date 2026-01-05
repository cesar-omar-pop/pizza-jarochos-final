// js/common.js (FINAL Y COMPLETO: Utilitarios, Carrito, Notificaciones, Admin y PEDIDOS)
import {
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js"; 
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
    doc, 
    updateDoc, 
    getDoc,
    getDocs,  
    addDoc,  
    deleteDoc,
    collection, 
    setDoc, 
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; 

// 🚨 CRÍTICO: EMAIL DEL ADMINISTRADOR
const ADMIN_EMAIL = "admin@pizzasjarochos.com"; 

// --- Variables y Keys ---
const NOTIFICATIONS_KEY = 'userNotifications';
const CART_STORAGE_KEY = 'pizzaCart';
// -----------------------------------------------
// 🔔 NOTIFICACIONES (Firestore + fallback local)
// -----------------------------------------------
let notificationsData = [];

/**
 * 🔥 Cargar notificaciones desde Firestore
 */
export const loadUserNotifications = async (userId) => {
    if (!userId) return;

    try {
        const ref = collection(db, "userNotifications", userId, "items");
        const snap = await getDocs(ref);

        notificationsData = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toDate
                ? doc.data().createdAt.toDate().toISOString()
                : new Date().toISOString()
        }));

        window.dispatchEvent(new Event("notificationsUpdated"));

    } catch (err) {
        console.error("Error cargando notificaciones:", err);
    }
};
let unsubscribeNotifications = null;

export const listenUserNotificationsRealtime = (userId) => {
    if (!userId) return;

    // Evita listeners duplicados
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    const ref = collection(db, "userNotifications", userId, "items");
    const q = query(ref, where("read", "==", false));

    unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt?.toDate
                ? doc.data().createdAt.toDate().toISOString()
                : new Date().toISOString()
        }));

        window.dispatchEvent(new Event("notificationsUpdated"));
    });
};

// -----------------------------------------------
// --- UTILIDADES DE NOTIFICACIONES EXPORTADAS ---
// -----------------------------------------------
export const getNotifications = () => notificationsData;
export const addNotification = async (newNotification) => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, "userNotifications", user.uid, "items");

    await addDoc(ref, {
        ...newNotification,
        userId: user.uid,
        read: false,
        createdAt: serverTimestamp()
    });

    // ✅ FORZAR REFRESH DEL BADGE
    loadUserNotifications(user.uid);
};


export const markNotificationAsRead = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    await updateDoc(
        doc(db, "userNotifications", user.uid, "items", id),
        { read: true }
    );
};

export const markAllNotificationsAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, "userNotifications", user.uid, "items");
    const snap = await getDocs(ref);

    snap.forEach(d => updateDoc(d.ref, { read: true }));
};

export const deleteSelectedNotifications = async (ids) => {
    const user = auth.currentUser;
    if (!user) return;

    for (const id of ids) {
        await deleteDoc(
            doc(db, "userNotifications", user.uid, "items", id)
        );
    }
};

export const deleteAllNotifications = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, "userNotifications", user.uid, "items");
    const snap = await getDocs(ref);

    snap.forEach(d => deleteDoc(d.ref));
};


export const getUnreadNotificationCount = () => notificationsData.filter(n => !n.read).length;


// -----------------------------------------------
// --- UTILITIES DEL TOAST (MANTENIDO) ---
// -----------------------------------------------
export const showToast = (title, message, type = 'success', duration = 3000) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const iconMap = {
        success: 'check_circle',
        error: 'cancel',
        warning: 'warning',
        payment: 'payments',
        delivery: 'two_wheeler',
        info: 'info',
        status: 'info' 
    };

    const toast = document.createElement('div');
    toast.classList.add('app-toast', `toast-${type}`);
    toast.innerHTML = `
        <span class="material-icons toast-icon">${iconMap[type] || iconMap.info}</span>
        <div class="toast-content">
            <strong>${title}</strong>
            <span>${message}</span>
        </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
};


// -----------------------------------------------
// --- UTILITIES DEL CARRITO (CORE) ---
// -----------------------------------------------
export const getCart = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

export const saveCart = (cart) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated')); 
};

export const clearCart = () => {
    saveCart([]);
};

export const removeItem = (itemId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
};
export const addToCart = (productDetails) => {
    let cart = getCart();

    const productId = productDetails.id;
    const productName = productDetails.name || productDetails.nombre || "Producto";
    const productPrice = Number(productDetails.price ?? productDetails.precio ?? 0);

    const productImage =
        productDetails.image ||
        productDetails.imageUrl ||
        productDetails.imagen ||
        productDetails.imageURL ||
        "https://placehold.co/80x80/cccccc/ffffff?text=Prod";

    // ✅ LA CANTIDAD REAL VIENE DEL OBJETO
    const quantityToAdd = Number(productDetails.cantidad) || 1;

    if (!productId || productPrice <= 0) {
        console.error("Producto inválido para carrito:", productDetails);
        return;
    }

    const index = cart.findIndex(i => i.id === productId);

    if (index !== -1) {
        // 🔥 SUMAR, NO REEMPLAZAR
        cart[index].cantidad += quantityToAdd;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            cantidad: quantityToAdd,
            image: productImage
        });
    }

    saveCart(cart);
};

export const updateItemQuantity = (itemId, change) => {
    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === itemId);

    if (existingIndex !== -1) {
        cart[existingIndex].cantidad += change;
        
        if (cart[existingIndex].cantidad <= 0) {
            cart.splice(existingIndex, 1);
        }
        saveCart(cart);
    }
};

// -----------------------------------------------
// --- LÓGICA DEL CONTADOR DEL HEADER ---
// -----------------------------------------------

export const getCartTotalQuantity = () => getCart().reduce((total, item) => total + (parseInt(item.cantidad) || 0), 0);

const updateCartCountDisplay = () => {
    const cartCountElement = document.getElementById('cart-count');
    const totalItems = getCartTotalQuantity();

    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'inline-flex' : 'none'; 
    }
};

const updateNotificationCountDisplay = () => {
    const notificationCountElement = document.getElementById('notification-count');
    const totalUnread = getUnreadNotificationCount(); 

    if (notificationCountElement) {
        notificationCountElement.textContent = totalUnread;
        notificationCountElement.style.display = totalUnread > 0 ? 'inline-flex' : 'none';
    }
};

// ----------------------------------------------
// --- 🔥 4. FUNCIÓN DE GUARDAR PEDIDO (CRÍTICO) ---
// ----------------------------------------------

/**
 * Guarda un nuevo pedido en la colección 'pedidos' de Firestore.
 * @param {string} paymentMethod - Método de pago seleccionado ('Efectivo', 'Tarjeta').
 * @param {string} deliveryAddress - Dirección de entrega (puede ser 'Recoger en tienda').
 * @returns {Promise<boolean>} Devuelve true si el pedido se guardó con éxito.
 */
export async function saveNewOrder(paymentMethod, deliveryAddress) {
    const currentCart = getCart();

    if (currentCart.length === 0) {
        showToast('🛒 Carrito Vacío', 'No puedes finalizar un pedido sin productos.', 'error');
        return false;
    }

    // 1. Calcular el total del pedido
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    
    // 2. Obtener el ID del usuario actual (si está logueado)
    const user = auth.currentUser;
    const userId = user ? user.uid : 'ANÓNIMO';
    
    try {
        // Referencia a un nuevo documento en la colección 'pedidos'
        const newOrderRef = doc(collection(db, "pedidos")); 

        const newOrderData = {
            userId: userId,
            items: currentCart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.cantidad,
                // Solo incluimos datos esenciales
            })),
            total: total,
            paymentMethod: paymentMethod || 'Efectivo',
            deliveryAddress: deliveryAddress || 'Recoger en tienda',
            status: 'pendiente', // Estado inicial para que aparezca en el Admin
            createdAt: serverTimestamp() 
        };

        await setDoc(newOrderRef, newOrderData);

        // 3. Limpiar el carrito después de guardar el pedido
        clearCart(); // Usa la función clearCart ya definida.

        showToast('🎉 Pedido Confirmado', `Tu pedido #${newOrderRef.id.substring(0, 6)} ha sido enviado.`, 'success');
        return true;

    } catch (error) {
        console.error("Error al guardar el nuevo pedido:", error);
        showToast('❌ Error de Pedido', 'Fallo al procesar tu compra. Revisa la consola y tu conexión.', 'error');
        return false;
    }
}


// -----------------------------------------------
// --- AUTENTICACIÓN Y GUARDIA DE RUTAS (UNIFICADA) ---
// -----------------------------------------------

/**
 * Verifica si el usuario actual tiene permisos de administrador.
 * Se define y exporta como función separada para ser usada en admin.js.
 * @param {object} user - El objeto User de Firebase Auth.
 * @returns {boolean} True si es admin, false en caso contrario.
 */
export function checkAdminStatus(user) {
    if (!user) return false;
    return user.email === ADMIN_EMAIL;
}

export const initAuthAndHeader = (onUserAuthenticated) => {
    const userInfo = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout-button');
    const adminNavLink = document.getElementById('admin-nav-link'); 

    onAuthStateChanged(auth, (user) => {
        const currentPage = window.location.pathname.split('/').pop();
        const isAdmin = checkAdminStatus(user); // Usa la función exportada
        
        // 1. Manejo de Visibilidad del Enlace de Admin
        if (adminNavLink) {
            adminNavLink.style.display = isAdmin ? 'block' : 'none'; 
        }

        if (user) {
            // Usuario Loggeado
            if (userInfo) {
                userInfo.textContent = `Hola, ${user.email.split('@')[0]}`; 
            }
            
            // 2. RESTRICCIÓN DE ACCESO AL PANEL DE ADMIN (Guardia de Rutas)
            if (currentPage === 'admin.html' && !isAdmin) {
                showToast('🚫 Acceso Denegado', 'Solo los administradores pueden acceder a este panel.', 'error');
                window.location.href = 'menu.html'; 
                return; 
            }
            
            // 3. Ejecutar el callback de la página
            if (onUserAuthenticated) {
listenNotificationBadge(user.uid);
listenNotificationList(user.uid);
onUserAuthenticated(user);

}

animateCartFeedback();
        } else {
            // Usuario No Loggeado
            // Redirige si no está en una página pública
            if (currentPage !== 'index.html' && currentPage !== 'catalogo.html' && currentPage !== 'resenas.html' && currentPage !== 'registro.html') {
                window.location.href = 'index.html'; 
            }
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html'; 
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                showToast('❌ Error de Sesión', 'Ocurrió un error al intentar cerrar la sesión.', 'error');
            }
        });
    }
};
let unsubscribeBadge = null;

export const listenNotificationBadge = (userId) => {
    if (!userId) return;

    if (unsubscribeBadge) unsubscribeBadge();

    const q = query(
        collection(db, "userNotifications", userId, "items"),
        where("read", "==", false)
    );

    unsubscribeBadge = onSnapshot(q, (snapshot) => {
        const badge = document.getElementById("notification-count");
        if (!badge) return;

        if (snapshot.size > 0) {
            badge.textContent = snapshot.size;
            badge.style.display = "inline-flex";
        } else {
            badge.style.display = "none";
        }
    });
};

let unsubscribeList = null;

export const listenNotificationList = (userId) => {
    if (!userId) return;

    if (unsubscribeList) unsubscribeList();

    const ref = collection(db, "userNotifications", userId, "items");

    unsubscribeList = onSnapshot(ref, (snapshot) => {
        notificationsData = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().createdAt?.toDate
                    ? doc.data().createdAt.toDate().toISOString()
                    : new Date().toISOString()
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        window.dispatchEvent(new Event("notificationsUpdated"));
    });
};


// -----------------------------------------------
// --- 🔔 FEEDBACK VISUAL DEL CARRITO (ANIMACIÓN) ---
// -----------------------------------------------
export const animateCartFeedback = () => {
    const cartBadge = document.getElementById('cart-count');
    const cartNavItem = document.querySelector('a[href="cart.html"]');

    if (!cartBadge) return;

    const totalItems = getCartTotalQuantity();

    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'inline-flex';

        // Reiniciar animación del badge
        cartBadge.classList.remove('bump');
        void cartBadge.offsetWidth; // fuerza reflow
        cartBadge.classList.add('bump');
    } else {
        cartBadge.style.display = 'none';
    }

    // Animar ícono del carrito
    if (cartNavItem) {
        cartNavItem.classList.remove('cart-animate');
        void cartNavItem.offsetWidth;
        cartNavItem.classList.add('cart-animate');
    }
};


// -----------------------------------------------
// --- 🔔 NOTIFICACIÓN VISUAL "AGREGADO AL CARRITO" ---
// -----------------------------------------------
export const showAddToCartNotification = ({ name, quantity }) => {
    const existing = document.querySelector('.add-cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'add-cart-toast';

    toast.innerHTML = `
        <span class="material-icons toast-icon">check_circle</span>
        <div class="toast-content">
            <strong>Agregado al carrito</strong>
            <span>✅ Agregado ${quantity}x ${name} añadido al carrito.</span>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 30);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2200);
};


// -----------------------------------------------
// --- INICIALIZACIÓN DE LISTENERS GLOBALES ---
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('cartUpdated', updateCartCountDisplay);
    window.addEventListener('notificationsUpdated', updateNotificationCountDisplay); 
    
    updateCartCountDisplay(); 
    updateNotificationCountDisplay(); 
});

// Exportaciones finales para uso en otros módulos
export { 
    db, 
    auth, 
    // Para Admin.js y otros:
    getDoc, 
    updateDoc, 
    collection, 
    setDoc, 
    serverTimestamp // Exportaciones de Firestore necesarias para Admin.js
};


/* =====================================
   FIX BLOQUEO SCROLL EN MÓVIL
   ===================================== */
function unlockMobileScroll() {
  document.body.style.overflow = "auto";
  document.body.style.height = "auto";
  document.documentElement.style.overflow = "auto";
  document.documentElement.style.height = "auto";
}

if (window.innerWidth <= 768) {
  window.addEventListener("load", unlockMobileScroll);
  window.addEventListener("resize", unlockMobileScroll);
}

/* =====================================
   FIX HEADER ALTURA FORZADA
   ===================================== */
function fixHeaderMobile() {
  const header = document.querySelector("header.main-header");
  if (!header) return;

  if (window.innerWidth <= 768) {
    header.style.height = "auto";
    header.style.maxHeight = "none";
    header.style.position = "static";
  }
}

window.addEventListener("load", fixHeaderMobile);
window.addEventListener("resize", fixHeaderMobile);

/* =====================================
   MENU HAMBURGUESA FUNCIONAL
   ===================================== */
document.addEventListener("DOMContentLoaded", function() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenuWrapper = document.getElementById("mobileMenuWrapper");

  if (mobileMenuBtn && mobileMenuWrapper) {
    mobileMenuBtn.addEventListener("click", function() {
      mobileMenuWrapper.classList.toggle("open");
    });
  }
});
