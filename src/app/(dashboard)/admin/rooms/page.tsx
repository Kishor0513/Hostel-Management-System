import { BedDouble, Building2, Plus } from 'lucide-react';
import Link from 'next/link';

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
import { createRoom as createRoomAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function RoomsPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	await requireRole(['ADMIN', 'STAFF']);

	const params = await searchParams;
	const q = getSearchParam(params, 'q').trim();
	const requestedPage = getPageParam(params);
	const rawAvailability = getSearchParam(params, 'availability');
	const availability =
		rawAvailability === 'available' || rawAvailability === 'full'
			? rawAvailability
			: '';

	const getRooms = (
		where: Prisma.RoomWhereInput,
		skip: number,
		take: number,
	) =>
		prisma.room.findMany({
			where,
			orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
			skip,
			take,
			include: {
				beds: {
					include: {
						allocations: {
							where: { endDate: null },
							select: { id: true },
						},
					},
				},
			},
		});

	type RoomsResult = Awaited<ReturnType<typeof getRooms>>;
	type BedItem = RoomsResult[number]['beds'][number];

	let rooms: RoomsResult = [];
	let totalRooms = 0;
	let totalBeds = 0;
	let occupiedBeds = 0;
	let totalItems = 0;
	let page = requestedPage;
	let dataError: string | null = null;

	const searchWhere: Prisma.RoomWhereInput | null = q
		? {
				OR: [
					{ building: { contains: q, mode: 'insensitive' } },
					{ roomNumber: { contains: q, mode: 'insensitive' } },
				],
			}
		: null;
	const availabilityWhere: Prisma.RoomWhereInput | null =
		availability === 'available'
			? { beds: { some: { allocations: { none: { endDate: null } } } } }
			: availability === 'full'
				? { beds: { none: { allocations: { none: { endDate: null } } } } }
				: null;
	const listWhere: Prisma.RoomWhereInput = {
		...(searchWhere ?? {}),
		...(availabilityWhere ?? {}),
	};

	try {
		const [totalRoomCount, totalBedCount, occupiedBedCount, filteredCount] =
			await Promise.all([
				prisma.room.count(),
				prisma.bed.count(),
				prisma.bed.count({
					where: { allocations: { some: { endDate: null } } },
				}),
				prisma.room.count({ where: listWhere }),
			]);

		totalRooms = totalRoomCount;
		totalBeds = totalBedCount;
		occupiedBeds = occupiedBedCount;
		totalItems = filteredCount;

		const pagination = paginate(totalItems, requestedPage);
		page = pagination.page;
		rooms = await getRooms(listWhere, pagination.skip, pagination.take);
	} catch (error) {
		console.error('[page] failed to load data', error);
		dataError = 'Could not load data. Please try again.';
	}

	const pagination = paginate(totalItems, page);
	const hasActiveFilters = Boolean(q || availability);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Rooms &amp; Beds</h1>
					<p className="page-subtitle">
						Manage room inventory and track bed availability.
					</p>
				</div>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span>
					{dataError}
				</div>
			) : null}

			{/* Summary cards */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
						<Building2 className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Total Rooms</div>
						<div className="text-xl font-bold text-white">{totalRooms}</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<BedDouble className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Available Beds</div>
						<div className="text-xl font-bold text-white">
							{totalBeds - occupiedBeds}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
						<BedDouble className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Occupied Beds</div>
						<div className="text-xl font-bold text-white">{occupiedBeds}</div>
					</div>
				</div>
			</div>

			{/* Add Room Form */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
							<Plus className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Add Room</CardTitle>
							<CardDescription>
								Create a new room and set its bed capacity.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createRoomAction}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
					>
						<div className="space-y-1.5">
							<Label htmlFor="building">Building</Label>
							<Input
								id="building"
								name="building"
								defaultValue="A"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="floor">Floor</Label>
							<Input
								id="floor"
								name="floor"
								type="number"
								defaultValue={1}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="roomNumber">Room Number</Label>
							<Input
								id="roomNumber"
								name="roomNumber"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="capacityBeds">Beds</Label>
							<Input
								id="capacityBeds"
								name="capacityBeds"
								type="number"
								defaultValue={4}
								required
							/>
						</div>
						<div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
							<Button type="submit">
								<Plus className="h-4 w-4" />
								Add Room
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Room Inventory */}
			<Card>
				<CardHeader>
					<CardTitle>Inventory</CardTitle>
					<CardDescription>
						Availability is computed from active allocations.
					</CardDescription>
					<ListFilters
						action="/admin/rooms"
						searchValue={q}
						searchPlaceholder="Search building or room number"
						filters={[
							{
								name: 'availability',
								label: 'Bed availability',
								value: availability,
								options: [
									{ value: '', label: 'All rooms' },
									{ value: 'available', label: 'Beds available' },
									{ value: 'full', label: 'Fully occupied' },
								],
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0 pb-0 px-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Room</TableHead>
								<TableHead className="w-27.5">Capacity</TableHead>
								<TableHead className="w-32.5">Available</TableHead>
								<TableHead className="w-27.5">Occupied</TableHead>
								<TableHead className="w-25">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rooms.map((room) => {
								const beds = room.beds;
								const availableBeds = beds.filter(
									(b: BedItem) => b.allocations.length === 0,
								).length;
								const occupiedBeds = beds.length - availableBeds;
								return (
									<TableRow key={room.id}>
										<TableCell>
											<div className="font-semibold text-white/90">
												{room.building}-F{room.floor} / {room.roomNumber}
											</div>
										</TableCell>
										<TableCell>{beds.length}</TableCell>
										<TableCell>
											<Badge
												variant={availableBeds > 0 ? 'success' : 'warning'}
											>
												{availableBeds} free
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-slate-400">{occupiedBeds}</span>
										</TableCell>
										<TableCell>
											<Link
												href={`/admin/rooms/${room.id}`}
												className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
											>
												Edit
											</Link>
										</TableCell>
									</TableRow>
								);
							})}
							{rooms.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5}>
										<div className="data-empty">
											<BedDouble className="data-empty-icon" />
											<p>
												{hasActiveFilters
													? 'No rooms match these filters.'
													: 'No rooms yet. Add one above.'}
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
					<ListPagination
						basePath="/admin/rooms"
						{...pagination}
						totalItems={totalItems}
						params={{ q, availability }}
						itemLabel="rooms"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
