import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { formatDateOnly, formatMoney } from '@/lib/format';
import { resolveInvoiceStatus } from '@/lib/invoices';
import { getOrganizationSettings } from '@/lib/settings';
import { requireStudentContext } from '@/lib/student';
import { prisma } from '@/lib/prisma';
import { Banknote, ReceiptText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentPaymentsPage() {
	const { student } = await requireStudentContext();
	const settings = await getOrganizationSettings();

	const invoices = await prisma.invoice.findMany({
		where: { studentId: student.id },
		orderBy: { dueDate: 'desc' },
		include: {
			payments: {
				orderBy: { paymentDate: 'desc' },
			},
		},
	});

	const computed = invoices.map((invoice) => {
		const paid = invoice.payments.reduce(
			(sum, payment) => sum + Number(payment.amountPaid),
			0,
		);
		const outstanding = Math.max(0, Number(invoice.amountDue) - paid);
		return {
			...invoice,
			paid,
			outstanding,
			status: resolveInvoiceStatus(invoice.status, invoice.dueDate),
		};
	});

	const totalBilled = computed.reduce(
		(sum, invoice) => sum + Number(invoice.amountDue),
		0,
	);
	const totalPaid = computed.reduce((sum, invoice) => sum + invoice.paid, 0);
	const totalOutstanding = computed.reduce(
		(sum, invoice) => sum + invoice.outstanding,
		0,
	);

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">Payments</h1>
					<p className="page-subtitle">
						Invoices issued to {student.studentNumber} and every recorded
						payment.
					</p>
				</div>
				<Badge
					variant={totalOutstanding > 0 ? 'danger' : 'success'}
					className="h-fit"
				>
					Outstanding: {formatMoney(totalOutstanding)}
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
						<ReceiptText className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">Total Billed</p>
						<p className="text-xl font-bold text-white">
							{formatMoney(totalBilled)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<Banknote className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">Total Paid</p>
						<p className="text-xl font-bold text-white">
							{formatMoney(totalPaid)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<Banknote className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">Outstanding</p>
						<p className="text-xl font-bold text-white">
							{formatMoney(totalOutstanding)}
						</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Invoice History</CardTitle>
					<CardDescription>
						Payments are recorded by hostel staff. Contact{' '}
						{settings.billingEmail} for billing questions.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{computed.length === 0 ? (
						<p className="text-sm text-slate-400">No invoices issued yet.</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Period</TableHead>
									<TableHead>Due</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Paid</TableHead>
									<TableHead>Outstanding</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{computed.map((invoice) => (
									<TableRow key={invoice.id}>
										<TableCell className="whitespace-nowrap text-xs">
											{formatDateOnly(invoice.periodStart)} →{' '}
											{formatDateOnly(invoice.periodEnd)}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{formatDateOnly(invoice.dueDate)}
										</TableCell>
										<TableCell>{formatMoney(invoice.amountDue.toString())}</TableCell>
										<TableCell className="text-emerald-300">
											{formatMoney(invoice.paid)}
										</TableCell>
										<TableCell
											className={
												invoice.outstanding > 0
													? 'text-rose-300'
													: 'text-slate-400'
											}
										>
											{formatMoney(invoice.outstanding)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													invoice.status === 'PAID'
														? 'success'
														: invoice.status === 'OVERDUE'
															? 'danger'
															: 'warning'
												}
											>
												{invoice.status}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recorded Payments</CardTitle>
					<CardDescription>
						Payment method and reference are recorded by the hostel office.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{computed.every((invoice) => invoice.payments.length === 0) ? (
						<p className="text-sm text-slate-400">
							No payments have been recorded yet.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Payment Date</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead>Amount</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{computed
									.flatMap((invoice) =>
										invoice.payments.map((payment) => ({
											...payment,
											invoiceId: invoice.id,
										})),
									)
									.sort(
										(a, b) =>
											b.paymentDate.getTime() - a.paymentDate.getTime(),
									)
									.map((payment) => (
										<TableRow key={payment.id}>
											<TableCell className="whitespace-nowrap text-xs">
												{formatDateOnly(payment.paymentDate)}
											</TableCell>
											<TableCell>{payment.method}</TableCell>
											<TableCell className="font-mono text-xs text-slate-400">
												{payment.reference ?? '—'}
											</TableCell>
											<TableCell className="text-emerald-300">
												{formatMoney(payment.amountPaid.toString())}
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
