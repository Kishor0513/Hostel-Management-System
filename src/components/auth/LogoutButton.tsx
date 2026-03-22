'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

export default function LogoutButton() {
	return (
		<Button
			variant="secondary"
			onClick={() => signOut({ callbackUrl: '/login' })}
			className="h-9 border-white/12 bg-white/10 px-3 text-xs font-semibold text-slate-100 hover:bg-white/15"
		>
			Sign Out
		</Button>
	);
}
