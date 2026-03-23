'use client';

import { ReactNode } from 'react';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function ChartCard({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
		e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
	}

	function handlePointerLeave(e: React.PointerEvent<HTMLDivElement>) {
		e.currentTarget.style.setProperty('--mx', '50%');
		e.currentTarget.style.setProperty('--my', '50%');
	}

	return (
		<Card
			className="glass-hover group relative overflow-hidden border-white/12 bg-slate-950/70 transition-all duration-500 hover:shadow-[0_28px_56px_rgba(2,8,23,0.7)] hover:-translate-y-1"
			onPointerMove={handlePointerMove}
			onPointerLeave={handlePointerLeave}
		>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-violet-400/0 via-violet-400 to-violet-400/0 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
				{description ? (
					<CardDescription className="mt-1 text-xs font-medium text-slate-300/80">
						{description}
					</CardDescription>
				) : null}
			</CardHeader>
			<CardContent className="overflow-hidden px-4 pb-4 pt-0 md:px-5 md:pb-5">
				{children}
			</CardContent>
		</Card>
	);
}
