import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/prenota", "/le-mie-prenotazioni", "/comunicazioni", "/profilo", "/traguardi"];
const adminPrefix = "/admin";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(adminPrefix);

  if ((isProtected || isAdmin) && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && req.auth?.user.role !== "admin") {
    return NextResponse.redirect(new URL("/prenota", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/prenota/:path*", "/le-mie-prenotazioni/:path*", "/comunicazioni/:path*", "/profilo/:path*", "/traguardi/:path*", "/admin/:path*"],
};
