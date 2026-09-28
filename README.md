# Lernicle branding

The school theme catalogue shared by the Lernicle portals (owner dashboard,
staff portal, pupil portal).

A school picks a theme from a fixed list rather than entering a colour. Every
theme is authored twice — once for light mode, once for dark — so a school's
choice can never clash with the mode the viewer is in. A colour picker cannot
make that promise, which is why there isn't one.

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
each mode. Everything else is derived, and the tests check that text on the
brand colour and on the surface meets WCAG AA in both modes, so a theme that
fails cannot ship.

## The HTTP call is not here

Staff uses axios and pupils uses `fetch`, so each app keeps its own request and
react-query wiring. This package is the catalogue plus the DOM work.
