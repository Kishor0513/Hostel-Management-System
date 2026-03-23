'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export function Card({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const [isMounted, setIsMounted] = useState(false);
	const glowBackground = useMotionTemplate`
		radial-gradient(
			220px circle at ${mouseX}px ${mouseY}px,
			rgba(var(--nav-glow-main), 0.2) 0%,
			rgba(var(--nav-glow-secondary), 0.14) 36%,
			rgba(var(--nav-glow-accent), 0.08) 58%,
			transparent 78%
		)
	`;

	useEffect(() => {
		setIsMounted(true);
	}, []);

	function handleMouseMove({
		currentTarget,
		clientX,
		clientY,
	}: React.MouseEvent<HTMLDivElement>) {
		const { left, top } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}

	return (
		<div
			className={cn(
				'group relative overflow-hidden rounded-2xl border border-white/15 bg-white/50 shadow-[0_8px_24px_rgba(126,145,173,0.18)] backdrop-blur-xl supports-backdrop-filter:bg-white/55 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(var(--nav-glow-main),0.22)] dark:border-white/8 dark:bg-slate-900/60 dark:shadow-[0_12px_36px_rgba(2,8,23,0.45)] dark:hover:shadow-[0_18px_40px_rgba(var(--nav-glow-main),0.2)]',
				className,
			)}
			onMouseMove={handleMouseMove}
			{...props}
		>
			{isMounted && (
				<motion.div
					className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 dark:group-hover:opacity-100"
					style={{
						background: glowBackground,
					}}
				/>
			)}
			<div className="relative z-10 h-full w-full">{props.children}</div>
		</div>
	);
}

export function CardHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('flex flex-col gap-1.5 p-5 md:p-6', className)}
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
				'text-base font-semibold tracking-tight text-slate-900 dark:text-white',
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
			className={cn(
				'text-sm leading-relaxed text-slate-600 dark:text-slate-300',
				className,
			)}
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
