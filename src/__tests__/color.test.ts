import { describe, expect, it } from 'vitest';

import { contrastRatio, normalizeHex, toHslTriplet, toRgb } from '../color';
import {
  generatedFavicon,
  normalizeBrandingAssets,
  schoolInitials,
  readCachedBranding,
  resolveBrandAssetUrl,
  writeCachedBranding,
} from '../assets';
import type { SchoolBranding } from '../types';

describe('reading a hex colour', () => {
  it('accepts what people actually type', () => {
    expect(normalizeHex('#4f46e5')).toBe('#4F46E5');
    expect(normalizeHex('4F46E5')).toBe('#4F46E5');
    expect(normalizeHex('  #4F46E5  ')).toBe('#4F46E5');
    expect(normalizeHex('#4ae')).toBe('#44AAEE');
  });

  it('refuses anything that is not a colour', () => {
    expect(normalizeHex('')).toBeNull();
    expect(normalizeHex(null)).toBeNull();
    expect(normalizeHex('rebeccapurple')).toBeNull();
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('#GGGGGG')).toBeNull();
  });

  it('splits into channels', () => {
    expect(toRgb('#2563EB')).toEqual([37, 99, 235]);
  });
});

describe('converting to the triplet Tailwind themes expect', () => {
  it('matches known colours', () => {
    expect(toHslTriplet('#2563EB')).toBe('221 83% 53%');
    expect(toHslTriplet('#FFFFFF')).toBe('0 0% 100%');
    expect(toHslTriplet('#000000')).toBe('0 0% 0%');
  });

  it('gives grey no hue and no saturation', () => {
    expect(toHslTriplet('#808080')).toBe('0 0% 50%');
  });
});

describe('contrast', () => {
  it('scores the extremes correctly', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('does not care which way round the colours are given', () => {
    expect(contrastRatio('#2563EB', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#2563EB'),
      5,
    );
  });
});

describe('asset URLs', () => {
  it('keeps a real URL as it is', () => {
    expect(resolveBrandAssetUrl('https://cdn.test/logo.png', 'https://app.test')).toBe(
      'https://cdn.test/logo.png',
    );
  });

  // A URL saved on a developer's machine is nothing on anyone else's browser.
  it('rewrites a localhost URL onto the current origin', () => {
    expect(
      resolveBrandAssetUrl('http://localhost:3000/uploads/a.png', 'https://app.test'),
    ).toBe('https://app.test/uploads/a.png');
  });

  it('resolves a bare path against the origin', () => {
    expect(resolveBrandAssetUrl('/uploads/a.png', 'https://app.test')).toBe(
      'https://app.test/uploads/a.png',
    );
  });

  it('has nothing to say about a missing asset', () => {
    expect(resolveBrandAssetUrl(null, 'https://app.test')).toBeNull();
    expect(resolveBrandAssetUrl('', 'https://app.test')).toBeNull();
  });

  it('normalizes both assets on a branding payload', () => {
    const branding = {
      schoolId: 's1',
      schoolName: 'Test',
      logoUrl: 'http://localhost:3000/l.png',
      themeId: 'blue',
      faviconUrl: 'http://localhost:3000/f.png',
      motto: null,
      contactEmail: null,
      resolvedBy: 'session',
    } satisfies SchoolBranding;

    const resolved = normalizeBrandingAssets(branding, 'https://app.test');

    expect(resolved.logoUrl).toBe('https://app.test/l.png');
    expect(resolved.faviconUrl).toBe('https://app.test/f.png');
    expect(resolved.themeId).toBe('blue');
  });
});

describe('the branding cache', () => {
  it('round-trips what it was given', () => {
    const branding = {
      schoolId: 's1',
      schoolName: 'Test',
      logoUrl: null,
      themeId: 'rose',
      faviconUrl: null,
      motto: null,
      contactEmail: null,
      resolvedBy: 'session',
    } satisfies SchoolBranding;

    writeCachedBranding(branding);

    expect(readCachedBranding()).toEqual(branding);
  });

  it('treats unreadable storage as an empty cache, not an error', () => {
    sessionStorage.setItem('school-branding', 'not json');

    expect(readCachedBranding()).toBeUndefined();
  });
});

describe('a generated tab icon', () => {
  it('takes up to two initials from the school name', () => {
    expect(schoolInitials("Abe Toluwani's School")).toBe('AT');
    expect(schoolInitials('Greenwood')).toBe('G');
    expect(schoolInitials('  st. mary  academy ')).toBe('SM');
    expect(schoolInitials('')).toBe('S');
  });

  it('is a self-contained SVG in the theme colour', () => {
    const icon = decodeURIComponent(generatedFavicon('#047857', 'AT'));

    expect(icon).toContain('fill="#047857"');
    expect(icon).toContain('>AT<');
  });

  // The label comes from a school name somebody typed.
  it('cannot be broken out of by a name with markup in it', () => {
    const icon = decodeURIComponent(generatedFavicon('#047857', '<s'));

    expect(icon).not.toContain('<s<');
  });
});
