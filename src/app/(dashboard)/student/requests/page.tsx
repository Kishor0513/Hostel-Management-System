import { Badge, type BadgeVariant } from '@/components/ui/badge';
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
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';
import { getOrganizationSettings } from '@/lib/settings';
import { requireStudentContext } from '@/lib/student';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, MessageSquareWarning, Wrench } from 'lucide-react';

import { createMyComplaint, createMyMaintenanceRequest } from '../actions';

export const dynamic = 'force-dynamic';

function statusVariant(status: string): BadgeVariant {
	if (status === 'OPEN') return 'warning';
	if (status === 'IN_PROGRESS') return 'info';
	return 'success';
}

export default async function StudentRequestsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string; tab?: string }>;
}) {
	const { student } = await requireStudentContext();
	const settings = await getOrganizationSettings();
	const params = await searchParams;

	const [complaints, maintenance] = await Promise.all([
		prisma.complaintTicket.findMany({
			where: { studentId: student.id },
			orderBy: { createdAt: 'desc' },
			take: 20,
			include: {
				logs: { orderBy: { changedAt: 'desc' }, take: 1 },
			},
		}),
		prisma.maintenanceRequest.findMany({
			where: { studentId: student.id },
			orderBy: { createdAt: 'desc' },
			take: 20,
			include: {
				logs: { orderBy: { changedAt: 'desc' }, take: 1 },
			},
		}),
	]);

	return (
		<div className="space-y-5 lg:space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">My Requests</h1>
					<p className="page-subtitle">
						Raise complaints and maintenance requests. Updates are made by
						hostel staff.
					</p>
				</div>
				<Badge
					variant={
						complaints.length + maintenance.length > 0 ? 'info' : 'success'
					}
					className="h-fit"
				>
					{complaints.length + maintenance.length} total
				</Badge>
			</div>

			{params.saved ? (
				<div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
					<CheckCircle2 className="h-4 w-4" />
					{params.saved === 'complaint'
						? 'Complaint submitted.'
						: 'Maintenance request submitted.'}
				</div>
			) : null}
			{params.error ? (
				<div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
					Please provide a title (3+ characters) and a description (10+
					characters).
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
				<Card id="complaints">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-300">
								<MessageSquareWarning className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>New Complaint</CardTitle>
								<CardDescription>
									Issues with facilities, services, or other residents.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form
							action={createMyComplaint}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="complaint-subject">Subject</Label>
								<Input
									id="complaint-subject"
									name="subject"
									placeholder="Short summary"
									required
									minLength={3}
									maxLength={140}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="complaint-description">Description</Label>
								<Textarea
									id="complaint-description"
									name="description"
									placeholder="What happened, where, and when?"
									required
									minLength={10}
									maxLength={4000}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="complaint-priority">Priority</Label>
								<Select
									id="complaint-priority"
									name="priority"
									defaultValue="2"
								>
									<option value="1">Low</option>
									<option value="2">Normal</option>
									<option value="3">Urgent</option>
								</Select>
							</div>
							<Button
								type="submit"
								className="w-full sm:w-auto"
							>
								Submit Complaint
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card id="maintenance">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/20 text-sky-300">
								<Wrench className="h-4 w-4" />
							</div>
							<div>
								<CardTitle>New Maintenance Request</CardTitle>
								<CardDescription>
									Repairs or facility issues that need a technician.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form
							action={createMyMaintenanceRequest}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="maintenance-title">Title</Label>
								<Input
									id="maintenance-title"
									name="title"
									placeholder="What needs to be fixed?"
									required
									minLength={3}
									maxLength={140}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="maintenance-description">
									Description
								</Label>
								<Textarea
									id="maintenance-description"
									name="description"
									placeholder="Describe the issue and its location."
									required
									minLength={10}
									maxLength={4000}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="maintenance-priority">Priority</Label>
								<Select
									id="maintenance-priority"
									name="priority"
									defaultValue="2"
								>
									<option value="1">Low</option>
									<option value="2">Normal</option>
									<option value="3">Urgent</option>
								</Select>
							</div>
							<Button
								type="submit"
								className="w-full sm:w-auto"
							>
								Submit Request
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>My Complaints</CardTitle>
					<CardDescription>
						Updates are visible here after staff review.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{complaints.length === 0 ? (
						<p className="text-sm text-slate-400">
							You have not submitted any complaints.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Subject</TableHead>
									<TableHead>Submitted</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Last Update</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{complaints.map((complaint) => (
									<TableRow key={complaint.id}>
										<TableCell className="font-medium">
											{complaint.subject}
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{formatDateTime(
												complaint.createdAt,
												settings.timezone,
											)}
										</TableCell>
										<TableCell>
											<Badge variant={statusVariant(complaint.status)}>
												{complaint.status}
											</Badge>
										</TableCell>
										<TableCell className="text-xs text-slate-400">
											{complaint.logs[0]?.comment ?? '—'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>My Maintenance Requests</CardTitle>
					<CardDescription>
						Technician assignments and progress appear here.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{maintenance.length === 0 ? (
						<p className="text-sm text-slate-400">
							You have not submitted any maintenance requests.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead>Submitted</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Last Update</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{maintenance.map((request) => (
									<TableRow key={request.id}>
										<TableCell className="font-medium">
											{request.title}
										</TableCell>
										<TableCell className="whitespace-nowrap text-xs">
											{formatDateTime(
												request.createdAt,
												settings.timezone,
											)}
										</TableCell>
										<TableCell>
											<Badge variant={statusVariant(request.status)}>
												{request.status}
											</Badge>
										</TableCell>
										<TableCell className="text-xs text-slate-400">
											{request.logs[0]?.comment ?? '—'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
