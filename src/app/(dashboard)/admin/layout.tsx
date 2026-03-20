import Link from 'next/link';

import type { UserRole } from '@/generated/prisma/enums';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await requireRole(['ADMIN', 'STAFF'] satisfies UserRole[]);

	return (
		<div className="min-h-screen bg-slate-950">
			<div className="mx-auto w-full max-w-7xl px-3 py-3">
				<header className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/10" />
						<div>
							<p className="text-sm text-white/60">Hostel Management</p>
							<p className="text-lg font-semibold leading-none text-white">
								Admin Dashboard
							</p>
						</div>
					</div>
					<div className="hidden text-right sm:block">
						<p className="text-sm text-white/60">Signed in as {user.name}</p>
						<p className="text-xs text-white/50">Role: {user.role}</p>
					</div>
				</header>

				<div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
					<aside className="rounded-xl border border-slate-700 bg-slate-900 p-3 backdrop-blur">
						<nav className="flex flex-col gap-1">
							<NavItem
								href="/admin"
								label="Dashboard"
							/>
							<NavItem
								href="/admin/rooms"
								label="Rooms & Beds"
							/>
							<NavItem
								href="/admin/students"
								label="Students"
							/>
							<NavItem
								href="/admin/staff"
								label="Staff"
							/>
							<NavItem
								href="/admin/allocations"
								label="Allocations"
							/>
							<NavItem
								href="/admin/payments"
								label="Payments"
							/>
							<NavItem
								href="/admin/attendance"
								label="Attendance"
							/>
							<NavItem
								href="/admin/maintenance"
								label="Maintenance"
							/>
							<NavItem
								href="/admin/complaints"
								label="Complaints"
							/>
							<NavItem
								href="/admin/announcements"
								label="Announcements"
							/>
						</nav>
					</aside>

					<main>{children}</main>
				</div>
			</div>
		</div>
	);
}

function NavItem({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="rounded-xl px-3 py-2 text-sm text-white/70 ring-1 ring-transparent transition-colors hover:bg-white/5 hover:text-white hover:ring-white/10"
		>
			{label}
		</Link>
	);
}
