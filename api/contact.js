const RESEND_ENDPOINT = "https://api.resend.com/emails";

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
}

function normalizeField(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Nur POST-Anfragen sind erlaubt." });
  }

  const body = await readRequestBody(req);
  const name = normalizeField(body.name);
  const email = normalizeField(body.email);
  const company = normalizeField(body.company);
  const message = normalizeField(body.message);
  const website = normalizeField(body.website);

  if (website) {
    return json(res, 200, { ok: true });
  }

  if (!name || !email || !company || !message) {
    return json(res, 400, { error: "Bitte füllen Sie alle Pflichtfelder aus." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return json(res, 400, { error: "Bitte geben Sie eine gültige E-Mail-Adresse an." });
  }

  if (message.length < 20) {
    return json(res, 400, {
      error: "Bitte beschreiben Sie Ihr Anliegen in ein bis zwei Sätzen."
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "kontakt@augmentis-systems.com";
  const fromEmail =
    process.env.CONTACT_FROM_EMAIL || "no-reply@augmentis-systems.com";
  const siteUrl = process.env.SITE_URL || "https://augmentis-systems.com";

  if (!apiKey) {
    return json(res, 500, {
      error: "Der Kontaktservice ist aktuell nicht konfiguriert."
    });
  }

  const subject = `Neue Anfrage über augmentis-systems.com von ${name}`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  const text = [
    "Neue Kontaktanfrage über augmentis-systems.com",
    "",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Unternehmen: ${company}`,
    "",
    "Nachricht:",
    message,
    "",
    `Website: ${siteUrl}`
  ].join("\n");

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject,
      text,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #14171f; line-height: 1.5;">
          <h1 style="font-size: 20px; margin-bottom: 16px;">Neue Kontaktanfrage</h1>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>E-Mail:</strong> ${safeEmail}</p>
          <p><strong>Unternehmen:</strong> ${safeCompany}</p>
          <p><strong>Nachricht:</strong><br />${safeMessage}</p>
          <p style="margin-top: 24px; color: #697182;">Gesendet über ${escapeHtml(siteUrl)}</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend error:", details);
    return json(res, 502, {
      error: "Die Nachricht konnte gerade nicht zugestellt werden. Bitte versuchen Sie es erneut."
    });
  }

  return json(res, 200, { ok: true });
};
