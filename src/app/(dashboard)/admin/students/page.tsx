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

import { createStudent as createStudentAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function StudentsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let students: any[] = [];
	let dataError: string | null = null;

	try {
		students = await prisma.student.findMany({
			orderBy: [{ studentNumber: 'asc' }],
			include: {
				user: { select: { id: true, name: true, email: true } },
				allocations: {
					where: { endDate: null },
					take: 1,
					orderBy: { startDate: 'desc' },
					include: {
						bed: {
							include: {
								room: true,
							},
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
					<CardTitle>Students</CardTitle>
					<CardDescription>
						Create student accounts and manage their hostel assignment.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={createStudentAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-3"
					>
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="studentNumber">Student Number</Label>
							<Input
								id="studentNumber"
								name="studentNumber"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="program">Program</Label>
							<Input
								id="program"
								name="program"
								placeholder="B.Tech / BCA / ..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="admissionDate">Admission Date (optional)</Label>
							<Input
								id="admissionDate"
								name="admissionDate"
								type="date"
							/>
						</div>
						<div className="lg:col-span-3 flex items-end justify-end">
							<Button type="submit">Add Student</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Student Directory</CardTitle>
					<CardDescription>
						Current assignment is derived from active allocations.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead className="w-[200px]">Program</TableHead>
								<TableHead className="w-[220px]">Current Bed</TableHead>
								<TableHead className="w-[120px]">Status</TableHead>
								<TableHead className="w-[120px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{students.map((s) => {
								const allocation = s.allocations[0];
								const hasBed = Boolean(allocation);
								const room = allocation?.bed?.room;
								return (
									<TableRow key={s.id}>
										<TableCell>
											<div className="space-y-1">
												<div className="font-medium text-white/90">
													{s.user.name}
												</div>
												<div className="text-xs text-white/60">
													{s.studentNumber}
												</div>
												<div className="text-xs text-white/50">
													{s.user.email}
												</div>
											</div>
										</TableCell>
										<TableCell>{s.program ?? '—'}</TableCell>
										<TableCell>
											{hasBed && room ? (
												<div className="space-y-1">
													<div className="text-sm text-white/85">
														{room.building}-F{room.floor} / {room.roomNumber}
													</div>
													<div className="text-xs text-white/60">
														Bed {allocation?.bed?.bedNumber}
													</div>
												</div>
											) : (
												<span className="text-sm text-white/55">
													Not assigned
												</span>
											)}
										</TableCell>
										<TableCell>
											<Badge variant={hasBed ? 'success' : 'warning'}>
												{hasBed ? 'Active' : 'Free'}
											</Badge>
										</TableCell>
										<TableCell>
											<Link
												href={`/admin/students/${s.id}`}
												className="text-sm text-white/80 hover:text-white"
											>
												Edit
											</Link>
										</TableCell>
									</TableRow>
								);
							})}
							{students.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-white/60"
									>
										No students yet.
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
