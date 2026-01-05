// js/admin.js — Admin completo (Cloudinary unsigned + Firestore + Promociones + Pedidos realtime)
// Requiere: js/common.js que exporte `db`, `initAuthAndHeader`, `showToast`
import { sendChatMessage, listenChat } from "./notification-service.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { getStorage, ref as storageRef, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

import { db, initAuthAndHeader, showToast } from "./common.js";

// ---------- Cloudinary unsigned (tu preset & cloud name) ----------
const CLOUD_NAME = "dqi79l7mt";
const UPLOAD_PRESET = "pizzas_jarocho_web";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
// ---------- ESTADO GLOBAL ----------
let isEditing = false;
let currentItemId = null;
let currentItemImageUrl = null;

// 👉 debe iniciar en "todos" para no filtrar al cargar
let currentOrderStatusFilter = "todos";
let pedidosGroupMode = "none"; 

let pedidosBulkActions, btnDeletePeriod, btnExportPdf;
// ================== CATÁLOGO (CACHE GLOBAL) ==================
let catalogoData = [];

// ================== PEDIDOS (CACHE GLOBAL) ==================
let allPedidosCache = [];


// ---------- DOM (se asignan en initAdminPage) ----------
let adminForm, itemTypeSelect, pizzaCategoryDiv, pizzaCategorySelect;
let imageInput, imagePreview, imageStatus;
let submitButton, cancelButton;
let catalogoTableBody, catalogoSearchInput;
let pedidosListContainer, pedidosStatusFilter;

// 👉 filtros de pedidos (ESTO FALTABA)
let pedidosMesFilter, pedidosDiaFilter, pedidosClearBtn;

let menuButtons, tabContents;

let adminNotificationsList;

// ---------- Storage (para posible eliminación de urls Firebase) ----------
const storage = getStorage();

// ---------- Helpers ----------
function qs(id) { return document.getElementById(id); }

async function uploadToCloudinaryUnsigned(file) {
  if (!file) return null;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      console.error("Cloudinary error:", data);
      showToast("❌ Error", "No se pudo subir la imagen a Cloudinary.", "error");
      return null;
    }
    return data.secure_url || null;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    showToast("❌ Error", "Fallo al subir imagen.", "error");
    return null;
  }
}

function safeSetInput(id, value) {
  const el = qs(id);
  if (!el) return;
  el.value = (value === undefined || value === null) ? "" : value;
}



// ---------- Render catálogo mejorado (Admin y Usuario) ----------
function renderCatalogo(items) {
  if (!catalogoTableBody) return;
  catalogoTableBody.innerHTML = "";

  if (!items || items.length === 0) {
    catalogoTableBody.innerHTML = `
      <tr><td colspan="5" class="placeholder-text">No hay productos</td></tr>
    `;
    return;
  }

  items.forEach((item, idx) => {
    const tr = document.createElement("tr");

    const categoryText = item.category || item.type || "Sin categoría";
    const price = (typeof item.precio === "number")
      ? item.precio.toFixed(2)
      : (item.precio ? Number(item.precio).toFixed(2) : "N/A");

    // Construir celda de nombre + lista de ingredientes
    let ingredientesHTML = "";
    if (item.ingredients && item.ingredients.length) {
      ingredientesHTML = `
        <p><b>Ingredientes principales:</b></p>
        <ul class="ingredientes-list">
          ${item.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
      `;
    }

    const nameCell = `
      <div style="display:flex; flex-direction:column; gap:4px;">
        <strong>${escapeHtml(item.name || "Sin nombre")}</strong>
        ${ingredientesHTML}
      </div>
    `;

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${nameCell}</td>
      <td>${escapeHtml(categoryText)}</td>
      <td>$${price}</td>
      <td>
        <button class="btn-edit admin-btn edit-btn" data-id="${item.id}">✏️ Editar</button>
        <button class="btn-delete admin-btn delete-btn" data-id="${item.id}">🗑 Eliminar</button>
      </td>
    `;

    catalogoTableBody.appendChild(tr);
  });

  // Reasignar eventos
  document.querySelectorAll(".btn-edit").forEach(b => {
    b.onclick = () => editItem(b.dataset.id);
  });

  document.querySelectorAll(".btn-delete").forEach(b => {
    b.onclick = () => {
      if (confirm("¿Eliminar este producto?")) deleteItem(b.dataset.id);
    };
  });
}




// ---------- Render catálogo para Usuario ----------
function renderCatalogoUsuario(items, container) {
  if (!container) return;
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<p class="placeholder-text">No hay productos disponibles.</p>`;
    return;
  }

  items.forEach(item => {
    // Construir lista de ingredientes
    let ingredientesHTML = "";
    if (item.ingredients && item.ingredients.length) {
      ingredientesHTML = `
        <p><b>Ingredientes principales:</b></p>
        <ul class="ingredientes-list">
          ${item.ingredients.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
        </ul>
      `;
    }

    const productoHTML = document.createElement("div");
    productoHTML.className = "catalogo-item";
    productoHTML.innerHTML = `
      <div class="catalogo-item-content">
        <img src="${item.imageUrl || './img/placeholder.jpg'}" alt="${escapeHtml(item.name)}" class="catalogo-item-img"/>
        <div class="catalogo-item-info">
          <h4>${escapeHtml(item.name)}</h4>
          ${ingredientesHTML}
          <p class="catalogo-item-price">$${Number(item.precio || 0).toFixed(2)} MXN</p>
          <button class="btn-add-to-cart" data-id="${item.id}">add_shopping_cart Añadir</button>
        </div>
      </div>
    `;
    container.appendChild(productoHTML);
  });

  // Listener para añadir al carrito
  document.querySelectorAll(".btn-add-to-cart").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      addToCart(id); // Función existente en tu proyecto
    };
  });
}

