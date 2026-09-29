import type { ColorMode } from './types';

/** What a person has asked for. "system" follows their device. */
export type ColorModePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'lernicle-color-mode';

/**
 * Only one choice is ever in force. Without this, choosing "match my device"
 * and then "dark" left the first one listening, and the device could flip the
 * page back to light behind the person's back.
 */
let stopFollowingDevice: () => void = () => {};
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Light or dark is each person's choice, not the school's: the school picks
 * the colours, and each person picks how to see them. A school choosing dark
 * for everyone would force it on people who cannot read dark screens well.
 */
export function readColorModePreference(): ColorModePreference {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);

    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';
  } catch {
    return 'system';
  }
}

function systemMode(): ColorMode {
  return globalThis.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

export function resolveColorMode(preference: ColorModePreference): ColorMode {
  return preference === 'system' ? systemMode() : preference;
}

function paint(mode: ColorMode): void {
  const root = globalThis.document?.documentElement;
  if (!root) return;

  root.classList.toggle('dark', mode === 'dark');
  // Native controls (scrollbars, date pickers) follow this too.
  root.style.colorScheme = mode;
}

/**
 * Puts the page in the mode a person asked for. Call it before the app first
 * renders so a dark-mode user never sees a white flash. With "system" it keeps
 * following the device; the returned function stops that.
 *
 * The school's theme is repainted by `watchColorMode`, which notices the class
 * change, so the two never need to know about each other.
 */
export function applyColorModePreference(
  preference: ColorModePreference = readColorModePreference(),
): () => void {
  stopFollowingDevice();
  stopFollowingDevice = () => {};
  paint(resolveColorMode(preference));

  if (preference !== 'system' || !globalThis.matchMedia) return () => {};

  const query = globalThis.matchMedia(DARK_QUERY);
  const follow = () => paint(systemMode());

  query.addEventListener?.('change', follow);
  stopFollowingDevice = () => query.removeEventListener?.('change', follow);

  return stopFollowingDevice;
}

/** Remembers a person's choice on this device and applies it. */
export function setColorModePreference(
  preference: ColorModePreference,
): () => void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }

  return applyColorModePreference(preference);
}
