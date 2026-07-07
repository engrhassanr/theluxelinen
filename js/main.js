(function () {
  const header = document.querySelector(".header");
  const mobileNavQuery = window.matchMedia("(max-width: 809.98px)");

  if (header) {
    const page = document.querySelector(".page");
    let ticking = false;
    let anchorTop = 0;
    let anchorLeft = 0;

    const MOBILE_HEADER_SCROLL_THRESHOLD = 100;
    const MOBILE_HEADER_TRANSITION_MS = 420;

    let mobileHeaderFixed = false;
    let mobileExitTimer = null;

    function isMobileNav() {
      return mobileNavQuery.matches;
    }

    function clearInlineHeaderStyles() {
      header.style.removeProperty("top");
      header.style.removeProperty("left");
      header.style.removeProperty("right");
      header.style.removeProperty("width");
      header.style.removeProperty("max-width");
      header.style.removeProperty("transform");
    }

    function measureAnchor() {
      const wasFixed = header.classList.contains("header--fixed");

      if (wasFixed) {
        header.classList.remove("header--fixed");
        clearInlineHeaderStyles();
      }

      const rect = header.getBoundingClientRect();
      anchorTop = rect.top;
      anchorLeft = rect.left;

      if (wasFixed) {
        applyFixed();
      }
    }

    function shouldFixMobileHeader() {
      return window.scrollY >= MOBILE_HEADER_SCROLL_THRESHOLD;
    }

    function isHeaderFixedScroll() {
      return window.scrollY > 0;
    }

    function cancelMobileExit() {
      if (mobileExitTimer) {
        window.clearTimeout(mobileExitTimer);
        mobileExitTimer = null;
      }

      header.classList.remove("header--exiting");
    }

    function applyMobileFixed() {
      cancelMobileExit();
      header.classList.add("header--fixed", "header--entering");
      void header.offsetHeight;
      window.requestAnimationFrame(() => {
        header.classList.remove("header--entering");
      });
      mobileHeaderFixed = true;
    }

    function clearMobileFixed() {
      if (!mobileHeaderFixed || header.classList.contains("header--exiting")) {
        return;
      }

      header.classList.add("header--exiting");
      void header.offsetHeight;
      window.dispatchEvent(new CustomEvent("commerce:close-mobile-nav"));

      mobileExitTimer = window.setTimeout(() => {
        header.classList.remove("header--fixed", "header--exiting", "header--entering");
        mobileHeaderFixed = false;
        mobileExitTimer = null;
      }, MOBILE_HEADER_TRANSITION_MS);
    }

    function applyFixed() {
      if (isMobileNav()) {
        applyMobileFixed();
        return;
      }

      header.style.top = `${anchorTop}px`;
      header.style.left = `${anchorLeft}px`;
      header.classList.add("header--fixed");
    }

    function updateHeaderFixed() {
      if (isMobileNav()) {
        const shouldFix = shouldFixMobileHeader();

        if (shouldFix) {
          if (!mobileHeaderFixed || header.classList.contains("header--exiting")) {
            applyMobileFixed();
          }
        } else if (mobileHeaderFixed) {
          clearMobileFixed();
        }

        ticking = false;
        return;
      }

      if (isHeaderFixedScroll()) {
        applyFixed();
      } else {
        header.classList.remove("header--fixed");
        clearInlineHeaderStyles();
        measureAnchor();
      }

      ticking = false;
    }

    measureAnchor();

    window.addEventListener("resize", () => {
      if (isMobileNav()) {
        if (shouldFixMobileHeader()) {
          applyMobileFixed();
        } else {
          clearMobileFixed();
        }
        return;
      }

      clearInlineHeaderStyles();
      header.classList.remove("header--fixed");

      if (!isHeaderFixedScroll()) {
        measureAnchor();
        return;
      }

      measureAnchor();
      applyFixed();
    });

    mobileNavQuery.addEventListener("change", () => {
      cancelMobileExit();
      header.classList.remove("header--fixed", "header--entering", "header--exiting");
      mobileHeaderFixed = false;
      measureAnchor();
      updateHeaderFixed();
    });

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateHeaderFixed);
        }
      },
      { passive: true }
    );

    updateHeaderFixed();
  }

  (function initMobileNav() {
    const menuBtn = document.querySelector(".header__menu-btn");
    const headerNav = document.querySelector(".header__nav");
    if (!menuBtn || !headerNav) return;

    if (!menuBtn.querySelector(".header__menu-icon")) {
      const sampleIcon = document.querySelector(".header__icon-img");
      const iconDir = sampleIcon
        ? sampleIcon.getAttribute("src").replace(/[^/]+$/, "")
        : "/assets/icons/";
      menuBtn.innerHTML = `
        <span class="header__menu-icon header__menu-icon--list" aria-hidden="true">
          <img src="${iconDir}list.svg" alt="" width="20" height="20">
        </span>
        <span class="header__menu-icon header__menu-icon--x" aria-hidden="true">
          <img src="${iconDir}x-bold.svg" alt="" width="20" height="20">
        </span>`;
    }

    const panel = document.createElement("div");
    panel.className = "mobile-nav";
    panel.setAttribute("aria-label", "Mobile navigation");
    panel.setAttribute("aria-hidden", "true");

    const links = Array.from(document.querySelectorAll(".header__links a"));
    const items = links
      .map((link) => {
        const current = link.getAttribute("aria-current") === "page" ? ' aria-current="page"' : "";
        return `<li><a href="${link.getAttribute("href")}"${current}>${link.textContent}</a></li>`;
      })
      .join("");

    panel.innerHTML = `<ul class="mobile-nav__links">${items}</ul>`;

    const navInner = headerNav.querySelector(".header__nav-inner");
    if (navInner) {
      navInner.insertAdjacentElement("afterend", panel);
    } else {
      headerNav.appendChild(panel);
    }

    function setOpen(isOpen) {
      if (isOpen) {
        window.dispatchEvent(new CustomEvent("commerce:close-panels"));
      }

      document.body.classList.toggle("mobile-nav-open", isOpen);
      panel.setAttribute("aria-hidden", String(!isOpen));
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    }

    menuBtn.addEventListener("click", () => {
      const headerEl = document.querySelector(".header");
      if (!headerEl?.classList.contains("header--fixed")) return;
      setOpen(!document.body.classList.contains("mobile-nav-open"));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("commerce:close-mobile-nav", () => setOpen(false));

    mobileNavQuery.addEventListener("change", () => setOpen(false));
  })();

  const avatars = Array.from(document.querySelectorAll(".testimonials__avatar"));
  const prevBtn = document.querySelector(".testimonials__nav-btn--prev");
  const nextBtn = document.querySelector(".testimonials__nav-btn--next");
  const textSlides = Array.from(document.querySelectorAll(".testimonials__text-slide"));

  if (avatars.length && prevBtn && nextBtn) {
    let current = 0;
    let isAnimating = false;

    function showSlide(index) {
      if (isAnimating) return;

      const next = (index + avatars.length) % avatars.length;
      if (next === current) return;

      isAnimating = true;
      current = next;

      avatars.forEach((avatar, i) => {
        avatar.classList.toggle("testimonials__avatar--active", i === current);
      });

      textSlides.forEach((slide) => {
        slide.classList.toggle(
          "testimonials__text-slide--active",
          parseInt(slide.dataset.slide, 10) === current
        );
      });

      window.setTimeout(() => {
        isAnimating = false;
      }, 500);
    }

    prevBtn.addEventListener("click", () => showSlide(current - 1));
    nextBtn.addEventListener("click", () => showSlide(current + 1));

    showSlide(0);
  }

  const showcaseVideo = document.getElementById("showcase-video");
  const showcasePlay = document.getElementById("showcase-play");

  if (showcaseVideo && showcasePlay) {
    showcaseVideo.play().catch(() => {});

    showcasePlay.addEventListener("click", () => {
      if (showcaseVideo.paused) {
        showcaseVideo.play();
        showcasePlay.classList.add("is-playing");
        showcasePlay.setAttribute("aria-label", "Pause video");
      } else {
        showcaseVideo.pause();
        showcasePlay.classList.remove("is-playing");
        showcasePlay.setAttribute("aria-label", "Play video");
      }
    });
  }

  const shopGrid = document.getElementById("shop-grid");
  const shopFilters = Array.from(document.querySelectorAll(".shop-sidebar__category"));

  if (shopGrid && shopFilters.length) {
    const products = Array.from(shopGrid.querySelectorAll(".product-card"));

    function filterProducts(category) {
      products.forEach((product) => {
        const matches =
          category === "all" || product.dataset.category === category;
        product.classList.toggle("is-hidden", !matches);
      });
    }

    shopFilters.forEach((button) => {
      button.addEventListener("click", () => {
        const category = button.dataset.category;

        shopFilters.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        filterProducts(category);
      });
    });
  }
})();
