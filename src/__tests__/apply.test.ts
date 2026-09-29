import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyFavicon,
  applyTheme,
  applyTitle,
  currentColorMode,
  watchColorMode,
} from '../apply';
import { THEME_VARIABLE_NAMES } from '../variables';

const root = () => document.documentElement;

beforeEach(() => {
  root().className = '';
  root().removeAttribute('style');
  document.head.innerHTML = '';
  document.title = '';
});

describe('applying a theme', () => {
  it('paints every variable the portal reads', () => {
    expect(applyTheme('indigo', { colorFormat: 'hsl-triplet' })).toBe(true);

    THEME_VARIABLE_NAMES.forEach((name) => {
      expect(root().style.getPropertyValue(name), name).not.toBe('');
    });
  });

  // A school that has chosen nothing keeps the portal's own theme, rather
  // than being forced to a default brand colour.
  it("leaves the portal's own theme alone when no theme is chosen", () => {
    expect(applyTheme(null, { colorFormat: 'hex' })).toBe(false);
    expect(root().style.getPropertyValue('--primary')).toBe('');
  });

  it('clears a previous theme when the school unsets it', () => {
    applyTheme('indigo', { colorFormat: 'hex' });
    applyTheme(null, { colorFormat: 'hex' });

    expect(root().style.getPropertyValue('--primary')).toBe('');
  });

  it('ignores a theme id it does not know', () => {
    expect(applyTheme('chartreuse', { colorFormat: 'hex' })).toBe(false);
    expect(root().style.getPropertyValue('--primary')).toBe('');
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

  it('titles the tab with the school name, not its initials', () => {
    applyTitle("Abe Toluwani's School", 'Staff Portal');
    expect(document.title).toBe("Abe Toluwani's School | Staff Portal");

    applyTitle("Abe Toluwani's School");
    expect(document.title).toBe("Abe Toluwani's School");
  });
});
