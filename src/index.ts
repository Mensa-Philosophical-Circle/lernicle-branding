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

export { THEME_VARIABLE_NAMES, readableTextOn, themeVariables } from './variables';

export {
  normalizeBrandingAssets,
  readCachedBranding,
  resolveBrandAssetUrl,
  writeCachedBranding,
} from './assets';

export { contrastRatio, normalizeHex, toHslTriplet, toRgb } from './color';

export { UNBRANDED_TOKENS } from './types';

export type {
  ColorFormat,
  ColorMode,
  SchoolBranding,
  SchoolTheme,
  ThemeModeColors,
  ThemeVariables,
} from './types';
