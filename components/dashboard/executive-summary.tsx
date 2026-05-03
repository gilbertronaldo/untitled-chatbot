'use client';

import React, { useMemo } from "react";
import { Customer } from "@/types";
import { calculateDashboardStats, checkEligibility } from "@/lib/logic";
import {
	BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
	ScatterChart, Scatter, Cell, ZAxis, Legend, FunnelChart, Funnel, LabelList
} from "recharts";
import { motion } from "motion/react";
import { TrendingUp, ShieldCheck, AlertTriangle, DollarSign, RefreshCw } from "lucide-react";

interface ExecutiveSummaryProps {
	data: Customer[];
	onSync: () => void;
	isSyncing: boolean;
}

export default function ExecutiveSummary({ data, onSync, isSyncing }: ExecutiveSummaryProps) {
	const stats = useMemo(() => calculateDashboardStats(data), [data]);

	const funnelData = useMemo(() => {
		const total = data.length;
		let passedAUM = 0;
		let passedCollectibility = 0;
		let passedBScore = 0;

		data.forEach(c => {
			// Step 1: AUM
			const aumEligible = (c.segment === "ETB" && c.aum > 5000000) ||
				(c.segment === "ETB Priority" && c.aum > 500000000) ||
				(c.segment === "Payroll") || (c.segment === "NTB");
			if (aumEligible) {
				passedAUM++;
				// Step 2: Collectibility
				if (c.collectibility === 1) {
					passedCollectibility++;
					// Step 3: BScore
					if (c.ccBscore !== null && c.ccBscore > 410) {
						passedBScore++;
					}
				}
			}
		});

		return [
			{ value: total, name: "Total Population", fill: "#10b981" },
			{ value: passedAUM, name: "Passed AUM Check", fill: "#059669" },
			{ value: passedCollectibility, name: "Passed Collectibility", fill: "#047857" },
			{ value: passedBScore, name: "Passed BScore Check", fill: "#065f46" },
		];
	}, [data]);

	const riskMatrixData = useMemo(() => {
		// Sample 500 points for performance in scatter plot
		const sample = data.slice(0, 500).map(c => ({
			bscore: c.ccBscore || 0,
			collectibility: c.collectibility,
			z: 1,
			id: c.appId
		}));
		return sample;
	}, [data]);

	const formatIDR = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	const formatBillions = (val: number) => {
		return (val / 1000000000).toFixed(2) + "B";
	};

	const kpis = [
		{
			label: "Total Eligible AUM",
			value: formatBillions(stats.totalEligibleAUM),
			sub: "IDR Billions",
			icon: DollarSign,
			color: "text-emerald-400",
			bg: "bg-emerald-500/10"
		},
		{
			label: "Healthy Portfolio Ratio",
			value: stats.healthyPortfolioRatio.toFixed(1) + "%",
			sub: "Coll 1 & Clean Block",
			icon: ShieldCheck,
			color: "text-blue-400",
			bg: "bg-blue-500/10"
		},
		{
			label: "High-Risk Exposure",
			value: formatBillions(stats.highRiskExposure),
			sub: "Util > 80% Balance",
			icon: AlertTriangle,
			color: "text-rose-400",
			bg: "bg-rose-500/10"
		},
	];

	return (
		<div className="space-y-8">
			<header className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h2 className="text-3xl font-bold text-white tracking-tight">Executive Summary</h2>
					<p className="text-slate-400 font-medium">Real-time portfolio health and risk assessment.</p>
				</div>
				<button
					onClick={onSync}
					disabled={isSyncing}
					className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
				>
					<RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
					Sync Data
				</button>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{kpis.map((kpi, i) => (
					<motion.div
						key={kpi.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl shadow-black/20 group hover:border-emerald-500/50 transition-colors"
					>
						<div className="flex items-center justify-between mb-4">
							<div className={`p-3 rounded-2xl ${kpi.bg}`}>
								<kpi.icon className={`w-6 h-6 ${kpi.color}`} />
							</div>
							<TrendingUp className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
						</div>
						<p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">{kpi.label}</p>
						<h3 className="text-3xl font-bold text-white tracking-tight">{kpi.value}</h3>
						<p className="text-xs text-slate-500 mt-2 font-medium">{kpi.sub}</p>
					</motion.div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl"
				>
					<div className="mb-8">
						<h3 className="text-xl font-bold text-white mb-1">Eligibility Funnel</h3>
						<p className="text-sm text-slate-400">Drop-off analysis through business rules.</p>
					</div>
					<div className="h-[400px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<FunnelChart>
								<Tooltip
									contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
									itemStyle={{ color: '#e2e8f0' }}
								/>
								<Funnel
									data={funnelData}
									dataKey="value"
								>
									<LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
								</Funnel>
							</FunnelChart>
						</ResponsiveContainer>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.2 }}
					className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl"
				>
					<div className="mb-8">
						<h3 className="text-xl font-bold text-white mb-1">Risk Profile Matrix</h3>
						<p className="text-sm text-slate-400">Bscore vs Collectibility correlation.</p>
					</div>
					<div className="h-[400px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
								<XAxis
									type="number"
									dataKey="bscore"
									name="CC Bscore"
									stroke="#94a3b8"
									domain={[0, 800]}
									label={{ value: 'CC Bscore', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
								/>
								<YAxis
									type="number"
									dataKey="collectibility"
									name="Collectibility"
									stroke="#94a3b8"
									domain={[1, 5]}
									label={{ value: 'Collectibility', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
								/>
								<ZAxis type="number" dataKey="z" range={[50, 400]} />
								<Tooltip
									cursor={{ strokeDasharray: '3 3' }}
									contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
								/>
								<Scatter name="Customers" data={riskMatrixData}>
									{riskMatrixData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.collectibility === 1 ? '#10b981' : entry.collectibility > 3 ? '#f43f5e' : '#f59e0b'}
											opacity={0.6}
										/>
									))}
								</Scatter>
							</ScatterChart>
						</ResponsiveContainer>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
