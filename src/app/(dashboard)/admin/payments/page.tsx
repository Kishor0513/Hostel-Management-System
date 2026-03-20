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

import {
	createInvoice as createInvoiceAction,
	recordPayment as recordPaymentAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let students: any[] = [];
	let invoices: any[] = [];
	let dataError: string | null = null;

	try {
		[students, invoices] = await Promise.all([
			prisma.student.findMany({
				orderBy: { studentNumber: 'asc' },
				include: { user: { select: { name: true } } },
			}),
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
			}),
		]);
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
			{dataError ? (
				<div className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 text-sm text-amber-600">
					{dataError}
				</div>
			) : null}
			<Card>
				<CardHeader>
					<CardTitle>Payments</CardTitle>
					<CardDescription>
						Create invoices and record payments.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap gap-2">
						<Badge variant={totalOutstanding > 0 ? 'warning' : 'success'}>
							Total outstanding: {totalOutstanding.toFixed(2)}
						</Badge>
					</div>

					<form
						action={createInvoiceAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-2">
							<Label htmlFor="studentId">Student</Label>
							<select
								id="studentId"
								name="studentId"
								required
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
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
						<div className="space-y-2">
							<Label htmlFor="periodStart">Period Start</Label>
							<Input
								id="periodStart"
								name="periodStart"
								type="date"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="periodEnd">Period End</Label>
							<Input
								id="periodEnd"
								name="periodEnd"
								type="date"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="dueDate">Due Date</Label>
							<Input
								id="dueDate"
								name="dueDate"
								type="date"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="amountDue">Amount Due</Label>
							<Input
								id="amountDue"
								name="amountDue"
								type="number"
								step="0.01"
								min="0.01"
								required
							/>
						</div>
						<div className="lg:col-span-5 flex items-end justify-end">
							<Button type="submit">Create Invoice</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Invoice List</CardTitle>
					<CardDescription>
						Outstanding is computed from recorded payments.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead className="w-[140px]">Period</TableHead>
								<TableHead className="w-[130px]">Due</TableHead>
								<TableHead className="w-[150px]">Outstanding</TableHead>
								<TableHead className="w-[140px]">Status</TableHead>
								<TableHead>Record Payment</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invoicesComputed.map((inv) => (
								<TableRow key={inv.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">
												{inv.student.user.name}
											</div>
											<div className="text-xs text-white/60">
												{inv.studentId}
											</div>
										</div>
									</TableCell>
									<TableCell className="text-white/70">
										{inv.periodStart.toISOString().slice(0, 10)} →{' '}
										{inv.periodEnd.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell>
										{inv.dueDate.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell>
										<Badge
											variant={inv.outstanding > 0 ? 'warning' : 'success'}
										>
											{inv.outstanding.toFixed(2)}
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
									<TableCell>
										{inv.outstanding > 0 ? (
											<form
												action={recordPaymentAction}
												className="space-y-2"
											>
												<input
													type="hidden"
													name="invoiceId"
													value={inv.id}
												/>
												<div className="flex flex-wrap gap-2">
													<Input
														name="amountPaid"
														type="number"
														step="0.01"
														min="0.01"
														placeholder="Amount"
														required
													/>
													<Input
														name="paymentDate"
														type="date"
													/>
													<Input
														name="method"
														placeholder="Cash/UPI/Card"
														required
													/>
													<Input
														name="reference"
														placeholder="Ref (optional)"
													/>
												</div>
												<Button type="submit">Pay</Button>
											</form>
										) : (
											<span className="text-white/55">Paid</span>
										)}
									</TableCell>
								</TableRow>
							))}
							{invoicesComputed.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-white/60"
									>
										No invoices found.
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
