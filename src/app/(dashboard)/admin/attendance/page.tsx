import type { Prisma } from '@/generated/prisma/client';
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
	ListFilters,
	ListPagination,
} from '@/components/ui/list-controls';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth';
import {
	getPageParam,
	getSearchParam,
	paginate,
	type SearchParamsRecord,
} from '@/lib/list';
import { prisma } from '@/lib/prisma';
import { Activity, Calendar, ClipboardCheck } from 'lucide-react';

import { recordAttendance as recordAttendanceAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AttendancePage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	await requireRole(['ADMIN', 'STAFF']);

	const params = await searchParams;
	const q = getSearchParam(params, 'q').trim();
	const requestedPage = getPageParam(params);
	const rawStatus = getSearchParam(params, 'status');
	const status =
		rawStatus === 'PRESENT' || rawStatus === 'ABSENT' ? rawStatus : '';
	const dateParam = getSearchParam(params, 'date');
	const attendanceDate =
		/^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
		!Number.isNaN(new Date(`${dateParam}T00:00:00.000Z`).getTime())
			? new Date(`${dateParam}T00:00:00.000Z`)
			: null;
	const dateFilter = attendanceDate ? dateParam : '';

	const getStudents = () =>
		prisma.student.findMany({
			orderBy: { studentNumber: 'asc' },
			include: { user: { select: { id: true, name: true } } },
		});

	const getRecent = (
		where: Prisma.AttendanceRecordWhereInput,
		skip: number,
		take: number,
	) =>
		prisma.attendanceRecord.findMany({
			where,
			skip,
			take,
			orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
			include: { student: { include: { user: { select: { name: true } } } } },
		});

	const getAttendanceForRate = (thirtyDaysAgo: Date) =>
		prisma.attendanceRecord.findMany({
			where: {
				date: { gte: thirtyDaysAgo },
			},
		});

	type StudentsResult = Awaited<ReturnType<typeof getStudents>>;
	type RecentResult = Awaited<ReturnType<typeof getRecent>>;
	type AttendanceForRateResult = Awaited<
		ReturnType<typeof getAttendanceForRate>
	>;

	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	let students: StudentsResult = [];
	let recent: RecentResult = [];
	let attendanceForRate: AttendanceForRateResult = [];
	let totalItems = 0;
	let page = requestedPage;
	let dataError: string | null = null;

	const searchWhere: Prisma.AttendanceRecordWhereInput | null = q
		? {
				student: {
					OR: [
						{ studentNumber: { contains: q, mode: 'insensitive' } },
						{ user: { name: { contains: q, mode: 'insensitive' } } },
					],
				},
			}
		: null;
	const listWhere: Prisma.AttendanceRecordWhereInput = {
		...(searchWhere ?? {}),
		...(status ? { status } : {}),
		...(attendanceDate ? { date: attendanceDate } : {}),
	};

	try {
		const [studentsResult, rateRecords, filteredCount] =
			await Promise.all([
				getStudents(),
				getAttendanceForRate(thirtyDaysAgo),
				prisma.attendanceRecord.count({ where: listWhere }),
			]);

		students = studentsResult;
		attendanceForRate = rateRecords;
		totalItems = filteredCount;

		const pagination = paginate(totalItems, requestedPage);
		page = pagination.page;
		recent = await getRecent(
			listWhere,
			pagination.skip,
			pagination.take,
		);
	} catch (error) {
		console.error('[page] failed to load data', error);
		dataError = 'Could not load data. Please try again.';
	}

	const presentCount = attendanceForRate.filter(
		(r) => r.status === 'PRESENT',
	).length;
	const totalCount = attendanceForRate.length;
	const rate = totalCount ? presentCount / totalCount : 0;

	const pagination = paginate(totalItems, page);
	const hasActiveFilters = Boolean(q || status || dateFilter);

	const todayStr = new Date().toISOString().slice(0, 10);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Attendance Tracking</h1>
					<p className="page-subtitle">
						Record and monitor daily student presence.
					</p>
				</div>
				<Badge
					variant={rate >= 0.8 ? 'success' : 'warning'}
					className="h-fit"
				>
					Overall Rate: {(rate * 100).toFixed(1)}%
				</Badge>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span> {dataError}
				</div>
			) : null}

			{/* Record Form */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
							<ClipboardCheck className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Record Attendance</CardTitle>
							<CardDescription>Record daily attendance logs</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={recordAttendanceAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-1.5 lg:col-span-2">
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
							<Label htmlFor="date">Date</Label>
							<Input
								id="date"
								name="date"
								type="date"
								defaultValue={todayStr}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="status">Status</Label>
							<select
								id="status"
								name="status"
								required
								className="select-field"
							>
								<option value="PRESENT">Present</option>
								<option value="ABSENT">Absent</option>
							</select>
						</div>
						<div className="space-y-1.5 lg:col-span-1">
							<Label htmlFor="note">Note (optional)</Label>
							<Input
								id="note"
								name="note"
								placeholder="Remark..."
							/>
						</div>
						<div className="lg:col-span-5 flex justify-end">
							<Button
								type="submit"
								className="bg-rose-600 hover:bg-rose-500 font-bold px-6 shadow-[0_10px_24px_rgba(225,29,72,0.3)]"
							>
								Save Attendance
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* History */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
							<Activity className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Recent Records</CardTitle>
							<CardDescription>Recent attendance history feed</CardDescription>
						</div>
					</div>
					<ListFilters
						action="/admin/attendance"
						searchValue={q}
						searchPlaceholder="Search student name or number"
						filters={[
							{
								name: 'status',
								label: 'Attendance status',
								value: status,
								options: [
									{ value: '', label: 'All statuses' },
									{ value: 'PRESENT', label: 'Present' },
									{ value: 'ABSENT', label: 'Absent' },
								],
							},
							{
								type: 'date',
								name: 'date',
								label: 'Attendance date',
								value: dateFilter,
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date / Time</TableHead>
								<TableHead>Student Details</TableHead>
								<TableHead>Attendance Status</TableHead>
								<TableHead className="w-45">Remarks</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recent.map((r) => (
								<TableRow key={r.id}>
									<TableCell>
										<div className="flex items-center gap-2 font-bold text-white/95 text-base tracking-tight">
											<Calendar className="h-4 w-4 text-slate-500" />
											{r.date.toISOString().slice(0, 10)}
										</div>
									</TableCell>
									<TableCell>
										<div className="space-y-0.5">
											<div className="font-semibold text-white/90">
												{r.student?.user?.name}
											</div>
											<div className="text-[0.65rem] text-slate-500 tracking-wider uppercase">
												{r.student?.studentNumber}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={r.status === 'PRESENT' ? 'success' : 'danger'}
											className="px-3 py-0.5"
										>
											{r.status === 'PRESENT' ? 'PRESENT' : 'ABSENT'}
										</Badge>
									</TableCell>
									<TableCell className="text-xs text-slate-400 italic">
										{r.note || '— No remarks —'}
									</TableCell>
								</TableRow>
							))}
							{recent.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4}>
										<div className="data-empty">
											<Activity className="data-empty-icon" />
											<p>
												{hasActiveFilters
													? 'No attendance records match these filters.'
													: 'No records found. Start marking presence above.'}
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
					<ListPagination
						basePath="/admin/attendance"
						{...pagination}
						totalItems={totalItems}
						params={{ q, status, date: dateFilter }}
						itemLabel="records"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
