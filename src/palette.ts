import { contrastRatio, hslToHex, readableTextOn, toHsl } from './color';
import type { ColorMode, SchoolTheme } from './types';

/**
 * Every colour in the app, derived from a theme's anchors.
 *
 * A theme is the whole palette, not an accent: the page, the cards, the greys,
 * the borders, the sidebar and the charts all take the school's hue, so a
 * school on Emerald does not end up with violet-tinted borders left over from
 * somebody else's brand.
 *
 * Only the brand anchors are authored. Everything here follows from the hue of
 * `primary`, at low saturation for the neutrals, so a theme cannot end up
 * internally inconsistent — and the catalogue tests check the contrast of
 * every derived pairing, in both modes.
 */

/** How the neutrals sit, per mode: lightness and how much hue they carry. */
const NEUTRALS = {
  light: {
    background: [22, 99.5],
    foreground: [16, 16],
    card: [25, 100],
    muted: [14, 96],
    mutedForeground: [10, 40],
    border: [16, 89],
    sidebar: [22, 98],
    sidebarBorder: [16, 90],
  },
  dark: {
    background: [22, 7],
    foreground: [12, 96],
    card: [22, 10],
    muted: [20, 15],
    mutedForeground: [10, 68],
    border: [20, 19],
    sidebar: [24, 9],
    sidebarBorder: [20, 18],
  },
} as const satisfies Record<ColorMode, Record<string, readonly [number, number]>>;

/**
 * Status colours keep their own hue — an error stays red however the school is
 * branded — but their lightness is set per mode so they sit correctly on that
 * mode's surfaces.
 */
const STATUS_HUES = {
  destructive: 0,
  success: 145,
  warning: 38,
  info: 210,
} as const;

const STATUS = {
  light: { saturation: 70, lightness: 40 },
  dark: { saturation: 68, lightness: 60 },
} as const;

/**
 * Hues that still unmistakably read as red. Destructive moves to whichever is
 * furthest from the school's own colour, but never leaves this band: an error
 * that has drifted to orange is a worse problem than one close to the brand.
 */
const RED_HUES = [0, 352, 8] as const;

/** Either a clearly different hue, or a clearly different lightness. */
const MIN_HUE_GAP = 30;
const MIN_CONTRAST_AGAINST_BRAND = 1.6;

/** How far apart two hues are on the wheel, 0–180. */
function hueGap(a: number, b: number): number {
  const distance = Math.abs(a - b) % 360;

  return distance > 180 ? 360 - distance : distance;
}

function tellsApartFrom(brand: string, candidate: string): boolean {
  return (
    hueGap(toHsl(brand).h, toHsl(candidate).h) >= MIN_HUE_GAP ||
    contrastRatio(brand, candidate) >= MIN_CONTRAST_AGAINST_BRAND
  );
}

/**
 * The destructive colour, kept red but kept distinct from the school's own.
 *
 * A red-branded school would otherwise get a delete button nearly the same
 * colour as its primary one. Hue is moved first, within the red band; if the
 * brand is red enough that hue alone cannot separate them, lightness does the
 * rest — darker on a light page, lighter on a dark one, so the difference
 * reads either way.
 */
function destructiveFor(primary: string, mode: ColorMode): string {
  const { saturation, lightness } = STATUS[mode];

  // Plain red first. It only moves when the school's own colour is close
  // enough that a delete button would not stand out.
  for (const hue of RED_HUES) {
    const candidate = hslToHex(hue, saturation, lightness);

    if (tellsApartFrom(primary, candidate)) return candidate;
  }

  // Still too close: separate by lightness, but only a little. Pushed far
  // enough to separate a red brand it stops looking like an error at all,
  // which is why the catalogue keeps its own colours clear of red instead.
  const brandHue = toHsl(primary).h;
  const furthest = [...RED_HUES].sort(
    (a, b) => hueGap(brandHue, b) - hueGap(brandHue, a),
  )[0];
  const step = mode === 'light' ? -5 : 5;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const candidate = hslToHex(furthest, saturation, lightness + step * attempt);

    if (tellsApartFrom(primary, candidate)) return candidate;
  }

  return hslToHex(furthest, saturation, lightness + step * 2);
}

/** Five series, evenly spaced from the school's hue so they stay distinct. */
const CHART_STEP = 72;
const CHART = {
  light: { saturation: 62, lightness: 48 },
  dark: { saturation: 66, lightness: 62 },
} as const;

/** Every CSS variable a theme sets — which is all of them. */
export type ThemeVariables = ReturnType<typeof buildPalette>;
export type PaletteToken = keyof ThemeVariables;

export function buildPalette(theme: SchoolTheme, mode: ColorMode) {
  const anchors = theme[mode];
  const { h: hue } = toHsl(anchors.primary);
  const neutral = NEUTRALS[mode];
  const grey = ([saturation, lightness]: readonly [number, number]) =>
    hslToHex(hue, saturation, lightness);

  const background = grey(neutral.background);
  const foreground = grey(neutral.foreground);
  const card = grey(neutral.card);
  const muted = grey(neutral.muted);
  const border = grey(neutral.border);
  const sidebar = grey(neutral.sidebar);
  const onPrimary = readableTextOn(anchors.primary);

  const status = (hueForStatus: number) => {
    const { saturation, lightness } = STATUS[mode];

    return hslToHex(hueForStatus, saturation, lightness);
  };

  const destructive = destructiveFor(anchors.primary, mode);

  const chart = (index: number) => {
    const { saturation, lightness } = CHART[mode];

    return hslToHex(hue + index * CHART_STEP, saturation, lightness);
  };

  return {
    '--background': background,
    '--foreground': foreground,
    '--card': card,
    '--card-foreground': foreground,
    '--popover': card,
    '--popover-foreground': foreground,

    '--primary': anchors.primary,
    '--primary-foreground': onPrimary,
    '--secondary': anchors.surface,
    '--secondary-foreground': anchors.onSurface,
    '--accent': anchors.surface,
    '--accent-foreground': anchors.onSurface,

    '--muted': muted,
    '--muted-foreground': grey(neutral.mutedForeground),
    '--border': border,
    '--input': border,
    '--ring': anchors.primary,

    '--destructive': destructive,
    '--destructive-foreground': readableTextOn(destructive),
    '--success': status(STATUS_HUES.success),
    '--success-foreground': readableTextOn(status(STATUS_HUES.success)),
    '--warning': status(STATUS_HUES.warning),
    '--warning-foreground': readableTextOn(status(STATUS_HUES.warning)),
    '--info': status(STATUS_HUES.info),
    '--info-foreground': readableTextOn(status(STATUS_HUES.info)),

    '--chart-1': chart(0),
    '--chart-2': chart(1),
    '--chart-3': chart(2),
    '--chart-4': chart(3),
    '--chart-5': chart(4),

    // The pupil portal calls this one `--sidebar`; both are set so a theme
    // works whichever name that portal's CSS reads.
    '--sidebar': sidebar,
    '--sidebar-background': sidebar,
    '--sidebar-foreground': foreground,
    '--sidebar-primary': anchors.primary,
    '--sidebar-primary-foreground': onPrimary,
    '--sidebar-accent': anchors.surface,
    '--sidebar-accent-foreground': anchors.onSurface,
    '--sidebar-border': grey(neutral.sidebarBorder),
    '--sidebar-ring': anchors.primary,
  };
}
