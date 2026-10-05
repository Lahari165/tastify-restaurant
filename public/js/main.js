/**
 * Tastify Arabian Mandi & Restaurant
 * Full-Stack Interactive Frontend Logic
 */

// Smart API Base (works when served by Express port 3000, Python port 5173, or file:///)
const API_BASE = (window.location.protocol.startsWith('http') && (window.location.port === '3000' || window.location.hostname !== 'localhost'))
  ? '' 
  : 'http://localhost:3000';

// Global App State
window.cart = [];
window.activeTheme = localStorage.getItem('tastify-theme') || 'arabian-night';

// Cross-browser safe clipboard helper (supports file:///, insecure origins, and mobile)
function safeCopyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) resolve();
      else reject(new Error("Copy command failed"));
    } catch (e) {
      reject(e);
    }
  });
}

// Get clean shareable URL (never passes broken file:/// paths to WhatsApp/Instagram)
function getShareableUrl() {
  if (window.location.protocol.startsWith('http')) {
    return window.location.href.split('#')[0];
  }
  // Fallback to Express backend or Google Maps verified link
  return 'http://localhost:3000';
}

function getShareMessage() {
  const url = getShareableUrl();
  return `🍗 Hey! Check out *Tastify Arabian Mandi & Restaurant* in Maisammaguda, Hyderabad!\n\n✨ Authentic slow-cooked Chicken Mandi, Fry Piece Mandi, Chicken 65, and thick shakes!\n💰 Budget-friendly ₹200–₹400 per person.\n⭐ Rated 4.3★ by 872+ food lovers.\n\n📍 View Menu & Location:\n${url}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const initSteps = [
    { name: "Theme", fn: initTheme },
    { name: "Navbar", fn: initNavbar },
    { name: "HeroAnimations", fn: initHeroAnimations },
    { name: "CustomerAuth", fn: initCustomerAuthSystem },
    { name: "OrderAndCart", fn: initOrderAndCartSystem },
    { name: "ReservationModal", fn: initReservationModal },
    { name: "ShareModal", fn: initShareModal },
    { name: "ReviewSubmissionModal", fn: initReviewSubmissionModal },
    { name: "GalleryLightbox", fn: initGalleryLightbox },
    { name: "BackToTop", fn: initBackToTop },
    { name: "MenuData", fn: loadMenuData },
    { name: "ReviewsData", fn: loadReviewsData },
    { name: "ReviewsCarousel", fn: initReviewsCarousel },
    { name: "Counters", fn: initCounters },
    { name: "ConfigBindings", fn: updateConfigBindings }
  ];

  initSteps.forEach(step => {
    try {
      if (typeof step.fn === 'function') step.fn();
    } catch (err) {
      console.error(`[Tastify] Initialization error in ${step.name}:`, err);
    }
  });
});

// --------------------------------------------------------------------------
// 1. Theme Management (Arabian Night, Desert Palace, Emerald Oasis)
// --------------------------------------------------------------------------
const THEMES = [
  { id: 'arabian-night', name: 'Arabian Night', icon: '🌙', desc: 'Royal Obsidian & Warm Gold' },
  { id: 'desert-palace', name: 'Desert Palace', icon: '☀️', desc: 'Sunlit Ivory & Terracotta' },
  { id: 'emerald-oasis', name: 'Emerald Oasis', icon: '🌿', desc: 'Deep Jewel Green & Amber' }
];

function initTheme() {
  applyTheme(window.activeTheme);

  // Attach click listener to cycle theme
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-switch-btn');
    if (btn) {
      e.preventDefault();
      cycleTheme();
    }
  });
}

function cycleTheme() {
  const currentIndex = THEMES.findIndex(t => t.id === window.activeTheme);
  const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
  applyTheme(nextTheme.id);
  showToast(`Atmosphere changed to ${nextTheme.name} ${nextTheme.icon}`);
}

function applyTheme(themeId) {
  if (!THEMES.some(t => t.id === themeId)) themeId = 'arabian-night';
  window.activeTheme = themeId;
  localStorage.setItem('tastify-theme', themeId);
  document.documentElement.setAttribute('data-theme', themeId);

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  // Update theme toggle buttons text and icons
  document.querySelectorAll('.theme-switch-btn').forEach(btn => {
    const textSpan = btn.querySelector('.theme-name');
    if (textSpan) textSpan.textContent = `${currentTheme.icon} ${currentTheme.name}`;
    const iconSpan = btn.querySelector('.theme-icon');
    if (iconSpan) iconSpan.textContent = currentTheme.icon;
  });

  // Update theme picker cards (inside Share Modal / Settings)
  document.querySelectorAll('.theme-picker-card').forEach(card => {
    const cardTheme = card.getAttribute('data-theme-id');
    if (cardTheme === themeId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// --------------------------------------------------------------------------
// 2. Configuration Bindings
// --------------------------------------------------------------------------
function updateConfigBindings() {
  const config = window.RESTAURANT_CONFIG;
  if (!config) return;

  document.querySelectorAll("[data-bind='phoneDisplay']").forEach(el => {
    el.textContent = config.phoneDisplay;
  });
  document.querySelectorAll("[data-bind='phoneTel']").forEach(el => {
    el.setAttribute("href", config.phoneTel);
  });
  document.querySelectorAll("[data-bind='address']").forEach(el => {
    el.textContent = config.address;
  });
  document.querySelectorAll("[data-bind='rating']").forEach(el => {
    el.textContent = config.rating.toFixed(1);
  });
  document.querySelectorAll("[data-bind='reviewCount']").forEach(el => {
    el.textContent = `${config.reviewCount}+`;
  });
  document.querySelectorAll("[data-bind='mapsUrl']").forEach(el => {
    el.setAttribute("href", config.mapsUrl);
  });
}

// --------------------------------------------------------------------------
// 3. Sticky Navigation & Mobile Drawer
// --------------------------------------------------------------------------
function initNavbar() {
  const navbar = document.getElementById("main-nav");
  const hamburger = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-link");

  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  if (hamburger && mobileMenu) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !mobileMenu.classList.contains("active");
      if (isOpen) {
        mobileMenu.classList.add("active");
        hamburger.classList.add("open");
        hamburger.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      } else {
        mobileMenu.classList.remove("active");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    };

    window.closeMobileMenu = () => toggleMenu(false);
    window.toggleMobileMenu = (open) => toggleMenu(open);

    hamburger.addEventListener("click", () => toggleMenu());
    mobileLinks.forEach(link => {
      link.addEventListener("click", () => toggleMenu(false));
    });

    // Close mobile drawer when any action button or link inside is clicked (except theme cycler)
    mobileMenu.querySelectorAll("button, a").forEach(el => {
      if (!el.classList.contains("theme-switch-btn")) {
        el.addEventListener("click", () => toggleMenu(false));
      }
    });
  } else {
    window.closeMobileMenu = () => {};
  }
}

// --------------------------------------------------------------------------
// 4. Hero Animations & Embers
// --------------------------------------------------------------------------
function initHeroAnimations() {
  const heroImage = document.querySelector(".hero-image-wrap");
  if (heroImage) {
    heroImage.addEventListener("mousemove", (e) => {
      if (window.innerWidth < 1024) return;
      const rect = heroImage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroImage.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    heroImage.addEventListener("mouseleave", () => {
      heroImage.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
    });
  }

  const embersContainer = document.getElementById("hero-embers");
  if (embersContainer) {
    for (let i = 0; i < 14; i++) {
      const dot = document.createElement("span");
      dot.className = "ember-dot";
      const size = Math.random() * 4 + 2;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDuration = `${Math.random() * 6 + 4}s`;
      dot.style.animationDelay = `${Math.random() * 3}s`;
      embersContainer.appendChild(dot);
    }
  }
}

// --------------------------------------------------------------------------
// 5. Menu Loading & Rendering (from Backend API with fallback)
// --------------------------------------------------------------------------
async function loadMenuData() {
  try {
    const res = await fetch(`${API_BASE}/api/menu`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.items) {
        window.MENU_ITEMS = data.items;
      }
    }
  } catch (err) {
    console.warn("Using local menu data fallback:", err);
  }
  initMenu();
}

function initMenu() {
  const container = document.getElementById("menu-grid");
  const categoryFilters = document.querySelectorAll(".menu-filter-btn");
  if (!container || !window.MENU_ITEMS) return;

  let activeCategory = "all";

  const renderItems = (cat) => {
    container.innerHTML = "";
    const items = cat === "all" 
      ? window.MENU_ITEMS 
      : window.MENU_ITEMS.filter(item => item.category === cat);

    if (items.length === 0) {
      container.innerHTML = `
        <div class="menu-empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--color-sand);">No dishes found in this category right now.</p>
        </div>
      `;
      return;
    }

    items.forEach((dish, index) => {
      const card = document.createElement("article");
      card.className = "menu-card";
      card.style.animationDelay = `${index * 0.05}s`;

      const vegClass = dish.isVeg ? "veg-indicator" : "non-veg-indicator";
      const vegTitle = dish.isVeg ? "Vegetarian" : "Non-Vegetarian";

      card.innerHTML = `
        <div class="menu-card-img-wrap">
          <img src="${dish.image}" alt="${dish.name}" loading="lazy" class="menu-card-img" />
          <div class="menu-card-badges">
            <span class="${vegClass}" title="${vegTitle}">
              <span class="diet-dot"></span>
            </span>
            ${dish.isSignature ? '<span class="badge badge-signature">Signature</span>' : ''}
            ${dish.isPopular && !dish.isSignature ? '<span class="badge badge-popular">Popular</span>' : ''}
          </div>
          <button type="button" class="quick-order-btn btn-add-cart" data-dish-id="${dish.id}">
            <span>+ Add to Order</span>
          </button>
        </div>
        <div class="menu-card-content">
          <div class="menu-card-header">
            <div>
              <h3 class="menu-card-title">${dish.name}</h3>
              <p class="menu-card-telugu">${dish.nameTelugu || ''}</p>
            </div>
            <div class="menu-card-pricing">
              <span class="menu-price-label">${dish.priceDisplay || `₹${dish.price}`}</span>
              <span class="menu-price-sub">${dish.portion}</span>
            </div>
          </div>
          <p class="menu-card-desc">${dish.description}</p>
          <div class="menu-card-footer">
            <div class="menu-card-tags">
              ${dish.tags.map(t => `<span class="dish-tag">#${t}</span>`).join("")}
            </div>
            <button type="button" class="btn-card-add btn-add-cart" data-dish-id="${dish.id}">
              <span>+ Add (₹${dish.price || 280})</span>
            </button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Attach Add to Cart listener
    container.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const dishId = btn.getAttribute("data-dish-id");
        if (typeof window.addToCart === 'function') {
          window.addToCart(dishId);
        }
      });
    });
  };

  renderItems(activeCategory);

  categoryFilters.forEach(button => {
    button.addEventListener("click", () => {
      categoryFilters.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      activeCategory = button.getAttribute("data-category");
      renderItems(activeCategory);
    });
  });
}

