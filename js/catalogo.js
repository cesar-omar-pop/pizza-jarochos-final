// ================================
// js/catalogo.js — Catálogo completo unificado
// Requiere: js/common.js exportando initAuthAndHeader, db, addToCart, showToast, animateCartFeedback, showAddToCartNotification
// ================================

import {
  initAuthAndHeader,
  db,
  addToCart,
  animateCartFeedback,
  showAddToCartNotification,
  showToast
} from "./common.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =======================
   SELECTORES / ESTADO
   ======================= */
let catalogoData = [];
let activeCategory = "todo"; 
let activePizzaSubcategory = "todas"; 
let currentSearchTerm = "";

const combosGrid = document.getElementById("combos-grid");
const productsGrid = document.getElementById("products-grid");
const tabButtons = document.querySelectorAll(".category-tabs .tab-button");
const searchInput = document.getElementById("search-input");
const combosSection = document.getElementById("combos-section");
const productsSection = document.getElementById("products-section");

// Modal
const productModal = document.getElementById("product-detail-modal");
const modalCloseBtn = productModal?.querySelector(".close-button");
const modalImage = document.getElementById("modal-image");
const modalName = document.getElementById("modal-name");
const modalDescription = document.getElementById("modal-description");
const modalIngredients = document.getElementById("modal-ingredients-list");
const modalPrice = document.getElementById("modal-price");
const modalAddToCartBtn = document.getElementById("modal-add-to-cart");

// placeholder
const PLACEHOLDER_IMG = "./img/placeholder.jpg";

/* =======================
   UTILIDADES
   ======================= */
