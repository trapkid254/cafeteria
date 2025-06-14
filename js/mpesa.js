// M-Pesa Integration
const MPESA_CONFIG = {
    env: 'sandbox',
    shortcode: '174379', // Sandbox shortcode
    consumerKey: '054TZRXJNbDmPjhJBD8fVnJGhqVc3aI8aicf8USfapFfqEBO',
    consumerSecret: 'e7FmKAQqMmyjT0bGP7tOEpfnvn0chC6fuMsmilF8vJtoi3QPNMnGEjChJybQnCbt',
    passkey: 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', // Sandbox passkey
    callbackUrl: 'https://5456-41-204-187-5.ngrok-free.app/api/mpesa/callback' // ngrok callback URL
};

// Generate access token
async function getAccessToken() {
    console.log('Getting access token...');
    const auth = btoa(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`);
    try {
        const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        const data = await response.json();
        console.log('Access token response:', data);
        if (!data.access_token) {
            throw new Error('Failed to get access token');
        }
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// Generate timestamp
function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
}

// Generate password
function generatePassword() {
    const timestamp = getTimestamp();
    const str = MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp;
    return btoa(str);
}

// Initiate STK Push
async function initiateSTKPush(phoneNumber, amount, orderId) {
    console.log('Initiating STK Push...');
    console.log('Phone:', phoneNumber);
    console.log('Amount:', amount);
    console.log('Order ID:', orderId);
    
    try {
        const accessToken = await getAccessToken();
        console.log('Got access token');
        
        const timestamp = getTimestamp();
        const password = generatePassword();
        
        // Ensure amount is a whole number
        const amountInt = Math.round(amount);
        
        const requestBody = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amountInt,
            PartyA: phoneNumber,
            PartyB: MPESA_CONFIG.shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: MPESA_CONFIG.callbackUrl,
            AccountReference: "Atikas Cafe",
            TransactionDesc: `Payment for order ${orderId}`
        };
        
        console.log('STK Push request body:', requestBody);

        const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('STK Push response:', data);
        
        if (!data.CheckoutRequestID) {
            throw new Error('Failed to initiate STK Push: ' + JSON.stringify(data));
        }
        
        return data;
    } catch (error) {
        console.error('Error initiating STK Push:', error);
        throw error;
    }
}

// Handle M-Pesa payment
async function handleMpesaPayment(phoneNumber, amount, orderId) {
    console.log('Handling M-Pesa payment...');
    try {
        // Show processing state
        document.querySelector('.payment-processing').style.display = 'flex';
        
        // Make request to our backend
        const response = await fetch('http://localhost:3000/api/mpesa/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phoneNumber,
                amount,
                orderId
            })
        });

        const data = await response.json();
        console.log('STK Push response:', data);
        
        if (data.success) {
            // Successfully initiated payment
            showNotification('Please check your phone for the M-Pesa prompt', 'success');
            
            // Trigger payment notification
            handleMpesaPaymentNotification({
                amount: amount,
                orderId: orderId
            });
            
            // Wait for 30 seconds to check payment status
            setTimeout(() => {
                document.querySelector('.payment-processing').style.display = 'none';
                window.location.href = 'order-confirmation.html';
            }, 30000);
        } else {
            // Failed to initiate payment
            console.error('Failed to initiate payment:', data);
            showNotification(data.message || 'Failed to initiate payment. Please try again.', 'error');
            document.querySelector('.payment-processing').style.display = 'none';
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        document.querySelector('.payment-processing').style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Export functions
window.handleMpesaPayment = handleMpesaPayment;

// M-Pesa payment handling
async function processMpesaPayment(phoneNumber, amount, orderId) {
    console.log('Starting M-Pesa payment process...');
    try {
        // Get cart total
        const total = calculateTotal();
        console.log('Total amount:', total);
        
        // Generate order ID if not provided
        if (!orderId) {
            orderId = 'ORD' + Date.now();
        }
        console.log('Order ID:', orderId);
        
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Current user:', currentUser);
        if (!currentUser) {
            showNotification('Please login to place an order', 'error');
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
            phoneNumber: phoneNumber,
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
        await handleMpesaPayment(phoneNumber, total, orderId);
        
        // Clear cart after successful payment
        localStorage.removeItem('cart');
        window.location.href = 'order-confirmation.html';
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Payment failed. Please try again.', 'error');
    }
}

// Show loading popup
function showLoadingPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'loading-popup';
    popup.innerHTML = `
        <div class="loading-content">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(popup);
}

// Hide loading popup
function hideLoadingPopup() {
    const popup = document.querySelector('.loading-popup');
    if (popup) {
        popup.remove();
    }
}

// Format phone number for M-Pesa
function formatPhoneNumber(phone) {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
        // Convert 0XXXXXXXXX to 254XXXXXXXXX
        return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
        // Already in correct format
        return cleaned;
    } else if (cleaned.startsWith('7')) {
        // Convert 7XXXXXXXX to 2547XXXXXXXX
        return '254' + cleaned;
    }
    
    return cleaned;
}

