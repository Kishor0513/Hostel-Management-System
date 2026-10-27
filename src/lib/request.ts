import { headers } from 'next/headers';

type HeaderSource =
	| Headers
	| Readonly<Record<string, string | string[] | undefined>>;

function readHeader(source: HeaderSource, name: string): string | null {
	if (source instanceof Headers) {
		return source.get(name);
	}

	const value = source[name] ?? source[name.toLowerCase()];
	if (Array.isArray(value)) {
		return value.join(',');
	}

	return value ?? null;
}

export function getClientIp(source: HeaderSource): string | null {
	const forwardedFor = readHeader(source, 'x-forwarded-for');
	if (forwardedFor) {
		const first = forwardedFor.split(',')[0]?.trim();
		if (first) return first;
	}

	return (
		readHeader(source, 'x-real-ip')?.trim() ||
		readHeader(source, 'cf-connecting-ip')?.trim() ||
		null
	);
}

export async function getRequestMeta(): Promise<{
	ip: string | null;
	userAgent: string | null;
}> {
	try {
		const requestHeaders = await headers();
		return {
			ip: getClientIp(requestHeaders),
			userAgent: readHeader(requestHeaders, 'user-agent'),
		};
	} catch {
		return { ip: null, userAgent: null };
	}
}
