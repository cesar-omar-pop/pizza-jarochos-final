import { 
    initAuthAndHeader, 
    db, 
    addToCart,
    showToast 
} from "./common.js"; 
import { 
    collection, 
    getDocs,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { animateCartFeedback } from "./common.js";

let menuPizzasData = [];
let activeCategory = 'todas';
const menuContainer = document.getElementById('menu-container-grid');
const PLACEHOLDER_IMG = "./img/placeholder.jpg";

function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// -------------------------
// Cargar pizzas desde Firestore
// -------------------------
async function loadMenuData() {
    if (!menuContainer) return;
    menuContainer.innerHTML = '<p class="placeholder-text">Cargando pizzas...</p>';

    try {
        const q = query(
            collection(db, "catalogo"), 
            where("type", "==", "pizza"), 
            orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        menuPizzasData = [];
        snap.forEach(doc => menuPizzasData.push({ id: doc.id, ...doc.data() }));

        renderPizzas(activeCategory);
    } catch (err) {
        console.error("Error al cargar el menú de pizzas:", err);
        menuContainer.innerHTML = '<p class="placeholder-text error">Error al cargar el menú.</p>';
    }
}

// -------------------------
// Render tarjeta pizza
// -------------------------
function renderPizzaCardHTML(pizza) {
    const imageUrl = pizza.imageUrl || PLACEHOLDER_IMG;
    const subCategory = pizza.subCategory || 'Clásica';
    const subCatLower = subCategory.toLowerCase();
    let badgeClass = 'badge-clasica';
    if (subCatLower.includes('especial')) badgeClass = 'badge-especial';
    else if (subCatLower.includes('vegetariana')) badgeClass = 'badge-vegetariana';
    const price = (pizza.precio || 0).toFixed(2);

    return `
    <div class="pizza-item" data-id="${escapeHtml(pizza.id)}">
        <div class="pizza-item-image" style="background-image: url('${escapeHtml(imageUrl)}');"></div>
        <span class="badge ${badgeClass}">${escapeHtml(subCategory)}</span>
        <div class="item-details">
            <h4>${escapeHtml(pizza.name)}</h4>
            <p class="description-text">${escapeHtml(pizza.description || '').substring(0,70)}...</p>
            <div class="price-and-actions">
                <span id="price-${pizza.id}" class="price-tag">$${price} MXN</span>
                <div class="add-to-cart">
                    <div class="quantity-control">
                        <button data-action="decrement" data-id="${pizza.id}">-</button>
                        <input type="number" value="1" min="1" id="qty-${pizza.id}" class="quantity-input" readonly>
                        <button data-action="increment" data-id="${pizza.id}">+</button>
                    </div>
                    <button class="btn-agregar" data-action="add-to-cart" data-id="${pizza.id}">
                        <span class="material-icons">add_shopping_cart</span> Añadir
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

// -------------------------
// Render pizzas según categoría
// -------------------------
function renderPizzas(categoryFilter) {
    if (!menuContainer) return;
    const filtered = menuPizzasData.filter(p => {
        if (categoryFilter === 'todas') return true;
        return (p.subCategory || '').toLowerCase() === categoryFilter;
    });
    menuContainer.innerHTML = filtered.length 
        ? filtered.map(renderPizzaCardHTML).join('')
        : `<p class="placeholder-text">No se encontraron pizzas en la categoría '${categoryFilter}'.</p>`;
    setupDynamicEventListeners();
}

// -------------------------
// Precio dinámico
// -------------------------
function updateLivePrice(pizzaId, quantity) {
    const priceEl = document.getElementById(`price-${pizzaId}`);
    const pizza = menuPizzasData.find(p => p.id === pizzaId);
    if (priceEl && pizza) {
        priceEl.textContent = `$${(pizza.precio*quantity).toFixed(2)} MXN`;
    }
}



function showAddToCartNotification({ name, quantity, imageUrl }) {
    // eliminar si existe una previa
    const existing = document.querySelector('.add-cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'add-cart-toast';

    toast.innerHTML = `
        <span class="material-icons toast-icon">check_circle</span>
        <div class="toast-content">
            <strong>Agregado al carrito</strong>
            <span>${name} (${quantity} ${quantity > 1 ? 'unid.' : 'unid.'})</span>
        </div>
    `;

    document.body.appendChild(toast);

    // animación entrada
    setTimeout(() => toast.classList.add('show'), 50);

    // salida automática
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}









function handleQuantityChange(pizzaId, change) {
    const qtyInput = document.getElementById(`qty-${pizzaId}`);
    if (!qtyInput) return;
    let newQty = Math.max(1, parseInt(qtyInput.value) + change);
    qtyInput.value = newQty;
    updateLivePrice(pizzaId, newQty);
}

// -------------------------
// Event listeners dinámicos
// -------------------------
function setupDynamicEventListeners() {
    if (menuContainer.dataset.listenersAttached === 'true') return;

    menuContainer.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el) return;

        const action = el.dataset.action;
        const id = el.dataset.id;

        if (action === 'increment') {
            handleQuantityChange(id, 1);
        } 
        else if (action === 'decrement') {
            handleQuantityChange(id, -1);
        } 
        else if (action === 'add-to-cart') {
            const qtyInput = document.getElementById(`qty-${id}`);
            const qty = parseInt(qtyInput?.value || 1);

            const pizza = menuPizzasData.find(p => p.id === id);
            if (!pizza) return;

            // 🛒 Agregar al carrito
            addToCart({
                id: pizza.id,
                name: pizza.name,
                precio: pizza.precio,
                imageUrl: pizza.imageUrl,
                cantidad: qty
            });

            // 🔔 Notificación visual
            showAddToCartNotification({
                name: pizza.name,
                quantity: qty,
                imageUrl: pizza.imageUrl
            });

            // 🔴 Animación del carrito + badge
            animateCartFeedback();

            // 🔢 Resetear cantidad y precio (UX)
            if (qtyInput) qtyInput.value = 1;
            updateLivePrice(id, 1);
        }
    });

    menuContainer.dataset.listenersAttached = 'true';
}


// -------------------------
// Event listeners categorías
// -------------------------
function setupStaticEventListeners() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.dataset.hasListener) return;
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeCategory = e.currentTarget.dataset.category.toLowerCase();
            renderPizzas(activeCategory);
        });
        btn.dataset.hasListener = 'true';
    });
}

// -------------------------
// Inicialización
// -------------------------
function initMenuPage() {
    setupStaticEventListeners();
    initAuthAndHeader(loadMenuData);
}

document.addEventListener("DOMContentLoaded", initMenuPage);