// ================================
// 🔧 NORMALIZADOR DE DOCUMENTOS
// ================================
function normalizeDoc(raw = {}) {
  return {
    id: raw.id || "",
    name: raw.name || raw.nombre || "Sin nombre",

    // ❌ YA NO USAMOS description PARA PIZZAS
    description: raw.description || raw.descripcion || "",

    // ✅ INGREDIENTES (CRÍTICO)
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients
      : typeof raw.ingredients === "string"
        ? raw.ingredients.split(",").map(i => i.trim()).filter(Boolean)
        : [],

    precio: Number(raw.precio ?? raw.price ?? 0),
    stock: Number(raw.stock ?? 0),

    type: raw.type || raw.category || "otros",
    category: raw.category || raw.type || "otros",
    subCategory: raw.subCategory || raw.subcategoria || "",

    imageUrl: raw.imageUrl || raw.image || raw.imagen || "./img/placeholder.jpg",
    createdAt: raw.createdAt || null
  };
}

// =======================
// ADMIN — Render tabla catálogo
// =======================

function renderCatalogoTable(items = []) {
  if (!catalogoTableBody) return;

  if (!items.length) {
    catalogoTableBody.innerHTML =
      `<tr><td colspan="5">No hay productos</td></tr>`;
    return;
  }

  catalogoTableBody.innerHTML = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${item.name}</strong>
        ${
          item.ingredients && item.ingredients.length
            ? `<br><small><b>Ingredientes:</b> ${Array.isArray(item.ingredients)
                ? item.ingredients.join(", ")
                : item.ingredients}</small>`
            : ""
        }
      </td>
      <td>${item.category}</td>
      <td>$${Number(item.precio || 0).toFixed(2)}</td>
      <td>
        <button onclick="editItem('${item.id}')">✏️</button>
        <button onclick="deleteItem('${item.id}')">🗑</button>
      </td>
    </tr>
  `).join("");
}


// =======================
// Función depurada: Cargar catálogo incluyendo pizzas
// =======================
async function loadCatalogoData(searchTerm = "") {
  if (!catalogoTableBody) return;

  catalogoTableBody.innerHTML =
    `<tr><td colspan="6">Cargando catálogo...</td></tr>`;

  try {
    // -----------------------
    // 1) Cargar catálogo completo
    // -----------------------
    const qCatalogo = query(
      collection(db, "catalogo"),
      orderBy("name", "asc")
    );

    const snap = await getDocs(qCatalogo);

    // Normalización SIMPLE y SEGURA
    catalogoData = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "Sin nombre",
        description: data.description || "",
        precio: Number(data.precio ?? 0),
        stock: Number(data.stock ?? 0),
        type: data.type || "otros",
        category: data.category || data.type || "otros",
        subCategory: data.subCategory || "",
        imageUrl: data.imageUrl || "",
        createdAt: data.createdAt || null
      };
    });

    // -----------------------
    // 2) Filtrar por búsqueda
    // -----------------------
    const term = (searchTerm || "").toLowerCase().trim();

    const filtered = term
      ? catalogoData.filter(it =>
          (it.name || "").toLowerCase().includes(term) ||
          (it.description || "").toLowerCase().includes(term)
        )
      : catalogoData;

   
    renderCatalogo(filtered);

    console.log("📦 Catálogo total:", catalogoData.length);
    console.log("🔎 Filtrado:", filtered.length);

  } catch (err) {
    console.error("❌ Error cargar catálogo:", err);
    catalogoTableBody.innerHTML =
      `<tr><td colspan="6">❌ Error cargando catálogo</td></tr>`;
  }
}

async function handleAdminSubmitCatalogo(e) {
  e.preventDefault();

  const name = qs("item-name")?.value?.trim() || "";
  const precio = Number(qs("item-price")?.value) || 0;
  const stock = Number(qs("item-stock")?.value) || 0;

  let type = itemTypeSelect?.value?.toLowerCase() || "otros";
  const pizzaSubCategory =
    type === "pizza" ? pizzaCategorySelect?.value : null;

  // 🍕 INGREDIENTES dinámicos
  let ingredients = [];
  if (type === "pizza" && ingredientsContainer) {
    ingredients = Array.from(
      ingredientsContainer.querySelectorAll("input")
    )
      .map(inp => inp.value.trim())
      .filter(Boolean);
  }

  if (!name) {
    showToast("⚠️", "El nombre es requerido.", "warning");
    return;
  }

  submitButton.disabled = true;

  try {
    let imageUrl = currentItemImageUrl || "";

    if (imageInput?.files?.length) {
      imageUrl = await uploadToCloudinaryUnsigned(imageInput.files[0]);
    }

    let savedCategory = type;
    if (type === "bebida") savedCategory = "bebidas";
    else if (type === "postre") savedCategory = "postres";
    else if (type === "combo") savedCategory = "combos";
    else if (type === "pizza") savedCategory = "pizzas";

    const payload = {
      name,
      description: "",           // ya no usamos description para pizzas
      ingredients,               // ✅ array de ingredientes dinámicos
      precio,
      stock,
      type,
      category: savedCategory,
      subCategory: pizzaSubCategory || "",
      imageUrl,
      image: imageUrl,
      updatedAt: serverTimestamp()
    };

    if (isEditing && currentItemId) {
      // actualizar
      await updateDoc(doc(db, "catalogo", currentItemId), payload);
      showToast("✔️", "Producto actualizado.", "success");
    } else {
      // nuevo producto
      await addDoc(collection(db, "catalogo"), {
        ...payload,
        createdAt: serverTimestamp()
      });
      showToast("✔️", "Producto creado.", "success");
    }

    resetForm();
    await loadCatalogoData();

  } catch (err) {
    console.error(err);
    showToast("❌", "Error al guardar producto.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Guardar Ítem";
  }
}


async function editItem(id) {
  try {
    const ref = doc(db, "catalogo", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      showToast("❌", "Ítem no encontrado.", "error");
      return;
    }

    const item = snap.data();
    isEditing = true;
    currentItemId = id;
    currentItemImageUrl = item.imageUrl || "";

    // Nombre, precio, stock
    safeSetInput("item-name", item.name || "");
    safeSetInput("item-price", item.precio ?? "");
    safeSetInput("item-stock", item.stock ?? "");

    // Tipo y subcategoría pizza
    if (itemTypeSelect) itemTypeSelect.value = item.type || "pizza";
    const subCatValue = item.subCategory || "";
    if (item.type === "pizza") {
      if (pizzaCategoryDiv) pizzaCategoryDiv.classList.remove("hidden");
      if (pizzaCategorySelect) pizzaCategorySelect.value = subCatValue;
    } else {
      if (pizzaCategoryDiv) pizzaCategoryDiv.classList.add("hidden");
    }

    // --------------------------
    // INGREDIENTES DINÁMICOS
    // --------------------------
    initIngredientsInputs(Array.isArray(item.ingredients) ? item.ingredients : []);

    // Imagen
    if (imagePreview) {
      if (item.imageUrl) {
        imagePreview.src = item.imageUrl;
        imagePreview.style.display = "block";
      } else {
        imagePreview.src = "";
        imagePreview.style.display = "none";
      }
    }

    qs("item-id").value = id;
    qs("form-title").textContent = "✏️ Editando Ítem";
    submitButton.textContent = "Guardar Cambios";
    if (cancelButton) cancelButton.classList.remove("hidden");

    document.getElementById("tab-catalogo").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    console.error("Error editItem:", err);
    showToast("❌ Error", "No se pudo cargar el ítem.", "error");
    resetForm();
  }
}

// ---------- Eliminar catálogo ----------
async function deleteItem(id, imageUrl) {
  try {
    await deleteDoc(doc(db, "catalogo", id));
    showToast("✔️ Eliminado", "Ítem eliminado.", "success");
    loadCatalogoData();
  } catch (err) {
    console.error("Error delete:", err);
    showToast("❌ Error", "No se pudo eliminar.", "error");
  }
}

// ---------- Reset form ----------
function resetForm() {
  if (adminForm) adminForm.reset();
  currentItemId = null;
  isEditing = false;
  currentItemImageUrl = "";
  if (imagePreview) { imagePreview.src = ""; imagePreview.style.display = "none"; }
  qs("item-id").value = "";
  qs("form-title").textContent = "➕ Añadir Nuevo Ítem al Catálogo";
  submitButton.textContent = "Guardar Ítem";
  if (cancelButton) cancelButton.classList.add("hidden"); 
  if (imageStatus) imageStatus.textContent = "Sube una imagen para previsualizar.";
  if (pizzaCategoryDiv) pizzaCategoryDiv.classList.add("hidden");
  if (itemTypeSelect) itemTypeSelect.value = "pizza"; 
}




async function handleAdminSubmitUnified(e) {
  e.preventDefault();

  const selectedType = itemTypeSelect?.value?.toLowerCase();

  // =========================
  // 🟣 PROMOCIONES
  // =========================
  if (selectedType === "promociones") {
    const name = qs("item-name")?.value.trim() || "";
    const description = qs("item-description")?.value.trim() || "";
    const precio = Number(qs("item-price")?.value) || 0;

    if (!name) {
      showToast("⚠️", "El título es requerido.", "warning");
      return;
    }

    submitButton.disabled = true;

    try {
      let imageUrl = currentItemImageUrl || "";

      if (imageInput?.files?.length) {
        imageUrl = await uploadToCloudinaryUnsigned(imageInput.files[0]);
      }

      const payload = {
        name,
        description, // ✅ PROMOS sí usan description
        precio,
        imageUrl,
        isPromotion: true,
        category: "promociones",
        updatedAt: serverTimestamp()
      };

      if (isEditing && currentItemId) {
        await updateDoc(doc(db, "catalogo", currentItemId), payload);
        showToast("✏️", "Promoción actualizada.", "success");
      } else {
        await addDoc(collection(db, "catalogo"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast("✔️", "Promoción creada.", "success");
      }

      resetForm();

    } catch (err) {
      console.error(err);
      showToast("❌", "Error al guardar promoción.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Guardar Ítem";
    }

    return;
  }

  // =========================
  // 🟢 CATÁLOGO NORMAL (pizza, bebidas, etc.)
  // =========================
  await handleAdminSubmitCatalogo(e);
}















// ---------- Pedidos (Realtime) ----------
let pedidosUnsubscribe = null;

function subscribePedidosRealtime() {
  if (!pedidosListContainer) return;
  if (pedidosUnsubscribe) pedidosUnsubscribe();

  const q = query(
    collection(db, "pedidos"),
    orderBy("createdAt", "desc")
  );

  pedidosUnsubscribe = onSnapshot(
    q,
    snap => {
      allPedidosCache = [];

      snap.forEach(doc => {
        allPedidosCache.push({
          id: doc.id,
          ...doc.data()
        });
      });

      applyPedidosFilters(); // render inicial con caché
    },
    err => {
      console.error("Snapshot pedidos error:", err);
      pedidosListContainer.innerHTML =
        `<tr><td colspan="6">❌ Error cargando pedidos</td></tr>`;
    }
  );
}

function applyPedidosFilters(forDelete = false) {
  let filtered = [...allPedidosCache];

  // ------------------------
  // filtro por estado
  // ------------------------
  if (currentOrderStatusFilter && currentOrderStatusFilter !== "todos") {
    filtered = filtered.filter(p => (p.status || "").toLowerCase() === currentOrderStatusFilter.toLowerCase());
  }

  // ------------------------
  // filtro por mes
  // ------------------------
  if (pedidosMesFilter?.value) {
    // formato esperado: "YYYY-MM"
    const [yearStr, monthStr] = pedidosMesFilter.value.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    filtered = filtered.filter(p => {
      const d = p.createdAt?.toDate?.();
      if (!d) return false;
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });
  }

  // ------------------------
  // filtro por día
  // ------------------------
  if (pedidosDiaFilter?.value) {
    // formato esperado: "YYYY-MM-DD"
    const [yearStr, monthStr, dayStr] = pedidosDiaFilter.value.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    filtered = filtered.filter(p => {
      const d = p.createdAt?.toDate?.();
      if (!d) return false;
      return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
    });
  }

  // ------------------------
  // si solo queremos el array para eliminar
  // ------------------------
  if (forDelete) return filtered;

  // ------------------------
  // renderizar según modo de agrupación
  // ------------------------
  if (pedidosGroupMode === "day") renderPedidosGrouped(filtered, "day");
  else if (pedidosGroupMode === "month") renderPedidosGrouped(filtered, "month");
  else renderPedidos(filtered);

  updatePedidosBulkActions();
  return filtered;
}

// ------------------------
// Listeners para filtros en tiempo real
// ------------------------
if (pedidosStatusFilter) {
  pedidosStatusFilter.addEventListener("change", () => applyPedidosFilters());
}
if (pedidosMesFilter) {
  pedidosMesFilter.addEventListener("change", () => applyPedidosFilters());
}
if (pedidosDiaFilter) {
  pedidosDiaFilter.addEventListener("change", () => applyPedidosFilters());
}



// ---------- Render pedidos ----------
function renderPedidos(items) {
  if (!pedidosListContainer) return;
  pedidosListContainer.innerHTML = "";

  if (!items || items.length === 0) {
    pedidosListContainer.innerHTML =
      `<tr><td colspan="6" class="placeholder-text">No hay pedidos.</td></tr>`;
    return;
  }

  const rows = items.map(p => {
    const date = p.createdAt?.toDate
      ? new Date(p.createdAt.toDate()).toLocaleString('es-MX')
      : '-';

    const client = p.userName || p.clientName || p.userEmail || "Anónimo";
    const total = p.total || 0;
    const payment = p.paymentMethod || '-';
    const status = p.status || '-';

    return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(client)}</td>
        <td>$${Number(total).toFixed(2)}</td>
        <td>${escapeHtml(payment)}</td>
        <td>${escapeHtml(status)}</td>
        <td style="display:flex;gap:6px;align-items:center;">
          
          <select class="status-select" data-id="${p.id}">
            <option value="pendiente" ${status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en_preparacion" ${status === 'en_preparacion' ? 'selected' : ''}>En preparación</option>
            <option value="en_entrega" ${status === 'en_entrega' ? 'selected' : ''}>En entrega</option>
            <option value="entregado" ${status === 'entregado' ? 'selected' : ''}>Entregado</option>
            <option value="cancelado" ${status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>

          <button class="admin-btn" data-action="view" data-id="${p.id}">
            👁️
          </button>

          <button class="admin-btn danger btn-delete" data-id="${p.id}">
            🗑️
          </button>

        </td>
      </tr>
    `;
  }).join("");

  pedidosListContainer.innerHTML = rows;

  // cambiar estado
  document.querySelectorAll(".status-select").forEach(select => {
    select.onchange = () =>
      updateOrderStatus(select.dataset.id, select.value);
  });

  // ver detalle
  document.querySelectorAll('button[data-action="view"]').forEach(btn => {
    btn.onclick = () => viewPedidoDetail(btn.dataset.id);
  });

  // eliminar pedido
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = () => deletePedido(btn.dataset.id);
  });
}

