import type { InvoiceStatus } from '@/generated/prisma/enums';

function startOfUtcDay(date: Date) {
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function resolveInvoiceStatus(
	status: InvoiceStatus,
	dueDate: Date,
	now = new Date(),
): InvoiceStatus {
	if (status === 'PAID') return 'PAID';
	return startOfUtcDay(now) > startOfUtcDay(dueDate) ? 'OVERDUE' : 'PENDING';
}
