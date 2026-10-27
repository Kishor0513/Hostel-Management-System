import { ShieldCheck, UserPlus, Users } from 'lucide-react';
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

import { createStaff as createStaffAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function StaffPage({
	searchParams,
}: {
	searchParams: Promise<SearchParamsRecord>;
}) {
	await requireRole(['ADMIN']);

	const params = await searchParams;
	const q = getSearchParam(params, 'q').trim();
	const requestedPage = getPageParam(params);
	const rawRole = getSearchParam(params, 'role');
	const role = rawRole === 'ADMIN' || rawRole === 'STAFF' ? rawRole : '';

	const getStaff = (
		where: Prisma.StaffWhereInput,
		skip: number,
		take: number,
	) =>
		prisma.staff.findMany({
			where,
			orderBy: { staffCode: 'asc' },
			skip,
			take,
			include: {
				user: { select: { id: true, name: true, email: true, role: true } },
			},
		});

	type StaffResult = Awaited<ReturnType<typeof getStaff>>;

	let staff: StaffResult = [];
	let totalStaff = 0;
	let totalItems = 0;
	let page = requestedPage;
	let dataError: string | null = null;

	const baseWhere: Prisma.StaffWhereInput = { user: { isActive: true } };
	const searchWhere: Prisma.StaffWhereInput | null = q
		? {
				OR: [
					{ staffCode: { contains: q, mode: 'insensitive' } },
					{ designation: { contains: q, mode: 'insensitive' } },
					{ department: { contains: q, mode: 'insensitive' } },
					{ user: { name: { contains: q, mode: 'insensitive' } } },
					{ user: { email: { contains: q, mode: 'insensitive' } } },
				],
			}
		: null;
	const listWhere: Prisma.StaffWhereInput = {
		user: {
			isActive: true,
			...(role ? { role } : {}),
		},
		...(searchWhere ?? {}),
	};

	try {
		[totalStaff, totalItems] = await Promise.all([
			prisma.staff.count({ where: baseWhere }),
			prisma.staff.count({ where: listWhere }),
		]);

		const pagination = paginate(totalItems, requestedPage);
		page = pagination.page;
		staff = await getStaff(listWhere, pagination.skip, pagination.take);
	} catch (error) {
		console.error('[page] failed to load data', error);
		dataError = 'Could not load data. Please try again.';
	}

	const pagination = paginate(totalItems, page);
	const hasActiveFilters = Boolean(q || role);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Staff Management</h1>
					<p className="page-subtitle">
						Manage administrative and maintenance personnel.
					</p>
				</div>
				<Badge
					variant="info"
					className="h-fit"
				>
					Total Staff: {totalStaff}
				</Badge>
			</div>

			{dataError ? (
				<div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
					<span className="shrink-0 text-base">⚠</span> {dataError}
				</div>
			) : null}

			{/* Add Staff Form */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
							<UserPlus className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Add New Staff</CardTitle>
							<CardDescription>Add staff member</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createStaffAction}
						className="grid grid-cols-1 gap-4 lg:grid-cols-3"
					>
						<div className="space-y-1.5">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								required
								placeholder="Ex: Ram Bahadur"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
								placeholder="staff@example.com"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">Login Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="staffCode">Staff Code</Label>
							<Input
								id="staffCode"
								name="staffCode"
								required
								placeholder="ST-001"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="designation">Designation</Label>
							<Input
								id="designation"
								name="designation"
								placeholder="Manager / Warden"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="department">Department</Label>
							<Input
								id="department"
								name="department"
								placeholder="Ops / Admin"
							/>
						</div>

						<div className="lg:col-span-3 flex justify-end pt-2">
							<Button
								type="submit"
								className="bg-rose-600 hover:bg-rose-500"
							>
								Register Staff
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Staff Directory */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
							<Users className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Staff Directory</CardTitle>
							<CardDescription>Directory</CardDescription>
						</div>
					</div>
					<ListFilters
						action="/admin/staff"
						searchValue={q}
						searchPlaceholder="Search name, email, code, or role"
						filters={[
							{
								name: 'role',
								label: 'Staff role',
								value: role,
								options: [
									{ value: '', label: 'All roles' },
									{ value: 'ADMIN', label: 'Administrators' },
									{ value: 'STAFF', label: 'Staff' },
								],
							},
						]}
					/>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Staff Member</TableHead>
								<TableHead className="w-35">Code</TableHead>
								<TableHead className="w-40">Designation</TableHead>
								<TableHead className="w-30">Role</TableHead>
								<TableHead className="w-25 text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{staff.map((st) => (
								<TableRow key={st.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-[0.65rem] font-bold text-slate-300 ring-1 ring-white/10">
												{st.user.name.slice(0, 1).toUpperCase()}
											</div>
											<div className="space-y-0.5">
												<div className="font-semibold text-white/95">
													{st.user.name}
												</div>
												<div className="text-[0.7rem] text-slate-500 tracking-wide">
													{st.user.email}
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-sm font-medium text-slate-400">
										{st.staffCode}
									</TableCell>
									<TableCell className="text-sm text-slate-300">
										{st.designation ?? '—'}
									</TableCell>
									<TableCell>
										<Badge
											variant={st.user.role === 'ADMIN' ? 'success' : 'default'}
											className="flex w-fit items-center gap-1.5"
										>
											{st.user.role === 'ADMIN' && (
												<ShieldCheck className="h-3 w-3" />
											)}
											{st.user.role}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Link
											href={`/admin/staff/${st.id}`}
											className="text-xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors"
										>
											Edit
										</Link>
									</TableCell>
								</TableRow>
							))}
							{staff.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5}>
										<div className="data-empty">
											<Users className="data-empty-icon" />
											<p>
												{hasActiveFilters
													? 'No staff match these filters.'
													: 'No staff records found. Add personnel above.'}
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
					<ListPagination
						basePath="/admin/staff"
						{...pagination}
						totalItems={totalItems}
						params={{ q, role }}
						itemLabel="staff members"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
