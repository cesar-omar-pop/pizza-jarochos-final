// js/cart.js (Lógica específica para cart.html - IMPLEMENTACIÓN DE CHECKOUT REAL)

import { 
    initAuthAndHeader, 
    db, 
    auth, 
    showToast,
    addNotification, 
    getCart,
    saveCart,
    clearCart,
    updateItemQuantity 
} from "./common.js"; 
import { 
    serverTimestamp,
    collection, 
    addDoc,
    updateDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
    getStorage,
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const storage = getStorage();

// --- Referencias UI ---
const cartItemsContainer = document.getElementById('cart-items-container');
const subtotalSummaryElement = document.getElementById('subtotal-summary'); 
const shippingCostElement = document.getElementById('shipping-cost');
const cartTotalElement = document.getElementById('cart-total'); 
const clearCartButton = document.getElementById('clear-cart-button');
const checkoutButton = document.getElementById('checkout-button');
const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
const mercadopagoDetailsSection = document.getElementById('mercadopago-details-section');
const deliveryStreetInput = document.getElementById("address");
const deliveryNeighborhoodInput = document.getElementById("colony");
const deliveryNotesInput = document.getElementById("notes");

// --- Variables ---
const SHIPPING_COST = 50.00;
let comprobanteFile = null;

// -----------------------------------------------------------
// --- RENDERIZAR CARRITO ---
// -----------------------------------------------------------

function renderCart() {
    const cart = getCart();
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = ''; 
    let subtotal = 0;

    if (checkoutButton) checkoutButton.disabled = true;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <h2>🛒 Tu carrito está vacío.</h2>
                <p>¡Explora nuestro <a href="catalogo.html">Catálogo</a> y añade algo delicioso!</p>
            </div>
        `;
    } else {
        
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemCantidad = parseInt(item.cantidad) || 0;
            
            if (itemCantidad <= 0 || itemPrice <= 0) return; 

            const itemTotal = itemPrice * itemCantidad;
            subtotal += itemTotal;
            
            const cartItemHTML = `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image || 'https://placehold.co/80x80/cccccc/ffffff?text=Prod'}" alt="${item.name}" class="item-image">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <span class="item-price">$${itemPrice.toFixed(2)} c/u</span> 
                        
                        <div class="quantity-control"> 
                            <button class="quantity-btn quantity-minus" data-id="${item.id}" data-change="-1">-</button>
                            <div class="quantity-display">${itemCantidad}</div> 
                            <button class="quantity-btn quantity-plus" data-id="${item.id}" data-change="1">+</button>
                        </div>
                        
                    </div>
                    <div class="item-total-price">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-item-btn" data-id="${item.id}">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        if (subtotal > 0) {
            checkoutButton.disabled = false;
        }
    }

    const total = subtotal > 0 ? subtotal + SHIPPING_COST : 0;
    if (subtotalSummaryElement) subtotalSummaryElement.textContent = `$${subtotal.toFixed(2)} MXN`;
    if (shippingCostElement) shippingCostElement.textContent = `$${SHIPPING_COST.toFixed(2)} MXN`;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)} MXN`;

    setupEventListeners();
}

// -----------------------------------------------------------
// --- MANEJO DE CANTIDADES ---
// -----------------------------------------------------------

function handleQuantityChange(e) {
    const itemId = e.currentTarget.getAttribute('data-id');
    const change = parseInt(e.currentTarget.getAttribute('data-change'));
    
    updateItemQuantity(itemId, change); 
    renderCart(); 
}

function handleRemoveItem(e) {
    const itemId = e.currentTarget.getAttribute('data-id');
    const cart = getCart();
    const item = cart.find(i => i.id === itemId);

    if (item) {
        updateItemQuantity(itemId, -item.cantidad); 
        showToast('Eliminado', `Se eliminó "${item.name}" del carrito.`, 'warning');
        renderCart(); 
    }
}
function validateDeliveryData() {
    const street = deliveryStreetInput?.value.trim();
    const neighborhood = deliveryNeighborhoodInput?.value.trim();

    if (!street || !neighborhood) {
        showToast(
            "📍 Datos de Entrega requeridos",
            "Por favor ingresa Calle y Número y Colonia antes de continuar.",
            "warning"
        );

        // UX: enfocar el primer campo vacío
        if (!street) {
            deliveryStreetInput.focus();
        } else {
            deliveryNeighborhoodInput.focus();
        }

        return false;
    }

    return true;
}

// -----------------------------------------------------------
// --- FIREBASE: SUBIR COMPROBANTES ---
// -----------------------------------------------------------

async function uploadComprobante(orderId) {
    const user = auth.currentUser;
    if (!comprobanteFile || !user) return null;

    const ext = comprobanteFile.name.split('.').pop();
    const storageRef = ref(storage, `comprobantes/${user.uid}/${orderId}.${ext}`);
    
    const snapshot = await uploadBytes(storageRef, comprobanteFile);
    return await getDownloadURL(snapshot.ref);
}


// -----------------------------------------------------------
// --- GUARDAR PEDIDO EN FIRESTORE (VERSIÓN FINAL CORRECTA)
// -----------------------------------------------------------

async function submitOrderToFirestore(paymentMethod, status = 'Pendiente') {
    const user = auth.currentUser;
    if (!user) {
        showToast('Error', 'Debes iniciar sesión para hacer un pedido.', 'error');
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Error', 'El carrito está vacío.', 'error');
        return;
    }

    const subtotal = cart.reduce(
        (sum, item) =>
            sum + ((Number(item.price) || 0) * (Number(item.cantidad) || 0)),
        0
    );

    const total = subtotal + SHIPPING_COST;

    const newOrder = {
        userId: user.uid,
        userName: user.email.split('@')[0],
        userEmail: user.email,

        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.cantidad) || 1,
            image:
                item.image ||
                item.imageUrl ||
                'https://placehold.co/80x80/cccccc/ffffff?text=Prod'
        })),

        subtotal,
        shipping: SHIPPING_COST,
        total,
        paymentMethod,
        status,
        createdAt: serverTimestamp()
    };

    try {
        // 1️⃣ GUARDAR PEDIDO
        const orderRef = await addDoc(collection(db, 'pedidos'), newOrder);
        const orderId = orderRef.id;

        // 2️⃣ NOTIFICACIÓN PARA EL USUARIO (🔥 PRIMERO)
        const userNotifRef = await addDoc(
            collection(db, 'userNotifications', user.uid, 'items'),
            {
                title: `Pedido #${orderId.substring(0, 6)} Creado`,
                body: `Tu pedido por $${total.toFixed(2)} ha sido registrado.`,
                type: 'payment',
                read: false,
                createdAt: serverTimestamp()
            }
        );

        // 3️⃣ ALERTA PARA ADMIN (🔥 CONECTADA A LA NOTIFICACIÓN)
        await addDoc(collection(db, 'admin_alerts'), {
            orderId,
            notificationId: userNotifRef.id, // 🔥 CLAVE PARA CHAT
            userId: user.uid,
            customerName: user.email.split('@')[0],
            customerEmail: user.email,
            total,
            timestamp: serverTimestamp(),
            status: 'new'
        });

        // 4️⃣ TRANSFERENCIA (SI APLICA)
        if (paymentMethod === 'transferencia' && comprobanteFile) {
            const url = await uploadComprobante(orderId);
            await updateDoc(doc(db, 'pedidos', orderId), {
                comprobanteURL: url,
                status: 'Pendiente de Validación'
            });
        }

        // 5️⃣ LIMPIAR Y UI
        clearCart();
        renderCart();

        showToast(
            '🎉 Pedido Exitoso',
            `Pedido #${orderId.substring(0, 6)} enviado correctamente.`,
            'success'
        );

    } catch (error) {
        console.error('❌ Error al finalizar el pedido:', error);
        showToast('Error', 'No se pudo completar el pedido.', 'error');
    }
}


