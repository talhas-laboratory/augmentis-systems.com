(function () {
  const forms = document.querySelectorAll("[data-contact-form]");

  forms.forEach(function (form) {
    const submitButton = form.querySelector("[data-contact-submit]");
    const status = form.querySelector("[data-form-status]");
    const initialLabel = submitButton ? submitButton.textContent : "";

    if (!submitButton || !status) return;

    const setStatus = function (message, color) {
      status.textContent = message || "";
      status.style.color = color || "";
    };

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

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
      setStatus("Ihre Anfrage wird gerade gesendet.", "#7A4A12");

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
        setStatus("Danke. Ihre Anfrage ist eingegangen. Wir melden uns zeitnah per E-Mail.", "#14532D");
      } catch (error) {
        setStatus(
          error instanceof Error ? error.message : "Die Nachricht konnte nicht gesendet werden.",
          "#7A1F1F"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = initialLabel;
      }
    });
  });
})();
