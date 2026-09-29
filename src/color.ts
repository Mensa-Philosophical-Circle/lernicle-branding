/** Colour helpers. Everything is authored as `#RRGGBB`; other forms derive. */

const HEX = /^#[0-9A-Fa-f]{6}$/;
const SHORT_HEX = /^#[0-9A-Fa-f]{3}$/;

/**
 * Accepts what people actually type — `4f46e5`, ` #4F46E5 `, `#4ae` — and
 * returns a canonical `#RRGGBB`, or null if it isn't a colour at all.
 */
export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

  if (SHORT_HEX.test(prefixed)) {
    const [, r, g, b] = prefixed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return HEX.test(prefixed) ? prefixed.toUpperCase() : null;
}

export function toRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Not a hex colour: ${hex}`);

  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

/**
 * The `221 83% 53%` form, which Tailwind themes wrap in `hsl(var(--primary))`.
 * Deliberately unitless and space-separated: that is what the CSS expects.
 */
export function toHslTriplet(hex: string): string {
  const [red, green, blue] = toRgb(hex).map((channel) => channel / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === red) {
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(
    lightness * 100,
  )}%`;
}

/** Hue, saturation and lightness of a colour, for deriving a palette from it. */
export function toHsl(hex: string): { h: number; s: number; l: number } {
  const [h, s, l] = toHslTriplet(hex)
    .replace(/%/g, '')
    .split(' ')
    .map(Number);

  return { h, s, l };
}

/** The inverse of `toHslTriplet`, so a derived colour can be written as hex. */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = Math.min(100, Math.max(0, saturation)) / 100;
  const l = Math.min(100, Math.max(0, lightness)) / 100;
  const k = (n: number) => (n + ((hue % 360) + 360) / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))),
    );

  return `#${[channel(0), channel(8), channel(4)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [red, green, blue] = toRgb(hex).map((channel) => {
    const value = channel / 255;

    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));

  return (lighter + 0.05) / (darker + 0.05);
}

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

/** `top` at `alpha` opacity laid over `under`, as the browser composites it. */
export function mix(top: string, alpha: number, under: string): string {
  const [a, b] = [toRgb(top), toRgb(under)];

  return `#${a
    .map((value, i) =>
      Math.round(value * alpha + b[i] * (1 - alpha))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}
