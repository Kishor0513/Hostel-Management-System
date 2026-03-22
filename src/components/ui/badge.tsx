import * as React from 'react';

import { cn } from '@/lib/utils';

const variants = {
	default:
		'bg-slate-100 text-slate-700 dark:bg-slate-800/65 dark:text-slate-200',
	success:
		'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
	warning:
		'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
	danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
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
				'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-black/5 dark:ring-white/10',
				variants[variant],
				className,
			)}
			{...props}
		/>
	);
}
