import { GraduationCap, Plus, Users } from 'lucide-react';
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

	type StudentsResult = Awaited<ReturnType<typeof prisma.student.findMany>>;

	let students: StudentsResult = [];
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

	const assigned = students.filter((s) => s.allocations.length > 0).length;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Students</h1>
					<p className="page-subtitle">
						Manage student registrations and room assignments.
					</p>
				</div>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span>
					{dataError}
				</div>
			) : null}

			{/* Summary */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
						<Users className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Total Students</div>
						<div className="text-xl font-bold text-white">
							{students.length}
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
						<GraduationCap className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Assigned</div>
						<div className="text-xl font-bold text-white">{assigned}</div>
					</div>
				</div>
				<div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 flex items-center gap-3">
					<div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
						<Users className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs text-slate-400">Unassigned</div>
						<div className="text-xl font-bold text-white">
							{students.length - assigned}
						</div>
					</div>
				</div>
			</div>

			{/* Add Student Form */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
							<Plus className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Add Student</CardTitle>
							<CardDescription>
								Create a student account linked to the hostel.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createStudentAction}
						className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
					>
						<div className="space-y-1.5">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="studentNumber">Student Number</Label>
							<Input
								id="studentNumber"
								name="studentNumber"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="program">Program</Label>
							<Input
								id="program"
								name="program"
								placeholder="B.Tech / BCA / …"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="admissionDate">Admission Date (optional)</Label>
							<Input
								id="admissionDate"
								name="admissionDate"
								type="date"
							/>
						</div>
						<div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
							<Button type="submit">
								<Plus className="h-4 w-4" />
								Add Student
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Student Directory */}
			<Card>
				<CardHeader>
					<CardTitle>Student Directory</CardTitle>
					<CardDescription>
						Current assignment is derived from active allocations.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0 px-0 pb-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Student</TableHead>
								<TableHead className="w-45">Program</TableHead>
								<TableHead className="w-50">Current Bed</TableHead>
								<TableHead className="w-25">Status</TableHead>
								<TableHead className="w-25">Actions</TableHead>
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
											<div className="space-y-0.5">
												<div className="font-semibold text-white/90">
													{s.user.name}
												</div>
												<div className="text-xs text-slate-400">
													{s.studentNumber}
												</div>
												<div className="text-xs text-slate-500">
													{s.user.email}
												</div>
											</div>
										</TableCell>
										<TableCell className="text-slate-300">
											{s.program ?? '—'}
										</TableCell>
										<TableCell>
											{hasBed && room ? (
												<div>
													<div className="text-sm font-medium text-white/85">
														{room.building}-F{room.floor} / {room.roomNumber}
													</div>
													<div className="text-xs text-slate-400">
														Bed {allocation?.bed?.bedNumber}
													</div>
												</div>
											) : (
												<span className="text-sm text-slate-500 italic">
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
												className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
											>
												Edit
											</Link>
										</TableCell>
									</TableRow>
								);
							})}
							{students.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5}>
										<div className="data-empty">
											<GraduationCap className="data-empty-icon" />
											<p>No students yet. Add one above.</p>
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
