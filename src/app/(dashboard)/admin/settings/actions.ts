'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { writeAuditLog } from '@/lib/audit';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
	ORGANIZATION_SETTINGS_KEY,
	organizationSettingsSchema,
} from '@/lib/settings';

export async function updateOrganizationSettings(formData: FormData) {
	const user = await requireRole(['ADMIN']);

	const parsed = organizationSettingsSchema.safeParse({
		organizationName: formData.get('organizationName'),
		supportEmail: formData.get('supportEmail'),
		billingEmail: formData.get('billingEmail'),
		timezone: formData.get('timezone'),
		invoiceDueDays: formData.get('invoiceDueDays'),
	});

	if (!parsed.success) {
		redirect('/admin/settings?error=invalid');
	}

	await prisma.appSetting.upsert({
		where: { key: ORGANIZATION_SETTINGS_KEY },
		update: {
			value: parsed.data,
			updatedByUserId: user.id,
		},
		create: {
			key: ORGANIZATION_SETTINGS_KEY,
			value: parsed.data,
			updatedByUserId: user.id,
		},
	});

	await writeAuditLog({
		actorUserId: user.id,
		action: 'settings.update',
		entityType: 'AppSetting',
		entityId: ORGANIZATION_SETTINGS_KEY,
		metadata: parsed.data,
	});

	revalidatePath('/admin', 'layout');
	revalidatePath('/student', 'layout');
	revalidatePath('/admin/settings');
	redirect('/admin/settings?saved=1');
}
