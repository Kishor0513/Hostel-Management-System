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

import { createStaff as createStaffAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
	await requireRole(['ADMIN', 'STAFF']);

	let staff: any[] = [];
	let dataError: string | null = null;

	try {
		staff = await prisma.staff.findMany({
			orderBy: { staffCode: 'asc' },
			include: {
				user: { select: { id: true, name: true, email: true, role: true } },
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
					<CardTitle>Staff</CardTitle>
					<CardDescription>
						Create staff accounts for maintenance and complaint workflow.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={createStaffAction}
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
							<Label htmlFor="staffCode">Staff Code</Label>
							<Input
								id="staffCode"
								name="staffCode"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="designation">Designation</Label>
							<Input
								id="designation"
								name="designation"
								placeholder="Manager / Warden / ..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="department">Department</Label>
							<Input
								id="department"
								name="department"
								placeholder="Hostel Ops / Admin / ..."
							/>
						</div>

						<div className="lg:col-span-3 flex items-end justify-end">
							<Button type="submit">Add Staff</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Staff Directory</CardTitle>
					<CardDescription>
						Staff users can be assigned to maintenance and complaint tickets.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Staff</TableHead>
								<TableHead className="w-[160px]">Staff Code</TableHead>
								<TableHead className="w-[180px]">Designation</TableHead>
								<TableHead className="w-[120px]">Role</TableHead>
								<TableHead className="w-[120px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{staff.map((st) => (
								<TableRow key={st.id}>
									<TableCell>
										<div className="space-y-1">
											<div className="font-medium text-white/90">
												{st.user.name}
											</div>
											<div className="text-xs text-white/60">
												{st.user.email}
											</div>
										</div>
									</TableCell>
									<TableCell>{st.staffCode}</TableCell>
									<TableCell>{st.designation ?? '—'}</TableCell>
									<TableCell>
										<Badge
											variant={st.user.role === 'ADMIN' ? 'success' : 'default'}
										>
											{st.user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<Link
											href={`/admin/staff/${st.id}`}
											className="text-sm text-white/80 hover:text-white"
										>
											Edit
										</Link>
									</TableCell>
								</TableRow>
							))}
							{staff.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-white/60"
									>
										No staff yet.
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
