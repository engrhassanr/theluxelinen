(function () {
  const header = document.querySelector(".header");

  if (header) {
    const page = document.querySelector(".page");
    let ticking = false;
    let anchorTop = 0;
    let anchorLeft = 0;

    function measureAnchor() {
      const wasFixed = header.classList.contains("header--fixed");

      if (wasFixed) {
        header.classList.remove("header--fixed");
        header.style.removeProperty("top");
        header.style.removeProperty("left");
      }

      const rect = header.getBoundingClientRect();
      anchorTop = rect.top;
      anchorLeft = rect.left;

      if (wasFixed) {
        applyFixed();
      }
    }

    function updateAnchorForResize() {
      if (!page) return;

      const padding = parseFloat(getComputedStyle(page).paddingLeft);
      anchorTop = padding;
      anchorLeft = page.getBoundingClientRect().left + padding;

      if (header.classList.contains("header--fixed")) {
        header.style.top = `${anchorTop}px`;
        header.style.left = `${anchorLeft}px`;
      }
    }

    function applyFixed() {
      header.style.top = `${anchorTop}px`;
      header.style.left = `${anchorLeft}px`;
      header.classList.add("header--fixed");
    }

    function updateHeaderFixed() {
      if (window.scrollY > 0) {
        applyFixed();
      } else {
        header.classList.remove("header--fixed");
        header.style.removeProperty("top");
        header.style.removeProperty("left");
        measureAnchor();
      }

      ticking = false;
    }

    measureAnchor();

    window.addEventListener("resize", () => {
      if (window.scrollY === 0) {
        measureAnchor();
        return;
      }

      updateAnchorForResize();
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
