import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

// ✅ allowlist this job endpoint (no Clerk auth)
const isPublicApiRoute = createRouteMatcher([
  "/api/calendar/tag-legacy(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // If it's our public job endpoint, skip Clerk protection
  if (isPublicApiRoute(req)) return;

  // Protect dashboard as before
  if (isProtectedRoute(req)) auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
