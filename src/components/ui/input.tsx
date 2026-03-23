import * as React from 'react';

import { cn } from '@/lib/utils';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			{...props}
			className={cn(
				'flex h-10 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200',
				'hover:border-[rgba(var(--nav-glow-main),0.45)] hover:shadow-[0_8px_22px_rgba(var(--nav-glow-main),0.18)]',
				'placeholder:text-slate-400 placeholder:font-normal',
				'focus:border-[rgba(var(--nav-glow-main),0.85)] focus:bg-white focus:ring-3 focus:ring-[rgba(var(--nav-glow-main),0.2)]',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-400',
				'dark:hover:border-[rgba(var(--nav-glow-main),0.45)] dark:hover:shadow-[0_10px_26px_rgba(var(--nav-glow-main),0.22)] dark:focus:border-[rgba(var(--nav-glow-main),0.9)] dark:focus:bg-slate-800 dark:focus:ring-[rgba(var(--nav-glow-main),0.25)]',
				props.className,
			)}
		/>
	);
}
