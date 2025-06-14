document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard initializing...');
    // Initialize menu items in localStorage if not exists
    if (!localStorage.getItem('menuItems')) {
        localStorage.setItem('menuItems', JSON.stringify([]));
    }

    // Load and display menu items
    function loadMenuItems() {
        const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
        const menuTable = document.getElementById('menu-table');
        menuTable.innerHTML = '';
        
        menuItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td><img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${item.name}</td>
                <td>${item.description}</td>
                <td>Ksh ${item.price.toFixed(2)}</td>
                <td>${item.category}</td>
                <td>${item.available ? 'Yes' : 'No'}</td>
                <td>
                    <button class="btn edit-item" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            menuTable.appendChild(row);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-item').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                editMenuItem(itemId);
            });
        });
        
        document.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-id');
                deleteMenuItem(itemId);
            });
        });
    }

    // Load and display orders
    function loadOrders() {
        console.log('Loading orders...');
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        console.log('Orders from localStorage:', orders);
        
        const ordersTable = document.getElementById('orders-table');
        const recentOrdersTable = document.getElementById('recent-orders-table');
        
        console.log('Orders table element:', ordersTable);
        console.log('Recent orders table element:', recentOrdersTable);
        
        // Update orders table
        if (ordersTable) {
            console.log('Updating orders table...');
            ordersTable.innerHTML = '';
            orders.forEach(order => {
                console.log('Processing order:', order);
                // Ensure all required fields have default values
                const orderData = {
                    id: order.id || 'N/A',
                    customerName: order.customerName || 'Guest',
                    date: order.date || order.timestamp || new Date().toISOString(),
                    items: order.items || [],
                    total: order.total || 0,
                    status: order.status || 'pending',
                    paymentStatus: order.paymentStatus || 'Pending'
                };

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${orderData.id}</td>
                    <td>${orderData.customerName}</td>
                    <td>${new Date(orderData.date).toLocaleString()}</td>
                    <td>${orderData.items.map(item => `${item.name || 'Unknown'} (${item.quantity || 0})`).join(', ')}</td>
                    <td>KES ${orderData.total.toFixed(2)}</td>
                    <td><span class="status ${orderData.status}">${orderData.status}</span></td>
                    <td><span class="payment-status ${orderData.paymentStatus}">${orderData.paymentStatus}</span></td>
                    <td>
                        ${orderData.paymentStatus === 'Paid' ? 
                            '<span class="paid-badge">Paid</span>' : 
                            `<button class="btn update-status" data-id="${orderData.id}">Update Status</button>
                             ${orderData.status === 'completed' ? 
                                `<button class="btn mark-paid" data-id="${orderData.id}">Mark as Paid</button>` : 
                                ''}`
                        }
                    </td>
                `;
                ordersTable.appendChild(row);
            });
            console.log('Orders table updated');
        }

        // Update recent orders table (show last 5 orders)
        if (recentOrdersTable) {
            console.log('Updating recent orders table...');
            recentOrdersTable.innerHTML = '';
            const recentOrders = orders.slice(-5).reverse();
            recentOrders.forEach(order => {
                console.log('Processing recent order:', order);
                // Ensure all required fields have default values
                const orderData = {
                    id: order.id || 'N/A',
                    customerName: order.customerName || 'Guest',
                    items: order.items || [],
                    total: order.total || 0,
                    status: order.status || 'pending'
                };

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${orderData.id}</td>
                    <td>${orderData.customerName}</td>
                    <td>${orderData.items.map(item => `${item.name || 'Unknown'} (${item.quantity || 0})`).join(', ')}</td>
                    <td>KES ${orderData.total.toFixed(2)}</td>
                    <td><span class="status ${orderData.status}">${orderData.status}</span></td>
                    <td>
                        <button class="btn view-details" data-id="${orderData.id}">View Details</button>
                    </td>
                `;
                recentOrdersTable.appendChild(row);
            });
            console.log('Recent orders table updated');
        }

        // Update dashboard stats
        updateDashboardStats(orders);
    }

    function updateDashboardStats(orders) {
        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.date || order.timestamp || 0).toDateString();
            return orderDate === today;
        });
        
        document.getElementById('today-orders').textContent = todayOrders.length;
        document.getElementById('today-revenue').textContent = 'KES ' + 
            todayOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2);
        document.getElementById('menu-items-count').textContent = 
            JSON.parse(localStorage.getItem('menuItems') || '[]').length;
        document.getElementById('pending-orders').textContent = 
            orders.filter(order => (order.status || 'pending') === 'pending').length;
    }

    // Show Add Menu Item modal
    const addItemBtn = document.querySelector('.add-item-btn');
    const addItemModal = document.getElementById('add-item-modal');
    const closeModalBtn = addItemModal ? addItemModal.querySelector('.close-modal') : null;
    if (addItemBtn && addItemModal) {
        addItemBtn.addEventListener('click', function() {
            addItemModal.style.display = 'flex';
            // Reset form fields
            const form = document.getElementById('add-item-form');
            if (form) form.reset();
        });
    }
    if (closeModalBtn && addItemModal) {
        closeModalBtn.addEventListener('click', function() {
            addItemModal.style.display = 'none';
        });
    }
    window.addEventListener('click', function(e) {
        if (e.target === addItemModal) {
            addItemModal.style.display = 'none';
        }
    });

    // Add new menu item
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newItem = {
                id: Date.now().toString(),
                name: document.getElementById('item-name').value,
                description: document.getElementById('item-description').value,
                price: parseFloat(document.getElementById('item-price').value),
                category: document.getElementById('item-category').value,
                image: document.getElementById('item-image').value || 'images/meal' + (Math.floor(Math.random() * 6) + 1) + '.jpg',
                available: document.getElementById('item-available').checked
            };
            
            console.log('Adding new menu item:', newItem);
            
            const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
            menuItems.push(newItem);
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            
            console.log('Current menu items in localStorage:', JSON.parse(localStorage.getItem('menuItems')));
            
            addItemModal.style.display = 'none';
            loadMenuItems();
        });
    }

    // Edit menu item
    function editMenuItem(itemId) {
        const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
        const item = menuItems.find(item => item.id === itemId);
        
        if (item) {
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-description').value = item.description;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category;
            
            // Show modal
            const modal = document.getElementById('add-item-modal');
            modal.style.display = 'block';
            
            // Update form submission to handle edit
            const form = document.getElementById('add-item-form');
            form.onsubmit = function(e) {
                e.preventDefault();
            
            item.name = document.getElementById('item-name').value;
            item.description = document.getElementById('item-description').value;
            item.price = parseFloat(document.getElementById('item-price').value);
            item.category = document.getElementById('item-category').value;
                
                localStorage.setItem('menuItems', JSON.stringify(menuItems));
                modal.style.display = 'none';
                loadMenuItems();
            };
        }
    }

    // Delete menu item
    function deleteMenuItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            const menuItems = JSON.parse(localStorage.getItem('menuItems')) || [];
            const updatedItems = menuItems.filter(item => item.id !== itemId);
            localStorage.setItem('menuItems', JSON.stringify(updatedItems));
            loadMenuItems();
        }
    }

    // Mark order as paid
    function markOrderAsPaid(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(order => order.id === orderId);
        
        if (order) {
            order.paymentStatus = 'Paid';
            localStorage.setItem('orders', JSON.stringify(orders));
            loadOrders();
            loadPayments(); // Reload payments tab
        }
    }

    // Load and display payments
    function loadPayments() {
        console.log('Loading payments...');
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        console.log('All orders:', orders);
        
        // Filter only paid orders
        const payments = orders.filter(order => order.paymentStatus === 'Paid' || order.paymentStatus === 'Completed');
        console.log('Paid orders:', payments);
        
        // Calculate total payments
        const totalAmount = payments.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = payments.length;
        
        console.log('Total amount:', totalAmount);
        console.log('Total orders:', totalOrders);
        
        // Update summary cards
        document.getElementById('total-payments').textContent = `KES ${totalAmount.toFixed(2)}`;
        document.getElementById('total-paid-orders').textContent = totalOrders;
        
        // Update payments table
        const paymentsTable = document.getElementById('payments-table');
        if (paymentsTable) {
            paymentsTable.innerHTML = '';
            payments.forEach(payment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>PAY-${payment.id}</td>
                    <td>${payment.id}</td>
                    <td>${payment.customerName || 'Guest'}</td>
                    <td>KES ${(payment.total || 0).toFixed(2)}</td>
                    <td>${payment.paymentMethod || 'M-Pesa'}</td>
                    <td>${payment.paymentStatus || 'Completed'}</td>
                    <td>${new Date(payment.date).toLocaleString()}</td>
                    <td>
                        <span class="paid-badge">Paid</span>
                    </td>
                `;
                paymentsTable.appendChild(row);
            });
        }
    }

    // Update order status
    function updateOrderStatus(orderId) {
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = orders.find(order => order.id === orderId);
        
        if (!order) return;
        
        // Prevent updating paid orders
        if (order.paymentStatus === 'Paid') {
            alert('Cannot update status of a paid order.');
            return;
        }

        const statuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        const currentIndex = statuses.indexOf(order.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        
        order.status = nextStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
    }

    // Initialize tabs
    const tabButtons = document.querySelectorAll('.admin-nav li');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected content
            document.querySelectorAll('.admin-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Update page title
            document.getElementById('admin-page-title').textContent = 
                this.textContent.trim();
            
            // Load content based on tab
            if (tabId === 'menu') {
                loadMenuItems();
            } else if (tabId === 'orders') {
                loadOrders();
            } else if (tabId === 'payments') {
                loadPayments();
            } else if (tabId === 'reports') {
                generateReports();
            }
        });
    });

    // Load Meals of the Day section
    loadMealsOfTheDay();

    // Initial load
    loadMenuItems();
    loadOrders();
    loadPayments();
    
    // Add event listeners for order actions
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('update-status')) {
            const orderId = e.target.getAttribute('data-id');
            updateOrderStatus(orderId);
        } else if (e.target.classList.contains('mark-paid')) {
            const orderId = e.target.getAttribute('data-id');
            markOrderAsPaid(orderId);
        }
    });
    
    // Add event listener for refresh button
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadOrders();
        });
    }
    
    console.log('Admin dashboard initialized');

    // Add click handler for the generate reports button
    const generateReportsBtn = document.getElementById('generateReportsBtn');
    if (generateReportsBtn) {
        console.log('Generate Reports button found, adding click listener');
        generateReportsBtn.onclick = function() {
            console.log('Generate Reports button clicked');
            generateReports();
        };
    } else {
        console.log('Generate Reports button not found');
    }

    // Add click handler for the reports tab
    const reportsTab = document.querySelector('[data-tab="reports"]');
    if (reportsTab) {
        console.log('Reports tab found, adding click listener');
        reportsTab.onclick = function() {
            console.log('Reports tab clicked');
            generateReports();
        };
    } else {
        console.log('Reports tab not found');
    }
});

// Meals of the Day Management
function loadMealsOfTheDay() {
    const mealsContainer = document.getElementById('meals-of-day-table');
    if (!mealsContainer) return;

    const meals = JSON.parse(localStorage.getItem('mealsOfDay')) || [];
    
    mealsContainer.innerHTML = meals.map(meal => `
        <tr>
            <td><img src="${meal.image}" alt="${meal.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${meal.name}</td>
            <td>${meal.description}</td>
            <td>KES ${meal.price.toFixed(2)}</td>
            <td>
                <button class="btn edit-meal" data-id="${meal.id}"><i class="fas fa-edit"></i></button>
                <button class="btn delete-meal" data-id="${meal.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-meal').forEach(button => {
        button.addEventListener('click', function() {
            const mealId = this.getAttribute('data-id');
            editMealOfDay(mealId);
        });
    });

    document.querySelectorAll('.delete-meal').forEach(button => {
        button.addEventListener('click', function() {
            const mealId = this.getAttribute('data-id');
            deleteMealOfDay(mealId);
        });
    });
}

