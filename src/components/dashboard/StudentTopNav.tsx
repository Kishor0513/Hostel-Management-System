import TopNav, { type TopNavItem } from '@/components/dashboard/TopNav';

const NAV_ITEMS: TopNavItem[] = [
	{ href: '/student', label: 'Overview' },
	{ href: '/student/room', label: 'My Room' },
	{ href: '/student/payments', label: 'Payments' },
	{ href: '/student/attendance', label: 'Attendance' },
	{ href: '/student/requests', label: 'Requests' },
	{ href: '/student/announcements', label: 'Announcements' },
];

export default function StudentTopNav() {
	return (
		<TopNav
			items={NAV_ITEMS}
			rootHref="/student"
		/>
	);
}
