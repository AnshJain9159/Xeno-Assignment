import { NextResponse, NextRequest } from "next/server";
// import { auth } from "@/auth";
import { getToken } from 'next-auth/jwt'

export async function middleware(request : NextRequest) {
//   const session = await auth();
  // If user is authenticated and tries to access an auth page, redirect to dashboard
  // Routes that should redirect to home if user is already authenticated
    const guestOnlyRoutes = ['/sign-in', '/sign-up'];
    const token = await getToken({ req: request,secret: process.env.NEXTAUTH_SECRET });
    const url = request.nextUrl;
        // If the user is authenticated and trying to access guest-only routes
    if (token && guestOnlyRoutes.some(route => url.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

  // Otherwise, continue as normal
  return NextResponse.next();
}