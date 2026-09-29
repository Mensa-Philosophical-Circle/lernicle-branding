import { resolveTheme } from './themes';
import { themeVariables } from './variables';
import type { ColorFormat, ColorMode } from './types';

export interface ApplyThemeOptions {
  colorFormat: ColorFormat;
  /** Defaults to whatever the document is currently showing. */
  mode?: ColorMode;
  /** Defaults to the live document; injectable for tests. */
  root?: HTMLElement;
}

/** All three portals switch modes with a `dark` class on `<html>`. */
export function currentColorMode(root?: HTMLElement): ColorMode {
  const element = root ?? globalThis.document?.documentElement;

  return element?.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Paints the school's theme onto the document for the mode being shown.
 *
 * A school that has chosen nothing, or whose theme no longer exists, gets the
 * default theme rather than the portal's own fallback: those fallbacks were
 * never tuned for dark mode and did not agree with each other.
 */
export function applyTheme(
  themeId: string | null | undefined,
  options: ApplyThemeOptions,
): void {
  const root = options.root ?? globalThis.document?.documentElement;
  if (!root) return;

  const theme = resolveTheme(themeId);
  const mode = options.mode ?? currentColorMode(root);
  const variables = themeVariables(theme, mode, options.colorFormat);

  Object.entries(variables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  applyBrowserChrome(theme[mode].primary);
}

/**
 * The bar a phone browser draws around the page. It is the first thing a
 * parent sees on a phone, and without this it stays the browser's own colour
 * however the school is branded. It follows the mode with everything else.
 */
function applyBrowserChrome(color: string): void {
  const doc = globalThis.document;
  if (!doc) return;

  const existing = doc.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  const meta = existing ?? doc.createElement('meta');

  if (!existing) {
    meta.name = 'theme-color';
    meta.dataset.schoolThemeColor = 'true';
    doc.head.appendChild(meta);
  }
  meta.content = color;
}

/**
 * Repaints when the viewer switches between light and dark. Without this the
 * school's theme would keep its light values on a dark page — the exact
 * mismatch the fixed catalogue exists to prevent. Returns a cleanup function.
 */
export function watchColorMode(
  themeId: string | null | undefined,
  options: ApplyThemeOptions,
): () => void {
  const root = options.root ?? globalThis.document?.documentElement;
  if (!root || typeof MutationObserver === 'undefined') return () => {};

  const observer = new MutationObserver(() => {
    applyTheme(themeId, { ...options, mode: undefined, root });
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: ['class'],
  });

  return () => observer.disconnect();
}

/**
 * Points the tab icon at the school's favicon.
 *
 * Every portal ships more than one `<link rel="icon">` — typically an SVG and
 * an .ico — and browsers pick between them by their own rules, often
 * preferring the SVG. Appending one more would simply lose that argument, so
 * the existing links are taken over as well, keeping their original href so
 * they can be handed back when the school has no favicon of its own.
 */
export function applyFavicon(url: string | null | undefined): void {
  const doc = globalThis.document;
  if (!doc) return;

  const ours = doc.querySelector<HTMLLinkElement>('link[data-school-favicon]');
  const theirs = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
  ).filter((link) => !link.dataset.schoolFavicon);

  if (!url) {
    ours?.remove();
    theirs.forEach((link) => {
      const original = link.dataset.originalHref;

      if (original !== undefined) {
        link.href = original;
        delete link.dataset.originalHref;
      }
    });

    return;
  }

  theirs.forEach((link) => {
    if (link.dataset.originalHref === undefined) {
      link.dataset.originalHref = link.getAttribute('href') ?? '';
    }
    link.href = url;
    // An .ico announced as SVG is not drawn at all.
    link.removeAttribute('type');
  });

  const link = ours ?? doc.createElement('link');

  if (!ours) {
    link.rel = 'icon';
    link.dataset.schoolFavicon = 'true';
    doc.head.appendChild(link);
  }
  link.href = url;
}

export function applyTitle(schoolName: string, suffix?: string): void {
  const doc = globalThis.document;
  if (!doc) return;

  doc.title = suffix ? `${schoolName} | ${suffix}` : schoolName;
}
