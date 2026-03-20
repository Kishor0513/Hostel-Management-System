import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
	await requireRole(['ADMIN', 'STAFF', 'STUDENT']);

	let announcements: Array<{
		id: string;
		title: string;
		content: string;
		publishedAt: Date | null;
	}> = [];
	let dataError: string | null = null;

	try {
		announcements = await prisma.announcement.findMany({
			where: { isPublished: true },
			orderBy: { publishedAt: 'desc' },
			take: 30,
			select: { id: true, title: true, content: true, publishedAt: true },
		});
	} catch {
		dataError =
			'Database connection failed. Check DATABASE_URL in .env to load announcements.';
	}

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold text-white/90">Announcements</h1>
				<p className="text-sm text-white/60">
					Published notices for students and staff.
				</p>
			</div>

			{dataError ? (
				<div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
					{dataError}
				</div>
			) : null}

			<div className="space-y-4">
				{announcements.map((a) => (
					<Card key={a.id}>
						<CardHeader>
							<div className="flex items-start justify-between gap-4">
								<div>
									<CardTitle>{a.title}</CardTitle>
									<CardDescription>
										Published on{' '}
										{a.publishedAt
											? a.publishedAt.toISOString().slice(0, 10)
											: '-'}
									</CardDescription>
								</div>
								<Badge variant="success">Published</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="whitespace-pre-wrap text-sm text-white/80">
								{a.content}
							</div>
						</CardContent>
					</Card>
				))}
				{announcements.length === 0 ? (
					<p className="text-white/60">No announcements at the moment.</p>
				) : null}
			</div>
		</div>
	);
}
