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
    // Use getToken to read the session from cookies
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token && authRoutes.some(route => url.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    if (token && guestOnlyRoutes.some(route => url.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

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