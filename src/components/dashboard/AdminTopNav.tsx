'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
	{ href: '/admin', label: 'Dashboard' },
	{ href: '/admin/rooms', label: 'Rooms' },
	{ href: '/admin/students', label: 'Students' },
	{ href: '/admin/allocations', label: 'Allocations' },
	{ href: '/admin/payments', label: 'Payments' },
	{ href: '/admin/staff', label: 'Staff' },
	{ href: '/admin/announcements', label: 'Announcements' },
];

function isActivePath(pathname: string, href: string) {
	return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

export default function AdminTopNav() {
	const pathname = usePathname();

	function setPointerVars(
		target: HTMLElement,
		clientX: number,
		clientY: number,
		parentTarget?: HTMLElement,
	) {
		const rect = target.getBoundingClientRect();
		const x = `${clientX - rect.left}px`;
		const y = `${clientY - rect.top}px`;
		target.style.setProperty('--mx', x);
		target.style.setProperty('--my', y);

		if (parentTarget) {
			const pRect = parentTarget.getBoundingClientRect();
			parentTarget.style.setProperty('--mx', `${clientX - pRect.left}px`);
			parentTarget.style.setProperty('--my', `${clientY - pRect.top}px`);
		}
	}

	function handleRailPointerMove(event: React.PointerEvent<HTMLDivElement>) {
		setPointerVars(event.currentTarget, event.clientX, event.clientY);
	}

	function handleRailPointerLeave(event: React.PointerEvent<HTMLDivElement>) {
		event.currentTarget.style.setProperty('--mx', '50%');
		event.currentTarget.style.setProperty('--my', '50%');
	}

	function handlePointerMove(event: React.PointerEvent<HTMLAnchorElement>) {
		const rail = event.currentTarget.closest(
			'.nav-rail-spotlight',
		) as HTMLElement;
		setPointerVars(
			event.currentTarget,
			event.clientX,
			event.clientY,
			rail || undefined,
		);
	}

	function handlePointerLeave(event: React.PointerEvent<HTMLAnchorElement>) {
		event.currentTarget.style.setProperty('--mx', '50%');
		event.currentTarget.style.setProperty('--my', '50%');
	}

	return (
		<nav className="min-w-0 w-full">
			<div
				className="nav-rail-spotlight group/nav-rail flex w-full min-w-0 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2"
				onPointerMove={handleRailPointerMove}
				onPointerLeave={handleRailPointerLeave}
			>
				{NAV_ITEMS.map((item) => {
					const active = isActivePath(pathname, item.href);

					return (
						<Link
							key={item.href}
							href={item.href}
							onPointerMove={handlePointerMove}
							onPointerLeave={handlePointerLeave}
							className={cn(
								'nav-spotlight group relative flex h-11 flex-col items-center justify-center rounded-xl px-4 text-center transition-all duration-300',
								'group-hover/nav-rail:opacity-60 hover:opacity-100!',
								active
									? 'nav-active-underline opacity-100!'
									: 'hover:text-white',
							)}
						>
							<span
								className={cn(
									'text-[0.9rem] font-bold leading-none tracking-tight transition-colors duration-200',
									active
										? 'text-white'
										: 'text-slate-200/90 group-hover:text-white',
								)}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
