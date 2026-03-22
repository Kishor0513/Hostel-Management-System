'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export default function LogoutButton() {
	return (
		<Button
			variant="secondary"
			onClick={() => signOut({ callbackUrl: '/login' })}
			className="h-8 px-3 text-xs font-medium"
		>
			Sign Out
		</Button>
	);
}
