import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request : NextRequest) {
  const session = await auth();
  const guestOnlyRoutes = ['/sign-in', '/sign-up'];
  const url = request.nextUrl;

  if (session && guestOnlyRoutes.some(route => url.pathname === route || url.pathname.startsWith(route + '/'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}