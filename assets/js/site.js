(function () {
  const body = document.body;
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const menuLinks = mobileNav
    ? mobileNav.querySelectorAll("a, button")
    : [];

  const closeMenu = function () {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
  };

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      const nextState = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(nextState));
      mobileNav.classList.toggle("is-open", nextState);
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  const modal = document.querySelector("[data-contact-modal]");
  const openTriggers = document.querySelectorAll("[data-open-contact-modal]");
  const closeTriggers = modal
    ? modal.querySelectorAll("[data-close-contact-modal]")
    : [];
  const modalPanel = modal ? modal.querySelector("[data-modal-panel]") : null;
  const focusTarget = modal ? modal.querySelector("input, textarea") : null;
  let lastActiveElement = null;

  const closeModal = function () {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  };

  const openModal = function (event) {
    if (event) event.preventDefault();
    if (!modal) return;
    lastActiveElement = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    window.setTimeout(function () {
      if (focusTarget) focusTarget.focus();
    }, 30);
  };

  openTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", openModal);
  });

  closeTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  if (modalPanel) {
    modalPanel.addEventListener("click", function (event) {
      event.stopPropagation();
    });
  }

  if (modal) {
    modal.addEventListener("click", function (event) {
      const backdrop = event.target.closest("[data-close-contact-modal]");
      if (backdrop) {
        closeModal();
      }
    });
  }

  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const sections = Array.from(document.querySelectorAll("[data-section]"));

  if ("IntersectionObserver" in window && navLinks.length && sections.length) {
    const lookup = new Map();
    navLinks.forEach(function (link) {
      const target = link.getAttribute("href");
      if (target && target.startsWith("#")) {
        lookup.set(target.slice(1), link);
      }
    });

    const setActive = function (id) {
      navLinks.forEach(function (link) {
        const target = link.getAttribute("href");
        const matches = target === "#" + id || (id === "unternehmen" && target === "#");
        link.classList.toggle("is-active", Boolean(matches));
      });
    };

    const observer = new IntersectionObserver(
      function (entries) {
        const visible = entries
          .filter(function (entry) {
            return entry.isIntersecting;
          })
          .sort(function (a, b) {
            return b.intersectionRatio - a.intersectionRatio;
          })[0];

        if (visible) {
          setActive(visible.target.id);
        }
      },
      {
        rootMargin: "-38% 0px -45% 0px",
        threshold: [0.15, 0.35, 0.65]
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const submitButton = form.querySelector("[data-contact-submit]");
    const status = form.querySelector("[data-form-status]");
    const defaultLabel = submitButton ? submitButton.textContent : "";

    const setStatus = function (state, message) {
      if (!status) return;
      status.dataset.state = state || "";
      status.textContent = message || "";
    };

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!submitButton) return;

      const formData = new FormData(form);
      const payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        website: String(formData.get("website") || "").trim()
      };

      submitButton.disabled = true;
      submitButton.textContent = "Wird gesendet...";
      setStatus("loading", "Ihre Anfrage wird gerade verschickt.");

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error(result.error || "Die Nachricht konnte nicht gesendet werden.");
        }

        form.reset();
        setStatus(
          "success",
          "Danke. Ihre Anfrage ist eingegangen. Wir melden uns zeitnah per E-Mail zurück."
        );

        window.setTimeout(function () {
          if (modal && modal.classList.contains("is-open")) {
            closeModal();
          }
        }, 1100);
      } catch (error) {
        setStatus(
          "error",
          error instanceof Error
            ? error.message
            : "Die Nachricht konnte nicht gesendet werden."
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    });
  }
})();