// --------------------------------------------------------------------------
// 6. Interactive Cart & Order System
// --------------------------------------------------------------------------
function initOrderAndCartSystem() {
  const cartBar = document.getElementById("floating-cart-bar");
  const cartCountEl = document.getElementById("cart-bar-count");
  const cartTotalEl = document.getElementById("cart-bar-total");
  const openCartBtn = document.getElementById("btn-open-cart");
  const orderModal = document.getElementById("order-modal");
  const modalClose = document.getElementById("order-modal-close");
  const orderTriggers = document.querySelectorAll(".btn-order-trigger");
  const orderForm = document.getElementById("order-checkout-form");

  function updateCartUI() {
    const totalCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update floating cart bar
    if (cartBar && cartCountEl && cartTotalEl) {
      if (totalCount > 0) {
        cartCountEl.textContent = totalCount;
        cartTotalEl.textContent = `₹${subtotal}`;
        cartBar.classList.add("active");
      } else {
        cartBar.classList.remove("active");
      }
    }

    // Update modal cart list if open
    renderModalCartItems();
  }
  window.updateCartUI = updateCartUI;

  function addToCart(dishId) {
    const dish = (window.MENU_ITEMS || []).find(d => d.id === dishId);
    if (!dish) return;

    const existing = window.cart.find(i => i.id === dishId);
    if (existing) {
      existing.quantity += 1;
    } else {
      window.cart.push({
        id: dish.id,
        name: dish.name,
        price: dish.price || 280,
        portion: dish.portion,
        quantity: 1
      });
    }

    showToast(`Added ${dish.name} to order!`);
    updateCartUI();
  }
  window.addToCart = addToCart;

  function updateCartQty(dishId, delta) {
    const item = window.cart.find(i => i.id === dishId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      window.cart = window.cart.filter(i => i.id !== dishId);
    }
    updateCartUI();
  }
  window.updateCartQty = updateCartQty;

  function renderModalCartItems() {
    const listContainer = document.getElementById("cart-items-list");
    const subtotalEl = document.getElementById("checkout-subtotal");
    const taxEl = document.getElementById("checkout-tax");
    const deliveryEl = document.getElementById("checkout-delivery");
    const grandTotalEl = document.getElementById("checkout-grand-total");
    const emptyNotice = document.getElementById("cart-empty-notice");
    const checkoutFields = document.getElementById("checkout-form-fields");

    if (!listContainer) return;

    if (window.cart.length === 0) {
      listContainer.innerHTML = "";
      if (emptyNotice) emptyNotice.style.display = "block";
      if (checkoutFields) checkoutFields.style.display = "none";
      return;
    }

    if (emptyNotice) emptyNotice.style.display = "none";
    if (checkoutFields) checkoutFields.style.display = "block";

    listContainer.innerHTML = "";
    let subtotal = 0;

    window.cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      const row = document.createElement("div");
      row.className = "cart-item-row";
      row.innerHTML = `
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span>₹${item.price} each • ${item.portion}</span>
        </div>
        <div class="cart-item-controls">
          <button type="button" class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
          <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
          <span style="font-weight: 700; color: var(--color-gold); min-width: 55px; text-align: right;">₹${itemTotal}</span>
        </div>
      `;
      listContainer.appendChild(row);
    });

    const tax = Math.round(subtotal * 0.05);
    const deliveryTypeSelect = document.getElementById("order-type");
    const deliveryType = deliveryTypeSelect ? deliveryTypeSelect.value : 'dine-in';
    const deliveryFee = deliveryType === 'delivery' ? 30 : 0;
    const grandTotal = subtotal + tax + deliveryFee;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (taxEl) taxEl.textContent = `₹${tax}`;
    if (deliveryEl) deliveryEl.textContent = `₹${deliveryFee}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal}`;
  }

  // Toggle order modal
  function openOrderModal() {
    if (window.closeMobileMenu) window.closeMobileMenu();
    const config = window.RESTAURANT_CONFIG;
    if (config && config.ORDER_URL && config.ORDER_URL.trim() !== "") {
      window.open(config.ORDER_URL, "_blank");
      return;
    }

    if (typeof window.prefillCustomerCheckout === 'function') {
      window.prefillCustomerCheckout();
    }

    renderModalCartItems();
    if (orderModal) {
      orderModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }
  window.openOrderModal = openOrderModal;

  function closeOrderModal() {
    if (orderModal) {
      orderModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
  window.closeOrderModal = closeOrderModal;

  orderTriggers.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openOrderModal();
    });
  });

  if (openCartBtn) {
    openCartBtn.addEventListener("click", () => openOrderModal());
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => closeOrderModal());
  }

  if (orderModal) {
    orderModal.addEventListener("click", (e) => {
      if (e.target === orderModal) {
        closeOrderModal();
      }
    });
  }

  // Handle Delivery Type Change to update delivery fee and address field visibility
  const orderTypeSelect = document.getElementById("order-type");
  const addressFieldGroup = document.getElementById("address-field-group");
  const addressLine1Input = document.getElementById("order-address-line1");

  if (orderTypeSelect) {
    orderTypeSelect.addEventListener("change", () => {
      const isDelivery = orderTypeSelect.value === 'delivery';
      if (addressFieldGroup) {
        addressFieldGroup.style.display = isDelivery ? 'block' : 'none';
      }
      if (addressLine1Input) {
        addressLine1Input.required = isDelivery;
      }
      renderModalCartItems();
    });
  }

  // --------------------------------------------------------------------------
  // Two-Step Checkout: Step 1 (Address & Details) -> Step 2 (Review & Confirm)
  // --------------------------------------------------------------------------
  const checkoutStep1 = document.getElementById("checkout-step-1");
  const checkoutStep2 = document.getElementById("checkout-step-2");
  const btnGotoStep2 = document.getElementById("btn-goto-step-2");
  const btnBackToStep1 = document.getElementById("btn-back-to-step-1");

  let currentOrderPayload = null;

  if (btnGotoStep2) {
    btnGotoStep2.addEventListener("click", () => {
      if (window.cart.length === 0) {
        showToast("Please add at least one dish to your order!");
        return;
      }

      const nameInput = document.getElementById("order-name");
      const phoneInput = document.getElementById("order-phone");
      const typeSelect = document.getElementById("order-type");
      const notesInput = document.getElementById("order-notes");
      const line1Input = document.getElementById("order-address-line1");
      const landmarkInput = document.getElementById("order-address-landmark");

      const name = nameInput ? nameInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const orderType = typeSelect ? typeSelect.value : "delivery";
      const notes = notesInput ? notesInput.value.trim() : "";
      const line1 = line1Input ? line1Input.value.trim() : "";
      const landmark = landmarkInput ? landmarkInput.value.trim() : "";

      if (!name) {
        showToast("Please enter your name!");
        if (nameInput) nameInput.focus();
        return;
      }

      if (!phone || phone.replace(/\D/g, '').length < 10) {
        showToast("Please enter a valid 10-digit mobile number!");
        if (phoneInput) phoneInput.focus();
        return;
      }

      let fullAddress = "At Tastify Restaurant, Maisammaguda";
      if (orderType === "delivery") {
        if (!line1) {
          showToast("Please enter your delivery address (House/Flat/Hostel)!");
          if (line1Input) line1Input.focus();
          return;
        }
        fullAddress = `${line1}${landmark ? `, Near ${landmark}` : ''}, Maisammaguda, Hyderabad - 500100`;
      } else if (orderType === "takeaway") {
        fullAddress = "Self Pickup at Tastify Counter, Maisammaguda, Hyderabad";
      }

      // Populate Step 2 Confirmation Card
      const confirmDisplayAddress = document.getElementById("confirm-display-address");
      const confirmDisplayName = document.getElementById("confirm-display-name");
      const confirmDisplayPhone = document.getElementById("confirm-display-phone");
      const confirmDisplayType = document.getElementById("confirm-display-type");
      const confirmDisplayNotes = document.getElementById("confirm-display-notes");
      const confirmDisplayGrandTotal = document.getElementById("confirm-display-grand-total");
      const checkoutGrandTotal = document.getElementById("checkout-grand-total");

      if (confirmDisplayAddress) confirmDisplayAddress.textContent = fullAddress;
      if (confirmDisplayName) confirmDisplayName.textContent = name;
      if (confirmDisplayPhone) confirmDisplayPhone.textContent = phone;
      if (confirmDisplayType) {
        confirmDisplayType.textContent = orderType === 'delivery' ? 'Home Delivery' : (orderType === 'takeaway' ? 'Self Pickup' : 'Dine-In');
      }
      if (confirmDisplayNotes) {
        confirmDisplayNotes.textContent = notes ? `Special Notes: "${notes}"` : "";
      }
      if (confirmDisplayGrandTotal && checkoutGrandTotal) {
        confirmDisplayGrandTotal.textContent = checkoutGrandTotal.textContent;
      }

      currentOrderPayload = {
        customerName: name,
        phone: phone,
        deliveryType: orderType,
        address: fullAddress,
        specialInstructions: notes,
        items: window.cart,
        customerId: (window.currentCustomer && window.currentCustomer.id) ? window.currentCustomer.id : null
      };

      // Switch to Step 2 view
      if (checkoutStep1) checkoutStep1.style.display = "none";
      if (checkoutStep2) checkoutStep2.style.display = "block";
    });
  }

  if (btnBackToStep1) {
    btnBackToStep1.addEventListener("click", () => {
      if (checkoutStep2) checkoutStep2.style.display = "none";
      if (checkoutStep1) checkoutStep1.style.display = "block";
    });
  }

  // Handle Final Order Placement (Submits directly to Server API — NO WhatsApp redirect!)
  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!currentOrderPayload || window.cart.length === 0) {
        showToast("Please add items to your cart!");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-order-final");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Sending Order to Kitchen...</span>`;
      }

      const headers = { 'Content-Type': 'application/json' };
      const custToken = localStorage.getItem('tastify_customer_token');
      if (custToken) {
        headers['Authorization'] = `Bearer ${custToken}`;
      }

      try {
        const response = await fetch(`${API_BASE}/api/orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify(currentOrderPayload)
        });

        const result = await response.json();

        if (result.success && result.order) {
          // Reset cart & close checkout modal
          window.cart = [];
          updateCartUI();
          orderModal.classList.remove("active");
          document.body.style.overflow = "";

          // Reset checkout view back to step 1 for future orders
          if (checkoutStep2) checkoutStep2.style.display = "none";
          if (checkoutStep1) checkoutStep1.style.display = "block";
          orderForm.reset();

          showToast("🎉 Order placed successfully! Kitchen will set delivery time shortly.");

          // Open Live Order Tracking Modal immediately
          startLiveOrderTracking(result.order);
        } else {
          showToast(result.message || "Failed to place order. Please try again.");
        }
      } catch (err) {
        console.error("Order placement error:", err);
        showToast("Error connecting to server. Please call restaurant at 099668 88060.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Confirm &amp; Place Order 🎉</span>`;
        }
      }
    });
  }

  // Initialize tracking modal controls
  initTrackingModalEvents();
}

