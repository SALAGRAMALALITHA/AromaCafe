/* ---------- Cart helpers ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('aromaCart') || '[]');
  } catch (e) {
    return [];
  }
}

function saveCart(cart, syncBackend = true) {
  localStorage.setItem('aromaCart', JSON.stringify(cart));
  if (syncBackend) syncCartWithBackend(cart);
}

async function syncCartWithBackend(cart) {
  if (!getToken()) return;
  const backendCart = cart.map(i => ({
    name:  i.name,
    price: i.price,
    image: i.img || i.image || '',
    qty:   i.qty
  }));
  try {
    await apiRequest('/users/me/cart', {
      method: 'PUT',
      body: JSON.stringify({ cart: backendCart })
    });
  } catch (err) {
    // silently fail; local cart is still saved
    console.log('Cart sync failed:', err.message);
  }
}

async function loadCartFromBackend() {
  if (!getToken()) return;
  try {
    const backendCart = await apiRequest('/users/me/cart');
    if (!Array.isArray(backendCart) || backendCart.length === 0) return;

    const localCart = getCart();
    const merged = [...localCart];
    backendCart.forEach(bi => {
      const existing = merged.find(i => i.name === bi.name);
      if (existing) {
        existing.qty = Math.max(existing.qty, bi.qty);
      } else {
        merged.push({
          name:  bi.name,
          price: bi.price,
          img:   bi.image || bi.img || '',
          qty:   bi.qty
        });
      }
    });
    saveCart(merged, false);
  } catch (err) {
    console.log('Could not load cart from backend:', err.message);
  }
}

/* ============================================================
   API CONFIG
   Change API_BASE if your backend ever runs somewhere else
   (a different port locally, or a real domain after deploying).
   ============================================================ */
/* Deployment: set window.API_BASE in a <script> tag before c.js is loaded,
   e.g. <script>window.API_BASE = 'https://your-backend.com/api';</script>
   If not set, it defaults to the local dev backend. */
