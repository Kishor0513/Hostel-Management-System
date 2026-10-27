import Link from 'next/link';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { getSessionUser } from '@/lib/auth';
import { getRoleHome } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function ForbiddenPage() {
	const user = await getSessionUser();
	const home = user ? getRoleHome(user.role) : '/login';

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Forbidden</CardTitle>
					<CardDescription>
						You do not have permission to access this area.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{user ? (
						<p className="text-sm text-slate-400">
							Signed in as {user.name} ({user.role}).
						</p>
					) : null}
					<Link
						href={home}
						className="flex h-10 w-full items-center justify-center rounded-lg border border-white/20 bg-transparent text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
					>
						{user ? 'Go to dashboard' : 'Go to sign in'}
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
