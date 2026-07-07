(function () {
  const STORAGE_KEY = "commerce-promo-dismissed";
  const SHOW_DELAY_MS = 20000;
  const RETRY_WHEN_BLOCKED_MS = 500;

  let isOpen = false;
  let showTimer = null;

  const overlay = document.createElement("div");
  overlay.className = "promo-modal__overlay";
  overlay.setAttribute("aria-hidden", "true");

  const modal = document.createElement("div");
  modal.className = "promo-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Newsletter offer");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="promo-modal__panel">
      <div class="promo-modal__content">
        <div class="promo-modal__inner">
          <div class="promo-modal__copy">
            <span class="promo-modal__badge">Limited Time Offer</span>
            <div class="promo-modal__text">
              <h2 class="promo-modal__title">Get 20% off your first order!</h2>
              <p class="promo-modal__subtitle">Enter your email below to get your code.</p>
            </div>
          </div>
          <form class="promo-modal__form" action="#" method="post" novalidate>
            <input
              class="promo-modal__input"
              type="email"
              name="email"
              placeholder="Your Email"
              autocomplete="email"
              required
              aria-label="Your email"
            >
            <button class="promo-modal__submit" type="submit">Get Code</button>
            <button class="promo-modal__close" type="button">Close</button>
          </form>
        </div>
      </div>
      <div class="promo-modal__media" aria-hidden="true">
        <img
          src="/assets/V48TZXyinrD3hEf9nDUyGq0hBTU.png"
          alt=""
          width="1440"
          height="1920"
          loading="lazy"
        >
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  const form = modal.querySelector(".promo-modal__form");
  const input = modal.querySelector(".promo-modal__input");
  const closeBtn = modal.querySelector(".promo-modal__close");
  const title = modal.querySelector(".promo-modal__title");
  const subtitle = modal.querySelector(".promo-modal__subtitle");
  const badge = modal.querySelector(".promo-modal__badge");
  const submitBtn = modal.querySelector(".promo-modal__submit");

  function isDismissed() {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  }

  function isAnotherPanelOpen() {
    return (
      document.body.classList.contains("search-open") ||
      document.body.classList.contains("cart-open") ||
      document.body.classList.contains("mobile-nav-open")
    );
  }

  function setOpen(open) {
    isOpen = open;
    overlay.setAttribute("aria-hidden", String(!open));
    modal.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("promo-modal-open", open);

    if (open) {
      document.body.classList.add("commerce-panel-open");
      window.requestAnimationFrame(() => {
        window.setTimeout(() => input.focus(), 50);
      });
      return;
    }

    if (
      !document.body.classList.contains("search-open") &&
      !document.body.classList.contains("cart-open") &&
      !document.body.classList.contains("mobile-nav-open")
    ) {
      document.body.classList.remove("commerce-panel-open");
    }
  }

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    window.clearTimeout(showTimer);
    setOpen(false);
  }

  function showSuccess() {
    badge.hidden = true;
    title.textContent = "You're in!";
    subtitle.textContent = "Check your inbox for your 20% off code.";
    submitBtn.hidden = true;
    input.hidden = true;
    closeBtn.textContent = "Close";
  }

  function tryShow() {
    if (isDismissed() || isOpen) return;

    if (isAnotherPanelOpen()) {
      showTimer = window.setTimeout(tryShow, RETRY_WHEN_BLOCKED_MS);
      return;
    }

    setOpen(true);
  }

  function scheduleShow() {
    if (isDismissed()) return;

    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(tryShow, SHOW_DELAY_MS);
  }

  overlay.addEventListener("click", dismiss);
  closeBtn.addEventListener("click", dismiss);

  modal.addEventListener("click", (event) => {
    if (!event.target.closest(".promo-modal__panel")) {
      dismiss();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim()) {
      input.focus();
      return;
    }
    showSuccess();
    sessionStorage.setItem(STORAGE_KEY, "1");
    window.setTimeout(() => setOpen(false), 1800);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) dismiss();
  });

  if (document.readyState === "complete") {
    scheduleShow();
  } else {
    window.addEventListener("load", scheduleShow, { once: true });
  }
})();
