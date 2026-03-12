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

    // Initialize auth status on page load
    checkAuthStatus();
    
    // Initialize cart count and render cart page from localStorage
    initCart();
});

// Authentication Logic
function mockLogin(event) {
    if (event) event.preventDefault();
    
    // Simulate setting auth tokens/details
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'Jane Doe');
    localStorage.setItem('userEmail', 'jane@example.com');
    
    // Redirect cleanly
    window.location.href = 'index.html';
}

function mockSignup(event) {
    if (event) event.preventDefault();
    
    // Capture user details if available
    const fNameInput = document.getElementById('fname');
    const lNameInput = document.getElementById('lname');
    const emailInput = document.getElementById('email');
    
    const fullName = (fNameInput && lNameInput) 
        ? `${fNameInput.value} ${lNameInput.value}` 
        : 'Jane Doe';
    const email = emailInput ? emailInput.value : 'jane@example.com';
    
    // Simulate setting auth tokens/details
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userEmail', email);

    // Redirect cleanly
    window.location.href = 'index.html';
}

function mockLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Reset cart if desired, or keep it. We'll keep it for now.
    
    window.location.href = 'index.html';
}

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const navLinks = document.querySelectorAll('.nav-links');
    
    // Update the nav menus across all pages
    navLinks.forEach(ul => {
        // Find the login link list item
        const listItems = ul.querySelectorAll('li');
        listItems.forEach(li => {
            const a = li.querySelector('a');
            if (a && (a.getAttribute('href') === 'login.html' || a.getAttribute('href') === 'profile.html')) {
                if (isLoggedIn) {
                    a.setAttribute('href', 'profile.html');
                    // Check if current page is profile to keep it active
                    const isActive = window.location.pathname.includes('profile.html') ? 'active' : '';
                    a.setAttribute('aria-label', 'Profile');
                    a.style.display = 'flex';
                    a.style.alignItems = 'center';
                    a.innerHTML = `
                        <div class="${isActive}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                    `;
                } else {
                    a.setAttribute('href', 'login.html');
                    const isActive = window.location.pathname.includes('login.html') ? 'active' : '';
                    a.textContent = 'Login';
                    a.className = isActive;
                }
            }
        });
    });
}

// Cart state - array of objects
let cartItems = [];
let appliedCoupon = null;
let discountAmount = 0;

const VALID_COUPONS = {
    'CHERRY10': 0.10, // 10% off
    'WELCOME20': 0.20 // 20% off
};

// Calculate total items (sum of quantities)
function getCartCount() {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
}

function updateCartBadges() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = getCartCount();
    badges.forEach(badge => {
        badge.textContent = count;
        // Animation
        badge.classList.add('pop');
        setTimeout(() => badge.classList.remove('pop'), 300);
    });
}

function addToCart(id, name, price, image) {
    // Check if item exists in cart
    const existingItem = cartItems.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    // Save to local storage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartBadges();
    showToast(`${name} added to cart!`);
}

function initCart() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
        try {
            cartItems = JSON.parse(savedCart);
        } catch (e) {
            cartItems = [];
        }
    }
    
    updateCartBadges();
    
    // If we are on the cart page, render the items
    if (window.location.pathname.includes('cart.html')) {
        renderCartPage();
    }
}

// Cart Page Methods
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (cartItems.length === 0) {
        appliedCoupon = null; // reset coupon
        container.innerHTML = `
            <div class="empty-cart-message">
                <h3>Your cart is beautifully empty!</h3>
                <p>Looks like you haven't added any elegant gifts yet.</p>
                <br>
                <a href="products.html" class="btn-primary">Browse Collections</a>
            </div>
        `;
        updateCartTotals();
        return;
    }

    let html = '';
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='images/gift_boxes_cherry.png'">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <div class="cart-item-price">LKR ${item.price.toLocaleString()}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">−</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')" aria-label="Remove item">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    updateCartTotals();
}

function updateQuantity(id, change) {
    const itemIndex = cartItems.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        cartItems[itemIndex].quantity += change;
        
        // Remove item if quantity falls to 0
        if (cartItems[itemIndex].quantity <= 0) {
            cartItems.splice(itemIndex, 1);
        }
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartBadges();
        renderCartPage();
    }
}

function removeFromCart(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartBadges();
    renderCartPage();
}

function updateCartTotals() {
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    let total = subtotal;
    
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('summary-discount');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    
    if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
        discountAmount = subtotal * VALID_COUPONS[appliedCoupon];
        total = subtotal - discountAmount;
        
        if (discountRow && discountEl) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-LKR ${discountAmount.toLocaleString()}`;
        }
    } else {
        discountAmount = 0;
        if (discountRow) {
            discountRow.style.display = 'none';
        }
    }

    if (subtotalEl && totalEl) {
        subtotalEl.textContent = `LKR ${subtotal.toLocaleString()}`;
        totalEl.textContent = `LKR ${total.toLocaleString()}`;
    }
}

function applyCoupon() {
    const codeInput = document.getElementById('coupon-code');
    const messageEl = document.getElementById('coupon-message');
    if (!codeInput || !messageEl) return;
    
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
        messageEl.textContent = 'Please enter a coupon code.';
        messageEl.className = 'coupon-message error';
        return;
    }

    if (VALID_COUPONS[code]) {
        appliedCoupon = code;
        messageEl.textContent = `${code} applied successfully!`;
        messageEl.className = 'coupon-message success';
        updateCartTotals();
    } else {
        messageEl.textContent = 'Invalid or expired coupon code.';
        messageEl.className = 'coupon-message error';
        appliedCoupon = null;
        updateCartTotals();
    }
}

function checkout() {
    if (cartItems.length === 0) {
        alert("Your cart is empty! Add some elegant products before checking out.");
        return;
    }
    
    // Formatting a beautiful WhatsApp message
    let message = "🌸 *New Order from Cherry Petals* 🌸\n\n";
    let total = 0;
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `• ${item.name}\n  Qty: ${item.quantity}  |  LKR ${itemTotal.toLocaleString()}\n`;
    });
    
    if (appliedCoupon) {
        const discount = total * VALID_COUPONS[appliedCoupon];
        const finalTotal = total - discount;
        message += `\n*Subtotal: LKR ${total.toLocaleString()}*`;
        message += `\n*Discount (${appliedCoupon}): -LKR ${discount.toLocaleString()}*`;
        message += `\n*Final Total: LKR ${finalTotal.toLocaleString()}*`;
    } else {
        message += `\n*Order Total: LKR ${total.toLocaleString()}*`;
    }
    
    message += "\n\nI would like to proceed with checking out.";
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/94761359661?text=${encodedMessage}`, '_blank');
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
