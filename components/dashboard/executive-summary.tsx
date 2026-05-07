/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useMemo } from "react";
import { Customer } from "@/types";
import {
	calculateDashboardStats,
} from "@/lib/logic";

import {
	CartesianGrid,
	Cell,
	Funnel,
	FunnelChart,
	LabelList,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
	ZAxis,
} from "recharts";

import { motion } from "motion/react";

import {
	AlertTriangle,
	DollarSign,
	RefreshCw,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface ExecutiveSummaryProps {
	data: Customer[];
	onSync: () => void;
	isSyncing: boolean;
}

export default function ExecutiveSummary({
	                                         data,
	                                         onSync,
	                                         isSyncing,
                                         }: ExecutiveSummaryProps) {
	const stats = useMemo(
		() => calculateDashboardStats(data),
		[data]
	);

	const funnelData = useMemo(() => {
		const total = data.length;

		let passedAUM = 0;
		let passedCollectibility = 0;
		let passedBScore = 0;

		data.forEach((c) => {
			const aumEligible =
				(c.segment === "ETB" &&
					c.aum > 5000000) ||
				(c.segment === "ETB Priority" &&
					c.aum > 500000000) ||
				c.segment === "Payroll" ||
				c.segment === "NTB";

			if (aumEligible) {
				passedAUM++;

				if (c.collectibility === 1) {
					passedCollectibility++;

					if (
						c.ccBscore !== null &&
						c.ccBscore > 410
					) {
						passedBScore++;
					}
				}
			}
		});

		return [
			{
				value: total,
				name: "Total Population",
				fill: "#10b981",
			},
			{
				value: passedAUM,
				name: "Passed AUM Check",
				fill: "#059669",
			},
			{
				value: passedCollectibility,
				name: "Passed Collectibility",
				fill: "#047857",
			},
			{
				value: passedBScore,
				name: "Passed BScore Check",
				fill: "#065f46",
			},
		];
	}, [data]);

	const riskMatrixData = useMemo(() => {
		return data.slice(0, 500).map((c) => ({
			bscore: c.ccBscore || 0,
			collectibility: c.collectibility,
			z: 1,
			id: c.appId,
		}));
	}, [data]);

	const formatBillions = (val: number) => {
		return (
			(val / 1000000000).toFixed(2) + "B"
		);
	};

	const kpis = [
		{
			label: "Total Eligible AUM",
			value: formatBillions(
				stats.totalEligibleAUM
			),
			sub: "IDR Billions",
			icon: DollarSign,
			iconClass:
				"text-emerald-600 dark:text-emerald-400",
			bgClass:
				"bg-emerald-500/10 border border-emerald-500/20",
		},
		{
			label: "Healthy Portfolio Ratio",
			value:
				stats.healthyPortfolioRatio.toFixed(
					1
				) + "%",
			sub: "Coll 1 & Clean Block",
			icon: ShieldCheck,
			iconClass:
				"text-blue-600 dark:text-blue-400",
			bgClass:
				"bg-blue-500/10 border border-blue-500/20",
		},
		{
			label: "High-Risk Exposure",
			value: formatBillions(
				stats.highRiskExposure
			),
			sub: "Util > 80% Balance",
			icon: AlertTriangle,
			iconClass:
				"text-rose-600 dark:text-rose-400",
			bgClass:
				"bg-rose-500/10 border border-rose-500/20",
		},
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<h2 className="text-3xl font-bold tracking-tight">
						Executive Summary
					</h2>

					<p className="text-muted-foreground">
						Real-time portfolio health and
						risk assessment.
					</p>
				</div>

				<Button
					onClick={onSync}
					disabled={isSyncing}
					className="h-12 rounded-2xl px-6 font-semibold"
				>
					<RefreshCw
						className={`mr-2 h-4 w-4 ${
							isSyncing ? "animate-spin" : ""
						}`}
					/>

					Sync Data
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{
							opacity: 0,
							y: 20,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						transition={{
							delay: i * 0.1,
						}}
					>
						<Card className="group rounded-3xl border-border/50 transition-all hover:border-primary/30 hover:shadow-lg">
							<CardContent className="p-6">
								<div className="mb-5 flex items-center justify-between">
									<div
										className={`rounded-2xl p-3 ${kpi.bgClass}`}
									>
										<kpi.icon
											className={`h-6 w-6 ${kpi.iconClass}`}
										/>
									</div>

									<TrendingUp className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
								</div>

								<p className="text-muted-foreground mb-1 text-sm font-semibold uppercase tracking-wider">
									{kpi.label}
								</p>

								<h3 className="text-3xl font-bold tracking-tight">
									{kpi.value}
								</h3>

								<p className="text-muted-foreground mt-2 text-xs">
									{kpi.sub}
								</p>
							</CardContent>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				{/* Funnel */}
				<motion.div
					initial={{
						opacity: 0,
						scale: 0.96,
					}}
					animate={{
						opacity: 1,
						scale: 1,
					}}
				>
					<Card className="rounded-3xl border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>
								Eligibility Funnel
							</CardTitle>

							<CardDescription>
								Drop-off analysis through
								business rules.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<div className="h-[400px] w-full">
								<ResponsiveContainer
									width="100%"
									height="100%"
								>
									<FunnelChart>
										<Tooltip
											contentStyle={{
												borderRadius: 16,
												border:
													"1px solid hsl(var(--border))",
												background:
													"hsl(var(--background))",
											}}
										/>

										<Funnel
											data={funnelData}
											dataKey="value"
										>
											<LabelList
												position="right"
												fill="currentColor"
												stroke="none"
												dataKey="name"
												className="fill-muted-foreground"
											/>
										</Funnel>
									</FunnelChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				{/* Scatter */}
				<motion.div
					initial={{
						opacity: 0,
						scale: 0.96,
					}}
					animate={{
						opacity: 1,
						scale: 1,
					}}
					transition={{
						delay: 0.2,
					}}
				>
					<Card className="rounded-3xl border-border/50 shadow-sm">
						<CardHeader>
							<CardTitle>
								Risk Profile Matrix
							</CardTitle>

							<CardDescription>
								Bscore vs Collectibility
								correlation.
							</CardDescription>
						</CardHeader>

						<CardContent>
							<div className="h-[400px] w-full">
								<ResponsiveContainer
									width="100%"
									height="100%"
								>
									<ScatterChart
										margin={{
											top: 20,
											right: 20,
											bottom: 20,
											left: 20,
										}}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											className="stroke-border"
										/>

										<XAxis
											type="number"
											dataKey="bscore"
											name="CC Bscore"
											domain={[0, 800]}
											tick={{
												fill:
													"hsl(var(--muted-foreground))",
											}}
											label={{
												value: "CC Bscore",
												position:
													"insideBottom",
												offset: -10,
												fill:
													"hsl(var(--muted-foreground))",
											}}
										/>

										<YAxis
											type="number"
											dataKey="collectibility"
											name="Collectibility"
											domain={[1, 5]}
											tick={{
												fill:
													"hsl(var(--muted-foreground))",
											}}
											label={{
												value:
													"Collectibility",
												angle: -90,
												position:
													"insideLeft",
												fill:
													"hsl(var(--muted-foreground))",
											}}
										/>

										<ZAxis
											type="number"
											dataKey="z"
											range={[50, 400]}
										/>

										<Tooltip
											cursor={{
												strokeDasharray:
													"3 3",
											}}
											contentStyle={{
												borderRadius: 16,
												border:
													"1px solid hsl(var(--border))",
												background:
													"hsl(var(--background))",
											}}
										/>

										<Scatter
											name="Customers"
											data={riskMatrixData}
										>
											{riskMatrixData.map(
												(entry, index) => (
													<Cell
														key={`cell-${index}`}
														fill={
															entry.collectibility ===
															1
																? "#10b981"
																: entry.collectibility >
																3
																	? "#f43f5e"
																	: "#f59e0b"
														}
														opacity={0.7}
													/>
												)
											)}
										</Scatter>
									</ScatterChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</div>
		</div>
	);
}