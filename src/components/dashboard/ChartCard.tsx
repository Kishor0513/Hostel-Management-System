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
	return (
		<Card className="glass-hover group border-white/12 bg-slate-950/70 transition-all duration-300 hover:shadow-[0_20px_48px_rgba(2,8,23,0.48)]">
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
