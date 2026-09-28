import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../color';
import { SCHOOL_THEMES, SCHOOL_THEME_IDS, getTheme, isSchoolThemeId } from '../themes';
import { readableTextOn, themeVariables, THEME_VARIABLE_NAMES } from '../variables';
import { UNBRANDED_TOKENS } from '../types';
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

describe('what a theme deliberately does not touch', () => {
  // An error must still read as an error when the school's theme is amber,
  // and chart series have to be told apart from each other before they are
  // branded. Asserting it here stops someone quietly widening the theme.
  it('never repaints the status or chart colours', () => {
    const painted = new Set<string>(THEME_VARIABLE_NAMES);

    UNBRANDED_TOKENS.forEach((token) => {
      expect(painted.has(token), token).toBe(false);
    });
  });

  it('leaves the page itself neutral for the brand to sit on', () => {
    expect(THEME_VARIABLE_NAMES).not.toContain('--background');
    expect(THEME_VARIABLE_NAMES).not.toContain('--card');
  });

  it('does brand the things a school expects to see branded', () => {
    ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring'].forEach(
      (token) => expect(THEME_VARIABLE_NAMES).toContain(token),
    );
  });
});
