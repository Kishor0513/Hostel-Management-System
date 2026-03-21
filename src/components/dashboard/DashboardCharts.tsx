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

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<ChartCard
				title="Occupancy Overview"
				description="Ratio of occupied vs available beds"
			>
				<div className="h-56 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<PieChart>
							<Tooltip 
								contentStyle={{ borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
							/>
							<Pie
								data={pieData}
								dataKey="value"
								innerRadius={65}
								outerRadius={90}
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
							<Legend verticalAlign="bottom" height={36}/>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Monthly Revenue"
				description="Total payments collected (Last 6 Months)"
			>
				<div className="h-56 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<AreaChart data={paymentsTrend}>
							<defs>
								<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
							<XAxis
								dataKey="label"
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
							/>
							<YAxis 
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
							/>
							<Tooltip
								contentStyle={{
									background: '#0f172a',
									border: '1px solid #334155',
									borderRadius: '8px',
									color: '#f8fafc'
								}}
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
				<div className="h-56 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<AreaChart data={attendanceTrend}>
							<defs>
								<linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
							<XAxis
								dataKey="label"
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
								interval={4}
							/>
							<YAxis
								tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
								domain={[0, 1]}
							/>
							<Tooltip
								contentStyle={{
									background: '#0f172a',
									border: '1px solid #334155',
									borderRadius: '8px',
									color: '#f8fafc'
								}}
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
				<div className="h-56 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<BarChart
							data={ticketBarData}
							margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
							<XAxis
								dataKey="status"
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
							/>
							<YAxis 
								tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
								axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
							/>
							<Tooltip
								contentStyle={{
									background: '#0f172a',
									border: '1px solid #334155',
									borderRadius: '8px',
									color: '#f8fafc'
								}}
							/>
							<Legend verticalAlign="top" align="right" height={36}/>
							<Bar
								dataKey="maintenance"
								name="Maintenance"
								fill="#3b82f6"
								radius={[4, 4, 0, 0]}
								barSize={24}
							/>
							<Bar
								dataKey="complaints"
								name="Complaints"
								fill="#f59e0b"
								radius={[4, 4, 0, 0]}
								barSize={24}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>
		</div>
	);
}
