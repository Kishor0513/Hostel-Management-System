import Link from 'next/link';

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
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import {
	deleteRoom as deleteRoomAction,
	updateRoom as updateRoomAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditRoomPage({
	params,
}: {
	params: { roomId: string };
}) {
	await requireRole(['ADMIN', 'STAFF']);

	let room: any = null;
	let dataError: string | null = null;

	try {
		room = await prisma.room.findUnique({
			where: { id: params.roomId },
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
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	if (dataError) {
		return (
			<div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
				{dataError}{' '}
				<Link
					href="/admin/rooms"
					className="underline"
				>
					Back
				</Link>
			</div>
		);
	}

	if (!room) {
		return (
			<div className="p-4 text-white/70">
				Room not found.{' '}
				<Link
					className="underline"
					href="/admin/rooms"
				>
					Back
				</Link>
			</div>
		);
	}

	const beds = room.beds;
	const availableBeds = beds.filter((b) => b.allocations.length === 0).length;
	const occupiedBeds = beds.length - availableBeds;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-white/90">Edit Room</h1>
					<p className="text-sm text-white/60">
						{room.building}-F{room.floor} / {room.roomNumber}
					</p>
				</div>
				<Link
					href="/admin/rooms"
					className="text-sm text-white/70 hover:text-white"
				>
					Back to Rooms
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Update Room</CardTitle>
						<CardDescription>
							Update building, floor, room number, and capacity. If capacity
							increases, additional beds will be created.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							action={updateRoomAction}
							className="space-y-4"
						>
							<input
								type="hidden"
								name="roomId"
								value={room.id}
							/>

							<div className="space-y-2">
								<Label htmlFor="building">Building</Label>
								<Input
									id="building"
									name="building"
									defaultValue={room.building}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="floor">Floor</Label>
								<Input
									id="floor"
									name="floor"
									type="number"
									defaultValue={room.floor}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="roomNumber">Room Number</Label>
								<Input
									id="roomNumber"
									name="roomNumber"
									defaultValue={room.roomNumber}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="capacityBeds">Capacity (Beds)</Label>
								<Input
									id="capacityBeds"
									name="capacityBeds"
									type="number"
									defaultValue={room.capacityBeds}
									required
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
							>
								Save Changes
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Current Occupancy</CardTitle>
						<CardDescription>
							Computed from active allocations (`endDate` is null).
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Badge variant={availableBeds > 0 ? 'success' : 'warning'}>
								Available: {availableBeds}
							</Badge>
							<Badge variant="default">Occupied: {occupiedBeds}</Badge>
						</div>

						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<p className="text-sm text-white/70">Beds</p>
							<div className="mt-2 flex flex-wrap gap-2">
								{beds.map((bed) => {
									const isFree = bed.allocations.length === 0;
									return (
										<span
											key={bed.id}
											className={`rounded-full px-3 py-1 text-xs ring-1 ring-white/10 ${
												isFree
													? 'bg-emerald-500/15 text-emerald-200'
													: 'bg-white/10 text-white/80'
											}`}
										>
											Bed {bed.bedNumber}
										</span>
									);
								})}
							</div>
						</div>

						<form
							action={deleteRoomAction}
							className="pt-2"
						>
							<input
								type="hidden"
								name="roomId"
								value={room.id}
							/>
							<Button
								type="submit"
								variant="destructive"
								className="w-full"
							>
								Delete Room
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
