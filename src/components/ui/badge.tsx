import * as React from 'react';

import { cn } from '@/lib/utils';

const variants = {
	default:
		'bg-slate-100 text-slate-700 ring-slate-200/80 dark:bg-slate-700/50 dark:text-slate-200 dark:ring-slate-600/50',
	success:
		'bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
	warning:
		'bg-amber-50 text-amber-700 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
	danger:
		'bg-rose-50 text-rose-700 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
	info: 'bg-sky-50 text-sky-700 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
} as const;

export type BadgeVariant = keyof typeof variants;

export function Badge({
	variant = 'default',
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 transition-all duration-200 hover:-translate-y-px hover:ring-violet-300/40',
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
}
