(function () {
  const openButton = document.getElementById("mobile-nav-button");
  const panel = document.getElementById("mobile-nav-panel");
  const backdrop = document.getElementById("mobile-nav-backdrop");

  if (!openButton || !panel) return;

  const setMenuState = function (isOpen) {
    const state = isOpen ? "open" : "closed";
    panel.setAttribute("data-state", state);
    if (backdrop) backdrop.setAttribute("data-state", state);
    openButton.setAttribute("aria-expanded", String(isOpen));
    openButton.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");

    if (isOpen) {
      document.body.classList.add("modal-open");
      document.body.classList.add("mobile-nav-open");
    } else {
      document.body.classList.remove("modal-open");
      document.body.classList.remove("mobile-nav-open");
    }
  };

  openButton.addEventListener("click", function () {
    const isClosed = panel.getAttribute("data-state") !== "open";
    setMenuState(isClosed);
  });

  if (backdrop) {
    backdrop.addEventListener("click", function () {
      setMenuState(false);
    });
  }

  panel.querySelectorAll("a, button[data-open-contact-modal], #mobile-menu-close").forEach(function (item) {
    item.addEventListener("click", function () {
      setMenuState(false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel.getAttribute("data-state") === "open") {
      setMenuState(false);
    }
  });
})();
