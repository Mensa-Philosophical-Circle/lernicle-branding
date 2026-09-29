import { describe, expect, it } from 'vitest';

import { contrastRatio, readableTextOn, toHsl } from '../color';
import { buildPalette } from '../palette';
import {
  DEFAULT_THEME_ID,
  SCHOOL_THEMES,
  SCHOOL_THEME_IDS,
  getTheme,
  isSchoolThemeId,
  resolveTheme,
} from '../themes';
import { themeVariables, THEME_VARIABLE_NAMES } from '../variables';
import type { ColorMode } from '../types';

const MODES: ColorMode[] = ['light', 'dark'];
/** WCAG AA for body text. */
const AA = 4.5;
const HEX = /^#[0-9A-F]{6}$/;

describe('the school theme catalogue', () => {
  it('offers a choice without being a wall of them', () => {
    expect(SCHOOL_THEMES.length).toBeGreaterThanOrEqual(6);
    expect(SCHOOL_THEMES.length).toBeLessThanOrEqual(12);
  });

  it('gives every theme a distinct id and a name worth reading', () => {
    expect(new Set(SCHOOL_THEME_IDS).size).toBe(SCHOOL_THEMES.length);
    SCHOOL_THEMES.forEach((theme) => {
      expect(theme.id, theme.id).toMatch(/^[a-z][a-z-]*$/);
      expect(theme.name.length, theme.id).toBeGreaterThan(2);
    });
  });

  it('authors every theme for both modes in canonical hex', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const colors = theme[mode];

        expect(colors.primary, `${theme.id} ${mode}`).toMatch(HEX);
        expect(colors.surface, `${theme.id} ${mode}`).toMatch(HEX);
        expect(colors.onSurface, `${theme.id} ${mode}`).toMatch(HEX);
      });
    });
  });

  // The promise the whole fixed catalogue exists to keep: whichever mode the
  // viewer is in, a school's chosen theme is still readable.
  it('keeps text on the brand colour readable in both modes', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const { primary } = theme[mode];
        const ratio = contrastRatio(readableTextOn(primary), primary);

        expect(ratio, `${theme.id} ${mode} on ${primary}`).toBeGreaterThanOrEqual(AA);
      });
    });
  });

  it('keeps text on the tinted surface readable in both modes', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const { surface, onSurface } = theme[mode];

        expect(
          contrastRatio(onSurface, surface),
          `${theme.id} ${mode}`,
        ).toBeGreaterThanOrEqual(AA);
      });
    });
  });

  // A light-mode brand colour on a dark page is the failure this replaces.
  it('makes each theme visibly different between light and dark', () => {
    SCHOOL_THEMES.forEach((theme) => {
      expect(theme.light.primary, theme.id).not.toBe(theme.dark.primary);
      expect(theme.light.surface, theme.id).not.toBe(theme.dark.surface);
    });
  });

  it('has a default that is a real theme in the catalogue', () => {
    expect(getTheme(DEFAULT_THEME_ID)).not.toBeNull();
    expect(resolveTheme(null).id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme('chartreuse').id).toBe(DEFAULT_THEME_ID);
    expect(resolveTheme('teal').id).toBe('teal');
  });

  it('looks up a theme by id and refuses anything else', () => {
    expect(getTheme('indigo')?.name).toBe('Indigo');
    expect(getTheme('chartreuse')).toBeNull();
    expect(getTheme(null)).toBeNull();
    expect(getTheme('')).toBeNull();
    expect(isSchoolThemeId('indigo')).toBe(true);
    expect(isSchoolThemeId('chartreuse')).toBe(false);
    expect(isSchoolThemeId(7)).toBe(false);
  });
});

describe('theme variables', () => {
  it('sets every variable the portals read, for every theme and mode', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const variables = themeVariables(theme, mode, 'hex');

        THEME_VARIABLE_NAMES.forEach((name) => {
          expect(variables[name], `${theme.id} ${mode} ${name}`).toBeTruthy();
        });
      });
    });
  });

  it('writes hex for themes whose CSS takes a colour value', () => {
    const variables = themeVariables(getTheme('blue')!, 'light', 'hex');

    expect(variables['--primary']).toBe('#1D4ED8');
    expect(variables['--primary-foreground']).toBe('#FFFFFF');
  });

  // schoolowners and staff wrap these in hsl(), so a hex would be inert.
  it('writes an unitless triplet for themes whose CSS wraps it in hsl()', () => {
    const variables = themeVariables(getTheme('blue')!, 'light', 'hsl-triplet');

    expect(variables['--primary']).toBe('224 76% 48%');
    expect(variables['--primary']).not.toContain('#');
  });

  it('picks the readable text colour rather than trusting the author', () => {
    expect(readableTextOn('#0B0B12')).toBe('#FFFFFF');
    expect(readableTextOn('#FBBF24')).toBe('#0B0B12');
  });
});