// Generate unique order ID
function generateOrderId() {
    return 'ORDER-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Calculate total amount from cart
function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Save order to localStorage
function saveOrder(orderId, amount, phoneNumber) {
    const order = {
        id: orderId,
        amount: amount,
        phoneNumber: phoneNumber,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// Poll for payment status
async function startPaymentStatusPolling(checkoutRequestId, orderId) {
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts
    const interval = 3000; // 3 seconds
    
    const pollStatus = async () => {
        try {
            console.log('Checking payment status...');
            const response = await fetch(`http://localhost:3000/api/mpesa/status/${checkoutRequestId}`);
            const data = await response.json();
            console.log('Payment status response:', data);
            
            if (data.status === 'completed' || data.resultCode === '0') {
                hideLoadingPopup();
                showNotification('Payment completed successfully!', 'success');
                // Clear cart
                localStorage.removeItem('cart');
                // Redirect to order confirmation page
                window.location.href = `order-confirmation.html?orderId=${orderId}`;
                return;
            } else if (data.status === 'failed' || data.resultCode === '1') {
                hideLoadingPopup();
                showNotification('Payment failed: ' + data.message, 'error');
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(pollStatus, interval);
            } else {
                hideLoadingPopup();
                showNotification('Payment status check timed out. Please check your order status.', 'warning');
                // Redirect to order status page
                window.location.href = `order-status.html?orderId=${orderId}`;
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            hideLoadingPopup();
            showNotification('Error checking payment status', 'error');
        }
    };
    
    pollStatus();
}

// Add styles for loading popup
const style = document.createElement('style');
style.textContent = `
    .loading-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .loading-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        max-width: 90%;
        width: 400px;
    }

    .loading-content i {
        font-size: 2rem;
        color: #007bff;
        margin-bottom: 1rem;
    }

    .loading-content p {
        margin: 0;
        font-size: 1.1rem;
        color: #333;
    }
`;
document.head.appendChild(style);

// Initialize M-Pesa payment button
document.addEventListener('DOMContentLoaded', function() {
    const mpesaButton = document.getElementById('mpesa-pay-button');
    if (mpesaButton) {
        mpesaButton.addEventListener('click', async () => {
            try {
                const phoneInput = document.getElementById('phone');
                const phoneNumber = phoneInput.value.trim();
                
                if (!phoneNumber) {
                    showNotification('Please enter your M-Pesa phone number', 'error');
                    return;
                }
                
                const amount = calculateTotal();
                const orderId = 'ORD' + Date.now();
                console.log('Generated order ID:', orderId);
                
                // Save order
                const order = {
                    id: orderId,
                    items: getCartItems(),
                    total: amount,
                    paymentMethod: 'mpesa',
                    status: 'pending',
                    paymentStatus: 'Pending',
                    phoneNumber: phoneNumber,
                    customerPhone: phoneNumber,
                    customerName: 'Guest',
                    orderType: document.querySelector('input[name="orderType"]:checked')?.value || 'delivery',
                    date: new Date().toISOString(),
                    timestamp: new Date().toISOString()
                };
                
                // Save to localStorage
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
                
                // Show loading state
                const button = mpesaButton;
                const originalText = button.textContent;
                button.disabled = true;
                button.textContent = 'Processing...';
                
                // Process payment
                await processMpesaPayment(phoneNumber, amount, orderId);
                
                // Reset button state
                button.disabled = false;
                button.textContent = originalText;
                
            } catch (error) {
                console.error('Payment error:', error);
                showNotification(error.message, 'error');
            }
        });
    }
});

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

// Make functions available globally
window.processMpesaPayment = processMpesaPayment;
window.showLoadingPopup = showLoadingPopup;
window.hideLoadingPopup = hideLoadingPopup;
window.formatPhoneNumber = formatPhoneNumber;
window.generateOrderId = generateOrderId;
window.calculateTotal = calculateTotal;
window.saveOrder = saveOrder;
window.showNotification = showNotification;
window.startPaymentStatusPolling = startPaymentStatusPolling; 