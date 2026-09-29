import { toHslTriplet } from './color';
import { buildPalette } from './palette';
import type { ThemeVariables } from './palette';
import type { ColorFormat, ColorMode, SchoolTheme } from './types';

const format = (hex: string, colorFormat: ColorFormat): string =>
  colorFormat === 'hsl-triplet' ? toHslTriplet(hex) : hex;

/**
 * The full variable block for one mode — every colour the app uses, not just
 * the brand ones. See `palette.ts` for what is authored and what is derived.
 */
export function themeVariables(
  theme: SchoolTheme,
  mode: ColorMode,
  colorFormat: ColorFormat,
): ThemeVariables {
  const palette = buildPalette(theme, mode);

  return Object.fromEntries(
    Object.entries(palette).map(([name, hex]) => [
      name,
      format(hex, colorFormat),
    ]),
  ) as ThemeVariables;
}

export const THEME_VARIABLE_NAMES = Object.keys(
  buildPalette(
    {
      id: '',
      name: '',
      light: { primary: '#2563EB', surface: '#EFF6FF', onSurface: '#1E40AF' },
      dark: { primary: '#60A5FA', surface: '#172554', onSurface: '#BFDBFE' },
    },
    'light',
  ),
) as (keyof ThemeVariables)[];
