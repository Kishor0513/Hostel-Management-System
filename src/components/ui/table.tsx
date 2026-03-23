import * as React from 'react';

import { cn } from '@/lib/utils';

export function Table({
	className,
	...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
	return (
		<div
			className={cn(
				'w-full overflow-auto rounded-xl transition-all duration-300 hover:shadow-[0_12px_32px_rgba(124,58,237,0.14)]',
				className,
			)}
		>
			<table
				className="w-full caption-bottom text-sm"
				{...props}
			/>
		</div>
	);
}

export function TableHeader(
	props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
	return (
		<thead
			className="border-b border-slate-200/60 bg-slate-50/80 dark:border-white/10 dark:bg-slate-800/40"
			{...props}
		/>
	);
}

export function TableBody(
	props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
	return (
		<tbody
			className="divide-y divide-slate-100/80 dark:divide-white/5"
			{...props}
		/>
	);
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className="group/row transition-colors duration-150 hover:bg-slate-50/60 dark:hover:bg-white/5"
			{...props}
		/>
	);
}

export function TableHead(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className="h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300"
			{...props}
		/>
	);
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			className="px-4 py-3 align-middle text-sm text-slate-700 dark:text-slate-100"
			{...props}
		/>
	);
}
