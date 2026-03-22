import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
					'border border-white/80 bg-white/70 text-slate-800 shadow-[0_8px_22px_rgba(116,132,160,0.25)] hover:bg-white/90 dark:border-white/20 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-700/70',
				secondary:
					'border border-white/80 bg-white/60 text-slate-700 hover:bg-white/85 dark:border-white/15 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:bg-slate-800/60',
				outline:
					'border border-slate-300/80 bg-transparent text-slate-700 hover:bg-white/70 dark:border-slate-500/60 dark:text-slate-200 dark:hover:bg-slate-800/45',
				destructive: 'bg-red-600 text-white hover:opacity-90',
				ghost:
					'bg-transparent text-slate-700 hover:bg-white/65 dark:text-slate-200 dark:hover:bg-slate-800/45',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-6',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}
