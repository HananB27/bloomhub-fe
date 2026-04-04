import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define paths that do NOT require authentication
  const unprotectedPaths = ["/login", "/register"];

  // Allow static files, api routes, and Next.js internals to pass through
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if it's an unprotected root path
  const isUnprotected = unprotectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isUnprotected) {
    return NextResponse.next();
  }

  // Check for common session/token cookies
  const hasAuthToken =
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token") ||
    request.cookies.has("access_token") ||
    request.cookies.has("auth_token") ||
    request.cookies.has("token") ||
    request.cookies.has("sessionid");

  if (!hasAuthToken) {
    // If no session exists, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
