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
import { MessageSquare, Plus } from 'lucide-react';

import { createComplaintTicket, updateComplaintStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function ComplaintsPage({
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
		rawStatus === 'OPEN' ||
		rawStatus === 'IN_PROGRESS' ||
		rawStatus === 'RESOLVED'
			? rawStatus
			: '';

	const getStaff = () =>
		prisma.staff.findMany({
			where: { user: { isActive: true } },
			orderBy: { staffCode: 'asc' },
			include: { user: { select: { name: true, email: true } } },
		});

	const getStudents = () =>
		prisma.student.findMany({
			where: { user: { isActive: true } },
			orderBy: { studentNumber: 'asc' },
			include: { user: { select: { name: true } } },
		});

	const getRooms = () =>
		prisma.room.findMany({
			orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
			select: { id: true, building: true, floor: true, roomNumber: true },
		});

	const getTickets = (
		where: Prisma.ComplaintTicketWhereInput,
		skip: number,
		take: number,
	) =>
		prisma.complaintTicket.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip,
			take,
			include: {
				student: { include: { user: { select: { name: true } } } },
				room: { select: { building: true, floor: true, roomNumber: true } },
				assignedToStaff: { include: { user: { select: { name: true } } } },
				logs: { orderBy: { changedAt: 'desc' }, take: 1 },
			},
		});

	type StaffResult = Awaited<ReturnType<typeof getStaff>>;
	type StudentsResult = Awaited<ReturnType<typeof getStudents>>;
	type RoomsResult = Awaited<ReturnType<typeof getRooms>>;
	type TicketsResult = Awaited<ReturnType<typeof getTickets>>;

	let staff: StaffResult = [];
	let students: StudentsResult = [];
	let rooms: RoomsResult = [];
	let tickets: TicketsResult = [];
	let open = 0;
	let inProgress = 0;
	let resolved = 0;
	let totalItems = 0;
	let page = requestedPage;
	let dataError: string | null = null;

	const searchWhere: Prisma.ComplaintTicketWhereInput | null = q
		? {
				OR: [
					{ subject: { contains: q, mode: 'insensitive' } },
					{ description: { contains: q, mode: 'insensitive' } },
					{ student: { user: { name: { contains: q, mode: 'insensitive' } } } },
					{
						room: {
							building: { contains: q, mode: 'insensitive' },
						},
					},
				],
			}
		: null;
	const listWhere: Prisma.ComplaintTicketWhereInput = {
		...(searchWhere ?? {}),
		...(status ? { status } : {}),
	};

	try {
		const [
			staffResult,
			studentsResult,
			roomsResult,
			openCount,
			inProgressCount,
			resolvedCount,
			filteredCount,
		] = await Promise.all([
			getStaff(),
			getStudents(),
			getRooms(),
			prisma.complaintTicket.count({ where: { status: 'OPEN' } }),
			prisma.complaintTicket.count({ where: { status: 'IN_PROGRESS' } }),
			prisma.complaintTicket.count({ where: { status: 'RESOLVED' } }),
			prisma.complaintTicket.count({ where: listWhere }),
		]);

		staff = staffResult;
		students = studentsResult;
		rooms = roomsResult;
		open = openCount;
		inProgress = inProgressCount;
		resolved = resolvedCount;
		totalItems = filteredCount;

		const pagination = paginate(totalItems, requestedPage);
		page = pagination.page;
		tickets = await getTickets(
			listWhere,
			pagination.skip,
			pagination.take,
		);
	} catch (error) {
		console.error('[page] failed to load data', error);
		dataError = 'Could not load data. Please try again.';
	}

	const pagination = paginate(totalItems, page);
	const hasActiveFilters = Boolean(q || status);

	return (
		<div className="space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">Complaints</h1>
					<p className="page-subtitle">Track and resolve student complaints.</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<MessageSquare className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Open</div>
						<div className="text-xl font-bold text-white">{open}</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
						<MessageSquare className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">In Progress</div>
						<div className="text-xl font-bold text-white">{inProgress}</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<MessageSquare className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Resolved</div>
						<div className="text-xl font-bold text-white">{resolved}</div>
					</div>
				</div>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0">⚠</span> {dataError}
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
								className="select-field"
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
								className="select-field"
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
								className="select-field"
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
							<Button
								type="submit"
								size="sm"
							>
								<Plus className="h-3.5 w-3.5" />
								Create Ticket
							</Button>
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
					<ListFilters
						action="/admin/complaints"
						searchValue={q}
						searchPlaceholder="Search subject, description, student, or building"
						filters={[
							{
								name: 'status',
								label: 'Ticket status',
								value: status,
								options: [
									{ value: '', label: 'All statuses' },
									{ value: 'OPEN', label: 'Open' },
									{ value: 'IN_PROGRESS', label: 'In progress' },
									{ value: 'RESOLVED', label: 'Resolved' },
								],
							},
						]}
					/>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Ticket</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Assigned</TableHead>
								<TableHead className="w-65">Update</TableHead>
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
												className="select-field"
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
												className="select-field"
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
										{hasActiveFilters
											? 'No tickets match these filters.'
											: 'No tickets yet.'}
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
					<ListPagination
						basePath="/admin/complaints"
						{...pagination}
						totalItems={totalItems}
						params={{ q, status }}
						itemLabel="tickets"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
