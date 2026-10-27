import type { UserRole } from '@/generated/prisma/enums';

export function getRoleHome(role: UserRole): string {
	return role === 'STUDENT' ? '/student' : '/admin';
}

export function isStaffRole(role: UserRole): boolean {
	return role === 'ADMIN' || role === 'STAFF';
}
