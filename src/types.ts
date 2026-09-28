/** The colour format a portal's CSS expects for its theme variables. */
export type ColorFormat = 'hsl-triplet' | 'hex';

export type ColorMode = 'light' | 'dark';

/**
 * What a theme author writes, per mode. Everything else is derived, so a
 * theme stays small enough to reason about and impossible to get internally
 * inconsistent.
 */
export interface ThemeModeColors {
  /** The brand colour on this mode's page background. */
  primary: string;
  /** The tinted surface behind highlights, active nav and soft badges. */
  surface: string;
  /** Text and icons on `surface`. */
  onSurface: string;
}

export interface SchoolTheme {
  id: string;
  name: string;
  light: ThemeModeColors;
  dark: ThemeModeColors;
}

/** The CSS variables a theme sets. Names match the portals' existing tokens. */
export interface ThemeVariables {
  '--primary': string;
  '--primary-foreground': string;
  '--secondary': string;
  '--secondary-foreground': string;
  '--accent': string;
  '--accent-foreground': string;
  '--ring': string;
  '--sidebar-primary': string;
  '--sidebar-primary-foreground': string;
  '--sidebar-accent': string;
  '--sidebar-accent-foreground': string;
}

/** What `GET /pupils/school-branding` returns. */
export interface SchoolBranding {
  schoolId: string | null;
  schoolName: string;
  logoUrl: string | null;
  /** A catalogue id, or null when the school has not chosen one. */
  themeId: string | null;
  faviconUrl: string | null;
  motto: string | null;
  contactEmail: string | null;
  resolvedBy: 'domain' | 'header' | 'session' | 'default';
}