async function processMercadoPagoCheckout() {
    showToast("Procesando Pago", "Generando enlace de pago con Mercado Pago...", "info");

    const user = auth.currentUser;
    if (!user) {
        showToast("Error", "Debes iniciar sesión para hacer un pedido.", "error");
        return;
    }

    const cart = getCart();
    if (!cart || cart.length === 0) {
        showToast("❌ Carrito Vacío", "No hay productos para procesar el pago.", "error");
        return;
    }

    const deliveryAddressElement = document.getElementById("delivery-address");
    const deliveryAddress = deliveryAddressElement
        ? deliveryAddressElement.value.trim()
        : "Recoger en tienda";

    // 🔢 SUBTOTAL REAL
    const subtotal = cart.reduce(
        (sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.cantidad) || 0),
        0
    );

    const total = subtotal + SHIPPING_COST;

    // 🔥 PEDIDO NORMALIZADO PARA FIREBASE (CLAVE)
    const newOrder = {
        userId: user.uid,
        userName: user.email.split("@")[0],
        userEmail: user.email,

        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.cantidad) || 1,
            image: item.image || item.imageUrl || "https://placehold.co/80x80/cccccc/ffffff?text=Prod"
        })),

        subtotal,
        shipping: SHIPPING_COST,
        total,
        paymentMethod: "mercadopago",
        status: "Pendiente de Pago",
        deliveryAddress,
        createdAt: serverTimestamp()
    };

    try {
        // 👉 1) GUARDAR PEDIDO
        const pedidosRef = collection(db, "pedidos");
        const docRef = await addDoc(pedidosRef, newOrder);
        const orderId = docRef.id;

        console.log("Pedido guardado antes de MP:", orderId);

        // 👉 2) ALERTA ADMIN (NORMALIZADA)
        await addDoc(collection(db, "admin_alerts"), {
            orderId,
               userId: user.uid,          // 👈 agrega esto
            customerEmail: user.email,
            customerName: user.email.split("@")[0],
            total,
            items: newOrder.items,
            timestamp: serverTimestamp(),
            status: "pending_mp"
        });

        // 👉 3) ITEMS PARA MERCADO PAGO
        const mpItems = cart.map(item => ({
            name: item.name,
            price: Number(item.price) || 1,
            cantidad: Number(item.cantidad) || 1
        }));

        // 🔥 AGREGAR ENVÍO COMO PRODUCTO
        mpItems.push({
            name: "Costo de envío",
            price: SHIPPING_COST,
            cantidad: 1
        });

        const body = {
            orderId,
            items: mpItems,
            description: `Pedido Pizzas Jarocho - Dirección: ${deliveryAddress}`
        };

        const response = await fetch(
            "https://pizzas-jarocho-mp-api.vercel.app/api/create_preference",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("Error Mercado Pago:", result);
            showToast(
                "❌ Error en Mercado Pago",
                result.detail || "No se pudo crear la preferencia.",
                "error"
            );
            return;
        }

        // 👉 4) REDIRIGIR A MP
        window.location.href = result.init_point;

    } catch (err) {
        console.error("Error en MP Checkout:", err);
        showToast("Error", "No se pudo procesar el pago.", "error");
    }
}

