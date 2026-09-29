import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyFavicon,
  applyTheme,
  applyTitle,
  currentColorMode,
  watchColorMode,
} from '../apply';
import { THEME_VARIABLE_NAMES } from '../variables';
import { DEFAULT_THEME_ID, getTheme } from '../themes';

const root = () => document.documentElement;

beforeEach(() => {
  root().className = '';
  root().removeAttribute('style');
  document.head.innerHTML = '';
  document.title = '';
});

describe('applying a theme', () => {
  it('paints every variable the portal reads', () => {
    applyTheme('indigo', { colorFormat: 'hsl-triplet' });

    THEME_VARIABLE_NAMES.forEach((name) => {
      expect(root().style.getPropertyValue(name), name).not.toBe('');
    });
  });

  // The portals' own fallbacks were not tuned for dark mode and disagreed
  // with each other, so an unthemed school gets the default theme instead.
  it('paints the default theme when the school has chosen none', () => {
    applyTheme(null, { colorFormat: 'hex', mode: 'light' });

    expect(root().style.getPropertyValue('--primary')).toBe(
      getTheme(DEFAULT_THEME_ID)!.light.primary,
    );
  });

  it('gives an unthemed school a dark mode that was designed for it', () => {
    applyTheme(null, { colorFormat: 'hex', mode: 'dark' });

    expect(root().style.getPropertyValue('--primary')).toBe(
      getTheme(DEFAULT_THEME_ID)!.dark.primary,
    );
  });

  it('falls back to the default for a theme id it does not know', () => {
    applyTheme('chartreuse', { colorFormat: 'hex', mode: 'light' });

    expect(root().style.getPropertyValue('--primary')).toBe(
      getTheme(DEFAULT_THEME_ID)!.light.primary,
    );
  });

  it('returns to the default when a school unsets its theme', () => {
    applyTheme('emerald', { colorFormat: 'hex', mode: 'light' });
    applyTheme(null, { colorFormat: 'hex', mode: 'light' });

    expect(root().style.getPropertyValue('--primary')).toBe(
      getTheme(DEFAULT_THEME_ID)!.light.primary,
    );
  });

  it('uses the dark values when the page is dark', () => {
    applyTheme('blue', { colorFormat: 'hex', mode: 'light' });
    const light = root().style.getPropertyValue('--primary');

    applyTheme('blue', { colorFormat: 'hex', mode: 'dark' });
    const dark = root().style.getPropertyValue('--primary');

    expect(dark).not.toBe(light);
  });

  it('reads the mode off the page when none is given', () => {
    expect(currentColorMode()).toBe('light');
    root().classList.add('dark');
    expect(currentColorMode()).toBe('dark');

    applyTheme('blue', { colorFormat: 'hex' });
    const applied = root().style.getPropertyValue('--primary');

    root().classList.remove('dark');
    applyTheme('blue', { colorFormat: 'hex' });

    expect(root().style.getPropertyValue('--primary')).not.toBe(applied);
  });
});

describe('following the viewer between light and dark', () => {
  it('repaints when the page switches mode', async () => {
    applyTheme('fuchsia', { colorFormat: 'hex' });
    const stop = watchColorMode('fuchsia', { colorFormat: 'hex' });
    const before = root().style.getPropertyValue('--primary');

    root().classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root().style.getPropertyValue('--primary')).not.toBe(before);
    stop();
  });

  it('stops watching when told to', async () => {
    const stop = watchColorMode('fuchsia', { colorFormat: 'hex' });

    stop();
    applyTheme('fuchsia', { colorFormat: 'hex', mode: 'light' });
    const before = root().style.getPropertyValue('--primary');

    root().classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root().style.getPropertyValue('--primary')).toBe(before);
  });
});

describe('the tab', () => {
  // Every portal ships an SVG icon link and an .ico one, and browsers pick
  // between them by their own rules — often preferring the SVG. Adding a third
  // link would simply lose that argument, so the others are taken over too.
  it('takes over the icon links the page already has', () => {
    document.head.innerHTML =
      '<link rel="icon" type="image/svg+xml" href="/vite.svg">' +
      '<link rel="icon" href="/favicon.ico">';

    applyFavicon('https://cdn.test/school.png');

    document
      .querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
      .forEach((link) => {
        expect(link.href).toBe('https://cdn.test/school.png');
      });
  });

  // An .ico still announced as image/svg+xml is not drawn at all.
  it('drops a type that would misdescribe the school favicon', () => {
    document.head.innerHTML =
      '<link rel="icon" type="image/svg+xml" href="/vite.svg">';

    applyFavicon('https://cdn.test/school.ico');

    expect(
      document.querySelector('link[href$="school.ico"]')?.hasAttribute('type'),
    ).toBe(false);
  });

  it('hands the page its own icons back when the school has none', () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';

    applyFavicon('https://cdn.test/school.png');
    applyFavicon(null);

    expect(
      document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href,
    ).toContain('/favicon.ico');
    expect(document.querySelector('link[data-school-favicon]')).toBeNull();
  });

  it('removes the school favicon when there is none', () => {
    applyFavicon('https://cdn.test/one.png');
    applyFavicon(null);

    expect(document.querySelector('link[data-school-favicon]')).toBeNull();
  });

  // Without one, every school's tab showed the portal's development logo.
  it('generates an icon from the school when it has not uploaded one', () => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="/vite.svg">';

    applyFavicon(null, { themeId: 'emerald', schoolName: "Abe Toluwani's School" });

    const href = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')!.href;

    expect(href.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(href)).toContain('>AT<');
    expect(decodeURIComponent(href)).toContain(getTheme('emerald')!.light.primary);
  });

  it('prefers the uploaded icon over a generated one', () => {
    applyFavicon('https://cdn.test/f.png', { themeId: 'emerald', schoolName: 'X' });

    expect(
      document.querySelector<HTMLLinkElement>('link[data-school-favicon]')!.href,
    ).toBe('https://cdn.test/f.png');
  });

  it('titles the tab with the school name, not its initials', () => {
    applyTitle("Abe Toluwani's School", 'Staff Portal');
    expect(document.title).toBe("Abe Toluwani's School | Staff Portal");

    applyTitle("Abe Toluwani's School");
    expect(document.title).toBe("Abe Toluwani's School");
  });
});
