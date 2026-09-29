import type { SchoolTheme } from './types';

/**
 * The themes a school can choose from.
 *
 * Every theme is authored twice — once for light mode, once for dark — rather
 * than derived from a single colour. That is the whole point of a fixed
 * catalogue: a colour that reads well on a white page is usually unreadable on
 * a dark one, so each mode gets a value picked for that surface. A free colour
 * picker cannot make that promise, which is why there isn't one.
 *
 * Adding a theme: give it a `primary` that carries white or near-black text at
 * WCAG AA, and a `surface`/`onSurface` pair that does the same. The catalogue
 * tests check both, in both modes, so a theme that fails cannot ship.
 */
export const SCHOOL_THEMES: readonly SchoolTheme[] = [
  {
    id: 'violet',
    name: 'Violet',
    light: { primary: '#7C3AED', surface: '#F5F3FF', onSurface: '#5B21B6' },
    dark: { primary: '#A78BFA', surface: '#2E1065', onSurface: '#DDD6FE' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    light: { primary: '#4F46E5', surface: '#EEF2FF', onSurface: '#3730A3' },
    dark: { primary: '#818CF8', surface: '#1E1B4B', onSurface: '#C7D2FE' },
  },
  {
    id: 'blue',
    name: 'Blue',
    light: { primary: '#2563EB', surface: '#EFF6FF', onSurface: '#1E40AF' },
    dark: { primary: '#60A5FA', surface: '#172554', onSurface: '#BFDBFE' },
  },
  {
    id: 'teal',
    name: 'Teal',
    light: { primary: '#0F766E', surface: '#F0FDFA', onSurface: '#115E59' },
    dark: { primary: '#2DD4BF', surface: '#042F2E', onSurface: '#99F6E4' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    light: { primary: '#047857', surface: '#ECFDF5', onSurface: '#065F46' },
    dark: { primary: '#34D399', surface: '#022C22', onSurface: '#A7F3D0' },
  },
  {
    id: 'amber',
    name: 'Amber',
    light: { primary: '#B45309', surface: '#FFFBEB', onSurface: '#92400E' },
    dark: { primary: '#FBBF24', surface: '#451A03', onSurface: '#FDE68A' },
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    light: { primary: '#A21CAF', surface: '#FDF4FF', onSurface: '#86198F' },
    dark: { primary: '#E879F9', surface: '#4A044E', onSurface: '#F5D0FE' },
  },
  {
    id: 'slate',
    name: 'Slate',
    light: { primary: '#334155', surface: '#F8FAFC', onSurface: '#1E293B' },
    dark: { primary: '#94A3B8', surface: '#0F172A', onSurface: '#E2E8F0' },
  },
];

export type SchoolThemeId = (typeof SCHOOL_THEMES)[number]['id'];

/** Every id, for validating what a client sends. */
export const SCHOOL_THEME_IDS: readonly string[] = SCHOOL_THEMES.map(
  (theme) => theme.id,
);

export function getTheme(id: string | null | undefined): SchoolTheme | null {
  if (!id) return null;

  return SCHOOL_THEMES.find((theme) => theme.id === id) ?? null;
}

export function isSchoolThemeId(id: unknown): id is SchoolThemeId {
  return typeof id === 'string' && SCHOOL_THEME_IDS.includes(id);
}
