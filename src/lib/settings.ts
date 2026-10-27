import { z } from 'zod';

import { prisma } from '@/lib/prisma';

export const ORGANIZATION_SETTINGS_KEY = 'organization';

export const organizationSettingsSchema = z.object({
	organizationName: z.string().trim().min(1).max(120),
	supportEmail: z.string().trim().toLowerCase().email().max(254),
	billingEmail: z.string().trim().toLowerCase().email().max(254),
	timezone: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.refine((value) => {
			try {
				new Intl.DateTimeFormat('en-US', { timeZone: value });
				return true;
			} catch {
				return false;
			}
		}, 'Use a valid IANA timezone, for example Asia/Kolkata.'),
	invoiceDueDays: z.coerce.number().int().min(1).max(90),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

export const DEFAULT_ORGANIZATION_SETTINGS: OrganizationSettings = {
	organizationName: 'Oasis Hostel Group',
	supportEmail: 'support@oasishostel.com',
	billingEmail: 'accounts@oasishostel.com',
	timezone: 'Asia/Kolkata',
	invoiceDueDays: 7,
};

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
	try {
		const setting = await prisma.appSetting.findUnique({
			where: { key: ORGANIZATION_SETTINGS_KEY },
			select: { value: true },
		});

		if (!setting) {
			return DEFAULT_ORGANIZATION_SETTINGS;
		}

		const parsed = organizationSettingsSchema.safeParse(setting.value);
		return parsed.success ? parsed.data : DEFAULT_ORGANIZATION_SETTINGS;
	} catch (error) {
		console.error('[settings] failed to load organization settings', error);
		return DEFAULT_ORGANIZATION_SETTINGS;
	}
}
