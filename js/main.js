(function () {
  const header = document.querySelector(".header");
  const mobileNavQuery = window.matchMedia("(max-width: 809.98px)");

  if (header) {
    const page = document.querySelector(".page");
    let ticking = false;
    let anchorTop = 0;
    let anchorLeft = 0;

    const MOBILE_HEADER_SCROLL_THRESHOLD = 100;
    const DESKTOP_HEADER_SCROLL_THRESHOLD = 120;

    let mobileHeaderFixed = false;
    let desktopHeaderFixed = false;
    let mobileHeaderHome = null;

    function isMobileNav() {
      return mobileNavQuery.matches;
    }

    function getScrollY() {
      return window.__lenis?.scroll ?? window.scrollY;
    }

    function clearInlineHeaderStyles() {
      header.style.removeProperty("top");
      header.style.removeProperty("left");
      header.style.removeProperty("right");
      header.style.removeProperty("width");
      header.style.removeProperty("max-width");
      header.style.removeProperty("transform");
    }

    function rememberMobileHeaderHome() {
      if (mobileHeaderHome) return;
      mobileHeaderHome = {
        parent: header.parentNode,
        next: header.nextSibling,
      };
    }

    function restoreMobileHeaderHome() {
      if (!mobileHeaderHome?.parent || !mobileHeaderHome.parent.isConnected) {
        mobileHeaderHome = null;
        return;
      }

      const { parent, next } = mobileHeaderHome;
      if (header.parentNode !== parent) {
        parent.insertBefore(header, next);
      }
      mobileHeaderHome = null;
    }

    function measureAnchor() {
      const wasDesktopFixed = desktopHeaderFixed;
      const wasMobileFixed = mobileHeaderFixed;

      if (wasDesktopFixed || wasMobileFixed) {
        header.classList.remove("header--fixed");
        clearInlineHeaderStyles();
      }

      const rect = header.getBoundingClientRect();
      const scrollY = getScrollY();

      // Resting viewport offset — stable even when measured mid-scroll.
      anchorTop = rect.top + scrollY;
      anchorLeft = rect.left;

      if (wasDesktopFixed) {
        header.style.top = `${anchorTop}px`;
        header.style.left = `${anchorLeft}px`;
        header.classList.add("header--fixed");
      } else if (wasMobileFixed) {
        header.classList.add("header--fixed");
      }
    }

    function shouldFixMobileHeader() {
      return getScrollY() >= MOBILE_HEADER_SCROLL_THRESHOLD;
    }

    function shouldFixDesktopHeader() {
      return getScrollY() >= DESKTOP_HEADER_SCROLL_THRESHOLD;
    }

    function cancelHeaderMotion() {
      header.classList.remove("header--exiting", "header--entering");
    }

    function applyMobileFixed() {
      cancelHeaderMotion();
      clearInlineHeaderStyles();
      // Escape overflow:hidden ancestors (hero/page-hero) so fixed sticks on iOS/mobile
      rememberMobileHeaderHome();
      if (header.parentNode !== document.body) {
        document.body.appendChild(header);
      }
      header.classList.add("header--fixed");
      mobileHeaderFixed = true;
    }

    function clearMobileFixed() {
      if (!mobileHeaderFixed) {
        return;
      }

      window.dispatchEvent(new CustomEvent("commerce:close-mobile-nav"));
      header.classList.remove("header--fixed", "header--exiting", "header--entering");
      restoreMobileHeaderHome();
      clearInlineHeaderStyles();
      mobileHeaderFixed = false;
    }

    function applyDesktopFixed() {
      cancelHeaderMotion();

      const rect = header.getBoundingClientRect();
      anchorTop = rect.top + getScrollY();
      anchorLeft = rect.left;

      header.style.top = `${anchorTop}px`;
      header.style.left = `${anchorLeft}px`;
      header.classList.add("header--fixed", "header--entering");
      header.offsetHeight;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          header.classList.remove("header--entering");
        });
      });
      desktopHeaderFixed = true;
    }

    function clearDesktopFixed() {
      if (!desktopHeaderFixed) {
        return;
      }

      cancelHeaderMotion();
      header.classList.remove("header--fixed");
      clearInlineHeaderStyles();
      desktopHeaderFixed = false;
    }

    function updateHeaderFixed() {
      if (isMobileNav()) {
        const shouldFix = shouldFixMobileHeader();

        if (shouldFix) {
          if (!mobileHeaderFixed) {
            applyMobileFixed();
          }
        } else if (mobileHeaderFixed) {
          clearMobileFixed();
        }

        ticking = false;
        return;
      }

      const shouldFix = shouldFixDesktopHeader();

      if (shouldFix) {
        if (!desktopHeaderFixed) {
          applyDesktopFixed();
        }
      } else if (desktopHeaderFixed) {
        clearDesktopFixed();
      }

      ticking = false;
    }

    function scheduleHeaderUpdate() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeaderFixed);
      }
    }

    function bindLenisScroll() {
      const lenis = window.__lenis;
      if (!lenis || lenis.__commerceHeaderScroll) {
        return;
      }

      lenis.on("scroll", scheduleHeaderUpdate);
      lenis.__commerceHeaderScroll = true;
      scheduleHeaderUpdate();
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

      if (desktopHeaderFixed) {
        measureAnchor();
        header.style.top = `${anchorTop}px`;
        header.style.left = `${anchorLeft}px`;
        return;
      }

      clearInlineHeaderStyles();
      header.classList.remove("header--fixed");
      measureAnchor();
    });

    mobileNavQuery.addEventListener("change", () => {
      cancelHeaderMotion();
      header.classList.remove("header--fixed", "header--entering", "header--exiting");
      if (mobileHeaderFixed) {
        restoreMobileHeaderHome();
      }
      mobileHeaderFixed = false;
      desktopHeaderFixed = false;
      clearInlineHeaderStyles();
      measureAnchor();
      updateHeaderFixed();
    });

    window.addEventListener(
      "scroll",
      scheduleHeaderUpdate,
      { passive: true }
    );

    window.addEventListener("commerce:lenis-ready", bindLenisScroll);
    bindLenisScroll();

    if (!window.__lenis) {
      const lenisPoll = window.setInterval(() => {
        if (window.__lenis) {
          bindLenisScroll();
          window.clearInterval(lenisPoll);
        }
      }, 32);
      window.setTimeout(() => window.clearInterval(lenisPoll), 10000);
    }

    window.addEventListener("load", () => {
      if (!desktopHeaderFixed && !mobileHeaderFixed) {
        measureAnchor();
        updateHeaderFixed();
      }
    });

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
