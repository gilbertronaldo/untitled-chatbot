/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Customer, Segment, ProductApply } from "@/types";
import { checkEligibility } from "@/lib/logic";
import {
	Search, Filter, ChevronLeft, ChevronRight, Info, AlertCircle, CheckCircle2
} from "lucide-react";
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button,
	IconButton, Tooltip, Chip
} from "@mui/material";
import { motion, AnimatePresence } from "motion/react";

interface DataWarehouseProps {
	data: Customer[];
}

const PAGE_SIZE = 15;

export default function DataWarehouse({ data }: DataWarehouseProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [segmentFilter, setSegmentFilter] = useState<Segment | "All">("All");
	const [productFilter, setProductFilter] = useState<ProductApply | "All">("All");
	const [collectibilityFilter, setCollectibilityFilter] = useState<number | "All">("All");
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

	const filteredData = useMemo(() => {
		return data.filter((c) => {
			const matchesSearch = c.appId.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesSegment = segmentFilter === "All" || c.segment === segmentFilter;
			const matchesProduct = productFilter === "All" || c.productApply === productFilter;
			const matchesCollectibility = collectibilityFilter === "All" || c.collectibility === collectibilityFilter;
			return matchesSearch && matchesSegment && matchesProduct && matchesCollectibility;
		});
	}, [data, searchTerm, segmentFilter, productFilter, collectibilityFilter]);

	const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
	const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

	const formatIDR = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	const handleDetails = (customer: Customer) => {
		setSelectedCustomer(customer);
	};

	const eligibility = selectedCustomer ? checkEligibility(selectedCustomer) : null;

	return (
		<div className="space-y-6">
			<header className="flex flex-col gap-1">
				<h2 className="text-3xl font-bold text-white tracking-tight">Data Warehouse</h2>
				<p className="text-slate-400 font-medium">Drill-down into customer records and business logic.</p>
			</header>

			{/* Filter Bar */}
			<div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center gap-4">
				<div className="flex-1 min-w-[240px] relative">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
					<input
						type="text"
						placeholder="Search App ID..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
					/>
				</div>

				<div className="flex items-center gap-3">
					<Filter className="text-slate-500 w-5 h-5" />
					<select
						value={segmentFilter}
						onChange={(e) => setSegmentFilter(e.target.value as Segment | "All")}
						className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
					>
						<option value="All">All Segments</option>
						<option value="Payroll">Payroll</option>
						<option value="ETB">ETB</option>
						<option value="ETB Priority">ETB Priority</option>
						<option value="NTB">NTB</option>
					</select>

					<select
						value={productFilter}
						onChange={(e) => setProductFilter(e.target.value as ProductApply | "All")}
						className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
					>
						<option value="All">All Products</option>
						<option value="CC">Credit Card</option>
						<option value="PL">Personal Loan</option>
					</select>

					<select
						value={collectibilityFilter}
						onChange={(e) => setCollectibilityFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
						className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
					>
						<option value="All">All Collectibility</option>
						{[1, 2, 3, 4, 5].map((v) => (
							<option key={v} value={v}>Coll {v}</option>
						))}
					</select>
				</div>
			</div>

			{/* Table */}
			<div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
						<tr className="bg-slate-950/50 border-b border-slate-800">
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">App ID</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Segment</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">AUM</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Coll</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Bscore</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">CC Util</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">PL Balance</th>
							<th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
						</tr>
						</thead>
						<tbody className="divide-y divide-slate-800">
						<AnimatePresence mode="wait">
							{paginatedData.map((c) => {
								const { isEligible } = checkEligibility(c);
								return (
									<motion.tr
										key={c.id}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="hover:bg-slate-800/30 transition-colors group"
									>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<span className="font-mono font-bold text-emerald-400">{c.appId}</span>
												{!isEligible && (
													<Tooltip title="Fails Business Rules">
														<AlertCircle className="w-4 h-4 text-rose-500" />
													</Tooltip>
												)}
											</div>
										</td>
										<td className="px-6 py-4 text-sm font-medium text-slate-300">{c.segment}</td>
										<td className="px-6 py-4 text-sm font-medium text-slate-300">{formatIDR(c.aum)}</td>
										<td className={`px-6 py-4 text-sm font-bold ${c.collectibility > 1 ? "text-rose-400 bg-rose-500/10" : "text-emerald-400"}`}>
											{c.collectibility}
										</td>
										<td className="px-6 py-4 text-sm font-medium text-slate-300">{c.ccBscore || "-"}</td>
										<td className={`px-6 py-4 text-sm font-bold ${c.ccUtil && c.ccUtil > 80 ? "text-rose-400 bg-rose-500/10" : "text-slate-300"}`}>
											{c.ccUtil ? `${c.ccUtil.toFixed(1)}%` : "-"}
										</td>
										<td className="px-6 py-4 text-sm font-medium text-slate-300">{formatIDR(c.plBalance)}</td>
										<td className="px-6 py-4">
											<button
												onClick={() => handleDetails(c)}
												className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-black/20"
											>
												<Info className="w-5 h-5" />
											</button>
										</td>
									</motion.tr>
								);
							})}
						</AnimatePresence>
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				<div className="bg-slate-950/50 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
					<p className="text-sm text-slate-500 font-medium">
						Showing <span className="text-slate-300">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="text-slate-300">{Math.min(currentPage * PAGE_SIZE, filteredData.length)}</span> of <span className="text-slate-300">{filteredData.length}</span> results
					</p>
					<div className="flex items-center gap-2">
						<button
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(prev => prev - 1)}
							className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<div className="flex items-center gap-1">
							{[...Array(Math.min(5, totalPages))].map((_, i) => {
								const pageNum = i + 1;
								return (
									<button
										key={pageNum}
										onClick={() => setCurrentPage(pageNum)}
										className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === pageNum ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
									>
										{pageNum}
									</button>
								);
							})}
							{totalPages > 5 && <span className="text-slate-600 px-2">...</span>}
						</div>
						<button
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage(prev => prev + 1)}
							className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			{/* Details Modal */}
			<Dialog
				open={!!selectedCustomer}
				onClose={() => setSelectedCustomer(null)}
				// PaperProps={{
				// 	sx: {
				// 		backgroundColor: '#0f172a',
				// 		color: '#e2e8f0',
				// 		borderRadius: '24px',
				// 		border: '1px solid #1e293b',
				// 		backgroundImage: 'none',
				// 		maxWidth: '500px',
				// 		width: '100%'
				// 	}
				// }}
			>
				{selectedCustomer && (
					<>
						<DialogTitle className="border-b border-slate-800 pb-4">
							<div className="flex items-center justify-between">
								<div className="flex flex-col">
									<span className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Customer Profile</span>
									<span className="text-2xl font-bold tracking-tight">{selectedCustomer.appId}</span>
								</div>
								<Chip
									label={eligibility?.isEligible ? "ELIGIBLE" : "INELIGIBLE"}
									color={eligibility?.isEligible ? "success" : "error"}
									className="font-bold"
								/>
							</div>
						</DialogTitle>
						<DialogContent className="py-6">
							<div className="space-y-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
										<p className="text-xs text-slate-500 font-bold uppercase mb-1">Segment</p>
										<p className="text-lg font-bold">{selectedCustomer.segment}</p>
									</div>
									<div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
										<p className="text-xs text-slate-500 font-bold uppercase mb-1">AUM</p>
										<p className="text-lg font-bold">{formatIDR(selectedCustomer.aum)}</p>
									</div>
								</div>

								<div>
									<h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
										{eligibility?.isEligible ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
										Eligibility Analysis
									</h4>
									<div className="space-y-2">
										{eligibility?.isEligible ? (
											<div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
												<p className="text-sm text-emerald-400 font-medium">Customer meets all business criteria for product offering.</p>
											</div>
										) : (
											eligibility?.reasons.map((reason, i) => (
												<div key={i} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3">
													<div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
													<p className="text-sm text-rose-400 font-medium">{reason}</p>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						</DialogContent>
						<DialogActions className="p-6 border-t border-slate-800">
							<Button
								onClick={() => setSelectedCustomer(null)}
								variant="contained"
								className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 px-8 font-bold capitalize"
								disableElevation
							>
								Close Analysis
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</div>
	);
}
