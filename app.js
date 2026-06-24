const API_URL = 'http://localhost:5000/api';

// State
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role') || 'ROLE_USER';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let products = [];
let isLoginMode = true;

// DOM Elements
const navProducts = document.getElementById('nav-products');
const navCart = document.getElementById('nav-cart');
const navOrders = document.getElementById('nav-orders');
const navAdmin = document.getElementById('nav-admin');
const navLogin = document.getElementById('nav-login');
const navLogout = document.getElementById('nav-logout');
const cartCount = document.getElementById('cart-count');

const sectionProducts = document.getElementById('section-products');
const sectionCart = document.getElementById('section-cart');
const sectionOrders = document.getElementById('section-orders');
const sectionAdmin = document.getElementById('section-admin');

const productsGrid = document.getElementById('products-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const btnCheckout = document.getElementById('btn-checkout');
const checkoutMsg = document.getElementById('checkout-msg');

const ordersList = document.getElementById('orders-list');

// Admin Elements
const tabSingleProduct = document.getElementById('tab-single-product');
const tabBulkProduct = document.getElementById('tab-bulk-product');
const adminSingleForm = document.getElementById('admin-single-form');
const adminBulkForm = document.getElementById('admin-bulk-form');
const adminMsg = document.getElementById('admin-msg');

// Auth Modal Elements
const authModal = document.getElementById('auth-modal');
const closeBtn = document.querySelector('.close-btn');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const groupName = document.getElementById('group-name');
const authName = document.getElementById('auth-name');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');

// Init
function init() {
    updateNav();
    updateCartCount();
    fetchProducts();
    setupEventListeners();
}

function updateNav() {
    if (token) {
        navLogin.classList.add('hidden');
        navLogout.classList.remove('hidden');
        navOrders.classList.remove('hidden');
        checkoutMsg.classList.add('hidden');
        if (userRole === 'ROLE_ADMIN') {
            navAdmin.classList.remove('hidden');
        } else {
            navAdmin.classList.add('hidden');
        }
        if (cart.length > 0) btnCheckout.disabled = false;
    } else {
        navLogin.classList.remove('hidden');
        navLogout.classList.add('hidden');
        navOrders.classList.add('hidden');
        navAdmin.classList.add('hidden');
        checkoutMsg.classList.remove('hidden');
        btnCheckout.disabled = true;
    }
}

function showSection(section) {
    sectionProducts.classList.add('hidden');
    sectionCart.classList.add('hidden');
    sectionOrders.classList.add('hidden');
    sectionAdmin.classList.add('hidden');

    navProducts.classList.remove('active');
    navCart.classList.remove('active');
    navOrders.classList.remove('active');
    navAdmin.classList.remove('active');

    if (section === 'products') {
        sectionProducts.classList.remove('hidden');
        navProducts.classList.add('active');
    } else if (section === 'cart') {
        sectionCart.classList.remove('hidden');
        navCart.classList.add('active');
        renderCart();
    } else if (section === 'orders') {
        sectionOrders.classList.remove('hidden');
        navOrders.classList.add('active');
        fetchOrders();
    } else if (section === 'admin') {
        sectionAdmin.classList.remove('hidden');
        navAdmin.classList.add('active');
    }
}

// Event Listeners
function setupEventListeners() {
    navProducts.addEventListener('click', () => showSection('products'));
    navCart.addEventListener('click', () => showSection('cart'));
    navOrders.addEventListener('click', () => showSection('orders'));
    navAdmin.addEventListener('click', () => showSection('admin'));

    navLogin.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        setLoginMode(true);
    });

    closeBtn.addEventListener('click', () => authModal.classList.add('hidden'));

    navLogout.addEventListener('click', () => {
        token = null;
        userRole = 'ROLE_USER';
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        updateNav();
        showSection('products');
    });

    tabLogin.addEventListener('click', () => setLoginMode(true));
    tabSignup.addEventListener('click', () => setLoginMode(false));

    authForm.addEventListener('submit', handleAuth);
    btnCheckout.addEventListener('click', handleCheckout);

    // Admin events
    tabSingleProduct.addEventListener('click', () => {
        tabSingleProduct.classList.add('active');
        tabBulkProduct.classList.remove('active');
        adminSingleForm.classList.remove('hidden');
        adminBulkForm.classList.add('hidden');
        adminMsg.className = 'mt-3';
        adminMsg.textContent = '';
    });
    tabBulkProduct.addEventListener('click', () => {
        tabBulkProduct.classList.add('active');
        tabSingleProduct.classList.remove('active');
        adminBulkForm.classList.remove('hidden');
        adminSingleForm.classList.add('hidden');
        adminMsg.className = 'mt-3';
        adminMsg.textContent = '';
    });

    adminSingleForm.addEventListener('submit', handleAddSingleProduct);
    adminBulkForm.addEventListener('submit', handleAddBulkProducts);
}

