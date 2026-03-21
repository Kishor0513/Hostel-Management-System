import { compare } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import type { UserRole } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
	session: { strategy: 'jwt' as const },
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				const email = credentials?.email?.toLowerCase().trim();
				const password = credentials?.password;
				if (!email || !password) return null;

				const user = await prisma.user.findUnique({
					where: { email },
					select: {
						id: true,
						email: true,
						name: true,
						role: true,
						passwordHash: true,
					},
				});

				if (!user) return null;
				const ok = await compare(password, user.passwordHash);
				if (!ok) return null;

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
			}
			return session;
		},
	},
	pages: {
		signIn: '/login',
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