async function deletePedido(id) {
    if (!id || typeof id !== "string") {
        console.error("ID inválido al eliminar pedido:", id);
        showToast("❌ Error", "No se pudo eliminar el pedido. ID inválido.", "error");
        return;
    }

    try {
        const docRef = doc(db, "pedidos", id);
        await deleteDoc(docRef);
        showToast("🗑️ Eliminado", "Pedido eliminado correctamente.", "success");
    } catch (err) {
        console.error("Error eliminando pedido:", err);
        showToast("❌ Error", "No se pudo eliminar el pedido.", "error");
    }
}

async function viewPedidoDetail(orderId) {
  try {
    const snap = await getDoc(doc(db, "pedidos", orderId));
    if (!snap.exists()) { showToast("❌", "Pedido no encontrado", "error"); return; }
    const p = snap.data();
    // construir modal simple con detalles (puedes mejorar con tu propio modal)
    const itemsHtml = (p.items || []).map(it => `<div class="pedido-item"><strong>${escapeHtml(it.name)}</strong> x ${it.cantidad || it.quantity || 1} — $${(it.price||it.precio||0).toFixed ? (it.price||it.precio||0).toFixed(2) : it.price||it.precio}</div>`).join("");
    const html = `
      <div style="max-width:600px;padding:16px;">
        <h3>Pedido #${orderId}</h3>
        <p><strong>Cliente:</strong> ${escapeHtml(p.userName||p.userEmail||"Anónimo")}</p>
        <p><strong>Total:</strong> $${(p.total||0).toFixed ? (p.total||0).toFixed(2) : p.total}</p>
        <p><strong>Dirección:</strong> ${escapeHtml(p.deliveryAddress||'Recoger en tienda')}</p>
        <div style="margin-top:12px;">
          <h4>Items</h4>
          ${itemsHtml}
        </div>
      </div>
    `;
    // Usamos window.prompt como modal simple para mostrar datos (puedes implementar un modal real)
    alert(stripHtml(html).replace(/(<([^>]+)>)/gi, ""));
  } catch (err) {
    console.error("Error viewPedidoDetail:", err);
    showToast("❌", "No se pudo cargar el pedido.", "error");
  }
}

