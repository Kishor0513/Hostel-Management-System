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

import { createMaintenanceRequest, updateMaintenanceStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
	await requireRole(['ADMIN', 'STAFF']);

	let staff: any[] = [];
	let students: any[] = [];
	let rooms: any[] = [];
	let requests: any[] = [];
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

	return (
		<div className="space-y-6">
			{dataError ? (
				<div className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 text-sm text-amber-600">
					{dataError}
				</div>
			) : null}
			<Card>
				<CardHeader>
					<CardTitle>New Maintenance Request</CardTitle>
					<CardDescription>
						Submit an issue; then staff can move it through the workflow.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={createMaintenanceRequest}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								name="title"
								required
							/>
						</div>

						<div className="space-y-2 lg:col-span-3">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								name="description"
								required
								placeholder="What needs to be fixed?"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="studentId">Student (optional)</Label>
							<select
								id="studentId"
								name="studentId"
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
								<option value="">—</option>
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
							<Label htmlFor="roomId">Room (optional)</Label>
							<select
								id="roomId"
								name="roomId"
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
								<option value="">—</option>
								{rooms.map((r) => (
									<option
										key={r.id}
										value={r.id}
									>
										{r.building}-F{r.floor} / {r.roomNumber}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="assignedToStaffId">Assign Staff (optional)</Label>
							<select
								id="assignedToStaffId"
								name="assignedToStaffId"
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
								<option value="">—</option>
								{staff.map((st) => (
									<option
										key={st.id}
										value={st.id}
									>
										{st.user.name} ({st.staffCode})
									</option>
								))}
							</select>
						</div>

						<div className="lg:col-span-5 flex items-end justify-end">
							<Button type="submit">Create Request</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Maintenance Queue</CardTitle>
					<CardDescription>
						Update status and assign staff. Each update writes a log record.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Request</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Assigned</TableHead>
								<TableHead className="w-[220px]">Update</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{requests.map((r) => (
								<TableRow key={r.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">{r.title}</div>
											<div className="text-xs text-white/60">
												{r.student ? `Student: ${r.student.user.name}` : ''}
												{r.room
													? `${r.student ? ' • ' : ''}Room: ${r.room.building}-F${r.room.floor} / ${r.room.roomNumber}`
													: ''}
											</div>
											<div className="text-xs text-white/45 line-clamp-2">
												{r.description}
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
										>
											{r.status}
										</Badge>
										{r.logs[0]?.comment ? (
											<div className="mt-2 text-xs text-white/50">
												{r.logs[0].comment}
											</div>
										) : null}
									</TableCell>
									<TableCell>
										{r.assignedToStaff ? (
											<div className="space-y-1">
												<div className="text-sm text-white/90">
													{r.assignedToStaff.user.name}
												</div>
												<div className="text-xs text-white/55">
													{r.assignedToStaff.staffCode}
												</div>
											</div>
										) : (
											<span className="text-white/55">—</span>
										)}
									</TableCell>
									<TableCell>
										<form
											action={updateMaintenanceStatus}
											className="space-y-2"
										>
											<input
												type="hidden"
												name="requestId"
												value={r.id}
											/>
											<select
												name="status"
												defaultValue={r.status}
												className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
											>
												<option value="OPEN">OPEN</option>
												<option value="IN_PROGRESS">IN_PROGRESS</option>
												<option value="DONE">DONE</option>
											</select>

											<select
												name="assignedToStaffId"
												defaultValue={
													r.assignedToStaff ? r.assignedToStaff.id : ''
												}
												className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
											>
												<option value="">—</option>
												{staff.map((st) => (
													<option
														key={st.id}
														value={st.id}
													>
														{st.user.name} ({st.staffCode})
													</option>
												))}
											</select>

											<Input
												name="comment"
												placeholder="Log comment (optional)"
											/>

											<Button
												type="submit"
												className="w-full"
											>
												Update
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
							{requests.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="text-white/60"
									>
										No maintenance requests yet.
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