const API_BASE = (window.API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');

function getToken()      { return localStorage.getItem('aromaToken'); }
function setToken(token) { localStorage.setItem('aromaToken', token); }
function clearToken()    { localStorage.removeItem('aromaToken'); }

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

/* ============================================================
   ACCOUNT / USER DATA LAYER — now backed by the real API.
   Every page (loginpage.html, account.html, checkout below)
   calls only these functions, never fetch() or localStorage
   directly, so this is the only place that needs to change if
   the API ever moves.
   ============================================================ */
async function registerUser({ name, email, password, phone }) {
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
    setToken(data.token);
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function loginUser(email, password) {
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return { ok: true, user: data.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getCurrentUser() {
  if (!getToken()) return null;
  try {
    return await apiRequest('/users/me');
  } catch (err) {
    clearToken();  // token was invalid/expired — clear it so we don't keep retrying
    return null;
  }
}

async function updateUserProfile(updates) {
  return apiRequest('/users/me', { method: 'PUT', body: JSON.stringify(updates) });
}

async function addAddress(address) {
  return apiRequest('/users/me/addresses', { method: 'POST', body: JSON.stringify(address) });
}

async function updateAddress(addressId, updates) {
  return apiRequest('/users/me/addresses/' + addressId, { method: 'PUT', body: JSON.stringify(updates) });
}

async function deleteAddress(addressId) {
  return apiRequest('/users/me/addresses/' + addressId, { method: 'DELETE' });
}

async function getOrders() {
  return apiRequest('/orders');
}

async function saveOrder(order) {
  return apiRequest('/orders', { method: 'POST', body: JSON.stringify(order) });
}

/* ============================================================
   ADMIN DATA LAYER — only usable by a logged-in user whose
   account has role: 'admin' (the backend enforces this; these
   calls simply fail with a 403 for anyone else).
   ============================================================ */
async function getAllOrders() {
  return apiRequest('/admin/orders');
}

async function updateOrderStatus(orderId, status) {
  return apiRequest('/admin/orders/' + orderId + '/status', {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

function addToCart(name, price, img) {
  const cart = getCart();
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price: parseFloat(price), img, qty: 1 });
  }
  saveCart(cart);
  updateCartBadge();
  showToast(name + ' added to cart!');
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateCartBadge();
  renderCartPage();
}

function updateQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart(cart);
  updateCartBadge();
  renderCartPage();
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count > 0 ? count : '';
}

/* ---------- Button loading state ---------- */
function setButtonLoading(btn, loading, loadingText = 'Please wait…') {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
  }
}

/* ---------- Toast ---------- */
function showToast(msg, type = 'success') {
  const styles = {
    success: { bg: '#2a1503', icon: '✅' },
    error:   { bg: '#b3261e', icon: '⚠️' },
    info:    { bg: '#2a1503', icon: 'ℹ️' }
  };
  const { bg, icon } = styles[type] || styles.success;

  let toast = document.getElementById('aromaToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aromaToast';
    toast.style.cssText = [
      'position:fixed',
      'bottom:30px',
      'right:30px',
      'z-index:9999',
      'color:#fff',
      'padding:14px 24px',
      'border-radius:8px',
      'font-size:15px',
      'font-family:Roboto,sans-serif',
      'box-shadow:0 4px 14px rgba(0,0,0,0.3)',
      'opacity:0',
      'transition:opacity 0.3s ease, background 0.2s ease',
      'pointer-events:none',
      'max-width:320px'
    ].join(';');
    document.body.appendChild(toast);
  }
  toast.style.background = bg;
  toast.textContent = icon + ' ' + msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

/* ---------- Cart page renderer ---------- */
function renderCartPage() {
  const container = document.getElementById('cart-items-list');
  const totalEl   = document.getElementById('cart-page-total');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#888;">
        <i class="fas fa-shopping-cart" style="font-size:60px;opacity:0.3;"></i>
        <p style="font-size:1.4rem;margin-top:16px;">Your cart is empty.</p>
        <a href="home.html" style="display:inline-block;margin-top:16px;padding:10px 28px;
           background:#2a1503;color:#fff;border-radius:6px;text-decoration:none;">
          Continue Shopping
        </a>
      </div>`;
    if (totalEl) totalEl.textContent = 'Rs. 0';
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  container.innerHTML = cart.map((item, i) => `
    <div style="display:flex;align-items:center;gap:16px;padding:16px 0;
                border-bottom:1px solid #eee;flex-wrap:wrap;">
      <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}"
           style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0;">
      <div style="flex:1;min-width:120px;">
        <h3 style="color:#2a1503;font-size:1.1rem;margin:0 0 4px;">${escapeHtml(item.name)}</h3>
        <div style="color:#666;font-size:0.9rem;">Rs. ${item.price} each</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button data-action="dec" data-idx="${i}"
          style="width:32px;height:32px;border-radius:50%;border:2px solid #2a1503;
                 background:#fff;color:#2a1503;cursor:pointer;font-size:18px;font-weight:bold;">−</button>
        <span style="min-width:24px;text-align:center;font-weight:bold;">${item.qty}</span>
        <button data-action="inc" data-idx="${i}"
          style="width:32px;height:32px;border-radius:50%;background:#2a1503;color:#fff;
                 border:none;cursor:pointer;font-size:18px;font-weight:bold;">+</button>
      </div>
      <div style="min-width:90px;text-align:right;font-weight:bold;color:#2a1503;">
        Rs. ${item.price * item.qty}
      </div>
      <button data-action="remove" data-idx="${i}"
        style="background:none;border:none;cursor:pointer;color:#cc0000;font-size:18px;padding:4px 8px;">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>`).join('');

  if (totalEl) totalEl.textContent = 'Rs. ' + total;
}

/* ============================================================
   CHECKOUT ADDRESS SELECTOR (cart.html)
   Lets the customer pick a saved address or add a new one
   inline, right where they're checking out.
   ============================================================ */
async function renderAddressSelector() {
  const mount = document.getElementById('addressOptionsList');
  if (!mount) return; // not on cart.html

  const showBtn = document.getElementById('showAddAddressCart');
  const form = document.getElementById('inlineAddressForm');
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    mount.innerHTML = `
      <p style="color:#888;">
        <a href="loginpage.html" style="color:var(--primary-color);font-weight:600;">Sign in</a>
        to choose a delivery address.
      </p>`;
    if (showBtn) showBtn.style.display = 'none';
    if (form) {
      form.classList.remove('active');
      form.style.display = '';
    }
    return;
  }

  if (showBtn) showBtn.style.display = 'block';
  if (form) form.style.display = '';

  const addresses = currentUser.addresses || [];

  if (!addresses.length) {
    mount.innerHTML = `<p style="color:#888;">No saved addresses yet — add one below.</p>`;
  } else {
    mount.innerHTML = addresses.map(a => `
      <label class="address-card selectable ${a.isDefault ? 'default' : ''}">
        <input type="radio" name="deliveryAddress" value="${a._id}" ${a.isDefault ? 'checked' : ''}>
        ${a.isDefault ? '<span class="default-badge">Default</span>' : ''}
        <strong>${escapeHtml(a.label)}</strong><br>
        ${escapeHtml(a.line1)}${a.line2 ? ', ' + escapeHtml(a.line2) : ''}<br>
        ${escapeHtml(a.city)}, ${escapeHtml(a.state)} - ${escapeHtml(a.pincode)}
      </label>
    `).join('');

    // if nothing is marked default, select the first one automatically
    if (!addresses.some(a => a.isDefault)) {
      const firstRadio = mount.querySelector('input[type="radio"]');
      if (firstRadio) firstRadio.checked = true;
    }
  }
}

/* Wires the "+ Add a New Address" inline form on cart.html */
function wireInlineAddressForm() {
  const showBtn = document.getElementById('showAddAddressCart');
  const form    = document.getElementById('inlineAddressForm');
  if (!showBtn || !form) return; // not on cart.html

  showBtn.addEventListener('click', () => {
    form.classList.add('active');
    showBtn.style.display = 'none';
  });

  document.getElementById('cancelAddressCart').addEventListener('click', () => {
    form.classList.remove('active');
    showBtn.style.display = 'block';
    form.reset();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const data = {
      label: document.getElementById('ca-label').value.trim(),
      line1: document.getElementById('ca-line1').value.trim(),
      line2: document.getElementById('ca-line2').value.trim(),
      city: document.getElementById('ca-city').value.trim(),
      state: document.getElementById('ca-state').value.trim(),
      pincode: document.getElementById('ca-pincode').value.trim(),
      isDefault: document.getElementById('ca-default').checked
    };

    setButtonLoading(submitBtn, true, 'Saving…');
    try {
      await addAddress(data);
      form.reset();
      form.classList.remove('active');
      showBtn.style.display = 'block';
      await renderAddressSelector();
      showToast('Address saved!', 'success');
    } catch (err) {
      showToast('Could not save address: ' + err.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* Sanitise values inserted into innerHTML */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Product catalog ----------
   Loaded from the backend API. The fallback list below is used only if
   the API is unavailable (e.g. during deployment or network issues).
   --------------------------------------------------- */
let products = [];
let productsPromise = null;

const PRODUCT_DB = [
  { name: 'Latte Coffee', price: 200, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://img.freepik.com/premium-photo/hot-coffee-capuccino-cup-with-latte-art-wood-table-cafe_778722-16.jpg' },
  { name: 'Cappuccino', price: 250, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://www.frostymelts.co.za/wp-content/uploads/2022/06/Frosty-Melts-Cappuccino.jpg' },
  { name: 'Americano', price: 270, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://media.istockphoto.com/id/174684628/photo/pouring-fresh-coffee.jpg?s=612x612&w=0&k=20&c=pXOkO9bhWVKA7s4JGtvz9aPMZzkF24noXPdXlMkTQ_A=' },
  { name: 'Hot Chocolate', price: 300, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://www.crabtreekitchen.com/media/catalog/product/cache/0fcc925f6929e143fbbf0b86b4ef8725/d/r/drinking_chocolate_square_image.jpeg' },
  { name: 'Irish Coffee', price: 150, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://somuchfoodblog.com/wp-content/uploads/2022/11/irish-coffee6.jpg' },
  { name: 'Classic Filter Coffee', price: 120, category: 'Hot Drinks', page: 'hot.html',
    image: 'https://t3.ftcdn.net/jpg/04/79/36/52/360_F_479365241_t5PEjmcB9EMF8nbNBzFrmbXPYNggHDNZ.jpg' },
  { name: 'Affogato', price: 199, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://www.recipetineats.com/wp-content/uploads/2023/06/Affogato_0.jpg' },
  { name: 'Cranberry Iced Coffee', price: 250, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://i0.wp.com/recipehippie.com/wp-content/uploads/2020/11/cranberry-coffee-8.jpeg?fit=1080%2C1620&ssl=1' },
  { name: 'Dalgona Coffee', price: 180, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://madaboutkitchen.in/wp-content/uploads/2020/04/Dolgona-Coffee-.jpg' },
  { name: 'Cold Brew Coffee', price: 199, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://www.justonecookbook.com/wp-content/uploads/2016/11/Cold-Brew-Coffee-II-600x900.jpg' },
  { name: 'Nitro Coffee', price: 160, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://cheatdaydesign.com/wp-content/uploads/2023/03/Nitro-Cold-Brew-Tall.jpg.webp' },
  { name: 'Iced Mocha', price: 199, category: 'Cold Drinks', page: 'cold.html',
    image: 'https://www.cookwithmanali.com/wp-content/uploads/2022/07/Iced-Mocha.jpg' },
  { name: 'Lemon Mojito', price: 120, category: 'Refreshments', page: 'fresh.html',
    image: 'https://www.thecocktaildb.com/images/media/drink/3z6xdi1589574603.jpg' },
  { name: 'Strawberry Mojito', price: 160, category: 'Refreshments', page: 'fresh.html',
    image: 'https://www.thecocktaildb.com/images/media/drink/tquyyt1451299548.jpg' },
  { name: 'Jamun Shots', price: 140, category: 'Refreshments', page: 'fresh.html',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Syzygium_cumini.jpg/320px-Syzygium_cumini.jpg' },
  { name: 'Mango Margarita', price: 299, category: 'Refreshments', page: 'fresh.html',
    image: 'https://www.eitanbernath.com/wp-content/uploads/2019/07/Frozen-Mango-Margarita-1-LOW-RES.jpg' },
  { name: 'Watermelon Mojito', price: 150, category: 'Refreshments', page: 'fresh.html',
    image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=400' },
  { name: 'Mixed Mojito', price: 180, category: 'Refreshments', page: 'fresh.html',
    image: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400' },
  { name: 'Coffee & Cake', price: 299, category: 'Combos', page: 'combo.html',
    image: 'https://i.pinimg.com/736x/a9/11/b8/a911b80b317907948564413de7d74499.jpg' },
  { name: 'Coffee & Croissant', price: 299, category: 'Combos', page: 'combo.html',
    image: 'https://www.shutterstock.com/image-photo/breakfast-view-bunch-croissant-cup-600nw-2273006551.jpg' },
  { name: 'Coffee & Cookie', price: 299, category: 'Combos', page: 'combo.html',
    image: 'https://img.freepik.com/premium-photo/enjoy-your-mornings-with-delightful-combination-cup-coffee-freshly-baked-cookies-plate-steaming-hot-cup-coffee-paired-with-chocolate-chip-cookie-ai-generated_538213-14456.jpg' },
  { name: 'Coffee & Sandwich', price: 349, category: 'Combos', page: 'combo.html',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
  { name: 'Coffee & Dessert', price: 379, category: 'Combos', page: 'combo.html',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400' },
  { name: 'Friends Combo (2 Coffees)', price: 449, category: 'Combos', page: 'combo.html',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400' },
  { name: 'White Chocolate', price: 99, category: 'Chocolates', page: 'choco.html',
    image: 'https://t4.ftcdn.net/jpg/03/16/08/53/360_F_316085312_uwMeXhbWuyt9B4sTkChWY7QqcuASNtN8.jpg' },
  { name: 'Milk Chocolate', price: 100, category: 'Chocolates', page: 'choco.html',
    image: 'https://images.pexels.com/photos/1854664/pexels-photo-1854664.jpeg?cs=srgb&dl=pexels-elli-559179-1854664.jpg&fm=jpg' },
  { name: 'Dark Chocolate', price: 120, category: 'Chocolates', page: 'choco.html',
    image: 'https://media.istockphoto.com/id/1400452697/photo/dark-chocolate-bar-with-cocoa-beans.webp?b=1&s=170667a&w=0&k=20&c=NYCJlF6CGk1D7gQnpXW8Pc82NXZCOurDZ2cevhtv5cg=' },
  { name: 'Ruby Chocolate', price: 199, category: 'Chocolates', page: 'choco.html',
    image: 'https://taigachocolate.com/cdn/shop/products/ruby-chocolate-with-raspberries-100g-ruby-chocolate-taiga-chocolate-328563_1000x1000.jpg?v=1594995970' },
  { name: 'Chocolate Syrup', price: 180, category: 'Chocolates', page: 'choco.html',
    image: 'https://www.dessarts.com/wp-content/uploads/2019/04/Chocolate-Sauce_720px2.jpg' },
  { name: 'Assorted Chocolates', price: 199, category: 'Chocolates', page: 'choco.html',
    image: 'https://assets.winni.in/product/primary/2022/2/57895.jpeg?dpr=1&w=600' },
  { name: 'Nutella Croissant', price: 200, category: 'Desserts', page: 'dessert.html',
    image: 'https://simplyhomecooked.com/wp-content/uploads/2018/02/Nutella-croissants-recipe-3.jpg' },
  { name: 'Strawberry Pie', price: 189, category: 'Desserts', page: 'dessert.html',
    image: 'https://www.mybakingaddiction.com/wp-content/uploads/2021/07/whole-fresh-strawberry-pie.jpg' },
  { name: 'Orange Cheesecake', price: 210, category: 'Desserts', page: 'dessert.html',
    image: 'https://thesoccermomblog.com/wp-content/uploads/2019/06/Orange-Creamsicle-Cheesecake-1.jpg' },
  { name: 'Sizzling Brownie', price: 250, category: 'Desserts', page: 'dessert.html',
    image: 'https://www.chiselandfork.com/wp-content/uploads/2023/02/sizzling-brownie-1.jpg' },
  { name: 'Blueberry Ice Cream', price: 199, category: 'Desserts', page: 'dessert.html',
    image: 'https://www.creationsbykara.com/wp-content/uploads/2019/04/Blueberry-Ice-Cream-018-2.jpg' },
  { name: 'Lemon Tart', price: 199, category: 'Desserts', page: 'dessert.html',
    image: 'https://www.healthy-delicious.com/wp-content/uploads/2021/08/mini-lemon-tarts-8.jpg' },
  { name: 'Arabica Coffee Beans', price: 185, category: 'Coffee Beans', page: 'beans.html',
    image: 'https://d3kgrlupo77sg7.cloudfront.net/media/chococoorgspice.com/images/products/coorg-arabica-roasted-coffee-beans.20231001174407.webp' },
  { name: 'Filter Coffee Powder', price: 200, category: 'Coffee Beans', page: 'beans.html',
    image: 'https://delzing.com/wp-content/uploads/2022/10/Pure-Filter-coffee-powder.jpeg' },
  { name: 'Liberica Coffee Beans', price: 250, category: 'Coffee Beans', page: 'beans.html',
    image: 'https://coffeeaffection.com/wp-content/uploads/2023/03/liberica-coffee-beans_eanjoseph_Shutterstock.jpg' },
  { name: 'Coffee Pack of 6', price: 199, category: 'Accessories', page: 'accessories.html',
    image: 'https://assets.ajio.com/medias/sys_master/root/20230607/wvtJ/6480784dd55b7d0c6355977a/-1117Wx1400H-463584222-cream-MODEL.jpg' },
  { name: 'Coffee Pack of 3', price: 199, category: 'Accessories', page: 'accessories.html',
    image: 'https://lzd-img-global.slatic.net/g/p/8661739db3590561ec11e46ec783d332.jpg_720x720q80.jpg_.webp' },
  { name: 'Thermo Coffee Tumbler', price: 199, category: 'Accessories', page: 'accessories.html',
    image: 'https://rukminim2.flixcart.com/image/850/1000/l4ssfww0/mug/f/b/d/vacuum-insulated-steel-tea-coffee-mug-thermos-flask-travel-mug-original-imagfmdh6vpzggng.jpeg' },
  { name: 'Coffee Glass', price: 199, category: 'Accessories', page: 'accessories.html',
    image: 'https://i.pinimg.com/736x/51/31/31/513131b04e5e99d5cc3fda36ada130eb.jpg' },
  { name: 'Coffee Filter', price: 199, category: 'Accessories', page: 'accessories.html',
    image: 'https://img.ws.mms.shopee.com.my/be57d3f36473d8a69bdaaadc36d882ef' },
  { name: 'Gift Hamper - Coffee Lover', price: 499, category: 'Gifts', page: 'gifts.html',
    image: 'https://www.lovedandfoundbox.com/cdn/shop/products/wood-coffee-snack-client-gift-box-for-two_1972x.jpg?v=1677770476' },
  { name: 'Gift Card Rs.500', price: 500, category: 'Gifts', page: 'gifts.html',
    image: 'https://i0.wp.com/doinggoodco.com/wp-content/uploads/2023/10/Coffee-Lover-All-Product-with-Large-Match-Bottle-Square-for-Web.png?fit=635%2C635&ssl=1' },
  { name: 'Premium Coffee Box', price: 699, category: 'Gifts', page: 'gifts.html',
    image: 'https://artisante.in/cdn/shop/products/large-gift-box-everything-chocolate-meets-coffee-903209_1400x.jpg?v=1694860069' }
];

/* Load products from the backend; fallback to PRODUCT_DB if it fails. */
async function loadProducts() {
  if (products.length) return products;
  try {
    const fetched = await apiRequest('/products');
    products = fetched.length ? fetched : [...PRODUCT_DB];
  } catch (err) {
    products = [...PRODUCT_DB];
  }
  return products;
}

function ensureProductsLoaded() {
  if (productsPromise) return productsPromise;
  productsPromise = loadProducts();
  return productsPromise;
}

/* Search aliases — so "choco" / "chocolate" all hit the Chocolates category */
const SEARCH_ALIASES = {
  'choco':       'Chocolates',
  'chocolate':   'Chocolates',
  'chocolates':  'Chocolates',
  'hot':         'Hot Drinks',
  'cold':        'Cold Drinks',
  'cool':        'Cold Drinks',
  'fresh':       'Refreshments',
  'refresh':     'Refreshments',
  'combo':       'Combos',
  'combos':      'Combos',
  'dessert':     'Desserts',
  'desserts':    'Desserts',
  'cake':        'Desserts',
  'sweet':       'Desserts',
  'beans':       'Coffee Beans',
  'bean':        'Coffee Beans',
  'powder':      'Coffee Beans',
  'accessory':   'Accessories',
  'accessories': 'Accessories',
  'mug':         'Accessories',
  'tumbler':     'Accessories',
  'gift':        'Gifts',
  'gifts':       'Gifts',
  'hamper':      'Gifts',
};

async function doSearch(query) {
  if (!query || !query.trim()) return;
  await ensureProductsLoaded();

  const raw = query.trim().toLowerCase();
  // Expand alias if one matches exactly
  const expanded = SEARCH_ALIASES[raw] ? SEARCH_ALIASES[raw].toLowerCase() : raw;

  const results = products.filter(p =>
    p.name.toLowerCase().includes(raw)       ||
    p.name.toLowerCase().includes(expanded)  ||
    p.category.toLowerCase().includes(raw)   ||
    p.category.toLowerCase().includes(expanded)
  );
  sessionStorage.setItem('searchResults', JSON.stringify(results));
  sessionStorage.setItem('searchQuery', query.trim());
  window.location.href = 'search.html';
}

/* ---------- Category page renderer ----------
   Fetches products for the current category and renders them into the
   .menu .box-container grid. If the API fails, the original hardcoded
   page content remains as a fallback.
   --------------------------------------------------- */
const CATEGORY_PAGES = {
  'hot.html':        'Hot Drinks',
  'cold.html':       'Cold Drinks',
  'fresh.html':      'Refreshments',
  'combo.html':      'Combos',
  'choco.html':      'Chocolates',
  'dessert.html':    'Desserts',
  'beans.html':      'Coffee Beans',
  'accessories.html':'Accessories',
  'gifts.html':      'Gifts'
};

const CATEGORY_ORDER = [
  'Hot Drinks', 'Cold Drinks', 'Refreshments', 'Combos',
  'Chocolates', 'Desserts', 'Coffee Beans', 'Accessories', 'Gifts'
];

const CATEGORY_ANCHORS = {
  'Hot Drinks':   'hot-beverages',
  'Cold Drinks':  'cold-beverages',
  'Refreshments': 'refreshments',
  'Combos':       'combos',
  'Chocolates':   'chocolates',
  'Desserts':     'desserts',
  'Coffee Beans': 'coffee-beans',
  'Accessories':  'accessories',
  'Gifts':        'gifts'
};

function showDescription(btn) {
  const box = btn.closest('.box');
  const panel = box.querySelector('.desc-panel');
  const isOpen = panel.classList.contains('open');

  // close all panels and reset all buttons
  document.querySelectorAll('.desc-panel.open').forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.show-desc').forEach(b => b.textContent = 'Description');

  if (!isOpen) {
    panel.classList.add('open');
    btn.textContent = 'Close';
  }
}

function closeDescription(btn) {
  const panel = btn.closest('.desc-panel');
  panel.classList.remove('open');
  const box = panel.closest('.box');
  if (box) box.querySelector('.show-desc').textContent = 'Description';
}

function productCardHtml(p) {
  const original = p.originalPrice ? `<span>Rs.${p.originalPrice}</span>` : '';
  const nameJs = escapeHtml(p.name).replace(/'/g, "\\'");
  const imageJs = escapeHtml(p.image).replace(/'/g, "\\'");
  const desc = escapeHtml(p.description || '').replace(/'/g, "\\'");
  return `
    <div class="box" style="position:relative;overflow:hidden;">
      <div class="image-wrap">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
      </div>
      <p class="product-name">${escapeHtml(p.name)}</p>
      <div class="price">Rs.${p.price} ${original}</div>
      <div class="desc-panel">
        <p>${escapeHtml(p.description || '')}</p>
      </div>
      <a href="#" class="btn add-to-cart" onclick="addToCart('${nameJs}', ${p.price}, '${imageJs}'); return false;">Add to Cart</a>
      <button type="button" class="btn show-desc" onclick="showDescription(this)">Description</button>
    </div>
  `;
}

async function renderCategoryProducts(category) {
  const container = document.querySelector('.menu .box-container');
  if (!container || !category) return;

  try {
    const items = await apiRequest('/products?category=' + encodeURIComponent(category));
    if (!items.length) return;
    container.innerHTML = items.map(productCardHtml).join('');
  } catch (err) {
    // Leave original hardcoded content as fallback
    console.log('Could not load dynamic products:', err.message);
  }
}

async function renderFullCatalog(items) {
  const container = document.getElementById('catalog-container');
  if (!container) return;

  try {
    if (!items || !items.length) items = await apiRequest('/products');
    if (!items.length) {
      container.innerHTML = '<p style="text-align:center;color:#888;">No products available.</p>';
      return;
    }

    const grouped = {};
    for (const p of items) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    container.innerHTML = CATEGORY_ORDER.map(cat => {
      if (!grouped[cat]) return '';
      const anchor = CATEGORY_ANCHORS[cat] || cat.toLowerCase().replace(/\s+/g, '-');
      return `
        <div class="catalog-category" id="${anchor}" style="margin-bottom: 50px;">
          <h2 style="text-align:center;color:#2a1503;margin: 40px 0 25px;font-size:2.2rem;">${escapeHtml(cat)}</h2>
          <div class="box-container">${grouped[cat].map(productCardHtml).join('')}</div>
        </div>
      `;
    }).join('');

    // Scroll to category hash after catalog is rendered
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  } catch (err) {
    container.innerHTML = '<p style="text-align:center;color:#888;">Could not load products. Please try again later.</p>';
  }
}

/* ---------- Logout ---------- */
function logout() {
  if (confirm('Are you sure you want to log out?')) {
    clearToken();
    window.location.href = 'loginpage.html';
  }
}

/* ============================================================
   SHARED HEADER (single source — injected into every page)
   Usage: add <header id="site-header"></header> as first thing in <body>
   ============================================================ */
async function loadHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const currentUser = await getCurrentUser();
  const accountLink = currentUser
    ? `
      <div class="account-dropdown" id="accountDropdown">
        <button type="button" class="account-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
          <i class="fas fa-circle-user" style="font-size:30px;color:#fff;"></i>
        </button>
        <div class="account-dropdown-menu">
          <a href="account.html"><i class="fas fa-user"></i> Account Details</a>
          ${currentUser.role === 'admin' ? '<a href="admin.html"><i class="fas fa-gauge"></i> Admin Panel</a>' : ''}
          <a href="#" id="dropdownLogout"><i class="fas fa-right-from-bracket"></i> Logout</a>
        </div>
      </div>`
    : `<a href="loginpage.html" style="color:#fff;" title="Login" aria-label="Login"><i class="fas fa-circle-user" style="font-size:30px;"></i></a>`;

  mount.outerHTML = `
    <header class="header" id="site-header">
      <a href="home.html" class="logo">
        <img src="logo.jpg" alt="Aroma Cafe Logo">
      </a>

      <nav class="navbar">
        <a href="home.html">Home</a>
        <a href="home.html#menu">Menu</a>
        <a href="home.html#product">Products</a>
        <a href="home.html#review">Review</a>
        <a href="about.html">About</a>
        <a href="home.html#contact">Contact Us</a>
      </nav>

      <div class="icons">
        <i class="fas fa-search" style="font-size:30px;color:#fff;cursor:pointer;"
           title="Search" aria-label="Toggle search"></i>

        <a href="cart.html" style="color:#fff;position:relative;" aria-label="Shopping cart">
          <i class="fas fa-shopping-cart" style="font-size:30px;"></i>
          <span id="cart-count"
                style="position:absolute;top:-8px;right:-10px;background:#f3961c;color:#fff;
                       border-radius:50%;padding:0 6px;font-size:12px;font-weight:bold;"></span>
        </a>

        <div class="fas fa-bars" id="menu-btn" style="font-size:26px;color:#fff;cursor:pointer;"
             aria-label="Toggle navigation menu"></div>

        ${accountLink}
      </div>

      <div class="search-form">
        <input type="search" id="search-box" placeholder="Search here...">
        <label for="search-box" class="fas fa-search"></label>
      </div>
    </header>
  `;

  const current = location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.navbar a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  /* --- Account dropdown toggle --- */
  const dropdown     = document.getElementById('accountDropdown');
  const toggleBtn     = dropdown?.querySelector('.account-toggle');
  const dropdownMenu  = dropdown?.querySelector('.account-dropdown-menu');
  const dropdownLogout = document.getElementById('dropdownLogout');

  if (dropdown && toggleBtn && dropdownMenu) {
    toggleBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.toggle('active');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target)) {
        dropdownMenu.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (dropdownLogout) {
    dropdownLogout.addEventListener('click', e => {
      e.preventDefault();
      logout();
    });
  }
}

/* ============================================================
   SHARED FOOTER (single source — injected into every page)
   Usage: add <div id="site-footer"></div> right before </body>
   ============================================================ */
function loadFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;

  mount.innerHTML = `
    <footer class="footer">
      <div class="footer-container">

        <div class="footer-col footer-brand">
          <a href="home.html" class="footer-logo">
            <img src="logo.jpg" alt="Aroma Cafe Logo" width="60" height="60">
          </a>
          <p class="footer-tagline">Aroma Cafe serves many variants of coffee and other dishes in a comfortable, cozy place.</p>
          <div class="social-icons">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-square"></i></a>
            <a href="#" aria-label="Twitter"><i class="fab fa-twitter-square"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="YouTube"><i class="fab fa-youtube-square"></i></a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="home.html#menu">Menu</a></li>
            <li><a href="home.html#product">Products</a></li>
            <li><a href="about.html">About Us</a></li>
            <li><a href="home.html#review">Reviews</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">FAQs</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Help</a></li>
            <li><a href="#">Customer Care</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Facility</h4>
          <ul>
            <li><a href="#">Meeting Room</a></li>
            <li><a href="#">Private Room</a></li>
            <li><a href="#">Event Room</a></li>
            <li><a href="#">Creative Studio</a></li>
          </ul>
        </div>

        <div class="footer-col footer-address">
          <h4>Visit Us</h4>
          <p><i class="fas fa-map-marker-alt"></i> India, Vijayawada<br>
             65/143, GB Nagar, Near BP Center<br>520001</p>
        </div>

      </div>

      <div class="footer-bottom">
        <p>&copy; 2024 Aroma Cafe. All rights reserved.</p>
      </div>
    </footer>
  `;
}

/* ============================================================
   DOMContentLoaded — wires up all interactive behaviour
   ============================================================ */
document.addEventListener('DOMContentLoaded', async function () {

  // Preload product catalog from the backend in the background.
  // Search uses it; if it fails the hardcoded fallback is used.
  ensureProductsLoaded();

  await loadHeader();
  loadFooter();

  /* --- Category pages: render products from backend --- */
  const pageName = location.pathname.split('/').pop() || 'home.html';
  const category = CATEGORY_PAGES[pageName];
  if (category) renderCategoryProducts(category);

  /* --- Cart badge --- */
  await loadCartFromBackend();
  updateCartBadge();

  /* --- Mobile menu toggle --- */
  const menuBtn = document.getElementById('menu-btn');
  const navbar  = document.querySelector('.navbar');
  if (menuBtn && navbar) {
    menuBtn.addEventListener('click', () => navbar.classList.toggle('active'));
    // Close navbar when a link is clicked (mobile)
    navbar.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navbar.classList.remove('active'))
    );
  }

  /* --- Hero slider --- */
  const slidesEl = document.querySelector('.slides');
  if (slidesEl) {
    let current = 0;
    const total = slidesEl.querySelectorAll('.slide').length;

    function goTo(n) {
      current = (n + total) % total;
      // Each slide is 33.333% of the 300%-wide track
      slidesEl.style.animation = 'none';
      slidesEl.style.transition = 'transform 0.6s ease-in-out';
      slidesEl.style.transform  = 'translateX(-' + (current * 33.333) + '%)';
    }

    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

    // Auto-advance (restarts after manual override)
    setInterval(() => goTo(current + 1), 4000);
  }

  /* --- Search icon toggle --- */
  const searchIcon   = document.querySelector('.header .fa-search');
  const searchFormEl = document.querySelector('.search-form');
  if (searchIcon && searchFormEl) {
    searchIcon.addEventListener('click', e => {
      e.stopPropagation();
      searchFormEl.classList.toggle('active');
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!searchFormEl.contains(e.target) && e.target !== searchIcon) {
        searchFormEl.classList.remove('active');
      }
    });

    const searchBox = document.getElementById('search-box');
    if (searchBox) {
      searchBox.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') doSearch(this.value);
      });
      const lbl = searchFormEl.querySelector('label');
      if (lbl) lbl.addEventListener('click', () => doSearch(searchBox.value));
    }
  }

  /* --- Cart page: event delegation (replaces inline onclick) --- */
  const cartList = document.getElementById('cart-items-list');
  if (cartList) {
    renderCartPage();
    renderAddressSelector();
    wireInlineAddressForm();
    cartList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const idx    = parseInt(btn.dataset.idx, 10);
      const action = btn.dataset.action;
      if (action === 'inc')    updateQty(idx, 1);
      if (action === 'dec')    updateQty(idx, -1);
      if (action === 'remove') removeFromCart(idx);
    });
  }

  /* --- Checkout button --- */
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function () {
      const cart = getCart();
      if (!cart.length) { showToast('Your cart is empty!', 'error'); return; }

      const user = await getCurrentUser();
      if (!user) {
        showToast('Please sign in to place an order.', 'error');
        window.location.href = 'loginpage.html';
        return;
      }

      const selectedRadio = document.querySelector('input[name="deliveryAddress"]:checked');
      const selectedAddress = selectedRadio
        ? (user.addresses || []).find(a => a._id === selectedRadio.value)
        : null;

      if (!selectedAddress) {
        showToast('Please add or select a delivery address to continue.', 'error');
        document.getElementById('addressSection')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

      setButtonLoading(checkoutBtn, true, 'Placing order…');
      try {
        await saveOrder({ items: cart, total, address: selectedAddress });
        showToast('🎉 Order placed! Total: Rs. ' + total, 'success');
        saveCart([]);
        updateCartBadge();
        renderCartPage();
      } catch (err) {
        showToast('Could not place order: ' + err.message, 'error');
      } finally {
        setButtonLoading(checkoutBtn, false);
      }
    });
  }

  /* --- Review form star rating (home.html) --- */
  const starRow    = document.getElementById('starRow');
  const ratingInput = document.getElementById('rating');
  const starHint   = document.getElementById('starHint');
  const starLabels = ['','Terrible','Poor','Okay','Good','Excellent!'];

  if (starRow && ratingInput) {
    const stars = starRow.querySelectorAll('.star');

    function paintStars(upTo) {
      stars.forEach((s, i) => {
        s.classList.toggle('active',   i < upTo);
        s.classList.toggle('hovered',  false);
      });
    }

    stars.forEach(star => {
      // Hover: light up preview
      star.addEventListener('mouseenter', () => {
        const v = parseInt(star.dataset.value, 10);
        stars.forEach((s, i) => s.classList.toggle('hovered', i < v));
        if (starHint) starHint.textContent = starLabels[v];
      });

      // Mouse leave: revert to selected state
      starRow.addEventListener('mouseleave', () => {
        const selected = parseInt(ratingInput.value || 0, 10);
        stars.forEach((s, i) => {
          s.classList.toggle('hovered', false);
          s.classList.toggle('active', i < selected);
        });
        if (starHint) starHint.textContent = selected ? starLabels[selected] : 'Click a star to rate';
      });

      // Click: lock selection
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value, 10);
        ratingInput.value = value;
        paintStars(value);
        if (starHint) starHint.textContent = starLabels[value];
      });

      // Keyboard: Enter/Space selects
      star.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          star.click();
        }
      });
    });
  }

  /* --- Review form submit --- */
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const nameVal   = (document.getElementById('reviewName') || document.getElementById('name'));
      const reviewVal = (document.getElementById('reviewText') || document.getElementById('review'));
      if (!ratingInput || !ratingInput.value) {
        showToast('Please select a star rating!', 'error');
        return;
      }
      const entry = {
        name:   nameVal ? nameVal.value.trim() : 'Anonymous',
        rating: parseInt(ratingInput.value, 10),
        review: reviewVal ? reviewVal.value.trim() : '',
        date:   new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      };
      // Save to localStorage
      const reviews = JSON.parse(localStorage.getItem('aromaReviews') || '[]');
      reviews.push(entry);
      localStorage.setItem('aromaReviews', JSON.stringify(reviews));

      // Append new card to carousel immediately
      appendReviewCard(entry);

      showToast('Thank you, ' + entry.name + '! Your review has been published.', 'success');
      this.reset();
      if (ratingInput) ratingInput.value = '';
      const stars = document.querySelectorAll('.star');
      stars.forEach(s => { s.classList.remove('active','hovered'); });
      if (starHint) starHint.textContent = 'Click a star to rate';
    });
  }

  /* Append a single user review card to the carousel */
  function appendReviewCard(entry) {
    const carousel = document.getElementById('reviewCarousel');
    if (!carousel) return;
    const starsHtml = Array.from({length:5}, (_,i) =>
      i < entry.rating ? '&#9733;' : '&#9734;'
    ).join('');
    const initials = entry.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div style="background:#f0e8e0;height:180px;display:flex;align-items:center;
                  justify-content:center;font-size:3rem;font-weight:500;color:#2a1503;">
        ${initials}
      </div>
      <h2>${escapeHtml(entry.name)}</h2>
      <div class="card-stars">${starsHtml}</div>
      <span>${escapeHtml(entry.review)}</span>
      <div class="card-date">${entry.date}</div>`;
    carousel.appendChild(div);
    // Scroll to the new card
    setTimeout(() => { div.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' }); }, 100);
  }

  /* Render any previously saved reviews on page load */
  const savedReviews = JSON.parse(localStorage.getItem('aromaReviews') || '[]');
  savedReviews.forEach(appendReviewCard);

  /* --- Carousel prev/next arrows --- */
  const carousel     = document.getElementById('reviewCarousel');
  const carouselPrev = document.getElementById('carouselPrev');
  const carouselNext = document.getElementById('carouselNext');
  if (carousel && carouselPrev && carouselNext) {
    const SCROLL_BY = 296; // card width + gap
    carouselPrev.addEventListener('click', () => carousel.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' }));
    carouselNext.addEventListener('click', () => carousel.scrollBy({ left:  SCROLL_BY, behavior: 'smooth' }));
  }

  /* --- Contact form --- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast('Message sent! We will get back to you shortly.', 'success');
      this.reset();
    });
  }

  /* --- Search results page --- */
  const searchResultsEl = document.getElementById('search-results-container');
  if (searchResultsEl) {
    const results = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
    const query   = sessionStorage.getItem('searchQuery') || '';
    const heading = document.getElementById('search-heading');
    if (heading) heading.textContent = results.length
      ? 'Results for "' + query + '" (' + results.length + ')'
      : 'No results found for "' + query + '"';

    if (results.length === 0) {
      searchResultsEl.innerHTML = '<p style="color:#888;text-align:center;padding:40px 0;">Try a different keyword.</p>';
    } else {
      searchResultsEl.innerHTML = results.map(p => `
        <div class="box">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">
          <h3>${escapeHtml(p.name)}</h3>
          <p style="font-size:12px;background:#f0e8de;display:inline-block;padding:2px 10px;
                    border-radius:20px;color:#2a1503;margin-bottom:4px;">
            ${escapeHtml(p.category)}
          </p>
          <div class="price">Rs.${p.price}</div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px;">
            <a href="#" class="btn add-to-cart-btn"
               data-name="${escapeHtml(p.name)}"
               data-price="${p.price}"
               data-img="${escapeHtml(p.image)}">Add to Cart</a>
            ${p.page ? `<a href="${escapeHtml(p.page)}" class="btn"
               style="background:#2a1503;color:#fff;border:none;">View in Menu →</a>` : ''}
          </div>
        </div>`).join('');
    }

    // Wire up Add to Cart in search results via delegation
    searchResultsEl.addEventListener('click', e => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (!btn) return;
      e.preventDefault();
      addToCart(btn.dataset.name, btn.dataset.price, btn.dataset.img);
    });
  }

  /* --- Add-to-cart buttons on any page (data-attribute pattern) --- */
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      addToCart(btn.dataset.name, btn.dataset.price, btn.dataset.img);
    });
  });

});