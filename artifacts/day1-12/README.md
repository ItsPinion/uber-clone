# CabBook Days 1–12 UI screenshots

There are full-page PNG captures for all eight UI routes in both viewport profiles:

- **Desktop:** 1440 × 1000 CSS px
- **Mobile:** 390 × 844 CSS px (2× device pixel ratio)

Routes: `/`, `/sign-in`, `/sign-up`, `/book`, `/dashboard`, `/driver`, `/history`, `/profile`.

The screenshots were captured from a temporary local rendering harness using the app's server-rendered markup and bundled CSS. The harness bypassed route protection only to render protected page shells; **these are not authenticated Clerk-browser screenshots**. External Clerk JavaScript and OpenStreetMap tiles could not be fetched in this sandbox, so the sign-in/sign-up widgets and profile editor may show their initial empty/loading placeholders, and map tiles may be absent. No user credentials or personal data are present.

A Chromium layout check reported no horizontal document overflow at either viewport size for any captured route. The screenshots are static captures; client-side interactions were not exercised by this visual pass.
