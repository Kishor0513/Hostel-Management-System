import { prisma } from '@/lib/prisma';

const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

export const LOGIN_RATE_LIMIT = {
	windowMinutes: WINDOW_MS / 60_000,
	maxFailuresPerIdentifier: 5,
	maxFailuresPerIp: 50,
} as const;

export type RateLimitResult = {
	allowed: boolean;
	remainingIdentifierAttempts: number;
	remainingIpAttempts: number;
};

export async function checkLoginRateLimit(
	identifier: string,
	ip: string | null,
): Promise<RateLimitResult> {
	const windowStart = new Date(Date.now() - WINDOW_MS);

	const [identifierFailures, ipFailures] = await Promise.all([
		prisma.loginAttempt.count({
			where: {
				identifier,
				success: false,
				createdAt: { gte: windowStart },
			},
		}),
		ip
			? prisma.loginAttempt.count({
					where: {
						ip,
						success: false,
						createdAt: { gte: windowStart },
					},
				})
			: Promise.resolve(0),
	]);

	return {
		allowed:
			identifierFailures < LOGIN_RATE_LIMIT.maxFailuresPerIdentifier &&
			ipFailures < LOGIN_RATE_LIMIT.maxFailuresPerIp,
		remainingIdentifierAttempts: Math.max(
			0,
			LOGIN_RATE_LIMIT.maxFailuresPerIdentifier - identifierFailures,
		),
		remainingIpAttempts: Math.max(
			0,
			LOGIN_RATE_LIMIT.maxFailuresPerIp - ipFailures,
		),
	};
}

export async function recordLoginAttempt({
	identifier,
	ip,
	success,
}: {
	identifier: string;
	ip: string | null;
	success: boolean;
}): Promise<void> {
	await prisma.loginAttempt.create({
		data: {
			identifier,
			ip,
			success,
		},
	});

	if (success) {
		await prisma.loginAttempt.deleteMany({
			where: { identifier, success: false },
		});
	}

	prisma.loginAttempt
		.deleteMany({
			where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
		})
		.catch((error) => {
			console.error('[auth] failed to prune login attempts', error);
		});
}
