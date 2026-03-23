'use server';

import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import {
	requireRole,
	saveSessionPasswordHash,
	saveSessionUser,
} from '@/lib/auth';

export async function updateMyAccount(formData: FormData) {
	const currentUser = await requireRole(['ADMIN', 'STAFF']);

	const name = String(formData.get('name') ?? '').trim();
	const email = String(formData.get('email') ?? '').trim();
	const password = String(formData.get('password') ?? '').trim();

	if (!name || !email) {
		return;
	}

	await saveSessionUser({
		...currentUser,
		name,
		email,
	});

	if (password.length >= 8) {
		const passwordHash = await hash(password, 10);
		await saveSessionPasswordHash(passwordHash);
	}

	revalidatePath('/admin');
	revalidatePath('/admin/manage-accounts');
	revalidatePath('/admin/settings');
}
