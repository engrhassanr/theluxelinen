(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    document.querySelectorAll(".reveal, [data-reveal-words]").forEach((el) => {
      el.classList.add("is-visible");
    });
    document.querySelectorAll(".reveal-word").forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }

  function splitWords(element) {
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
  }

  function revealWords(element, options) {
    const baseDelay = Number(options.baseDelay) || 0;
    const stagger = Number(options.stagger) || 45;
    const words = element.querySelectorAll(".reveal-word");

    words.forEach((word, index) => {
      word.style.setProperty("--reveal-delay", `${baseDelay + index * stagger}ms`);
      window.setTimeout(() => {
        word.classList.add("is-visible");
      }, baseDelay + index * stagger);
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

    if (!element.dataset.wordsSplit) {
      splitWords(element);
      element.dataset.wordsSplit = "true";
    }

    revealWords(element, {
      baseDelay: extraDelay + (Number(element.dataset.revealWordsBaseDelay) || 0),
      stagger: 40,
    });
  }

  function revealElement(element) {
    const delay = Number(element.dataset.revealDelay) || 0;

    window.setTimeout(() => {
      element.classList.add("is-visible");
      revealWordsOnElement(element, 0);
      triggerNestedWordReveals(element, 0);
    }, delay);
  }

  function initScrollWordSplits() {
    document.querySelectorAll("[data-reveal-words]:not([data-reveal-words='hero'])").forEach((element) => {
      if (element.dataset.wordsSplit) return;
      splitWords(element);
      element.dataset.wordsSplit = "true";
    });
  }

  function initHeroAnimations() {
    document.querySelectorAll(".reveal--hero").forEach(revealElement);

    document.querySelectorAll("[data-reveal-words='hero']").forEach((element) => {
      splitWords(element);
      element.dataset.wordsSplit = "true";
      revealWords(element, {
        baseDelay: Number(element.dataset.revealWordsBaseDelay) || 150,
        stagger: 50,
      });
    });
  }

  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -8% 0px",
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

          children.forEach((child, index) => {
            child.dataset.revealDelay = String(baseDelay + index * stagger);
            revealElement(child);
          });

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

  initScrollWordSplits();
  initHeroAnimations();
  initStaggerGroups();
  initScrollReveals();
})();
