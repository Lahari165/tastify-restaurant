/**
 * Tastify Arabian Mandi & Restaurant
 * Full-Stack Express Backend Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle invalid JSON body gracefully without crashing server
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON request payload.' });
  }
  next(err);
});

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');

// In-memory sessions
const activeAdminTokens = new Map();
const activeCustomerTokens = new Map();

// Helper to hash passwords securely
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Helper to read JSON safely (with /tmp fallback for serverless environments)
function readJSON(file, fallback = {}) {
  try {
    const tmpPath = path.join('/tmp', path.basename(file));
    if (fs.existsSync(tmpPath)) {
      const data = fs.readFileSync(tmpPath, 'utf8');
      return JSON.parse(data);
    }
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
  return fallback;
}

// Helper to write JSON safely (with /tmp fallback for serverless environments)
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    try {
      const tmpPath = path.join('/tmp', path.basename(file));
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (tmpErr) {
      console.error(`Error writing ${file} (and /tmp fallback):`, tmpErr.message);
      return false;
    }
  }
}


// --------------------------------------------------------------------------
// API Routes
// --------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    restaurant: 'Tastify Arabian Mandi & Restaurant',
    timestamp: new Date().toISOString()
  });
});

// GET Menu
app.get('/api/menu', (req, res) => {
  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  res.json(menuData);
});

// GET Reviews
app.get('/api/reviews', (req, res) => {
  const reviewsData = readJSON(REVIEWS_FILE, { rating: 4.3, reviewCount: 872, reviews: [] });
  res.json(reviewsData);
});

// POST Review
app.post('/api/reviews', (req, res) => {
  const { name, rating, text, dish } = req.body;
  if (!name || !text || !rating) {
    return res.status(400).json({ success: false, message: 'Name, rating, and review text are required.' });
  }

  const reviewsData = readJSON(REVIEWS_FILE, { rating: 4.3, reviewCount: 872, reviews: [] });
  const numRating = Math.min(5, Math.max(1, parseFloat(rating) || 5));

  const newReview = {
    id: Date.now(),
    name: name.trim(),
    role: 'Verified Guest',
    rating: numRating,
    text: text.trim(),
    dish: (dish && dish.trim()) || 'Signature Arabian Mandi',
    date: 'Just Now'
  };

  // Recalculate average rating & increment count
  const currentCount = reviewsData.reviewCount || 872;
  const currentRating = reviewsData.rating || 4.3;
  const newCount = currentCount + 1;
  const newAvgRating = parseFloat(((currentRating * currentCount + numRating) / newCount).toFixed(1));

  reviewsData.rating = newAvgRating;
  reviewsData.reviewCount = newCount;
  reviewsData.reviews.unshift(newReview);

  writeJSON(REVIEWS_FILE, reviewsData);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been published.',
    review: newReview,
    rating: reviewsData.rating,
    reviewCount: reviewsData.reviewCount
  });
});

// POST Orders
app.post('/api/orders', (req, res) => {
  const { customerName, phone, deliveryType, address, items, specialInstructions } = req.body;

  if (!customerName || !phone || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Customer name, phone, and at least one item are required.' });
  }

  // Calculate totals
  let subtotal = 0;
  const itemizedList = items.map(item => {
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const price = parseFloat(item.price) || 0;
    const itemTotal = price * qty;
    subtotal += itemTotal;
    return {
      id: item.id,
      name: item.name,
      price: price,
      quantity: qty,
      itemTotal: itemTotal
    };
  });

  const tax = Math.round(subtotal * 0.05); // 5% GST
  const deliveryFee = deliveryType === 'delivery' ? 30 : 0;
  const grandTotal = subtotal + tax + deliveryFee;

  const orderId = `TAS-ORD-${Date.now().toString().slice(-5)}`;
  const orderDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const authHeader = req.headers['authorization'];
  const custToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : (req.headers['x-customer-token'] || req.body.customerToken);
  let customerId = req.body.customerId || null;
  if (!customerId && custToken && activeCustomerTokens.has(custToken)) {
    customerId = activeCustomerTokens.get(custToken).customerId;
  }

  const newOrder = {
    orderId,
    customerId,
    customerName: customerName.trim(),
    phone: phone.trim(),
    deliveryType: deliveryType || 'dine-in',
    address: address ? address.trim() : 'At Restaurant',
    items: itemizedList,
    subtotal,
    tax,
    deliveryFee,
    grandTotal,
    specialInstructions: specialInstructions ? specialInstructions.trim() : '',
    status: 'Received',
    estimatedDeliveryTime: 'Waiting for kitchen acceptance...',
    acceptedAt: null,
    createdAt: orderDate
  };

  // Save to file
  const orders = readJSON(ORDERS_FILE, []);
  orders.unshift(newOrder);
  writeJSON(ORDERS_FILE, orders);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully! Waiting for kitchen to accept.',
    order: newOrder
  });
});

// Helper to ensure all accepted orders have a running delivery timestamp
function ensureOrderTimestamps(order) {
  if (!order) return order;
  if (order.estimatedDeliveryTime && !order.estimatedDeliveryTime.toLowerCase().includes('waiting')) {
    const match = order.estimatedDeliveryTime.match(/\d+/);
    const mins = match ? parseInt(match[0], 10) : 30;
    order.estimatedMinutes = mins;
    if (!order.targetDeliveryTimestamp) {
      const base = order.allottedAt || (order.acceptedAt ? new Date(order.acceptedAt).getTime() : Date.now());
      order.allottedAt = isNaN(base) ? Date.now() : base;
      order.targetDeliveryTimestamp = order.allottedAt + (mins * 60 * 1000);
    }
    if (!order.targetDeliveryClockTime && order.targetDeliveryTimestamp) {
      order.targetDeliveryClockTime = new Date(order.targetDeliveryTimestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }
  return order;
}

// GET Single Order by ID (for live customer tracking)
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const orders = readJSON(ORDERS_FILE, []);
  const order = orders.find(o => o.orderId === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  ensureOrderTimestamps(order);
  res.json({ success: true, order });
});

// GET Orders
app.get('/api/orders', (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  orders.forEach(ensureOrderTimestamps);
  res.json(orders);
});

// POST Table Reservation
app.post('/api/reservations', (req, res) => {
  const { name, phone, date, time, guests, seating, notes } = req.body;

  if (!name || !phone || !date || !time) {
    return res.status(400).json({ success: false, message: 'Name, phone, date, and time are required.' });
  }

  const reservationId = `TAS-RES-${Date.now().toString().slice(-4)}`;
  const createdAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const newReservation = {
    reservationId,
    name: name.trim(),
    phone: phone.trim(),
    date,
    time,
    guests: guests || '4 Guests',
    seating: seating || 'Traditional Floor Majlis',
    notes: notes ? notes.trim() : '',
    status: 'Confirmed',
    createdAt
  };

  const reservations = readJSON(RESERVATIONS_FILE, []);
  reservations.unshift(newReservation);
  writeJSON(RESERVATIONS_FILE, reservations);

  // WhatsApp formatted string
  const waMsg = `*Table Reservation Request*\n*Booking ID:* ${reservationId}\n*Name:* ${newReservation.name}\n*Phone:* ${newReservation.phone}\n*Date:* ${newReservation.date}\n*Time:* ${newReservation.time}\n*Guests:* ${newReservation.guests}\n*Seating Style:* ${newReservation.seating}\n${newReservation.notes ? `*Notes:* ${newReservation.notes}` : ''}`;
  const whatsappUrl = `https://wa.me/919966888060?text=${encodeURIComponent(waMsg)}`;

  res.status(201).json({
    success: true,
    message: 'Table reservation received! Our team will welcome you.',
    reservation: newReservation,
    whatsappUrl
  });
});

// GET Reservations
app.get('/api/reservations', (req, res) => {
  const reservations = readJSON(RESERVATIONS_FILE, []);
  res.json(reservations);
});

// --------------------------------------------------------------------------
// Customer Authentication & Account Routes
// --------------------------------------------------------------------------

// Middleware to authenticate customer session
function authenticateCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.slice(7) 
    : (req.headers['x-customer-token'] || req.query.token);

  if (!token || !activeCustomerTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Please sign in to access your account.' });
  }

  const session = activeCustomerTokens.get(token);
  // 30-day session expiry
  if (Date.now() - session.createdAt > 30 * 24 * 60 * 60 * 1000) {
    activeCustomerTokens.delete(token);
    return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
  }

  req.customer = session;
  req.customer.token = token;
  next();
}

// POST Customer Register
app.post('/api/customer/register', (req, res) => {
  const { name, phone, email, password, line1, landmark, area } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your full name.' });
  }

  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
  }

  if (!password || password.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const customers = readJSON(CUSTOMERS_FILE, []);
  
  // Check for existing phone or email
  const existing = customers.find(c => 
    (c.phone && c.phone.replace(/\D/g, '') === cleanPhone) || 
    (email && c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase())
  );

  if (existing) {
    return res.status(409).json({ 
      success: false, 
      message: 'An account with this phone number or email already exists. Please sign in.' 
    });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password.trim(), salt);
  const customerId = `CUST-${Date.now().toString().slice(-6)}`;

  const newCustomer = {
    id: customerId,
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim().toLowerCase() : '',
    passwordHash,
    salt,
    address: {
      line1: line1 ? line1.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      area: area ? area.trim() : 'Maisammaguda, Hyderabad (500100)'
    },
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  customers.push(newCustomer);
  writeJSON(CUSTOMERS_FILE, customers);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  activeCustomerTokens.set(token, {
    customerId: newCustomer.id,
    name: newCustomer.name,
    phone: newCustomer.phone,
    email: newCustomer.email,
    createdAt: Date.now()
  });

  res.status(201).json({
    success: true,
    message: `Welcome to Tastify, ${newCustomer.name}! Your account has been created.`,
    token,
    customer: {
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address
    }
  });
});

// POST Customer Login
app.post('/api/customer/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Please provide phone/email and password.' });
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanDigits = identifier.replace(/\D/g, '');

  const customers = readJSON(CUSTOMERS_FILE, []);
  const customer = customers.find(c => {
    const custDigits = (c.phone || '').replace(/\D/g, '');
    const phoneMatch = cleanDigits.length >= 10 && custDigits.endsWith(cleanDigits.slice(-10));
    const emailMatch = c.email && c.email.trim().toLowerCase() === cleanIdentifier;
    return phoneMatch || emailMatch;
  });

  if (!customer) {
    return res.status(401).json({ 
      success: false, 
      message: 'Account not found. Please check your phone/email or create a new account.' 
    });
  }

  // Validate password
  let isValid = false;
  if (customer.salt && customer.passwordHash) {
    isValid = (hashPassword(password.trim(), customer.salt) === customer.passwordHash);
  } else if (customer.password) {
    isValid = (password.trim() === customer.password);
  }

  if (!isValid) {
    return res.status(401).json({ 
      success: false, 
      message: 'Incorrect password. Please try again.' 
    });
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  activeCustomerTokens.set(token, {
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    createdAt: Date.now()
  });

  customer.lastLogin = new Date().toISOString();
  writeJSON(CUSTOMERS_FILE, customers);

  res.json({
    success: true,
    message: `Welcome back, ${customer.name}!`,
    token,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || { line1: '', landmark: '', area: 'Maisammaguda, Hyderabad (500100)' }
    }
  });
});

// GET Customer Profile
app.get('/api/customer/profile', authenticateCustomer, (req, res) => {
  const customers = readJSON(CUSTOMERS_FILE, []);
  const customer = customers.find(c => c.id === req.customer.customerId);

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found.' });
  }

  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || { line1: '', landmark: '', area: 'Maisammaguda, Hyderabad (500100)' },
      createdAt: customer.createdAt
    }
  });
});

// PUT Customer Profile (Update name, email, address, or password)
app.put('/api/customer/profile', authenticateCustomer, (req, res) => {
  const { name, email, line1, landmark, area, currentPassword, newPassword } = req.body;
  const customers = readJSON(CUSTOMERS_FILE, []);
  const customer = customers.find(c => c.id === req.customer.customerId);

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer account not found.' });
  }

  if (name && name.trim()) customer.name = name.trim();
  if (email !== undefined) customer.email = email.trim().toLowerCase();

  customer.address = {
    line1: line1 !== undefined ? line1.trim() : (customer.address?.line1 || ''),
    landmark: landmark !== undefined ? landmark.trim() : (customer.address?.landmark || ''),
    area: area !== undefined ? area.trim() : (customer.address?.area || 'Maisammaguda, Hyderabad (500100)')
  };

  if (newPassword && newPassword.trim()) {
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Please enter your current password to change password.' });
    }
    let isCurrentValid = false;
    if (customer.salt && customer.passwordHash) {
      isCurrentValid = (hashPassword(currentPassword.trim(), customer.salt) === customer.passwordHash);
    } else if (customer.password) {
      isCurrentValid = (currentPassword.trim() === customer.password);
    }
    if (!isCurrentValid) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    customer.salt = newSalt;
    customer.passwordHash = hashPassword(newPassword.trim(), newSalt);
    delete customer.password;
  }

  customer.updatedAt = new Date().toISOString();
  writeJSON(CUSTOMERS_FILE, customers);

  // Update in-memory session name
  const session = activeCustomerTokens.get(req.customer.token);
  if (session) {
    session.name = customer.name;
    session.email = customer.email;
  }

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address
    }
  });
});

// GET Customer Orders
app.get('/api/customer/orders', (req, res) => {
  // Support both token and phone query
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.headers['x-customer-token'];
  
  let targetPhone = (req.query.phone || '').replace(/\D/g, '');
  let targetId = req.query.customerId || null;

  if (token && activeCustomerTokens.has(token)) {
    const session = activeCustomerTokens.get(token);
    targetId = targetId || session.customerId;
    targetPhone = targetPhone || (session.phone || '').replace(/\D/g, '');
  }

  if (!targetPhone && !targetId) {
    return res.status(400).json({ success: false, message: 'Please sign in or provide phone number to view orders.' });
  }

  const allOrders = readJSON(ORDERS_FILE, []);
  const matchingOrders = allOrders.filter(o => {
    if (targetId && o.customerId === targetId) return true;
    if (targetPhone && o.phone) {
      const orderPhoneDigits = o.phone.replace(/\D/g, '');
      return orderPhoneDigits.endsWith(targetPhone.slice(-10));
    }
    return false;
  });

  matchingOrders.forEach(ensureOrderTimestamps);

  res.json({
    success: true,
    count: matchingOrders.length,
    orders: matchingOrders
  });
});

// --------------------------------------------------------------------------
// Admin Authentication & Management Routes
// --------------------------------------------------------------------------

// Middleware to protect admin routes
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.slice(7) 
    : (req.headers['x-admin-token'] || req.query.token);

  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login to admin dashboard.' });
  }

  const session = activeAdminTokens.get(token);
  // 48-hour session expiry
  if (Date.now() - session.createdAt > 48 * 60 * 60 * 1000) {
    activeAdminTokens.delete(token);
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  req.adminUser = session;
  next();
}

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const adminData = readJSON(ADMIN_FILE, { username: 'admin', password: 'password123', name: 'Restaurant Manager' });

  if (username.trim() === adminData.username && password.trim() === adminData.password) {
    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.set(token, {
      username: adminData.username,
      name: adminData.name || 'Tastify Manager',
      createdAt: Date.now()
    });

    // Update lastLogin
    adminData.lastLogin = new Date().toISOString();
    writeJSON(ADMIN_FILE, adminData);

    return res.json({
      success: true,
      message: 'Login successful! Welcome to Tastify Admin.',
      token,
      user: {
        username: adminData.username,
        name: adminData.name || 'Tastify Manager'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password. Please verify your credentials.'
  });
});

// Admin Verify Session
app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser
  });
});

// Admin Change Credentials
app.post('/api/admin/change-credentials', authenticateAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword, name } = req.body;
  const adminData = readJSON(ADMIN_FILE, { username: 'admin', password: 'password123' });

  if (currentPassword !== adminData.password) {
    return res.status(400).json({ success: false, message: 'Current password does not match.' });
  }

  if (newUsername && newUsername.trim()) adminData.username = newUsername.trim();
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }
    adminData.password = newPassword.trim();
  }
  if (name && name.trim()) adminData.name = name.trim();
  adminData.updatedAt = new Date().toISOString();

  writeJSON(ADMIN_FILE, adminData);

  res.json({
    success: true,
    message: 'Admin credentials updated successfully! Please keep your new details safe.',
    username: adminData.username
  });
});

// Admin: Get All Orders
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  orders.forEach(ensureOrderTimestamps);
  res.json({ success: true, count: orders.length, orders });
});

// Admin: Update Order Status & Estimated Delivery Time
app.patch('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status, estimatedDeliveryTime } = req.body;
  const orders = readJSON(ORDERS_FILE, []);
  const order = orders.find(o => o.orderId === id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  if (status) {
    order.status = status;
    if (status === 'Preparing' && !order.acceptedAt) {
      order.acceptedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
  }
  if (estimatedDeliveryTime !== undefined && estimatedDeliveryTime.trim()) {
    order.estimatedDeliveryTime = estimatedDeliveryTime.trim();
    const match = order.estimatedDeliveryTime.match(/\d+/);
    const mins = match ? parseInt(match[0], 10) : 30;
    order.estimatedMinutes = mins;
    order.allottedAt = Date.now();
    order.targetDeliveryTimestamp = Date.now() + (mins * 60 * 1000);
    order.targetDeliveryClockTime = new Date(order.targetDeliveryTimestamp).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  order.updatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  writeJSON(ORDERS_FILE, orders);

  res.json({
    success: true,
    message: `Order #${id} updated: Status = ${order.status}${order.estimatedDeliveryTime ? `, Prep Time = ${order.estimatedDeliveryTime}` : ''}.`,
    order
  });
});

// Admin: Delete Order
app.delete('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  let orders = readJSON(ORDERS_FILE, []);
  const initialLength = orders.length;
  orders = orders.filter(o => o.orderId !== id);

  if (orders.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, message: `Order #${id} removed successfully.` });
});

// Admin: Get Menu Items
app.get('/api/admin/menu', authenticateAdmin, (req, res) => {
  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  res.json({ success: true, menu: menuData });
});

// Admin: Add New Dish
app.post('/api/admin/menu', authenticateAdmin, (req, res) => {
  const { name, nameTelugu, category, price, portion, description, image, isVeg, isSignature, isPopular, tags } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Dish name, price, and category are required.' });
  }

  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  const dishId = req.body.id || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now().toString().slice(-4);

  const newDish = {
    id: dishId,
    name: name.trim(),
    nameTelugu: (nameTelugu && nameTelugu.trim()) || '',
    category: category.trim(),
    price: Number(price),
    priceDisplay: `₹${price}`,
    priceRange: req.body.priceRange || `₹${price}`,
    portion: (portion && portion.trim()) || 'Single / Double',
    description: (description && description.trim()) || 'Freshly prepared Arabian dish crafted with authentic spices.',
    image: (image && image.trim()) || 'assets/images/hero-mandi.jpg',
    isVeg: Boolean(isVeg),
    isSignature: Boolean(isSignature),
    isPopular: Boolean(isPopular),
    isAvailable: true,
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : ['Tastify Special'])
  };

  menuData.items.push(newDish);
  writeJSON(MENU_FILE, menuData);

  res.status(201).json({ success: true, message: `Added ${newDish.name} to menu!`, item: newDish });
});

// Admin: Update Dish
app.put('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  const index = menuData.items.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Dish not found in menu.' });
  }

  const existing = menuData.items[index];
  const { name, nameTelugu, category, price, portion, description, image, isVeg, isSignature, isPopular, isAvailable, tags } = req.body;

  menuData.items[index] = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    nameTelugu: nameTelugu !== undefined ? nameTelugu.trim() : existing.nameTelugu,
    category: category !== undefined ? category.trim() : existing.category,
    price: price !== undefined ? Number(price) : existing.price,
    priceDisplay: price !== undefined ? `₹${price}` : existing.priceDisplay,
    portion: portion !== undefined ? portion.trim() : existing.portion,
    description: description !== undefined ? description.trim() : existing.description,
    image: image !== undefined ? image.trim() : existing.image,
    isVeg: isVeg !== undefined ? Boolean(isVeg) : existing.isVeg,
    isSignature: isSignature !== undefined ? Boolean(isSignature) : existing.isSignature,
    isPopular: isPopular !== undefined ? Boolean(isPopular) : existing.isPopular,
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : (existing.isAvailable !== undefined ? existing.isAvailable : true),
    tags: tags !== undefined ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : existing.tags
  };

  writeJSON(MENU_FILE, menuData);
  res.json({ success: true, message: `Dish updated successfully!`, item: menuData.items[index] });
});

// Admin: Toggle Dish Stock Availability
app.patch('/api/admin/menu/:id/toggle', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  const dish = menuData.items.find(item => item.id === id);

  if (!dish) {
    return res.status(404).json({ success: false, message: 'Dish not found.' });
  }

  dish.isAvailable = dish.isAvailable === false ? true : false;
  writeJSON(MENU_FILE, menuData);

  res.json({
    success: true,
    message: `${dish.name} is now ${dish.isAvailable ? 'In Stock (Available)' : 'Out of Stock (Hidden)'}.`,
    isAvailable: dish.isAvailable
  });
});

// Admin: Delete Dish
app.delete('/api/admin/menu/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const menuData = readJSON(MENU_FILE, { categories: [], items: [] });
  const initialLength = menuData.items.length;
  menuData.items = menuData.items.filter(item => item.id !== id);

  if (menuData.items.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Dish not found.' });
  }

  writeJSON(MENU_FILE, menuData);
  res.json({ success: true, message: 'Dish removed from menu.' });
});

// Admin: Get Reservations
app.get('/api/admin/reservations', authenticateAdmin, (req, res) => {
  const reservations = readJSON(RESERVATIONS_FILE, []);
  res.json({ success: true, count: reservations.length, reservations });
});

// Admin: Update Reservation Status
app.patch('/api/admin/reservations/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const reservations = readJSON(RESERVATIONS_FILE, []);
  const resv = reservations.find(r => r.reservationId === id);

  if (!resv) {
    return res.status(404).json({ success: false, message: 'Reservation not found.' });
  }

  if (status) resv.status = status;
  writeJSON(RESERVATIONS_FILE, reservations);

  res.json({ success: true, message: `Reservation #${id} updated to ${status}.`, reservation: resv });
});

// Admin: Real-time Dashboard Summary Stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const orders = readJSON(ORDERS_FILE, []);
  const reservations = readJSON(RESERVATIONS_FILE, []);
  const menuData = readJSON(MENU_FILE, { items: [] });
  const reviewsData = readJSON(REVIEWS_FILE, { rating: 4.3, reviewCount: 872 });

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'Received' || o.status === 'Preparing').length;
  const readyOrders = orders.filter(o => o.status === 'Ready').length;
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      pendingOrders,
      readyOrders,
      completedOrders,
      totalDishes: (menuData.items || []).length,
      totalReservations: reservations.length,
      averageRating: reviewsData.rating,
      totalReviews: reviewsData.reviewCount
    }
  });
});

// Route for /admin to serve admin.html
app.get('/admin', (req, res) => {
  const adminPublic = path.join(__dirname, 'public', 'admin.html');
  if (fs.existsSync(adminPublic)) {
    return res.sendFile(adminPublic);
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// --------------------------------------------------------------------------
// Serve Static Frontend Assets
// --------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  const indexPublic = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPublic)) {
    return res.sendFile(indexPublic);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Protect against unexpected runtime crashes
process.on('uncaughtException', (err) => {
  console.error('Handled server exception:', err.message);
});

// Start Server when executed directly (local, Render, VPS)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`\nWebsite URL: http://localhost:${PORT}\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n⚠️ Port ${PORT} is already in use by another process.`);
      console.log(`💡 To free it in Windows PowerShell, run:`);
      console.log(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
      console.log(`   or run on another port: $env:PORT="3001"; npm start\n`);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Export Express app for Vercel Serverless Functions
module.exports = app;

