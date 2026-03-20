import Link from 'next/link';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function ForbiddenPage() {
	return (
		<div className="min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Forbidden</CardTitle>
					<CardDescription>
						You do not have permission to access this area.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Link
						href="/admin"
						className="flex h-10 w-full items-center justify-center rounded-lg border border-white/20 bg-transparent text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
					>
						Go to dashboard
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
