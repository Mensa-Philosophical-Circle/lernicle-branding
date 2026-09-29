# Lernicle branding

The school theme catalogue shared by the Lernicle portals (owner dashboard,
staff portal, pupil portal).

A school picks a theme from a fixed list rather than entering a colour. Every
theme is authored twice — once for light mode, once for dark — so a school's
choice can never clash with the mode the viewer is in. A colour picker cannot
make that promise, which is why there isn't one.

A theme is the **whole palette**, not an accent. The page, the cards, the
greys, the borders, the sidebar and the charts all take the school's hue, so a
school on Emerald does not keep violet-tinted borders left over from somebody
else's brand.

## Installing it

The portals depend on this by git tag, not a registry:

```json
"@lernicle/branding": "github:Mensa-Philosophical-Circle/lernicle-branding#v0.1.1"
```

GitHub Packages needs an auth token even for a public package, and all three
portals build in Docker, so a registry would mean plumbing a secret into every
Docker build. A public repo and a tag need none. npm builds the package on
install, via the `prepare` script.

To release a change: bump the version, tag it, and bump the tag in each portal.

## Using it

```ts
import { applyTheme, watchColorMode, applyFavicon, applyTitle } from '@lernicle/branding';

applyTheme(branding.themeId, { colorFormat: 'hsl-triplet' });
const stop = watchColorMode(branding.themeId, { colorFormat: 'hsl-triplet' });
applyFavicon(branding.faviconUrl);
applyTitle(branding.schoolName, 'Staff Portal');
```

`colorFormat` must match how the portal's CSS reads its variables:

| Portal | CSS | `colorFormat` |
| --- | --- | --- |
| Owner dashboard | `hsl(var(--primary))` | `hsl-triplet` |
| Staff portal | `hsl(var(--primary))` | `hsl-triplet` |
| Pupil portal | `var(--primary)`, Tailwind v4 | `hex` |

A theme id the catalogue doesn't know — including `null` — applies nothing, so
the portal keeps its own theme.

## Adding a theme

Add an entry to `SCHOOL_THEMES` with a `primary`, `surface` and `onSurface` for
each mode. Those three anchors are all that is authored; `palette.ts` derives
the other thirty-odd tokens from the hue of `primary`, so a theme cannot end up
internally inconsistent.

The tests check every foreground against its own surface — text on cards, on
muted panels, on the sidebar, on each status colour — at WCAG AA, in both
modes. A theme that fails cannot ship.

Two things stay deliberate rather than derived:

- **Status colours** keep their own hue. An error is red however the school is
  branded, because a parent has to tell an error from a success at a glance.
  Their lightness is set per mode so they sit correctly on that theme.
- **Chart series** are five hues evenly spaced from the school's, so a chart is
  recognisably theirs while the series stay distinguishable from each other.

## The HTTP call is not here

Staff uses axios and pupils uses `fetch`, so each app keeps its own request and
react-query wiring. This package is the catalogue plus the DOM work.
