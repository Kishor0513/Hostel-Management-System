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

export default function AdminTopNav() {
	const pathname = usePathname();

	return (
		<nav className="flex min-w-0 items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			{NAV_ITEMS.map((item) => {
				const active =
					item.href === '/admin'
						? pathname === '/admin'
						: pathname.startsWith(item.href);

				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200',
							active
								? 'bg-[#1d2a44] text-white shadow-[0_6px_14px_rgba(16,24,40,0.2)]'
								: 'text-slate-600 hover:bg-white/65 hover:text-slate-900',
						)}
					>
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
