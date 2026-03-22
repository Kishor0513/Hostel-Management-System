import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KpiCard({
	label,
	value,
	helper,
}: {
	label: string;
	value: string;
	helper?: string;
}) {
	return (
		<Card className="border-white/20 bg-white/10">
			<CardHeader className="pb-2">
				<CardTitle className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300/80">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0 pb-0 px-4">
				<div className="text-4xl font-semibold leading-tight text-slate-900 dark:text-white">
					{value}
				</div>
				{helper ? (
					<div className="mt-1 text-xs text-slate-500 dark:text-slate-300/80">
						{helper}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
