'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
	{ href: '/admin', label: 'Dashboard' },
	{ href: '/admin/rooms', label: 'Rooms' },
	{ href: '/admin/students', label: 'Guests' },
	{ href: '/admin/allocations', label: 'Bookings' },
	{ href: '/admin/payments', label: 'Billing' },
	{ href: '/admin/staff', label: 'Staff' },
	{ href: '/admin/complaints', label: 'Complaints' },
	{ href: '/admin/maintenance', label: 'Maintenance' },
	{ href: '/admin/attendance', label: 'Attendance' },
	{ href: '/admin/announcements', label: 'Announcements' },
	{ href: '/admin/settings', label: 'Settings' },
];

const PRIMARY_ITEMS = ['/admin', '/admin/rooms', '/admin/students', '/admin/allocations'];

const CATEGORY_GROUPS = [
	{
		label: 'Operations',
		items: ['/admin/payments', '/admin/maintenance', '/admin/complaints'],
	},
	{
		label: 'People',
		items: ['/admin/staff', '/admin/attendance'],
	},
	{
		label: 'System',
		items: ['/admin/announcements', '/admin/settings'],
	},
];

function isActivePath(pathname: string, href: string) {
	return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export default function AdminTopNav() {
	const pathname = usePathname();
	const primaryItems = NAV_ITEMS.filter((item) => PRIMARY_ITEMS.includes(item.href));

	return (
		<nav>
			<div className="flex min-w-0 flex-wrap items-center gap-2.5">
				{primaryItems.map((item) => {
					const active = isActivePath(pathname, item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								'glass-hover rounded-xl px-3.5 py-2 text-[0.83rem] font-semibold tracking-[0.01em] transition-all duration-200',
								active
									? 'bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/50 shadow-[0_10px_24px_rgba(14,116,216,0.22)]'
									: 'text-slate-200/85 hover:bg-white/14 hover:text-white',
							)}
						>
							{item.label}
						</Link>
					);
				})}

				{CATEGORY_GROUPS.map((group) => {
					const groupItems = NAV_ITEMS.filter((item) =>
						group.items.includes(item.href),
					);
					const groupActive = groupItems.some((item) =>
						isActivePath(pathname, item.href),
					);

					return (
						<details
							key={group.label}
							className="group relative"
						>
							<summary
								className={cn(
									'glass-hover list-none cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 [&::-webkit-details-marker]:hidden',
									groupActive
										? 'bg-sky-500/16 text-sky-100 ring-1 ring-sky-400/45'
										: 'text-slate-300/80 hover:bg-white/14 hover:text-slate-100',
								)}
							>
								{group.label}
							</summary>
							<div className="absolute left-0 top-10 z-30 min-w-44 rounded-xl border border-white/15 bg-slate-900/90 p-1.5 shadow-[0_18px_46px_rgba(2,8,23,0.5)] backdrop-blur-xl">
								{groupItems.map((item) => {
									const active = isActivePath(pathname, item.href);

									return (
										<Link
											key={item.href}
											href={item.href}
											className={cn(
												'glass-hover block rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
												active
													? 'bg-sky-500/18 text-sky-100 ring-1 ring-sky-400/40'
													: 'text-slate-200/85 hover:bg-white/12 hover:text-white',
											)}
										>
											{item.label}
										</Link>
									);
								})}
							</div>
						</details>
					);
				})}
			</div>
		</nav>
	);
}