// --------------------------------------------------------------------------
// Live Order Tracking Modal & Polling System
// --------------------------------------------------------------------------
let activeOrderPollTimer = null;
let currentTrackingOrder = null;

function startLiveOrderTracking(order) {
  currentTrackingOrder = order;
  localStorage.setItem('tastify_active_order_id', order.orderId);

  const trackingModal = document.getElementById("order-tracking-modal");
  const floatingPill = document.getElementById("floating-active-order-pill");

  // Populate tracking UI
  updateTrackingUI(order);

  if (trackingModal) {
    trackingModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  if (floatingPill) {
    floatingPill.style.display = "none";
  }

  // Poll order status every 3.5 seconds
  clearInterval(activeOrderPollTimer);
  activeOrderPollTimer = setInterval(() => {
    pollActiveOrderStatus(order.orderId);
  }, 3500);
}

async function pollActiveOrderStatus(orderId) {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
    const data = await res.json();
    if (data.success && data.order) {
      currentTrackingOrder = data.order;
      updateTrackingUI(data.order);

      // If delivered or cancelled, stop polling
      if (data.order.status === 'Delivered' || data.order.status === 'Cancelled') {
        clearInterval(activeOrderPollTimer);
      }
    }
  } catch (err) {
    console.warn("Order poll error:", err);
  }
}

let customerCountdownInterval = null;

