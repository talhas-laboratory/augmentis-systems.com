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

function normalizeRecipientEmail(value) {
  const fallback = "kontakt@augmentis-systems.com";
  const normalized = normalizeField(value) || fallback;
  if (normalized.toLowerCase() === "kontakt@augmentis-systems.de") {
    return fallback;
  }
  return normalized;
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
  const toEmail = normalizeRecipientEmail(process.env.CONTACT_TO_EMAIL);
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "no-reply@augmentis-systems.com";
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

  const submittedAt = new Date().toISOString();
  const text = [
    "NEUE KONTAKTANFRAGE",
    "===================",
    "",
    "KONTAKT",
    `- Name: ${name}`,
    `- E-Mail: ${email}`,
    `- Unternehmen: ${company}`,
    "",
    "METADATEN",
    `- Empfänger: ${toEmail}`,
    `- Website: ${siteUrl}`,
    `- Eingegangen (UTC): ${submittedAt}`,
    "",
    "Nachricht:",
    message,
    ""
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
        <div style="font-family: Inter, Arial, sans-serif; color: #14171f; line-height: 1.5; max-width: 680px;">
          <h1 style="font-size: 20px; margin: 0 0 14px 0;">Neue Kontaktanfrage</h1>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 18px 0;">
            <tbody>
              <tr>
                <td style="width: 170px; padding: 8px 10px; background: #f4f6fb; border: 1px solid #dce2f2;"><strong>Name</strong></td>
                <td style="padding: 8px 10px; border: 1px solid #dce2f2;">${safeName}</td>
              </tr>
              <tr>
                <td style="width: 170px; padding: 8px 10px; background: #f4f6fb; border: 1px solid #dce2f2;"><strong>E-Mail</strong></td>
                <td style="padding: 8px 10px; border: 1px solid #dce2f2;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="width: 170px; padding: 8px 10px; background: #f4f6fb; border: 1px solid #dce2f2;"><strong>Unternehmen</strong></td>
                <td style="padding: 8px 10px; border: 1px solid #dce2f2;">${safeCompany}</td>
              </tr>
              <tr>
                <td style="width: 170px; padding: 8px 10px; background: #f4f6fb; border: 1px solid #dce2f2;"><strong>Eingegangen</strong></td>
                <td style="padding: 8px 10px; border: 1px solid #dce2f2;">${escapeHtml(submittedAt)} (UTC)</td>
              </tr>
            </tbody>
          </table>
          <h2 style="font-size: 16px; margin: 0 0 8px 0;">Nachricht</h2>
          <div style="padding: 12px 14px; border: 1px solid #dce2f2; background: #fbfcff; border-radius: 8px;">${safeMessage}</div>
          <p style="margin-top: 20px; color: #697182; font-size: 13px;">Gesendet über ${escapeHtml(siteUrl)}</p>
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
