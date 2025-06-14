document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    hamburgerMenu.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.hamburger-menu') && !e.target.closest('.mobile-menu')) {
            mobileMenu.classList.remove('active');
        }
    });
    
    // Cart functionality
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const price = parseFloat(this.getAttribute('data-price'));
            
            // Check if item already in cart
            const existingItem = cart.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id,
                    name,
                    price,
                    quantity: 1
                });
            }
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            // Show temporary notification
            showNotification(`${name} added to cart!`);
        });
    });
    
    // Update cart count in navbar
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    }

    // Menu page functionality
    if (document.querySelector('.menu-items')) {
        // Load menu items from localStorage (managed by admin)
        let menuData = JSON.parse(localStorage.getItem('menuItems')) || [];
        console.log('Menu page - Loaded menu items:', menuData);
        
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                const category = this.getAttribute('data-category');
                const filteredItems = category === 'all' 
                    ? menuData.filter(item => item.available) 
                    : menuData.filter(item => item.category === category && item.available);
                console.log('Filtered items for category', category, ':', filteredItems);
                displayMenuItems(filteredItems);
            });
        });
        
        // Display all available items initially
        const availableItems = menuData.filter(item => item.available);
        console.log('Initial available items:', availableItems);
        displayMenuItems(availableItems);
        
        function displayMenuItems(items) {
            const menuContainer = document.getElementById('menu-items');
            menuContainer.innerHTML = '';
            
            if (items.length === 0) {
                menuContainer.innerHTML = '<p class="no-items">No menu items available.</p>';
                return;
            }
            
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="menu-item-content">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <span class="price">Ksh ${item.price.toFixed(2)}</span>
                        <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
                    </div>
                `;
                menuContainer.appendChild(menuItem);
            });
            
            // Add event listeners for Add to Cart buttons
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const name = this.getAttribute('data-name');
                    const price = parseFloat(this.getAttribute('data-price'));
                    
                    const existingItem = cart.find(item => item.id === id);
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        cart.push({ id, name, price, quantity: 1 });
                    }
                    
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    showNotification(`${name} added to cart!`);
                });
            });
        }
    }
    
    // Notification system
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    // Cart page functionality
    if (document.getElementById('cart-items')) {
        function displayCartItems() {
            const cartItems = document.getElementById('cart-items');
            cartItems.innerHTML = '';
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<p class="no-items">Your cart is empty.</p>';
                document.getElementById('subtotal').textContent = 'Ksh 0.00';
                document.getElementById('total').textContent = 'Ksh 0.00';
                return;
            }
            
            let subtotal = 0;
            
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <img src="${item.image || 'images/meal1.jpg'}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>Ksh ${item.price.toFixed(2)} each</p>
                        <div class="quantity-control">
                            <button class="decrease-quantity" data-id="${item.id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-quantity" data-id="${item.id}">+</button>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-price">Ksh ${itemTotal.toFixed(2)}</span>
                        <button class="remove-item" data-id="${item.id}">Remove</button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
            
            document.getElementById('subtotal').textContent = `Ksh ${subtotal.toFixed(2)}`;
            document.getElementById('total').textContent = `Ksh ${subtotal.toFixed(2)}`;
            
            // Add event listeners for quantity controls and remove buttons
            document.querySelectorAll('.decrease-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const item = cart.find(item => item.id === id);
                    if (item && item.quantity > 1) {
                        item.quantity--;
                        localStorage.setItem('cart', JSON.stringify(cart));
                        displayCartItems();
                        updateCartCount();
                    }
                });
            });
            
            document.querySelectorAll('.increase-quantity').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    const item = cart.find(item => item.id === id);
                    if (item) {
                        item.quantity++;
                    localStorage.setItem('cart', JSON.stringify(cart));
                        displayCartItems();
                    updateCartCount();
                    }
                });
            });
            
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    cart = cart.filter(item => item.id !== id);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    displayCartItems();
                    updateCartCount();
                    showNotification('Item removed from cart');
                });
            });
        }
        
        displayCartItems();
        
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('user') !== null;
        
        // Update checkout form based on login status
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            // Clear existing form
            checkoutForm.innerHTML = '';
            
            if (isLoggedIn) {
                const user = JSON.parse(localStorage.getItem('user'));
                checkoutForm.innerHTML = `
                    <div class="form-group">
                        <label for="name">Name:</label>
                        <input type="text" id="name" value="${user.name || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" value="${user.email || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number:</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <button type="submit" class="checkout-btn">Place Order</button>
                `;
            } else {
                checkoutForm.innerHTML = `
                    <div class="form-group">
                        <label for="name">Full Name:</label>
                        <input type="text" id="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone Number:</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <button type="submit" class="checkout-btn">Place Order</button>
                `;
            }
            
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                
                if (!name || !email || !phone) {
                    showNotification('Please fill in all required fields');
                    return;
                }

                const orderId = Date.now().toString();
                const order = {
                    id: orderId,
                    customerName: name,
                    customerEmail: email,
                    customerPhone: phone,
                    items: cart,
                    total: calculateTotal(),
                    status: 'pending',
                    date: new Date().toISOString()
                };
                
                // Save order to localStorage
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
                
                // Clear cart
                cart = [];
                localStorage.removeItem('cart');
                updateCartCount();
                
                // Show success notification
                showNotification('Order placed successfully!');
                
                // Redirect to order confirmation page after 2 seconds
                setTimeout(() => {
                    window.location.href = `order-confirmation.html?orderId=${orderId}`;
                }, 2000);
            });
        }
        
        function calculateTotal() {
            return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }
    }

    // Authentication Functions
    function updateNavbar() {
        const isLoggedIn = localStorage.getItem('user') !== null;
        const navbarRight = document.querySelector('.navbar-right');
        
        if (navbarRight) {
            // Keep existing cart icon
            const cartIcon = navbarRight.querySelector('.cart-icon');
            
            // Create auth element
            let authElement = navbarRight.querySelector('.auth-element');
            if (!authElement) {
                authElement = document.createElement('div');
                authElement.className = 'auth-element';
                navbarRight.insertBefore(authElement, cartIcon);
            }
            
            if (isLoggedIn) {
                const user = JSON.parse(localStorage.getItem('user'));
                authElement.innerHTML = `
                    <a href="#" class="user-icon">
                        <i class="fas fa-user"></i>
                        <span>${user.name}</span>
                    </a>
                    <button class="logout-btn" onclick="logout()">Logout</button>
                `;
            } else {
                authElement.innerHTML = `
                    <a href="login.html" class="login-btn">Login</a>
                `;
            }
        }
    }

    function logout() {
        localStorage.removeItem('user');
        showNotification('Logged out successfully');
        updateNavbar();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    // Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const identifier = document.getElementById('login-identifier').value;
            const password = document.getElementById('password').value;
            
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Find user by email or phone
            const user = users.find(u => 
                (u.email === identifier || u.phone === identifier) && 
                u.password === password
            );
            
            if (user) {
                // Store logged in user
                localStorage.setItem('user', JSON.stringify({
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }));
                
                showNotification('Login successful!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showNotification('Invalid email/phone or password', 'error');
            }
        });
    }

    // Register Form Handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate password
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                showNotification('Password does not meet requirements', 'error');
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Get existing users
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            // Check if email or phone already exists
            if (users.some(u => u.email === email || u.phone === phone)) {
                showNotification('Email or phone number already registered', 'error');
                return;
            }
            
            // Add new user
            users.push({
                name,
                email,
                phone,
                password
            });
            
            localStorage.setItem('users', JSON.stringify(users));
            
            showNotification('Registration successful! Please login.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    }

    // Clear any existing user data on page load
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        localStorage.removeItem('user');
    }
    updateNavbar();

    // Load meals of the day
    if (document.getElementById('meals-container')) {
        loadMealsOfTheDay();
    }

    function loadMealsOfTheDay() {
        const mealsContainer = document.getElementById('meals-container');
        const mealsSection = document.querySelector('.meals-section');
        const meals = JSON.parse(localStorage.getItem('mealsOfDay')) || [];
        
        if (meals.length === 0) {
            // Hide the entire meals section if there are no meals
            if (mealsSection) {
                mealsSection.style.display = 'none';
            }
            return;
        }
        
        // Show the meals section
        if (mealsSection) {
            mealsSection.style.display = 'block';
        }
        
        mealsContainer.innerHTML = '';
        
        meals.forEach(meal => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
                <img src="${meal.image}" alt="${meal.name}">
                <h3>${meal.name}</h3>
                <p>${meal.description}</p>
                <span class="price">KES ${meal.price.toFixed(2)}</span>
                <button class="add-to-cart" data-id="${meal.id}" data-name="${meal.name}" data-price="${meal.price}">Add to Cart</button>
            `;
            mealsContainer.appendChild(mealCard);
        });
        
        // Add event listeners for Add to Cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const name = this.getAttribute('data-name');
                const price = parseFloat(this.getAttribute('data-price'));
                
                const existingItem = cart.find(item => item.id === id);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({ id, name, price, quantity: 1 });
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                showNotification(`${name} added to cart!`);
            });
        });
    }
});