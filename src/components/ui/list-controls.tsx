import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ListFilterOption = {
	value: string;
	label: string;
};

export type ListFilterControl =
	| {
			type?: 'select';
			name: string;
			label: string;
			value?: string;
			options: readonly ListFilterOption[];
	  }
	| {
			type: 'date';
			name: string;
			label: string;
			value?: string;
	  };

export function ListFilters({
	action,
	searchValue = '',
	searchPlaceholder,
	filters = [],
}: {
	action: string;
	searchValue?: string;
	searchPlaceholder: string;
	filters?: readonly ListFilterControl[];
}) {
	const hasActiveFilters =
		Boolean(searchValue.trim()) || filters.some((filter) => Boolean(filter.value));

	return (
		<form
			method="get"
			action={action}
			className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
		>
			<label className="relative min-w-0 flex-1 sm:min-w-56">
				<span className="sr-only">Search</span>
				<Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<Input
					name="q"
					defaultValue={searchValue}
					placeholder={searchPlaceholder}
					className="pl-9"
				/>
			</label>

			{filters.map((filter) => (
				<label
					key={filter.name}
					className="sm:w-auto"
				>
					<span className="sr-only">{filter.label}</span>
					{filter.type === 'date' ? (
						<Input
							type="date"
							name={filter.name}
							defaultValue={filter.value}
							aria-label={filter.label}
							className="sm:w-40"
						/>
					) : (
						<select
							name={filter.name}
							defaultValue={filter.value ?? ''}
							aria-label={filter.label}
							className="select-field h-10 sm:w-44"
						>
							{filter.options.map((option) => (
								<option
									key={option.value}
									value={option.value}
								>
									{option.label}
								</option>
							))}
						</select>
					)}
				</label>
			))}

			<div className="flex items-center gap-2">
				<Button
					type="submit"
					variant="secondary"
					size="sm"
					className="h-10 flex-1 px-4 sm:flex-none"
				>
					<Search className="h-3.5 w-3.5" />
					Apply
				</Button>
				{hasActiveFilters ? (
					<Link
						href={action}
						className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
					>
						<X className="h-3.5 w-3.5" />
						Reset
					</Link>
				) : null}
			</div>
		</form>
	);
}

function pageHref(
	basePath: string,
	page: number,
	params: Record<string, string | undefined>,
) {
	const query = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value) query.set(key, value);
	}
	if (page > 1) query.set('page', String(page));

	const queryString = query.toString();
	return queryString ? `${basePath}?${queryString}` : basePath;
}

function visiblePages(page: number, totalPages: number) {
	const pages = new Set([1, totalPages, page - 1, page, page + 1]);
	return [...pages]
		.filter((candidate) => candidate >= 1 && candidate <= totalPages)
		.sort((a, b) => a - b);
}

const pageLinkClass =
	'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200/80 bg-white/70 px-2 text-xs font-semibold text-slate-600 transition-colors hover:border-[rgba(var(--nav-glow-main),0.45)] hover:text-slate-950 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:text-white';

export function ListPagination({
	basePath,
	page,
	totalPages,
	totalItems,
	from,
	to,
	params = {},
	itemLabel = 'items',
}: {
	basePath: string;
	page: number;
	totalPages: number;
	totalItems: number;
	from: number;
	to: number;
	params?: Record<string, string | undefined>;
	itemLabel?: string;
}) {
	if (totalItems === 0) return null;

	const pages = visiblePages(page, totalPages);

	return (
		<div className="flex flex-col gap-3 border-t border-slate-200/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
			<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
				Showing {from}–{to} of {totalItems} {itemLabel}
			</p>

			{totalPages > 1 ? (
				<nav
					aria-label="Pagination"
					className="flex items-center gap-1"
				>
					{page > 1 ? (
						<Link
							href={pageHref(basePath, page - 1, params)}
							aria-label="Previous page"
							className={pageLinkClass}
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</Link>
					) : (
						<span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-2 text-slate-300 dark:text-slate-600">
							<ChevronLeft className="h-3.5 w-3.5" />
						</span>
					)}

					{pages.map((candidate, index) => {
						const previous = pages[index - 1];
						return (
							<Fragment key={candidate}>
								{previous && candidate - previous > 1 ? (
									<span className="px-1 text-xs text-slate-400">…</span>
								) : null}
								<Link
									href={pageHref(basePath, candidate, params)}
									aria-current={candidate === page ? 'page' : undefined}
									className={cn(
										pageLinkClass,
										candidate === page &&
											'border-[rgba(var(--nav-glow-main),0.6)] bg-[rgba(var(--nav-glow-main),0.9)] text-white hover:text-white',
									)}
								>
									{candidate}
								</Link>
							</Fragment>
						);
					})}

					{page < totalPages ? (
						<Link
							href={pageHref(basePath, page + 1, params)}
							aria-label="Next page"
							className={pageLinkClass}
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</Link>
					) : (
						<span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-transparent px-2 text-slate-300 dark:text-slate-600">
							<ChevronRight className="h-3.5 w-3.5" />
						</span>
					)}
				</nav>
			) : null}
		</div>
	);
}