function startCustomerCountdown(order) {
  clearInterval(customerCountdownInterval);
  const timeValEl = document.getElementById("track-delivery-time-val");
  const timeSubEl = document.getElementById("track-delivery-time-sub");
  const pillStatusText = document.getElementById("pill-status-text");
  const stepPrepText = document.getElementById("track-step-prep-text");

  let targetTs = order.targetDeliveryTimestamp;
  if (!targetTs) {
    const match = (order.estimatedDeliveryTime || '').match(/\d+/);
    const mins = match ? parseInt(match[0], 10) : 30;
    const base = order.allottedAt || (order.acceptedAt ? new Date(order.acceptedAt).getTime() : Date.now());
    targetTs = (isNaN(base) ? Date.now() : base) + (mins * 60 * 1000);
    order.targetDeliveryTimestamp = targetTs;
  }

  const tick = () => {
    const now = Date.now();
    const remaining = targetTs - now;

    if (remaining > 0) {
      const totalSec = Math.floor(remaining / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      const secStr = s < 10 ? `0${s}` : `${s}`;
      const clockDue = order.targetDeliveryClockTime ? ` (Due by ${order.targetDeliveryClockTime})` : '';

      if (timeValEl) {
        timeValEl.innerHTML = `<span style="font-family: monospace; font-size: 1.4rem; color: var(--color-gold-light);">⏱️ ${m}m ${secStr}s</span> remaining`;
      }
      if (timeSubEl) {
        timeSubEl.innerHTML = `Order accepted by kitchen! Food is cooking hot.${clockDue ? ` Target arrival: <strong>${order.targetDeliveryClockTime}</strong>.` : ''}`;
      }
      if (pillStatusText) {
        pillStatusText.textContent = `Cooking • ${m}m ${secStr}s left`;
      }
      if (stepPrepText) {
        stepPrepText.textContent = `${m}m ${secStr}s`;
      }
    } else {
      if (timeValEl) {
        timeValEl.innerHTML = `🛵 <span style="color: #60A5FA;">Arriving Any Moment!</span>`;
      }
      if (timeSubEl) {
        timeSubEl.textContent = `Cooking complete! Your fresh Mandi is packed and dispatched with our delivery rider.`;
      }
      if (pillStatusText) {
        pillStatusText.textContent = `Arriving Any Second`;
      }
      if (stepPrepText) {
        stepPrepText.textContent = `Due Now`;
      }
    }
  };

  tick();
  customerCountdownInterval = setInterval(tick, 1000);
}

function updateTrackingUI(order) {
  const orderIdEl = document.getElementById("track-order-id");
  const timeCard = document.getElementById("track-time-card");
  const timeValEl = document.getElementById("track-delivery-time-val");
  const timeSubEl = document.getElementById("track-delivery-time-sub");
  const addressEl = document.getElementById("track-address");
  const customerEl = document.getElementById("track-customer");
  const itemsEl = document.getElementById("track-items-summary");
  const grandTotalEl = document.getElementById("track-grand-total");

  // Floating pill elements
  const pillOrderId = document.getElementById("pill-order-id");
  const pillStatusText = document.getElementById("pill-status-text");

  if (orderIdEl) orderIdEl.textContent = `#${order.orderId}`;
  if (addressEl) addressEl.textContent = order.address || "Maisammaguda, Hyderabad";
  if (customerEl) customerEl.textContent = `${order.customerName || 'Guest'} (${order.phone || ''})`;
  if (itemsEl) {
    itemsEl.textContent = (order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ');
  }
  if (grandTotalEl) grandTotalEl.textContent = `₹${order.grandTotal || 0}`;

  if (pillOrderId) pillOrderId.textContent = `#${order.orderId.slice(-5)}`;

  // Step Indicators
  const step1 = document.getElementById("track-step-1");
  const step2 = document.getElementById("track-step-2");
  const step3 = document.getElementById("track-step-3");
  const step4 = document.getElementById("track-step-4");
  const conn12 = document.getElementById("connector-1-2");
  const conn23 = document.getElementById("connector-2-3");
  const conn34 = document.getElementById("connector-3-4");
  const stepPrepText = document.getElementById("track-step-prep-text");

  // Reset steps
  [step1, step2, step3, step4].forEach(s => s && s.classList.remove("active", "done"));
  [conn12, conn23, conn34].forEach(c => c && c.classList.remove("active"));

  if (step1) step1.classList.add("done");

  const status = order.status || 'Received';
  const hasCustomTime = order.estimatedDeliveryTime && !order.estimatedDeliveryTime.toLowerCase().includes('waiting');

  if (status === 'Received') {
    clearInterval(customerCountdownInterval);
    if (timeCard) {
      timeCard.className = "tracking-time-card pending";
    }
    if (timeValEl) {
      timeValEl.textContent = "Waiting for kitchen acceptance...";
    }
    if (timeSubEl) {
      timeSubEl.textContent = "The restaurant manager is reviewing your order right now to confirm the exact delivery time.";
    }
    if (pillStatusText) {
      pillStatusText.textContent = "Order Received • Awaiting Kitchen";
    }
  } else if (status === 'Preparing') {
    if (step1) step1.classList.add("done");
    if (conn12) conn12.classList.add("active");
    if (step2) step2.classList.add("active");

    if (timeCard) {
      timeCard.className = "tracking-time-card accepted";
    }
    if (hasCustomTime) {
      startCustomerCountdown(order);
    } else {
      clearInterval(customerCountdownInterval);
      if (timeValEl) timeValEl.textContent = "Preparing in Kitchen";
      if (timeSubEl) timeSubEl.textContent = "Kitchen accepted your order and is preparing it fresh.";
      if (stepPrepText) stepPrepText.textContent = "In Kitchen";
      if (pillStatusText) pillStatusText.textContent = "In Kitchen (Preparing)";
    }
  } else if (status === 'Ready') {
    clearInterval(customerCountdownInterval);
    if (step1) step1.classList.add("done");
    if (conn12) conn12.classList.add("active");
    if (step2) step2.classList.add("done");
    if (conn23) conn23.classList.add("active");
    if (step3) step3.classList.add("active");

    if (timeCard) {
      timeCard.className = "tracking-time-card ready";
    }
    if (timeValEl) {
      timeValEl.textContent = order.deliveryType === 'delivery' ? "🛵 Out for Delivery!" : "🥡 Ready for Pickup!";
    }
    if (timeSubEl) {
      timeSubEl.textContent = order.deliveryType === 'delivery' 
        ? "Your hot order is packed and dispatched with our delivery rider!" 
        : "Your feast is ready! You can pick it up at the Tastify counter.";
    }
    if (pillStatusText) {
      pillStatusText.textContent = order.deliveryType === 'delivery' ? "Out for Delivery" : "Ready for Pickup";
    }
  } else if (status === 'Delivered') {
    clearInterval(customerCountdownInterval);
    [step1, step2, step3, step4].forEach(s => s && s.classList.add("done"));
    [conn12, conn23, conn34].forEach(c => c && c.classList.add("active"));

    if (timeCard) {
      timeCard.className = "tracking-time-card delivered";
    }
    if (timeValEl) {
      timeValEl.textContent = "✅ Order Delivered!";
    }
    if (timeSubEl) {
      timeSubEl.textContent = "Thank you for dining with Tastify Arabian Mandi! We hope you enjoyed your meal.";
    }
    if (pillStatusText) {
      pillStatusText.textContent = "Delivered";
    }
  } else if (status === 'Cancelled') {
    clearInterval(customerCountdownInterval);
    if (timeValEl) timeValEl.textContent = "❌ Order Cancelled";
    if (timeSubEl) timeSubEl.textContent = "This order was cancelled. Please call counter for details.";
    if (pillStatusText) pillStatusText.textContent = "Cancelled";
  }
}

function initTrackingModalEvents() {
  const trackingModal = document.getElementById("order-tracking-modal");
  const modalClose = document.getElementById("tracking-modal-close");
  const btnMinimize = document.getElementById("btn-minimize-tracking");
  const floatingPill = document.getElementById("floating-active-order-pill");
  const btnOpenTracking = document.getElementById("btn-open-active-tracking");

  const closeTracking = () => {
    if (trackingModal) trackingModal.classList.remove("active");
    document.body.style.overflow = "";
    if (floatingPill && currentTrackingOrder && currentTrackingOrder.status !== 'Delivered' && currentTrackingOrder.status !== 'Cancelled') {
      floatingPill.style.display = "flex";
    }
  };

  if (modalClose) modalClose.addEventListener("click", closeTracking);
  if (btnMinimize) btnMinimize.addEventListener("click", closeTracking);

  if (btnOpenTracking) {
    btnOpenTracking.addEventListener("click", () => {
      if (trackingModal) trackingModal.classList.add("active");
      document.body.style.overflow = "hidden";
      if (floatingPill) floatingPill.style.display = "none";
    });
  }

  // Restore active order from previous session if exists
  const savedOrderId = localStorage.getItem('tastify_active_order_id');
  if (savedOrderId) {
    fetch(`${API_BASE}/api/orders/${savedOrderId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.order && data.order.status !== 'Delivered' && data.order.status !== 'Cancelled') {
          currentTrackingOrder = data.order;
          updateTrackingUI(data.order);
          if (floatingPill) floatingPill.style.display = "flex";
          // Resume polling
          clearInterval(activeOrderPollTimer);
          activeOrderPollTimer = setInterval(() => pollActiveOrderStatus(savedOrderId), 4000);
        }
      })
      .catch(() => {});
  }
}

// --------------------------------------------------------------------------
// 7. Table Reservation Modal (Backend API Connected)
// --------------------------------------------------------------------------
function initReservationModal() {
  const modal = document.getElementById("reservation-modal");
  const openButtons = document.querySelectorAll(".btn-reserve-trigger");
  const closeBtn = document.getElementById("reservation-modal-close");
  const form = document.getElementById("reservation-form");

  const toggleReservation = (open) => {
    if (!modal) return;
    if (open) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    } else {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  openButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleReservation(true);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", () => toggleReservation(false));

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) toggleReservation(false);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const reservationData = {
        name: form.querySelector("#res-name")?.value || "Guest",
        phone: form.querySelector("#res-phone")?.value || "099668 88060",
        date: form.querySelector("#res-date")?.value || "",
        time: form.querySelector("#res-time")?.value || "",
        guests: form.querySelector("#res-guests")?.value || "4 Guests",
        seating: form.querySelector("#res-preference")?.value || "Floor Majlis (Traditional)",
        notes: form.querySelector("#res-notes")?.value || ""
      };

      try {
        const response = await fetch(`${API_BASE}/api/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservationData)
        });

        const result = await response.json();

        if (result.success) {
          toggleReservation(false);
          if (result.whatsappUrl) {
            window.open(result.whatsappUrl, "_blank");
          }
          showToast(`Table booked (${result.reservation.reservationId})! WhatsApp confirmation sent.`);
        }
      } catch (err) {
        console.error("Reservation API error:", err);
        const config = window.RESTAURANT_CONFIG;
        const msg = encodeURIComponent(`Hello Tastify! Table Booking Request:\nName: ${reservationData.name}\nPhone: ${reservationData.phone}\nDate: ${reservationData.date} at ${reservationData.time}\nGuests: ${reservationData.guests}\nSeating: ${reservationData.seating}`);
        window.open(`https://wa.me/${config.whatsappNumber}?text=${msg}`, "_blank");
        toggleReservation(false);
      }
    });
  }
}

// --------------------------------------------------------------------------
// 8. Share to Friend Modal (WhatsApp, Instagram, Twitter, Telegram, Copy & Theme)
// --------------------------------------------------------------------------
function initShareModal() {
  const shareModal = document.getElementById("share-modal");
  const shareCloseBtn = document.getElementById("share-modal-close");
  const whatsappShareBtn = document.getElementById("share-whatsapp-btn");
  const instagramShareBtn = document.getElementById("share-instagram-btn");
  const twitterBtn = document.getElementById("share-twitter-btn");
  const telegramBtn = document.getElementById("share-telegram-btn");
  const copyLinkBtn = document.getElementById("share-copy-btn");
  const copyLinkInput = document.getElementById("share-copy-input");
  const nativeShareBtn = document.getElementById("share-native-btn");

  window.openShareModal = () => {
    if (!shareModal) return;
    const shareUrl = getShareableUrl();
    const shareMessage = getShareMessage();

    // Populate copy box
    if (copyLinkInput) copyLinkInput.value = shareUrl;

    // Set WhatsApp Direct App scheme (no new browser tab or webpage)
    if (whatsappShareBtn) {
      whatsappShareBtn.href = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
      whatsappShareBtn.removeAttribute("target");
    }

    // Set WhatsApp Web option
    const whatsappWebBtn = document.getElementById("share-whatsapp-web-btn");
    if (whatsappWebBtn) {
      whatsappWebBtn.href = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
      whatsappWebBtn.setAttribute("target", "_blank");
    }

    // Set Twitter / X link
    if (twitterBtn) {
      twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
      twitterBtn.setAttribute("target", "_blank");
    }

    // Set Telegram link
    if (telegramBtn) {
      telegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
      telegramBtn.setAttribute("target", "_blank");
    }

    // Check if Web Share API is supported (mobile phones)
    if (nativeShareBtn) {
      if (navigator.share) {
        nativeShareBtn.style.display = "flex";
      } else {
        nativeShareBtn.style.display = "none";
      }
    }

    // Synchronize active theme selection in modal
    document.querySelectorAll('.theme-picker-card').forEach(card => {
      if (card.getAttribute('data-theme-id') === window.activeTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    shareModal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  window.closeShareModal = () => {
    if (!shareModal) return;
    shareModal.classList.remove("active");
    document.body.style.overflow = "";
  };

  // WhatsApp Button Click: Directly opens WhatsApp application without opening another webpage!
  if (whatsappShareBtn) {
    whatsappShareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const shareMessage = getShareMessage();
      const nativeScheme = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
      
      showToast("Opening WhatsApp directly... 💬");
      
      // Directly invoke the OS protocol handler (no browser tab or new page opened!)
      window.location.href = nativeScheme;
    });
  }

  // WhatsApp Web Option Click: Opens WhatsApp Web directly without the intermediate landing page
  const whatsappWebBtn = document.getElementById("share-whatsapp-web-btn");
  if (whatsappWebBtn) {
    whatsappWebBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const shareMessage = getShareMessage();
      const webUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
      window.open(webUrl, "_blank", "noopener,noreferrer");
    });
  }

  // Instagram Button Click: Copy invitation & open Instagram
  if (instagramShareBtn) {
    instagramShareBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const shareUrl = getShareableUrl();
      const shareMessage = getShareMessage();
      safeCopyToClipboard(`${shareMessage}\n\n${shareUrl}`).then(() => {
        showToast("✅ Tastify invitation copied! Redirecting to Instagram...");
        setTimeout(() => {
          window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        }, 500);
      }).catch(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      });
    });
  }

  // Native Mobile Share Button
  if (nativeShareBtn) {
    nativeShareBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const shareUrl = getShareableUrl();
      const shareMessage = getShareMessage();
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Tastify — Authentic Arabian Mandi & Restaurant",
            text: shareMessage,
            url: shareUrl
          });
          showToast("Shared successfully!");
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.warn("Share sheet closed or failed:", err);
          }
        }
      }
    });
  }

  // Copy Link Button
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const shareUrl = getShareableUrl();
      safeCopyToClipboard(shareUrl).then(() => {
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = "<span>Copied! ✓</span>";
        copyLinkBtn.style.background = "#2ECC71";
        copyLinkBtn.style.color = "#FFFFFF";

        setTimeout(() => {
          copyLinkBtn.innerHTML = originalText;
          copyLinkBtn.style.background = "";
          copyLinkBtn.style.color = "";
        }, 2500);

        showToast("Website link copied to clipboard!");
      });
    });
  }

  // Global document click delegation for share triggers & theme cards
  document.addEventListener("click", (e) => {
    // Open Share Modal
    const shareTrigger = e.target.closest(".btn-share-trigger, [data-action='share']");
    if (shareTrigger) {
      e.preventDefault();
      window.openShareModal();
      return;
    }

    // Direct Theme Picker Card click
    const themeCard = e.target.closest(".theme-picker-card");
    if (themeCard) {
      e.preventDefault();
      const themeId = themeCard.getAttribute("data-theme-id");
      if (themeId) {
        applyTheme(themeId);
        const chosen = THEMES.find(t => t.id === themeId);
        showToast(`Atmosphere switched to ${chosen.name} ${chosen.icon}`);
      }
      return;
    }
  });

  if (shareCloseBtn) shareCloseBtn.addEventListener("click", () => window.closeShareModal());
  if (shareModal) {
    shareModal.addEventListener("click", (e) => {
      if (e.target === shareModal) window.closeShareModal();
    });
  }
}

