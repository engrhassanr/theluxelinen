(function () {
  const searchBtn = document.querySelector(".header__icon-btn");
  if (!searchBtn) return;

  let catalog = [];
  let searchOpen = false;
  let searchTimer = null;

  const searchOverlay = document.createElement("div");
  searchOverlay.className = "search-panel__overlay";
  searchOverlay.setAttribute("aria-hidden", "true");

  const searchPanel = document.createElement("div");
  searchPanel.className = "search-panel";
  searchPanel.setAttribute("data-lenis-prevent", "");
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

  document.body.appendChild(searchOverlay);
  document.body.appendChild(searchPanel);

  const searchInput = searchPanel.querySelector(".search-panel__input");
  const searchClear = searchPanel.querySelector(".search-panel__clear");
  const searchResults = searchPanel.querySelector(".search-panel__results");

  function formatPrice(value) {
    return `USD $${value.toFixed(2)}`;
  }

  function normalizeQuery(value) {
    return value.trim().toLowerCase();
  }

  function scoreItem(item, query) {
    const title = item.title.toLowerCase();
    const keywords = (item.keywords || []).join(" ").toLowerCase();
    const type = (item.type || "").toLowerCase();
    const url = (item.url || "").toLowerCase();

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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function setSearchOpen(isOpen) {
    searchOpen = isOpen;
    searchOverlay.setAttribute("aria-hidden", String(!isOpen));
    searchPanel.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("commerce-panel-open", isOpen);

    if (isOpen) {
      window.dispatchEvent(new CustomEvent("commerce:close-mobile-nav"));
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

  searchBtn.addEventListener("click", () => setSearchOpen(!searchOpen));
  searchOverlay.addEventListener("click", () => setSearchOpen(false));

  searchPanel.addEventListener("click", (event) => {
    if (!event.target.closest(".search-panel__content")) {
      setSearchOpen(false);
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

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && searchOpen) setSearchOpen(false);
  });

  window.addEventListener("commerce:close-panels", () => {
    if (searchOpen) setSearchOpen(false);
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
})();