// Add event listener for Add New Meal button
document.addEventListener('DOMContentLoaded', function() {
    const addMealBtn = document.querySelector('.add-meal-btn');
    if (addMealBtn) {
        addMealBtn.addEventListener('click', showAddMealModal);
    }
});

function showAddMealModal() {
    // Check if modal already exists
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Add New Meal</h2>
            <form id="add-meal-form">
                <div class="form-group">
                    <label for="meal-name">Name:</label>
                    <input type="text" id="meal-name" required>
                </div>
                <div class="form-group">
                    <label for="meal-description">Description:</label>
                    <textarea id="meal-description" required></textarea>
                </div>
                <div class="form-group">
                    <label for="meal-price">Price (KES):</label>
                    <input type="number" id="meal-price" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="meal-image">Image URL:</label>
                    <input type="text" id="meal-image" placeholder="Leave empty for default image">
                </div>
                <button type="submit" class="btn">Add Meal</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() {
        modal.remove();
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
    
    // Form submission
    const form = modal.querySelector('#add-meal-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const newMeal = {
            id: Date.now().toString(),
            name: document.getElementById('meal-name').value,
            description: document.getElementById('meal-description').value,
            price: parseFloat(document.getElementById('meal-price').value),
            image: document.getElementById('meal-image').value || 'images/meal' + (Math.floor(Math.random() * 6) + 1) + '.jpg'
        };
        
        const meals = JSON.parse(localStorage.getItem('mealsOfDay')) || [];
        meals.push(newMeal);
        localStorage.setItem('mealsOfDay', JSON.stringify(meals));
        
        modal.remove();
        loadMealsOfTheDay();
        
        // Show success message
        alert('Meal added successfully!');
    };
}

