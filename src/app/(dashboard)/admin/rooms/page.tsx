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
import { createRoom as createRoomAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let rooms: any[] = [];
	let dataError: string | null = null;

	try {
		rooms = await prisma.room.findMany({
			orderBy: [{ building: 'asc' }, { floor: 'asc' }, { roomNumber: 'asc' }],
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

	return (
		<div className="space-y-6">
			{dataError ? (
				<div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
					{dataError}
				</div>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Rooms & Beds</CardTitle>
					<CardDescription>
						Create rooms and manage bed inventory.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={createRoomAction}
						className="grid grid-cols-1 gap-4 md:grid-cols-4"
					>
						<div className="space-y-2">
							<Label htmlFor="building">Building</Label>
							<Input
								id="building"
								name="building"
								defaultValue="A"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="floor">Floor</Label>
							<Input
								id="floor"
								name="floor"
								type="number"
								defaultValue={1}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="roomNumber">Room Number</Label>
							<Input
								id="roomNumber"
								name="roomNumber"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="capacityBeds">Beds</Label>
							<Input
								id="capacityBeds"
								name="capacityBeds"
								type="number"
								defaultValue={4}
								required
							/>
						</div>
						<div className="md:col-span-4 flex items-end justify-end">
							<Button type="submit">Add Room</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Inventory</CardTitle>
					<CardDescription>
						Availability is computed from active allocations (where `endDate` is
						null).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Room</TableHead>
								<TableHead className="w-[120px]">Capacity</TableHead>
								<TableHead className="w-[140px]">Available</TableHead>
								<TableHead className="w-[120px]">Occupied</TableHead>
								<TableHead className="w-[120px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rooms.map((room) => {
								const beds = room.beds;
								const availableBeds = beds.filter(
									(b) => b.allocations.length === 0,
								).length;
								const occupiedBeds = beds.length - availableBeds;
								return (
									<TableRow key={room.id}>
										<TableCell>
											<div className="space-y-1">
												<div className="font-medium text-white/90">
													{room.building}-F{room.floor} / {room.roomNumber}
												</div>
											</div>
										</TableCell>
										<TableCell>{beds.length}</TableCell>
										<TableCell>
											<Badge
												variant={availableBeds > 0 ? 'success' : 'warning'}
											>
												{availableBeds}
											</Badge>
										</TableCell>
										<TableCell>{occupiedBeds}</TableCell>
										<TableCell>
											<Link
												href={`/admin/rooms/${room.id}`}
												className="text-sm text-white/80 hover:text-white"
											>
												Edit
											</Link>
										</TableCell>
									</TableRow>
								);
							})}
							{rooms.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-white/60"
									>
										No rooms found. Add one above.
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
