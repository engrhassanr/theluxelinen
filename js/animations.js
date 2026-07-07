(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getScriptBase() {
    const current = document.currentScript;
    if (current?.src) {
      return current.src.replace(/\/[^/]*$/, "/");
    }

    return "/js/";
  }

  function loadLenis() {
    return new Promise((resolve, reject) => {
      if (window.Lenis) {
        resolve(window.Lenis);
        return;
      }

      const script = document.createElement("script");
      script.src = `${getScriptBase()}vendor/lenis.min.js`;
      script.onload = () => resolve(window.Lenis);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function shouldStopSmoothScroll() {
    const body = document.body;

    return (
      body.classList.contains("commerce-panel-open") ||
      body.classList.contains("mobile-nav-open") ||
      body.classList.contains("promo-modal-open")
    );
  }

  function initSmoothScroll() {
    return loadLenis()
      .then((Lenis) => {
        const lenis = new Lenis({
          autoRaf: true,
          smoothWheel: true,
          lerp: 0.1,
          wheelMultiplier: 1,
          touchMultiplier: 1.15,
        });

        window.__lenis = lenis;
        window.dispatchEvent(new CustomEvent("commerce:lenis-ready", { detail: lenis }));

        const syncScrollState = () => {
          if (shouldStopSmoothScroll()) {
            lenis.stop();
            return;
          }

          lenis.start();
        };

        syncScrollState();

        const bodyObserver = new MutationObserver(syncScrollState);
        bodyObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ["class"],
        });

        return lenis;
      })
      .catch(() => null);
  }

  function nextFrame(callback) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
  }

  function splitWords(element) {
    if (element.dataset.wordsSplit === "true" || element.querySelector(".reveal-word")) {
      element.dataset.wordsSplit = "true";
      return;
    }

    const nodes = Array.from(element.childNodes);

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        parts.forEach((part) => {
          if (!part) return;

          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }

          const span = document.createElement("span");
          span.className = "reveal-word";
          span.textContent = part;
          fragment.appendChild(span);
        });

        element.replaceChild(fragment, node);
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        splitWords(node);
      }
    });

    element.dataset.wordsSplit = "true";
  }

  function setRevealDelay(element, delayMs) {
    element.style.setProperty("--reveal-delay", `${delayMs}ms`);
  }

  function revealWords(element, options) {
    const baseDelay = Number(options.baseDelay) || 0;
    const stagger = Number(options.stagger) || 45;
    const words = element.querySelectorAll(".reveal-word");

    words.forEach((word, index) => {
      setRevealDelay(word, baseDelay + index * stagger);
    });

    nextFrame(() => {
      words.forEach((word) => {
        word.classList.add("is-visible");
      });
    });
  }

  function triggerNestedWordReveals(container, delay) {
    container.querySelectorAll("[data-reveal-words]:not([data-reveal-words='hero'])").forEach((element) => {
      revealWordsOnElement(element, delay);
    });
  }

  function revealWordsOnElement(element, extraDelay) {
    if (!element.hasAttribute("data-reveal-words") || element.dataset.revealWords === "hero") {
      return;
    }

    splitWords(element);

    revealWords(element, {
      baseDelay: extraDelay + (Number(element.dataset.revealWordsBaseDelay) || 0),
      stagger: 40,
    });
  }

  function revealElement(element) {
    const delay = Number(element.dataset.revealDelay) || 0;
    setRevealDelay(element, delay);

    nextFrame(() => {
      element.classList.add("is-visible");
      revealWordsOnElement(element, 0);
      triggerNestedWordReveals(element, 0);
    });
  }

  function revealStaggeredChildren(children, baseDelay, stagger) {
    children.forEach((child, index) => {
      setRevealDelay(child, baseDelay + index * stagger);
    });

    nextFrame(() => {
      children.forEach((child) => {
        child.classList.add("is-visible");
        revealWordsOnElement(child, 0);
        triggerNestedWordReveals(child, 0);
      });
    });
  }

  function initScrollWordSplits() {
    document.querySelectorAll("[data-reveal-words]:not([data-reveal-words='hero'])").forEach((element) => {
      splitWords(element);
    });
  }

  function initHeroAnimations() {
    document.querySelectorAll(".reveal--hero").forEach(revealElement);

    document.querySelectorAll("[data-reveal-words='hero']").forEach((element) => {
      splitWords(element);
      revealWords(element, {
        baseDelay: Number(element.dataset.revealWordsBaseDelay) || 150,
        stagger: 50,
      });
    });
  }

  const observerOptions = {
    threshold: 0.08,
    rootMargin: "0px 0px -4% 0px",
  };

  function initStaggerGroups() {
    const groups = document.querySelectorAll("[data-reveal-stagger]");

    groups.forEach((group) => {
      const stagger = Number(group.dataset.revealStagger) || 80;
      const baseDelay = Number(group.dataset.revealStaggerBase) || 0;
      const children = Array.from(group.children);

      children.forEach((child) => {
        child.classList.add("reveal");
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          revealStaggeredChildren(children, baseDelay, stagger);
          observer.unobserve(entry.target);
        });
      }, observerOptions);

      observer.observe(group);
    });
  }

  function initScrollReveals() {
    const revealItems = document.querySelectorAll(".reveal:not(.reveal--hero)");

    if (!revealItems.length) return;

    const observed = new Set();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || observed.has(entry.target)) return;
        observed.add(entry.target);
        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, observerOptions);

    revealItems.forEach((item) => {
      if (item.closest("[data-reveal-stagger]")) return;
      observer.observe(item);
    });
  }

  let revealInitialized = false;

  function initRevealAnimations() {
    if (revealInitialized) return;
    revealInitialized = true;

    if (prefersReducedMotion) {
      document.querySelectorAll(".reveal, [data-reveal-words]").forEach((el) => {
        el.classList.add("is-visible");
      });
      document.querySelectorAll(".reveal-word").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    initScrollWordSplits();
    initHeroAnimations();
    initStaggerGroups();
    initScrollReveals();
  }

  initSmoothScroll();
  initRevealAnimations();
})();
