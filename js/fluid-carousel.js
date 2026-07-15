(function () {
  const root = document.getElementById("fluid-carousel");
  if (!root) return;

  // No fragment ids on slides — old #slide hashes used to yank scroll mid-page
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const slides = Array.from(root.querySelectorAll(".fluid-carousel__slide"));
  const ambientImg = root.querySelector(".fluid-carousel__ambient-img");
  const buttons = root.querySelectorAll(".fluid-carousel__btn");
  const count = slides.length;
  if (!count) return;

  const STEP_Z = 160;
  const STEP_ROT = 10;
  const STEP_SCALE = 0.18;
  const STEP_BLUR = 10;
  const MAX_VISIBLE = 2;
  const AUTOPLAY_MS = 4500;
  const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
  // Flat transforms only on phones — avoid 3D perspective push on iOS
  const phoneMq = window.matchMedia("(max-width: 809.98px)");

  function slideKey(slide) {
    return slide.getAttribute("data-slide-id") || slide.id || "";
  }

  function findSlideIndex(id) {
    if (!id) return -1;
    return slides.findIndex((slide) => slideKey(slide) === id);
  }

  function indexFromHash() {
    const id =
      (typeof window.__heroSlideHash === "string" && window.__heroSlideHash) ||
      window.location.hash.replace(/^#/, "");
    const match = findSlideIndex(id);
    return match >= 0 ? match : 0;
  }

  let index = indexFromHash();
  let dragging = false;
  let dragPending = false;
  let dragLock = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDelta = 0;
  let autoplayTimer = null;
  let scrollIdleTimer = null;
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isPhone() {
    return phoneMq.matches;
  }

  function getScrollY() {
    return window.__lenis?.scroll ?? window.scrollY ?? 0;
  }

  // 3D perspective warps as the hero moves in the viewport — flatten while scrolled
  let flatMode = isPhone() || getScrollY() > 24;
  let lockedHeroHeight = 0;
  let lastViewportWidth = window.innerWidth;

  function lockHeroHeight({ force = false } = {}) {
    const hero = document.getElementById("hero");
    if (!hero || !hero.classList.contains("hero--carousel")) return;

    // Keep the first lock — remeasuring on chrome show/hide jumps the slides
    if (lockedHeroHeight && !force) {
      hero.style.height = `${lockedHeroHeight}px`;
      hero.style.minHeight = `${lockedHeroHeight}px`;
      return;
    }

    hero.style.height = "";
    hero.style.minHeight = "";
    const h = Math.round(hero.getBoundingClientRect().height);
    if (h < 120) return;
    lockedHeroHeight = h;
    hero.style.height = `${h}px`;
    hero.style.minHeight = `${h}px`;
  }

  function pauseCarouselForPageScroll() {
    // Page scroll over the hero must never drag/advance slides
    if (dragPending || dragging) {
      cancelPointerGesture();
      render(0, { instant: true });
    }
    if (autoplayTimer) clearInterval(autoplayTimer);
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      restartAutoplay();
    }, 1600);
  }

  function stepX() {
    const slide = slides[0];
    const w = slide?.offsetWidth || root.clientWidth * 0.56 || 320;
    if (isPhone()) return Math.min(w * 0.72, root.clientWidth * 0.7);
    return w * 0.72;
  }

  function wrap(n) {
    return ((n % count) + count) % count;
  }

  function shortestOffset(i, active) {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  }

  function styleForOffset(offset, dragBias) {
    const o = offset - dragBias;
    const abs = Math.abs(o);
    const clamped = Math.min(abs, MAX_VISIBLE);
    const xStep = stepX();
    const phone = isPhone();
    const flat = phone || flatMode;

    const x = o * xStep;
    const z = flat ? 0 : -clamped * STEP_Z;
    const rot = flat ? 0 : -o * STEP_ROT;
    const scale = Math.max(phone ? 0.78 : 0.62, 1 - clamped * (phone ? 0.14 : STEP_SCALE));
    const opacity = Math.max(0, 1 - clamped * 0.55);
    const blur = flat ? 0 : clamped * STEP_BLUR;
    const zIndex = 100 - Math.round(clamped * 1);
    const interactive = abs < 1.35;

    return { x, z, rot, scale, opacity, blur, zIndex, interactive, phone, flat };
  }

  function syncAmbient() {
    if (!ambientImg) return;
    const img = slides[index]?.querySelector("img");
    if (!img) return;
    const src = img.currentSrc || img.src;
    if (ambientImg.src === src) return;
    ambientImg.style.opacity = "0.35";
    ambientImg.onload = () => {
      ambientImg.style.opacity = "0.72";
    };
    ambientImg.src = src;
  }

  function warmNearbyImages() {
    for (let d = -2; d <= 2; d++) {
      const img = slides[wrap(index + d)]?.querySelector("img");
      if (!img) continue;
      if (img.loading === "lazy") img.loading = "eager";
      if (typeof img.decode === "function") {
        img.decode().catch(() => {});
      }
    }
  }

  function render(dragBias = 0, { instant = false } = {}) {
    if (instant) {
      slides.forEach((slide) => {
        slide.style.transition = "none";
      });
    }

    slides.forEach((slide, i) => {
      const offset = shortestOffset(i, index);
      const s = styleForOffset(offset, dragBias);
      const isActive = Math.abs(offset - dragBias) < 0.5;

      if (s.phone || s.flat) {
        // 2D — stable while scrolling (no perspective drift)
        slide.style.transform =
          `translate(-50%, -50%) translateX(${s.x}px) scale(${s.scale})`;
      } else {
        slide.style.transform =
          `translate3d(calc(-50% + ${s.x}px), -50%, ${s.z}px) rotateY(${s.rot}deg) scale(${s.scale})`;
      }
      slide.style.zIndex = String(s.zIndex);
      slide.style.opacity = String(s.opacity);
      slide.style.filter = s.blur > 0.1 ? `blur(${s.blur}px)` : "blur(0px)";
      slide.style.pointerEvents = s.interactive ? "auto" : "none";
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    if (instant) {
      // Force reflow then restore transitions
      void root.offsetHeight;
      slides.forEach((slide) => {
        slide.style.transition = `transform 0.8s ${EASE}, opacity 0.8s ${EASE}, filter 0.8s ${EASE}`;
      });
    }

    if (Math.abs(dragBias) < 0.15) {
      syncAmbient();
      warmNearbyImages();
    }
  }

  function syncFlatModeFromScroll() {
    pauseCarouselForPageScroll();
    const next = isPhone() || getScrollY() > 24;
    if (next === flatMode) return;
    flatMode = next;
    render(0, { instant: true });
  }

  function goTo(next) {
    index = wrap(next);
    render(0);
    restartAutoplay();
  }

  function step(dir) {
    goTo(index + dir);
  }

  function restartAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    if (reducedMotion || dragging || dragPending) return;
    autoplayTimer = setInterval(() => step(1), AUTOPLAY_MS);
  }

  function onPointerDown(e) {
    if (e.target.closest(".fluid-carousel__btn")) return;
    if (e.button != null && e.button !== 0) return;
    // Don't steal the gesture yet — wait until movement proves horizontal
    dragging = false;
    dragLock = null;
    dragPending = true;
    dragStartX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragStartY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    dragDelta = 0;
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  function cancelPointerGesture() {
    dragPending = false;
    dragging = false;
    dragLock = null;
    dragDelta = 0;
    root.classList.remove("is-dragging");
  }

  function onPointerMove(e) {
    if (!dragPending && !dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const dx = x - dragStartX;
    const dy = y - dragStartY;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    if (!dragLock) {
      const threshold = isPhone() ? 14 : 6;
      if (ax < threshold && ay < threshold) return;

      // Mobile: prefer page scroll — only take clearly horizontal swipes
      if (isPhone()) {
        if (ay >= ax * 0.9) {
          cancelPointerGesture();
          restartAutoplay();
          return;
        }
        if (ax < ay * 1.35 || ax < 22) return;
      } else {
        dragLock = ax > ay ? "x" : "y";
        if (dragLock === "y") {
          cancelPointerGesture();
          restartAutoplay();
          return;
        }
      }

      dragLock = "x";
      dragging = true;
      dragPending = false;
      root.classList.add("is-dragging");
    }

    if (dragLock !== "x") return;
    if (e.cancelable) e.preventDefault();
    dragDelta = dx;
    render(dragDelta / stepX());
  }

  function onPointerUp() {
    if (!dragPending && !dragging) return;

    const wasHorizontal = dragLock === "x" && dragging;
    const delta = dragDelta;
    cancelPointerGesture();

    if (wasHorizontal) {
      const threshold = stepX() * (isPhone() ? 0.22 : 0.22);
      if (delta <= -threshold) step(1);
      else if (delta >= threshold) step(-1);
      else render(0);
    } else {
      render(0);
    }

    restartAutoplay();
  }

  slides.forEach((slide) => {
    slide.addEventListener("click", (e) => {
      const i = Number(slide.dataset.index);
      if (i === index) return;
      e.preventDefault();
      goTo(i);
    });
  });

  function goToSlideId(id) {
    const i = findSlideIndex(id);
    if (i < 0) return false;
    goTo(i);
    return true;
  }

  function onProductSlideActivate(id) {
    if (!goToSlideId(id)) return;
    // User-initiated only — bring hero into view once, never auto-loop
    const hero = document.getElementById("hero");
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 80 || rect.top > window.innerHeight * 0.35) {
      if (window.__lenis?.scrollTo) {
        window.__lenis.scrollTo(hero, { offset: 0, duration: 1.1 });
      } else {
        hero.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  // Product cards sync the carousel — no href / no hash / no page jump
  document.querySelectorAll("[data-slide]").forEach((el) => {
    const id = el.getAttribute("data-slide");
    if (!id || findSlideIndex(id) < 0) return;

    el.addEventListener("click", (e) => {
      e.preventDefault();
      onProductSlideActivate(id);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onProductSlideActivate(id);
    });
  });

  // Sync from captured hash (already stripped in <head>)
  if (window.__heroSlideHash) {
    goToSlideId(window.__heroSlideHash);
    window.__heroSlideHash = "";
  }

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (!id || findSlideIndex(id) < 0) return;
    goToSlideId(id);
    history.replaceState(null, "", location.pathname + location.search);
  });

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      step(Number(btn.dataset.dir));
    });
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  root.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  phoneMq.addEventListener("change", () => {
    flatMode = isPhone() || getScrollY() > 24;
    lockHeroHeight({ force: true });
    render(0, { instant: true });
  });

  root.addEventListener("mouseenter", () => {
    if (autoplayTimer) clearInterval(autoplayTimer);
  });
  root.addEventListener("mouseleave", restartAutoplay);

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
    reducedMotion = e.matches;
    restartAutoplay();
  });

  // Ignore height-only resizes (mobile URL bar) — they were reflowing the slides
  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    if (Math.abs(w - lastViewportWidth) < 2) return;
    lastViewportWidth = w;
    lockHeroHeight({ force: true });
    render(0, { instant: true });
  });

  window.addEventListener("scroll", syncFlatModeFromScroll, { passive: true });
  window.addEventListener("commerce:lenis-ready", () => {
    const lenis = window.__lenis;
    if (lenis && !lenis.__fluidCarouselScroll) {
      lenis.on("scroll", syncFlatModeFromScroll);
      lenis.__fluidCarouselScroll = true;
    }
  });
  if (window.__lenis && !window.__lenis.__fluidCarouselScroll) {
    window.__lenis.on("scroll", syncFlatModeFromScroll);
    window.__lenis.__fluidCarouselScroll = true;
  }

  requestAnimationFrame(() => {
    slides.forEach((slide) => {
      slide.style.transition = `transform 0.8s ${EASE}, opacity 0.8s ${EASE}, filter 0.8s ${EASE}`;
      slide.style.willChange = "auto";
      const img = slide.querySelector("img");
      if (img) img.loading = "eager";
    });
    lockHeroHeight({ force: true });
    render(0);
    restartAutoplay();
  });
})();