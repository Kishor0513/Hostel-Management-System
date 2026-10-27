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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrganizationSettings } from '@/lib/settings';
import { LOGIN_RATE_LIMIT } from '@/lib/rate-limit';
import {
	Building2,
	CheckCircle2,
	ScrollText,
	ShieldCheck,
} from 'lucide-react';

import { updateOrganizationSettings } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	const user = await requireRole(['ADMIN']);
	const params = await searchParams;

	const [settings, recentActivity] = await Promise.all([
		getOrganizationSettings(),
		prisma.auditLog.findMany({
			orderBy: { createdAt: 'desc' },
			take: 12,
			select: {
				id: true,
				action: true,
				entityType: true,
				entityId: true,
				createdAt: true,
				actorUser: { select: { name: true, email: true } },
			},
		}),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
					Admin Settings
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-300/80">
					Organization details are stored in PostgreSQL and used across
					the admin and student portals.
				</p>
			</div>

			{params.saved ? (
				<div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
					<CheckCircle2 className="h-4 w-4" />
					Settings saved.
				</div>
			) : null}
			{params.error ? (
				<div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
					Please check the values and try again.
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
								<Building2 className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Organization Profile</CardTitle>
								<CardDescription>
									Used in the portal header, invoices, and support
									contact links.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form
							action={updateOrganizationSettings}
							className="grid grid-cols-1 gap-4 md:grid-cols-2"
						>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="organizationName">
									Organization Name
								</Label>
								<Input
									id="organizationName"
									name="organizationName"
									defaultValue={settings.organizationName}
									required
									maxLength={120}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="supportEmail">Support Email</Label>
								<Input
									id="supportEmail"
									name="supportEmail"
									type="email"
									defaultValue={settings.supportEmail}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="billingEmail">Billing Email</Label>
								<Input
									id="billingEmail"
									name="billingEmail"
									type="email"
									defaultValue={settings.billingEmail}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="timezone">Timezone</Label>
								<Input
									id="timezone"
									name="timezone"
									defaultValue={settings.timezone}
									placeholder="Asia/Kolkata"
									required
								/>
								<p className="text-xs text-slate-500">
									IANA timezone, for example Asia/Kolkata or
									Europe/London.
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="invoiceDueDays">
									Default Invoice Due Days
								</Label>
								<Input
									id="invoiceDueDays"
									name="invoiceDueDays"
									type="number"
									min={1}
									max={90}
									defaultValue={settings.invoiceDueDays}
									required
								/>
							</div>
							<div className="flex justify-end pt-2 md:col-span-2">
								<Button
									type="submit"
									className="border-none bg-rose-600 px-8 font-bold shadow-[0_10px_24px_rgba(225,29,72,0.3)] hover:bg-rose-500"
								>
									Save Changes
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
								<ShieldCheck className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Security Policy</CardTitle>
								<CardDescription>
									Active values enforced by this deployment.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-200/90">
						<div className="flex items-center justify-between gap-3">
							<span>Session lifetime</span>
							<Badge variant="success">8 hours</Badge>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span>Password hashing</span>
							<Badge variant="success">bcrypt cost 12</Badge>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span>Login lockout</span>
							<Badge variant="success">
								{LOGIN_RATE_LIMIT.maxFailuresPerIdentifier}/
								{LOGIN_RATE_LIMIT.windowMinutes} min
							</Badge>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span>Audit logging</span>
							<Badge variant="success">PostgreSQL</Badge>
						</div>
						<p className="pt-2 text-xs text-slate-500">
							Signed in as {user.email}. Only ADMIN accounts can change
							organization settings.
						</p>
					</CardContent>
				</Card>

				<Card className="xl:col-span-3">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
								<ScrollText className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>
									Latest audited changes written by the application.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{recentActivity.length === 0 ? (
							<p className="text-sm text-slate-500">
								No audit events recorded yet.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>When</TableHead>
										<TableHead>Action</TableHead>
										<TableHead>Entity</TableHead>
										<TableHead>Actor</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recentActivity.map((entry) => (
										<TableRow key={entry.id}>
											<TableCell className="whitespace-nowrap text-xs">
												{entry.createdAt.toISOString().replace('T', ' ').slice(0, 19)} UTC
											</TableCell>
											<TableCell className="font-mono text-xs">
												{entry.action}
											</TableCell>
											<TableCell className="text-xs">
												{entry.entityType}
												{entry.entityId ? ` · ${entry.entityId}` : ''}
											</TableCell>
											<TableCell className="text-xs">
												{entry.actorUser?.email ?? 'system'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
