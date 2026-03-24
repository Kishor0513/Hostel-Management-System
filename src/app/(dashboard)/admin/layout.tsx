import Link from 'next/link';

import AdminTopNav from '@/components/dashboard/AdminTopNav';
import AdminUserMenu from '@/components/dashboard/AdminUserMenu';
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
		<div className="tahoe-shell relative min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
			<div className="pointer-events-none fixed inset-0 -z-10">
				{/* Rhododendron intensity */}
				<div className="absolute left-1/2 -top-72 h-160 w-160 -translate-x-1/2 rounded-full bg-rose-300/30 blur-[140px] dark:bg-rose-500/15" />
				{/* Himalayan Snow / Sky */}
				<div className="absolute -left-28 top-40 h-96 w-96 rounded-full bg-amber-200/40 blur-[130px] dark:bg-sky-500/10" />
				{/* Everest Deep Blue */}
				<div className="absolute -bottom-40 -right-32 h-104 w-104 rounded-full bg-slate-200/40 blur-[130px] dark:bg-slate-700/30" />
			</div>

			<div className="fixed top-0 left-0 right-0 z-40 w-full pointer-events-none">
				<div className="mx-auto w-full max-w-350 px-4 lg:px-6">
					<header className="nav-rail-spotlight mt-4 w-full overflow-visible rounded-2xl bg-slate-950/70 px-5 py-3.5 shadow-[0_20px_50px_rgba(10,7,21,0.6)] backdrop-blur-2xl pointer-events-auto lg:px-6">
						<div className="flex items-center gap-4">
							<Link
								href="/admin"
								className="flex shrink-0 items-center gap-3"
							>
								<div className="grid h-12 w-12 place-items-center rounded-lg bg-linear-to-br from-rose-500 to-rose-700 ring-1 ring-white/30 shadow-[0_12px_25px_rgba(225,29,72,0.4)]">
									<span className="text-sm font-bold text-white">O</span>
								</div>
								<div className="hidden sm:block">
									<p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
										Hostel Suite
									</p>
									<p className="text-base font-bold leading-none text-slate-50">
										Admin Console
									</p>
								</div>
							</Link>

							<div className="relative z-50 min-w-0 flex-1 flex justify-center">
								<AdminTopNav />
							</div>

							<div className="relative z-50 shrink-0">
								<AdminUserMenu
									name={user.name}
									role={user.role}
								/>
							</div>
						</div>
					</header>
				</div>
			</div>

			<div className="relative z-10 w-full">
				<main className="relative z-10 mx-auto w-full max-w-350 px-4 py-5 mt-24 lg:px-6 lg:py-6 lg:mt-28">
					{children}
				</main>

				<div className="pointer-events-none fixed bottom-5 right-5 z-50 lg:bottom-6 lg:right-6">
					<div className="pointer-events-auto rounded-2xl border border-white/20 bg-slate-950/72 p-1.5 shadow-[0_18px_42px_rgba(11,8,24,0.55)] backdrop-blur-xl">
						<ThemeToggle />
					</div>
				</div>
			</div>
		</div>
	);
}
