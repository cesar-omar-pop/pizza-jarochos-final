// js/cart-manager.js (LÓGICA CENTRAL DEL CARRITO - CORREGIDA)

// --- MATRIZ DE DATOS DE PRODUCTOS (Simulando data de Admin/DB) ---
export const productsData = [
    { id: 'PZ-01', name: 'Pizza Cuatro Quesos', price: 24.50, category: 'clasicas', type: 'pizza', img: 'pizza_4quesos.jpg', description: 'Con la mezcla perfecta de quesos italianos.' },
    { id: 'PZ-02', name: 'Pizza Jarocha Especial', price: 32.00, category: 'especiales', type: 'pizza', img: 'pizza_jarocha.jpg', description: 'Nuestra especialidad con mariscos y un toque picante.' },
    { id: 'PZ-03', name: 'Pizza Vegetariana', price: 28.00, category: 'vegetarianas', type: 'pizza', img: 'pizza_vegetariana.jpg', description: 'Opción saludable con vegetales frescos de temporada.' },
    { id: 'CB-01', name: 'Combo Familiar Grande', price: 399.00, category: 'combos', type: 'combo', description: '1 Pizza Grande + Refresco 2L + Postre a elegir.', img: 'combo_familiar.jpg' },
    { id: 'CB-02', name: 'Combo Pareja Perfecta', price: 249.00, category: 'combos', type: 'combo', description: '1 Pizza Mediana + 2 Bebidas.', img: 'combo_pareja.jpg' },
];

// --- FUNCIONES INTERNAS Y UTILITARIAS DE ACCESO AL LOCAL STORAGE ---
const CART_STORAGE_KEY = 'pizzaCart'; 

// Getter local
const getCartLocal = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

// Setter y Notificador: Guarda en LocalStorage y dispara un evento global
const updateLocalStorageAndNotify = (newCart) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated')); 
};
const getProductById = (id) => productsData.find(p => p.id === id); 

// ----------------------------------------------------------------
// --- FUNCIONES EXPORTADAS PARA MANIPULACIÓN DEL CARRITO ---
// ----------------------------------------------------------------

/**
 * Agrega o actualiza un ítem en el carrito.
 */
export const addToCart = (productId, quantity = 1) => { // <<< EXPORTADO
    let currentCart = getCartLocal(); 
    const product = getProductById(productId);

    if (!product) {
        console.error(`Producto con ID ${productId} no encontrado.`);
        return;
    }

    const existingItemIndex = currentCart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        currentCart[existingItemIndex].quantity += quantity;
        
        if (currentCart[existingItemIndex].quantity <= 0) {
            currentCart.splice(existingItemIndex, 1);
        }
    } else if (quantity > 0) {
        currentCart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: quantity,
            img: product.img
        });
    }

    updateLocalStorageAndNotify(currentCart);
};

/**
 * Remueve completamente un ítem del carrito.
 */
export const removeItem = (productId) => { // <<< EXPORTADO
    let currentCart = getCartLocal();
    const newCart = currentCart.filter(item => item.id !== productId);
    
    if (newCart.length !== currentCart.length) {
        updateLocalStorageAndNotify(newCart);
    }
};

/**
 * Vacía completamente el carrito.
 */
export const clearCart = () => { // <<< EXPORTADO
    updateLocalStorageAndNotify([]);
};

// EXPORTAMOS EL GETTER/SETTER para que common.js lo pueda usar
export const getCart = getCartLocal; 
export const saveCart = updateLocalStorageAndNotify;