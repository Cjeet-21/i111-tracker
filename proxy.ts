import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "i111_session";

/**
 * Cheap first-line route protection: only checks for the session cookie.
 * The (app) layout performs the authoritative database-backed check, so a
 * forged/invalid cookie can never expose data.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/revisions",
    "/problems/:path*",
    "/calendar",
    "/statistics",
    "/settings",
  ],
};
