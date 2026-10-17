# CabBook Days 1–12 UI screenshots

Full-page Chromium screenshots for all eight UI routes, captured in explicitly forced light and dark themes at desktop and mobile sizes (32 PNGs total).

- **Desktop:** 1440 × 1000 CSS px, device scale factor 1
- **Mobile:** 390 × 844 CSS px, device scale factor 2
- **Routes:** `/`, `/sign-in`, `/sign-up`, `/book`, `/dashboard`, `/driver`, `/history`, `/profile`
- **Theme paths:** `light/{desktop,mobile}/` and `dark/{desktop,mobile}/`

The capture run waited for navigation, fonts, client rendering, the client-only map module, external-tile fallback handling, loaded images, and stable layout dimensions. Each page was scrolled for lazy content, returned to scroll position zero, and captured only after document dimensions stabilized. `capture-results.json` records route status, theme, viewport/document sizes, scroll position, timing, external request counts, and the offline map fallback state. All 32 routes returned HTTP 200, matched the requested theme, had no page errors or horizontal overflow, and were captured at scroll position zero.

A screenshot-by-screenshot review found and fixed three visible issues: location glyphs that rendered as missing-font boxes were replaced with inline SVG pins; the mobile ride-history status filters now wrap instead of clipping; and dark-mode profile accents now use readable mint colors. The offline-map switch was repositioned to avoid overlapping the route-preview label. All eight routes were also checked at 320, 360, and 390 px widths; none overflowed.

**Sandbox limitations:** The protected pages use a synthetic `Aarav Demo` identity in a temporary screenshot-only Clerk mock; this does not verify a real authenticated Clerk session. The sign-in/sign-up captures show a neutral placeholder in place of Clerk-hosted widgets, which could not load in the sandbox. OpenStreetMap tile requests were blocked, so `/book` uses the app’s built-in offline route illustration in these captures; real map tiles are not verified. No real user credentials or personal data are included.

The application’s default theme remains set to follow the operating system (`system`) after the explicit light and dark capture passes.
