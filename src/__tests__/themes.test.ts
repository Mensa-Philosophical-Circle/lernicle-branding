import { describe, expect, it } from 'vitest';

import { contrastRatio, readableTextOn, toHsl } from '../color';
import { buildPalette } from '../palette';
import { SCHOOL_THEMES, SCHOOL_THEME_IDS, getTheme, isSchoolThemeId } from '../themes';
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

    expect(variables['--primary']).toBe('#2563EB');
    expect(variables['--primary-foreground']).toBe('#FFFFFF');
  });

  // schoolowners and staff wrap these in hsl(), so a hex would be inert.
  it('writes an unitless triplet for themes whose CSS wraps it in hsl()', () => {
    const variables = themeVariables(getTheme('blue')!, 'light', 'hsl-triplet');

    expect(variables['--primary']).toBe('221 83% 53%');
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

  it("gives the greys the school's own hue, not somebody else's", () => {
    const emerald = buildPalette(getTheme('emerald')!, 'light');
    const rose = buildPalette(getTheme('rose')!, 'light');

    expect(emerald['--border']).not.toBe(rose['--border']);
    expect(emerald['--muted']).not.toBe(rose['--muted']);
    expect(emerald['--sidebar']).not.toBe(rose['--sidebar']);
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

  it('keeps an error red whichever theme the school picked', () => {
    SCHOOL_THEMES.forEach((theme) => {
      const { h } = toHsl(buildPalette(theme, 'light')['--destructive']);

      expect(h <= 15 || h >= 345, `${theme.id}`).toBe(true);
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
