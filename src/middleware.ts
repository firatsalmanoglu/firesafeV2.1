import NextAuth from "next-auth";
import authConfig from "@/auth.config";

import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_GUEST_REDIRECT,
} from "@/routes";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

const { auth } = NextAuth(authConfig);


export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Logout sayfası için özel kontrol
  if (nextUrl.pathname === "/logout") {
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn && session?.user?.role) {
      // Role göre yönlendirme
      const userRole = session?.user?.role as UserRole;

      let redirectUrl = DEFAULT_GUEST_REDIRECT; // Default yönlendirme

      // Role göre yönlendirme mantığı
      switch(userRole) {
        case "ADMIN":
          redirectUrl = "/admin";
          break;
        case "MUSTERI_SEVIYE1":
        case "MUSTERI_SEVIYE2":
          redirectUrl = DEFAULT_GUEST_REDIRECT;
          break;
        case "HIZMETSAGLAYICI_SEVIYE1":
        case "HIZMETSAGLAYICI_SEVIYE2":
          redirectUrl = "/provider";
          break;
        case "GUEST":
          redirectUrl = DEFAULT_GUEST_REDIRECT;
          break;
        default:
          redirectUrl = "/";
      }

      return Response.redirect(new URL(redirectUrl, nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    "/",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
