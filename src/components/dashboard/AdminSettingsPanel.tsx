'use client';

import {
	Bell,
	Building2,
	Link as LinkIcon,
	ShieldCheck,
	UserCog,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function ToggleRow({
	label,
	description,
	enabled,
	onToggle,
}: {
	label: string;
	description: string;
	enabled: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-xl border border-white/45 bg-white/35 px-4 py-3 dark:border-white/15 dark:bg-slate-900/35">
			<div>
				<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
					{label}
				</p>
				<p className="text-xs text-slate-500 dark:text-slate-300/80">
					{description}
				</p>
			</div>
			<button
				type="button"
				onClick={onToggle}
				className={`relative h-6 w-11 rounded-full transition ${
					enabled ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
				}`}
				aria-pressed={enabled}
			>
				<span
					className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
						enabled ? 'left-[1.35rem]' : 'left-0.5'
					}`}
				/>
			</button>
		</div>
	);
}

export default function AdminSettingsPanel() {
	const [emailAlerts, setEmailAlerts] = useState(true);
	const [pushAlerts, setPushAlerts] = useState(false);
	const [enforce2FA, setEnforce2FA] = useState(true);
	const [auditLogs, setAuditLogs] = useState(true);

	return (
		<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
			<Card className="xl:col-span-2">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Building2 className="h-4 w-4 text-slate-500 dark:text-slate-300" />
						<CardTitle>Organization Profile</CardTitle>
					</div>
					<CardDescription>
						Configure your hostel identity and contact details used in invoices
						and notifications.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<Input
						placeholder="Organization Name"
						defaultValue="Oasis Hostel Group"
					/>
					<Input
						placeholder="Support Email"
						defaultValue="support@oasishostel.com"
					/>
					<Input
						placeholder="Timezone"
						defaultValue="Asia/Kolkata (UTC+5:30)"
					/>
					<Input
						placeholder="Billing Contact"
						defaultValue="accounts@oasishostel.com"
					/>
					<div className="md:col-span-2 flex justify-end gap-2 pt-2">
						<Button variant="outline">Discard</Button>
						<Button>Save Changes</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<UserCog className="h-4 w-4 text-slate-500 dark:text-slate-300" />
						<CardTitle>Admin Controls</CardTitle>
					</div>
					<CardDescription>
						Manage default behavior for staff and supervisor accounts.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<ToggleRow
						label="Enforce Two-Factor Auth"
						description="Require OTP verification for all admin/staff logins."
						enabled={enforce2FA}
						onToggle={() => setEnforce2FA((v) => !v)}
					/>
					<ToggleRow
						label="Audit Log Retention"
						description="Store admin action history for 180 days."
						enabled={auditLogs}
						onToggle={() => setAuditLogs((v) => !v)}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Bell className="h-4 w-4 text-slate-500 dark:text-slate-300" />
						<CardTitle>Notifications</CardTitle>
					</div>
					<CardDescription>
						Choose how urgent hostel events are sent to admins.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<ToggleRow
						label="Email Alerts"
						description="Send payment failures and complaint escalations."
						enabled={emailAlerts}
						onToggle={() => setEmailAlerts((v) => !v)}
					/>
					<ToggleRow
						label="Push Alerts"
						description="Realtime browser alerts for room incidents."
						enabled={pushAlerts}
						onToggle={() => setPushAlerts((v) => !v)}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<LinkIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
						<CardTitle>Integrations</CardTitle>
					</div>
					<CardDescription>
						Connect external services often used in production projects.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="rounded-xl border border-white/45 bg-white/35 px-4 py-3 dark:border-white/15 dark:bg-slate-900/35">
						<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
							Razorpay
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-300/80">
							Payment gateway for invoice collection.
						</p>
						<Button
							variant="secondary"
							size="sm"
							className="mt-3"
						>
							Connect
						</Button>
					</div>
					<div className="rounded-xl border border-white/45 bg-white/35 px-4 py-3 dark:border-white/15 dark:bg-slate-900/35">
						<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
							Twilio SMS
						</p>
						<p className="text-xs text-slate-500 dark:text-slate-300/80">
							Automated reminders for due invoices.
						</p>
						<Button
							variant="secondary"
							size="sm"
							className="mt-3"
						>
							Configure
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-4 w-4 text-slate-500 dark:text-slate-300" />
						<CardTitle>Security Policy</CardTitle>
					</div>
					<CardDescription>
						Baseline defaults for enterprise deployments.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-200/90">
					<p>- Session timeout: 30 minutes</p>
					<p>- Password rotation: every 90 days</p>
					<p>- IP anomaly lock: enabled</p>
					<p>- Data export approval: required</p>
					<div className="pt-2">
						<Button size="sm">Review Full Policy</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
