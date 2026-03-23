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
	CheckCircle2,
	Clock,
	History,
	Plus,
	UserCheck,
	Wrench,
} from 'lucide-react';

import { createMaintenanceRequest, updateMaintenanceStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
	await requireRole(['ADMIN', 'STAFF']);

	type StaffResult = Awaited<ReturnType<typeof prisma.staff.findMany>>;
	type StudentsResult = Awaited<ReturnType<typeof prisma.student.findMany>>;
	type RoomsResult = Awaited<ReturnType<typeof prisma.room.findMany>>;
	type RequestsResult = Awaited<
		ReturnType<typeof prisma.maintenanceRequest.findMany>
	>;

	let staff: StaffResult = [];
	let students: StudentsResult = [];
	let rooms: RoomsResult = [];
	let requests: RequestsResult = [];
	let dataError: string | null = null;

	try {
		[staff, students, rooms, requests] = await Promise.all([
			prisma.staff.findMany({
				orderBy: { staffCode: 'asc' },
				include: { user: { select: { name: true, email: true } } },
			}),
			prisma.student.findMany({
				orderBy: { studentNumber: 'asc' },
				include: { user: { select: { name: true } } },
			}),
			prisma.room.findMany({
				orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
				select: { id: true, building: true, floor: true, roomNumber: true },
			}),
			prisma.maintenanceRequest.findMany({
				orderBy: { createdAt: 'desc' },
				include: {
					student: { include: { user: { select: { name: true } } } },
					room: { select: { building: true, floor: true, roomNumber: true } },
					assignedToStaff: { include: { user: { select: { name: true } } } },
					logs: { orderBy: { changedAt: 'desc' }, take: 1 },
				},
				take: 20,
			}),
		]);
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	const pendingCount = requests.filter((r) => r.status !== 'DONE').length;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Maintenance</h1>
					<p className="page-subtitle">
						Track and manage facility repair requests and staff assignments.
					</p>
				</div>
				<Badge
					variant={pendingCount > 0 ? 'warning' : 'success'}
					className="h-fit"
				>
					Pending Issues: {pendingCount}
				</Badge>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span> {dataError}
				</div>
			) : null}

			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3 shadow-lg">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<Wrench className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Total</div>
						<div className="text-xl font-bold text-white tracking-tight">
							{requests.length}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3 shadow-lg">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
						<Clock className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Pending</div>
						<div className="text-xl font-bold text-white tracking-tight">
							{pendingCount}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3 shadow-lg">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<CheckCircle2 className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Solved</div>
						<div className="text-xl font-bold text-white tracking-tight">
							{requests.length - pendingCount}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3 shadow-lg">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
						<UserCheck className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400 font-medium">Staff</div>
						<div className="text-xl font-bold text-white tracking-tight">
							{staff.length}
						</div>
					</div>
				</div>
			</div>

			{/* Create Request */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
							<Plus className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>New Maintenance Request</CardTitle>
							<CardDescription>Create a new maintenance issue</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createMaintenanceRequest}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-1.5 lg:col-span-2">
							<Label htmlFor="title">Issue Title</Label>
							<Input
								id="title"
								name="title"
								required
								placeholder="Ex: Clogged drain / Fan not working"
							/>
						</div>
						<div className="space-y-1.5 lg:col-span-3">
							<Label htmlFor="description">Details</Label>
							<Input
								id="description"
								name="description"
								required
								placeholder="Provide more context for staff..."
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="studentId">Student</Label>
							<select
								id="studentId"
								name="studentId"
								className="select-field"
							>
								<option value="">— Select Student —</option>
								{students.map((s) => (
									<option
										key={s.id}
										value={s.id}
									>
										{s.user.name}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="roomId">Room</Label>
							<select
								id="roomId"
								name="roomId"
								className="select-field"
							>
								<option value="">— Select Room —</option>
								{rooms.map((r) => (
									<option
										key={r.id}
										value={r.id}
									>
										{r.building}-{r.floor}0{r.roomNumber}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="assignedToStaffId">Assign Staff</Label>
							<select
								id="assignedToStaffId"
								name="assignedToStaffId"
								className="select-field"
							>
								<option value="">— (Unassigned) —</option>
								{staff.map((st) => (
									<option
										key={st.id}
										value={st.id}
									>
										{st.user.name}
									</option>
								))}
							</select>
						</div>
						<div className="lg:col-span-2 flex items-end justify-end pb-0.5">
							<Button
								type="submit"
								className="w-full bg-rose-600 hover:bg-rose-500 font-bold shadow-[0_10px_24px_rgba(225,29,72,0.3)]"
							>
								Create Request
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Queue */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
							<History className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Repair Queue</CardTitle>
							<CardDescription>Repair process history</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Problem Description</TableHead>
								<TableHead className="w-30">Status</TableHead>
								<TableHead className="w-45">Handled By</TableHead>
								<TableHead className="w-60">Update Progress</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{requests.map((r) => (
								<TableRow key={r.id}>
									<TableCell>
										<div className="space-y-1.5 py-1">
											<div className="font-bold text-white/95 text-base tracking-tight">
												{r.title}
											</div>
											<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
												{r.room && (
													<span className="text-amber-400">
														Room: {r.room.building}-{r.room.floor}0
														{r.room.roomNumber}
													</span>
												)}
												{r.student && (
													<span className="text-slate-400">
														Req by: {r.student.user.name}
													</span>
												)}
											</div>
											<div className="text-sm text-slate-400 pl-3.5 border-l-2 border-white/5 ml-0.5 max-w-sm line-clamp-2 italic leading-relaxed">
												&quot;{r.description}&quot;
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												r.status === 'DONE'
													? 'success'
													: r.status === 'IN_PROGRESS'
														? 'warning'
														: 'default'
											}
											className="px-3"
										>
											{r.status}
										</Badge>
										{r.logs[0]?.comment && (
											<div className="mt-2 text-[0.65rem] font-medium text-slate-500 leading-tight">
												Latest Log: {r.logs[0].comment}
											</div>
										)}
									</TableCell>
									<TableCell>
										{r.assignedToStaff ? (
											<div className="flex items-center gap-2.5">
												<div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-[0.6rem] font-bold text-slate-400 ring-1 ring-white/10">
													{r.assignedToStaff.user.name
														.slice(0, 1)
														.toUpperCase()}
												</div>
												<div className="space-y-0.5">
													<div className="text-sm font-semibold text-white/90 leading-none">
														{r.assignedToStaff.user.name}
													</div>
													<div className="text-[0.65rem] text-slate-500 tracking-wider uppercase font-bold">
														{r.assignedToStaff.staffCode}
													</div>
												</div>
											</div>
										) : (
											<span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
												— (Unassigned)
											</span>
										)}
									</TableCell>
									<TableCell>
										<form
											action={updateMaintenanceStatus}
											className="space-y-2 py-1"
										>
											<input
												type="hidden"
												name="requestId"
												value={r.id}
											/>
											<div className="grid grid-cols-2 gap-2">
												<select
													name="status"
													defaultValue={r.status}
													className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-[0.7rem] font-semibold text-white focus:border-rose-400/50 outline-none"
												>
													<option value="OPEN">OPEN</option>
													<option value="IN_PROGRESS">IN_PROGRESS</option>
													<option value="DONE">DONE</option>
												</select>
												<select
													name="assignedToStaffId"
													defaultValue={r.assignedToStaff?.id || ''}
													className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-[0.7rem] font-semibold text-white focus:border-rose-400/50 outline-none"
												>
													<option value="">Unassign</option>
													{staff.map((st) => (
														<option
															key={st.id}
															value={st.id}
														>
															{st.user.name.split(' ')[0]}
														</option>
													))}
												</select>
											</div>
											<div className="flex gap-2">
												<Input
													name="comment"
													placeholder="Work log..."
													className="h-8 text-[0.7rem]"
												/>
												<Button
													type="submit"
													size="sm"
													className="h-8 px-4 text-[0.7rem] font-bold"
												>
													Update
												</Button>
											</div>
										</form>
									</TableCell>
								</TableRow>
							))}
							{requests.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4}>
										<div className="data-empty">
											<Wrench className="data-empty-icon" />
											<p>No maintenance requests yet.</p>
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
