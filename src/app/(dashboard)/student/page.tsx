import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import KpiCard from '@/components/dashboard/KpiCard';
import { prisma } from '@/lib/prisma';
import {
	formatDateOnly,
	formatMoney,
	formatPercent,
} from '@/lib/format';
import { resolveInvoiceStatus } from '@/lib/invoices';
import { getOrganizationSettings } from '@/lib/settings';
import { requireStudentContext } from '@/lib/student';
import { BedDouble, CalendarCheck2, ReceiptText, Wrench } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentOverviewPage() {
	const { user, student, activeAllocation } = await requireStudentContext();
	const settings = await getOrganizationSettings();

	const fromAttendance = new Date();
	fromAttendance.setDate(fromAttendance.getDate() - 29);

	const [invoices, attendance, openComplaints, openMaintenance, announcements] =
		await Promise.all([
			prisma.invoice.findMany({
				where: { studentId: student.id },
				orderBy: { dueDate: 'desc' },
				take: 6,
				include: { payments: { select: { amountPaid: true } } },
			}),
			prisma.attendanceRecord.findMany({
				where: {
					studentId: student.id,
					date: { gte: fromAttendance },
				},
				orderBy: { date: 'desc' },
			}),
			prisma.complaintTicket.count({
				where: {
					studentId: student.id,
					status: { not: 'RESOLVED' },
				},
			}),
			prisma.maintenanceRequest.count({
				where: {
					studentId: student.id,
					status: { not: 'DONE' },
				},
			}),
			prisma.announcement.findMany({
				where: { isPublished: true },
				orderBy: { publishedAt: 'desc' },
				take: 3,
				select: { id: true, title: true, content: true, publishedAt: true },
			}),
		]);

	const outstanding = invoices.reduce((sum, invoice) => {
		const paid = invoice.payments.reduce(
			(total, payment) => total + Number(payment.amountPaid),
			0,
		);
		return sum + Math.max(0, Number(invoice.amountDue) - paid);
	}, 0);

	const presentDays = attendance.filter((r) => r.status === 'PRESENT').length;
	const attendanceRate = attendance.length
		? presentDays / attendance.length
		: 0;
	const latestInvoice = invoices[0] ?? null;
	const latestInvoiceStatus = latestInvoice
		? resolveInvoiceStatus(latestInvoice.status, latestInvoice.dueDate)
		: null;

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">
						Welcome, {user.name.split(' ')[0] ?? 'Student'}
					</h1>
					<p className="page-subtitle">
						Your room, billing, attendance, and hostel requests in one place.
					</p>
				</div>
				<Badge
					variant={activeAllocation ? 'success' : 'warning'}
					className="h-fit"
				>
					{activeAllocation
						? `${activeAllocation.bed.room.building} ${activeAllocation.bed.room.roomNumber}`
						: 'No room allocated'}
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<KpiCard
					label="Outstanding Balance"
					value={formatMoney(outstanding)}
					helper={
						outstanding > 0
							? 'See Payments for invoice details'
							: 'All invoices settled'
					}
				/>
				<KpiCard
					label="Attendance (30d)"
					value={formatPercent(attendanceRate)}
					helper={`${presentDays} present of ${attendance.length} days`}
				/>
				<KpiCard
					label="Open Requests"
					value={String(openComplaints + openMaintenance)}
					helper={`${openComplaints} complaints · ${openMaintenance} maintenance`}
				/>
				<KpiCard
					label="Student Number"
					value={student.studentNumber}
					helper={student.program ?? 'Program not set'}
				/>
			</div>

			<div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
									<BedDouble className="h-4 w-4" />
								</div>
								<div>
									<CardTitle>My Room</CardTitle>
									<CardDescription>
										Current allocation and bed details
									</CardDescription>
								</div>
							</div>
							<Link
								href="/student/room"
								className="text-xs font-semibold text-rose-300 hover:text-rose-200"
							>
								View details
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{activeAllocation ? (
							<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div>
									<p className="text-xs uppercase tracking-wide text-slate-500">
										Building
									</p>
									<p className="mt-1 font-semibold text-white">
										{activeAllocation.bed.room.building}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wide text-slate-500">
										Floor
									</p>
									<p className="mt-1 font-semibold text-white">
										{activeAllocation.bed.room.floor}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wide text-slate-500">
										Room
									</p>
									<p className="mt-1 font-semibold text-white">
										{activeAllocation.bed.room.roomNumber}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase tracking-wide text-slate-500">
										Bed
									</p>
									<p className="mt-1 font-semibold text-white">
										{activeAllocation.bed.bedNumber}
									</p>
								</div>
								<div className="col-span-2 md:col-span-4">
									<p className="text-xs uppercase tracking-wide text-slate-500">
										Allocated since
									</p>
									<p className="mt-1 text-slate-300">
										{formatDateOnly(activeAllocation.startDate)}
									</p>
								</div>
							</div>
						) : (
							<p className="text-sm text-slate-400">
								You do not have an active bed allocation. Contact the
								hostel office at {settings.supportEmail}.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
								<ReceiptText className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Latest Invoice</CardTitle>
								<CardDescription>Most recent billing period</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{latestInvoice ? (
							<>
								<div className="flex items-center justify-between">
									<span className="text-slate-400">Amount</span>
									<span className="font-semibold text-white">
										{formatMoney(latestInvoice.amountDue.toString())}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-400">Due</span>
									<span className="text-slate-200">
										{formatDateOnly(latestInvoice.dueDate)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-slate-400">Status</span>
									<Badge
										variant={
											latestInvoiceStatus === 'PAID'
												? 'success'
												: latestInvoiceStatus === 'OVERDUE'
													? 'danger'
													: 'warning'
										}
									>
										{latestInvoiceStatus}
									</Badge>
								</div>
								<Link
									href="/student/payments"
									className="mt-2 inline-flex text-xs font-semibold text-rose-300 hover:text-rose-200"
								>
									View all payments
								</Link>
							</>
						) : (
							<p className="text-slate-400">No invoices issued yet.</p>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
								<CalendarCheck2 className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Announcements</CardTitle>
								<CardDescription>Latest published notices</CardDescription>
							</div>
						</div>
						<Link
							href="/student/announcements"
							className="text-xs font-semibold text-rose-300 hover:text-rose-200"
						>
							View all
						</Link>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{announcements.length === 0 ? (
						<p className="text-sm text-slate-400">
							No announcements published yet.
						</p>
					) : (
						announcements.map((announcement) => (
							<div
								key={announcement.id}
								className="rounded-xl border border-white/10 bg-slate-900/40 p-4"
							>
								<div className="flex items-center justify-between gap-3">
									<p className="font-semibold text-white">
										{announcement.title}
									</p>
									<span className="text-xs text-slate-500">
										{announcement.publishedAt
											? formatDateOnly(announcement.publishedAt)
											: ''}
									</span>
								</div>
								<p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-slate-300">
									{announcement.content}
								</p>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-3">
				<Link
					href="/student/requests"
					className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/70"
				>
					<Wrench className="h-4 w-4 text-amber-300" />
					Raise a request
				</Link>
				<Link
					href="/student/attendance"
					className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900/70"
				>
					<CalendarCheck2 className="h-4 w-4 text-cyan-300" />
					View attendance
				</Link>
			</div>
		</div>
	);
}
