# CabBook Days 1–12 UI screenshots

Full-page Chromium screenshots for all eight UI routes, captured in explicitly forced light and dark themes at desktop and mobile sizes (32 PNGs total).

- **Desktop:** 1440 × 1000 CSS px, device scale factor 1
- **Mobile:** 390 × 844 CSS px, device scale factor 2
- **Routes:** `/`, `/sign-in`, `/sign-up`, `/book`, `/dashboard`, `/driver`, `/history`, `/profile`
- **Theme paths:** `light/{desktop,mobile}/` and `dark/{desktop,mobile}/`

Capture waited for navigation network idle, `document.fonts.ready`, hydration and motion settling, loaded images, and stable document dimensions before taking each screenshot. The complete per-capture status, dimensions, theme, and timing records are in `capture-results.json`; visual overview sheets are included for each theme/device combination. All 32 routes returned HTTP 200, matched the forced theme, had zero reported page errors, and fit their capture viewport without horizontal overflow. The profile page was additionally checked at 320 px and 360 px; it fit at both widths.

**Important limitations:** protected pages were rendered in a temporary local harness with a synthetic demo identity; these are not screenshots from a real authenticated Clerk session. Sandbox network restrictions prevented Clerk-hosted widgets and OpenStreetMap tiles from loading, so sign-in/sign-up widget areas and map tile content are not verified and may appear as placeholders. No real user credentials or personal data are included.

The application’s default theme is set to follow the operating system (`system`) after the explicit light/dark capture passes.
