import { contrastRatio, toHslTriplet } from './color';
import type {
  ColorFormat,
  ColorMode,
  SchoolTheme,
  ThemeModeColors,
  ThemeVariables,
} from './types';

/** Text on a brand surface is one of these two; whichever reads better wins. */
const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#0B0B12';

/**
 * White or near-black on this colour, whichever has more contrast. Picked
 * rather than authored so a theme cannot declare an unreadable pairing.
 */
export function readableTextOn(background: string): string {
  return contrastRatio(LIGHT_TEXT, background) >=
    contrastRatio(DARK_TEXT, background)
    ? LIGHT_TEXT
    : DARK_TEXT;
}

const format = (hex: string, colorFormat: ColorFormat): string =>
  colorFormat === 'hsl-triplet' ? toHslTriplet(hex) : hex;

/**
 * The full variable block for one mode. Only three colours are authored per
 * mode; the rest follow from them, so there is no way to author a theme whose
 * sidebar disagrees with its buttons.
 */
export function themeVariables(
  theme: SchoolTheme,
  mode: ColorMode,
  colorFormat: ColorFormat,
): ThemeVariables {
  const colors: ThemeModeColors = theme[mode];
  const primary = format(colors.primary, colorFormat);
  const onPrimary = format(readableTextOn(colors.primary), colorFormat);
  const surface = format(colors.surface, colorFormat);
  const onSurface = format(colors.onSurface, colorFormat);

  return {
    '--primary': primary,
    '--primary-foreground': onPrimary,
    '--secondary': surface,
    '--secondary-foreground': onSurface,
    '--accent': surface,
    '--accent-foreground': onSurface,
    '--ring': primary,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': onPrimary,
    '--sidebar-accent': surface,
    '--sidebar-accent-foreground': onSurface,
  };
}

export const THEME_VARIABLE_NAMES = Object.keys(
  themeVariables(
    {
      id: '',
      name: '',
      light: { primary: '#000000', surface: '#000000', onSurface: '#000000' },
      dark: { primary: '#000000', surface: '#000000', onSurface: '#000000' },
    },
    'light',
    'hex',
  ),
) as (keyof ThemeVariables)[];