function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeText(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Obtener la imagen de un producto
function getImageSource(item) {
  return item.imageUrl || PLACEHOLDER_IMG;
}

/* =======================
   🔧 NORMALIZADOR DE DOCUMENTOS
   ======================= */
function normalizeDoc(raw = {}) {
  const normalized = {
    id: raw.id || "",
    name: raw.name || raw.nombre || "Sin nombre",
    description: raw.description || raw.descripcion || "",
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients
      : Array.isArray(raw.ingredientes)
        ? raw.ingredientes
        : typeof raw.ingredients === "string"
          ? raw.ingredients.split(",").map(i => i.trim()).filter(Boolean)
          : typeof raw.ingredientes === "string"
            ? raw.ingredientes.split(",").map(i => i.trim()).filter(Boolean)
            : [],
    precio: Number(raw.precio ?? raw.price ?? 0),
    stock: Number(raw.stock ?? 0),
    type: (raw.type || raw.category || raw.categoria || "otros").toString().toLowerCase().trim(),
    subCategory: (raw.subCategory || raw.subcategoria || raw.tipo_pizza || "").toString().trim(),
    imageUrl: raw.imageUrl || raw.image || raw.imagen || PLACEHOLDER_IMG,
    createdAt: raw.createdAt || null
  };

  let cat = normalized.type;
  if (cat === "pizza") cat = "pizza";
  else if (cat === "combo") cat = "combos";
  else if (cat === "bebida") cat = "bebidas";
  else if (cat === "postre") cat = "postres";
  else if (cat === "extra") cat = "extras";
  else if (cat === "promocion" || raw.isPromotion) cat = "promociones";
  else cat = cat || "otros";

  normalized.category = cat;
  if (normalized.category === "pizza" && !normalized.subCategory) {
    normalized.subCategory = "Sin Categoría";
  }

  return normalized;
}

/* =======================
   FETCH DE DATOS: catalogo + pizzas
   ======================= */
async function loadCatalogoData() {
  try {
    const snapCatalogo = await getDocs(collection(db, "catalogo"));
    const arrCatalogo = snapCatalogo.docs.map(d => normalizeDoc({ id: d.id, ...d.data() }));

    const snapPizzas = await getDocs(collection(db, "pizzas"));
    const arrPizzas = snapPizzas.docs.map(d => {
      const norm = normalizeDoc({ id: d.id, ...d.data() });
      norm.category = "pizza";
      return norm;
    });

    catalogoData = [...arrCatalogo, ...arrPizzas];
    console.log("Datos cargados:", catalogoData);
  } catch (err) {
    console.error("Error cargando catálogo:", err);
    showToast("❌ Error", "No se pudieron cargar los datos del catálogo.", "error");
    catalogoData = [];
  }

  renderItems(activeCategory, currentSearchTerm);
}

/* =======================
   BADGES
   ======================= */
function getBadgeInfo(item) {
  const cat = (item.category || item.type || "").toLowerCase();
  if (cat === "pizza") {
    const sub = (item.subCategory || "Sin Categoría").toLowerCase();
    let badgeClass = "badge-sin-categoria";
    if (sub.includes("vegetariana")) badgeClass = "badge-vegetariana";
    else if (sub.includes("especial")) badgeClass = "badge-especial";
    else if (sub.includes("clásica") || sub.includes("clasica")) badgeClass = "badge-clasica";
    return { text: escapeHtml(item.subCategory), class: badgeClass };
  } else {
    const text = item.category || "Producto";
    return { text: escapeHtml(text.charAt(0).toUpperCase() + text.slice(1)), class: `badge-${text.toLowerCase().replace(/\s/g,'-')}` };
  }
}

/* =======================
   CONSTRUCTORES DE TARJETAS
   ======================= */
function buildProductCard(item) {
  const unitPrice = safeNumber(item.precio);
  const imageSrc = escapeHtml(item.imageUrl || PLACEHOLDER_IMG);
  const safeName = escapeHtml(item.name || "Sin nombre");
  const dataCat = (item.category || "").toLowerCase();
  const badge = getBadgeInfo(item);

  // Ingredientes solo para pizzas y combos
  const ingredientsHTML = (dataCat === "pizza" || dataCat === "combos") && item.ingredients.length
    ? `<div class="ingredients-list">
         <strong>Ingredientes principales:</strong>
         <ul>${item.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
       </div>`
    : '';

  // Cantidad y botón añadir para todos
  const qtyHTML = `
    <div class="left-side">
      <div class="quantity-control">
        <button class="qty-btn" data-action="decrement" data-id="${item.id}">-</button>
        <input type="text" id="qty-${item.id}" class="quantity-input" value="1" readonly>
        <button class="qty-btn" data-action="increment" data-id="${item.id}">+</button>
      </div>
      <button class="btn-agregar" data-action="add" data-id="${item.id}">
        <span class="material-icons" style="font-size:1.1rem">add_shopping_cart</span> Añadir
      </button>
    </div>`;

  // Botón detalles para todos
  const detailBtnHTML = `<button class="btn-detail" data-action="detail" data-id="${item.id}">Detalles</button>`;

  return `
    <div class="product-item" data-id="${item.id}" data-category="${dataCat}">
      <div class="product-image-container" style="background-image: url('${imageSrc}');">
        <span class="product-badge ${badge.class}">${badge.text}</span>
      </div>

      <div class="item-details">
        <h4>${safeName}</h4>
        ${ingredientsHTML}
      </div>

      <div class="price-and-actions">
        <span class="price-tag" id="total-preview-${item.id}" data-unit-price="${unitPrice}">
          $${unitPrice.toFixed(2)} MXN
        </span>
        <div class="add-to-cart">
          ${qtyHTML}
          ${detailBtnHTML}
        </div>
      </div>
    </div>
  `;
}


function buildPromotionCard(item) {
  const unitPrice = safeNumber(item.precio);
  const imageSrc = escapeHtml(getImageSource(item));
  const badge = getBadgeInfo(item);
  return `
    <div class="promotion-card" data-id="${item.id}" style="background-image: url('${imageSrc}');">
      <div class="promo-overlay">
        <div class="promo-content">
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(item.description)}</p>
          <span class="price-tag">$${unitPrice.toFixed(2)} MXN</span>
        </div>
        <div class="promo-actions">
          <button class="btn-detail btn-small" data-action="detail" data-id="${item.id}">Ver Detalles</button>
          <button class="btn-small btn-agregar-promo" data-action="add" data-id="${item.id}">Agregar</button>
        </div>
      </div>
      <div class="promo-badge-tag ${badge.class}">${badge.text}</div>
    </div>
  `;
}

/* =======================
   RENDER PRINCIPAL
   ======================= */
function renderItems(category = "todo", searchTerm = "") {
  if (!combosGrid || !productsGrid || !combosSection || !productsSection) return;

  const s = (searchTerm || "").toLowerCase();
  const catNorm = normalizeText(category);

  const filtered = catalogoData.filter(item => {
    const name = (item.name || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const matchesSearch = !s || name.includes(s) || desc.includes(s);
    const itemCat = normalizeText(item.category);
    if (catNorm === "todo") return matchesSearch;
    if (catNorm === "pizzas") {
      if (itemCat !== "pizza") return false;
      if (!activePizzaSubcategory || activePizzaSubcategory === "todas") return matchesSearch;
      const sub = normalizeText(item.subCategory || "sin categoría");
      return matchesSearch && sub === normalizeText(activePizzaSubcategory);
    }
    return matchesSearch && itemCat === catNorm;
  });

  const promotions = filtered.filter(i => normalizeText(i.category) === "promociones" || i.isPromotion);
  const products = filtered.filter(i => normalizeText(i.category) !== "promociones" && !i.isPromotion);

  combosSection.style.display = promotions.length ? "block" : "none";
  combosGrid.innerHTML = promotions.length ? promotions.map(buildPromotionCard).join("") : "";

  productsSection.querySelector(".section-title").textContent =
    catNorm === "pizzas" ? "🍕 Menú de Pizzas" :
    catNorm === "promociones" ? "🔥 Promociones" :
    `🛒 Productos de ${category.charAt(0).toUpperCase() + category.slice(1)}`;

  productsSection.style.display = "block";
  productsGrid.innerHTML = products.length ? products.map(buildProductCard).join("") :
    `<p class="loading-message">No hay productos disponibles para esta selección.</p>`;

  renderPizzaSubcategoryControlsIfNeeded();
}

/* =======================
   SUBCATEGORÍAS DE PIZZAS
   ======================= */
function renderPizzaSubcategoryControlsIfNeeded() {
  const old = document.getElementById("pizza-subcategory-controls");
  if (old) old.remove();
  if (activeCategory !== "pizzas") return;

  const FIXED_SUBCATS = [
    { display: "Clásicas", value: "clasicas" },
    { display: "Especiales", value: "especiales" },
    { display: "Vegetarianas", value: "vegetarianas" }
  ];

  const hasUncat = catalogoData.some(p => normalizeText(p.category) === "pizza" && !p.subCategory);

  const container = document.createElement("div");
  container.id = "pizza-subcategory-controls";
  container.className = "subcat-chips-container";

  container.innerHTML += `<span class="chip-subcat ${activePizzaSubcategory==='todas'?'active':''}" data-sub="todas">Todas</span>`;
  FIXED_SUBCATS.forEach(sc => {
    const isActive = normalizeText(activePizzaSubcategory) === normalizeText(sc.value) ? "active" : "";
    container.innerHTML += `<span class="chip-subcat ${isActive}" data-sub="${normalizeText(sc.value)}">${sc.display}</span>`;
  });
  if (hasUncat) {
    const filterValue = "Sin Categoría";
    const isActive = normalizeText(activePizzaSubcategory) === normalizeText(filterValue) ? "active" : "";
    container.innerHTML += `<span class="chip-subcat ${isActive}" data-sub="${normalizeText(filterValue)}">Sin Categoría</span>`;
  }

  productsSection.parentNode.insertBefore(container, productsSection);

  container.querySelectorAll(".chip-subcat").forEach(chip => {
    chip.onclick = () => {
      container.querySelectorAll(".chip-subcat").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activePizzaSubcategory = chip.dataset.sub;
      renderItems(activeCategory, currentSearchTerm);
    };
  });
}

/* =======================
   QUANTITY + ADD TO CART + MODAL
   ======================= */
function handleQuantityChange(itemId, change) {
  const input = document.getElementById(`qty-${itemId}`);
  const priceEl = document.getElementById(`total-preview-${itemId}`);
  if (!input || !priceEl) return;
  let qty = parseInt(input.value) || 1;
  qty = Math.max(1, qty + change);
  input.value = qty;
  const unit = safeNumber(priceEl.dataset.unitPrice, 0);
  priceEl.textContent = `$${(unit * qty).toFixed(2)} MXN`;
}
function handleAddToCart(itemId) {
  const item = catalogoData.find(i => i.id === itemId);
  if (!item) { showToast("❌","Producto no encontrado","error"); return; }

  const isPromo = normalizeText(item.category) === "promociones";
  const qtyInput = document.getElementById(`qty-${itemId}`);
  const qty = qtyInput ? parseInt(qtyInput.value || "1") : 1;

  addToCart({ id: item.id, name: item.name, precio: item.precio, imageUrl: item.imageUrl, cantidad: qty });
  showAddToCartNotification({ name: item.name, quantity: qty });
  animateCartFeedback();

  if (qtyInput) { // solo reiniciamos cantidad si existe
    qtyInput.value = 1;
    handleQuantityChange(itemId, 0);
  }
}

function openProductModal(itemId) {
  const item = catalogoData.find(i => i.id === itemId);
  if (!item || !productModal) return;

  // Imagen
  modalImage.src = item.imageUrl || PLACEHOLDER_IMG;

  // Nombre y precio
  modalName.textContent = item.name || "Sin nombre";
  modalPrice.textContent = `$${safeNumber(item.precio).toFixed(2)} MXN`;

  // Mostrar ingredientes solo si es pizza o combo y tiene ingredientes
  const cat = (item.category || "").toLowerCase();
  const ingredientsContainer = document.getElementById("modal-ingredients-container");
  if ((cat === "pizza" || cat === "combos") && item.ingredients?.length > 0) {
    modalIngredients.innerHTML = item.ingredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join("");
    ingredientsContainer.style.display = "block";
  } else {
    modalIngredients.innerHTML = "";
    ingredientsContainer.style.display = "none";
  }

  // Botón añadir al carrito
  modalAddToCartBtn.onclick = () => {
    handleAddToCart(item.id);
    productModal.style.display = "none";
  };

  // Mostrar modal siempre
  productModal.style.display = "block";
}


function closeProductModal() {
  if (!productModal) return;
  productModal.style.display = "none";
}

/* =======================
   DELEGACIÓN DE CLICK
   ======================= */
document.body.addEventListener("click", e => {
  const btn = e.target.closest("[data-action]") || e.target.closest("[data-id]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action==="increment") handleQuantityChange(id,1);
  else if (action==="decrement") handleQuantityChange(id,-1);
  else if (action==="add") handleAddToCart(id);
  else if (action==="detail") openProductModal(id);
});

if (modalCloseBtn) modalCloseBtn.onclick = closeProductModal;
if (productModal) window.onclick = (e) => { if(e.target===productModal) closeProductModal(); };

/* =======================
   TAB BUTTONS + SEARCH
   ======================= */
function wireCategoryTabs() {
  tabButtons.forEach(btn => {
    btn.onclick = () => {
      tabButtons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = (btn.dataset.category||"todo").toLowerCase();
      activePizzaSubcategory = "todas";
      const existing = document.getElementById("pizza-subcategory-controls");
      if (existing) existing.remove();
      renderItems(activeCategory,currentSearchTerm);
    };
  });
}

if (searchInput) {
  searchInput.oninput = (e) => {
    currentSearchTerm = e.target.value || "";
    renderItems(activeCategory,currentSearchTerm);
  };
}

/* =======================
   INIT
   ======================= */
function initCatalogoPage() {
  initAuthAndHeader(() => {
    wireCategoryTabs();
    loadCatalogoData();
  });
}

document.addEventListener("DOMContentLoaded", initCatalogoPage);
