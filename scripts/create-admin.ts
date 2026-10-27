import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import 'dotenv/config';
import { z } from 'zod';

import { PrismaClient } from '../src/generated/prisma/client';
import { UserRole } from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	console.error('DATABASE_URL is required to create an admin user.');
	process.exit(1);
}

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString }),
});

const schema = z.object({
	ADMIN_EMAIL: z.string().trim().toLowerCase().email().max(254),
	ADMIN_PASSWORD: z.string().min(12).max(72),
	ADMIN_NAME: z.string().trim().min(1).max(120).default('System Administrator'),
	ADMIN_FORCE_PROMOTE: z
		.enum(['1', 'true', 'yes'])
		.optional()
		.transform((value) => Boolean(value)),
});

async function main() {
	const parsed = schema.safeParse(process.env);

	if (!parsed.success) {
		const details = parsed.error.issues
			.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
			.join('; ');
		throw new Error(`Invalid admin bootstrap configuration: ${details}`);
	}

	const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_FORCE_PROMOTE } =
		parsed.data;
	const passwordHash = await hash(ADMIN_PASSWORD, 12);

	const existing = await prisma.user.findUnique({
		where: { email: ADMIN_EMAIL },
		select: { id: true, role: true },
	});

	if (existing && existing.role !== 'ADMIN' && !ADMIN_FORCE_PROMOTE) {
		throw new Error(
			`${ADMIN_EMAIL} already exists with role ${existing.role}. ` +
				'Use a different email, or set ADMIN_FORCE_PROMOTE=true to promote it.',
		);
	}

	const user = existing
		? await prisma.user.update({
				where: { id: existing.id },
				data: {
					name: ADMIN_NAME,
					passwordHash,
					role: UserRole.ADMIN,
					isActive: true,
				},
				select: { id: true, email: true, role: true },
			})
		: await prisma.user.create({
				data: {
					email: ADMIN_EMAIL,
					name: ADMIN_NAME,
					passwordHash,
					role: UserRole.ADMIN,
					isActive: true,
				},
				select: { id: true, email: true, role: true },
			});

	await prisma.auditLog.create({
		data: {
			action: existing ? 'admin.bootstrap.update' : 'admin.bootstrap.create',
			entityType: 'User',
			entityId: user.id,
			metadata: {
				email: user.email,
				promoted: Boolean(existing && existing.role !== 'ADMIN'),
			},
		},
	});

	console.log(
		`${existing ? 'Updated' : 'Created'} ADMIN user ${user.email} (${user.id}).`,
	);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
