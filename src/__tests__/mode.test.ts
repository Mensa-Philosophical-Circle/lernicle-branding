import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme, watchColorMode } from '../apply';
import {
  applyColorModePreference,
  readColorModePreference,
  resolveColorMode,
  setColorModePreference,
} from '../mode';
import { getTheme } from '../themes';

const root = () => document.documentElement;

/** A device whose dark setting can change, with real listener bookkeeping. */
function device(initiallyDark: boolean) {
  let dark = initiallyDark;
  const listeners = new Set<() => void>();

  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));

  return {
    listeners,
    goDark() {
      dark = true;
      listeners.forEach((fn) => fn());
    },
  };
}

function deviceIsDark(dark: boolean) {
  return [...device(dark).listeners];
}

beforeEach(() => {
  localStorage.clear();
  root().className = '';
  root().removeAttribute('style');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a person choosing light or dark', () => {
  it('follows the device until someone chooses', () => {
    deviceIsDark(true);

    expect(readColorModePreference()).toBe('system');
    expect(resolveColorMode('system')).toBe('dark');
  });

  it('remembers the choice on this device', () => {
    deviceIsDark(false);
    setColorModePreference('dark');

    expect(readColorModePreference()).toBe('dark');
    expect(root().classList.contains('dark')).toBe(true);
    expect(root().style.colorScheme).toBe('dark');
  });

  it('goes back to light', () => {
    deviceIsDark(false);
    setColorModePreference('dark');
    setColorModePreference('light');

    expect(root().classList.contains('dark')).toBe(false);
  });

  it('ignores a stored value it does not recognise', () => {
    localStorage.setItem('lernicle-color-mode', 'purple');

    expect(readColorModePreference()).toBe('system');
  });

  it('keeps following the device when set to match it', () => {
    const phone = device(false);

    applyColorModePreference('system');
    expect(root().classList.contains('dark')).toBe(false);

    phone.goDark();

    expect(root().classList.contains('dark')).toBe(true);
  });

  it('stops following the device once someone picks a mode', () => {
    const phone = device(false);

    applyColorModePreference('system');
    setColorModePreference('light');
    // The device goes dark; the person asked for light, so it stays light.
    phone.goDark();

    expect(root().classList.contains('dark')).toBe(false);
    expect(phone.listeners.size).toBe(0);
  });

  // The whole point: switching mode repaints the school's theme with the
  // colours designed for that mode, not the light ones on a dark page.
  it("repaints the school's theme in the colours made for that mode", async () => {
    deviceIsDark(false);
    applyTheme('teal', { colorFormat: 'hex' });
    const stop = watchColorMode('teal', { colorFormat: 'hex' });

    setColorModePreference('dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root().style.getPropertyValue('--primary')).toBe(
      getTheme('teal')!.dark.primary,
    );
    stop();
  });
});
