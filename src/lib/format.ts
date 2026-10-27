export function formatMoney(value: number | string): string {
	return `NPR ${Number(value).toFixed(2)}`;
}

export function formatDateOnly(value: Date): string {
	return value.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone,
	}).format(value);
}

export function formatPercent(value: number): string {
	return `${Math.round(value * 100)}%`;
}