function editMealOfDay(id) {
    const meals = JSON.parse(localStorage.getItem('mealsOfDay')) || [];
    const meal = meals.find(m => m.id === id);
    
    if (!meal) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Edit Meal</h2>
            <form id="edit-meal-form">
                <div class="form-group">
                    <label for="meal-name">Name:</label>
                    <input type="text" id="meal-name" value="${meal.name}" required>
                </div>
                <div class="form-group">
                    <label for="meal-description">Description:</label>
                    <textarea id="meal-description" required>${meal.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="meal-price">Price (KES):</label>
                    <input type="number" id="meal-price" step="0.01" value="${meal.price}" required>
                </div>
                <div class="form-group">
                    <label for="meal-image">Image URL:</label>
                    <input type="text" id="meal-image" value="${meal.image}" required>
                </div>
                <button type="submit" class="btn">Save Changes</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = function() {
        modal.remove();
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
    
    // Form submission
    const form = modal.querySelector('#edit-meal-form');
    form.onsubmit = function(e) {
        e.preventDefault();
        
        meal.name = document.getElementById('meal-name').value;
        meal.description = document.getElementById('meal-description').value;
        meal.price = parseFloat(document.getElementById('meal-price').value);
        meal.image = document.getElementById('meal-image').value;
        
        localStorage.setItem('mealsOfDay', JSON.stringify(meals));
        modal.remove();
        loadMealsOfTheDay();
    };
}

function deleteMealOfDay(id) {
    if (confirm('Are you sure you want to delete this meal?')) {
        const meals = JSON.parse(localStorage.getItem('mealsOfDay')) || [];
        const updatedMeals = meals.filter(m => m.id !== id);
        localStorage.setItem('mealsOfDay', JSON.stringify(updatedMeals));
        loadMealsOfTheDay();
    }
}

// Super admin credentials
const SUPER_ADMIN = {
    employmentNumber: 'AC001',
    name: 'Aticas',
    password: 'admin@aticas'
};

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
        // Only redirect if we're not on the login page
        if (!window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
    } else {
        // If we're on the login page but already logged in, redirect to admin dashboard
        if (window.location.pathname.includes('admin-login.html')) {
            window.location.href = 'admin.html';
        }
        // Update admin name in header
        const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin'));
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement && currentAdmin) {
            adminNameElement.textContent = currentAdmin.name;
        }
    }
}