describe('a theme is the whole palette', () => {
  const PAIRS: [string, string][] = [
    ['--foreground', '--background'],
    ['--card-foreground', '--card'],
    ['--popover-foreground', '--popover'],
    ['--muted-foreground', '--muted'],
    ['--primary-foreground', '--primary'],
    ['--secondary-foreground', '--secondary'],
    ['--accent-foreground', '--accent'],
    ['--destructive-foreground', '--destructive'],
    ['--success-foreground', '--success'],
    ['--warning-foreground', '--warning'],
    ['--info-foreground', '--info'],
    ['--sidebar-foreground', '--sidebar'],
    ['--sidebar-primary-foreground', '--sidebar-primary'],
    ['--sidebar-accent-foreground', '--sidebar-accent'],
  ];

  // Branding covers every colour, so every pairing has to be readable — not
  // just the brand ones.
  it('keeps every foreground readable on its own surface, in both modes', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);

        PAIRS.forEach(([fg, bg]) => {
          const ratio = contrastRatio(
            palette[fg as keyof typeof palette],
            palette[bg as keyof typeof palette],
          );

          expect(ratio, `${theme.id} ${mode} ${fg} on ${bg}`).toBeGreaterThanOrEqual(AA);
        });
      });
    });
  });

  // Buttons fade on hover (`hover:bg-primary/90`, `/80` for secondary), which
  // pulls the fill towards the page behind it. In light mode that lightens it
  // under white text, so a fill that passes at rest could fail under the pointer.
  it('keeps button text readable while hovered, in both modes', () => {
    const blend = (top: string, alpha: number, under: string) => {
      const channels = (hex: string) =>
        [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const [a, b] = [channels(top), channels(under)];

      return `#${a
        .map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0'))
        .join('')}`;
    };
    const HOVERS = [
      ['--primary-foreground', '--primary', 0.9],
      ['--destructive-foreground', '--destructive', 0.9],
      ['--secondary-foreground', '--secondary', 0.8],
    ] as const;

    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);

        HOVERS.forEach(([fg, bg, alpha]) => {
          (['--background', '--card'] as const).forEach((surface) => {
            const hovered = blend(palette[bg], alpha, palette[surface]);

            expect(
              contrastRatio(palette[fg], hovered),
              `${theme.id} ${mode} ${fg} on hovered ${bg} over ${surface}`,
            ).toBeGreaterThanOrEqual(AA);
          });
        });
      });
    });
  });

  // Status colours are used as text too ("Paid", "Overdue"), not only as fills.
  // A mid green that carries white text perfectly well is barely legible as
  // text on a white page, which is what the first version of this shipped.
  it('keeps status and brand colours readable as text on every surface', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);

        (['--primary', '--destructive', '--success', '--warning', '--info'] as const).forEach(
          (token) => {
            (['--background', '--card', '--muted'] as const).forEach((surface) => {
              expect(
                contrastRatio(palette[token], palette[surface]),
                `${theme.id} ${mode} ${token} on ${surface}`,
              ).toBeGreaterThanOrEqual(AA);
            });
          },
        );
      });
    });
  });

  it("gives the greys the school's own hue, not somebody else's", () => {
    const emerald = buildPalette(getTheme('emerald')!, 'light');
    const fuchsia = buildPalette(getTheme('fuchsia')!, 'light');

    expect(emerald['--border']).not.toBe(fuchsia['--border']);
    expect(emerald['--muted']).not.toBe(fuchsia['--muted']);
    expect(emerald['--sidebar']).not.toBe(fuchsia['--sidebar']);
  });

  // An error must still read as an error when the school's theme is amber.
  it('keeps the status colours telling different stories', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);
        const statuses = [
          palette['--destructive'],
          palette['--success'],
          palette['--warning'],
          palette['--info'],
        ];

        expect(new Set(statuses).size, `${theme.id} ${mode}`).toBe(4);
      });
    });
  });

  const hueGap = (a: number, b: number) => {
    const distance = Math.abs(a - b) % 360;

    return distance > 180 ? 360 - distance : distance;
  };

  it('keeps an error red whichever theme the school picked', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const { h } = toHsl(buildPalette(theme, mode)['--destructive']);

        expect(h <= 15 || h >= 345, `${theme.id} ${mode} hue ${h}`).toBe(true);
      });
    });
  });

  // A red-branded school would otherwise get a delete button nearly the colour
  // of its primary one.
  it('keeps a delete button tellable from a primary one', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);
        const gap = hueGap(
          toHsl(palette['--primary']).h,
          toHsl(palette['--destructive']).h,
        );
        const separation = contrastRatio(
          palette['--primary'],
          palette['--destructive'],
        );

        expect(
          gap >= 30 || separation >= 1.6,
          `${theme.id} ${mode}: gap ${gap}, contrast ${separation.toFixed(2)}`,
        ).toBe(true);
      });
    });
  });

  // Five series that cannot be told apart are not a chart.
  it('gives charts five distinguishable series', () => {
    SCHOOL_THEMES.forEach((theme) => {
      MODES.forEach((mode) => {
        const palette = buildPalette(theme, mode);
        const hues = [1, 2, 3, 4, 5].map(
          (n) => toHsl(palette[`--chart-${n}` as keyof typeof palette]).h,
        );

        expect(new Set(hues).size, `${theme.id} ${mode}`).toBe(5);
      });
    });
  });

  it('covers every token the portals define', () => {
    const required = [
      '--background', '--foreground', '--card', '--popover',
      '--primary', '--secondary', '--muted', '--accent',
      '--destructive', '--success', '--warning', '--info',
      '--border', '--input', '--ring',
      '--chart-1', '--chart-5',
      '--sidebar', '--sidebar-background', '--sidebar-border', '--sidebar-ring',
    ];

    required.forEach((token) =>
      expect(THEME_VARIABLE_NAMES, token).toContain(token),
    );
  });
});
