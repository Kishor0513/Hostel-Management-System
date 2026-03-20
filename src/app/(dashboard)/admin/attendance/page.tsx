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

import { recordAttendance as recordAttendanceAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
	await requireRole(['ADMIN', 'STAFF']);

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	let students: any[] = [];
	let recent: any[] = [];
	let attendanceForRate: any[] = [];
	let dataError: string | null = null;

	try {
		[students, recent, attendanceForRate] = await Promise.all([
			prisma.student.findMany({
				orderBy: { studentNumber: 'asc' },
				include: { user: { select: { id: true, name: true } } },
			}),
			prisma.attendanceRecord.findMany({
				take: 25,
				orderBy: { date: 'desc' },
				include: { student: { include: { user: { select: { name: true } } } } },
			}),
			prisma.attendanceRecord.findMany({
				where: {
					date: { gte: thirtyDaysAgo },
				},
			}),
		]);
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	const presentCount = attendanceForRate.filter(
		(r) => r.status === 'PRESENT',
	).length;
	const totalCount = attendanceForRate.length;
	const rate = totalCount ? presentCount / totalCount : 0;

	const todayStr = new Date().toISOString().slice(0, 10);

	return (
		<div className="space-y-6">
			{dataError ? (
				<div className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 text-sm text-amber-600">
					{dataError}
				</div>
			) : null}
			<Card>
				<CardHeader>
					<CardTitle>Record Attendance</CardTitle>
					<CardDescription>
						Upserts based on `(studentId, date)`.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={recordAttendanceAction}
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
							<Label htmlFor="date">Date</Label>
							<Input
								id="date"
								name="date"
								type="date"
								defaultValue={todayStr}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<select
								id="status"
								name="status"
								required
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
								<option value="PRESENT">Present</option>
								<option value="ABSENT">Absent</option>
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="note">Note (optional)</Label>
							<Input
								id="note"
								name="note"
								placeholder="e.g. Medical leave"
							/>
						</div>

						<div className="lg:col-span-5 flex items-end justify-end">
							<Button type="submit">Save Attendance</Button>
						</div>
					</form>

					<div className="mt-4 flex flex-wrap gap-2">
						<Badge variant={rate >= 0.8 ? 'success' : 'warning'}>
							Attendance Rate (last 30 days): {(rate * 100).toFixed(1)}%
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Recent Records</CardTitle>
					<CardDescription>Latest attendance entries.</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Student</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recent.map((r) => (
								<TableRow key={r.id}>
									<TableCell>{r.date.toISOString().slice(0, 10)}</TableCell>
									<TableCell className="text-white/80">
										{r.student?.user?.name}
										<div className="text-xs text-white/60">
											{r.student?.studentNumber}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={r.status === 'PRESENT' ? 'success' : 'danger'}
										>
											{r.status}
										</Badge>
									</TableCell>
								</TableRow>
							))}
							{recent.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="text-white/60"
									>
										No attendance records yet.
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
