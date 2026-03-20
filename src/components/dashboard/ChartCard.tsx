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
		<Card className="bg-slate-800/50 border-slate-700">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="pt-0 overflow-hidden">{children}</CardContent>
		</Card>
	);
}
