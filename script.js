document.addEventListener("DOMContentLoaded", () => {
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once element is visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initial load animation trigger
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(element => {
            observer.observe(element);
        });
    }, 100);

    // Initialize cart count from localStorage
    initCart();
});

// Cart and Toast Storage
let cartCount = 0;

function updateCartBadges() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = cartCount;
        // Animation
        badge.classList.add('pop');
        setTimeout(() => badge.classList.remove('pop'), 300);
    });
}

function addToCart(productName) {
    cartCount++;
    localStorage.setItem('cartCount', cartCount);
    updateCartBadges();
    showToast(`${productName} added to cart!`);
}

function initCart() {
    const savedCount = localStorage.getItem('cartCount');
    if (savedCount) {
        cartCount = parseInt(savedCount, 10);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = cartCount;
        });
    }
}

function createToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message) {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"></path>
            </svg>
        </div>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger transition
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for transition out
    }, 3000);
}

// Function to handle changing product image via color swatches
function changeProductImage(element, imgId, newSrc) {
    // Update the image source
    const imgElement = document.getElementById(imgId);
    if (imgElement) {
        // Simple fade effect
        imgElement.style.opacity = '0.5';
        setTimeout(() => {
            imgElement.src = newSrc;
            imgElement.style.opacity = '1';
        }, 150);
    }

    // Update the active state on the swatches
    const swatches = element.parentElement.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => swatch.classList.remove('active'));
    element.classList.add('active');
}