// Handle admin login
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const employmentNumber = document.getElementById('employmentNumber').value.trim();
        const password = document.getElementById('password').value.trim();

        console.log('Login attempt:', { employmentNumber, password }); // Debug log

        // Check super admin credentials
        if (employmentNumber === SUPER_ADMIN.employmentNumber && password === SUPER_ADMIN.password) {
            console.log('Super admin login successful'); // Debug log
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('currentAdmin', JSON.stringify(SUPER_ADMIN));
            window.location.href = 'admin.html';
        } else {
            // Check other admins
            const admins = JSON.parse(localStorage.getItem('admins') || '[]');
            const admin = admins.find(a => a.employmentNumber === employmentNumber && a.password === password);
            
            if (admin) {
                console.log('Admin login successful:', admin); // Debug log
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('currentAdmin', JSON.stringify(admin));
                window.location.href = 'admin.html';
            } else {
                console.log('Login failed'); // Debug log
                alert('Invalid credentials. Please try again.');
            }
        }
    });
}

// Handle logout
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('currentAdmin');
        window.location.href = 'admin-login.html';
    });
}

// Handle adding new admin
const addAdminForm = document.getElementById('addAdminForm');
if (addAdminForm) {
    addAdminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const employmentNumber = document.getElementById('newEmploymentNumber').value.trim();
        const name = document.getElementById('newName').value.trim();
        const password = document.getElementById('newPassword').value.trim();

        if (!employmentNumber || !name || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Get existing admins
        const admins = JSON.parse(localStorage.getItem('admins') || '[]');

        // Check if employment number already exists
        if (admins.some(admin => admin.employmentNumber === employmentNumber)) {
            alert('Employment number already exists');
            return;
        }

        // Add new admin
        admins.push({ employmentNumber, name, password });
        localStorage.setItem('admins', JSON.stringify(admins));

        // Clear form
        addAdminForm.reset();

        // Refresh admin list
        displayAdmins();
        
        alert('New admin added successfully!');
    });
}

