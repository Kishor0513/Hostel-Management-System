import DashboardCharts from '@/components/dashboard/DashboardCharts';
import KpiCard from '@/components/dashboard/KpiCard';
import { Button } from '@/components/ui/button';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type DashboardData = {
	availableBeds: number;
	occupiedBeds: number;
	occupancyPct: number;
	totalOutstanding: number;
	attendanceOverallRate: number;
	openTickets: number;
	paymentsTrend: Array<{ label: string; value: number }>;
	attendanceTrend: Array<{ label: string; value: number }>;
	ticketBarData: Array<{
		status: string;
		maintenance: number;
		complaints: number;
	}>;
	dataError: string | null;
};

function formatMoney(n: number) {
	return n.toFixed(2);
}

function getEmptyDashboardData(): DashboardData {
	const now = new Date();
	const paymentsTrend: Array<{ label: string; value: number }> = [];
	const startPayments = new Date(now);
	startPayments.setMonth(startPayments.getMonth() - 5);
	startPayments.setDate(1);

	while (startPayments <= now) {
		paymentsTrend.push({
			label: startPayments.toISOString().slice(5, 7),
			value: 0,
		});
		startPayments.setMonth(startPayments.getMonth() + 1);
	}

	const attendanceTrend: Array<{ label: string; value: number }> = [];
	const attendanceStart = new Date(now);
	attendanceStart.setDate(attendanceStart.getDate() - 29);
	for (let i = 0; i < 30; i++) {
		const d = new Date(attendanceStart);
		d.setDate(attendanceStart.getDate() + i);
		attendanceTrend.push({ label: d.toISOString().slice(5, 10), value: 0 });
	}

	return {
		availableBeds: 0,
		occupiedBeds: 0,
		occupancyPct: 0,
		totalOutstanding: 0,
		attendanceOverallRate: 0,
		openTickets: 0,
		paymentsTrend,
		attendanceTrend,
		ticketBarData: [
			{ status: 'OPEN', maintenance: 0, complaints: 0 },
			{ status: 'IN_PROGRESS', maintenance: 0, complaints: 0 },
			{ status: 'CLOSED', maintenance: 0, complaints: 0 },
		],
		dataError: null,
	};
}

async function loadDashboardData(): Promise<DashboardData> {
	const fallback = getEmptyDashboardData();

	try {
		const [totalBeds, occupiedBeds] = await Promise.all([
			prisma.bed.count(),
			prisma.allocation.count({ where: { endDate: null } }),
		]);

		const availableBeds = Math.max(0, totalBeds - occupiedBeds);
		const occupancyPct = totalBeds ? occupiedBeds / totalBeds : 0;

		const now = new Date();
		const fromPayments = new Date(now);
		fromPayments.setMonth(fromPayments.getMonth() - 5);

		const payments = await prisma.payment.findMany({
			where: { paymentDate: { gte: fromPayments } },
			select: { paymentDate: true, amountPaid: true },
			orderBy: { paymentDate: 'asc' },
		});

		const byMonth = new Map<string, number>();
		for (const p of payments) {
			const label = p.paymentDate.toISOString().slice(0, 7);
			byMonth.set(label, (byMonth.get(label) ?? 0) + Number(p.amountPaid));
		}

		const paymentsTrend: Array<{ label: string; value: number }> = [];
		const cursor = new Date(fromPayments);
		cursor.setDate(1);
		while (cursor <= now) {
			const key = cursor.toISOString().slice(0, 7);
			paymentsTrend.push({ label: key.slice(5), value: byMonth.get(key) ?? 0 });
			cursor.setMonth(cursor.getMonth() + 1);
		}

		const fromAttendance = new Date(now);
		fromAttendance.setDate(fromAttendance.getDate() - 29);

		const attendanceRecords = await prisma.attendanceRecord.findMany({
			where: { date: { gte: fromAttendance } },
			select: { date: true, status: true },
		});

		const byDay = new Map<string, { present: number; total: number }>();
		for (const r of attendanceRecords) {
			const key = r.date.toISOString().slice(0, 10);
			const cur = byDay.get(key) ?? { present: 0, total: 0 };
			cur.total += 1;
			if (r.status === 'PRESENT') cur.present += 1;
			byDay.set(key, cur);
		}

		const attendanceTrend: Array<{ label: string; value: number }> = [];
		const start = new Date(fromAttendance);
		for (let i = 0; i < 30; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			const key = d.toISOString().slice(0, 10);
			const cur = byDay.get(key);
			attendanceTrend.push({
				label: d.toISOString().slice(5, 10),
				value: cur && cur.total ? cur.present / cur.total : 0,
			});
		}

		const [maintenanceGroups, complaintGroups, invoicesForOutstanding] =
			await Promise.all([
				prisma.maintenanceRequest.groupBy({
					by: ['status'],
					_count: { id: true },
				}),
				prisma.complaintTicket.groupBy({
					by: ['status'],
					_count: { id: true },
				}),
				prisma.invoice.findMany({
					select: {
						amountDue: true,
						payments: { select: { amountPaid: true } },
					},
				}),
			]);

		const mCounts: Record<string, number> = {};
		for (const g of maintenanceGroups) mCounts[g.status] = g._count.id;
		const cCounts: Record<string, number> = {};
		for (const g of complaintGroups) cCounts[g.status] = g._count.id;

		const ticketBarData = [
			{
				status: 'OPEN',
				maintenance: mCounts.OPEN ?? 0,
				complaints: cCounts.OPEN ?? 0,
			},
			{
				status: 'IN_PROGRESS',
				maintenance: mCounts.IN_PROGRESS ?? 0,
				complaints: cCounts.IN_PROGRESS ?? 0,
			},
			{
				status: 'CLOSED',
				maintenance: mCounts.DONE ?? 0,
				complaints: cCounts.RESOLVED ?? 0,
			},
		];

		const totalOutstanding = invoicesForOutstanding.reduce((sum, inv) => {
			const paid = inv.payments.reduce((s, p) => s + Number(p.amountPaid), 0);
			const outstanding = Number(inv.amountDue) - paid;
			return sum + Math.max(0, outstanding);
		}, 0);

		const presentCount = attendanceRecords.filter(
			(r) => r.status === 'PRESENT',
		).length;
		const totalCount = attendanceRecords.length;
		const attendanceOverallRate = totalCount ? presentCount / totalCount : 0;

		return {
			availableBeds,
			occupiedBeds,
			occupancyPct,
			totalOutstanding,
			attendanceOverallRate,
			openTickets: (mCounts.OPEN ?? 0) + (cCounts.OPEN ?? 0),
			paymentsTrend,
			attendanceTrend,
			ticketBarData,
			dataError: null,
		};
	} catch {
		return {
			...fallback,
			dataError:
				'Database connection failed. Check DATABASE_URL in .env to load live dashboard data.',
		};
	}
}