// --------------------------------------------------------------------------
// 9. Customer Reviews & Live Submission
// --------------------------------------------------------------------------
async function loadReviewsData() {
  try {
    const res = await fetch(`${API_BASE}/api/reviews`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.reviews) {
        window.CUSTOMER_REVIEWS = data.reviews;
        window.currentRating = data.rating;
        window.currentReviewCount = data.reviewCount;
      }
    }
  } catch (err) {
    console.warn("Using local reviews fallback:", err);
  }
  renderReviewsSlider();
}

function renderReviewsSlider() {
  const container = document.getElementById("reviews-track");
  const dotsContainer = document.getElementById("review-dots");
  const reviews = window.CUSTOMER_REVIEWS || [];
  if (!container || reviews.length === 0) return;

  container.innerHTML = "";
  reviews.forEach(review => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-card-quote-icon">“</div>
      <div class="review-stars">
        ${Array(5).fill(0).map((_, i) => `
          <svg class="review-star-svg filled" width="18" height="18" viewBox="0 0 24 24" fill="${i < Math.floor(review.rating) ? 'var(--color-gold)' : 'none'}" stroke="var(--color-gold)" stroke-width="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        `).join("")}
      </div>
      <p class="review-text">"${review.text}"</p>
      <div class="review-author-wrap">
        <div class="review-author-avatar">${review.name.charAt(0)}</div>
        <div class="review-author-meta">
          <h4 class="review-author-name">${review.name}</h4>
          <span class="review-author-dish">Tried: <strong>${review.dish}</strong> • ${review.date}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    reviews.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = `review-dot ${i === 0 ? 'active' : ''}`;
      dot.setAttribute("aria-label", `Review ${i + 1}`);
      dot.addEventListener("click", () => goToReviewSlide(i));
      dotsContainer.appendChild(dot);
    });
  }
}

let currentReviewIndex = 0;
function goToReviewSlide(idx) {
  const container = document.getElementById("reviews-track");
  const dotsContainer = document.getElementById("review-dots");
  const reviews = window.CUSTOMER_REVIEWS || [];
  if (!container) return;

  currentReviewIndex = Math.max(0, Math.min(idx, reviews.length - 1));
  const cardWidth = container.querySelector(".review-card")?.offsetWidth || 340;
  const gap = 24;
  container.style.transform = `translateX(-${currentReviewIndex * (cardWidth + gap)}px)`;

  if (dotsContainer) {
    dotsContainer.querySelectorAll(".review-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentReviewIndex);
    });
  }
}

function initReviewsCarousel() {
  const prevBtn = document.getElementById("review-prev");
  const nextBtn = document.getElementById("review-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const reviews = window.CUSTOMER_REVIEWS || [];
      goToReviewSlide(currentReviewIndex === 0 ? reviews.length - 1 : currentReviewIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const reviews = window.CUSTOMER_REVIEWS || [];
      goToReviewSlide((currentReviewIndex + 1) % reviews.length);
    });
  }

  window.addEventListener("resize", () => goToReviewSlide(currentReviewIndex), { passive: true });
}

