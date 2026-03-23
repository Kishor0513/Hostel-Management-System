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
	deleteStudent as deleteStudentAction,
	updateStudent as updateStudentAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditStudentPage({
	params,
}: {
	params: { studentId: string };
}) {
	await requireRole(['ADMIN', 'STAFF']);

	type StudentResult = Awaited<ReturnType<typeof prisma.student.findUnique>>;

	let student: StudentResult = null;
	let dataError: string | null = null;

	try {
		student = await prisma.student.findUnique({
			where: { id: params.studentId },
			include: {
				user: true,
				allocations: {
					where: { endDate: null },
					take: 1,
					orderBy: { startDate: 'desc' },
					include: { bed: { include: { room: true } } },
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
					href="/admin/students"
					className="underline"
				>
					Back
				</Link>
			</div>
		);
	}

	if (!student) {
		return (
			<div className="p-4 text-white/70">
				Student not found.{' '}
				<Link
					href="/admin/students"
					className="underline"
				>
					Back
				</Link>
			</div>
		);
	}

	const allocation = student.allocations[0];
	const bed = allocation?.bed;
	const room = bed?.room;
	const hasBed = Boolean(room && bed);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-white/90">Edit Student</h1>
					<p className="text-sm text-white/60">
						Student #{student.studentNumber}
					</p>
				</div>
				<Link
					href="/admin/students"
					className="text-sm text-white/70 hover:text-white"
				>
					Back to Students
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>
							Update student details and optionally reset login password.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							action={updateStudentAction}
							className="space-y-4"
						>
							<input
								type="hidden"
								name="studentId"
								value={student.id}
							/>

							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									name="name"
									defaultValue={student.user.name}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="studentNumber">Student Number</Label>
								<Input
									id="studentNumber"
									name="studentNumber"
									defaultValue={student.studentNumber}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="program">Program</Label>
								<Input
									id="program"
									name="program"
									defaultValue={student.program ?? ''}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="admissionDate">Admission Date</Label>
								<Input
									id="admissionDate"
									name="admissionDate"
									type="date"
									defaultValue={
										student.admissionDate
											? new Date(student.admissionDate)
													.toISOString()
													.slice(0, 10)
											: ''
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">New Password (optional)</Label>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="Leave blank to keep current password"
								/>
							</div>

							<Button
								type="submit"
								className="w-full"
							>
								Save Changes
							</Button>
						</form>

						<div className="mt-4">
							<form action={deleteStudentAction}>
								<input
									type="hidden"
									name="studentId"
									value={student.id}
								/>
								<Button
									type="submit"
									variant="destructive"
									className="w-full"
								>
									Delete Student
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Current Assignment</CardTitle>
						<CardDescription>
							Active allocation is the record with `endDate = null`.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{hasBed && room ? (
							<div>
								<div className="text-lg font-semibold text-white/90">
									{room.building}-F{room.floor} / {room.roomNumber}
								</div>
								<div className="mt-1 text-sm text-white/60">
									Bed {bed?.bedNumber}
								</div>
								<div className="mt-3">
									<Badge variant="success">Assigned</Badge>
								</div>
							</div>
						) : (
							<div className="text-white/70">
								Not assigned to any bed right now.
							</div>
						)}

						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<p className="text-sm text-white/60">Login Email</p>
							<p className="mt-1 text-sm text-white/90">{student.user.email}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