export default async function AdminDashboardPage() {
	await requireRole(['ADMIN', 'STAFF']);
	const data = await loadDashboardData();
	const now = new Date();

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="glass-hover rounded-3xl border border-white/12 bg-slate-950/70 px-4 py-4 shadow-[0_20px_56px_rgba(3,8,24,0.5)] backdrop-blur-2xl lg:px-6 lg:py-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
							Overview
						</p>
						<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.2rem]">
							Dashboard
						</h1>
						<p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
							Live occupancy, billing health, and support pulse from your hostel
							data.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="secondary"
							className="h-9 border-white/12 bg-white/10 text-slate-100 hover:bg-white/15"
						>
							Export Report
						</Button>
						<Button className="h-9 bg-sky-500 text-white shadow-[0_10px_24px_rgba(2,132,199,0.34)] hover:bg-sky-400">
							Create Announcement
						</Button>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 group/snapshot-grid">
					<div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/10">
						<p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
							Snapshot Date
						</p>
						<p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
							{now.toLocaleDateString('en-US', {
								weekday: 'short',
								day: '2-digit',
								month: 'short',
								year: 'numeric',
							})}
						</p>
					</div>
					<div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/10">
						<p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
							Occupied Beds
						</p>
						<p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
							{data.occupiedBeds}
						</p>
					</div>
					<div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/10">
						<p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
							Open Tickets
						</p>
						<p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
							{data.openTickets}
						</p>
					</div>
				</div>
			</div>

			{data.dataError ? (
				<div className="rounded-xl border border-amber-400/45 bg-amber-500/14 px-3 py-2 text-xs font-medium text-amber-100">
					{data.dataError}
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 group/kpi-grid">
				<div className="transition-opacity duration-300 group-hover/kpi-grid:opacity-60 hover:opacity-100!">
					<KpiCard
						label="Occupancy"
						value={`${(data.occupancyPct * 100).toFixed(0)}%`}
						helper={`${data.occupiedBeds} occupied / ${data.availableBeds} available`}
					/>
				</div>
				<div className="transition-opacity duration-300 group-hover/kpi-grid:opacity-60 hover:opacity-100!">
					<KpiCard
						label="Outstanding Fees"
						value={formatMoney(data.totalOutstanding)}
						helper="Sum of unpaid invoice balances"
					/>
				</div>
				<div className="transition-opacity duration-300 group-hover/kpi-grid:opacity-60 hover:opacity-100!">
					<KpiCard
						label="Attendance Rate"
						value={`${(data.attendanceOverallRate * 100).toFixed(0)}%`}
						helper="Across last 30 days"
					/>
				</div>
				<div className="transition-opacity duration-300 group-hover/kpi-grid:opacity-60 hover:opacity-100!">
					<KpiCard
						label="Open Tickets"
						value={`${data.openTickets}`}
						helper="Maintenance + Complaints"
					/>
				</div>
			</div>

			<DashboardCharts
				occupancy={{
					occupied: data.occupiedBeds,
					available: data.availableBeds,
				}}
				paymentsTrend={data.paymentsTrend}
				attendanceTrend={data.attendanceTrend}
				ticketBarData={data.ticketBarData}
			/>
		</div>
	);
}
