'use server';

import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AccountUpdateState = {
	status: 'idle' | 'success' | 'error';
	message?: string;
};

const accountSchema = z.object({
	name: z.string().trim().min(1).max(120),
	email: z.string().trim().toLowerCase().email().max(254),
	password: z.string().optional(),
});

export async function updateMyAccount(
	_previousState: AccountUpdateState,
	formData: FormData,
): Promise<AccountUpdateState> {
	const user = await requireRole(['ADMIN', 'STAFF', 'STUDENT']);

	const parsed = accountSchema.safeParse({
		name: formData.get('name'),
		email: formData.get('email'),
		password: formData.get('password') ?? undefined,
	});

	if (!parsed.success) {
		return {
			status: 'error',
			message: 'Enter a valid name and email address.',
		};
	}

	const { name, email } = parsed.data;
	const password = parsed.data.password?.trim() ?? '';

	if (password && (password.length < 8 || password.length > 72)) {
		return {
			status: 'error',
			message: 'Password must be between 8 and 72 characters.',
		};
	}

	const emailOwner = await prisma.user.findUnique({
		where: { email },
		select: { id: true },
	});

	if (emailOwner && emailOwner.id !== user.id) {
		return {
			status: 'error',
			message: 'That email address is already in use.',
		};
	}

	try {
		await prisma.user.update({
			where: { id: user.id },
			data: {
				name,
				email,
				...(password ? { passwordHash: await hash(password, 12) } : {}),
			},
		});
	} catch (error) {
		if ((error as { code?: string }).code === 'P2002') {
			return {
				status: 'error',
				message: 'That email address is already in use.',
			};
		}
		throw error;
	}

	await writeAuditLog({
		actorUserId: user.id,
		action: 'account.update',
		entityType: 'User',
		entityId: user.id,
		metadata: {
			nameChanged: user.name !== name,
			emailChanged: user.email !== email,
			passwordChanged: Boolean(password),
		},
	});

	revalidatePath('/admin');
	revalidatePath('/admin/manage-accounts');
	revalidatePath('/admin/settings');
	revalidatePath('/student');
	revalidatePath('/student/profile');

	return { status: 'success', message: 'Account updated successfully.' };
}
