/** Only public installer assets from the dedicated distribution repository are accepted. */
export const RELEASE_REPO = "kkwaktae/resumate-desktop-release";
export const RELEASES_URL = `https://github.com/${RELEASE_REPO}/releases`;
const DOWNLOAD_PREFIX = `https://github.com/${RELEASE_REPO}/releases/download/`;

export function validInstaller(asset, os) {
  if (!["mac", "windows"].includes(os)) return false;
  if (!asset || typeof asset.name !== "string" || !Number.isSafeInteger(asset.size) || asset.size <= 0) return false;
  const nameMatches = os === "mac"
    ? /^(?:Resumate-macOS|Resumate_[\d.]+_aarch64)\.dmg$/.test(asset.name)
    : /^(?:Resumate-Windows-setup|Resumate_[\d.]+_x64-setup)\.exe$/.test(asset.name);
  if (!nameMatches || typeof asset.url !== "string" || !asset.url.startsWith(DOWNLOAD_PREFIX)) return false;
  try {
    const url = new URL(asset.url);
    const relative = url.pathname.slice(new URL(DOWNLOAD_PREFIX).pathname.length).split("/");
    return url.origin === "https://github.com" && !url.search && !url.hash && relative.length === 2
      && /^[A-Za-z0-9._-]+$/.test(relative[0]) && decodeURIComponent(relative[1]) === asset.name;
  } catch { return false; }
}

function notarizedRelease(release) {
  if (release.draft || release.prerelease || !/^v\d+\.\d+\.\d+$/.test(release.tag_name)) return false;
  return (release.assets ?? []).some((asset) => asset.name === "macos-notarized.json"
    && Number.isSafeInteger(asset.size) && asset.size > 0
    && asset.browser_download_url === `${DOWNLOAD_PREFIX}${release.tag_name}/macos-notarized.json`);
}

export function selectRelease(releases) {
  if (!Array.isArray(releases)) throw new Error("릴리스 응답이 목록이 아닙니다.");
  const ordered = [...releases].sort((a, b) => Number(notarizedRelease(b)) - Number(notarizedRelease(a))
    || Date.parse(b.published_at) - Date.parse(a.published_at));
  for (const release of ordered) {
    if (release.draft || !/^[A-Za-z0-9._-]+$/.test(release.tag_name) || !Number.isFinite(Date.parse(release.published_at))) continue;
    const platforms = {};
    for (const os of ["mac", "windows"]) {
      // Prefer stable aliases when present; older releases only contain versioned filenames.
      const candidates = (release.assets ?? []).map((a) => ({ name: a.name, url: a.browser_download_url, size: a.size }));
      const asset = candidates.filter((a) => validInstaller(a, os))
        .find((a) => a.name === (os === "mac" ? "Resumate-macOS.dmg" : "Resumate-Windows-setup.exe"))
        ?? candidates.find((a) => validInstaller(a, os));
      if (asset) platforms[os] = asset;
    }
    if (Object.keys(platforms).length) return {
      tag: release.tag_name, publishedAt: release.published_at,
      preview: release.prerelease || /preview|alpha|beta|rc/i.test(release.tag_name),
      macosNotarized: Boolean(platforms.mac && notarizedRelease(release)),
      url: `${RELEASES_URL}/tag/${release.tag_name}`, platforms,
    };
  }
  throw new Error("공개된 지원 설치 파일을 찾지 못했습니다.");
}
