(function () {
  const QUERY_FIELD_MAP = [
    ["utm_source", "utmSource"],
    ["utm_medium", "utmMedium"],
    ["utm_campaign", "utmCampaign"],
    ["utm_content", "utmContent"],
    ["utm_term", "utmTerm"],
    ["gclid", "gclid"],
    ["fbclid", "fbclid"],
    ["msclkid", "msclkid"]
  ];
  const CONSENT_STORAGE_KEY = "augmentis-analytics-consent";
  const CONSENT_VALUES = {
    accepted: "accepted",
    rejected: "rejected"
  };
  const PLAUSIBLE_SCRIPT_ID = "augmentis-plausible-script";
  let consentBanner = null;

  function normalize(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function canUseStorage() {
    try {
      const key = "__augmentis_test__";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function readConsent() {
    if (!canUseStorage()) return "";
    return normalize(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  }

  function writeConsent(value) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  }

  function getPageVariant() {
    const path = window.location.pathname;

    if (path === "/mobile.html" || path.endsWith("/mobile.html")) return "mobile";
    if (path === "/impressum.html" || path.endsWith("/impressum.html")) return "impressum";
    if (path === "/datenschutz.html" || path.endsWith("/datenschutz.html")) return "datenschutz";
    if (path === "/404.html" || path.endsWith("/404.html")) return "404";

    return "desktop";
  }

  function getExternalReferrer() {
    const referrer = normalize(document.referrer);
    if (!referrer) return "";

    try {
      const url = new URL(referrer);
      if (url.origin === window.location.origin) return "";
      return url.origin + url.pathname;
    } catch (_error) {
      return referrer;
    }
  }

  function getAttribution() {
    const params = new URLSearchParams(window.location.search);
    const attribution = {
      pageVariant: getPageVariant(),
      landingPath: window.location.pathname + window.location.search
    };

    const referrer = getExternalReferrer();
    if (referrer) {
      attribution.referrer = referrer;
    }

    QUERY_FIELD_MAP.forEach(function (entry) {
      const queryField = entry[0];
      const payloadField = entry[1];
      const value = normalize(params.get(queryField));

      if (value) {
        attribution[payloadField] = value;
      }
    });

    return attribution;
  }

  function ensurePlausibleStub() {
    if (typeof window.plausible === "function") return;

    window.plausible = function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  }

  function loadPlausibleScript() {
    if (document.getElementById(PLAUSIBLE_SCRIPT_ID)) return;

    ensurePlausibleStub();

    const script = document.createElement("script");
    script.id = PLAUSIBLE_SCRIPT_ID;
    script.defer = true;
    script.dataset.domain = "augmentis-systems.com";
    script.src = "https://plausible.io/js/script.js";
    document.head.appendChild(script);
  }

  function buildEventProps(props) {
    const eventProps = {
      page_variant: getPageVariant()
    };

    Object.keys(props || {}).forEach(function (key) {
      const value = props[key];
      if (value === undefined || value === null || value === "") return;
      eventProps[key] = String(value);
    });

    return eventProps;
  }

  function track(eventName, props) {
    if (!eventName || readConsent() !== CONSENT_VALUES.accepted) return;
    if (typeof window.plausible !== "function") return;

    window.plausible(eventName, {
      props: buildEventProps(props)
    });
  }

  function removeConsentBanner() {
    if (!consentBanner) return;
    consentBanner.remove();
    consentBanner = null;
  }

  function setConsent(value) {
    writeConsent(value);

    if (value === CONSENT_VALUES.accepted) {
      loadPlausibleScript();
    }

    removeConsentBanner();
  }

  function buildConsentBanner() {
    const wrapper = document.createElement("aside");
    wrapper.className = "consent-banner";
    wrapper.setAttribute("aria-live", "polite");
    wrapper.setAttribute("aria-label", "Cookie- und Analyse-Einstellungen");

    wrapper.innerHTML = [
      '<div class="consent-banner__panel">',
      '  <div class="consent-banner__content">',
      '    <div class="consent-banner__eyebrow">Datenschutz</div>',
      '    <h2 class="consent-banner__title">Analyse erlauben?</h2>',
      '    <p class="consent-banner__copy">Wir nutzen Plausible Analytics nur mit Ihrer Zustimmung, um Seitenaufrufe und Kontakt-Conversion in aggregierter Form zu verstehen. Details stehen im <a href="/datenschutz.html">Datenschutz</a>.</p>',
      '    <div class="consent-banner__actions">',
      '      <button class="consent-banner__button consent-banner__button--ghost" type="button" data-consent-action="reject">Ablehnen</button>',
      '      <button class="consent-banner__button consent-banner__button--primary" type="button" data-consent-action="accept">Analyse erlauben</button>',
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    wrapper.addEventListener("click", function (event) {
      const trigger = event.target.closest("[data-consent-action]");
      if (!trigger) return;

      const action = trigger.getAttribute("data-consent-action");
      if (action === "accept") {
        setConsent(CONSENT_VALUES.accepted);
      } else if (action === "reject") {
        setConsent(CONSENT_VALUES.rejected);
      }
    });

    return wrapper;
  }

  function mountConsentBanner() {
    if (readConsent()) return;
    if (consentBanner) return;
    if (!document.body) return;

    consentBanner = buildConsentBanner();
    document.body.appendChild(consentBanner);
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("[data-track-event]");
    if (!target) return;

    track(target.getAttribute("data-track-event"), {
      placement: normalize(target.getAttribute("data-track-placement")),
      label: normalize(target.getAttribute("data-track-label"))
    });
  });

  function init() {
    if (readConsent() === CONSENT_VALUES.accepted) {
      loadPlausibleScript();
      return;
    }

    mountConsentBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.AugmentisAnalytics = {
    getAttribution,
    getPageVariant,
    track,
    readConsent,
    setConsent
  };
})();
