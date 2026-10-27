import TopNav, { type TopNavItem } from '@/components/dashboard/TopNav';
import type { UserRole } from '@/generated/prisma/enums';

const NAV_ITEMS: TopNavItem[] = [
	{ href: '/admin', label: 'Dashboard' },
	{ href: '/admin/rooms', label: 'Rooms' },
	{ href: '/admin/students', label: 'Students' },
	{ href: '/admin/allocations', label: 'Allocations' },
	{ href: '/admin/payments', label: 'Payments' },
	{ href: '/admin/staff', label: 'Staff', adminOnly: true },
	{ href: '/admin/announcements', label: 'Announcements', adminOnly: true },
];

export default function AdminTopNav({ role }: { role: UserRole }) {
	const items = NAV_ITEMS.filter((item) => role === 'ADMIN' || !item.adminOnly);

	return (
		<TopNav
			items={items}
			rootHref="/admin"
		/>
	);
}
