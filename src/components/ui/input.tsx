import * as React from 'react';

import { cn } from '@/lib/utils';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			{...props}
			className={cn(
				'flex h-11 w-full rounded-xl border border-slate-300/80 bg-white/75 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60 dark:border-slate-500/50 dark:bg-slate-900/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:ring-sky-500/40',
				props.className,
			)}
		/>
	);
}