function setLoginMode(isLogin) {
    isLoginMode = isLogin;
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');
    if (isLogin) {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        groupName.classList.add('hidden');
        authName.required = false;
        btnAuthSubmit.textContent = 'Login';
    } else {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        groupName.classList.remove('hidden');
        authName.required = true;
        btnAuthSubmit.textContent = 'Sign Up';
    }
}

// API Calls
async function fetchProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        products = await res.json();
        renderProducts();
    } catch (e) {
        console.error("Failed to fetch products", e);
    }
}

async function handleAuth(e) {
    e.preventDefault();
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');

    const email = authEmail.value;
    const password = authPassword.value;

    try {
        if (isLoginMode) {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                token = data.token;
                userRole = data.role;
                localStorage.setItem('token', token);
                localStorage.setItem('role', userRole);
                authModal.classList.add('hidden');
                updateNav();
                authForm.reset();
            } else {
                throw new Error(data.message || data.error || 'Login failed');
            }
        } else {
            const name = authName.value;
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (res.ok) {
                authSuccess.textContent = "Registration successful! Please login.";
                authSuccess.classList.remove('hidden');
                setLoginMode(true);
            } else {
                let errorMsg = 'Registration failed';
                try {
                    const data = await res.json();
                    errorMsg = data.message || data.error || errorMsg;
                } catch (textErr) {
                    errorMsg = await res.text();
                }
                throw new Error(errorMsg);
            }
        }
    } catch (err) {
        authError.textContent = err.message;
        authError.classList.remove('hidden');
    }
}

async function handleCheckout() {
    if (!token || cart.length === 0) return;

    // Convert cart to order request format
    const orderRequests = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
    }));

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderRequests)
        });

        if (res.ok) {
            alert('Order placed successfully!');
            cart = [];
            saveCart();
            renderCart();
            updateCartCount();
            showSection('orders');
            fetchProducts(); // Refresh stock
        } else {
            const data = await res.json();
            throw new Error(data.message || 'Checkout failed');
        }
    } catch (e) {
        alert(e.message);
    }
}

async function fetchOrders() {
    if (!token) return;
    try {
        ordersList.innerHTML = '<p>Loading orders...</p>';
        const res = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        renderOrders(data);
    } catch (e) {
        ordersList.innerHTML = '<p class="text-error">Failed to load orders.</p>';
    }
}

async function handleAddSingleProduct(e) {
    e.preventDefault();
    if (!token || userRole !== 'ROLE_ADMIN') return;

    const productRequest = {
        name: document.getElementById('admin-p-name').value,
        description: document.getElementById('admin-p-desc').value,
        price: parseFloat(document.getElementById('admin-p-price').value),
        stockQuantity: parseInt(document.getElementById('admin-p-stock').value)
    };

    try {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productRequest)
        });

        if (res.ok) {
            adminMsg.textContent = "Product added successfully!";
            adminMsg.className = "text-success mt-3";
            adminSingleForm.reset();
            fetchProducts();
        } else {
            throw new Error("Failed to add product");
        }
    } catch (err) {
        adminMsg.textContent = err.message;
        adminMsg.className = "text-error mt-3";
    }
}