// Display list of admins
function displayAdmins() {
    const adminsList = document.getElementById('adminsList');
    if (adminsList) {
        const admins = JSON.parse(localStorage.getItem('admins') || '[]');
        const allAdmins = [SUPER_ADMIN, ...admins];

        adminsList.innerHTML = allAdmins.map(admin => `
            <div class="admin-card">
                <h3>${admin.name}</h3>
                <p>Employment Number: ${admin.employmentNumber}</p>
            </div>
        `).join('');
    }
}

// Tab switching functionality
const tabLinks = document.querySelectorAll('.admin-nav li');
const tabContents = document.querySelectorAll('.admin-content');

tabLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all links and contents
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Show corresponding content
        const tabId = link.getAttribute('data-tab');
        const content = document.getElementById(`${tabId}-tab`);
        if (content) {
            content.classList.add('active');
        }

        // Update page title
        document.getElementById('admin-page-title').textContent = link.textContent.trim();

        // Load content for the selected tab only
        if (tabId === 'menu') {
            loadMenuItems();
        } else if (tabId === 'orders') {
            loadOrders();
        } else if (tabId === 'payments') {
            loadPayments();
        } else if (tabId === 'reports') {
            generateReports();
        } else if (tabId === 'dashboard') {
            // Optionally, load dashboard stats
            loadDashboardStats && loadDashboardStats();
        } else if (tabId === 'employees') {
            loadEmployees && loadEmployees();
        } else if (tabId === 'admins') {
            loadAdmins && loadAdmins();
        }
    });
});

// On page load, show only the active tab's content
window.addEventListener('DOMContentLoaded', function() {
    tabContents.forEach(c => c.classList.remove('active'));
    const activeTab = document.querySelector('.admin-nav li.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        const content = document.getElementById(`${tabId}-tab`);
        if (content) {
            content.classList.add('active');
        }
    }
});

// Reports Management Functions
function initializeReports() {
    const reportType = document.getElementById('report-type');
    const timePeriod = document.getElementById('time-period');
    const dateRange = document.querySelector('.date-range');
    const generateBtn = document.querySelector('.generate-btn');

    if (timePeriod) {
        timePeriod.addEventListener('change', () => {
            if (timePeriod.value === 'custom') {
                dateRange.style.display = 'flex';
            } else {
                dateRange.style.display = 'none';
            }
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            generateReport();
        });
    }
}

