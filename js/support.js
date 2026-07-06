(function () {
  const accordion = document.querySelector("[data-support-accordion]");

  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll(".faq-item"));

  function setOpen(item, open) {
    const toggle = item.querySelector(".faq-item__toggle");
    const panel = item.querySelector(".faq-item__answer-wrap");
    const icon = toggle.querySelector(".faq-item__toggle-icon svg");

    item.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;

    if (icon) {
      icon.innerHTML = open
        ? '<path d="M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
        : '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    }
  }

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
