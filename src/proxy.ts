import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
	void req;
	return NextResponse.next();
}

export const config = {
	matcher: ['/admin/:path*'],
};
