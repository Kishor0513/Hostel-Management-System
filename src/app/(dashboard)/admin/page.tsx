import DashboardCharts from '@/components/dashboard/DashboardCharts';
import KpiCard from '@/components/dashboard/KpiCard';
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

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-white/95">Dashboard</h1>
					<p className="text-xs text-white/60">
						Real-time metrics backed by your hostel database.
					</p>
				</div>
			</div>

			{data.dataError ? (
				<div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
					{data.dataError}
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-2 md:grid-cols-4">
				<KpiCard
					label="Occupancy"
					value={`${(data.occupancyPct * 100).toFixed(0)}%`}
					helper={`${data.occupiedBeds} occupied / ${data.availableBeds} available`}
				/>
				<KpiCard
					label="Outstanding Fees"
					value={formatMoney(data.totalOutstanding)}
					helper="Sum of unpaid invoice balances"
				/>
				<KpiCard
					label="Attendance Rate"
					value={`${(data.attendanceOverallRate * 100).toFixed(0)}%`}
					helper="Across last 30 days"
				/>
				<KpiCard
					label="Open Tickets"
					value={`${data.openTickets}`}
					helper="Maintenance + Complaints"
				/>
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
