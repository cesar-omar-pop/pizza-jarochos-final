// js/resenas.js (Lógica específica para reseñas.html)

import { 
    initAuthAndHeader, 
    db, 
    auth,
    showToast 
} from "./common.js"; 
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// --- Referencias de la Interfaz ---
const reviewsContainer = document.getElementById('reviews-container');
const reviewForm = document.getElementById('review-form');
const ratingStars = document.getElementById('rating-stars');
const ratingValueInput = document.getElementById('rating-value');
const reviewFormSection = document.getElementById('review-form-section');

let userIsAuthenticated = false;

// -----------------------------------------------------------
// --- LÓGICA DE FIREBASE (CARGAR/GUARDAR) ---
// -----------------------------------------------------------

// Función para cargar las reseñas existentes
async function loadReviews() {
    if (!reviewsContainer) return;

    reviewsContainer.innerHTML = '<p class="loading-message">Cargando reseñas...</p>';
    
    try {
        const reviewsCol = collection(db, 'reviews'); // Colección 'reviews' en Firestore
        // Consulta para obtener las últimas 20 reseñas, ordenadas por fecha descendente
        const q = query(reviewsCol, orderBy('timestamp', 'desc'), limit(20));
        const reviewSnapshot = await getDocs(q);
        
        const reviews = reviewSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderReviews(reviews);
    } catch (error) {
        console.error("Error al cargar las reseñas:", error);
        reviewsContainer.innerHTML = '<p class="error-message">Error al cargar las reseñas. Inténtalo de nuevo más tarde.</p>';
        showToast('Error', 'No se pudieron cargar las reseñas.', 'error');
    }
}

// Función para enviar una nueva reseña a Firestore
async function submitReview(rating, comment) {
    if (!auth.currentUser) {
        showToast('Error', 'Debes iniciar sesión para dejar una reseña.', 'error');
        return;
    }
    
    const reviewData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.email.split('@')[0], // Nombre del usuario
        rating: rating,
        comment: comment,
        timestamp: serverTimestamp() // Usa el timestamp del servidor de Firebase
    };
    
    try {
        const reviewsCol = collection(db, 'reviews');
        await addDoc(reviewsCol, reviewData);
        
        showToast('¡Gracias!', 'Tu reseña ha sido enviada exitosamente.', 'success');
        
        // Limpiar formulario y recargar reseñas
        reviewForm.reset();
        resetRatingStars();
        loadReviews();

    } catch (error) {
        console.error("Error al enviar la reseña:", error);
        showToast('Error', 'No se pudo enviar la reseña. Inténtalo de nuevo.', 'error');
    }
}

// -----------------------------------------------------------
// --- RENDERIZADO Y UI ---
// -----------------------------------------------------------

// Función para renderizar las estrellas de calificación
function renderStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="star-display material-icons ${i <= rating ? 'filled' : 'empty'}">${i <= rating ? 'star' : 'star_border'}</span>`;
    }
    return starsHtml;
}

// Función para renderizar todas las reseñas
function renderReviews(reviews) {
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p class="empty-message">Aún no hay reseñas. ¡Sé el primero en dejar una!</p>';
        return;
    }

    const reviewsHtml = reviews.map(review => {
        // Formato de fecha para el usuario
        const date = review.timestamp ? review.timestamp.toDate().toLocaleDateString('es-MX') : 'Fecha desconocida';
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <span class="reviewer-name">@${review.userName}</span>
                    <div class="review-rating">${renderStars(review.rating)}</div>
                </div>
                <p class="review-comment">${review.comment}</p>
                <span class="review-date">${date}</span>
            </div>
        `;
    }).join('');

    reviewsContainer.innerHTML = reviewsHtml;
}

// Lógica para el control de estrellas en el formulario
function updateRatingStars(rating) {
    const stars = ratingStars.querySelectorAll('.star');
    ratingValueInput.value = rating;
    ratingStars.dataset.currentRating = rating;

    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        star.textContent = starValue <= rating ? 'star' : 'star_border';
        star.classList.toggle('selected', starValue <= rating);
    });
}

function resetRatingStars() {
    updateRatingStars(5); // Valor por defecto
}


// -----------------------------------------------------------
// --- MANEJADORES DE EVENTOS ---
// -----------------------------------------------------------

function handleReviewFormSubmit(e) {
    e.preventDefault();
    const rating = parseInt(ratingValueInput.value);
    const comment = document.getElementById('comment-text').value.trim();

    if (rating >= 1 && comment.length > 0) {
        submitReview(rating, comment);
    } else {
        showToast('Atención', 'Por favor, selecciona una calificación y escribe un comentario.', 'warning');
    }
}

function handleRatingStarsClick(e) {
    const star = e.target.closest('.star');
    if (star) {
        const rating = parseInt(star.dataset.value);
        updateRatingStars(rating);
    }
}

// -----------------------------------------------------------
// --- INICIALIZACIÓN ---
// -----------------------------------------------------------

function initResenasPage() {
    
    // Configura la visibilidad del formulario según el estado de autenticación
    initAuthAndHeader((user) => {
        userIsAuthenticated = !!user;
        if (reviewFormSection) {
            reviewFormSection.style.display = user ? 'block' : 'none';
        }
    });

    // Cargar las reseñas sin esperar la autenticación (para que todos las vean)
    loadReviews();

    // Event Listeners
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewFormSubmit);
    }
    if (ratingStars) {
        ratingStars.addEventListener('click', handleRatingStarsClick);
    }
    
    // Inicializar el estado de las estrellas
    resetRatingStars();
}

document.addEventListener('DOMContentLoaded', initResenasPage);