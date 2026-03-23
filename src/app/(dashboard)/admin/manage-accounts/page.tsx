import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requireRole } from '@/lib/auth';
import { Mail, Shield, User, UserCircle } from 'lucide-react';

import { updateMyAccount } from './actions';

export default async function ManageAccountsPage() {
	const user = await requireRole(['ADMIN', 'STAFF']);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">My Profile</h1>
					<p className="page-subtitle">
						Update your personal account details and security settings.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
				{/* Edit Profile */}
				<Card className="xl:col-span-3">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
								<User className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Profile Settings</CardTitle>
								<CardDescription>Account details</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form
							action={updateMyAccount}
							className="space-y-5 py-2"
						>
							<div className="space-y-2">
								<Label htmlFor="name">Display Name</Label>
								<div className="relative">
									<User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
									<Input
										id="name"
										name="name"
										defaultValue={user.name}
										required
										className="pl-10"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Login Email</Label>
								<div className="relative">
									<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
									<Input
										id="email"
										name="email"
										type="email"
										defaultValue={user.email}
										required
										className="pl-10"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Update Password</Label>
								<div className="relative">
									<Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
									<Input
										id="password"
										name="password"
										type="password"
										placeholder="••••••••"
										minLength={8}
										className="pl-10"
									/>
								</div>
								<p className="text-[0.7rem] font-medium text-slate-500 italic">
									Leave blank to keep current password.
								</p>
							</div>
							<div className="flex justify-end pt-3 border-t border-white/5">
								<Button
									type="submit"
									className="bg-rose-600 hover:bg-rose-500 font-bold px-8 shadow-[0_10px_24px_rgba(225,29,72,0.3)] border-none"
								>
									Save Changes
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Account Info */}
				<Card className="xl:col-span-2 overflow-visible">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
								<UserCircle className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Account Info</CardTitle>
								<CardDescription>System metadata</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4 pt-2">
						<div className="group relative rounded-2xl border border-white/10 bg-slate-900/40 p-5 transition-all duration-300 hover:bg-slate-900/60">
							<p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
								Access Level
							</p>
							<div className="mt-2 flex items-center justify-between">
								<p className="text-xl font-bold text-white tracking-tight">
									{user.role}
								</p>
								<Badge
									variant="success"
									className="h-fit"
								>
									Verified
								</Badge>
							</div>
						</div>

						<div className="group relative rounded-2xl border border-white/10 bg-slate-900/40 p-5 transition-all duration-300 hover:bg-slate-900/60">
							<p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
								Full Name
							</p>
							<p className="mt-2 text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
								{user.name}
							</p>
						</div>

						<div className="group relative rounded-2xl border border-white/10 bg-slate-900/40 p-5 transition-all duration-300 hover:bg-slate-900/60">
							<p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
								Registered Email
							</p>
							<p className="mt-2 text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
								{user.email}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
