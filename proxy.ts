import { NextResponse } from "next/server";
import { auth } from "@/auth";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isDashboardRoute = pathname.startsWith("/trips");
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isDashboardRoute && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const destination = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/trips";
    return NextResponse.redirect(new URL(destination, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|svg|jpg|jpeg|ico)$).*)"],
};
