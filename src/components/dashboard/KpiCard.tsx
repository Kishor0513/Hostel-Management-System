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
		<Card className="glass-hover group relative overflow-hidden border-white/12 bg-slate-950/72 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(2,8,23,0.52)]">
			<div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sky-400/0 via-sky-400/80 to-sky-400/0 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
			<CardHeader className="pb-1">
				<CardTitle className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-300/85">
					{label}
				</CardTitle>
			</CardHeader>
			<CardContent className="px-5 pb-5 pt-1">
				<div className="text-4xl font-semibold leading-tight tracking-tight text-white">
					{value}
				</div>
				{helper ? (
					<div className="mt-2 text-xs font-medium text-slate-300/80">
						{helper}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