// utilidad para limpiar html
function stripHtml(s) { return s.replace(/<\/?[^>]+(>|$)/g, ""); }

// ---------- Update status ----------
async function updateOrderStatus(orderId, newStatus) {
  try {
    await updateDoc(doc(db, "pedidos", orderId), { status: newStatus });
    showToast("✔️", "Estado actualizado", "success");
    // onSnapshot actualizará la vista automáticamente
  } catch (err) {
    console.error("Error updateOrderStatus:", err);
    showToast("❌", "No se pudo actualizar el estado", "error");
  }
}


// ---------- Utilidad escapeHtml ----------
function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function updatePedidosBulkActions() {
  if (!pedidosBulkActions) return;

  const hasMonth = pedidosMesFilter && pedidosMesFilter.value;
  const hasDay   = pedidosDiaFilter && pedidosDiaFilter.value;

  if (hasMonth || hasDay) {
    pedidosBulkActions.classList.remove("hidden");

    if (hasDay) {
      btnDeletePeriod.textContent = "🗑️ Eliminar pedidos del día";
      btnExportPdf.textContent    = "📄 Exportar PDF del día";
    } else {
      btnDeletePeriod.textContent = "🗑️ Eliminar pedidos del mes";
      btnExportPdf.textContent    = "📄 Exportar PDF del mes";
    }
  } else {
    pedidosBulkActions.classList.add("hidden");
  }
}

