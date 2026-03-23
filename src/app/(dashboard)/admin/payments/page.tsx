import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Banknote, Receipt, UserPlus } from 'lucide-react';

import {
	createInvoice as createInvoiceAction,
	recordPayment as recordPaymentAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	const getStudents = () =>
		prisma.student.findMany({
			orderBy: { studentNumber: 'asc' },
			include: { user: { select: { name: true } } },
		});

	const getInvoices = () =>
		prisma.invoice.findMany({
			orderBy: { dueDate: 'desc' },
			take: 15,
			include: {
				student: {
					include: { user: { select: { name: true, email: true } } },
				},
				payments: {
					select: { amountPaid: true, paymentDate: true, method: true },
				},
			},
		});

	type StudentsResult = Awaited<ReturnType<typeof getStudents>>;
	type InvoicesResult = Awaited<ReturnType<typeof getInvoices>>;

	let students: StudentsResult = [];
	let invoices: InvoicesResult = [];
	let dataError: string | null = null;

	try {
		[students, invoices] = await Promise.all([getStudents(), getInvoices()]);
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	const invoicesComputed = invoices.map((inv) => {
		const paid = inv.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
		const outstanding = Number(inv.amountDue) - paid;
		return { ...inv, paid, outstanding: Math.max(0, outstanding) };
	});

	const totalOutstanding = invoicesComputed.reduce(
		(sum, i) => sum + i.outstanding,
		0,
	);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Payments</h1>
					<p className="page-subtitle">
						Manage billing, invoices, and student payments.
					</p>
				</div>
				<Badge
					variant={totalOutstanding > 0 ? 'danger' : 'success'}
					className="h-fit"
				>
					Outstanding: NPR {totalOutstanding.toFixed(2)}
				</Badge>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span> {dataError}
				</div>
			) : null}

			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<Banknote className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">
							Outstanding
						</div>
						<div className="text-xl font-bold text-white">
							NPR {totalOutstanding.toFixed(0)}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<Receipt className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Invoices</div>
						<div className="text-xl font-bold text-white">
							{invoices.length}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
						<UserPlus className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Students</div>
						<div className="text-xl font-bold text-white">
							{students.length}
						</div>
					</div>
				</div>
			</div>

			{/* Create Invoice */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
							<Receipt className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Create Invoice</CardTitle>
							<CardDescription>Create a new invoice</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createInvoiceAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-1.5 lg:col-span-1">
							<Label htmlFor="studentId">Student</Label>
							<select
								id="studentId"
								name="studentId"
								required
								className="select-field"
							>
								<option value="">Select Student</option>
								{students.map((s) => (
									<option
										key={s.id}
										value={s.id}
									>
										{s.user.name} ({s.studentNumber})
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="periodStart">Start Date</Label>
							<Input
								id="periodStart"
								name="periodStart"
								type="date"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="periodEnd">End Date</Label>
							<Input
								id="periodEnd"
								name="periodEnd"
								type="date"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="dueDate">Due Date</Label>
							<Input
								id="dueDate"
								name="dueDate"
								type="date"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="amountDue">Amount (NPR)</Label>
							<Input
								id="amountDue"
								name="amountDue"
								type="number"
								step="0.01"
								min="0.01"
								required
							/>
						</div>
						<div className="lg:col-span-5 flex justify-end pt-1">
							<Button
								type="submit"
								size="sm"
								className="bg-rose-600 hover:bg-rose-500"
							>
								Create Invoice
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Invoice List */}
			<Card>
				<CardHeader>
					<CardTitle>Invoice List</CardTitle>
					<CardDescription>List of all invoices</CardDescription>
				</CardHeader>
				<CardContent className="p-0 px-0 pb-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead className="w-35">Period</TableHead>
								<TableHead className="w-27.5">Due</TableHead>
								<TableHead className="w-32.5">Outstanding</TableHead>
								<TableHead className="w-27.5">Status</TableHead>
								<TableHead>Update Payment</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoicesComputed.map((inv) => (
								<TableRow key={inv.id}>
									<TableCell>
										<div className="space-y-0.5">
											<div className="font-semibold text-white/95">
												{inv.student.user.name}
											</div>
											<div className="text-[0.65rem] text-slate-500 uppercase tracking-wider">
												{inv.studentId.slice(0, 8)}...
											</div>
										</div>
									</TableCell>
									<TableCell className="text-xs text-slate-400">
										{inv.periodStart.toISOString().slice(0, 10)} —{' '}
										{inv.periodEnd.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell className="text-xs font-medium text-slate-300">
										{inv.dueDate.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell>
										<Badge
											variant={inv.outstanding > 0 ? 'warning' : 'success'}
										>
											NPR {inv.outstanding.toFixed(2)}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												inv.status === 'PAID'
													? 'success'
													: inv.status === 'OVERDUE'
														? 'danger'
														: 'warning'
											}
										>
											{inv.status}
										</Badge>
									</TableCell>
									<TableCell className="max-w-60">
										{inv.outstanding > 0 ? (
											<form
												action={recordPaymentAction}
												className="flex flex-col gap-2 py-1"
											>
												<input
													type="hidden"
													name="invoiceId"
													value={inv.id}
												/>
												<div className="grid grid-cols-2 gap-2">
													<Input
														name="amountPaid"
														type="number"
														step="0.01"
														placeholder="Amt"
														size={1}
														className="h-8 text-xs"
													/>
													<Input
														name="method"
														placeholder="Method"
														className="h-8 text-xs"
													/>
												</div>
												<Button
													type="submit"
													size="sm"
													className="h-7 text-[0.65rem]"
												>
													Record
												</Button>
											</form>
										) : (
											<span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
												Fully Paid
											</span>
										)}
									</TableCell>
								</TableRow>
							))}
							{invoicesComputed.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6}>
										<div className="data-empty">
											<Receipt className="data-empty-icon" />
											<p>No invoices found. Create one above.</p>
										</div>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
