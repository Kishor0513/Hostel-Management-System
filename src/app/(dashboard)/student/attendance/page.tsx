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
import { formatDateOnly, formatPercent } from '@/lib/format';
import { requireStudentContext } from '@/lib/student';
import { prisma } from '@/lib/prisma';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentAttendancePage() {
	const { student } = await requireStudentContext();

	const from = new Date();
	from.setDate(from.getDate() - 59);

	const records = await prisma.attendanceRecord.findMany({
		where: {
			studentId: student.id,
			date: { gte: from },
		},
		orderBy: { date: 'desc' },
	});

	const present = records.filter((record) => record.status === 'PRESENT').length;
	const absent = records.length - present;
	const rate = records.length ? present / records.length : 0;

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">Attendance</h1>
					<p className="page-subtitle">
						Attendance recorded by hostel staff over the last 60 days.
					</p>
				</div>
				<Badge
					variant={rate >= 0.75 ? 'success' : 'warning'}
					className="h-fit"
				>
					{formatPercent(rate)} present
				</Badge>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<CalendarCheck2 className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">Present</p>
						<p className="text-xl font-bold text-white">{present}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<CalendarX2 className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">Absent</p>
						<p className="text-xl font-bold text-white">{absent}</p>
					</div>
				</div>
				<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
						<CalendarCheck2 className="h-4 w-4" />
					</div>
					<div>
						<p className="text-xs font-medium text-slate-400">
							Days Recorded
						</p>
						<p className="text-xl font-bold text-white">{records.length}</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Daily Records</CardTitle>
					<CardDescription>
						Only days recorded by the hostel office are shown.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{records.length === 0 ? (
						<p className="text-sm text-slate-400">
							No attendance records in the last 60 days.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Note</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{records.map((record) => (
									<TableRow key={record.id}>
										<TableCell className="whitespace-nowrap">
											{formatDateOnly(record.date)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													record.status === 'PRESENT'
														? 'success'
														: 'danger'
												}
											>
												{record.status}
											</Badge>
										</TableCell>
										<TableCell className="text-xs text-slate-400">
											{record.note ?? '—'}
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
