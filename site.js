import { validInstaller, RELEASES_URL } from "./release-data.js";

const install = document.querySelector(".install-layout");
const query = new URLSearchParams(location.search);
const detected = /Windows/i.test(navigator.userAgentData?.platform ?? navigator.platform) ? "windows" : "mac";
let os = ["mac", "windows"].includes(query.get("os")) ? query.get("os") : detected;
let step = 0;
let release = null;
const select = (selector) => document.querySelectorAll(selector);
const label = () => os === "mac" ? "macOS" : "Windows";

function renderRelease() {
  if (!install) return;
  const asset = release?.platforms?.[os];
  const available = validInstaller(asset, os);
  const link = document.querySelector("[data-download]");
  link.href = available ? asset.url : RELEASES_URL;
  link.textContent = available ? `${label()} 다운로드 ↓` : "공개 릴리스 확인하기 ↗";
  document.querySelector("[data-platform-name]").textContent = label();
  document.querySelector("[data-release-status]").textContent = available
    ? `${release.tag} · ${(asset.size / 1024 / 1024).toFixed(1)} MB`
    : release ? `${label()} 설치 파일은 아직 공개되지 않았어요.` : "공개 릴리스에서 설치 파일을 확인해 주세요.";
  document.querySelector("[data-download-note]").textContent = available
    ? "GitHub 공식 배포 파일 · 파일을 받은 뒤 아래에서 설치를 이어가세요."
    : "설치 파일을 확인할 수 없어요. 공식 릴리스 목록에서 확인해 주세요.";
  const notarized = os === "mac" && available && release?.macosNotarized === true;
  document.querySelector("[data-notarized-mac]").hidden = !notarized;
  document.querySelector("[data-unnotarized-mac]").hidden = os !== "mac" || notarized;
  const badge = document.querySelector(".release-card-top > .pill");
  badge.textContent = release?.preview === false ? "공개 버전" : "시험판";
  // Missing assets lead to the real release page; never create an optimistic binary URL.
  document.querySelector('[data-next="1"]').disabled = Boolean(release && !available);
}

function showStep(next, focus = false) {
  step = next;
  select("[data-panel]").forEach((panel) => { panel.hidden = Number(panel.dataset.panel) !== step; });
  select("[data-step]").forEach((button) => {
    if (Number(button.dataset.step) === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  if (focus) {
    const heading = document.querySelector(`[data-panel="${step}"] h2`);
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
}

function chooseOS(next, updateUrl = true) {
  os = next;
  select("[data-os]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.os === os)));
  select("[data-mac]").forEach((node) => { node.hidden = os !== "mac"; });
  select("[data-windows]").forEach((node) => { node.hidden = os !== "windows"; });
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set("os", os);
    history.replaceState(null, "", url);
  }
  renderRelease();
  showStep(0);
}

if (install) {
  select("[data-os]").forEach((button) => button.addEventListener("click", () => chooseOS(button.dataset.os)));
  select("[data-step], [data-next]").forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.step ?? button.dataset.next), true)));
  chooseOS(os, false);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  document.querySelector("[data-mobile]").hidden = !isMobile;
  document.querySelector("[data-copy]").addEventListener("click", async () => {
    const url = new URL("install.html", location.href);
    try {
      await navigator.clipboard.writeText(url.href);
      document.querySelector("[data-copy-status]").textContent = "주소를 복사했어요. 컴퓨터에서 열어주세요.";
    } catch {
      document.querySelector("[data-copy-status]").textContent = `아래 주소를 길게 눌러 복사해 주세요: ${url.href}`;
    }
  });
  try {
    // Same-origin snapshot: visitors never call GitHub's API or share account information.
    const response = await fetch(new URL("releases.json", import.meta.url), { signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error("Release snapshot unavailable");
    const data = await response.json();
    if (!data.platforms || typeof data.tag !== "string" || typeof data.preview !== "boolean") throw new Error("Invalid release snapshot");
    release = data;
  } catch {
    // A real release listing remains usable offline, on API failure, or without JavaScript.
    release = null;
  }
  renderRelease();
}
