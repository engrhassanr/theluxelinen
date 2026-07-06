(function () {
  const header = document.querySelector(".header");
  const mobileNavQuery = window.matchMedia("(max-width: 809.98px)");

  if (header) {
    const page = document.querySelector(".page");
    let ticking = false;
    let anchorTop = 0;
    let anchorLeft = 0;

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

    function updateAnchorForResize() {
      if (!page || isMobileNav()) return;

      const padding = parseFloat(getComputedStyle(page).paddingLeft);
      anchorTop = padding;
      anchorLeft = page.getBoundingClientRect().left + padding;

      if (header.classList.contains("header--fixed")) {
        header.style.top = `${anchorTop}px`;
        header.style.left = `${anchorLeft}px`;
      }
    }

    function applyMobileFixed() {
      header.style.top = "24px";
      header.style.left = "12px";
      header.style.right = "12px";
      header.style.width = "auto";
      header.classList.add("header--fixed");
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
        if (window.scrollY > 0) {
          applyMobileFixed();
        } else {
          header.classList.remove("header--fixed");
          clearInlineHeaderStyles();
        }
        ticking = false;
        return;
      }

      if (window.scrollY > 0) {
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
        if (window.scrollY > 0) {
          applyMobileFixed();
        } else {
          header.classList.remove("header--fixed");
          clearInlineHeaderStyles();
        }
        return;
      }

      clearInlineHeaderStyles();
      header.classList.remove("header--fixed");

      if (window.scrollY === 0) {
        measureAnchor();
        return;
      }

      updateAnchorForResize();
      applyFixed();
    });

    mobileNavQuery.addEventListener("change", () => {
      clearInlineHeaderStyles();
      header.classList.remove("header--fixed");
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
    if (!menuBtn) return;

    const overlay = document.createElement("div");
    overlay.className = "mobile-nav__overlay";
    overlay.setAttribute("aria-hidden", "true");

    const panel = document.createElement("nav");
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

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    function setOpen(isOpen) {
      document.body.classList.toggle("mobile-nav-open", isOpen);
      overlay.setAttribute("aria-hidden", String(!isOpen));
      panel.setAttribute("aria-hidden", String(!isOpen));
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      menuBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    }

    menuBtn.addEventListener("click", () => {
      setOpen(!document.body.classList.contains("mobile-nav-open"));
    });

    overlay.addEventListener("click", () => setOpen(false));

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
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
