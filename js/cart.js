// Cart Management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize cart
function initializeCart() {
    displayCartItems();
    updateCartSummary();
    updateCartCount();
}

// Update cart count in navbar
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

// Display cart items
function displayCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message" id="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <a href="menu.html" class="btn view-menu-btn">View Menu</a>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'images/meal1.jpg'}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="price">KES ${item.price.toFixed(2)}</p>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeItem('${item.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Update quantity
function updateQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += change;
    
    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveCart();
    displayCartItems();
    updateCartSummary();
    updateCartCount();
}

// Remove item
function removeItem(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    displayCartItems();
    updateCartSummary();
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDelivery = document.querySelector('input[name="orderType"]:checked').value === 'delivery';
    const deliveryFee = isDelivery ? 100 : 0; // KES 100 delivery fee
    const total = subtotal + deliveryFee;

    document.getElementById('subtotal').textContent = `KES ${subtotal.toFixed(2)}`;
    document.getElementById('delivery-fee').textContent = `KES ${deliveryFee.toFixed(2)}`;
    document.getElementById('total').textContent = `KES ${total.toFixed(2)}`;

    // Show/hide delivery fee container based on order type
    const deliveryFeeContainer = document.querySelector('.delivery-fee-container');
    deliveryFeeContainer.style.display = isDelivery ? 'flex' : 'none';
}

// Show Notification Function
function showPopup(message, type = 'success') {
    const container = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => {
            container.removeChild(notification);
        }, 500);
    }, 3000);
}

// M-Pesa Payment Process
function handleMpesaPayment(phoneNumber, total, orderId) {
    // Show processing overlay
    const processingOverlay = document.querySelector('.payment-processing');
    processingOverlay.style.display = 'flex';

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showPopup('Please login to place an order', 'error');
        return;
    }

    // Generate order ID if not provided
    if (!orderId) {
        orderId = 'ORD' + Date.now();
    }

    // Create order object
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: cart,
        total: total,
        status: 'pending',
        paymentStatus: 'Pending',
        phoneNumber: phoneNumber,
        customerPhone: currentUser.phone,
        customerName: currentUser.name || 'Guest',
        orderType: document.querySelector('input[name="orderType"]:checked')?.value || 'delivery',
        paymentMethod: 'mpesa'
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    localStorage.removeItem('cart');
    cart = [];

    // Hide processing overlay
    processingOverlay.style.display = 'none';

    // Show success message
    handleMpesaSuccess(orderId);

    // Redirect to order confirmation page
    window.location.href = `order-confirmation.html?orderId=${orderId}`;
}

// Cash Payment Process
function handleCashPayment() {
    console.log('Starting cash payment process...');
    if (cart.length === 0) {
        showPopup('Your cart is empty!', 'error');
        return;
    }

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    console.log('Current user:', currentUser);
    if (!currentUser) {
        showPopup('Please login to place an order', 'error');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDelivery = document.querySelector('input[name="orderType"]:checked').value === 'delivery';
    const deliveryFee = isDelivery ? 100 : 0;
    const total = subtotal + deliveryFee;

    console.log('Order details:', {
        subtotal,
        isDelivery,
        deliveryFee,
        total
    });

    const confirmPayment = confirm(`Total amount to pay: KES ${total.toFixed(2)}\nOrder Type: ${isDelivery ? 'Delivery' : 'In-house'}\n\nProceed with cash payment?`);
    if (!confirmPayment) return;

    // Process cash payment immediately
    const orderId = generateOrderId();
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: cart,
        total: total,
        status: 'pending',
        paymentStatus: 'Pending',
        paymentMethod: 'cash',
        phoneNumber: currentUser.phone,
        customerPhone: currentUser.phone,
        customerName: currentUser.name || 'Guest',
        orderType: isDelivery ? 'delivery' : 'in-house',
        timestamp: new Date().toISOString()
    };

    console.log('Saving order:', order);

    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    console.log('Order saved to localStorage');

    // Clear cart
    localStorage.removeItem('cart');
    cart = [];

    // Show success message
    handleCashSuccess(orderId);

    // Redirect to order confirmation page
    window.location.href = `order-confirmation.html?orderId=${orderId}`;
}

function generateOrderId() {
    return 'ORD' + Date.now().toString().slice(-6);
}

// Update success messages
function handleMpesaSuccess(orderId) {
    showPopup(`Payment successful! Your order ID is ${orderId}. You will receive an M-Pesa confirmation message shortly.`, 'success');
}

