import * as React from 'react';

import { cn } from '@/lib/utils';

export function Table({
	className,
	...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
	return (
		<div className={cn('w-full overflow-auto rounded-xl', className)}>
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
			className="bg-slate-100/90 dark:bg-slate-800/55"
			{...props}
		/>
	);
}

export function TableBody(
	props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
	return (
		<tbody
			className="divide-y divide-slate-200/90 dark:divide-slate-700/70"
			{...props}
		/>
	);
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45"
			{...props}
		/>
	);
}

export function TableHead(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className="h-11 px-4 text-left align-middle font-medium text-slate-700 dark:text-slate-200"
			{...props}
		/>
	);
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			className="px-4 py-3 align-middle text-slate-700 dark:text-slate-200"
			{...props}
		/>
	);
}
