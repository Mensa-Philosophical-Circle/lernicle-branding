import { getTheme } from './themes';
import { THEME_VARIABLE_NAMES, themeVariables } from './variables';
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
 * An unknown or absent theme clears anything previously set rather than
 * substituting a colour, so a school that has chosen no theme simply keeps the
 * portal's own. Returns whether a theme was applied.
 */
export function applyTheme(
  themeId: string | null | undefined,
  options: ApplyThemeOptions,
): boolean {
  const root = options.root ?? globalThis.document?.documentElement;
  if (!root) return false;

  const theme = getTheme(themeId);

  if (!theme) {
    THEME_VARIABLE_NAMES.forEach((name) => root.style.removeProperty(name));

    return false;
  }

  const mode = options.mode ?? currentColorMode(root);
  const variables = themeVariables(theme, mode, options.colorFormat);

  Object.entries(variables).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });

  return true;
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

/** Swaps the tab icon, leaving the app's own `<link rel="icon">` untouched. */
export function applyFavicon(url: string | null | undefined): void {
  const doc = globalThis.document;
  if (!doc) return;

  const existing = doc.querySelector<HTMLLinkElement>(
    'link[data-school-favicon]',
  );

  if (!url) {
    existing?.remove();

    return;
  }

  const link = existing ?? doc.createElement('link');

  if (!existing) {
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
