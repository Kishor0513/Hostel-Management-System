'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KpiCard({
	label,
	value,
	helper,
}: {
	label: string;
	value: string;
	helper?: string;
}) {
	return (
		<Card
			className="group relative overflow-hidden border-rose-500/10 bg-slate-950/72 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_56px_rgba(225,29,72,0.4)] dark:border-rose-500/15"
		>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-rose-400/0 via-rose-400 to-rose-400/0 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
			<CardHeader className="pb-1">
				<CardTitle className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-rose-500 dark:text-rose-400">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-5 pb-5 pt-1">
				<div className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
					{value}
				</div>
				{helper ? (
					<div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
						{helper}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
