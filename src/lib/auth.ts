import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import type { UserRole } from '@/generated/prisma/enums';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
};

/**
 * Resolves the authenticated user from the NextAuth session and re-reads the
 * authoritative role/profile from PostgreSQL. The JWT is only used to identify
 * the user; authorization decisions always use current database state.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
	const session = await getServerSession(authOptions);
	const userId = session?.user?.id;

	if (!userId) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, email: true, name: true, role: true, isActive: true },
	});

	if (!user || !user.isActive) {
		return null;
	}

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
	};
}

export async function requireRole(
	allowedRoles: UserRole[] | readonly UserRole[],
): Promise<SessionUser> {
	const user = await getSessionUser();

	if (!user) {
		redirect('/login');
	}

	if (!allowedRoles.includes(user.role)) {
		redirect('/forbidden');
	}

	return user;
}
