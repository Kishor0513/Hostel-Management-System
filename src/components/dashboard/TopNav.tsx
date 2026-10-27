'use client';

import { ChevronDown, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type TopNavItem = {
	href: string;
	label: string;
	adminOnly?: boolean;
};

function isActivePath(pathname: string, href: string, rootHref: string) {
	return href === rootHref ? pathname === rootHref : pathname.startsWith(href);
}

export default function TopNav({
	items,
	rootHref,
}: {
	items: readonly TopNavItem[];
	rootHref: string;
}) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const menuRef = useRef<HTMLElement>(null);
	const activeItem = items.find((item) =>
		isActivePath(pathname, item.href, rootHref),
	);

	useEffect(() => {
		if (!mobileOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setMobileOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') setMobileOpen(false);
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [mobileOpen]);

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
		<nav
			ref={menuRef}
			className="relative min-w-0 w-full"
		>
			<div className="relative mx-auto max-w-full md:hidden">
				<button
					type="button"
					aria-expanded={mobileOpen}
					aria-controls="mobile-dashboard-nav"
					aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
					onClick={() => setMobileOpen((open) => !open)}
					className="mx-auto flex h-11 max-w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm font-semibold text-slate-200 transition-colors hover:text-white"
				>
					<Menu className="h-4 w-4 shrink-0" />
					<span className="max-w-36 truncate">
						{activeItem?.label ?? 'Menu'}
					</span>
					<ChevronDown
						className={cn(
							'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
							mobileOpen && 'rotate-180',
						)}
					/>
				</button>

				{mobileOpen ? (
					<div
						id="mobile-dashboard-nav"
						className="absolute top-[calc(100%+0.75rem)] left-1/2 z-50 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[rgba(2,6,23,0.98)] p-2 shadow-[0_24px_60px_rgba(2,6,23,0.65)] backdrop-blur-2xl"
					>
						<div className="flex flex-col gap-0.5">
							{items.map((item) => {
								const active = isActivePath(pathname, item.href, rootHref);

								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => setMobileOpen(false)}
										aria-current={active ? 'page' : undefined}
										className={cn(
											'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
											active
												? 'bg-white/10 text-white'
												: 'text-slate-300 hover:text-white',
										)}
									>
										<span>{item.label}</span>
										{active ? (
											<span className="h-1.5 w-1.5 rounded-full bg-[rgba(var(--nav-glow-main),1)]" />
										) : null}
									</Link>
								);
							})}
						</div>
					</div>
				) : null}
			</div>

			<div
				className="nav-rail-spotlight group/nav-rail hidden w-full min-w-0 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2 md:flex"
				onPointerMove={handleRailPointerMove}
				onPointerLeave={handleRailPointerLeave}
			>
				{items.map((item) => {
					const active = isActivePath(pathname, item.href, rootHref);

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
