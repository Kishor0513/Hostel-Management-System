'use client';

import {
	Bell,
	ChevronRight,
	Clock,
	ExternalLink,
	LogOut,
	Settings,
	Shield,
	User as UserIcon,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type UserMenuProps = {
	name?: string | null;
	role: string;
};

export default function UserMenu({ name, role }: UserMenuProps) {
	const isStudent = role === 'STUDENT';
	const canOpenSettings = role === 'ADMIN';
	const profileHref = isStudent ? '/student/profile' : '/admin/manage-accounts';
	const attendanceHref = isStudent ? '/student/attendance' : '/admin/attendance';
	const announcementsHref = isStudent
		? '/student/announcements'
		: role === 'ADMIN'
			? '/admin/announcements'
			: '/announcements';

	const [open, setOpen] = useState(false);
	const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onClickOutside(event: PointerEvent) {
			if (!menuRef.current?.contains(event.target as Node)) {
				setOpen(false);
				setSubmenuOpen(null);
			}
		}

		function onEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setOpen(false);
				setSubmenuOpen(null);
			}
		}

		document.addEventListener('pointerdown', onClickOutside);
		document.addEventListener('keydown', onEscape);

		return () => {
			document.removeEventListener('pointerdown', onClickOutside);
			document.removeEventListener('keydown', onEscape);
		};
	}, []);

	return (
		<div
			className="relative z-60 h-10 w-10 flex-none"
			ref={menuRef}
		>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				onPointerMove={(e) => {
					const header = e.currentTarget.closest('header') as HTMLElement;
					const rect = e.currentTarget.getBoundingClientRect();
					e.currentTarget.style.setProperty(
						'--mx',
						`${e.clientX - rect.left}px`,
					);
					e.currentTarget.style.setProperty(
						'--my',
						`${e.clientY - rect.top}px`,
					);
					if (header) {
						const hRect = header.getBoundingClientRect();
						header.style.setProperty('--mx', `${e.clientX - hRect.left}px`);
						header.style.setProperty('--my', `${e.clientY - hRect.top}px`);
					}
				}}
				onPointerLeave={(e) => {
					e.currentTarget.style.setProperty('--mx', '50%');
					e.currentTarget.style.setProperty('--my', '50%');
				}}
				className="h-10 w-10 overflow-hidden rounded-xl ring-1 ring-rose-400/35 transition-all duration-300 hover:ring-rose-400/60 hover:-translate-y-0.5 nav-spotlight bg-slate-900"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="Open user menu"
				title="Open user menu"
			>
				<Image
					src="/user-avatar.svg"
					alt="Local user"
					width={40}
					height={40}
					className="h-10 w-10 object-cover opacity-90 hover:opacity-100 transition-opacity"
					priority
				/>
			</button>

			{open ? (
				<div
					className="absolute right-0 top-12 z-70 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_24px_52px_rgba(10,7,21,0.7)] backdrop-blur-2xl group/user-menu"
					role="menu"
				>
					{/* User Info Header */}
					<div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 transition-opacity duration-300 group-hover/user-menu:opacity-60 hover:opacity-100!">
						<p className="truncate text-sm font-bold text-white tracking-tight">
							{name ?? 'Local User'}
						</p>
						<p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-rose-400/90 flex items-center gap-1.5">
							<Shield className="h-3 w-3" />
							{role}
						</p>
					</div>

					{/* Account Section */}
					<div className="mt-3 space-y-1">
						<p className="px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
							Account
						</p>
						<Link
							href={profileHref}
							onClick={() => {
								setOpen(false);
								setSubmenuOpen(null);
							}}
							role="menuitem"
							className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-200 transition-all duration-300 group-hover/user-menu:opacity-60 hover:opacity-100! hover:bg-white/10"
						>
							<UserIcon className="h-4 w-4 text-rose-400" />
							Profile
						</Link>
						{canOpenSettings ? (
							<Link
								href="/admin/settings"
								onClick={() => {
									setOpen(false);
									setSubmenuOpen(null);
								}}
								role="menuitem"
								className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-200 transition-all duration-300 group-hover/user-menu:opacity-60 hover:opacity-100! hover:bg-white/10"
							>
								<Settings className="h-4 w-4 text-slate-400" />
								Settings
							</Link>
						) : null}
					</div>

					{!isStudent ? (
						<div className="mt-3 space-y-1">
							<p className="px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
								System
							</p>
							<button
								type="button"
								onClick={() =>
									setSubmenuOpen(submenuOpen === 'system' ? null : 'system')
								}
								role="menuitem"
								className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-200 transition-all duration-300 group-hover/user-menu:opacity-60 hover:opacity-100! hover:bg-white/10"
							>
								<div className="flex items-center gap-2">
									<ExternalLink className="h-4 w-4 text-sky-400" />
									Management
								</div>
								<ChevronRight
									className={`h-4 w-4 transition-transform ${
										submenuOpen === 'system' ? 'rotate-90' : ''
									}`}
								/>
							</button>

							{submenuOpen === 'system' && (
								<div className="mt-1 mx-1.5 space-y-1 rounded-lg border border-white/5 bg-white/5 p-2">
									<Link
										href={announcementsHref}
										onClick={() => {
											setOpen(false);
											setSubmenuOpen(null);
										}}
										role="menuitem"
										className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:bg-white/5 hover:text-white"
									>
										<Bell className="h-3.5 w-3.5 text-amber-400" />
										Announcements
									</Link>
									<Link
										href={attendanceHref}
										onClick={() => {
											setOpen(false);
											setSubmenuOpen(null);
										}}
										role="menuitem"
										className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:bg-white/5 hover:text-white"
									>
										<Clock className="h-3.5 w-3.5 text-cyan-400" />
										Attendance
									</Link>
								</div>
							)}
						</div>
					) : null}

					{/* Logout */}
					<div className="mt-3 border-t border-white/10 pt-2">
						<button
							type="button"
							onClick={() => signOut({ callbackUrl: '/login' })}
							role="menuitem"
							className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold text-rose-400 transition-all duration-300 group-hover/user-menu:opacity-60 hover:opacity-100! hover:bg-rose-500/10"
						>
							<LogOut className="h-4 w-4" />
							Logout
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}
