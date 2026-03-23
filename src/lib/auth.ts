import type { UserRole } from '@/generated/prisma/enums';
import { cookies } from 'next/headers';

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
};

const SESSION_USER_COOKIE = 'hms-local-session-user';
const SESSION_PASSWORD_COOKIE = 'hms-local-session-password-hash';

const DEFAULT_SESSION_USER: SessionUser = {
	id: 'local-user',
	email: 'local@hostel.local',
	name: 'Local User',
	role: 'ADMIN',
};

function parseRole(value: unknown): UserRole | null {
	if (value === 'ADMIN' || value === 'STAFF' || value === 'STUDENT') {
		return value;
	}

	return null;
}

async function readSessionUserFromCookie(): Promise<SessionUser | null> {
	const cookieStore = await cookies();
	const raw = cookieStore.get(SESSION_USER_COOKIE)?.value;

	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as Partial<SessionUser>;
		const role = parseRole(parsed.role);

		if (!parsed.id || !parsed.email || !parsed.name || !role) {
			return null;
		}

		return {
			id: parsed.id,
			email: parsed.email,
			name: parsed.name,
			role,
		};
	} catch {
		return null;
	}
}

export async function getSessionUser(): Promise<SessionUser> {
	// Auth is disabled: use cookie-backed local user for app-level role checks.
	const fromCookie = await readSessionUserFromCookie();
	return fromCookie ?? DEFAULT_SESSION_USER;
}

export async function saveSessionUser(user: SessionUser) {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_USER_COOKIE, JSON.stringify(user), {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
	});
}

export async function saveSessionPasswordHash(passwordHash: string) {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_PASSWORD_COOKIE, passwordHash, {
		httpOnly: true,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
	});
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
