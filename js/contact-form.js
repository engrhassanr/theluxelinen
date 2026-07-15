(function () {
  const ENDPOINT = "/api/contact.php";
  const SITE_KEY = "6LfbUVUtAAAAAI-k2fLy9VatJIsDNG6Dc8EmrSzD";
  const RECAPTCHA_ENABLED = true;

  function getCaptchaToken(form) {
    if (!RECAPTCHA_ENABLED) return "disabled";
    const responseField = form.querySelector("[name='g-recaptcha-response']");
    if (responseField && responseField.value) {
      return responseField.value;
    }
    if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
      const widget = form.querySelector(".g-recaptcha");
      if (widget && widget.dataset.widgetId != null) {
        return window.grecaptcha.getResponse(Number(widget.dataset.widgetId));
      }
      return window.grecaptcha.getResponse();
    }
    return "";
  }

  function resetCaptcha(form) {
    if (!RECAPTCHA_ENABLED) return;
    if (!window.grecaptcha || typeof window.grecaptcha.reset !== "function") return;
    const widget = form.querySelector(".g-recaptcha");
    if (widget && widget.dataset.widgetId != null) {
      window.grecaptcha.reset(Number(widget.dataset.widgetId));
    } else {
      window.grecaptcha.reset();
    }
  }

  function showStatus(status, text, kind) {
    if (!status) return;
    status.hidden = false;
    status.textContent = text;
    status.classList.remove("is-error", "is-success");
    if (kind) status.classList.add(kind);
  }

  async function submitForm(form) {
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector('[type="submit"]');
    const type = form.dataset.formType || "enquiry";
    const captcha = getCaptchaToken(form);

    if (RECAPTCHA_ENABLED && type !== "newsletter" && !captcha) {
      showStatus(status, "Please complete the reCAPTCHA check.", "is-error");
      return;
    }

    const payload = { type };
    if (RECAPTCHA_ENABLED && captcha && captcha !== "disabled") {
      payload["g-recaptcha-response"] = captcha;
    }
    new FormData(form).forEach((value, key) => {
      if (key === "g-recaptcha-response") return;
      payload[key] = typeof value === "string" ? value.trim() : value;
    });

    showStatus(status, "Sending…");
    if (submit) submit.disabled = true;

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      let data = {};
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text();
        // Hosting not serving PHP (e.g. Shopify / static only)
        if (res.status === 404 || text.includes("Shopify") || text.includes("Something went wrong")) {
          throw new Error(
            "Mail API not reachable. Upload the /api folder to Hostinger PHP hosting (not Shopify)."
          );
        }
        throw new Error("Server returned a non-JSON response (" + res.status + "). Check /api/contact.php is live on Hostinger.");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      showStatus(status, data.message || "Sent — thank you.", "is-success");
      form.reset();
      resetCaptcha(form);
    } catch (err) {
      const msg =
        err && err.message
          ? err.message
          : "Could not send. Please email info@theluxelinen.ie.";
      showStatus(status, msg, "is-error");
      resetCaptcha(form);
      console.error("[contact-form]", err);
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  function renderWidgets() {
    if (!RECAPTCHA_ENABLED) return;
    if (!window.grecaptcha || typeof window.grecaptcha.render !== "function") return;
    document.querySelectorAll(".g-recaptcha").forEach((el) => {
      if (el.dataset.widgetId != null) return;
      const id = window.grecaptcha.render(el, {
        sitekey: el.dataset.sitekey || SITE_KEY,
        theme: el.dataset.theme || "light",
      });
      el.dataset.widgetId = String(id);
    });
  }

  window.__luxeRecaptchaOnload = function () {
    renderWidgets();
  };

  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      submitForm(form);
    });
  });

  if (RECAPTCHA_ENABLED) {
    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidgets();
    }
  } else {
    document.querySelectorAll(".g-recaptcha").forEach((el) => {
      el.hidden = true;
    });
  }
})();
