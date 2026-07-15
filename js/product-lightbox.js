(function () {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!cards.length) return;

  const arrowPath =
    "M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z";

  const lightbox = document.createElement("div");
  lightbox.className = "product-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Product gallery");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.setAttribute("data-lenis-prevent", "");
  lightbox.innerHTML = `
    <div class="product-lightbox__backdrop" aria-hidden="true"></div>
    <div class="product-lightbox__glow" aria-hidden="true"></div>
    <header class="product-lightbox__top">
      <p class="product-lightbox__counter" aria-live="polite"></p>
      <button class="product-lightbox__close" type="button" aria-label="Close gallery">
        <img src="/assets/icons/x.svg" alt="" width="18" height="18" aria-hidden="true">
      </button>
    </header>
    <div class="product-lightbox__stage">
      <div class="product-lightbox__frame">
        <img class="product-lightbox__image" src="" alt="" decoding="async">
      </div>
    </div>
    <footer class="product-lightbox__bottom">
      <div class="product-lightbox__meta">
        <p class="product-lightbox__category"></p>
        <h2 class="product-lightbox__title"></h2>
      </div>
      <div class="product-lightbox__progress" aria-hidden="true">
        <span class="product-lightbox__progress-bar"></span>
      </div>
      <div class="product-lightbox__controls">
        <button class="product-lightbox__nav product-lightbox__nav--prev" type="button" aria-label="Previous product">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" aria-hidden="true">
            <path d="${arrowPath}" fill="currentColor"/>
          </svg>
        </button>
        <button class="product-lightbox__nav product-lightbox__nav--next" type="button" aria-label="Next product">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="20" height="20" aria-hidden="true">
            <path d="${arrowPath}" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="product-lightbox__thumbs" role="tablist" aria-label="Product thumbnails"></div>
    </footer>
  `;

  document.body.appendChild(lightbox);

  const imageEl = lightbox.querySelector(".product-lightbox__image");
  const frameEl = lightbox.querySelector(".product-lightbox__frame");
  const titleEl = lightbox.querySelector(".product-lightbox__title");
  const categoryEl = lightbox.querySelector(".product-lightbox__category");
  const counterEl = lightbox.querySelector(".product-lightbox__counter");
  const progressBar = lightbox.querySelector(".product-lightbox__progress-bar");
  const thumbsEl = lightbox.querySelector(".product-lightbox__thumbs");
  const closeBtn = lightbox.querySelector(".product-lightbox__close");
  const prevBtn = lightbox.querySelector(".product-lightbox__nav--prev");
  const nextBtn = lightbox.querySelector(".product-lightbox__nav--next");
  const backdrop = lightbox.querySelector(".product-lightbox__backdrop");

  let isOpen = false;
  let group = [];
  let index = 0;
  let animating = false;
  let swipeActive = false;
  let swipeAxis = null;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeDeltaX = 0;
  let swipeMoved = false;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readCard(card) {
    const img = card.querySelector(".product-card__image-link img");
    if (!img || !img.getAttribute("src")) return null;

    const name =
      card.querySelector(".product-card__name")?.textContent?.trim() ||
      img.getAttribute("alt") ||
      "Product";
    const category =
      card.querySelector(".product-card__category")?.textContent?.trim() || "";

    return {
      card,
      src: img.getAttribute("src"),
      alt: img.getAttribute("alt") || name,
      name,
      category,
    };
  }

  function cardsInGroup() {
    return cards.map(readCard).filter(Boolean);
  }

  function renderThumbs() {
    if (group.length < 2) {
      thumbsEl.hidden = true;
      thumbsEl.innerHTML = "";
      return;
    }

    thumbsEl.hidden = false;
    thumbsEl.innerHTML = group
      .map(
        (item, i) => `
        <button
          class="product-lightbox__thumb${i === index ? " is-active" : ""}"
          type="button"
          role="tab"
          aria-selected="${i === index ? "true" : "false"}"
          aria-label="${escapeHtml(item.name)}"
          data-index="${i}"
        >
          <img src="${escapeHtml(item.src)}" alt="" width="72" height="72" loading="lazy">
        </button>
      `
      )
      .join("");
  }

  function updateChrome() {
    const item = group[index];
    if (!item) return;

    titleEl.textContent = item.name;
    categoryEl.textContent = item.category;
    counterEl.textContent = `${String(index + 1).padStart(2, "0")} — ${String(group.length).padStart(2, "0")}`;
    progressBar.style.width = `${((index + 1) / group.length) * 100}%`;

    const multi = group.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
    const controls = lightbox.querySelector(".product-lightbox__controls");
    if (controls) controls.hidden = !multi;

    thumbsEl.querySelectorAll(".product-lightbox__thumb").forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle("is-active", active);
      thumb.setAttribute("aria-selected", active ? "true" : "false");
      if (active) {
        thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  function settleImage() {
    imageEl.style.transform = "";
    imageEl.style.transition = "";
    imageEl.classList.add("is-loaded");
    animating = false;
  }

  function showImage() {
    const item = group[index];
    if (!item) return;

    imageEl.classList.remove("is-loaded");
    imageEl.style.transform = "";
    imageEl.alt = item.alt;
    updateChrome();

    if (imageEl.getAttribute("src") === item.src) {
      if (imageEl.complete && imageEl.naturalWidth) settleImage();
      return;
    }

    imageEl.src = item.src;
    if (imageEl.complete && imageEl.naturalWidth) settleImage();
  }

  function setOpen(open) {
    isOpen = open;
    document.body.classList.toggle("product-lightbox-open", open);
    lightbox.setAttribute("aria-hidden", open ? "false" : "true");

    if (open) {
      closeBtn.focus({ preventScroll: true });
      if (window.__lenis) window.__lenis.stop();
    } else if (window.__lenis) {
      window.__lenis.start();
    }
  }

  function openFromCard(card) {
    group = cardsInGroup();
    const item = readCard(card);
    if (!item || !group.length) return;

    index = Math.max(
      0,
      group.findIndex((entry) => entry.card === card)
    );
    renderThumbs();
    showImage();
    setOpen(true);
  }

  function close() {
    if (!isOpen) return;
    setOpen(false);
  }

  function go(delta) {
    if (group.length < 2 || animating) return;
    animating = true;
    index = (index + delta + group.length) % group.length;
    showImage();
  }

  function goTo(nextIndex) {
    if (nextIndex === index || animating) return;
    animating = true;
    index = nextIndex;
    showImage();
  }

  imageEl.addEventListener("load", settleImage);
  imageEl.addEventListener("error", settleImage);

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".product-card__image-link");
    if (!link) return;

    const card = link.closest(".product-card");
    if (!card || !document.body.contains(card)) return;

    event.preventDefault();
    openFromCard(card);
  });

  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));

  thumbsEl.addEventListener("click", (event) => {
    const thumb = event.target.closest(".product-lightbox__thumb");
    if (!thumb) return;
    goTo(Number(thumb.dataset.index));
  });

  frameEl.addEventListener("click", (event) => {
    if (event.target === frameEl) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  });

  function onSwipeStart(event) {
    if (!isOpen || group.length < 2 || animating) return;
    if (event.target.closest(".product-lightbox__thumbs, .product-lightbox__nav, .product-lightbox__close, .product-lightbox__top")) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) return;

    swipeActive = true;
    swipeAxis = null;
    swipeMoved = false;
    swipeStartX = event.clientX;
    swipeStartY = event.clientY;
    swipeDeltaX = 0;

    imageEl.style.transition = "none";
    try {
      stageEl.setPointerCapture(event.pointerId);
    } catch (_) {}
  }

  function onSwipeMove(event) {
    if (!swipeActive) return;

    const dx = event.clientX - swipeStartX;
    const dy = event.clientY - swipeStartY;

    if (!swipeAxis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      swipeAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (swipeAxis === "y") {
        swipeActive = false;
        imageEl.style.transform = "";
        imageEl.style.transition = "";
        return;
      }
    }

    if (swipeAxis !== "x") return;
    event.preventDefault();
    swipeDeltaX = dx;
    swipeMoved = Math.abs(dx) > 12;
    const resistance = 0.82;
    imageEl.style.transform = `translateX(${dx * resistance}px)`;
  }

  function onSwipeEnd() {
    if (!swipeActive) return;
    swipeActive = false;

    const threshold = Math.min(72, Math.max(40, frameEl.clientWidth * 0.18));
    const shouldChange = swipeAxis === "x" && Math.abs(swipeDeltaX) >= threshold;

    imageEl.style.transition = "transform 0.28s var(--ease-panel, ease), opacity 0.3s ease";

    if (shouldChange) {
      const dir = swipeDeltaX > 0 ? -1 : 1;
      imageEl.style.transform = `translateX(${dir > 0 ? -28 : 28}%)`;
      imageEl.style.opacity = "0";
      window.setTimeout(() => {
        imageEl.style.transition = "none";
        imageEl.style.transform = "";
        imageEl.style.opacity = "";
        go(dir);
      }, 160);
    } else {
      imageEl.style.transform = "translateX(0)";
      window.setTimeout(() => {
        imageEl.style.transition = "";
        imageEl.style.transform = "";
      }, 280);
    }

    swipeAxis = null;
    swipeDeltaX = 0;
  }

  const stageEl = lightbox.querySelector(".product-lightbox__stage");
  stageEl.addEventListener("pointerdown", onSwipeStart);
  stageEl.addEventListener("pointermove", onSwipeMove, { passive: false });
  stageEl.addEventListener("pointerup", onSwipeEnd);
  stageEl.addEventListener("pointercancel", onSwipeEnd);
  stageEl.addEventListener("pointerleave", (event) => {
    if (swipeActive && event.pointerType === "touch") onSwipeEnd();
  });

  stageEl.addEventListener(
    "click",
    (event) => {
      if (swipeMoved) {
        event.preventDefault();
        event.stopPropagation();
        swipeMoved = false;
      }
    },
    true
  );
})();
