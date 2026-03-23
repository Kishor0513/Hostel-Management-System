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
import { Calendar, Globe, Megaphone, Plus, Trash2 } from 'lucide-react';

import {
	createAnnouncement as createAnnouncementAction,
	deleteAnnouncement as deleteAnnouncementAction,
} from './actions';

export default async function AdminAnnouncementsPage() {
	await requireRole(['ADMIN']);

	const announcements = await prisma.announcement.findMany({
		orderBy: { createdAt: 'desc' },
		take: 30,
	});

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="page-header">
				<div>
					<h1 className="page-title">Announcements</h1>
					<p className="page-subtitle">
						Publish important notices and news for all hostel members.
					</p>
				</div>
				<Badge
					variant="info"
					className="h-fit"
				>
					Live Notices: {announcements.filter((a) => a.isPublished).length}
				</Badge>
			</div>

			{/* Create Announcement */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300">
							<Plus className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Create Announcement</CardTitle>
							<CardDescription>Create a new notice</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<form
						action={createAnnouncementAction}
						className="space-y-4 max-w-280"
					>
						<div className="space-y-1.5">
							<Label htmlFor="title">Notice Title</Label>
							<Input
								id="title"
								name="title"
								required
								placeholder="Ex: Holi Celebration / Maintenance Notice"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="content">Notice Content</Label>
							<textarea
								id="content"
								name="content"
								required
								placeholder="Enter detailed information here..."
								className="min-h-30 w-full rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-800/80 dark:text-white dark:focus:border-rose-400/80"
							/>
						</div>
						<div className="flex items-center gap-3 py-1">
							<input
								id="isPublished"
								name="isPublished"
								type="checkbox"
								value="1"
								className="h-4 w-4 rounded-lg bg-slate-900 border-white/20 accent-rose-500"
							/>
							<Label
								htmlFor="isPublished"
								className="text-sm font-semibold text-slate-700 dark:text-slate-300"
							>
								Publish immediately to feed
							</Label>
						</div>

						<div className="flex justify-end">
							<Button
								type="submit"
								className="bg-rose-600 hover:bg-rose-500 px-6 font-bold shadow-[0_10px_24px_rgba(225,29,72,0.3)]"
							>
								Save & Broadcast
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Announcement Feed */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-500/20 text-slate-300">
							<Megaphone className="h-4 w-4" />
						</div>
						<div>
							<CardTitle>Broadcast Feed</CardTitle>
							<CardDescription>Latest notices feed</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Announcement</TableHead>
								<TableHead className="w-35">Status</TableHead>
								<TableHead className="w-40">Broadcast Date</TableHead>
								<TableHead className="w-25 text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{announcements.map((a) => (
								<TableRow key={a.id}>
									<TableCell>
										<div className="space-y-1.5 py-1">
											<div className="flex items-center gap-2">
												<div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
												<div className="font-bold text-white/95 text-base tracking-tight">
													{a.title}
												</div>
											</div>
											<div className="text-sm text-slate-400 line-clamp-2 leading-relaxed pl-3.5 border-l border-white/10 ml-0.5">
												{a.content}
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={a.isPublished ? 'success' : 'warning'}
											className="flex w-fit items-center gap-1.5"
										>
											{a.isPublished && <Globe className="h-3 w-3" />}
											{a.isPublished ? 'Published' : 'Draft'}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
											<Calendar className="h-3.5 w-3.5" />
											{a.createdAt.toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<form action={deleteAnnouncementAction}>
											<input
												type="hidden"
												name="announcementId"
												value={a.id}
											/>
											<Button
												type="submit"
												variant="ghost"
												className="h-8 w-8 p-0 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
							{announcements.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4}>
										<div className="data-empty">
											<Megaphone className="data-empty-icon" />
											<p>
												No broadcast history found. Start by creating a notice.
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
