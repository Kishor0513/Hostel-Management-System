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

			<div className="mx-auto w-full max-w-350 px-4 py-5 lg:px-6 lg:py-6">
				<header className="rounded-3xl border border-white/12 bg-slate-950/72 px-4 py-4 shadow-[0_22px_62px_rgba(3,7,18,0.58)] backdrop-blur-2xl lg:px-5">
					<div className="flex flex-wrap items-start gap-4 xl:flex-nowrap">
						<Link
							href="/admin"
							className="flex shrink-0 items-center gap-3"
						>
							<div className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-700 shadow-[0_14px_30px_rgba(2,132,199,0.45)] ring-1 ring-white/30">
								<span className="text-sm font-bold text-white">O</span>
							</div>
							<div>
								<p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300/80">
									Hostel Suite
								</p>
								<p className="text-xl font-semibold leading-none text-slate-900 dark:text-white">
									Admin Console
								</p>
								<p className="mt-1 text-xs text-slate-600 dark:text-slate-300/75">
									Operations and analytics center
								</p>
							</div>
						</Link>

						<div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3">
							<AdminTopNav />
						</div>

						<div className="ml-auto flex min-w-56 items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/10 px-3 py-2.5">
							<div className="flex items-center gap-3">
								<div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/20 text-sm font-semibold text-sky-100 ring-1 ring-sky-400/35">
									{user.name?.slice(0, 1)?.toUpperCase() ?? 'A'}
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold leading-none text-slate-900 dark:text-white">
										{user.name}
									</p>
									<p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300/80">
										{user.role}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Link
									href="/admin/settings"
									className="glass-hover rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/14 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
								>
									Settings
								</Link>
								<ThemeToggle />
								<LogoutButton />
							</div>
						</div>
					</div>
				</header>

				<main className="mt-5">{children}</main>
			</div>
		</div>
	);
}
