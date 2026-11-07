(() => {
  // Website only: never load Analytics in the desktop app, previews, or the old mirror.
  if (location.hostname !== "resumate.sevihcra.com") return;
  const id = "G-1B821WM92Y";
  const key = "resumate-analytics-consent-v1";
  const english = document.documentElement.lang === "en";
  let consent = null;
  let started = false;
  try { consent = localStorage.getItem(key); } catch { /* A choice still works for this page. */ }

  function start() {
    window[`ga-disable-${id}`] = false;
    if (started) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", id, {
      cookie_domain: location.hostname,
      cookie_expires: 60 * 60 * 24 * 60,
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Do not forward arbitrary query strings, fragments, or referrer paths.
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer ? new URL(document.referrer).origin : "",
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.append(script);
  }

  function choose(value) {
    consent = value;
    try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ }
    banner.hidden = true;
    if (value === "granted") {
      start();
    } else {
      window[`ga-disable-${id}`] = true;
      // These cookies are scoped to this subdomain, so blog preferences stay separate.
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (name === "_ga" || name === `_ga_${id.slice(2)}`) {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}; SameSite=Lax; Secure`;
          document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure`;
        }
      }
    }
  }

  const banner = document.createElement("section");
  banner.className = "analytics-choice";
  banner.dataset.analyticsBanner = "";
  banner.setAttribute("aria-label", english ? "Optional website analytics" : "선택적 방문 분석");
  banner.hidden = consent === "granted" || consent === "denied";
  const policy = "privacy.html#website-analytics";
  banner.innerHTML = english
    ? `<div><strong>Help improve this website?</strong><p>With your consent, Google Analytics measures visits and download clicks using cookies. Data is processed overseas. Refusing does not affect downloads. <a href="${policy}">Data, retention &amp; overseas processing</a></p></div><div class="analytics-actions"><button type="button" data-analytics-choice="denied">Decline</button><button type="button" data-analytics-choice="granted">Allow analytics</button></div>`
    : `<div><strong>사이트 개선을 위한 방문 분석에 동의하시나요?</strong><p>동의하면 Google Analytics 쿠키로 방문과 다운로드 클릭을 측정하며, 정보가 국외에서 처리됩니다. 거절해도 다운로드는 그대로 이용할 수 있어요. <a href="${policy}">수집 항목·보관 기간·국외 처리 안내</a></p></div><div class="analytics-actions"><button type="button" data-analytics-choice="denied">거절</button><button type="button" data-analytics-choice="granted">분석 허용</button></div>`;
  banner.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => choose(button.dataset.analyticsChoice)));
  document.body.append(banner);

  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "analytics-settings";
  settings.dataset.analyticsSettings = "";
  settings.textContent = english ? "Analytics preferences" : "방문 분석 설정";
  settings.addEventListener("click", () => {
    banner.hidden = false;
    banner.querySelector("button").focus();
  });
  (document.querySelector("footer nav") || document.body).append(settings);

  document.addEventListener("click", (event) => {
    if (consent !== "granted" || !started) return;
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === "/install.html") {
      window.gtag("event", "download_intent");
    } else if (link.matches("[data-download]") && ["mac", "windows"].includes(link.dataset.downloadPlatform)) {
      window.gtag("event", "file_download", { platform: link.dataset.downloadPlatform });
    }
  });
  if (consent === "granted") start();
})();
