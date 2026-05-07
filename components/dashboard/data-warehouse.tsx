/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useMemo, useState } from "react";
import { Customer, ProductApply, Segment } from "@/types";
import { checkEligibility } from "@/lib/logic";

import {
	AlertCircle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Filter,
	Info,
	Search,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DataWarehouseProps {
	data: Customer[];
}

const PAGE_SIZE = 15;

export default function DataWarehouse({
	                                      data,
                                      }: DataWarehouseProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [segmentFilter, setSegmentFilter] = useState<
		Segment | "All"
	>("All");

	const [productFilter, setProductFilter] = useState<
		ProductApply | "All"
	>("All");

	const [collectibilityFilter, setCollectibilityFilter] =
		useState<number | "All">("All");

	const [currentPage, setCurrentPage] = useState(1);

	const [selectedCustomer, setSelectedCustomer] =
		useState<Customer | null>(null);

	const filteredData = useMemo(() => {
		return data.filter((c) => {
			const matchesSearch = c.appId
				.toLowerCase()
				.includes(searchTerm.toLowerCase());

			const matchesSegment =
				segmentFilter === "All" ||
				c.segment === segmentFilter;

			const matchesProduct =
				productFilter === "All" ||
				c.productApply === productFilter;

			const matchesCollectibility =
				collectibilityFilter === "All" ||
				c.collectibility === collectibilityFilter;

			return (
				matchesSearch &&
				matchesSegment &&
				matchesProduct &&
				matchesCollectibility
			);
		});
	}, [
		data,
		searchTerm,
		segmentFilter,
		productFilter,
		collectibilityFilter,
	]);

	const totalPages = Math.ceil(
		filteredData.length / PAGE_SIZE
	);

	const paginatedData = filteredData.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE
	);

	const formatIDR = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			maximumFractionDigits: 0,
		}).format(val);
	};

	const eligibility = selectedCustomer
		? checkEligibility(selectedCustomer)
		: null;

	return (
		<TooltipProvider>
			<div className="space-y-6">
				{/* Header */}
				<div className="space-y-1">
					<h2 className="text-3xl font-bold tracking-tight">
						Data Warehouse
					</h2>

					<p className="text-muted-foreground">
						Drill-down into customer records and
						business logic.
					</p>
				</div>

				{/* Filter */}
				<Card className="rounded-3xl border-border/50 shadow-sm">
					<CardContent className="flex flex-wrap items-center gap-4 p-6">
						<div className="relative min-w-[240px] flex-1">
							<Search className="text-muted-foreground absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />

							<Input
								placeholder="Search App ID..."
								value={searchTerm}
								onChange={(e) =>
									setSearchTerm(e.target.value)
								}
								className="h-12 rounded-2xl pl-12"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center gap-2">
								<Filter className="text-muted-foreground h-4 w-4" />
							</div>

							<Select
								value={segmentFilter}
								onValueChange={(value) =>
									setSegmentFilter(
										value as Segment | "All"
									)
								}
							>
								<SelectTrigger className="h-12 w-[180px] rounded-2xl">
									<SelectValue placeholder="Segment" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="All">
										All Segments
									</SelectItem>

									<SelectItem value="Payroll">
										Payroll
									</SelectItem>

									<SelectItem value="ETB">
										ETB
									</SelectItem>

									<SelectItem value="ETB Priority">
										ETB Priority
									</SelectItem>

									<SelectItem value="NTB">
										NTB
									</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={productFilter}
								onValueChange={(value) =>
									setProductFilter(
										value as ProductApply | "All"
									)
								}
							>
								<SelectTrigger className="h-12 w-[180px] rounded-2xl">
									<SelectValue placeholder="Product" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="All">
										All Products
									</SelectItem>

									<SelectItem value="CC">
										Credit Card
									</SelectItem>

									<SelectItem value="PL">
										Personal Loan
									</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={String(collectibilityFilter)}
								onValueChange={(value) =>
									setCollectibilityFilter(
										value === "All"
											? "All"
											: Number(value)
									)
								}
							>
								<SelectTrigger className="h-12 w-[200px] rounded-2xl">
									<SelectValue placeholder="Collectibility" />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="All">
										All Collectibility
									</SelectItem>

									{[1, 2, 3, 4, 5].map((v) => (
										<SelectItem
											key={v}
											value={String(v)}
										>
											Coll {v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				{/* Table */}
				<Card className="overflow-hidden rounded-3xl border-border/50 shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left">
							<thead className="bg-muted/50">
							<tr className="border-b">
								{[
									"App ID",
									"Segment",
									"AUM",
									"Coll",
									"Bscore",
									"CC Util",
									"PL Balance",
									"Action",
								].map((head) => (
									<th
										key={head}
										className="text-muted-foreground px-6 py-5 text-xs font-bold uppercase tracking-wider"
									>
										{head}
									</th>
								))}
							</tr>
							</thead>

							<tbody>
							<AnimatePresence mode="wait">
								{paginatedData.map((c) => {
									const { isEligible } =
										checkEligibility(c);

									return (
										<motion.tr
											key={c.id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="hover:bg-muted/40 border-b transition-colors"
										>
											<td className="px-6 py-4">
												<div className="flex items-center gap-2">
                            <span className="text-primary font-mono font-bold">
                              {c.appId}
                            </span>

													{!isEligible && (
														<Tooltip>
															<TooltipTrigger>
																<AlertCircle className="h-4 w-4 text-red-500" />
															</TooltipTrigger>

															<TooltipContent>
																Fails Business Rules
															</TooltipContent>
														</Tooltip>
													)}
												</div>
											</td>

											<td className="text-muted-foreground px-6 py-4 text-sm font-medium">
												{c.segment}
											</td>

											<td className="text-muted-foreground px-6 py-4 text-sm font-medium">
												{formatIDR(c.aum)}
											</td>

											<td className="px-6 py-4">
												<Badge
													variant={
														c.collectibility > 1
															? "destructive"
															: "default"
													}
													className="rounded-xl"
												>
													{c.collectibility}
												</Badge>
											</td>

											<td className="text-muted-foreground px-6 py-4 text-sm font-medium">
												{c.ccBscore || "-"}
											</td>

											<td className="px-6 py-4">
                          <span
	                          className={`text-sm font-semibold ${
		                          c.ccUtil &&
		                          c.ccUtil > 80
			                          ? "text-red-500"
			                          : "text-muted-foreground"
	                          }`}
                          >
                            {c.ccUtil
	                            ? `${c.ccUtil.toFixed(
		                            1
	                            )}%`
	                            : "-"}
                          </span>
											</td>

											<td className="text-muted-foreground px-6 py-4 text-sm font-medium">
												{formatIDR(c.plBalance)}
											</td>

											<td className="px-6 py-4">
												<Button
													size="icon"
													variant="secondary"
													className="rounded-xl"
													onClick={() =>
														setSelectedCustomer(c)
													}
												>
													<Info className="h-5 w-5" />
												</Button>
											</td>
										</motion.tr>
									);
								})}
							</AnimatePresence>
							</tbody>
						</table>
					</div>

					{/* Pagination */}
					<CardFooter className="flex items-center justify-between border-t px-6 py-4">
						<p className="text-muted-foreground text-sm">
							Showing{" "}
							<span className="text-foreground font-semibold">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
							to{" "}
							<span className="text-foreground font-semibold">
                {Math.min(
	                currentPage * PAGE_SIZE,
	                filteredData.length
                )}
              </span>{" "}
							of{" "}
							<span className="text-foreground font-semibold">
                {filteredData.length}
              </span>{" "}
							results
						</p>

						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="icon"
								className="rounded-xl"
								disabled={currentPage === 1}
								onClick={() =>
									setCurrentPage((prev) => prev - 1)
								}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>

							<div className="flex items-center gap-1">
								{[...Array(Math.min(5, totalPages))].map(
									(_, i) => {
										const pageNum = i + 1;

										return (
											<Button
												key={pageNum}
												size="icon"
												variant={
													currentPage === pageNum
														? "default"
														: "outline"
												}
												className="rounded-xl"
												onClick={() =>
													setCurrentPage(pageNum)
												}
											>
												{pageNum}
											</Button>
										);
									}
								)}

								{totalPages > 5 && (
									<span className="text-muted-foreground px-2">
                    ...
                  </span>
								)}
							</div>

							<Button
								variant="outline"
								size="icon"
								className="rounded-xl"
								disabled={
									currentPage === totalPages
								}
								onClick={() =>
									setCurrentPage((prev) => prev + 1)
								}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</CardFooter>
				</Card>

				{/* Dialog */}
				<Dialog
					open={!!selectedCustomer}
					onOpenChange={() =>
						setSelectedCustomer(null)
					}
				>
					<DialogContent className="max-w-2xl rounded-3xl">
						{selectedCustomer && (
							<>
								<DialogHeader className="border-b pb-4">
									<div className="flex items-center justify-between gap-4">
										<div>
											<p className="text-primary mb-1 text-xs font-bold uppercase tracking-[0.2em]">
												Customer Profile
											</p>

											<DialogTitle className="text-2xl">
												{selectedCustomer.appId}
											</DialogTitle>
										</div>

										<Badge
											variant={
												eligibility?.isEligible
													? "default"
													: "destructive"
											}
											className="rounded-xl px-4 py-1"
										>
											{eligibility?.isEligible
												? "ELIGIBLE"
												: "INELIGIBLE"}
										</Badge>
									</div>
								</DialogHeader>

								<div className="space-y-6 py-4">
									<div className="grid grid-cols-2 gap-4">
										<Card className="rounded-2xl">
											<CardContent className="p-4">
												<p className="text-muted-foreground mb-1 text-xs font-bold uppercase">
													Segment
												</p>

												<p className="text-lg font-bold">
													{selectedCustomer.segment}
												</p>
											</CardContent>
										</Card>

										<Card className="rounded-2xl">
											<CardContent className="p-4">
												<p className="text-muted-foreground mb-1 text-xs font-bold uppercase">
													AUM
												</p>

												<p className="text-lg font-bold">
													{formatIDR(
														selectedCustomer.aum
													)}
												</p>
											</CardContent>
										</Card>
									</div>

									<div>
										<h4 className="text-muted-foreground mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
											{eligibility?.isEligible ? (
												<CheckCircle2 className="h-4 w-4 text-green-500" />
											) : (
												<AlertCircle className="h-4 w-4 text-red-500" />
											)}

											Eligibility Analysis
										</h4>

										<div className="space-y-2">
											{eligibility?.isEligible ? (
												<div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
													<p className="text-sm text-green-600 dark:text-green-400">
														Customer meets all
														business criteria for
														product offering.
													</p>
												</div>
											) : (
												eligibility?.reasons.map(
													(reason, i) => (
														<div
															key={i}
															className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
														>
															<div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

															<p className="text-sm text-red-600 dark:text-red-400">
																{reason}
															</p>
														</div>
													)
												)
											)}
										</div>
									</div>
								</div>

								<DialogFooter className="border-t pt-4">
									<Button
										className="rounded-xl"
										onClick={() =>
											setSelectedCustomer(null)
										}
									>
										Close Analysis
									</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}