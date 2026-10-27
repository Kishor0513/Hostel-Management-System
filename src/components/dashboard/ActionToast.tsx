'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const ERROR_MESSAGES: Record<string, string> = {
	invalid: 'The submitted data is invalid. Check the form and try again.',
	date: 'Enter a valid date that is not in the future.',
	dates: 'Enter a valid date range. The start must be before the end.',
	duplicate: 'A record with these details already exists.',
	overpayment: 'The payment exceeds the outstanding invoice balance.',
	missing: 'The selected record no longer exists.',
	conflict: 'The data changed during your request. Please try again.',
	already: 'This student is already allocated to that bed.',
	active: 'An active allocation cannot be deleted. End it first.',
	capacity: 'Capacity cannot be lower than the number of existing beds.',
	'has-history': 'This room has allocation or request history and cannot be deleted.',
	self: 'You cannot deactivate your own account.',
};

export default function ActionToast() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const error = searchParams.get('error');
	const success = searchParams.get('success');

	useEffect(() => {
		if (!error && !success) return;

		if (error) {
			toast.error(ERROR_MESSAGES[error] ?? 'The action could not be completed.');
		}
		if (success) {
			toast.success('The action completed successfully.');
		}

		const params = new URLSearchParams(searchParams.toString());
		params.delete('error');
		params.delete('success');
		const query = params.toString();

		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		});
	}, [error, success, searchParams, pathname, router]);

	return null;
}
