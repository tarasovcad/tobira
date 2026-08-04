import {NextRequest, NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";

import {AUTH_COOKIE_PREFIX} from "@/lib/auth/cookies";
import {getLoginPath, getSafeReturnTo} from "@/lib/auth/redirect";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {cookiePrefix: AUTH_COOKIE_PREFIX});
  const {pathname} = request.nextUrl;

  if (pathname === "/login" && sessionCookie) {
    const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get("returnTo"));
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  if (pathname === "/connect-extension" && !sessionCookie) {
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(getLoginPath(returnTo), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/connect-extension"],
};
