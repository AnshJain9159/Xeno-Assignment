import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const authRoutes = [
    '/api-docs',
    '/audiences',
    '/campaigns',
    '/ingest-data',
];

const guestOnlyRoutes = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    // console.log(`[Middleware] Executing for: ${url.pathname}`); // Log path
    // console.log(`[Middleware] NEXTAUTH_SECRET available: ${!!process.env.NEXTAUTH_SECRET}`); // Log if secret is present

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // console.log("[Middleware] Token received:", token); // Log the token itself

    if (!token && authRoutes.some(route => url.pathname.startsWith(route))) {
        // console.log("[Middleware] No token, and accessing authRoute. Redirecting to /sign-in.");
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    if (token && guestOnlyRoutes.some(route => url.pathname.startsWith(route))) {
        // console.log("[Middleware] Token found, and accessing guestOnlyRoute. Redirecting to /.");
        return NextResponse.redirect(new URL('/', request.url));
    }

    // console.log("[Middleware] No redirect conditions met. Proceeding.");
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/sign-in',
        '/sign-up',
        '/api-docs',
        '/audiences',
        '/audiences/create',
        '/campaigns',
        '/campaigns/create',
        '/campaigns/:campaignId',
        '/ingest-data',
    ],
}; 