export {
  SCHOOL_THEMES,
  SCHOOL_THEME_IDS,
  getTheme,
  isSchoolThemeId,
  type SchoolThemeId,
} from './themes';

export {
  applyFavicon,
  applyTheme,
  applyTitle,
  currentColorMode,
  watchColorMode,
  type ApplyThemeOptions,
} from './apply';

export { THEME_VARIABLE_NAMES, themeVariables } from './variables';

export {
  buildPalette,
  type PaletteToken,
  type ThemeVariables,
} from './palette';

export {
  normalizeBrandingAssets,
  readCachedBranding,
  resolveBrandAssetUrl,
  writeCachedBranding,
} from './assets';

export {
  contrastRatio,
  hslToHex,
  normalizeHex,
  readableTextOn,
  toHsl,
  toHslTriplet,
  toRgb,
} from './color';

export type {
  ColorFormat,
  ColorMode,
  SchoolBranding,
  SchoolTheme,
  ThemeModeColors,
} from './types';