// -----------------------------------------------------------
// --- BOTÓN PRINCIPAL DE CHECKOUT ---
// -----------------------------------------------------------
window.handleCheckoutAction = function () {
    const selectedMethod =
        document.querySelector('input[name="payment-method"]:checked')?.value || "efectivo";

    const cart = getCart();

    if (cart.length === 0) {
        showToast("Error", "El carrito está vacío.", "error");
        return;
    }

    // 🔥 VALIDAR DATOS DE ENTREGA ANTES DE PAGAR
    if (!validateDeliveryData()) {
        return;
    }

    const deliveryAddress =
        `${deliveryStreetInput.value.trim()}, ${deliveryNeighborhoodInput.value.trim()}`;

    const deliveryNotes = deliveryNotesInput?.value.trim() || "";

    if (selectedMethod === "mercadopago") {
        processMercadoPagoCheckout(deliveryAddress, deliveryNotes);
    } else {
        submitOrderToFirestore(
            "efectivo",
            "Confirmado",
            deliveryAddress,
            deliveryNotes
        );
    }
};


// -----------------------------------------------------------
// --- UI MÉTODOS DE PAGO ---
// -----------------------------------------------------------
function handlePaymentMethodChange() {
    const method =
        document.querySelector('input[name="payment-method"]:checked')?.value || "efectivo";

    // ❌ Transferencia eliminada
    // Solo Mercado Pago tiene sección extra
    mercadopagoDetailsSection.style.display =
        method === "mercadopago" ? "block" : "none";

    // El botón principal SIEMPRE visible
    checkoutButton.style.display = "block";

    checkoutButton.textContent =
        method === "mercadopago"
            ? "PAGAR CON MERCADO PAGO"
            : "CONFIRMAR PEDIDO";
}

function setupEventListeners() {
    document.querySelectorAll('.quantity-control button').forEach(btn => {
        btn.addEventListener('click', handleQuantityChange);
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', handleRemoveItem);
    });

    clearCartButton.onclick = () => {
        clearCart();
        renderCart();
        showToast(
            "Carrito Vaciado",
            "Todos los productos fueron eliminados.",
            "warning"
        );
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthAndHeader(() => renderCart());

    paymentMethodRadios.forEach(r => {
        r.addEventListener('change', handlePaymentMethodChange);
    });

    handlePaymentMethodChange();

    if (checkoutButton) {
        checkoutButton.addEventListener('click', window.handleCheckoutAction);
    }
});
