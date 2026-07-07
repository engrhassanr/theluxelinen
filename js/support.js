(function () {
  const accordion = document.querySelector("[data-support-accordion]");

  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll(".faq-item"));

  function setOpen(item, open) {
    const toggle = item.querySelector(".faq-item__toggle");
    const panel = item.querySelector(".faq-item__answer-wrap");

    item.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
  }

  items.forEach(function (entry) {
    const panel = entry.querySelector(".faq-item__answer-wrap");
    const isOpen = entry.classList.contains("is-open");
    if (panel) {
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  });

  accordion.addEventListener("click", function (event) {
    const toggle = event.target.closest(".faq-item__toggle");
    if (!toggle) return;

    const item = toggle.closest(".faq-item");
    const isOpen = item.classList.contains("is-open");

    items.forEach(function (entry) {
      setOpen(entry, entry === item ? !isOpen : false);
    });
  });
})();
