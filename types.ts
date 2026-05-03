/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Segment = "NTB" | "ETB" | "Payroll" | "ETB Priority";
export type ProductApply = "CC" | "PL";
export type CCBlockCode = "" | "BA" | "OL" | "CP";

export interface Customer {
	id: string;
	productApply: ProductApply;
	appId: string;
	segment: Segment;
	collectibility: number; // 1-5
	aum: number; // IDR
	mob: number; // Months
	plBalance: number;
	payrollCreditM1: number;
	payrollCreditM2: number;
	payrollCreditM3: number;
	ccBscore: number | null;
	ccBlockCode: CCBlockCode;
	ccLimit: number | null;
	ccBalance: number | null;
	ccUtil: number | null; // Calculated
}

export interface EligibilityResult {
	isEligible: boolean;
	reasons: string[];
}

export interface NewsItem {
	title: string;
	summary: string;
	url: string;
	date: string;
	source: string;
}

export interface DashboardStats {
	totalEligibleAUM: number;
	healthyPortfolioRatio: number;
	highRiskExposure: number;
}
