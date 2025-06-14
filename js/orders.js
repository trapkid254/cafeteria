// Get orders from localStorage
function getOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // If no user is logged in, redirect to login page
        localStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'login.html';
        return [];
    }
    
    console.log('Current user:', currentUser);
    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    console.log('All orders:', allOrders);
    
    // Filter orders for current user based on phone number
    const userOrders = allOrders.filter(order => {
        const matches = order.phoneNumber === currentUser.phone || 
                       order.customerPhone === currentUser.phone;
        console.log('Order:', order.id, 'Phone match:', matches);
        return matches;
    });
    
    console.log('Filtered orders for user:', userOrders);
    return userOrders;
}

// Display orders
function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) {
        console.error('Orders list element not found');
        return;
    }

    const orders = getOrders();
    console.log('Orders to display:', orders);

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders-message">
                <i class="fas fa-receipt"></i>
                <p>You haven't placed any orders yet</p>
                <a href="menu.html" class="btn view-menu-btn">View Menu</a>
            </div>
        `;
        return;
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    ordersList.innerHTML = orders.map(order => {
        // Ensure all required properties have default values
        const orderItems = order.items || [];
        const orderTotal = order.total || 0;
        const orderType = order.orderType || 'in-house';
        const paymentMethod = order.paymentMethod || 'cash';
        const orderStatus = order.status || 'pending';
        const orderDate = order.date ? new Date(order.date).toLocaleString() : 'N/A';

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id || 'N/A'}</h3>
                        <p class="order-date">${orderDate}</p>
                    </div>
                    <div class="order-status ${orderStatus.toLowerCase()}">
                        ${orderStatus}
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-items">
                        ${orderItems.map(item => `
                            <div class="order-item">
                                <span class="item-name">${item.name || 'Unknown Item'}</span>
                                <span class="item-quantity">x${item.quantity || 0}</span>
                                <span class="item-price">KES ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>KES ${orderTotal.toFixed(2)}</span>
                        </div>
                        ${orderType === 'delivery' ? `
                            <div class="summary-row">
                                <span>Delivery Fee:</span>
                                <span>KES 100.00</span>
                            </div>
                        ` : ''}
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>KES ${(orderTotal + (orderType === 'delivery' ? 100 : 0)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="order-footer">
                    <div class="payment-info">
                        <i class="fas ${paymentMethod === 'mpesa' ? 'fa-mobile-alt' : 'fa-money-bill-wave'}"></i>
                        <span>${paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'} Payment</span>
                    </div>
                    <div class="order-type">
                        <i class="fas ${orderType === 'delivery' ? 'fa-truck' : 'fa-store'}"></i>
                        <span>${orderType === 'delivery' ? 'Delivery' : 'In-house'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // Store the current page URL for redirect after login
        localStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    console.log('Initializing orders page for user:', currentUser);
    displayOrders();
    updateCartCount();
}); 