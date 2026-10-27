import { compare } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import type { UserRole } from '@/generated/prisma/enums';
import { writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import {
	checkLoginRateLimit,
	recordLoginAttempt,
} from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request';

// A fixed bcrypt hash used to keep failed-login timing consistent when an
// email does not exist. The plaintext is intentionally unknown.
const DUMMY_PASSWORD_HASH =
	'$2b$12$FUHbH21gssy/w4k4xWmyA.jxZP8RM2QqoTnnBKnKhmdcdgHC0L30a';

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	session: {
		strategy: 'jwt',
		maxAge: 8 * 60 * 60,
		updateAge: 60 * 60,
	},
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials, request) {
				const email = credentials?.email?.toLowerCase().trim();
				const password = credentials?.password;
				if (!email || !password) return null;

				const ip = request?.headers
					? getClientIp(
							request.headers as Record<
								string,
								string | string[] | undefined
							>,
						)
					: null;

				const rateLimit = await checkLoginRateLimit(email, ip);
				if (!rateLimit.allowed) {
					await writeAuditLog({
						action: 'auth.login.rate_limited',
						entityType: 'User',
						metadata: { email, ip },
						ip,
					});
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { email },
					select: {
						id: true,
						email: true,
						name: true,
						role: true,
						passwordHash: true,
						isActive: true,
					},
				});

				if (!user || !user.isActive) {
					await compare(password, DUMMY_PASSWORD_HASH);
					await recordLoginAttempt({
						identifier: email,
						ip,
						success: false,
					});
					await writeAuditLog({
						action: 'auth.login.failed',
						entityType: 'User',
						metadata: {
							email,
							reason: user ? 'inactive_user' : 'unknown_user',
						},
						ip,
					});
					return null;
				}

				const passwordMatches = await compare(password, user.passwordHash);
				if (!passwordMatches) {
					await recordLoginAttempt({
						identifier: email,
						ip,
						success: false,
					});
					await writeAuditLog({
						actorUserId: user.id,
						action: 'auth.login.failed',
						entityType: 'User',
						entityId: user.id,
						metadata: { reason: 'invalid_password' },
						ip,
					});
					return null;
				}

				await prisma.user.update({
					where: { id: user.id },
					data: { lastLoginAt: new Date() },
				});
				await recordLoginAttempt({
					identifier: email,
					ip,
					success: true,
				});
				await writeAuditLog({
					actorUserId: user.id,
					action: 'auth.login',
					entityType: 'User',
					entityId: user.id,
					metadata: { role: user.role },
					ip,
				});

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role as UserRole,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				const u = user as { id: string; role: UserRole };
				token.id = u.id;
				token.role = u.role;
			}

			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				if (token.id) session.user.id = token.id;
				if (token.role) session.user.role = token.role;
				if (token.name) session.user.name = token.name;
				if (token.email) session.user.email = token.email;
			}
			return session;
		},
	},
	events: {
		async signOut({ token }) {
			await writeAuditLog({
				actorUserId: token?.id ?? null,
				action: 'auth.logout',
				entityType: 'User',
				entityId: token?.id ?? null,
			});
		},
	},
	pages: {
		signIn: '/login',
		error: '/login',
	},
};
