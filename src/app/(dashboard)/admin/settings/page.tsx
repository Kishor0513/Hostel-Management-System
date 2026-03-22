import AdminSettingsPanel from '@/components/dashboard/AdminSettingsPanel';
import { requireRole } from '@/lib/auth';

export default async function AdminSettingsPage() {
	await requireRole(['ADMIN', 'STAFF']);

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
					Admin Settings
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-300/80">
					Production-style configuration for appearance, security,
					notifications, and integrations.
				</p>
			</div>
			<AdminSettingsPanel />
		</div>
	);
}
