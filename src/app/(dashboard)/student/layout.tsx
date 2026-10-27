import Link from 'next/link';

import StudentTopNav from '@/components/dashboard/StudentTopNav';
import ThemeToggle from '@/components/dashboard/ThemeToggle';
import UserMenu from '@/components/dashboard/UserMenu';
import { requireRole } from '@/lib/auth';
import { getOrganizationSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await requireRole(['STUDENT']);
	const settings = await getOrganizationSettings();

	return (
		<div className="tahoe-shell relative min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
			<div className="pointer-events-none fixed inset-0 -z-10">
				<div className="absolute left-1/2 -top-72 h-160 w-160 -translate-x-1/2 rounded-full bg-rose-300/30 blur-[140px] dark:bg-rose-500/15" />
				<div className="absolute -left-28 top-40 h-96 w-96 rounded-full bg-amber-200/40 blur-[130px] dark:bg-sky-500/10" />
				<div className="absolute -bottom-40 -right-32 h-104 w-104 rounded-full bg-slate-200/40 blur-[130px] dark:bg-slate-700/30" />
			</div>

			<div className="pointer-events-none fixed top-0 left-0 right-0 z-40 w-full">
				<div className="mx-auto w-full max-w-350 px-4 lg:px-6">
					<header className="nav-rail-spotlight pointer-events-auto mt-4 w-full overflow-visible rounded-2xl bg-slate-950/70 px-5 py-3.5 shadow-[0_20px_50px_rgba(10,7,21,0.6)] backdrop-blur-2xl lg:px-6">
						<div className="flex items-center gap-4">
							<Link
								href="/student"
								className="flex shrink-0 items-center gap-3"
							>
								<div className="grid h-12 w-12 place-items-center rounded-lg bg-linear-to-br from-rose-500 to-rose-700 ring-1 ring-white/30 shadow-[0_12px_25px_rgba(225,29,72,0.4)]">
									<span className="text-sm font-bold text-white">O</span>
								</div>
								<div className="hidden sm:block">
									<p className="max-w-44 truncate text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-slate-400">
										{settings.organizationName}
									</p>
									<p className="text-base font-bold leading-none text-slate-50">
										Student Portal
									</p>
								</div>
							</Link>

							<div className="relative z-50 min-w-0 flex-1 flex justify-center">
								<StudentTopNav />
							</div>

							<div className="relative z-50 shrink-0">
								<UserMenu
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
