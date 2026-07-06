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
      if (!element.dataset.wordsSplit) {
        splitWords(element);
        element.dataset.wordsSplit = "true";
      }

      revealWords(element, {
        baseDelay: delay + (Number(element.dataset.revealWordsBaseDelay) || 0),
        stagger: 40,
      });
    });
  }

  function revealElement(element) {
    const delay = Number(element.dataset.revealDelay) || 0;

    window.setTimeout(() => {
      element.classList.add("is-visible");
      triggerNestedWordReveals(element, 0);
    }, delay);
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

  function initScrollReveals() {
    const revealItems = document.querySelectorAll(".reveal:not(.reveal--hero)");

    if (!revealItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  initHeroAnimations();
  initScrollReveals();
})();
