import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import { getOrganizationSettings } from '@/lib/settings';
import { requireStudentContext } from '@/lib/student';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function StudentAnnouncementsPage() {
	await requireStudentContext();
	const settings = await getOrganizationSettings();

	const announcements = await prisma.announcement.findMany({
		where: { isPublished: true },
		orderBy: { publishedAt: 'desc' },
		take: 50,
		select: {
			id: true,
			title: true,
			content: true,
			publishedAt: true,
		},
	});

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<div className="page-header">
				<div>
					<h1 className="page-title">Announcements</h1>
					<p className="page-subtitle">
						Published notices from {settings.organizationName}.
					</p>
				</div>
				<Badge
					variant="info"
					className="h-fit"
				>
					{announcements.length} published
				</Badge>
			</div>

			{announcements.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-sm text-slate-400">
						No announcements have been published yet.
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{announcements.map((announcement) => (
						<Card key={announcement.id}>
							<CardHeader>
								<div className="flex items-start justify-between gap-4">
									<div>
										<CardTitle>{announcement.title}</CardTitle>
										<CardDescription>
											{announcement.publishedAt
												? formatDateTime(
														announcement.publishedAt,
														settings.timezone,
													)
												: 'Not published'}
										</CardDescription>
									</div>
									<Badge variant="success">Published</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="whitespace-pre-wrap text-sm text-slate-300">
									{announcement.content}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
