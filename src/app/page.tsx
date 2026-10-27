import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth';
import { getRoleHome } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const user = await getSessionUser();

	if (!user) {
		redirect('/login');
	}

	redirect(getRoleHome(user.role));
}