async function deletePedidosByPeriod() {
  if (!confirm("⚠️ Esta acción eliminará pedidos de forma PERMANENTE. ¿Continuar?")) return;

  const hasDay = pedidosDiaFilter.value;
  const hasMonth = pedidosMesFilter.value;

  const pedidosToDelete = applyPedidosFilters(true); 
  // 👆 versión silenciosa que devuelve array

  if (!pedidosToDelete.length) {
    alert("No hay pedidos para eliminar.");
    return;
  }

  for (const p of pedidosToDelete) {
    await deleteDoc(doc(db, "pedidos", p.id));
  }

  alert(`✅ ${pedidosToDelete.length} pedidos eliminados`);
}


function exportPedidosPDF() {
  const pedidos = applyPedidosFilters() || [];
  
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    return alert("No hay pedidos para exportar.");
  }

  // Generar filas de la tabla
  const rows = pedidos.map(p => {
    const fecha = p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleString("es-MX") : "-";
    const cliente = p.userName || "Cliente";
    const estado = p.status || "-";
    const total = p.total ? `$${p.total.toFixed(2)}` : "$0.00";

    return `
      <tr>
        <td>${fecha}</td>
        <td>${cliente}</td>
        <td>${estado}</td>
        <td>${total}</td>
      </tr>
    `;
  }).join("");

  const periodText = pedidosDiaFilter?.value
    ? `Día: ${pedidosDiaFilter.value}`
    : pedidosMesFilter?.value
      ? `Mes: ${pedidosMesFilter.value}`
      : "Todos los pedidos";

  const totalPedidos = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);

  // HTML para imprimir
  const html = `
    <html>
    <head>
      <title>Reporte de Pedidos</title>
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }

        body {
          font-family: "Arial", sans-serif;
          margin: 20px;
          color: #333;
        }

        h1 {
          font-size: 28px;
          margin-bottom: 4px;
          color: #d84315;
        }

        p {
          margin: 4px 0;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
          font-size: 14px;
        }

        th, td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #f4f4f4;
          color: #000;
        }

        tbody tr:nth-child(even) {
          background-color: #fafafa;
        }

        tfoot td {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>🍕 Pizza Jarocha</h1>
      <p><strong>${periodText}</strong></p>
      <p><strong>Estado:</strong> ${currentOrderStatusFilter || "Todos"}</p>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total de pedidos: ${pedidos.length}</td>
            <td>$${totalPedidos.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p><strong>Fecha de impresión:</strong> ${new Date().toLocaleString("es-MX")}</p>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// =======================
// 🔔 ADMIN - NOTIFICACIONES
// =======================

let adminNotificationsContainer = null;
let adminNotificationsUnsub = null;

function loadAdminNotifications() {
  if (!adminNotificationsContainer) return;

  if (adminNotificationsUnsub) adminNotificationsUnsub();

  const q = query(
    collection(db, "admin_alerts"),
    orderBy("timestamp", "desc")
  );

  adminNotificationsUnsub = onSnapshot(q, snap => {
    adminNotificationsContainer.innerHTML = "";

    if (snap.empty) {
      adminNotificationsContainer.innerHTML =
        `<p class="placeholder-text">No hay notificaciones.</p>`;
      return;
    }

    snap.forEach(d => {
      const n = d.data();
      const alertId = d.id;
      const conversationId = n.conversationId || alertId;

      const isInvalidUser = !n.userId || typeof n.userId !== "string";

      const div = document.createElement("div");
      div.className = `pedido-item ${n.status === "read" ? "read" : ""} ${
        isInvalidUser ? "invalid-user" : ""
      }`;

      div.innerHTML = `
        <strong>🧾 Pedido #${n.orderId?.slice(0, 6) || "N/A"}</strong><br>
        👤 ${n.customerName || "Cliente"}<br>
        💲 $${Number(n.total || 0).toFixed(2)}<br>
        <small>${
          n.timestamp?.toDate
            ? new Date(n.timestamp.toDate()).toLocaleString("es-MX")
            : ""
        }</small>

        <div class="admin-replies"></div>

        <textarea class="admin-reply" placeholder="Escribe un mensaje al cliente..." ${isInvalidUser ? "disabled" : ""}></textarea>

        <div class="admin-actions">
          <button class="btn-primary btn-send" ${isInvalidUser ? "disabled title='Usuario inválido'" : ""}>
            📩 Enviar
          </button>
          <button class="btn-danger btn-delete">
            🗑️ Eliminar
          </button>
        </div>

        ${isInvalidUser ? "<small style='color:red;'>⚠️ Usuario inválido</small>" : ""}
      `;

      const replyInput = div.querySelector(".admin-reply");
      const btnSend = div.querySelector(".btn-send");
      const btnDelete = div.querySelector(".btn-delete");
      const repliesBox = div.querySelector(".admin-replies");

      // =========================
      // 💬 ENVIAR MENSAJE
      // =========================
      btnSend.onclick = async () => {
        if (isInvalidUser) return;

        const message = replyInput.value.trim();
        if (!message) {
          showToast("⚠️ Mensaje vacío", "Escribe un mensaje.", "warning");
          return;
        }

        if (!conversationId || typeof conversationId !== "string") {
          showToast("❌ Error", "Conversación inválida", "error");
          return;
        }

        try {
          // Guardar mensaje en chats/{conversationId}/messages
          await sendChatMessage(
            n.userId,
            conversationId,
            "admin",
            message
          );

          // Guardar notificación visual en userNotifications
          await addDoc(
            collection(db, "userNotifications", n.userId, "items"),
            {
              type: "admin_message",
              title: "📩 Mensaje del administrador",
              message,
              conversationId,
              read: false,
              createdAt: serverTimestamp()
            }
          );

          // Marcar alerta admin como leída
          await updateDoc(doc(db, "admin_alerts", alertId), { status: "read" });

          replyInput.value = "";
          showToast("✔️ Enviado", "Mensaje enviado al cliente.", "success");

        } catch (err) {
          console.error("Error enviando mensaje:", err);
          showToast("❌ Error", "No se pudo enviar.", "error");
        }
      };

      // =========================
      // 🔴 ESCUCHAR CHAT COMPLETO
      // =========================
      if (conversationId && typeof conversationId === "string") {
        listenChat(conversationId, messages => {
          if (!repliesBox) return;

          repliesBox.innerHTML = messages.map(m => `
            <div class="reply-message reply-${m.senderRole}">
              <div class="reply-text">${m.text}</div>
              <div class="reply-time">${
                m.timestamp?.toDate
                  ? new Date(m.timestamp.toDate()).toLocaleString("es-MX")
                  : ""
              }</div>
            </div>
          `).join("");

          // Scroll automático
          repliesBox.scrollTop = repliesBox.scrollHeight;
        });
      }

      // =========================
      // 🗑️ ELIMINAR ALERTA
      // =========================
      btnDelete.onclick = async () => {
        if (!confirm("¿Eliminar notificación?")) return;

        try {
          await deleteDoc(doc(db, "admin_alerts", alertId));
          showToast("🗑️ Eliminado", "Notificación eliminada.", "success");
        } catch (err) {
          console.error("Error eliminando notificación:", err);
          showToast("❌ Error", "No se pudo eliminar.", "error");
        }
      };

      adminNotificationsContainer.appendChild(div);
    });
  });
}


// ---------- Variables globales ----------
let pizzaIngredientsDiv = null;
let ingredientsContainer = null;
let addIngredientBtn = null;

// ---------- Inicialización ----------
function initAdminPage() {
  // Asignar DOMs
  adminForm = qs("admin-form");
  itemTypeSelect = qs("item-type");
  pizzaCategoryDiv = qs("pizza-category-div");
  pizzaCategorySelect = qs("item-category-pizza");
  pizzaIngredientsDiv = qs("ingredients-wrapper");
  ingredientsContainer = qs("ingredients-container");
  addIngredientBtn = qs("add-ingredient-btn");
  adminNotificationsContainer = qs("admin-notifications-container");

  imageInput = qs("item-image");
  imagePreview = qs("image-preview");
  imageStatus = qs("image-status");
  submitButton = qs("submit-button");
  cancelButton = qs("cancel-edit-button");
  catalogoTableBody = qs("catalogo-table-body");
  catalogoSearchInput = qs("catalogo-search-input");
  pedidosListContainer = qs("pedidos-list-container");
  pedidosStatusFilter = qs("pedidos-status-filter");
  menuButtons = document.querySelectorAll('.admin-tab-button');
  tabContents = document.querySelectorAll('.tab-content');
  pedidosBulkActions = qs("pedidos-bulk-actions");
  btnDeletePeriod = qs("btn-delete-period");
  btnExportPdf = qs("btn-export-pdf");
  pedidosMesFilter = qs("pedidos-mes-filter");
  pedidosDiaFilter = qs("pedidos-dia-filter");
  pedidosClearBtn = qs("pedidos-clear-filters");

  // ----------------------------
  // Mostrar/ocultar campos según tipo
  // ----------------------------
  const togglePizzaFields = () => {
    if (!itemTypeSelect) return;
    if (itemTypeSelect.value.toLowerCase() === "pizza") {
      if (pizzaCategoryDiv) pizzaCategoryDiv.classList.remove("hidden");
      if (pizzaIngredientsDiv) pizzaIngredientsDiv.classList.remove("hidden");
    } else {
      if (pizzaCategoryDiv) pizzaCategoryDiv.classList.add("hidden");
      if (pizzaIngredientsDiv) pizzaIngredientsDiv.classList.add("hidden");
    }
  };
  togglePizzaFields();
  if (itemTypeSelect) itemTypeSelect.addEventListener("change", togglePizzaFields);

  // ----------------------------
  // Pedidos - filtros
  // ----------------------------
  if (pedidosStatusFilter) pedidosStatusFilter.onchange = e => { currentOrderStatusFilter = e.target.value; applyPedidosFilters(); };
  if (pedidosMesFilter) pedidosMesFilter.onchange = applyPedidosFilters;
  if (pedidosDiaFilter) pedidosDiaFilter.onchange = applyPedidosFilters;
  if (pedidosClearBtn) pedidosClearBtn.onclick = () => {
    if (pedidosStatusFilter) pedidosStatusFilter.value = "todos";
    if (pedidosMesFilter) pedidosMesFilter.value = "";
    if (pedidosDiaFilter) pedidosDiaFilter.value = "";
    currentOrderStatusFilter = "todos";
    applyPedidosFilters();
  };
  if (btnDeletePeriod) btnDeletePeriod.onclick = deletePedidosByPeriod;
  if (btnExportPdf) btnExportPdf.onclick = exportPedidosPDF;

  // ----------------------------
  // Imagen input
  // ----------------------------
  if (imageInput) imageInput.onchange = e => {
    const f = e.target.files[0];
    if (f && imagePreview) {
      const reader = new FileReader();
      reader.onload = ev => { imagePreview.src = ev.target.result; imagePreview.style.display = "block"; };
      reader.readAsDataURL(f);
      if (imageStatus) imageStatus.textContent = `Archivo: ${f.name}`;
    } else {
      if (imagePreview) { imagePreview.src = ""; imagePreview.style.display = "none"; }
      if (imageStatus) imageStatus.textContent = "Sube una imagen para previsualizar.";
    }
  };

  // ----------------------------
  // Tabs
  // ----------------------------
  if (menuButtons) menuButtons.forEach(btn => btn.addEventListener('click', (e) => {
    menuButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabContents.forEach(c => c.classList.add('hidden'));
    const targetTab = document.getElementById(btn.dataset.target);
    if (targetTab) targetTab.classList.remove('hidden');

    if (pedidosBulkActions) pedidosBulkActions.classList.add("hidden");

    if (btn.dataset.target === "tab-catalogo") { loadCatalogoData(); resetForm(); }
    if (btn.dataset.target === "tab-pedidos") { 
      if (pedidosBulkActions) pedidosBulkActions.classList.remove("hidden"); 
      subscribePedidosRealtime(); 
    }
    if (btn.dataset.target === "tab-notificaciones") loadAdminNotifications();
  }));

  if (adminForm) adminForm.onsubmit = handleAdminSubmitUnified;
  if (cancelButton) cancelButton.onclick = resetForm; 
  if (catalogoSearchInput) catalogoSearchInput.oninput = () => loadCatalogoData(catalogoSearchInput.value);

  // ----------------------------
  // Inicializar inputs de ingredientes dinámicos
  // ----------------------------
  initIngredientsInputs();

  if (addIngredientBtn) {
    addIngredientBtn.onclick = () => {
      if (!ingredientsContainer) return;
      ingredientsContainer.appendChild(createIngredientInput());
    };
  }

  // ----------------------------
  // Estado inicial: pestaña Pedidos
  // ----------------------------
  const activeTab = document.querySelector(".admin-tab-button.active");
  if (activeTab?.dataset.target === "tab-pedidos") {
    if (pedidosBulkActions) pedidosBulkActions.classList.remove("hidden");
  }
}

// ---------- Crear input de ingrediente ----------
function createIngredientInput(value = "") {
  const div = document.createElement("div");
  div.className = "ingredient-input-group";
  div.style.display = "flex";
  div.style.gap = "8px";
  div.style.marginBottom = "4px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ej: Salsa de tomate";
  input.value = value;
  input.style.flex = "1";
  input.required = true;

  const btnRemove = document.createElement("button");
  btnRemove.type = "button";
  btnRemove.textContent = "❌";
  btnRemove.onclick = () => div.remove();

  div.appendChild(input);
  div.appendChild(btnRemove);

  return div;
}




function initIngredientsInputs(initialIngredients = []) {
  if (!ingredientsContainer || !addIngredientBtn) return;

  ingredientsContainer.innerHTML = "";

  initialIngredients.forEach(ing => addIngredientInput(ing));

  addIngredientBtn.onclick = () => addIngredientInput();
}



function addIngredientInput(value = "") {
  if (!ingredientsContainer) return;

  const wrapper = document.createElement("div");
  wrapper.className = "ingredient-input-wrapper";
  wrapper.style.marginBottom = "4px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Escribe el ingrediente";
  input.value = value;
  input.style.width = "80%";
  input.style.padding = "6px";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "❌";
  removeBtn.style.marginLeft = "6px";
  removeBtn.onclick = () => wrapper.remove();

  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);
  ingredientsContainer.appendChild(wrapper);
}


  if (itemTypeSelect) itemTypeSelect.onchange = () => {
    if (itemTypeSelect.value === "pizza") pizzaCategoryDiv.classList.remove("hidden");
    else pizzaCategoryDiv.classList.add("hidden");
  };
  if (pedidosStatusFilter) pedidosStatusFilter.onchange = e => {
    currentOrderStatusFilter = e.target.value;
    // reenlazar snapshot con nuevo filtro
    subscribePedidosRealtime();
  };

  const defaultTab = document.querySelector('.admin-tab-button.active') || document.querySelector('.admin-tab-button[data-target="tab-pedidos"]');
  if (defaultTab) defaultTab.click();

  initAuthAndHeader(() => {
    // auth inicial listo
    // cargamos catálogos básicos
    loadCatalogoData();
    subscribePedidosRealtime();
  });

document.addEventListener("DOMContentLoaded", initAdminPage);
window.renderCatalogoTable = renderCatalogoTable;