function initReviewSubmissionModal() {
  const modal = document.getElementById("review-modal");
  const openBtn = document.getElementById("btn-open-review-modal");
  const closeBtn = document.getElementById("review-modal-close");
  const form = document.getElementById("review-submission-form");
  const starButtons = document.querySelectorAll(".star-rate-btn");
  let selectedRating = 5;

  // Star selector logic
  starButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedRating = parseInt(btn.getAttribute("data-rate")) || 5;
      starButtons.forEach((b, idx) => {
        b.classList.toggle("active", idx < selectedRating);
      });
    });
  });

  const toggleReviewModal = (open) => {
    if (!modal) return;
    if (open) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    } else {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  if (openBtn) openBtn.addEventListener("click", () => toggleReviewModal(true));
  if (closeBtn) closeBtn.addEventListener("click", () => toggleReviewModal(false));
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) toggleReviewModal(false);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const reviewPayload = {
        name: document.getElementById("reviewer-name")?.value || "Guest",
        dish: document.getElementById("reviewer-dish")?.value || "Chicken Mandi",
        rating: selectedRating,
        text: document.getElementById("reviewer-text")?.value || ""
      };

      try {
        const response = await fetch(`${API_BASE}/api/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewPayload)
        });

        const result = await response.json();
        if (result.success) {
          toggleReviewModal(false);
          showToast("Thank you! Your review has been submitted.");

          // Update stats on page
          const ratingEl = document.getElementById("counter-rating");
          const reviewsEl = document.getElementById("counter-reviews");
          if (ratingEl) ratingEl.textContent = result.rating;
          if (reviewsEl) reviewsEl.textContent = `${result.reviewCount}+`;

          // Refresh reviews
          loadReviewsData();
        }
      } catch (err) {
        console.error("Review submit error:", err);
        showToast("Review saved locally. Thank you for your feedback!");
        toggleReviewModal(false);
      }
    });
  }
}

// --------------------------------------------------------------------------
// 10. Animated Counters & Viewport Observer
// --------------------------------------------------------------------------
function initCounters() {
  const ratingSection = document.getElementById("rating-stats-bar");
  if (!ratingSection) return;

  let hasAnimated = false;

  const runCounterAnimation = () => {
    if (hasAnimated) return;
    hasAnimated = true;

    const ratingEl = document.getElementById("counter-rating");
    if (ratingEl) {
      const targetRating = window.currentRating || 4.3;
      const duration = 1200;
      const startTime = performance.now();

      const animateRating = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - (1 - progress) * (1 - progress);
        ratingEl.textContent = (ease * targetRating).toFixed(1);

        if (progress < 1) {
          requestAnimationFrame(animateRating);
        } else {
          ratingEl.textContent = targetRating.toFixed(1);
          animateStars();
        }
      };
      requestAnimationFrame(animateRating);
    }

    const reviewsEl = document.getElementById("counter-reviews");
    if (reviewsEl) {
      const targetReviews = window.currentReviewCount || 872;
      const duration = 1400;
      const startTime = performance.now();

      const animateReviews = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - (1 - progress) * (1 - progress);
        reviewsEl.textContent = `${Math.floor(ease * targetReviews)}+`;

        if (progress < 1) {
          requestAnimationFrame(animateReviews);
        } else {
          reviewsEl.textContent = `${targetReviews}+`;
        }
      };
      requestAnimationFrame(animateReviews);
    }
  };

  const animateStars = () => {
    const stars = document.querySelectorAll(".rating-stars-list .star-icon");
    stars.forEach((star, i) => {
      setTimeout(() => star.classList.add("star-active"), i * 140);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) runCounterAnimation();
    });
  }, { threshold: 0.3 });

  observer.observe(ratingSection);
}

// --------------------------------------------------------------------------
// 11. Lightbox, Back to Top, Toast Helper
// --------------------------------------------------------------------------
function initGalleryLightbox() {
  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (!lightbox || !lightboxImg) return;

  galleryItems.forEach(item => {
    item.addEventListener("click", () => {
      const src = item.getAttribute("data-full-img") || item.querySelector("img")?.src;
      const caption = item.getAttribute("data-caption") || "Tastify Arabian Mandi";

      lightboxImg.src = src;
      if (lightboxCaption) lightboxCaption.textContent = caption;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

function initBackToTop() {
  const btt = document.getElementById("back-to-top");
  if (!btt) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      btt.classList.add("visible");
    } else {
      btt.classList.remove("visible");
    }
  }, { passive: true });

  btt.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function showToast(message) {
  let toast = document.getElementById("site-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "site-toast";
    toast.className = "site-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// --------------------------------------------------------------------------
// Customer Authentication & Account Management System
// --------------------------------------------------------------------------
function initCustomerAuthSystem() {
  const authModal = document.getElementById("customer-auth-modal");
  const authClose = document.getElementById("cust-auth-modal-close");
  const profileModal = document.getElementById("customer-profile-modal");
  const profileClose = document.getElementById("cust-profile-modal-close");

  const tabBtnSignin = document.getElementById("tab-btn-signin");
  const tabBtnRegister = document.getElementById("tab-btn-register");
  const signinForm = document.getElementById("cust-signin-form");
  const registerForm = document.getElementById("cust-register-form");
  const authAlert = document.getElementById("cust-auth-alert");

  const pillToggleBtn = document.getElementById("btn-customer-pill-toggle");
  const navDropdown = document.getElementById("customer-nav-dropdown");

  const dropdownProfileBtn = document.getElementById("dropdown-btn-profile");
  const dropdownOrdersBtn = document.getElementById("dropdown-btn-orders");
  const dropdownLogoutBtn = document.getElementById("dropdown-btn-logout");

  const tabOrdersView = document.getElementById("tab-btn-orders-view");
  const tabAddressView = document.getElementById("tab-btn-address-view");
  const ordersViewPane = document.getElementById("profile-orders-view");
  const profileEditForm = document.getElementById("profile-edit-form");
  const profileAlert = document.getElementById("cust-profile-alert");
  const btnCancelProfileEdit = document.getElementById("btn-cancel-profile-edit");

  // Pre-fill checkout with customer details (HOISTED function declaration)
  function prefillCustomerCheckout() {
    if (!window.currentCustomer) return;
    const c = window.currentCustomer;
    const nameInput = document.getElementById("order-name");
    const phoneInput = document.getElementById("order-phone");
    const line1Input = document.getElementById("order-address-line1");
    const landmarkInput = document.getElementById("order-address-landmark");

    if (nameInput && (!nameInput.value || nameInput.value.trim() === '')) {
      nameInput.value = c.name || '';
    }
    if (phoneInput && (!phoneInput.value || phoneInput.value.trim() === '')) {
      phoneInput.value = c.phone || '';
    }
    if (c.address) {
      if (line1Input && (!line1Input.value || line1Input.value.trim() === '')) {
        line1Input.value = c.address.line1 || '';
      }
      if (landmarkInput && (!landmarkInput.value || landmarkInput.value.trim() === '')) {
        landmarkInput.value = c.address.landmark || '';
      }
    }
  }
  window.prefillCustomerCheckout = prefillCustomerCheckout;

  // Auth Modal Open/Close helpers
  function openCustomerAuthModal(tab = 'signin') {
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (authAlert) authAlert.style.display = 'none';
    switchAuthTab(tab);
    if (authModal) {
      authModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }
  window.openCustomerAuthModal = openCustomerAuthModal;

  function closeCustomerAuthModal() {
    if (authModal) {
      authModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
  window.closeCustomerAuthModal = closeCustomerAuthModal;

  // Profile Modal Open/Close helpers
  function openCustomerProfileModal(tab = 'orders') {
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (!window.currentCustomer) {
      openCustomerAuthModal('signin');
      return;
    }
    if (profileAlert) profileAlert.style.display = 'none';
    switchProfileTab(tab);
    if (profileModal) {
      profileModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }
  window.openCustomerProfileModal = openCustomerProfileModal;

  function closeCustomerProfileModal() {
    if (profileModal) {
      profileModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }
  window.closeCustomerProfileModal = closeCustomerProfileModal;

  function loadCustomerSession() {
    try {
      const saved = localStorage.getItem('tastify_customer_user');
      window.currentCustomer = saved ? JSON.parse(saved) : null;
    } catch (e) {
      window.currentCustomer = null;
    }
    updateCustomerUI();
  }

  async function syncCustomerWithBackend() {
    const token = localStorage.getItem('tastify_customer_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.customer) {
          window.currentCustomer = data.customer;
          localStorage.setItem('tastify_customer_user', JSON.stringify(data.customer));
          updateCustomerUI();
        }
      }
    } catch (err) {
      // Backend sync fallback
    }
  }

  function updateCustomerUI() {
    const loginBtn = document.getElementById("btn-customer-login-nav");
    const profilePill = document.getElementById("customer-profile-pill");
    const avatarEl = document.getElementById("customer-pill-avatar");
    const nameEl = document.getElementById("customer-pill-name");
    const dropdownName = document.getElementById("dropdown-user-name");
    const dropdownPhone = document.getElementById("dropdown-user-phone");
    const mobileBtnText = document.getElementById("mobile-cust-btn-text");
    const checkoutBanner = document.getElementById("checkout-customer-banner");
    const checkoutBannerText = document.getElementById("checkout-customer-banner-text");

    if (window.currentCustomer) {
      const c = window.currentCustomer;
      const firstName = (c.name || 'Guest').trim().split(' ')[0];
      const initial = (firstName[0] || 'G').toUpperCase();

      if (loginBtn) loginBtn.style.display = "none";
      if (profilePill) profilePill.style.display = "block";
      if (avatarEl) avatarEl.textContent = initial;
      if (nameEl) nameEl.textContent = firstName;
      if (dropdownName) dropdownName.textContent = c.name;
      if (dropdownPhone) dropdownPhone.textContent = c.phone ? `+91 ${c.phone}` : (c.email || '');
      if (mobileBtnText) mobileBtnText.textContent = `👤 ${firstName} (My Account)`;

      const profAvatar = document.getElementById("profile-display-avatar");
      const profName = document.getElementById("cust-profile-modal-title");
      const profPhone = document.getElementById("profile-display-phone");
      if (profAvatar) profAvatar.textContent = initial;
      if (profName) profName.textContent = c.name;
      if (profPhone) profPhone.textContent = c.phone ? `+91 ${c.phone}` : (c.email || '');

      if (checkoutBanner) checkoutBanner.classList.add("logged-in");
      if (checkoutBannerText) {
        checkoutBannerText.innerHTML = `<span>Signed in as <strong>${escapeHtml(c.name)}</strong> (${c.phone || c.email}). Delivery details are auto-filled.</span>`;
      }

      prefillCustomerCheckout();
    } else {
      if (loginBtn) loginBtn.style.display = "inline-flex";
      if (profilePill) profilePill.style.display = "none";
      if (mobileBtnText) mobileBtnText.textContent = "Customer Sign In / Register";

      if (checkoutBanner) checkoutBanner.classList.remove("logged-in");
      if (checkoutBannerText) {
        checkoutBannerText.innerHTML = `<span>Have a Tastify account?</span> <button type="button" class="banner-link-btn btn-cust-auth-trigger">Sign In for saved address &amp; fast checkout</button>`;
        const newLink = checkoutBannerText.querySelector(".btn-cust-auth-trigger");
        if (newLink) {
          newLink.addEventListener("click", () => openCustomerAuthModal('signin'));
        }
      }
    }
  }

  function switchAuthTab(tabName) {
    if (authAlert) authAlert.style.display = 'none';
    if (tabName === 'register') {
      if (tabBtnSignin) tabBtnSignin.classList.remove("active");
      if (tabBtnRegister) tabBtnRegister.classList.add("active");
      if (signinForm) signinForm.style.display = "none";
      if (registerForm) registerForm.style.display = "block";
    } else {
      if (tabBtnRegister) tabBtnRegister.classList.remove("active");
      if (tabBtnSignin) tabBtnSignin.classList.add("active");
      if (registerForm) registerForm.style.display = "none";
      if (signinForm) signinForm.style.display = "block";
    }
  }

  function switchProfileTab(tabName) {
    if (profileAlert) profileAlert.style.display = 'none';
    if (tabName === 'address') {
      if (tabOrdersView) tabOrdersView.classList.remove("active");
      if (tabAddressView) tabAddressView.classList.add("active");
      if (ordersViewPane) ordersViewPane.style.display = "none";
      if (profileEditForm) {
        profileEditForm.style.display = "block";
        populateProfileForm();
      }
    } else {
      if (tabAddressView) tabAddressView.classList.remove("active");
      if (tabOrdersView) tabOrdersView.classList.add("active");
      if (profileEditForm) profileEditForm.style.display = "none";
      if (ordersViewPane) ordersViewPane.style.display = "block";
      loadCustomerOrders();
    }
  }

  function populateProfileForm() {
    if (!window.currentCustomer) return;
    const c = window.currentCustomer;
    const nameInput = document.getElementById("edit-profile-name");
    const emailInput = document.getElementById("edit-profile-email");
    const line1Input = document.getElementById("edit-profile-line1");
    const landmarkInput = document.getElementById("edit-profile-landmark");

    if (nameInput) nameInput.value = c.name || '';
    if (emailInput) emailInput.value = c.email || '';
    if (c.address) {
      if (line1Input) line1Input.value = c.address.line1 || '';
      if (landmarkInput) landmarkInput.value = c.address.landmark || '';
    }
  }

  // Trigger bindings
  document.querySelectorAll(".btn-cust-auth-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (window.currentCustomer) {
        window.openCustomerProfileModal('orders');
      } else {
        window.openCustomerAuthModal('signin');
      }
    });
  });

  if (tabBtnSignin) tabBtnSignin.addEventListener("click", () => switchAuthTab('signin'));
  if (tabBtnRegister) tabBtnRegister.addEventListener("click", () => switchAuthTab('register'));

  document.querySelectorAll(".link-switch-tab").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target") || 'signin';
      switchAuthTab(target);
    });
  });

  if (authClose) authClose.addEventListener("click", () => window.closeCustomerAuthModal());
  if (profileClose) profileClose.addEventListener("click", () => window.closeCustomerProfileModal());

  // Close modals on outside click
  [authModal, profileModal].forEach(modal => {
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }
  });

  // Password visibility toggles with SVG icon swapping and visual feedback
  const SVG_EYE_OPEN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const SVG_EYE_SLASH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  function updatePwdToggleUI(btn, isVisible) {
    if (!btn) return;
    btn.innerHTML = isVisible ? SVG_EYE_SLASH : SVG_EYE_OPEN;
    btn.style.color = isVisible ? 'var(--color-gold)' : 'var(--color-sand-muted)';
    const label = isVisible ? 'Hide password' : 'Show password';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  function setupPwdToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    // Set initial icon and labels
    updatePwdToggleUI(btn, input.type === 'text');

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isCurrentlyText = input.type === 'text';
      input.type = isCurrentlyText ? 'password' : 'text';
      updatePwdToggleUI(btn, !isCurrentlyText);
      try { input.focus(); } catch (err) {}
    });
  }

  setupPwdToggle("btn-toggle-login-pwd", "cust-login-password");
  setupPwdToggle("btn-toggle-reg-pwd", "cust-reg-password");
  setupPwdToggle("btn-toggle-profile-cur-pwd", "edit-profile-cur-pwd");
  setupPwdToggle("btn-toggle-profile-new-pwd", "edit-profile-new-pwd");

  // Navbar dropdown toggle
  if (pillToggleBtn && navDropdown) {
    pillToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = navDropdown.classList.contains("active");
      navDropdown.classList.toggle("active", !isActive);
      pillToggleBtn.classList.toggle("active", !isActive);
      pillToggleBtn.setAttribute("aria-expanded", !isActive ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!navDropdown.contains(e.target) && !pillToggleBtn.contains(e.target)) {
        navDropdown.classList.remove("active");
        pillToggleBtn.classList.remove("active");
        pillToggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (dropdownProfileBtn) {
    dropdownProfileBtn.addEventListener("click", () => {
      if (navDropdown) navDropdown.classList.remove("active");
      if (pillToggleBtn) pillToggleBtn.classList.remove("active");
      window.openCustomerProfileModal('address');
    });
  }

  if (dropdownOrdersBtn) {
    dropdownOrdersBtn.addEventListener("click", () => {
      if (navDropdown) navDropdown.classList.remove("active");
      if (pillToggleBtn) pillToggleBtn.classList.remove("active");
      window.openCustomerProfileModal('orders');
    });
  }

  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener("click", () => {
      if (navDropdown) navDropdown.classList.remove("active");
      if (pillToggleBtn) pillToggleBtn.classList.remove("active");
      logoutCustomer();
    });
  }

  function logoutCustomer() {
    localStorage.removeItem('tastify_customer_token');
    localStorage.removeItem('tastify_customer_user');
    window.currentCustomer = null;
    updateCustomerUI();
    window.closeCustomerProfileModal();
    showToast("You have been signed out.");
  }

  if (tabOrdersView) tabOrdersView.addEventListener("click", () => switchProfileTab('orders'));
  if (tabAddressView) tabAddressView.addEventListener("click", () => switchProfileTab('address'));
  if (btnCancelProfileEdit) btnCancelProfileEdit.addEventListener("click", () => switchProfileTab('orders'));

  // SIGN IN SUBMISSION
  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("cust-login-identifier");
      const pwdInput = document.getElementById("cust-login-password");
      const submitBtn = document.getElementById("btn-cust-signin-submit");

      const identifier = idInput ? idInput.value.trim() : "";
      const password = pwdInput ? pwdInput.value.trim() : "";

      if (!identifier || !password) {
        showAuthAlert("Please provide phone/email and password.", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Signing in...</span>`;
      }

      try {
        let success = false;
        let responseData = null;

        try {
          const res = await fetch(`${API_BASE}/api/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
          });
          responseData = await res.json();
          if (res.ok && responseData.success) {
            success = true;
          }
        } catch (fetchErr) {
          // If server call fails, check local fallback
        }

        // Local fallback if server returned 404 or failed
        if (!success && (!responseData || !responseData.message)) {
          const locals = JSON.parse(localStorage.getItem('tastify_local_customers') || '[]');
          const cleanDigits = identifier.replace(/\D/g, '');
          const found = locals.find(c => {
            const cDigits = (c.phone || '').replace(/\D/g, '');
            return (cleanDigits && cDigits.endsWith(cleanDigits.slice(-10))) || (c.email && c.email.toLowerCase() === identifier.toLowerCase());
          });
          if (found && (found.password === password || !found.password)) {
            success = true;
            responseData = {
              success: true,
              token: 'local_' + Date.now(),
              customer: found,
              message: `Welcome back, ${found.name}!`
            };
          }
        }

        if (success && responseData) {
          localStorage.setItem('tastify_customer_token', responseData.token || 'cust_token');
          localStorage.setItem('tastify_customer_user', JSON.stringify(responseData.customer));
          window.currentCustomer = responseData.customer;
          updateCustomerUI();
          window.closeCustomerAuthModal();
          showToast(`Welcome back, ${responseData.customer.name}!`);
        } else {
          showAuthAlert((responseData && responseData.message) || "Invalid credentials. Please verify your details.", "error");
        }
      } catch (err) {
        showAuthAlert("Connection error. Please try again.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In to Account</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
        }
      }
    });
  }

  // REGISTER SUBMISSION
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById("cust-reg-name");
      const phoneInput = document.getElementById("cust-reg-phone");
      const emailInput = document.getElementById("cust-reg-email");
      const pwdInput = document.getElementById("cust-reg-password");
      const line1Input = document.getElementById("cust-reg-line1");
      const landmarkInput = document.getElementById("cust-reg-landmark");
      const submitBtn = document.getElementById("btn-cust-register-submit");

      const name = nameInput ? nameInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const password = pwdInput ? pwdInput.value.trim() : "";
      const line1 = line1Input ? line1Input.value.trim() : "";
      const landmark = landmarkInput ? landmarkInput.value.trim() : "";

      if (!name) {
        showAuthAlert("Please enter your name.", "error");
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        showAuthAlert("Please enter a valid 10-digit mobile number.", "error");
        return;
      }
      if (!password || password.length < 6) {
        showAuthAlert("Password must be at least 6 characters.", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Creating your account...</span>`;
      }

      const payload = {
        name,
        phone: cleanPhone,
        email,
        password,
        line1,
        landmark,
        area: "Maisammaguda, Hyderabad (500100)"
      };

      try {
        let success = false;
        let responseData = null;

        try {
          const res = await fetch(`${API_BASE}/api/customer/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          responseData = await res.json();
          if (res.ok && responseData.success) {
            success = true;
          }
        } catch (fetchErr) {
          // If server call fails
        }

        // Local fallback
        if (!success && (!responseData || !responseData.message)) {
          const locals = JSON.parse(localStorage.getItem('tastify_local_customers') || '[]');
          const newCust = {
            id: 'CUST-' + Date.now().toString().slice(-6),
            name,
            phone: cleanPhone,
            email,
            password,
            address: { line1, landmark, area: 'Maisammaguda, Hyderabad (500100)' }
          };
          locals.push(newCust);
          localStorage.setItem('tastify_local_customers', JSON.stringify(locals));
          success = true;
          responseData = {
            success: true,
            token: 'local_' + Date.now(),
            customer: newCust,
            message: `Welcome to Tastify, ${newCust.name}!`
          };
        }

        if (success && responseData) {
          localStorage.setItem('tastify_customer_token', responseData.token || 'cust_token');
          localStorage.setItem('tastify_customer_user', JSON.stringify(responseData.customer));
          window.currentCustomer = responseData.customer;
          updateCustomerUI();
          window.closeCustomerAuthModal();
          showToast(`🎉 Account created! Welcome, ${responseData.customer.name}!`);
        } else {
          showAuthAlert((responseData && responseData.message) || "Could not register account. Please check your details.", "error");
        }
      } catch (err) {
        showAuthAlert("Registration error. Please try again.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Create Account &amp; Start Ordering</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
        }
      }
    });
  }

  // PROFILE EDIT SUBMISSION
  if (profileEditForm) {
    profileEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("edit-profile-name").value.trim();
      const email = document.getElementById("edit-profile-email").value.trim();
      const line1 = document.getElementById("edit-profile-line1").value.trim();
      const landmark = document.getElementById("edit-profile-landmark").value.trim();
      const curPwd = document.getElementById("edit-profile-cur-pwd").value.trim();
      const newPwd = document.getElementById("edit-profile-new-pwd").value.trim();
      const submitBtn = document.getElementById("btn-save-profile-submit");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving Changes...</span>`;
      }

      const updateData = {
        name,
        email,
        line1,
        landmark,
        area: "Maisammaguda, Hyderabad (500100)",
        currentPassword: curPwd,
        newPassword: newPwd
      };

      const token = localStorage.getItem('tastify_customer_token');

      try {
        let success = false;
        let responseData = null;

        try {
          const res = await fetch(`${API_BASE}/api/customer/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
          });
          responseData = await res.json();
          if (res.ok && responseData.success) {
            success = true;
          }
        } catch (fetchErr) {}

        // Fallback for local update
        if (!success) {
          if (window.currentCustomer) {
            window.currentCustomer.name = name;
            window.currentCustomer.email = email;
            window.currentCustomer.address = { line1, landmark, area: 'Maisammaguda, Hyderabad (500100)' };
            localStorage.setItem('tastify_customer_user', JSON.stringify(window.currentCustomer));
            const locals = JSON.parse(localStorage.getItem('tastify_local_customers') || '[]');
            const idx = locals.findIndex(c => c.id === window.currentCustomer.id);
            if (idx >= 0) {
              locals[idx] = window.currentCustomer;
              localStorage.setItem('tastify_local_customers', JSON.stringify(locals));
            }
            success = true;
            responseData = { success: true, message: 'Profile updated locally.' };
          }
        }

        if (success) {
          if (responseData && responseData.customer) {
            window.currentCustomer = responseData.customer;
            localStorage.setItem('tastify_customer_user', JSON.stringify(responseData.customer));
          }
          updateCustomerUI();
          showProfileAlert("Profile and address updated successfully!", "success");
          showToast("Profile & address saved!");
          setTimeout(() => switchProfileTab('orders'), 1200);
        } else {
          showProfileAlert((responseData && responseData.message) || "Failed to update profile.", "error");
        }
      } catch (err) {
        showProfileAlert("Error saving profile.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Save Profile &amp; Address</span>`;
        }
      }
    });
  }

  async function loadCustomerOrders() {
    const loadingEl = document.getElementById("profile-orders-loading");
    const emptyEl = document.getElementById("profile-orders-empty");
    const listEl = document.getElementById("profile-orders-container");

    if (!listEl) return;
    if (loadingEl) loadingEl.style.display = "block";
    if (emptyEl) emptyEl.style.display = "none";
    listEl.innerHTML = "";

    const token = localStorage.getItem('tastify_customer_token');
    const phone = window.currentCustomer ? (window.currentCustomer.phone || '').replace(/\D/g, '') : '';
    const customerId = window.currentCustomer ? window.currentCustomer.id : '';

    let orders = [];

    try {
      const url = `${API_BASE}/api/customer/orders?phone=${encodeURIComponent(phone)}&customerId=${encodeURIComponent(customerId)}`;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          orders = data.orders;
        }
      }
    } catch (err) {}

    // Fallback: search all orders by customer phone or customerId
    if (orders.length === 0 && phone) {
      try {
        const allOrdersRes = await fetch(`${API_BASE}/api/orders`);
        if (allOrdersRes.ok) {
          const allOrders = await allOrdersRes.json();
          if (Array.isArray(allOrders)) {
            orders = allOrders.filter(o => {
              if (customerId && o.customerId === customerId) return true;
              if (o.phone && o.phone.replace(/\D/g, '').endsWith(phone.slice(-10))) return true;
              return false;
            });
          }
        }
      } catch (e) {}
    }

    if (loadingEl) loadingEl.style.display = "none";

    if (orders.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    orders.forEach(order => {
      const card = document.createElement("div");
      card.className = "customer-order-card";

      const statusClass = `status-${(order.status || 'received').toLowerCase()}`;
      const itemsText = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

      card.innerHTML = `
        <div class="order-card-header">
          <div class="order-card-id-block">
            <h5>#${escapeHtml(order.orderId)}</h5>
            <span class="order-card-date">${escapeHtml(order.createdAt || 'Recent')} • ${order.deliveryType === 'delivery' ? 'Home Delivery' : (order.deliveryType === 'takeaway' ? 'Self Pickup' : 'Dine-In')}</span>
          </div>
          <span class="order-status-badge ${statusClass}">
            <span>${escapeHtml(order.status || 'Received')}</span>
          </span>
        </div>
        <p class="order-card-items-summary">
          <strong style="color: var(--color-sand);">Dishes:</strong> ${escapeHtml(itemsText)}
        </p>
        ${order.address && order.deliveryType === 'delivery' ? `<p style="font-size: 0.78rem; color: var(--color-sand-muted); margin-bottom: 0.5rem;"><i class="fa-solid fa-location-dot" style="color: var(--color-gold);"></i> ${escapeHtml(order.address)}</p>` : ''}
        <div class="order-card-footer">
          <div>
            <span style="font-size: 0.75rem; color: var(--color-sand-muted); display: block;">Total Amount</span>
            <span class="order-card-total-val">₹${order.grandTotal || order.subtotal || 0}</span>
          </div>
          <button type="button" class="btn-track-card btn-order-track-action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Track Live Order</span>
          </button>
        </div>
      `;

      const trackBtn = card.querySelector(".btn-order-track-action");
      if (trackBtn) {
        trackBtn.addEventListener("click", () => {
          window.closeCustomerProfileModal();
          startLiveOrderTracking(order);
        });
      }

      listEl.appendChild(card);
    });
  }

  function showAuthAlert(msg, type = 'error') {
    if (!authAlert) return;
    authAlert.textContent = msg;
    authAlert.className = `cust-auth-alert ${type}`;
    authAlert.style.display = 'block';
  }

  function showProfileAlert(msg, type = 'error') {
    if (!profileAlert) return;
    profileAlert.textContent = msg;
    profileAlert.className = `cust-auth-alert ${type}`;
    profileAlert.style.display = 'block';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Safely load active customer session after all helpers & elements are bound
  loadCustomerSession();
  syncCustomerWithBackend();
}

// --------------------------------------------------------------------------
// Universal Document Event Delegation for Customer Website Buttons
// Guarantees all interactive buttons (password toggle, auth, tabs, order, 
// cart, reservations, share) work even if dynamically rendered or refreshed.
// --------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  // 1. Universal Password Visibility Toggle
  const toggleBtn = e.target.closest(".pwd-toggle-btn");
  if (toggleBtn) {
    e.preventDefault();
    e.stopPropagation();
    let targetInput = null;
    const forId = toggleBtn.getAttribute("data-for");
    if (forId) targetInput = document.getElementById(forId);
    if (!targetInput) {
      const container = toggleBtn.closest(".input-with-icon") || toggleBtn.parentElement;
      if (container) targetInput = container.querySelector("input");
    }
    if (targetInput) {
      const isCurrentlyText = targetInput.type === 'text';
      targetInput.type = isCurrentlyText ? 'password' : 'text';
      const isVisible = !isCurrentlyText;
      toggleBtn.innerHTML = isVisible
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      toggleBtn.style.color = isVisible ? 'var(--color-gold)' : 'var(--color-sand-muted)';
      const label = isVisible ? 'Hide password' : 'Show password';
      toggleBtn.setAttribute('aria-label', label);
      toggleBtn.setAttribute('title', label);
      try { targetInput.focus(); } catch (err) {}
    }
    return;
  }

  // 2. Customer Auth Trigger (.btn-cust-auth-trigger)
  const authTrigger = e.target.closest(".btn-cust-auth-trigger");
  if (authTrigger) {
    e.preventDefault();
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (window.currentCustomer) {
      if (typeof window.openCustomerProfileModal === 'function') {
        window.openCustomerProfileModal('orders');
      }
    } else {
      if (typeof window.openCustomerAuthModal === 'function') {
        window.openCustomerAuthModal('signin');
      }
    }
    return;
  }

  // 3. Auth Tab Switch (.link-switch-tab or .auth-tab-btn[data-tab])
  const tabLink = e.target.closest(".link-switch-tab");
  if (tabLink) {
    e.preventDefault();
    const target = tabLink.getAttribute("data-target") || 'signin';
    if (typeof window.switchCustomerAuthTab === 'function') {
      window.switchCustomerAuthTab(target);
    }
    return;
  }

  // 4. Order / Cart Trigger (.btn-order-trigger, #btn-open-cart)
  const orderTrigger = e.target.closest(".btn-order-trigger, #btn-open-cart");
  if (orderTrigger) {
    e.preventDefault();
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (typeof window.openOrderModal === 'function') {
      window.openOrderModal();
    }
    return;
  }

  // 5. Add to Cart (.btn-add-cart)
  const addCartBtn = e.target.closest(".btn-add-cart");
  if (addCartBtn) {
    e.preventDefault();
    const dishId = addCartBtn.getAttribute("data-dish-id");
    if (dishId && typeof window.addToCart === 'function') {
      window.addToCart(dishId);
    }
    return;
  }

  // 6. Table Reservation Trigger (.btn-reserve-trigger)
  const reserveTrigger = e.target.closest(".btn-reserve-trigger");
  if (reserveTrigger) {
    e.preventDefault();
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (typeof window.openReservationModal === 'function') {
      window.openReservationModal();
    }
    return;
  }

  // 7. Share Modal Trigger (.btn-share-trigger)
  const shareTrigger = e.target.closest(".btn-share-trigger");
  if (shareTrigger) {
    e.preventDefault();
    if (window.closeMobileMenu) window.closeMobileMenu();
    if (typeof window.openShareModal === 'function') {
      window.openShareModal();
    }
    return;
  }
});

// Global Escape Key to close open modals
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (typeof window.closeCustomerAuthModal === 'function') window.closeCustomerAuthModal();
    if (typeof window.closeCustomerProfileModal === 'function') window.closeCustomerProfileModal();
    if (typeof window.closeOrderModal === 'function') window.closeOrderModal();
    if (typeof window.closeReservationModal === 'function') window.closeReservationModal();
    if (typeof window.closeShareModal === 'function') window.closeShareModal();
    if (typeof window.closeMobileMenu === 'function') window.closeMobileMenu();
  }
});
