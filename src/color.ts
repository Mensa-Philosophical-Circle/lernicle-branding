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
