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
