(function () {
  const CART_KEY = "commerce-cart";
  const searchBtn = document.querySelector(".header__icon-btn");
  const cartBtn = document.querySelector(".header__cart-btn");
  const cartCountEl = document.querySelector(".header__cart-count");

  if (!searchBtn && !cartBtn) return;

  let catalog = [];
  let cart = loadCart();
  let searchOpen = false;
  let cartOpen = false;
  let searchTimer = null;

  const searchOverlay = document.createElement("div");
  searchOverlay.className = "search-panel__overlay";
  searchOverlay.setAttribute("aria-hidden", "true");

  const searchPanel = document.createElement("div");
  searchPanel.className = "search-panel";
  searchPanel.setAttribute("role", "dialog");
  searchPanel.setAttribute("aria-modal", "true");
  searchPanel.setAttribute("aria-label", "Search");
  searchPanel.setAttribute("aria-hidden", "true");
  searchPanel.innerHTML = `
    <div class="search-panel__content">
      <div class="search-panel__field">
        <img class="search-panel__icon" src="/assets/icons/magnifying-glass.svg" alt="" width="20" height="20" aria-hidden="true">
        <input class="search-panel__input" type="search" placeholder="Search..." autocomplete="off" spellcheck="false" aria-label="Search">
        <button class="search-panel__clear" type="button" aria-label="Close search">
          <img src="/assets/icons/x.svg" alt="" width="16" height="16" aria-hidden="true">
        </button>
      </div>
      <div class="search-panel__results" role="listbox" aria-label="Search results" hidden></div>
    </div>
  `;

  const cartOverlay = document.createElement("div");
  cartOverlay.className = "cart-drawer__overlay";
  cartOverlay.setAttribute("aria-hidden", "true");

  const cartDrawer = document.createElement("aside");
  cartDrawer.className = "cart-drawer";
  cartDrawer.setAttribute("role", "dialog");
  cartDrawer.setAttribute("aria-modal", "true");
  cartDrawer.setAttribute("aria-label", "Shopping cart");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartDrawer.innerHTML = `
    <div class="cart-drawer__panel">
      <div class="cart-drawer__header">
        <div class="cart-drawer__title-group">
          <h2 class="cart-drawer__title">Your Cart</h2>
          <span class="cart-drawer__count">0</span>
        </div>
        <button class="cart-drawer__close" type="button" aria-label="Close cart">
          <img src="/assets/icons/x.svg" alt="" width="20" height="20" aria-hidden="true">
        </button>
      </div>
      <div class="cart-drawer__body"></div>
      <div class="cart-drawer__footer">
        <div class="cart-drawer__subtotal">
          <span>Subtotal</span>
          <span class="cart-drawer__subtotal-value">$0</span>
        </div>
        <button class="cart-drawer__checkout" type="button" disabled>Checkout</button>
      </div>
    </div>
  `;

  document.body.appendChild(searchOverlay);
  document.body.appendChild(searchPanel);
  document.body.appendChild(cartOverlay);
  document.body.appendChild(cartDrawer);

  const searchInput = searchPanel.querySelector(".search-panel__input");
  const searchClear = searchPanel.querySelector(".search-panel__clear");
  const searchResults = searchPanel.querySelector(".search-panel__results");
  const cartBody = cartDrawer.querySelector(".cart-drawer__body");
  const cartDrawerCount = cartDrawer.querySelector(".cart-drawer__count");
  const cartSubtotal = cartDrawer.querySelector(".cart-drawer__subtotal-value");
  const cartClose = cartDrawer.querySelector(".cart-drawer__close");
  const cartCheckout = cartDrawer.querySelector(".cart-drawer__checkout");

  function loadCart() {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
    renderCart();
  }

  function formatPrice(value) {
    return `USD $${value.toFixed(2)}`;
  }

  function formatCartPrice(value) {
    const rounded = Math.round(value * 100) / 100;
    if (Number.isInteger(rounded)) {
      return `$${rounded}`;
    }
    return `$${rounded.toFixed(2)}`;
  }

  function parsePrice(text) {
    const match = String(text || "").match(/[\d,.]+/);
    return match ? parseFloat(match[0].replace(",", "")) : 0;
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartCount() {
    if (!cartCountEl) return;
    const count = getCartCount();
    cartCountEl.textContent = String(count);
    if (cartBtn) {
      cartBtn.setAttribute("aria-label", `Shopping cart, ${count} item${count === 1 ? "" : "s"}`);
    }
  }

  function getItemId(slug, variant) {
    return `${slug}::${variant || "default"}`;
  }

  function addToCart(item) {
    const id = getItemId(item.slug, item.variant);
    const existing = cart.find((entry) => entry.id === id);

    if (existing) {
      existing.quantity += item.quantity || 1;
    } else {
      cart.push({
        id,
        slug: item.slug,
        name: item.name,
        price: item.price,
        image: item.image,
        variant: item.variant || "",
        quantity: item.quantity || 1,
        url: item.url,
      });
    }

    saveCart();
  }

  function setCartItemQuantity(id, quantity) {
    const entry = cart.find((item) => item.id === id);
    if (!entry) return;

    if (quantity <= 0) {
      cart = cart.filter((item) => item.id !== id);
    } else {
      entry.quantity = quantity;
    }

    saveCart();
  }

  function getSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function renderCart() {
    if (!cartBody) return;

    const count = getCartCount();
    const subtotal = getSubtotal();

    if (cartDrawerCount) {
      cartDrawerCount.textContent = String(count);
    }

    cartSubtotal.textContent = formatCartPrice(subtotal);
    cartCheckout.disabled = !cart.length;
    cartCheckout.classList.toggle("cart-drawer__checkout--disabled", !cart.length);

    if (!cart.length) {
      cartBody.innerHTML = `
        <div class="cart-drawer__empty">
          <p class="cart-drawer__empty-title">Your Cart is Empty</p>
          <p class="cart-drawer__empty-text">Add some items to the cart.</p>
        </div>
      `;
      return;
    }

    cartBody.innerHTML = `<ul class="cart-drawer__items">${cart
      .map(
        (item) => `
        <li class="cart-drawer__item" data-cart-id="${item.id}">
          <a href="${item.url}" class="cart-drawer__item-image">
            <img src="${item.image}" alt="" width="80" height="80" loading="lazy">
          </a>
          <div class="cart-drawer__item-details">
            <a href="${item.url}" class="cart-drawer__item-name">${item.name}</a>
            ${item.variant ? `<p class="cart-drawer__item-variant">${item.variant}</p>` : ""}
            <p class="cart-drawer__item-price">${formatCartPrice(item.price)}</p>
            <div class="cart-drawer__qty">
              <button type="button" class="cart-drawer__qty-btn" data-qty-action="decrease" aria-label="Decrease quantity">
                <img src="/assets/icons/minus.svg" alt="" width="14" height="14" aria-hidden="true">
              </button>
              <span class="cart-drawer__qty-value">${item.quantity}</span>
              <button type="button" class="cart-drawer__qty-btn" data-qty-action="increase" aria-label="Increase quantity">
                <img src="/assets/icons/plus.svg" alt="" width="14" height="14" aria-hidden="true">
              </button>
            </div>
          </div>
        </li>
      `
      )
      .join("")}</ul>`;
  }

  function normalizeQuery(value) {
    return value.trim().toLowerCase();
  }

  function scoreItem(item, query) {
    const title = item.title.toLowerCase();
    const keywords = (item.keywords || []).join(" ").toLowerCase();
    const type = (item.type || "").toLowerCase();
    const url = item.url.toLowerCase();

    if (title === query) return 100;
    if (title.startsWith(query)) return 80;
    if (title.includes(query)) return 60;
    if (keywords.includes(query)) return 40;
    if (type.includes(query) || url.includes(query)) return 20;

    const parts = query.split(/\s+/).filter(Boolean);
    if (!parts.length) return 0;

    const haystack = `${title} ${keywords} ${type}`;
    return parts.every((part) => haystack.includes(part)) ? 30 : 0;
  }

  function renderSearchResults(query) {
    const normalized = normalizeQuery(query);

    if (!normalized) {
      searchResults.hidden = true;
      searchResults.innerHTML = "";
      return;
    }

    const results = catalog
      .map((item) => ({ item, score: scoreItem(item, normalized) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 8);

    searchResults.hidden = false;

    if (!results.length) {
      searchResults.innerHTML = `<p class="search-panel__empty">No results for &ldquo;${escapeHtml(query)}&rdquo;</p>`;
      return;
    }

    searchResults.innerHTML = `<ul class="search-panel__list">${results
      .map(
        ({ item }) => `
        <li>
          <a class="search-panel__result" href="${item.url}">
            ${
              item.image
                ? `<span class="search-panel__result-image"><img src="${item.image}" alt="" width="48" height="48" loading="lazy"></span>`
                : ""
            }
            <span class="search-panel__result-text">
              <span class="search-panel__result-title">${escapeHtml(item.title)}</span>
              <span class="search-panel__result-meta">
                <span class="search-panel__result-type">${escapeHtml(item.type)}</span>
                ${item.price != null ? `<span class="search-panel__result-price">${formatPrice(item.price)}</span>` : ""}
              </span>
            </span>
          </a>
        </li>
      `
      )
      .join("")}</ul>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setBodyLock() {
    document.body.classList.toggle("commerce-panel-open", searchOpen || cartOpen);
  }

  function setSearchOpen(isOpen) {
    searchOpen = isOpen;
    searchOverlay.setAttribute("aria-hidden", String(!isOpen));
    searchPanel.setAttribute("aria-hidden", String(!isOpen));
    setBodyLock();

    if (isOpen) {
      if (cartOpen) setCartOpen(false);
      document.body.classList.add("search-open");
      searchClear.hidden = false;
      window.requestAnimationFrame(() => {
        window.setTimeout(() => searchInput.focus(), 50);
      });
      renderSearchResults(searchInput.value);
      return;
    }

    document.body.classList.remove("search-open");
    searchInput.value = "";
    searchClear.hidden = true;
    renderSearchResults("");
  }

  function setCartOpen(isOpen) {
    cartOpen = isOpen;
    cartOverlay.setAttribute("aria-hidden", String(!isOpen));
    cartDrawer.setAttribute("aria-hidden", String(!isOpen));
    setBodyLock();

    if (isOpen) {
      if (searchOpen) setSearchOpen(false);
      document.body.classList.add("cart-open");
      renderCart();
      window.requestAnimationFrame(() => {
        window.setTimeout(() => cartClose.focus(), 50);
      });
      return;
    }

    document.body.classList.remove("cart-open");
  }

  function getProductFromPage() {
    const titleEl = document.querySelector(".product-detail__title");
    if (!titleEl) return null;

    const imageEl = document.querySelector(".product-detail__image");
    const priceEl = document.querySelector(".product-detail__price-current");
    const variantEl = document.querySelector(".product-detail__variant--active");
    const slugMatch = window.location.pathname.match(/\/shop\/([^/]+)/);

    if (!slugMatch) return null;

    return {
      slug: slugMatch[1],
      name: titleEl.textContent.trim(),
      price: parsePrice(priceEl?.textContent),
      image: imageEl ? normalizeAssetPath(imageEl.getAttribute("src")) : "",
      variant: variantEl ? variantEl.textContent.trim() : "",
      quantity: 1,
      url: `/shop/${slugMatch[1]}`,
    };
  }

  function normalizeAssetPath(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    const parts = path.split("/");
    return `/assets/${parts[parts.length - 1]}`;
  }

  function bindProductActions() {
    const addBtn = document.querySelector(".product-detail__btn--cart");
    const buyBtn = document.querySelector(".product-detail__btn--buy");

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const product = getProductFromPage();
        if (!product) return;
        addToCart(product);
        setCartOpen(true);
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        const product = getProductFromPage();
        if (!product) return;
        addToCart(product);
        setCartOpen(true);
      });
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => setSearchOpen(!searchOpen));
  }

  if (cartBtn) {
    cartBtn.addEventListener("click", () => setCartOpen(!cartOpen));
  }

  searchOverlay.addEventListener("click", () => setSearchOpen(false));

  searchPanel.addEventListener("click", (event) => {
    if (!event.target.closest(".search-panel__content")) {
      setSearchOpen(false);
    }
  });

  cartClose.addEventListener("click", () => setCartOpen(false));
  cartOverlay.addEventListener("click", () => setCartOpen(false));

  cartDrawer.addEventListener("click", (event) => {
    if (!event.target.closest(".cart-drawer__panel")) {
      setCartOpen(false);
    }
  });

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      renderSearchResults(searchInput.value);
    }, 120);
  });

  searchClear.addEventListener("click", () => {
    setSearchOpen(false);
  });

  searchResults.addEventListener("click", (event) => {
    if (event.target.closest("a")) setSearchOpen(false);
  });

  cartBody.addEventListener("click", (event) => {
    const itemEl = event.target.closest("[data-cart-id]");
    if (!itemEl) return;

    const action = event.target.closest("[data-qty-action]");
    if (!action) return;

    const id = itemEl.dataset.cartId;
    const entry = cart.find((item) => item.id === id);
    if (!entry) return;

    if (action.dataset.qtyAction === "increase") {
      setCartItemQuantity(id, entry.quantity + 1);
    } else {
      setCartItemQuantity(id, entry.quantity - 1);
    }
  });

  cartCheckout.addEventListener("click", () => {
    if (!cart.length) return;
    window.alert("Checkout is not connected in this demo store.");
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (searchOpen) setSearchOpen(false);
    if (cartOpen) setCartOpen(false);
  });

  fetch("/data/catalog.json")
    .then((response) => (response.ok ? response.json() : { items: [] }))
    .then((data) => {
      catalog = Array.isArray(data.items) ? data.items : [];
      renderSearchResults("");
    })
    .catch(() => {
      catalog = [];
      renderSearchResults("");
    });

  updateCartCount();
  renderCart();
  bindProductActions();
})();
