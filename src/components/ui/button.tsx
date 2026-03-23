import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--nav-glow-main),0.45)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
	{
		variants: {
			variant: {
				default:
					'border border-[rgba(var(--nav-glow-main),0.34)] bg-[rgba(var(--nav-glow-main),0.86)] text-white shadow-[0_4px_16px_rgba(var(--nav-glow-main),0.35)] hover:bg-[rgba(var(--nav-glow-main),0.98)] hover:shadow-[0_8px_24px_rgba(var(--nav-glow-main),0.5)] hover:-translate-y-px',
				secondary:
					'border border-white/80 bg-white/70 text-slate-700 shadow-sm hover:bg-[rgba(var(--nav-glow-main),0.14)] hover:border-[rgba(var(--nav-glow-main),0.36)] hover:-translate-y-px dark:border-white/12 dark:bg-slate-800/65 dark:text-slate-200 dark:hover:bg-[rgba(var(--nav-glow-main),0.22)] dark:hover:border-[rgba(var(--nav-glow-main),0.42)]',
				outline:
					'border border-slate-300/80 bg-transparent text-slate-700 shadow-sm hover:bg-[rgba(var(--nav-glow-main),0.1)] hover:border-[rgba(var(--nav-glow-main),0.36)] hover:-translate-y-px dark:border-slate-600/60 dark:text-slate-200 dark:hover:bg-[rgba(var(--nav-glow-main),0.18)] dark:hover:border-[rgba(var(--nav-glow-main),0.42)]',
				destructive:
					'border border-rose-500/30 bg-rose-600 text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)] hover:bg-[rgba(var(--nav-glow-main),0.92)] hover:border-[rgba(var(--nav-glow-main),0.5)] hover:shadow-[0_8px_22px_rgba(var(--nav-glow-main),0.42)] hover:-translate-y-px',
				ghost:
					'bg-transparent text-slate-700 hover:bg-[rgba(var(--nav-glow-main),0.1)] dark:text-slate-200 dark:hover:bg-[rgba(var(--nav-glow-main),0.18)]',
				success:
					'border border-emerald-500/30 bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.3)] hover:bg-[rgba(var(--nav-glow-main),0.92)] hover:border-[rgba(var(--nav-glow-main),0.5)] hover:shadow-[0_8px_22px_rgba(var(--nav-glow-main),0.42)] hover:-translate-y-px',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-8 rounded-lg px-3 text-xs',
				lg: 'h-11 px-6 text-base',
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
