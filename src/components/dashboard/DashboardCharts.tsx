'use client';

import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Pie,
	PieChart
} from 'recharts';

import ChartCard from './ChartCard';

type TrendPoint = { label: string; value: number };

export default function DashboardCharts({
	occupancy,
	paymentsTrend,
	attendanceTrend,
	ticketBarData,
}: {
	occupancy: { occupied: number; available: number };
	paymentsTrend: TrendPoint[];
	attendanceTrend: TrendPoint[]; // value in [0..1]
	ticketBarData: Array<{
		status: string;
		maintenance: number;
		complaints: number;
	}>;
}) {
	const pieData = [
		{ name: 'Occupied', value: occupancy.occupied },
		{ name: 'Available', value: occupancy.available },
	];

	const COLORS = ['#34d399', '#fbbf24'];
	const axisTick = { fill: 'rgba(226,232,240,0.9)', fontSize: 12, fontWeight: 500 };
	const axisLine = { stroke: 'rgba(148,163,184,0.28)' };
	const tooltipStyle = {
		borderRadius: '12px',
		background: 'rgba(15,23,42,0.94)',
		border: '1px solid rgba(148,163,184,0.28)',
		color: '#f8fafc',
	};
	const legendStyle = { color: 'rgba(226,232,240,0.92)', fontSize: '12px' };

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5">
			<ChartCard
				title="Occupancy Overview"
				description="Ratio of occupied vs available beds"
			>
				<div className="dashboard-chart h-72 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<PieChart>
							<Tooltip contentStyle={tooltipStyle} />
							<Pie
								data={pieData}
								dataKey="value"
								innerRadius={74}
								outerRadius={102}
								paddingAngle={5}
								stroke="none"
							>
								{pieData.map((_, idx) => (
									<Cell
										key={idx}
										fill={COLORS[idx] ?? '#93c5fd'}
									/>
								))}
							</Pie>
							<Legend
								wrapperStyle={legendStyle}
								verticalAlign="bottom"
								height={34}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Monthly Revenue"
				description="Total payments collected (Last 6 Months)"
			>
				<div className="dashboard-chart h-72 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<AreaChart
							data={paymentsTrend}
							margin={{ top: 6, right: 8, left: -14, bottom: 4 }}
						>
							<defs>
								<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
							<XAxis
								dataKey="label"
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
							/>
							<YAxis
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, 'Revenue']}
							/>
							<Area
								type="monotone"
								dataKey="value"
								stroke="#3b82f6"
								strokeWidth={3}
								fillOpacity={1}
								fill="url(#colorValue)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Attendance Trends"
				description="Daily presence rate (Last 30 Days)"
			>
				<div className="dashboard-chart h-72 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<AreaChart
							data={attendanceTrend}
							margin={{ top: 6, right: 8, left: -14, bottom: 4 }}
						>
							<defs>
								<linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
							<XAxis
								dataKey="label"
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
								interval={4}
							/>
							<YAxis
								tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
								domain={[0, 1]}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								formatter={(v: unknown) => [
									`${(Number(v) * 100).toFixed(1)}%`,
									'Attendance',
								]}
							/>
							<Area
								type="monotone"
								dataKey="value"
								stroke="#10b981"
								strokeWidth={3}
								fillOpacity={1}
								fill="url(#colorAtt)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Support Tickets"
				description="Tickets by status and category"
			>
				<div className="dashboard-chart h-72 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<BarChart
							data={ticketBarData}
							margin={{ top: 6, right: 10, bottom: 4, left: -14 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
							<XAxis
								dataKey="status"
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
							/>
							<YAxis
								tick={axisTick}
								axisLine={axisLine}
								tickLine={false}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
							/>
							<Legend
								wrapperStyle={legendStyle}
								verticalAlign="top"
								align="right"
								height={32}
							/>
							<Bar
								dataKey="maintenance"
								name="Maintenance"
								fill="#3b82f6"
								radius={[6, 6, 0, 0]}
								barSize={26}
							/>
							<Bar
								dataKey="complaints"
								name="Complaints"
								fill="#f59e0b"
								radius={[6, 6, 0, 0]}
								barSize={26}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>
		</div>
	);
}
