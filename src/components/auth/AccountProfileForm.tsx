'use client';

import { Mail, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	updateMyAccount,
	type AccountUpdateState,
} from '@/lib/account-actions';

const initialState: AccountUpdateState = { status: 'idle' };

export default function AccountProfileForm({
	name,
	email,
}: {
	name: string;
	email: string;
}) {
	const router = useRouter();
	const [state, formAction, pending] = useActionState(
		updateMyAccount,
		initialState,
	);

	useEffect(() => {
		if (state.status === 'success') {
			toast.success(state.message ?? 'Account updated.');
			router.refresh();
		}
		if (state.status === 'error') {
			toast.error(state.message ?? 'Could not update account.');
		}
	}, [state, router]);

	return (
		<form
			action={formAction}
			className="space-y-5 py-2"
		>
			<div className="space-y-2">
				<Label htmlFor="name">Display Name</Label>
				<div className="relative">
					<User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<Input
						id="name"
						name="name"
						defaultValue={name}
						required
						maxLength={120}
						className="pl-10"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="email">Login Email</Label>
				<div className="relative">
					<Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<Input
						id="email"
						name="email"
						type="email"
						defaultValue={email}
						required
						className="pl-10"
					/>
				</div>
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Update Password</Label>
				<div className="relative">
					<Shield className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="••••••••"
						minLength={8}
						maxLength={72}
						autoComplete="new-password"
						className="pl-10"
					/>
				</div>
				<p className="text-[0.7rem] font-medium italic text-slate-500">
					Leave blank to keep the current password. Use 8-72 characters.
				</p>
			</div>
			{state.status === 'error' ? (
				<p
					role="alert"
					className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
				>
					{state.message}
				</p>
			) : null}
			<div className="flex justify-end border-t border-white/5 pt-3">
				<Button
					type="submit"
					disabled={pending}
					className="border-none bg-rose-600 px-8 font-bold shadow-[0_10px_24px_rgba(225,29,72,0.3)] hover:bg-rose-500 disabled:opacity-60"
				>
					{pending ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</form>
	);
}
