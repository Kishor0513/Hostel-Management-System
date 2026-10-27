export const DEFAULT_PAGE_SIZE = 20;

export type SearchParamValue = string | string[] | undefined;
export type SearchParamsRecord = Record<string, SearchParamValue>;

export function getSearchParam(params: SearchParamsRecord, key: string) {
	const value = params[key];
	return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function getPageParam(params: SearchParamsRecord) {
	const parsed = Number.parseInt(getSearchParam(params, 'page'), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function paginate(
	totalItems: number,
	requestedPage: number,
	pageSize = DEFAULT_PAGE_SIZE,
) {
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(1, requestedPage), totalPages);
	const start = (page - 1) * pageSize;

	return {
		page,
		totalPages,
		skip: start,
		take: pageSize,
		from: totalItems === 0 ? 0 : start + 1,
		to: Math.min(start + pageSize, totalItems),
	};
}
