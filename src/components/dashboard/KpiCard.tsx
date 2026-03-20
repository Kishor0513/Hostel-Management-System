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
		<Card className="bg-slate-800/50 border-slate-700">
			<CardHeader className="pb-2">
				<CardTitle className="text-xs font-medium text-white/70">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0 pb-0 px-4">
				<div className="text-2xl font-semibold text-white/90">{value}</div>
				{helper ? (
					<div className="mt-0.5 text-xs text-white/60">{helper}</div>
				) : null}
			</CardContent>
		</Card>
	);
}
