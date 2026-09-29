import { readableTextOn } from './color';
import type { SchoolBranding } from './types';

/**
 * Makes a stored asset URL usable from whatever origin the portal runs on.
 * URLs saved from a developer's machine point at localhost, which is nothing
 * on someone else's browser, so those keep only their path.
 */
export function resolveBrandAssetUrl(
  assetUrl: string | null | undefined,
  origin?: string,
): string | null {
  if (!assetUrl) return null;

  const base = origin ?? globalThis.location?.origin;
  if (!base) return assetUrl;

  try {
    const url = new URL(assetUrl, base);

    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
      return new URL(`${url.pathname}${url.search}${url.hash}`, base).href;
    }

    return url.href;
  } catch {
    return assetUrl;
  }
}

export function normalizeBrandingAssets(
  branding: SchoolBranding,
  origin?: string,
): SchoolBranding {
  return {
    ...branding,
    logoUrl: resolveBrandAssetUrl(branding.logoUrl, origin),
    faviconUrl: resolveBrandAssetUrl(branding.faviconUrl, origin),
  };
}

const CACHE_KEY = 'school-branding';

/**
 * Branding is read back on the next page load so the first paint already
 * carries it. Storage can be unavailable or full, and a miss is harmless, so
 * every access is guarded.
 */
export function readCachedBranding(): SchoolBranding | undefined {
  try {
    const cached = globalThis.sessionStorage?.getItem(CACHE_KEY);

    return cached ? (JSON.parse(cached) as SchoolBranding) : undefined;
  } catch {
    return undefined;
  }
}

export function writeCachedBranding(branding: SchoolBranding): void {
  try {
    globalThis.sessionStorage?.setItem(CACHE_KEY, JSON.stringify(branding));
  } catch {
    // A full or blocked store is not a reason to fail the page.
  }
}

/** Up to two letters from a school's name: "Abe Toluwani's School" -> "AT". */
export function schoolInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter((word) => /^[\p{L}\p{N}]/u.test(word))
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'S'
  );
}

/**
 * A tab icon for a school that has not uploaded one: its initials on its theme
 * colour. Without it the tab showed whatever placeholder the portal shipped
 * with — for every school, a development logo.
 */
export function generatedFavicon(color: string, label: string): string {
  const text = label.slice(0, 2).replace(/[<>&"']/g, '');
  const size = text.length > 1 ? 28 : 36;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${color}"/>` +
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${size}" ` +
    `font-weight="700" fill="${readableTextOn(color)}">${text}</text></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