function handleCashSuccess(orderId) {
    showPopup(`Order placed successfully! Your order ID is ${orderId}. Please proceed to the counter to make your payment.`, 'success');
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCart();
    
    // Add event listeners for order type selection
    const orderTypeInputs = document.querySelectorAll('input[name="orderType"]');
    orderTypeInputs.forEach(input => {
        input.addEventListener('change', updateCartSummary);
    });

    // Add event listeners for payment buttons
    const mpesaBtn = document.querySelector('.mpesa-btn');
    const cashBtn = document.querySelector('.cash-btn');
    
    if (mpesaBtn) {
        mpesaBtn.addEventListener('click', handleMpesaPayment);
    }
    
    if (cashBtn) {
        cashBtn.addEventListener('click', handleCashPayment);
    }
});

// Create notification element
const cartNotification = document.createElement('div');
cartNotification.className = 'cart-notification';
cartNotification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <p>Item added to cart</p>
`;
document.body.appendChild(cartNotification);

// Function to show notification
function showCartNotification() {
    cartNotification.classList.add('show');
    setTimeout(() => {
        cartNotification.classList.remove('show');
    }, 3000);
}

// Update addToCart function to show notification
function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCartNotification();
}

// Handle payment method selection
function handlePaymentMethod(method) {
    console.log('Payment method selected:', method);
    const mpesaForm = document.querySelector('.mpesa-payment-form');
    const paymentOptions = document.querySelector('.payment-options');
    
    if (method === 'mpesa') {
        paymentOptions.style.display = 'none';
        mpesaForm.style.display = 'block';
    } else if (method === 'cash') {
        // Handle cash payment
        processCashPayment();
    }
}

// Calculate total amount including delivery fee
function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDelivery = document.querySelector('input[name="orderType"]:checked')?.value === 'delivery';
    const deliveryFee = isDelivery ? 100 : 0;
    return subtotal + deliveryFee;
}

// Get cart items
function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Process M-Pesa payment
async function processMpesaPayment() {
    console.log('Starting M-Pesa payment process...');
    try {
        // Get cart total
        const total = calculateTotal();
        console.log('Total amount:', total);
        
        // Generate order ID
        const orderId = 'ORD' + Date.now();
        console.log('Order ID:', orderId);
        
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Current user:', currentUser);
        if (!currentUser) {
            showPopup('Please login to place an order', 'error');
            return;
        }
        
        // Save order details
        const order = {
            id: orderId,
            items: getCartItems(),
            total: total,
            paymentMethod: 'mpesa',
            status: 'pending',
            paymentStatus: 'Pending',
            phoneNumber: currentUser.phone,
            customerPhone: currentUser.phone,
            customerName: currentUser.name || 'Guest',
            orderType: document.querySelector('input[name="orderType"]:checked')?.value || 'delivery',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        
        console.log('Saving order:', order);
        
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Order saved to localStorage');
        
        // Process payment
        console.log('Initiating M-Pesa payment...');
        await handleMpesaPayment(currentUser.phone, total, orderId);
        
        // Clear cart after successful payment
        localStorage.removeItem('cart');
        window.location.href = 'order-confirmation.html';
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Payment failed. Please try again.', 'error');
    }
}

// Process cash payment
function processCashPayment() {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showPopup('Please login to place an order', 'error');
        return;
    }

    // Handle cash payment logic
    const total = calculateTotal();
    const orderId = 'ORD' + Date.now();
    const isDelivery = document.querySelector('input[name="orderType"]:checked')?.value === 'delivery';
    
    // Save order details
    const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: getCartItems(),
        total: total,
        status: 'pending',
        paymentStatus: 'Pending',
        paymentMethod: 'cash',
        phoneNumber: currentUser.phone,
        customerPhone: currentUser.phone,
        customerName: currentUser.name || 'Guest',
        orderType: isDelivery ? 'delivery' : 'in-house',
        timestamp: new Date().toISOString()
    };
    
    console.log('Saving cash order:', order);
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    localStorage.removeItem('cart');
    
    // Show success message
    showPopup(`Order placed successfully! Your order ID is ${orderId}. Please proceed to the counter to make your payment.`, 'success');
    
    // Redirect to confirmation page
    window.location.href = `order-confirmation.html?orderId=${orderId}`;
}

// Add event listeners for payment options
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up payment event listeners...');
    const mpesaOption = document.querySelector('.payment-option.mpesa');
    const cashOption = document.querySelector('.payment-option.cash');
    
    if (mpesaOption) {
        console.log('M-Pesa option found');
        mpesaOption.addEventListener('click', () => handlePaymentMethod('mpesa'));
    }
    
    if (cashOption) {
        console.log('Cash option found');
        cashOption.addEventListener('click', () => handlePaymentMethod('cash'));
    }
}); 