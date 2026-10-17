import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only the landing page and the Clerk sign-in / sign-up screens are public.
// Everything else (dashboard, booking, profile, ...) requires a signed-in user.
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Route handlers return JSON 401 responses themselves; avoid middleware redirects
  // that turn unauthenticated API fetches into sign-in HTML documents.
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!api/health/ready|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Ensure ride and tRPC APIs still run through middleware, even for static-looking URLs.
    "/api/rides/:path*",
    "/trpc/:path*",
  ],
};
