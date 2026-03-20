import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { Badge } from '@/components/ui/badge';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	assignBed as assignBedAction,
	deleteAllocation as deleteAllocationAction,
	updateTransferReason as updateTransferReasonAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function AllocationsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let students: any[] = [];
	let beds: any[] = [];
	let activeAllocations: any[] = [];
	let history: any[] = [];
	let dataError: string | null = null;

	try {
		[students, beds, activeAllocations, history] = await Promise.all([
			prisma.student.findMany({
				orderBy: { studentNumber: 'asc' },
				include: { user: { select: { name: true, email: true } } },
			}),
			prisma.bed.findMany({
				include: {
					room: true,
					allocations: {
						where: { endDate: null },
						select: { id: true },
					},
				},
				orderBy: [
					{ room: { building: 'asc' } },
					{ room: { floor: 'asc' } },
					{ bedNumber: 'asc' },
				],
			}),
			prisma.allocation.findMany({
				where: { endDate: null },
				orderBy: { startDate: 'desc' },
				include: {
					bed: { include: { room: true } },
					student: { include: { user: true } },
				},
			}),
			prisma.allocation.findMany({
				where: { endDate: { not: null } },
				take: 20,
				orderBy: { startDate: 'desc' },
				include: {
					bed: { include: { room: true } },
					student: { include: { user: true } },
				},
			}),
		]);
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	const availableBedsCount = beds.filter(
		(b) => b.allocations.length === 0,
	).length;

	return (
		<div className="space-y-6">
			{dataError ? (
				<div className="rounded-lg border border-amber-600/50 bg-amber-500/10 p-4 text-sm text-amber-600">
					{dataError}
				</div>
			) : null}
			<Card>
				<CardHeader>
					<CardTitle>Assign Bed</CardTitle>
					<CardDescription>
						When you assign a bed that is already occupied, the existing active
						allocation is ended (keeping it in history) and the new one becomes
						active.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={assignBedAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-4"
					>
						<div className="space-y-2">
							<Label htmlFor="bedId">Bed</Label>
							<select
								id="bedId"
								name="bedId"
								required
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							>
								{beds.map((b) => {
									const occupied = b.allocations.length > 0;
									return (
										<option
											key={b.id}
											value={b.id}
										>
											{b.room.building}-F{b.room.floor} / {b.room.roomNumber} -
											Bed {b.bedNumber}
											{occupied ? ' (Occupied)' : ' (Free)'}
										</option>
									);
								})}
							</select>
						</div>

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
							<Label htmlFor="startDate">Start Date (optional)</Label>
							<input
								id="startDate"
								name="startDate"
								type="date"
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="transferReason">Transfer Reason (optional)</Label>
							<input
								id="transferReason"
								name="transferReason"
								className="flex h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
							/>
						</div>

						<div className="lg:col-span-4 flex items-end justify-end">
							<Button type="submit">Assign</Button>
						</div>
					</form>

					<div className="mt-4 flex flex-wrap gap-2">
						<Badge variant={availableBedsCount > 0 ? 'success' : 'warning'}>
							Available beds: {availableBedsCount}
						</Badge>
						<Badge variant="default">
							Active allocations: {activeAllocations.length}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Active Allocations</CardTitle>
					<CardDescription>
						Only allocations with `endDate = null` are considered active.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead>Room</TableHead>
								<TableHead className="w-[140px]">Bed</TableHead>
								<TableHead className="w-[140px]">Start</TableHead>
								<TableHead>Transfer Reason</TableHead>
								<TableHead className="w-[160px]">Update</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{activeAllocations.map((a) => (
								<TableRow key={a.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">
												{a.student.user.name}
											</div>
											<div className="text-xs text-white/60">
												{a.student.studentNumber}
											</div>
										</div>
									</TableCell>
									<TableCell>
										{a.bed.room.building}-F{a.bed.room.floor} /{' '}
										{a.bed.room.roomNumber}
									</TableCell>
									<TableCell>Bed {a.bed.bedNumber}</TableCell>
									<TableCell>
										{a.startDate.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell className="text-white/70">
										{a.transferReason ?? '—'}
									</TableCell>
									<TableCell>
										<form
											action={updateTransferReasonAction}
											className="flex items-center gap-2"
										>
											<input
												type="hidden"
												name="allocationId"
												value={a.id}
											/>
											<input
												name="transferReason"
												defaultValue={a.transferReason ?? ''}
												className="flex h-9 w-full rounded-lg border border-white/15 bg-white/5 px-2 text-sm outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
											/>
											<Button
												type="submit"
												variant="secondary"
												className="h-9 px-3"
											>
												Save
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
							{activeAllocations.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-white/60"
									>
										No active allocations yet.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Transfer History</CardTitle>
					<CardDescription>
						Last 20 allocations (active + ended).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead>Room</TableHead>
								<TableHead className="w-[140px]">Bed</TableHead>
								<TableHead className="w-[140px]">Start</TableHead>
								<TableHead className="w-[140px]">End</TableHead>
								<TableHead>Reason</TableHead>
								<TableHead className="w-[120px]">Delete</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{history.map((a) => (
								<TableRow key={a.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">
												{a.student.user.name}
											</div>
											<div className="text-xs text-white/60">
												{a.student.studentNumber}
											</div>
										</div>
									</TableCell>
									<TableCell>
										{a.bed.room.building}-F{a.bed.room.floor} /{' '}
										{a.bed.room.roomNumber}
									</TableCell>
									<TableCell>Bed {a.bed.bedNumber}</TableCell>
									<TableCell>
										{a.startDate.toISOString().slice(0, 10)}
									</TableCell>
									<TableCell>{a.endDate?.toISOString().slice(0, 10)}</TableCell>
									<TableCell className="text-white/70">
										{a.transferReason ?? '—'}
									</TableCell>
									<TableCell>
										<form action={deleteAllocationAction}>
											<input
												type="hidden"
												name="allocationId"
												value={a.id}
											/>
											<Button
												type="submit"
												variant="destructive"
												className="h-9 w-full px-2"
											>
												Remove
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
							{history.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-white/60"
									>
										No history yet.
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