function generateReports() {
    console.log('Starting report generation...');
    
    // Get orders from localStorage
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    console.log('Retrieved orders:', orders);

    // Get the selected period
    const periodSelect = document.getElementById('reportPeriod');
    const period = periodSelect ? periodSelect.value : 'week';
    console.log('Selected period:', period);

    // Filter orders based on period
    const now = new Date();
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        switch(period) {
            case 'today':
                return orderDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                return orderDate >= monthAgo;
            case 'year':
                const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                return orderDate >= yearAgo;
            default:
                return true;
        }
    });
    console.log('Filtered orders:', filteredOrders);

    // Create reports tab content if it doesn't exist
    let reportsTab = document.querySelector('.tab-content[data-tab="reports"]');
    if (!reportsTab) {
        reportsTab = document.createElement('div');
        reportsTab.className = 'tab-content';
        reportsTab.setAttribute('data-tab', 'reports');
        document.querySelector('.tabs-content').appendChild(reportsTab);
    }

    // Create reports header
    const reportsHeader = document.createElement('div');
    reportsHeader.className = 'reports-header';
    reportsHeader.innerHTML = `
        <h2>Reports</h2>
        <div class="header-controls">
            <select id="reportPeriod" class="form-control">
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
            </select>
            <button type="button" id="generateReportsBtn" class="btn">
                <i class="fas fa-sync-alt"></i> Generate Report
            </button>
        </div>
    `;
    reportsTab.innerHTML = '';
    reportsTab.appendChild(reportsHeader);

    // Create reports grid
    const reportsGrid = document.createElement('div');
    reportsGrid.className = 'reports-grid';
    reportsGrid.innerHTML = `
        <div class="report-card">
            <h3>Sales Overview</h3>
            <div id="salesOverview" class="report-content"></div>
        </div>
        <div class="report-card">
            <h3>Daily Revenue</h3>
            <div id="dailyRevenue" class="report-content"></div>
        </div>
        <div class="report-card">
            <h3>Summary Statistics</h3>
            <div class="summary-stats"></div>
        </div>
    `;
    reportsTab.appendChild(reportsGrid);

    // Calculate total sales
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    console.log('Total sales:', totalSales);

    // Generate sales overview
    const salesOverview = document.getElementById('salesOverview');
    if (salesOverview) {
        const categories = {};
        filteredOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item && item.category && item.price && item.quantity) {
                        categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity);
                    }
                });
            }
        });

        salesOverview.innerHTML = `
            <div class="sales-categories">
                ${Object.entries(categories).map(([category, amount]) => `
                    <div class="category-item">
                        <div class="category-name">${category}</div>
                        <div class="category-amount">KES ${amount.toFixed(2)}</div>
                        <div class="category-percentage">${((amount / totalSales) * 100).toFixed(1)}%</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Generate daily revenue
    const dailyRevenue = document.getElementById('dailyRevenue');
    if (dailyRevenue) {
        const dailyData = {};
        filteredOrders.forEach(order => {
            if (order.date && order.total) {
                const date = new Date(order.date).toLocaleDateString();
                dailyData[date] = (dailyData[date] || 0) + (order.total || 0);
            }
        });

        dailyRevenue.innerHTML = `
            <div class="daily-revenue-list">
                ${Object.entries(dailyData).map(([date, amount]) => `
                    <div class="daily-item">
                        <div class="daily-date">${date}</div>
                        <div class="daily-amount">KES ${amount.toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Update summary stats
    const summaryStats = document.querySelector('.summary-stats');
    if (summaryStats) {
        const avgOrderValue = filteredOrders.length ? (totalSales / filteredOrders.length).toFixed(2) : 0;
        summaryStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Total Sales</span>
                <span class="stat-value">KES ${totalSales.toFixed(2)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Total Orders</span>
                <span class="stat-value">${filteredOrders.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Average Order Value</span>
                <span class="stat-value">KES ${avgOrderValue}</span>
            </div>
        `;
    }

    // Add event listener for period change
    const periodSelector = document.getElementById('reportPeriod');
    if (periodSelector) {
        periodSelector.value = period;
        periodSelector.addEventListener('change', generateReports);
    }

    // Add event listener for generate button
    const generateBtn = document.getElementById('generateReportsBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateReports);
    }

    console.log('Report generation completed');
}

// Show error message
function showError(message) {
    const reportsTab = document.getElementById('reports-tab');
    if (reportsTab) {
        reportsTab.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add event listener for tab switching
document.addEventListener('DOMContentLoaded', function() {
    // Ensure admin container exists
    let adminContainer = document.querySelector('.admin-container');
    if (!adminContainer) {
        adminContainer = document.createElement('div');
        adminContainer.className = 'admin-container';
        document.body.appendChild(adminContainer);
    }

    // Create tabs navigation if it doesn't exist
    let tabsNav = document.querySelector('.tabs-nav');
    if (!tabsNav) {
        tabsNav = document.createElement('ul');
        tabsNav.className = 'tabs-nav';
        tabsNav.innerHTML = `
            <li><a href="#" class="tab-link active" data-tab="ordersTab">Orders</a></li>
            <li><a href="#" class="tab-link" data-tab="reportsTab">Reports</a></li>
        `;
        adminContainer.appendChild(tabsNav);
    }

    // Create tabs content container if it doesn't exist
    let tabsContent = document.querySelector('.tabs-content');
    if (!tabsContent) {
        tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        adminContainer.appendChild(tabsContent);
    }

    // Add event listeners for tab switching
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Generate reports if reports tab is selected
            if (tabId === 'reportsTab') {
                generateReports();
            }
        });
    });
    
    // Initialize reports if reports tab is active
    if (document.getElementById('reportsTab')?.classList.contains('active')) {
        generateReports();
    }
});
