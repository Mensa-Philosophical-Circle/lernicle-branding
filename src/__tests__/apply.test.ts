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
    applyTheme('rose', { colorFormat: 'hex' });
    const stop = watchColorMode('rose', { colorFormat: 'hex' });
    const before = root().style.getPropertyValue('--primary');

    root().classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root().style.getPropertyValue('--primary')).not.toBe(before);
    stop();
  });

  it('stops watching when told to', async () => {
    const stop = watchColorMode('rose', { colorFormat: 'hex' });

    stop();
    applyTheme('rose', { colorFormat: 'hex', mode: 'light' });
    const before = root().style.getPropertyValue('--primary');

    root().classList.add('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root().style.getPropertyValue('--primary')).toBe(before);
  });
});

describe('the tab', () => {
  it("adds a favicon without touching the app's own", () => {
    const own = document.createElement('link');

    own.rel = 'icon';
    own.href = '/favicon.ico';
    document.head.appendChild(own);

    applyFavicon('https://cdn.test/school.png');

    expect(
      document.querySelector<HTMLLinkElement>('link[data-school-favicon]')?.href,
    ).toBe('https://cdn.test/school.png');
    expect(own.href).toContain('/favicon.ico');
  });

  it('replaces the school favicon rather than stacking them up', () => {
    applyFavicon('https://cdn.test/one.png');
    applyFavicon('https://cdn.test/two.png');

    expect(document.querySelectorAll('link[data-school-favicon]')).toHaveLength(1);
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
