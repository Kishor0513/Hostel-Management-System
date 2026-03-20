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

import { createComplaintTicket, updateComplaintStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function ComplaintsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let staff: any[] = [];
	let students: any[] = [];
	let rooms: any[] = [];
	let tickets: any[] = [];
	let dataError: string | null = null;

	try {
		[staff, students, rooms, tickets] = await Promise.all([
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
			prisma.complaintTicket.findMany({
				orderBy: { createdAt: 'desc' },
				take: 20,
				include: {
					student: { include: { user: { select: { name: true } } } },
					room: { select: { building: true, floor: true, roomNumber: true } },
					assignedToStaff: { include: { user: { select: { name: true } } } },
					logs: { orderBy: { changedAt: 'desc' }, take: 1 },
				},
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
					<CardTitle>New Complaint</CardTitle>
					<CardDescription>
						Create a support ticket; staff can move it through status stages.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={createComplaintTicket}
						className="grid grid-cols-1 gap-4 lg:grid-cols-5"
					>
						<div className="space-y-2 lg:col-span-2">
							<Label htmlFor="subject">Subject</Label>
							<Input
								id="subject"
								name="subject"
								required
							/>
						</div>
						<div className="space-y-2 lg:col-span-3">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								name="description"
								required
								placeholder="What happened?"
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
							<Button type="submit">Create Ticket</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ticket Queue</CardTitle>
					<CardDescription>
						Status updates are logged for audit trail.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ticket</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Assigned</TableHead>
								<TableHead className="w-[260px]">Update</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tickets.map((t) => (
								<TableRow key={t.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">
												{t.subject}
											</div>
											<div className="text-xs text-white/60">
												{t.student ? `Student: ${t.student.user.name}` : ''}
												{t.room
													? `${t.student ? ' • ' : ''}Room: ${t.room.building}-F${t.room.floor} / ${t.room.roomNumber}`
													: ''}
											</div>
											<div className="text-xs text-white/45 line-clamp-2">
												{t.description}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												t.status === 'RESOLVED'
													? 'success'
													: t.status === 'IN_PROGRESS'
														? 'warning'
														: 'default'
											}
										>
											{t.status}
										</Badge>
										{t.logs[0]?.comment ? (
											<div className="mt-2 text-xs text-white/50">
												{t.logs[0].comment}
											</div>
										) : null}
									</TableCell>
									<TableCell>
										{t.assignedToStaff ? (
											<div className="space-y-1">
												<div className="text-sm text-white/90">
													{t.assignedToStaff.user.name}
												</div>
												<div className="text-xs text-white/55">
													{t.assignedToStaff.staffCode}
												</div>
											</div>
										) : (
											<span className="text-white/55">—</span>
										)}
									</TableCell>
									<TableCell>
										<form
											action={updateComplaintStatus}
											className="space-y-2"
										>
											<input
												type="hidden"
												name="ticketId"
												value={t.id}
											/>

											<select
												name="status"
												defaultValue={t.status}
												className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
											>
												<option value="OPEN">OPEN</option>
												<option value="IN_PROGRESS">IN_PROGRESS</option>
												<option value="RESOLVED">RESOLVED</option>
											</select>

											<select
												name="assignedToStaffId"
												defaultValue={
													t.assignedToStaff ? t.assignedToStaff.id : ''
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
							{tickets.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="text-white/60"
									>
										No tickets yet.
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
