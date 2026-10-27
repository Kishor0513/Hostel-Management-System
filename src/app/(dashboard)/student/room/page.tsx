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
import { formatDateOnly } from '@/lib/format';
import { getOrganizationSettings } from '@/lib/settings';
import { requireStudentContext } from '@/lib/student';
import { prisma } from '@/lib/prisma';
import { BedDouble, History, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentRoomPage() {
	const { student, activeAllocation } = await requireStudentContext();
	const settings = await getOrganizationSettings();

	const allocations = await prisma.allocation.findMany({
		where: { studentId: student.id },
		orderBy: { startDate: 'desc' },
		include: {
			bed: {
				include: { room: true },
			},
		},
	});

	const roommates = activeAllocation
		? await prisma.allocation.findMany({
				where: {
					endDate: null,
					studentId: { not: student.id },
					bed: { roomId: activeAllocation.bed.roomId },
				},
				include: {
					student: {
						include: {
							user: { select: { name: true, email: true } },
						},
					},
					bed: true,
				},
				orderBy: { bed: { bedNumber: 'asc' } },
			})
		: [];

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">My Room</h1>
					<p className="page-subtitle">
						Current allocation, roommates, and your hostel stay history.
					</p>
				</div>
				<Badge
					variant={activeAllocation ? 'success' : 'warning'}
					className="h-fit"
				>
					{activeAllocation ? 'Active allocation' : 'No active allocation'}
				</Badge>
			</div>

			{activeAllocation ? (
				<div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
					<Card className="xl:col-span-2">
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
									<BedDouble className="h-4 w-4" />
								</div>
								<div>
									<CardTitle>Current Bed</CardTitle>
									<CardDescription>
										Assigned by the hostel administration
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
							<div>
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Building
								</p>
								<p className="mt-1 font-semibold text-white">
									{activeAllocation.bed.room.building}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Floor
								</p>
								<p className="mt-1 font-semibold text-white">
									{activeAllocation.bed.room.floor}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Room
								</p>
								<p className="mt-1 font-semibold text-white">
									{activeAllocation.bed.room.roomNumber}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Bed
								</p>
								<p className="mt-1 font-semibold text-white">
									{activeAllocation.bed.bedNumber} of{' '}
									{activeAllocation.bed.room.capacityBeds}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Allocated since
								</p>
								<p className="mt-1 text-slate-300">
									{formatDateOnly(activeAllocation.startDate)}
								</p>
							</div>
							<div className="col-span-2 md:col-span-3">
								<p className="text-xs uppercase tracking-wide text-slate-500">
									Allocation note
								</p>
								<p className="mt-1 text-slate-300">
									{activeAllocation.transferReason ?? '—'}
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
									<Users className="h-4 w-4" />
								</div>
								<div>
									<CardTitle>Roommates</CardTitle>
									<CardDescription>
										{roommates.length} other resident
										{roommates.length === 1 ? '' : 's'}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-2">
							{roommates.length === 0 ? (
								<p className="text-sm text-slate-400">
									No roommates currently allocated.
								</p>
							) : (
								roommates.map((allocation) => (
									<div
										key={allocation.id}
										className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-sm"
									>
										<span className="text-slate-200">
											{allocation.student.user.name}
										</span>
										<Badge variant="info">
											Bed {allocation.bed.bedNumber}
										</Badge>
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>
			) : (
				<Card>
					<CardContent className="py-8 text-sm text-slate-400">
						No active allocation. Contact the hostel office at{' '}
						{settings.supportEmail} if you believe this is wrong.
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
							<History className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Allocation History</CardTitle>
							<CardDescription>
								Every bed assigned to {student.studentNumber}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Building</TableHead>
								<TableHead>Room</TableHead>
								<TableHead>Bed</TableHead>
								<TableHead>From</TableHead>
								<TableHead>To</TableHead>
								<TableHead>Note</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allocations.map((allocation) => (
								<TableRow key={allocation.id}>
									<TableCell>{allocation.bed.room.building}</TableCell>
									<TableCell>{allocation.bed.room.roomNumber}</TableCell>
									<TableCell>{allocation.bed.bedNumber}</TableCell>
									<TableCell>
										{formatDateOnly(allocation.startDate)}
									</TableCell>
									<TableCell>
										{allocation.endDate
											? formatDateOnly(allocation.endDate)
											: 'Present'}
									</TableCell>
									<TableCell className="text-xs text-slate-400">
										{allocation.transferReason ?? '—'}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
