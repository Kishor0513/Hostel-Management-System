import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import type { UserRole } from '@/generated/prisma/enums';

function parseRole(value: unknown): UserRole | null {
	return value === 'ADMIN' || value === 'STAFF' || value === 'STUDENT'
		? value
		: null;
}

export async function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;
	const useSecureCookies = process.env.NEXTAUTH_URL
		? process.env.NEXTAUTH_URL.startsWith('https://')
		: request.nextUrl.protocol === 'https:';

	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET,
		secureCookie: useSecureCookies,
	});
	const role = parseRole(token?.role);

	// The login page performs its own database-backed session check. Redirecting
	// purely from the JWT here would trap deactivated users in a redirect loop.
	if (pathname === '/login') {
		return NextResponse.next();
	}

	if (!token) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
		return NextResponse.redirect(loginUrl);
	}

	if (pathname.startsWith('/admin') && role === 'STUDENT') {
		return NextResponse.redirect(new URL('/forbidden', request.url));
	}

	if (pathname.startsWith('/student') && role !== 'STUDENT') {
		return NextResponse.redirect(new URL('/admin', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/admin/:path*', '/student/:path*', '/announcements/:path*', '/login'],
};
