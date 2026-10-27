import { getSessionUser } from '@/lib/auth';
import { writeAuditLog } from '@/lib/audit';
import { formatDateOnly } from '@/lib/format';
import { resolveInvoiceStatus } from '@/lib/invoices';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function csvCell(value: string | number): string {
	const text = String(value);
	const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
	return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET() {
	const user = await getSessionUser();
	if (!user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
		return Response.json({ error: 'Forbidden' }, { status: 403 });
	}

	const invoices = await prisma.invoice.findMany({
		orderBy: { dueDate: 'desc' },
		include: {
			student: { include: { user: { select: { name: true, email: true } } } },
			payments: { select: { amountPaid: true } },
		},
	});

	const rows = invoices.map((invoice) => {
		const paid = invoice.payments.reduce(
			(sum, payment) => sum + Number(payment.amountPaid),
			0,
		);
		const outstanding = Math.max(0, Number(invoice.amountDue) - paid);
		const status = resolveInvoiceStatus(invoice.status, invoice.dueDate);

		return [
			invoice.id,
			invoice.student.user.name,
			invoice.student.user.email,
			invoice.student.studentNumber,
			formatDateOnly(invoice.periodStart),
			formatDateOnly(invoice.periodEnd),
			formatDateOnly(invoice.dueDate),
			Number(invoice.amountDue).toFixed(2),
			paid.toFixed(2),
			outstanding.toFixed(2),
			status,
		];
	});

	const header = [
		'Invoice ID',
		'Student',
		'Email',
		'Student Number',
		'Period Start',
		'Period End',
		'Due Date',
		'Amount Due (NPR)',
		'Paid (NPR)',
		'Outstanding (NPR)',
		'Status',
	];

	const csv = [header, ...rows]
		.map((row) => row.map((value) => csvCell(value)).join(','))
		.join('\n');

	await writeAuditLog({
		actorUserId: user.id,
		action: 'report.export',
		entityType: 'Invoice',
		metadata: { invoiceCount: rows.length },
	});

	const filename = `hostel-invoices-${formatDateOnly(new Date())}.csv`;

	return new Response(`\uFEFF${csv}\n`, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'no-store',
		},
	});
}
