import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
	const startedAt = Date.now();

	try {
		await prisma.$queryRaw`SELECT 1`;

		return NextResponse.json(
			{
				status: 'ok',
				database: 'up',
				latencyMs: Date.now() - startedAt,
				uptimeSeconds: Math.round(process.uptime()),
				timestamp: new Date().toISOString(),
			},
			{
				headers: { 'Cache-Control': 'no-store' },
			},
		);
	} catch {
		return NextResponse.json(
			{
				status: 'error',
				database: 'down',
				latencyMs: Date.now() - startedAt,
				timestamp: new Date().toISOString(),
			},
			{
				status: 503,
				headers: { 'Cache-Control': 'no-store' },
			},
		);
	}
}
