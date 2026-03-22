import Link from 'next/link';

import LogoutButton from '@/components/auth/LogoutButton';
import AdminTopNav from '@/components/dashboard/AdminTopNav';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
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
		<div className="tahoe-shell min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
			<div className="pointer-events-none fixed inset-0 -z-10">
				<div className="absolute left-1/2 -top-72 h-160 w-160 -translate-x-1/2 rounded-full bg-sky-300/35 blur-[140px] dark:bg-cyan-500/20" />
				<div className="absolute -left-28 top-40 h-96 w-96 rounded-full bg-cyan-200/45 blur-[120px] dark:bg-sky-500/20" />
				<div className="absolute -bottom-40 -right-32 h-104 w-104 rounded-full bg-indigo-200/40 blur-[130px] dark:bg-indigo-600/25" />
			</div>

			<div className="mx-auto w-full max-w-350 px-4 py-4 lg:px-6">
				<header className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 shadow-[0_18px_48px_rgba(125,146,178,0.32)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/40 dark:shadow-[0_18px_48px_rgba(2,8,23,0.45)]">
					<div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
						<Link
							href="/admin"
							className="flex items-center gap-3 shrink-0"
						>
							<div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1f2a44] ring-1 ring-[#1f2a44]/40">
								<span className="text-sm font-bold text-white">O</span>
							</div>
							<div>
								<p className="text-xs uppercase tracking-[0.12em] text-slate-500">
									Hostel Suite
								</p>
								<p className="text-lg font-semibold leading-none text-slate-900">
									Admin Console
								</p>
							</div>
						</Link>

						<div className="min-w-0 flex-1">
							<AdminTopNav />
						</div>

						<div className="ml-auto flex items-center gap-2 rounded-xl border border-white/75 bg-white/60 px-2.5 py-2 backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/40">
							<Link
								href="/admin/settings"
								className="rounded-lg px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
							>
								Settings
							</Link>
							<ThemeToggle />
							<div className="hidden text-right md:block">
								<p className="text-sm font-medium leading-none text-slate-900 dark:text-white">
									{user.name}
								</p>
								<p className="mt-1 text-xs text-slate-500 dark:text-slate-300/80">
									{user.role}
								</p>
							</div>
							<LogoutButton />
						</div>
					</div>
				</header>

				<main className="mt-4">{children}</main>
			</div>
		</div>
	);
}
