(function () {
  const gallery = document.querySelector("[data-product-zoom]");
  const image = gallery?.querySelector(".product-detail__image");
  const zoomTarget = gallery?.querySelector(".product-detail__main-inner") || gallery;

  if (gallery && image && zoomTarget) {
    gallery.addEventListener("mouseenter", () => {
      gallery.classList.add("is-zooming");
    });

    gallery.addEventListener("mouseleave", () => {
      gallery.classList.remove("is-zooming");
      image.style.transformOrigin = "center center";
    });

    zoomTarget.addEventListener("mousemove", (event) => {
      const rect = zoomTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      image.style.transformOrigin = `${x}% ${y}%`;
    });
  }

  document.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-gallery-thumb]").forEach((item) => {
        item.classList.remove("product-detail__thumb--active");
      });
      button.classList.add("product-detail__thumb--active");

      if (image && button.dataset.image) {
        image.src = button.dataset.image;
      }
    });
  });

  document.querySelectorAll("[data-variant]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-variant]").forEach((item) => {
        item.classList.remove("product-detail__variant--active");
      });
      button.classList.add("product-detail__variant--active");
    });
  });
})();
