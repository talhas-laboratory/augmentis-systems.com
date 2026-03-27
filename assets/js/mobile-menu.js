(function () {
  const button = document.getElementById("mobile-nav-button");
  const panel = document.getElementById("mobile-nav-panel");

  if (!button || !panel) return;

  const closeMenu = function () {
    panel.classList.add("hidden");
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", function () {
    const nextState = panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !nextState);
    button.setAttribute("aria-expanded", String(nextState));
  });

  panel.querySelectorAll("a, button").forEach(function (item) {
    item.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", function (event) {
    if (!panel.contains(event.target) && !button.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
})();
