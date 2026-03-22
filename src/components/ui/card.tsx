import * as React from 'react';

import { cn } from '@/lib/utils';

export function Card({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'rounded-2xl border border-white/55 bg-white/48 shadow-[0_16px_34px_rgba(126,145,173,0.24)] backdrop-blur-2xl supports-backdrop-filter:bg-white/56 dark:border-white/10 dark:bg-slate-900/58 dark:shadow-[0_18px_40px_rgba(2,8,23,0.42)] dark:supports-backdrop-filter:bg-slate-900/64',
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('p-5 md:p-6', className)}
			{...props}
		/>
	);
}

export function CardTitle({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={cn(
				'text-base font-semibold text-slate-900 dark:text-slate-100',
				className,
			)}
			{...props}
		/>
	);
}

export function CardDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn('text-sm text-slate-600 dark:text-slate-300/85', className)}
			{...props}
		/>
	);
}

export function CardContent({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('p-4 md:p-6 pt-0', className)}
			{...props}
		/>
	);
}