async function handleAddBulkProducts(e) {
    e.preventDefault();
    if (!token || userRole !== 'ROLE_ADMIN') return;

    let productRequests;
    try {
        productRequests = JSON.parse(document.getElementById('admin-p-json').value);
        if (!Array.isArray(productRequests)) throw new Error("JSON must be an array");
    } catch (parseErr) {
        adminMsg.textContent = "Invalid JSON format: " + parseErr.message;
        adminMsg.className = "text-error mt-3";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productRequests)
        });

        if (res.ok) {
            adminMsg.textContent = `${productRequests.length} products added successfully!`;
            adminMsg.className = "text-success mt-3";
            adminBulkForm.reset();
            fetchProducts();
        } else {
            throw new Error("Failed to bulk add products");
        }
    } catch (err) {
        adminMsg.textContent = err.message;
        adminMsg.className = "text-error mt-3";
    }
}

// Rendering
function renderProducts() {
    productsGrid.innerHTML = '';
    if (products.length === 0) {
        productsGrid.innerHTML = '<p>No products available yet.</p>';
        return;
    }

    const getSvgIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('mobile') || lowerName.includes('phone')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
        } else if (lowerName.includes('plane') || lowerName.includes('flight')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.4 3.1c-.2.4 0 .9.4 1.1L8 14l-3.5 3.5-2.2-.6c-.5-.1-.9.2-1.1.7l-.5 1.2c-.2.4 0 .9.4 1.1l3.8 2.2 2.2 3.8c.2.4.7.6 1.1.4l1.2-.5c.5-.2.8-.7.7-1.1l-.6-2.2L14 16l2.9 5.3c.2.4.7.6 1.1.4l3.1-1.4c.5-.2.8-.6.7-1.1z"></path></svg>`;
        } else if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('mac')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>`;
        } else if (lowerName.includes('map') || lowerName.includes('location')) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
        }
        // Default icon (Shopping Bag)
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
    };

    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="card-title">${p.name}</div>
                <div>${getSvgIcon(p.name)}</div>
            </div>
            <div class="card-desc">${p.description || ''}</div>
            <div class="card-stock">Stock: ${p.stockQuantity}</div>
            <div class="card-price">Rs.${p.price.toFixed(2)}</div>
            <button class="btn btn-primary mt-2" onclick="addToCart(${p.id})" ${p.stockQuantity === 0 ? 'disabled' : ''}>
                ${p.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        `;
        productsGrid.appendChild(div);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
        if (existing.quantity < product.stockQuantity) {
            existing.quantity++;
        } else {
            alert("Not enough stock available!");
            return;
        }
    } else {
        cart.push({ product, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    alert(`Added ${product.name} to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    saveCart();
    renderCart();
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalEl.textContent = 'Rs. 0.00';
        btnCheckout.disabled = true;
        return;
    }

    if (token) btnCheckout.disabled = false;

    cart.forEach(item => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                ${item.product.name} (x${item.quantity})
            </div>
            <div class="cart-item-actions">
                <span>Rs. ${itemTotal.toFixed(2)}</span>
                <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="removeFromCart(${item.product.id})">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

function renderOrders(orgData) {
    ordersList.innerHTML = '';
    if (orgData.length === 0) {
        ordersList.innerHTML = '<p>You have no past orders.</p>';
        return;
    }

    // Sort by latest
    const sorted = orgData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    sorted.forEach(order => {
        const date = new Date(order.orderDate).toLocaleString();

        const div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = `
            <div class="order-header">
                <span>Order #${order.id} - ${date}</span>
                <span class="text-primary">Rs. ${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div>&bull; ${item.product.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toFixed(2)}</div>
                `).join('')}
            </div>
        `;
        ordersList.appendChild(div);
    });
}

// Start
init();
