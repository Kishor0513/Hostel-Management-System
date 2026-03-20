'use client';

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
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
		<div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
			<ChartCard
				title="Occupancy"
				description="Active allocations vs free beds"
			>
				<div className="h-36 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<PieChart>
							<Tooltip />
							<Pie
								data={pieData}
								dataKey="value"
								innerRadius={52}
								outerRadius={78}
							>
								{pieData.map((_, idx) => (
									<Cell
										key={idx}
										fill={COLORS[idx] ?? '#93c5fd'}
									/>
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Payments Trend"
				description="Total collected each month (last 6 months)"
			>
				<div className="h-36 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<LineChart data={paymentsTrend}>
							<CartesianGrid stroke="rgba(255,255,255,0.08)" />
							<XAxis
								dataKey="label"
								tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
							/>
							<YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									background: 'rgba(5,5,5,0.9)',
									border: '1px solid rgba(255,255,255,0.1)',
								}}
								formatter={(v: unknown) => [Number(v).toFixed(2), 'Collected']}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="value"
								name="Collected"
								stroke="#60a5fa"
								strokeWidth={3}
								dot={{ r: 3 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Attendance Rate"
				description="Present rate per day (last 30 days)"
			>
				<div className="h-36 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<LineChart data={attendanceTrend}>
							<CartesianGrid stroke="rgba(255,255,255,0.08)" />
							<XAxis
								dataKey="label"
								tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
								interval="preserveStartEnd"
							/>
							<YAxis
								tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
								tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
								domain={[0, 1]}
							/>
							<Tooltip
								contentStyle={{
									background: 'rgba(5,5,5,0.9)',
									border: '1px solid rgba(255,255,255,0.1)',
								}}
								formatter={(v: unknown) => [
									`${(Number(v) * 100).toFixed(1)}%`,
									'Present rate',
								]}
							/>
							<Line
								type="monotone"
								dataKey="value"
								name="Present rate"
								stroke="#34d399"
								strokeWidth={3}
								dot={{ r: 3 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>

			<ChartCard
				title="Tickets by Status"
				description="Maintenance vs Complaints (OPEN / IN_PROGRESS / CLOSED)"
			>
				<div className="h-36 w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<BarChart
							data={ticketBarData}
							margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
						>
							<CartesianGrid stroke="rgba(255,255,255,0.08)" />
							<XAxis
								dataKey="status"
								tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
							/>
							<YAxis tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									background: 'rgba(5,5,5,0.9)',
									border: '1px solid rgba(255,255,255,0.1)',
								}}
							/>
							<Legend />
							<Bar
								dataKey="maintenance"
								fill="#60a5fa"
								radius={[6, 6, 0, 0]}
							/>
							<Bar
								dataKey="complaints"
								fill="#fbbf24"
								radius={[6, 6, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</ChartCard>
		</div>
	);
}
