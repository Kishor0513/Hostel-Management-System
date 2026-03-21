'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export default function LogoutButton() {
	return (
		<Button
			variant="outline"
			onClick={() => signOut({ callbackUrl: '/login' })}
			className="w-full border-red-500/20 bg-red-500/10 text-xs font-medium text-red-400 hover:bg-red-500 hover:text-white transition-all"
		>
			Sign Out
		</Button>
	);
}
