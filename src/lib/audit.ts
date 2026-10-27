import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { getRequestMeta } from '@/lib/request';

export type AuditEvent = {
	actorUserId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	metadata?: Prisma.InputJsonValue | null;
	ip?: string | null;
	userAgent?: string | null;
};

export async function writeAuditLog(event: AuditEvent): Promise<void> {
	try {
		const requestMeta =
			event.ip === undefined || event.userAgent === undefined
				? await getRequestMeta()
				: { ip: event.ip, userAgent: event.userAgent };

		await prisma.auditLog.create({
			data: {
				actorUserId: event.actorUserId ?? null,
				action: event.action,
				entityType: event.entityType,
				entityId: event.entityId ?? null,
				metadata: event.metadata ?? undefined,
				ip: event.ip ?? requestMeta.ip,
				userAgent: event.userAgent ?? requestMeta.userAgent,
			},
		});
	} catch (error) {
		// Audit failures must never take down the operation that was audited.
		console.error('[audit] failed to write audit log', error);
	}
}
