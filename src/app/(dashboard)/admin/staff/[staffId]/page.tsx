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
	deleteStaff as deleteStaffAction,
	updateStaff as updateStaffAction,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditStaffPage({
	params,
}: {
	params: { staffId: string };
}) {
	await requireRole(['ADMIN', 'STAFF']);

	type StaffResult = Awaited<ReturnType<typeof prisma.staff.findUnique>>;

	let staff: StaffResult = null;
	let dataError: string | null = null;

	try {
		staff = await prisma.staff.findUnique({
			where: { id: params.staffId },
			include: { user: true },
		});
	} catch {
		dataError = 'Database connection failed. Check DATABASE_URL in .env.';
	}

	if (dataError) {
		return (
			<div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
				{dataError}{' '}
				<Link
					href="/admin/staff"
					className="underline"
				>
					Back
				</Link>
			</div>
		);
	}

	if (!staff) {
		return (
			<div className="p-4 text-white/70">
				Staff not found.{' '}
				<Link
					className="underline"
					href="/admin/staff"
				>
					Back
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold text-white/90">Edit Staff</h1>
					<p className="text-sm text-white/60">{staff.staffCode}</p>
				</div>
				<Link
					href="/admin/staff"
					className="text-sm text-white/70 hover:text-white"
				>
					Back to Staff
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>
							Update staff details and optionally reset password.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							action={updateStaffAction}
							className="space-y-4"
						>
							<input
								type="hidden"
								name="staffId"
								value={staff.id}
							/>

							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<Input
									id="name"
									name="name"
									defaultValue={staff.user.name}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="staffCode">Staff Code</Label>
								<Input
									id="staffCode"
									name="staffCode"
									defaultValue={staff.staffCode}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="designation">Designation</Label>
								<Input
									id="designation"
									name="designation"
									defaultValue={staff.designation ?? ''}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="department">Department</Label>
								<Input
									id="department"
									name="department"
									defaultValue={staff.department ?? ''}
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
							<form action={deleteStaffAction}>
								<input
									type="hidden"
									name="staffId"
									value={staff.id}
								/>
								<Button
									type="submit"
									variant="destructive"
									className="w-full"
								>
									Delete Staff
								</Button>
							</form>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Account</CardTitle>
						<CardDescription>Login email and role.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<p className="text-sm text-white/60">Email</p>
							<p className="mt-1 text-sm text-white/90">{staff.user.email}</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="default">{staff.user.role}</Badge>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
