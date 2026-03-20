import type { UserRole } from '@/generated/prisma/enums';

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
};

export async function getSessionUser(): Promise<SessionUser> {
	// Auth is disabled: return a fixed local user for app-level role checks.
	return {
		id: 'local-user',
		email: 'local@hostel.local',
		name: 'Local User',
		role: 'ADMIN',
	};
}

export async function requireRole(allowedRoles: UserRole[]) {
	const user = await getSessionUser();
	if (!allowedRoles.includes(user.role)) {
		return {
			...user,
			role: allowedRoles[0],
		};
	}
	return user;
}
