/**
 * TASTIFY RESTAURANT ADMIN DASHBOARD JAVASCRIPT
 * Real-time order processing, menu catalog management, reservations & security
 */

(function () {
  'use strict';

  // State Management
  const STATE = {
    token: localStorage.getItem('tastify_admin_token') || null,
    user: JSON.parse(localStorage.getItem('tastify_admin_user') || 'null'),
    activeTab: 'orders',
    orderFilter: 'all',
    menuCategoryFilter: 'all',
    searchOrderQuery: '',
    searchMenuQuery: '',
    searchResQuery: '',
    orders: [],
    menuItems: [],
    reservations: [],
    stats: {},
    soundEnabled: localStorage.getItem('tastify_admin_sound') !== 'false',
    knownOrderIds: new Set(),
    pollInterval: null,
    countdownInterval: null,
    editingOrderId: null,
    audioCtx: null
  };

  // DOM Elements Cache
  const DOM = {
    loginScreen: document.getElementById('admin-login-screen'),
    dashboardApp: document.getElementById('admin-dashboard-app'),
    loginForm: document.getElementById('admin-login-form'),
    usernameInput: document.getElementById('admin-username'),
    passwordInput: document.getElementById('admin-password'),
    togglePwdBtn: document.getElementById('toggle-password-btn'),
    loginAlert: document.getElementById('login-alert'),
    sidebar: document.getElementById('admin-sidebar'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    navItems: document.querySelectorAll('.nav-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    currentTabHeading: document.getElementById('current-tab-heading'),
    currentTabSub: document.getElementById('current-tab-sub'),
    headerUserName: document.getElementById('header-user-name'),
    headerUserHandle: document.getElementById('header-user-handle'),
    btnLogout: document.getElementById('btn-logout'),
    btnRefresh: document.getElementById('btn-refresh-data'),
    btnSoundToggle: document.getElementById('btn-toggle-sound'),
    toastContainer: document.getElementById('toast-container'),

    // Stats
    statRevenue: document.getElementById('stat-revenue'),
    statPending: document.getElementById('stat-pending'),
    statReady: document.getElementById('stat-ready'),
    statDishes: document.getElementById('stat-dishes'),
    statReservations: document.getElementById('stat-reservations'),

    // Badges & Counters
    badgePendingOrders: document.getElementById('badge-pending-orders'),
    badgeMenuCount: document.getElementById('badge-menu-count'),
    badgeResCount: document.getElementById('badge-res-count'),
    countAllOrders: document.getElementById('count-all-orders'),
    countReceivedOrders: document.getElementById('count-received-orders'),
    countPreparingOrders: document.getElementById('count-preparing-orders'),
    countReadyOrders: document.getElementById('count-ready-orders'),
    countDeliveredOrders: document.getElementById('count-delivered-orders'),
    countCancelledOrders: document.getElementById('count-cancelled-orders'),

    // Orders Tab
    ordersContainer: document.getElementById('orders-list-container'),
    orderFilterPills: document.querySelectorAll('[data-order-filter]'),
    orderSearchInput: document.getElementById('order-search-input'),

    // Menu Tab
    menuContainer: document.getElementById('menu-items-grid'),
    menuCategoryFilter: document.getElementById('menu-category-filter'),
    menuSearchInput: document.getElementById('menu-search-input'),
    btnOpenAddDish: document.getElementById('btn-open-add-dish'),

    // Dish Modal
    dishModal: document.getElementById('dish-modal'),
    dishModalTitle: document.getElementById('dish-modal-title'),
    dishForm: document.getElementById('dish-form'),
    dishEditId: document.getElementById('dish-edit-id'),
    dishName: document.getElementById('dish-name'),
    dishNameTelugu: document.getElementById('dish-name-telugu'),
    dishCategory: document.getElementById('dish-category'),
    dishPrice: document.getElementById('dish-price'),
    dishPortion: document.getElementById('dish-portion'),
    dishDesc: document.getElementById('dish-desc'),
    dishImage: document.getElementById('dish-image'),
    dishImagePreview: document.getElementById('dish-image-preview'),
    dishIsVeg: document.getElementById('dish-is-veg'),
    dishIsSignature: document.getElementById('dish-is-signature'),
    dishIsPopular: document.getElementById('dish-is-popular'),
    btnCloseDishModal: document.getElementById('btn-close-dish-modal'),
    btnCancelDish: document.getElementById('btn-cancel-dish'),
    presetPills: document.querySelectorAll('.preset-pill'),

    // Reservations Tab
    reservationsContainer: document.getElementById('reservations-list-container'),
    resSearchInput: document.getElementById('res-search-input'),

    // Credentials / Settings Tab
    changeCredsForm: document.getElementById('change-credentials-form'),
    currentPasswordInput: document.getElementById('current-password'),
    newUsernameInput: document.getElementById('new-username'),
    newDisplayNameInput: document.getElementById('new-display-name'),
    newPasswordInput: document.getElementById('new-password'),
    confirmNewPasswordInput: document.getElementById('confirm-new-password'),
    securityAlert: document.getElementById('security-alert'),

    // KOT Modal
    kotModal: document.getElementById('kot-modal'),
    kotReceiptContent: document.getElementById('kot-receipt-content'),
    btnCloseKotModal: document.getElementById('btn-close-kot-modal'),
    btnCancelKot: document.getElementById('btn-cancel-kot'),
    btnPrintKot: document.getElementById('btn-print-kot'),

    // Edit Time Modal
    editTimeModal: document.getElementById('edit-time-modal'),
    editTimeOrderSubtitle: document.getElementById('edit-time-order-subtitle'),
    editTimeCustomerName: document.getElementById('edit-time-customer-name'),
    editTimeStatusPill: document.getElementById('edit-time-status-pill'),
    editTimeCurrentVal: document.getElementById('edit-time-current-val'),
    editTimeCustomInput: document.getElementById('edit-time-custom-input'),
    btnCloseEditTime: document.getElementById('btn-close-edit-time'),
    btnCancelEditTime: document.getElementById('btn-cancel-edit-time'),
    btnSaveEditTime: document.getElementById('btn-save-edit-time'),
    timeChoiceBtns: document.querySelectorAll('.btn-time-choice')
  };

  // Tab Title & Subtitle Mapping
  const TAB_TITLES = {
    orders: {
      heading: 'Customer Orders & Kitchen',
      sub: 'Real-time incoming orders, preparation status & customer alerts'
    },
    menu: {
      heading: 'Menu & Dishes Manager',
      sub: 'Add new specialties, edit pricing, or toggle items in/out of stock'
    },
    reservations: {
      heading: 'Table Reservations & Majlis',
      sub: 'Manage guest arrivals, seating styles, and floor majlis bookings'
    },
    settings: {
      heading: 'Admin Security & Access',
      sub: 'Update your username, password, and manager profile settings'
    }
  };

  // --------------------------------------------------------------------------
  // AUDIO NOTIFICATION (Web Audio API Synthesized Chime)
  // --------------------------------------------------------------------------
  function playNewOrderChime() {
    if (!STATE.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!STATE.audioCtx) STATE.audioCtx = new AudioCtx();
      if (STATE.audioCtx.state === 'suspended') {
        STATE.audioCtx.resume();
      }

      const now = STATE.audioCtx.currentTime;

      // Note 1 (D5 = 587.33 Hz)
      const osc1 = STATE.audioCtx.createOscillator();
      const gain1 = STATE.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(STATE.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2 (A5 = 880 Hz)
      const osc2 = STATE.audioCtx.createOscillator();
      const gain2 = STATE.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(STATE.audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.75);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${escapeHTML(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------------------------
  // API HELPER WITH AUTHORIZATION HEADERS
  // --------------------------------------------------------------------------
  async function apiFetch(endpoint, options = {}) {
    const headers = options.headers || {};
    if (STATE.token) {
      headers['Authorization'] = `Bearer ${STATE.token}`;
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    try {
      const response = await fetch(endpoint, { ...options, headers });
      if (response.status === 401) {
        // Token invalid or expired
        handleUnauthorized();
        throw new Error('Unauthorized session. Please login again.');
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  function handleUnauthorized() {
    STATE.token = null;
    STATE.user = null;
    localStorage.removeItem('tastify_admin_token');
    localStorage.removeItem('tastify_admin_user');
    clearInterval(STATE.pollInterval);
    clearInterval(STATE.countdownInterval);
    DOM.dashboardApp.style.display = 'none';
    DOM.loginScreen.style.display = 'flex';
    showLoginAlert('Your session has expired. Please sign in again.', 'error');
  }

  function showLoginAlert(msg, type = 'error') {
    DOM.loginAlert.style.display = 'flex';
    DOM.loginAlert.className = `admin-alert ${type}`;
    DOM.loginAlert.innerHTML = `
      <i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
      <span>${escapeHTML(msg)}</span>
    `;
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION & SESSION VERIFICATION
  // --------------------------------------------------------------------------
  async function init() {
    bindGlobalEvents();

    if (STATE.token) {
      try {
        const verifyRes = await apiFetch('/api/admin/verify');
        if (verifyRes.success) {
          STATE.user = verifyRes.user;
          enterDashboard();
          return;
        }
      } catch (err) {
        console.log('Session verification failed, showing login screen');
      }
    }

    // Default: Show login screen
    DOM.loginScreen.style.display = 'flex';
    DOM.dashboardApp.style.display = 'none';
  }

  function enterDashboard() {
    DOM.loginScreen.style.display = 'none';
    DOM.dashboardApp.style.display = 'flex';

    if (STATE.user) {
      DOM.headerUserName.textContent = STATE.user.name || 'Tastify Manager';
      DOM.headerUserHandle.textContent = `@${STATE.user.username || 'admin'}`;
    }

    // Load initial data
    loadAllDashboardData();

    // Start background live polling (every 6.5s)
    clearInterval(STATE.pollInterval);
    STATE.pollInterval = setInterval(fetchLiveOrders, 6500);

    // Start automatic live delivery countdown ticker (every 1s)
    clearInterval(STATE.countdownInterval);
    STATE.countdownInterval = setInterval(updateAllOrderCountdowns, 1000);
  }

  async function loadAllDashboardData() {
    await Promise.all([
      fetchLiveOrders(),
      fetchMenu(),
      fetchReservations(),
      fetchStats()
    ]);
  }

  // --------------------------------------------------------------------------
  // GLOBAL EVENT LISTENERS
  // --------------------------------------------------------------------------
  function bindGlobalEvents() {
    // Password visibility toggle
    DOM.togglePwdBtn.addEventListener('click', () => {
      const type = DOM.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      DOM.passwordInput.setAttribute('type', type);
      DOM.togglePwdBtn.querySelector('i').className = type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
    });

    // Login Form Submit
    DOM.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = DOM.usernameInput.value.trim();
      const password = DOM.passwordInput.value.trim();

      if (!username || !password) {
        showLoginAlert('Please enter both username and password.');
        return;
      }

      DOM.loginAlert.style.display = 'none';
      const submitBtn = document.getElementById('btn-login-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>`;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success && data.token) {
          STATE.token = data.token;
          STATE.user = data.user;
          localStorage.setItem('tastify_admin_token', data.token);
          localStorage.setItem('tastify_admin_user', JSON.stringify(data.user));

          showToast(`Welcome back, ${data.user.name || data.user.username}!`, 'success');
          enterDashboard();
        } else {
          showLoginAlert(data.message || 'Invalid credentials. Please try again.');
        }
      } catch (err) {
        showLoginAlert('Unable to reach server. Please ensure the backend is running.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Sign In to Dashboard</span> <i class="fa-solid fa-arrow-right"></i>`;
      }
    });

    // Logout
    DOM.btnLogout.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out of the Tastify Admin Portal?')) {
        handleUnauthorized();
        showLoginAlert('You have been signed out successfully.', 'success');
      }
    });

    // Refresh Data
    DOM.btnRefresh.addEventListener('click', () => {
      DOM.btnRefresh.querySelector('i').classList.add('fa-spin');
      loadAllDashboardData().finally(() => {
        setTimeout(() => DOM.btnRefresh.querySelector('i').classList.remove('fa-spin'), 600);
        showToast('Dashboard data refreshed.', 'info');
      });
    });

    // Sound Toggle
    DOM.btnSoundToggle.addEventListener('click', () => {
      STATE.soundEnabled = !STATE.soundEnabled;
      localStorage.setItem('tastify_admin_sound', String(STATE.soundEnabled));
      DOM.btnSoundToggle.classList.toggle('active', STATE.soundEnabled);
      DOM.btnSoundToggle.querySelector('i').className = STATE.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
      showToast(`Audio chime ${STATE.soundEnabled ? 'Enabled' : 'Muted'}`, 'info');
      if (STATE.soundEnabled) playNewOrderChime();
    });

    // Sidebar Mobile Toggle
    DOM.sidebarToggle.addEventListener('click', () => {
      DOM.sidebar.classList.toggle('open');
    });

    // Tab Navigation
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
        if (window.innerWidth <= 992) {
          DOM.sidebar.classList.remove('open');
        }
      });
    });

    // Order Filter Pills
    DOM.orderFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        DOM.orderFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        STATE.orderFilter = pill.getAttribute('data-order-filter');
        renderOrders();
      });
    });

    // Order Search
    DOM.orderSearchInput.addEventListener('input', (e) => {
      STATE.searchOrderQuery = e.target.value.toLowerCase().trim();
      renderOrders();
    });

    // Menu Category Filter
    DOM.menuCategoryFilter.addEventListener('change', (e) => {
      STATE.menuCategoryFilter = e.target.value;
      renderMenu();
    });

    // Menu Search
    DOM.menuSearchInput.addEventListener('input', (e) => {
      STATE.searchMenuQuery = e.target.value.toLowerCase().trim();
      renderMenu();
    });

    // Reservations Search
    DOM.resSearchInput.addEventListener('input', (e) => {
      STATE.searchResQuery = e.target.value.toLowerCase().trim();
      renderReservations();
    });

    // Add Dish Modal Open
    DOM.btnOpenAddDish.addEventListener('click', () => {
      openDishModal();
    });

    // Close Dish Modal
    DOM.btnCloseDishModal.addEventListener('click', closeDishModal);
    DOM.btnCancelDish.addEventListener('click', closeDishModal);

    // Preset Image Pills
    DOM.presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const imgPath = pill.getAttribute('data-img');
        DOM.dishImage.value = imgPath;
        DOM.dishImagePreview.src = imgPath;
      });
    });

    // Live Dish Image Input Preview
    DOM.dishImage.addEventListener('input', (e) => {
      DOM.dishImagePreview.src = e.target.value || 'assets/images/hero-mandi.jpg';
    });
    DOM.dishImagePreview.addEventListener('error', () => {
      DOM.dishImagePreview.src = 'assets/images/hero-mandi.jpg';
    });

    // Dish Form Submit (Create / Edit)
    DOM.dishForm.addEventListener('submit', handleDishFormSubmit);

    // Change Credentials Form Submit
    DOM.changeCredsForm.addEventListener('submit', handleChangeCredentialsSubmit);

    // KOT Modal Close & Print
    DOM.btnCloseKotModal.addEventListener('click', () => DOM.kotModal.style.display = 'none');
    DOM.btnCancelKot.addEventListener('click', () => DOM.kotModal.style.display = 'none');
    DOM.btnPrintKot.addEventListener('click', () => window.print());

    // Edit Time Modal Event Listeners
    if (DOM.btnCloseEditTime) DOM.btnCloseEditTime.addEventListener('click', closeEditTimeModal);
    if (DOM.btnCancelEditTime) DOM.btnCancelEditTime.addEventListener('click', closeEditTimeModal);
    if (DOM.editTimeModal) {
      DOM.editTimeModal.addEventListener('click', (e) => {
        if (e.target === DOM.editTimeModal) closeEditTimeModal();
      });
    }

    if (DOM.timeChoiceBtns) {
      DOM.timeChoiceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          DOM.timeChoiceBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const timeVal = btn.getAttribute('data-time') || '30 mins';
          if (DOM.editTimeCustomInput) DOM.editTimeCustomInput.value = timeVal;
        });
      });
    }

    if (DOM.btnSaveEditTime) {
      DOM.btnSaveEditTime.addEventListener('click', handleSaveEditTimeModal);
    }
  }

  function switchTab(tabId) {
    STATE.activeTab = tabId;

    DOM.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
    });

    DOM.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    if (TAB_TITLES[tabId]) {
      DOM.currentTabHeading.textContent = TAB_TITLES[tabId].heading;
      DOM.currentTabSub.textContent = TAB_TITLES[tabId].sub;
    }
  }

  // --------------------------------------------------------------------------
  // LIVE ORDERS FETCH & RENDER
  // --------------------------------------------------------------------------
  async function fetchLiveOrders() {
    try {
      const data = await apiFetch('/api/admin/orders');
      if (data && data.success) {
        const prevCount = STATE.orders.length;
        STATE.orders = data.orders || [];

        // Check for new incoming orders
        let hasNewOrder = false;
        STATE.orders.forEach(order => {
          if (!STATE.knownOrderIds.has(order.orderId)) {
            STATE.knownOrderIds.add(order.orderId);
            if (prevCount > 0) {
              hasNewOrder = true;
            }
          }
        });

        if (hasNewOrder) {
          playNewOrderChime();
          showToast('🔔 New Customer Order Received!', 'success');
        }

        updateOrderCounts();
        renderOrders();
        fetchStats();
      }
    } catch (err) {
      console.warn('Orders poll error:', err);
    }
  }

  function updateOrderCounts() {
    const all = STATE.orders.length;
    const received = STATE.orders.filter(o => o.status === 'Received').length;
    const preparing = STATE.orders.filter(o => o.status === 'Preparing').length;
    const ready = STATE.orders.filter(o => o.status === 'Ready').length;
    const delivered = STATE.orders.filter(o => o.status === 'Delivered').length;
    const cancelled = STATE.orders.filter(o => o.status === 'Cancelled').length;

    DOM.countAllOrders.textContent = all;
    DOM.countReceivedOrders.textContent = received;
    DOM.countPreparingOrders.textContent = preparing;
    DOM.countReadyOrders.textContent = ready;
    DOM.countDeliveredOrders.textContent = delivered;
    DOM.countCancelledOrders.textContent = cancelled;

    const pendingTotal = received + preparing;
    if (pendingTotal > 0) {
      DOM.badgePendingOrders.style.display = 'inline-block';
      DOM.badgePendingOrders.textContent = pendingTotal;
    } else {
      DOM.badgePendingOrders.style.display = 'none';
    }
  }

  function renderOrders() {
    let filtered = [...STATE.orders];

    // Filter by status
    if (STATE.orderFilter !== 'all') {
      filtered = filtered.filter(o => o.status === STATE.orderFilter);
    }

    // Filter by search query
    if (STATE.searchOrderQuery) {
      const q = STATE.searchOrderQuery;
      filtered = filtered.filter(o =>
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.phone && o.phone.toLowerCase().includes(q)) ||
        (o.address && o.address.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      DOM.ordersContainer.innerHTML = `
        <div class="admin-empty-state">
          <i class="fa-solid fa-bell-concierge"></i>
          <p>No orders matching "${STATE.orderFilter !== 'all' ? STATE.orderFilter : 'current filter'}".</p>
        </div>
      `;
      return;
    }

    DOM.ordersContainer.innerHTML = filtered.map(order => createOrderCardHTML(order)).join('');

    // Attach order actions
    DOM.ordersContainer.querySelectorAll('.status-change-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = select.getAttribute('data-order-id');
        const newStatus = select.value;
        await updateOrderStatus(orderId, newStatus);
      });
    });

    // Time Preset Buttons
    DOM.ordersContainer.querySelectorAll('.btn-time-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const timeVal = btn.getAttribute('data-time');
        const input = document.getElementById(`custom-time-${orderId}`);
        if (input) input.value = timeVal;
        
        // Highlight active preset in this card
        const card = document.getElementById(`order-${orderId}`);
        if (card) {
          card.querySelectorAll('.btn-time-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Accept Order & Set Delivery Time Trigger (Luxury Gold Theme)
    DOM.ordersContainer.querySelectorAll('.btn-accept-order-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-order-id');
        const input = document.getElementById(`custom-time-${orderId}`);
        const deliveryTime = (input && input.value.trim()) ? input.value.trim() : '30 mins';

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Accepting...</span>`;

        try {
          const res = await apiFetch(`/api/admin/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'Preparing',
              estimatedDeliveryTime: deliveryTime
            })
          });

          if (res && res.success && res.order) {
            showToast(`Order #${orderId} accepted! Delivery timer running (${deliveryTime}).`, 'success');
            const target = STATE.orders.find(o => o.orderId === orderId);
            if (target) {
              Object.assign(target, res.order);
            }
            updateOrderCounts();
            renderOrders();
            fetchStats();
          } else {
            showToast('Failed to accept order.', 'error');
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Accept &amp; Start Timer</span>`;
          }
        } catch (err) {
          showToast('Error updating order.', 'error');
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Accept &amp; Start Timer</span>`;
        }
      });
    });

    // Edit Delivery Time Button (Opens Arabian-themed Modal)
    DOM.ordersContainer.querySelectorAll('.btn-edit-time-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        openEditTimeModal(orderId);
      });
    });

    DOM.ordersContainer.querySelectorAll('.btn-print-kot-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const order = STATE.orders.find(o => o.orderId === orderId);
        if (order) openKOTModal(order);
      });
    });

    DOM.ordersContainer.querySelectorAll('.btn-delete-order-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.getAttribute('data-order-id');
        if (confirm(`Are you sure you want to permanently delete Order #${orderId}?`)) {
          await deleteOrder(orderId);
        }
      });
    });

    // Immediately calculate and run live second-by-second countdowns
    updateAllOrderCountdowns();
  }

  function createOrderCardHTML(order) {
    const statusClass = (order.status || 'Received').toLowerCase();
    const cleanPhone = (order.phone || '').replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const waMessage = encodeURIComponent(
      `Hello ${order.customerName || 'Guest'}! This is Tastify Arabian Mandi. Your order #${order.orderId} (Total: ₹${order.grandTotal}) is *${order.status}*${order.estimatedDeliveryTime ? ` with approx delivery in *${order.estimatedDeliveryTime}*` : ''}. Thank you!`
    );

    const itemsHTML = (order.items || []).map(item => `
      <div class="order-item-row">
        <div class="item-qty-name">
          <span class="item-qty-badge">${item.quantity || 1}x</span>
          <span>${escapeHTML(item.name || 'Dish')}</span>
        </div>
        <span class="item-total-price">₹${item.itemTotal || item.price || 0}</span>
      </div>
    `).join('');

    const hasEstimatedTime = order.estimatedDeliveryTime && !order.estimatedDeliveryTime.toLowerCase().includes('waiting');

    return `
      <div class="order-card status-${statusClass}" id="order-${order.orderId}">
        <div class="order-header">
          <div class="order-id-wrap">
            <span class="order-id">#${escapeHTML(order.orderId)}</span>
            <span class="order-time"><i class="fa-regular fa-clock"></i> ${escapeHTML(order.createdAt || 'Just now')}</span>
          </div>
          <span class="status-badge ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i>
            ${escapeHTML(order.status || 'Received')}
          </span>
        </div>

        <div class="order-customer-box">
          <div class="customer-name-row">
            <span><i class="fa-solid fa-user" style="color: var(--color-gold); margin-right: 0.35rem;"></i> ${escapeHTML(order.customerName || 'Anonymous Customer')}</span>
            <div class="customer-actions">
              ${cleanPhone ? `
                <a href="tel:${cleanPhone}" class="btn-mini-contact phone" title="Call Customer">
                  <i class="fa-solid fa-phone"></i>
                </a>
                <a href="whatsapp://send?phone=${waPhone}&text=${waMessage}" class="btn-mini-contact whatsapp" title="Chat on WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i>
                </a>
              ` : ''}
            </div>
          </div>
          <div class="customer-phone"><i class="fa-solid fa-phone-volume"></i> ${escapeHTML(order.phone || 'No phone provided')}</div>
          <div class="customer-address">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHTML(order.deliveryType ? order.deliveryType.toUpperCase() + ' — ' : '')}${escapeHTML(order.address || 'Dining at Tastify')}</span>
          </div>
        </div>

        <div class="order-items-list">
          ${itemsHTML}
        </div>

        ${order.specialInstructions ? `
          <div class="order-instructions-box">
            <strong>Note:</strong> ${escapeHTML(order.specialInstructions)}
          </div>
        ` : ''}

        <div class="order-summary-box">
          <div class="order-calc-row">
            <span>Subtotal</span>
            <span>₹${order.subtotal || 0}</span>
          </div>
          <div class="order-calc-row">
            <span>GST / Taxes</span>
            <span>₹${order.tax || 0}</span>
          </div>
          <div class="order-grand-row">
            <span>Grand Total</span>
            <span>₹${order.grandTotal || 0}</span>
          </div>
        </div>

        <!-- Order Acceptance Box (When order is new / Received) -->
        ${order.status === 'Received' ? `
          <div class="order-accept-box">
            <div class="accept-box-title">
              <i class="fa-solid fa-bell-concierge"></i>
              <span>Accept Order &amp; Set Approx Delivery Time:</span>
            </div>
            <div class="accept-time-presets">
              <button type="button" class="btn-time-preset" data-order-id="${order.orderId}" data-time="20 mins">20 Mins</button>
              <button type="button" class="btn-time-preset active" data-order-id="${order.orderId}" data-time="30 mins">30 Mins</button>
              <button type="button" class="btn-time-preset" data-order-id="${order.orderId}" data-time="40 mins">40 Mins</button>
              <button type="button" class="btn-time-preset" data-order-id="${order.orderId}" data-time="50 mins">50 Mins</button>
            </div>
            <div class="time-input-group">
              <input type="text" id="custom-time-${order.orderId}" class="admin-input-sm" value="30 mins" placeholder="e.g. 30 mins" />
              <button type="button" class="btn-accept-order-trigger" data-order-id="${order.orderId}">
                <i class="fa-solid fa-check"></i>
                <span>Accept &amp; Start Timer</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Live Running Delivery Time Badge (Arabian luxury themed with auto ticking timer) -->
        ${hasEstimatedTime ? `
          <div class="order-delivery-time-badge" id="time-badge-${order.orderId}">
            <div class="time-badge-top-row">
              <div class="time-badge-left">
                <div class="time-badge-icon-wrap ticking">
                  <i class="fa-solid fa-stopwatch"></i>
                </div>
                <div>
                  <div class="order-live-countdown-val" 
                       id="timer-val-${order.orderId}" 
                       data-target-ts="${order.targetDeliveryTimestamp || ''}"
                       data-total-mins="${order.estimatedMinutes || 30}"
                       data-clock-time="${order.targetDeliveryClockTime || ''}">
                    ⏱️ Calculating timer...
                  </div>
                  <span class="time-badge-target-clock">
                    Target: <strong>${order.targetDeliveryClockTime || escapeHTML(order.estimatedDeliveryTime)}</strong> (Allotted: ${escapeHTML(order.estimatedDeliveryTime)})
                  </span>
                </div>
              </div>

              <button type="button" class="btn-edit-time-trigger" data-order-id="${order.orderId}" title="Adjust Estimated Delivery Time">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>Edit Time</span>
              </button>
            </div>

            <!-- Mini Prep Progress Bar -->
            <div class="order-timer-progress-wrap">
              <div class="order-timer-progress-bar" id="progress-bar-${order.orderId}" style="width: 100%;"></div>
            </div>
          </div>
        ` : ''}

        <div class="order-actions-bar">
          <select class="status-change-select" data-order-id="${order.orderId}">
            <option value="Received" ${order.status === 'Received' ? 'selected' : ''}>🟡 Status: Received (New)</option>
            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>🟠 Status: Preparing (In Kitchen)</option>
            <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>🔵 Status: Ready for Pickup/Delivery</option>
            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>🟢 Status: Delivered / Completed</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>🔴 Status: Cancelled</option>
          </select>

          <div class="order-extra-btns">
            <button type="button" class="btn-order-action btn-print-kot-trigger" data-order-id="${order.orderId}">
              <i class="fa-solid fa-print"></i> KOT Print
            </button>
            <button type="button" class="btn-order-action danger btn-delete-order-trigger" data-order-id="${order.orderId}">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.success) {
        showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
        const target = STATE.orders.find(o => o.orderId === orderId);
        if (target) target.status = newStatus;
        updateOrderCounts();
        renderOrders();
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    }
  }

  async function deleteOrder(orderId) {
    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        showToast(`Order #${orderId} removed.`, 'info');
        STATE.orders = STATE.orders.filter(o => o.orderId !== orderId);
        updateOrderCounts();
        renderOrders();
        fetchStats();
      }
    } catch (err) {
      showToast('Failed to delete order.', 'error');
    }
  }

  // --------------------------------------------------------------------------
  // EDIT DELIVERY TIME MODAL FUNCTIONS (IN-THEME OBSIDIAN & GOLD)
  // --------------------------------------------------------------------------
  function openEditTimeModal(orderId) {
    const order = STATE.orders.find(o => o.orderId === orderId);
    if (!order) return;

    STATE.editingOrderId = orderId;
    if (DOM.editTimeOrderSubtitle) DOM.editTimeOrderSubtitle.textContent = `Order #${order.orderId}`;
    if (DOM.editTimeCustomerName) DOM.editTimeCustomerName.textContent = order.customerName || 'Customer';
    if (DOM.editTimeStatusPill) DOM.editTimeStatusPill.textContent = order.status || 'Preparing';
    if (DOM.editTimeCurrentVal) DOM.editTimeCurrentVal.textContent = order.estimatedDeliveryTime || '30 mins';
    if (DOM.editTimeCustomInput) DOM.editTimeCustomInput.value = order.estimatedDeliveryTime || '30 mins';

    // Highlight matching choice pill if exists
    if (DOM.timeChoiceBtns) {
      DOM.timeChoiceBtns.forEach(btn => {
        const timeVal = btn.getAttribute('data-time');
        btn.classList.toggle('active', timeVal === (order.estimatedDeliveryTime || '30 mins'));
      });
    }

    if (DOM.editTimeModal) DOM.editTimeModal.style.display = 'flex';
    if (DOM.editTimeCustomInput) DOM.editTimeCustomInput.focus();
  }

  function closeEditTimeModal() {
    if (DOM.editTimeModal) DOM.editTimeModal.style.display = 'none';
    STATE.editingOrderId = null;
  }

  async function handleSaveEditTimeModal() {
    if (!STATE.editingOrderId) return;
    const orderId = STATE.editingOrderId;
    const inputVal = (DOM.editTimeCustomInput && DOM.editTimeCustomInput.value.trim()) ? DOM.editTimeCustomInput.value.trim() : '30 mins';

    DOM.btnSaveEditTime.disabled = true;
    DOM.btnSaveEditTime.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

    try {
      const res = await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estimatedDeliveryTime: inputVal })
      });

      if (res && res.success && res.order) {
        showToast(`Delivery time updated to ${inputVal}! Timer running.`, 'success');
        const order = STATE.orders.find(o => o.orderId === orderId);
        if (order) {
          Object.assign(order, res.order);
        }
        closeEditTimeModal();
        renderOrders();
      } else {
        showToast('Failed to update delivery time.', 'error');
      }
    } catch (err) {
      showToast('Error updating delivery time.', 'error');
    } finally {
      DOM.btnSaveEditTime.disabled = false;
      DOM.btnSaveEditTime.innerHTML = `<i class="fa-solid fa-check"></i> <span>Save &amp; Start Timer</span>`;
    }
  }

  // --------------------------------------------------------------------------
  // AUTOMATIC LIVE DELIVERY COUNTDOWN TICKER (RUNS SECOND-BY-SECOND)
  // --------------------------------------------------------------------------
  function updateAllOrderCountdowns() {
    const countdownEls = document.querySelectorAll('.order-live-countdown-val[data-target-ts]');
    if (!countdownEls.length) return;
    const now = Date.now();

    countdownEls.forEach(el => {
      const orderId = el.id.replace('timer-val-', '');
      const order = STATE.orders.find(o => o.orderId === orderId);
      
      let targetTs = parseInt(el.getAttribute('data-target-ts'), 10);
      if (isNaN(targetTs) || targetTs <= 0) {
        if (order && order.targetDeliveryTimestamp) {
          targetTs = order.targetDeliveryTimestamp;
          el.setAttribute('data-target-ts', targetTs);
        } else if (order && order.estimatedDeliveryTime && !order.estimatedDeliveryTime.toLowerCase().includes('waiting')) {
          const match = order.estimatedDeliveryTime.match(/\d+/);
          const mins = match ? parseInt(match[0], 10) : 30;
          const base = order.allottedAt || (order.acceptedAt ? new Date(order.acceptedAt).getTime() : now);
          targetTs = (isNaN(base) ? now : base) + (mins * 60 * 1000);
          order.targetDeliveryTimestamp = targetTs;
          el.setAttribute('data-target-ts', targetTs);
        }
      }

      if (!targetTs) return;

      const totalMins = parseInt(el.getAttribute('data-total-mins'), 10) || 30;
      const totalMs = totalMins * 60 * 1000;
      const remainingMs = targetTs - now;
      const progressBar = document.getElementById(`progress-bar-${orderId}`);

      if (remainingMs > 0) {
        const totalSec = Math.floor(remainingMs / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        const secStr = s < 10 ? `0${s}` : `${s}`;
        
        el.innerHTML = `<i class="fa-solid fa-stopwatch" style="margin-right: 0.35rem; color: var(--color-gold);"></i>${m}m ${secStr}s remaining`;
        el.classList.remove('expired');

        if (progressBar) {
          const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
          progressBar.style.width = `${pct}%`;
          progressBar.classList.toggle('urgent', pct < 20);
        }
      } else {
        el.innerHTML = `<i class="fa-solid fa-bell" style="margin-right: 0.35rem; color: #EF4444;"></i>🚨 Time Reached • Ready for Dispatch`;
        el.classList.add('expired');
        if (progressBar) {
          progressBar.style.width = '0%';
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // MENU ITEMS MANAGER FETCH & RENDER
  // --------------------------------------------------------------------------
  async function fetchMenu() {
    try {
      const data = await apiFetch('/api/admin/menu');
      if (data && data.success && data.menu) {
        STATE.menuItems = data.menu.items || [];
        DOM.badgeMenuCount.textContent = STATE.menuItems.length;
        renderMenu();
      }
    } catch (err) {
      console.warn('Menu fetch error:', err);
    }
  }

  function renderMenu() {
    let filtered = [...STATE.menuItems];

    if (STATE.menuCategoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === STATE.menuCategoryFilter);
    }

    if (STATE.searchMenuQuery) {
      const q = STATE.searchMenuQuery;
      filtered = filtered.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.nameTelugu && item.nameTelugu.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      DOM.menuContainer.innerHTML = `
        <div class="admin-empty-state">
          <i class="fa-solid fa-utensils"></i>
          <p>No dishes found matching your filter.</p>
        </div>
      `;
      return;
    }

    DOM.menuContainer.innerHTML = filtered.map(dish => createDishCardHTML(dish)).join('');

    // Attach Toggle Switch Listeners
    DOM.menuContainer.querySelectorAll('.stock-toggle-input').forEach(checkbox => {
      checkbox.addEventListener('change', async () => {
        const dishId = checkbox.getAttribute('data-dish-id');
        await toggleDishStock(dishId, checkbox);
      });
    });

    // Attach Edit Dish Listeners
    DOM.menuContainer.querySelectorAll('.btn-edit-dish-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const dishId = btn.getAttribute('data-dish-id');
        const dish = STATE.menuItems.find(d => d.id === dishId);
        if (dish) openDishModal(dish);
      });
    });

    // Attach Delete Dish Listeners
    DOM.menuContainer.querySelectorAll('.btn-delete-dish-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dishId = btn.getAttribute('data-dish-id');
        const dish = STATE.menuItems.find(d => d.id === dishId);
        if (dish && confirm(`Delete "${dish.name}" from the menu permanently?`)) {
          await deleteDish(dishId);
        }
      });
    });
  }

  function createDishCardHTML(dish) {
    const isAvailable = dish.isAvailable !== false;
    const isVeg = Boolean(dish.isVeg);

    return `
      <div class="menu-admin-card ${!isAvailable ? 'out-of-stock' : ''}" id="dish-${dish.id}">
        <div class="dish-image-wrap">
          <img src="${escapeHTML(dish.image ? (dish.image.startsWith('http') || dish.image.startsWith('/') ? dish.image : '/' + dish.image) : '/assets/images/hero-mandi.jpg')}" alt="${escapeHTML(dish.name)}" class="dish-thumb" onerror="this.src='/assets/images/hero-mandi.jpg'" />
          <span class="dish-category-tag">${escapeHTML(dish.category || 'Mandi')}</span>
          <span class="dish-veg-tag ${isVeg ? 'veg' : 'non-veg'}">
            <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i>
            ${isVeg ? 'VEG' : 'NON-VEG'}
          </span>
          ${!isAvailable ? `<span class="dish-stock-overlay">Out of Stock</span>` : ''}
        </div>

        <div class="dish-card-body">
          <div class="dish-title-row">
            <h4 class="dish-name-main">${escapeHTML(dish.name)}</h4>
            <span class="dish-price-tag">₹${dish.price}</span>
          </div>
          ${dish.nameTelugu ? `<div class="dish-name-telugu">${escapeHTML(dish.nameTelugu)}</div>` : ''}
          <p class="dish-desc-snippet">${escapeHTML(dish.description || 'Authentic Arabian delicacy prepared fresh daily.')}</p>

          <div class="dish-stock-toggle-box">
            <span class="stock-toggle-label">
              <i class="fa-solid ${isAvailable ? 'fa-check text-success' : 'fa-ban text-danger'}"></i>
              ${isAvailable ? 'In Stock (Available)' : 'Out of Stock (Hidden)'}
            </span>
            <label class="switch">
              <input type="checkbox" class="stock-toggle-input" data-dish-id="${dish.id}" ${isAvailable ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          </div>

          <div class="dish-card-actions">
            <button type="button" class="btn-admin-secondary btn-edit-dish-trigger" data-dish-id="${dish.id}">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button type="button" class="btn-admin-secondary btn-delete-dish-trigger" data-dish-id="${dish.id}" style="color: var(--color-danger);">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async function toggleDishStock(dishId, checkbox) {
    try {
      const res = await apiFetch(`/api/admin/menu/${dishId}/toggle`, {
        method: 'PATCH'
      });
      if (res && res.success) {
        showToast(res.message, 'success');
        const dish = STATE.menuItems.find(d => d.id === dishId);
        if (dish) dish.isAvailable = res.isAvailable;
        renderMenu();
        fetchStats();
      }
    } catch (err) {
      checkbox.checked = !checkbox.checked;
      showToast('Could not toggle stock availability.', 'error');
    }
  }

  async function deleteDish(dishId) {
    try {
      const res = await apiFetch(`/api/admin/menu/${dishId}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        showToast(res.message, 'info');
        STATE.menuItems = STATE.menuItems.filter(d => d.id !== dishId);
        DOM.badgeMenuCount.textContent = STATE.menuItems.length;
        renderMenu();
        fetchStats();
      }
    } catch (err) {
      showToast('Could not delete dish.', 'error');
    }
  }

  // Dish Modal Open/Close
  function openDishModal(dish = null) {
    DOM.dishForm.reset();
    if (dish) {
      DOM.dishModalTitle.textContent = 'Edit Menu Dish';
      DOM.dishEditId.value = dish.id;
      DOM.dishName.value = dish.name || '';
      DOM.dishNameTelugu.value = dish.nameTelugu || '';
      DOM.dishCategory.value = dish.category || 'mandi';
      DOM.dishPrice.value = dish.price || '';
      DOM.dishPortion.value = dish.portion || '';
      DOM.dishDesc.value = dish.description || '';
      DOM.dishImage.value = dish.image || 'assets/images/hero-mandi.jpg';
      DOM.dishImagePreview.src = dish.image || 'assets/images/hero-mandi.jpg';
      DOM.dishIsVeg.checked = Boolean(dish.isVeg);
      DOM.dishIsSignature.checked = Boolean(dish.isSignature);
      DOM.dishIsPopular.checked = Boolean(dish.isPopular);
    } else {
      DOM.dishModalTitle.textContent = 'Add New Dish to Menu';
      DOM.dishEditId.value = '';
      DOM.dishImage.value = 'assets/images/hero-mandi.jpg';
      DOM.dishImagePreview.src = 'assets/images/hero-mandi.jpg';
      DOM.dishIsPopular.checked = true;
    }
    DOM.dishModal.style.display = 'flex';
  }

  function closeDishModal() {
    DOM.dishModal.style.display = 'none';
  }

  async function handleDishFormSubmit(e) {
    e.preventDefault();
    const editId = DOM.dishEditId.value;

    const payload = {
      name: DOM.dishName.value.trim(),
      nameTelugu: DOM.dishNameTelugu.value.trim(),
      category: DOM.dishCategory.value,
      price: Number(DOM.dishPrice.value),
      portion: DOM.dishPortion.value.trim() || 'Single / Double',
      description: DOM.dishDesc.value.trim(),
      image: DOM.dishImage.value.trim() || 'assets/images/hero-mandi.jpg',
      isVeg: DOM.dishIsVeg.checked,
      isSignature: DOM.dishIsSignature.checked,
      isPopular: DOM.dishIsPopular.checked
    };

    const endpoint = editId ? `/api/admin/menu/${editId}` : '/api/admin/menu';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (res && res.success) {
        showToast(res.message || 'Menu updated successfully!', 'success');
        closeDishModal();
        await fetchMenu();
        fetchStats();
      } else {
        showToast(res.message || 'Error saving dish.', 'error');
      }
    } catch (err) {
      showToast('Failed to save dish.', 'error');
    }
  }

  // --------------------------------------------------------------------------
  // TABLE RESERVATIONS FETCH & RENDER
  // --------------------------------------------------------------------------
  async function fetchReservations() {
    try {
      const data = await apiFetch('/api/admin/reservations');
      if (data && data.success) {
        STATE.reservations = data.reservations || [];
        DOM.badgeResCount.textContent = STATE.reservations.length;
        renderReservations();
      }
    } catch (err) {
      console.warn('Reservations fetch error:', err);
    }
  }

  function renderReservations() {
    let filtered = [...STATE.reservations];

    if (STATE.searchResQuery) {
      const q = STATE.searchResQuery;
      filtered = filtered.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.reservationId && r.reservationId.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      DOM.reservationsContainer.innerHTML = `
        <div class="admin-empty-state">
          <i class="fa-solid fa-calendar-xmark"></i>
          <p>No table reservations matching your search.</p>
        </div>
      `;
      return;
    }

    DOM.reservationsContainer.innerHTML = filtered.map(resv => {
      const cleanPhone = (resv.phone || '').replace(/\D/g, '');
      const waPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const waMessage = encodeURIComponent(
        `Hello ${resv.name}! Your table reservation #${resv.reservationId} at Tastify for ${resv.guests || 'your group'} on ${resv.date} at ${resv.time} is *Confirmed*. We look forward to welcoming you!`
      );

      return `
        <div class="res-card">
          <div class="res-header">
            <div>
              <span class="res-id">#${escapeHTML(resv.reservationId || 'RES')}</span>
              <div class="res-created"><i class="fa-regular fa-clock"></i> ${escapeHTML(resv.createdAt || '')}</div>
            </div>
            <span class="status-badge delivered">${escapeHTML(resv.status || 'Confirmed')}</span>
          </div>

          <h4 class="res-guest-name">${escapeHTML(resv.name || 'Guest')}</h4>

          <div class="res-details-list">
            <div class="res-detail-item">
              <i class="fa-solid fa-phone"></i>
              <span>${escapeHTML(resv.phone || 'N/A')}</span>
              ${cleanPhone ? `
                <a href="whatsapp://send?phone=${waPhone}&text=${waMessage}" class="btn-mini-contact whatsapp" style="margin-left: auto;" title="Confirm on WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i>
                </a>
              ` : ''}
            </div>
            <div class="res-detail-item">
              <i class="fa-regular fa-calendar"></i>
              <span>Date: <strong>${escapeHTML(resv.date || '')}</strong> at <strong>${escapeHTML(resv.time || '')}</strong></span>
            </div>
            <div class="res-detail-item">
              <i class="fa-solid fa-user-group"></i>
              <span>Guests: ${escapeHTML(resv.guests || '4 Guests')}</span>
            </div>
            <div class="res-detail-item">
              <i class="fa-solid fa-couch"></i>
              <span>Seating: ${escapeHTML(resv.seating || 'Traditional Floor Majlis')}</span>
            </div>
            ${resv.notes ? `
              <div class="res-detail-item">
                <i class="fa-solid fa-comment-dots"></i>
                <span>Notes: ${escapeHTML(resv.notes)}</span>
              </div>
            ` : ''}
          </div>

          <select class="status-change-select" onchange="window.updateResStatus('${resv.reservationId}', this.value)">
            <option value="Confirmed" ${resv.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Seated" ${resv.status === 'Seated' ? 'selected' : ''}>Guest Seated</option>
            <option value="Completed" ${resv.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${resv.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      `;
    }).join('');
  }

  window.updateResStatus = async function (id, status) {
    try {
      const res = await apiFetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res && res.success) {
        showToast(res.message, 'success');
        const target = STATE.reservations.find(r => r.reservationId === id);
        if (target) target.status = status;
        renderReservations();
      }
    } catch (err) {
      showToast('Could not update reservation status.', 'error');
    }
  };

  // --------------------------------------------------------------------------
  // STATS DASHBOARD OVERVIEW
  // --------------------------------------------------------------------------
  async function fetchStats() {
    try {
      const data = await apiFetch('/api/admin/stats');
      if (data && data.success && data.stats) {
        STATE.stats = data.stats;
        DOM.statRevenue.textContent = `₹${data.stats.totalRevenue.toLocaleString('en-IN')}`;
        DOM.statPending.textContent = data.stats.pendingOrders;
        DOM.statReady.textContent = data.stats.readyOrders;
        DOM.statDishes.textContent = data.stats.totalDishes;
        DOM.statReservations.textContent = data.stats.totalReservations;
      }
    } catch (err) {
      console.warn('Stats fetch error:', err);
    }
  }

  // --------------------------------------------------------------------------
  // CHANGE ADMIN CREDENTIALS & SECURITY
  // --------------------------------------------------------------------------
  async function handleChangeCredentialsSubmit(e) {
    e.preventDefault();
    const currentPassword = DOM.currentPasswordInput.value;
    const newUsername = DOM.newUsernameInput.value.trim();
    const newDisplayName = DOM.newDisplayNameInput.value.trim();
    const newPassword = DOM.newPasswordInput.value;
    const confirmNewPassword = DOM.confirmNewPasswordInput.value;

    DOM.securityAlert.style.display = 'none';

    if (newPassword && newPassword.length < 6) {
      DOM.securityAlert.style.display = 'flex';
      DOM.securityAlert.className = 'admin-alert error';
      DOM.securityAlert.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>New password must be at least 6 characters long.</span>';
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      DOM.securityAlert.style.display = 'flex';
      DOM.securityAlert.className = 'admin-alert error';
      DOM.securityAlert.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> <span>New password and confirmation do not match.</span>';
      return;
    }

    try {
      const res = await apiFetch('/api/admin/change-credentials', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername || undefined,
          newPassword: newPassword || undefined,
          name: newDisplayName || undefined
        })
      });

      if (res && res.success) {
        DOM.securityAlert.style.display = 'flex';
        DOM.securityAlert.className = 'admin-alert success';
        DOM.securityAlert.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${escapeHTML(res.message)}</span>`;
        showToast('Credentials updated successfully!', 'success');

        if (newUsername) {
          STATE.user.username = newUsername;
          DOM.headerUserHandle.textContent = `@${newUsername}`;
        }
        if (newDisplayName) {
          STATE.user.name = newDisplayName;
          DOM.headerUserName.textContent = newDisplayName;
        }
        localStorage.setItem('tastify_admin_user', JSON.stringify(STATE.user));

        DOM.changeCredsForm.reset();
      } else {
        DOM.securityAlert.style.display = 'flex';
        DOM.securityAlert.className = 'admin-alert error';
        DOM.securityAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${escapeHTML(res.message || 'Verification failed')}</span>`;
      }
    } catch (err) {
      DOM.securityAlert.style.display = 'flex';
      DOM.securityAlert.className = 'admin-alert error';
      DOM.securityAlert.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> <span>Failed to update credentials. Please check current password.</span>';
    }
  }

  // --------------------------------------------------------------------------
  // KITCHEN ORDER TICKET (KOT) THERMAL PRINT
  // --------------------------------------------------------------------------
  function openKOTModal(order) {
    const itemsRows = (order.items || []).map(item => `
      <tr>
        <td style="width: 25px; font-weight: bold;">${item.quantity || 1}x</td>
        <td>${escapeHTML(item.name || 'Item')}</td>
        <td style="text-align: right;">₹${item.itemTotal || item.price || 0}</td>
      </tr>
    `).join('');

    DOM.kotReceiptContent.innerHTML = `
      <div class="kot-center">
        <div class="kot-title">TASTIFY</div>
        <div class="kot-sub">ARABIAN MANDI &amp; RESTAURANT</div>
        <div style="font-size: 0.75rem;">Maisammaguda, Hyderabad | 099668 88060</div>
        <div class="kot-divider"></div>
        <div style="font-weight: bold; font-size: 1rem;">KITCHEN ORDER TICKET (KOT)</div>
      </div>

      <div class="kot-divider"></div>

      <div class="kot-meta-row">
        <span>Order #: <strong>${escapeHTML(order.orderId)}</strong></span>
        <span>${escapeHTML(order.deliveryType ? order.deliveryType.toUpperCase() : 'DINE-IN')}</span>
      </div>
      <div class="kot-meta-row">
        <span>Date: ${escapeHTML(order.createdAt || '')}</span>
      </div>
      <div class="kot-meta-row">
        <span>Guest: <strong>${escapeHTML(order.customerName || 'Walk-in')}</strong></span>
        <span>Ph: ${escapeHTML(order.phone || '')}</span>
      </div>

      <div class="kot-divider"></div>

      <table class="kot-items-table">
        <thead>
          <tr>
            <th>QTY</th>
            <th>ITEM</th>
            <th style="text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      ${order.specialInstructions ? `
        <div class="kot-divider"></div>
        <div style="font-weight: bold;">SPECIAL INSTRUCTIONS:</div>
        <div style="font-style: italic;">${escapeHTML(order.specialInstructions)}</div>
      ` : ''}

      <div class="kot-divider"></div>

      <div class="kot-meta-row">
        <span>Subtotal:</span>
        <span>₹${order.subtotal || 0}</span>
      </div>
      <div class="kot-meta-row">
        <span>Taxes (GST):</span>
        <span>₹${order.tax || 0}</span>
      </div>

      <div class="kot-divider"></div>

      <div class="kot-total-row">
        <span>GRAND TOTAL:</span>
        <span>₹${order.grandTotal || 0}</span>
      </div>

      <div class="kot-divider"></div>
      <div class="kot-center" style="font-size: 0.75rem; margin-top: 0.5rem;">
        * Thank you for choosing Tastify *
      </div>
    `;

    DOM.kotModal.style.display = 'flex';
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
