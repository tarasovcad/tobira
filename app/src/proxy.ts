import {NextRequest, NextResponse} from "next/server";
import {getSessionCookie} from "better-auth/cookies";

import {AUTH_COOKIE_PREFIX} from "@/lib/auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {cookiePrefix: AUTH_COOKIE_PREFIX});
  const {pathname} = request.nextUrl;

  if (pathname.startsWith("/login") && sessionCookie) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
