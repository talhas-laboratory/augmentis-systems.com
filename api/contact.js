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
  const fallback = "talha@augmentis-systems.com";
  const normalized = normalizeField(value) || fallback;
  if (normalized.toLowerCase() === "kontakt@augmentis-systems.de") {
    return fallback;
  }
  return normalized;
}

function normalizeTrackingFields(value) {
  const source = value && typeof value === "object" ? value : {};
  const tracking = {
    pageVariant: normalizeField(source.pageVariant),
    landingPath: normalizeField(source.landingPath),
    referrer: normalizeField(source.referrer),
    utmSource: normalizeField(source.utmSource),
    utmMedium: normalizeField(source.utmMedium),
    utmCampaign: normalizeField(source.utmCampaign),
    utmContent: normalizeField(source.utmContent),
    utmTerm: normalizeField(source.utmTerm),
    gclid: normalizeField(source.gclid),
    fbclid: normalizeField(source.fbclid),
    msclkid: normalizeField(source.msclkid)
  };

  return Object.fromEntries(
    Object.entries(tracking).filter(function (entry) {
      return Boolean(entry[1]);
    })
  );
}

function resolveLandingUrl(siteUrl, landingPath) {
  if (!landingPath) return "";

  try {
    return new URL(landingPath, siteUrl).toString();
  } catch (_error) {
    return landingPath;
  }
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
  const tracking = normalizeTrackingFields(body.tracking);

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

  const subject = `Neue Kontaktanfrage: ${name} · ${company}`;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCompany = escapeHtml(company);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const landingUrl = resolveLandingUrl(siteUrl, tracking.landingPath);

  const submittedAt = new Date().toISOString();
  const submittedAtLocal = new Date(submittedAt).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin"
  });
  const trackingEntries = [
    ["Seitenvariante", tracking.pageVariant],
    ["Landingpage", landingUrl || tracking.landingPath],
    ["Referrer", tracking.referrer],
    ["utm_source", tracking.utmSource],
    ["utm_medium", tracking.utmMedium],
    ["utm_campaign", tracking.utmCampaign],
    ["utm_content", tracking.utmContent],
    ["utm_term", tracking.utmTerm],
    ["gclid", tracking.gclid],
    ["fbclid", tracking.fbclid],
    ["msclkid", tracking.msclkid]
  ].filter(function (entry) {
    return Boolean(entry[1]);
  });
  const text = [
    "NEUE KONTAKTANFRAGE",
    "====================",
    "",
    "ABSENDER",
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Unternehmen: ${company}`,
    "",
    "METADATEN",
    `Empfänger: ${toEmail}`,
    `Website: ${siteUrl}`,
    `Eingegangen (Berlin): ${submittedAtLocal}`,
    `Eingegangen (UTC): ${submittedAt}`,
    ...(trackingEntries.length
      ? ["", "ATTRIBUTION"].concat(
          trackingEntries.map(function (entry) {
            return `${entry[0]}: ${entry[1]}`;
          })
        )
      : []),
    "",
    "NACHRICHT",
    "---------",
    message,
    ""
  ].join("\n");
  const trackingRows = trackingEntries
    .map(function (entry) {
      return `
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; border-top: none; font-weight: 700;">${escapeHtml(entry[0])}</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none; border-top: none;">${escapeHtml(entry[1])}</td>
                  </tr>
      `;
    })
    .join("");

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
        <div style="font-family: Inter, Arial, sans-serif; color: #14171f; line-height: 1.5; max-width: 720px; margin: 0 auto; background: #f7f8fb; padding: 24px;">
          <div style="background: linear-gradient(145deg, #001e73 0%, #002fa7 100%); color: #ffffff; border-radius: 14px 14px 0 0; padding: 18px 22px;">
            <div style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.82; margin-bottom: 6px;">Augmentis Systems</div>
            <h1 style="font-size: 24px; line-height: 1.2; margin: 0;">Neue Kontaktanfrage</h1>
          </div>

          <div style="background: #ffffff; border: 1px solid #dce2f2; border-top: none; border-radius: 0 0 14px 14px; overflow: hidden;">
            <div style="padding: 22px;">
              <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 0 0 20px 0;">
                <tbody>
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; font-weight: 700;">Name</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; border-top: none; font-weight: 700;">E-Mail</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none; border-top: none;">
                      <a href="mailto:${safeEmail}" style="color: #002fa7; text-decoration: none;">${safeEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; border-top: none; font-weight: 700;">Unternehmen</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none; border-top: none;">${safeCompany}</td>
                  </tr>
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; border-top: none; font-weight: 700;">Eingegangen</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none; border-top: none;">${escapeHtml(submittedAtLocal)} Uhr (Berlin)<br /><span style="color: #697182; font-size: 12px;">${escapeHtml(submittedAt)} UTC</span></td>
                  </tr>
                  <tr>
                    <td style="width: 170px; padding: 10px 12px; background: #f4f6fb; border: 1px solid #dce2f2; border-top: none; font-weight: 700;">Website</td>
                    <td style="padding: 10px 12px; border: 1px solid #dce2f2; border-left: none; border-top: none;">
                      <a href="${escapeHtml(siteUrl)}" style="color: #002fa7; text-decoration: none;">${escapeHtml(siteUrl)}</a>
                    </td>
                  </tr>
                  ${trackingRows}
                </tbody>
              </table>

              <div style="margin: 0 0 8px 0; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #697182; font-weight: 700;">Nachricht</div>
              <div style="padding: 16px 18px; border: 1px solid #dce2f2; background: #fbfcff; border-radius: 10px; white-space: normal;">${safeMessage}</div>
            </div>
          </div>
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
