/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, EligibilityResult } from "@/types";

export const checkEligibility = (customer: Customer, bscoreThreshold: number = 410, utilThreshold: number = 80): EligibilityResult => {
	const reasons: string[] = [];

	// AUM Check: AUM > 5,000,000 (For ETB). AUM > 500,000,000 (For ETB Priority, CC only).
	if (customer.segment === "ETB" && customer.aum <= 5000000) {
		reasons.push("AUM must be > 5,000,000 for ETB segment");
	}
	if (customer.segment === "ETB Priority" && customer.aum <= 500000000) {
		reasons.push("AUM must be > 500,000,000 for ETB Priority segment");
	}

	// MOB Check: MOB >= 3 (For ETB).
	if (customer.segment === "ETB" && customer.mob < 3) {
		reasons.push("MOB must be >= 3 for ETB segment");
	}

	// Paid Off Check: PL Balance <= 0 (For ETB & Payroll).
	if ((customer.segment === "ETB" || customer.segment === "Payroll") && customer.plBalance > 0) {
		reasons.push("PL Balance must be <= 0 (Paid Off)");
	}

	// Income Check: Lowest value among Payroll Credit M-1, M-2, M-3 > 5,000,000 (For Payroll).
	if (customer.segment === "Payroll") {
		const minIncome = Math.min(customer.payrollCreditM1, customer.payrollCreditM2, customer.payrollCreditM3);
		if (minIncome <= 5000000) {
			reasons.push("Lowest income in last 3 months must be > 5,000,000");
		}
	}

	// Active Payroll Check: M-1 > 0 and M-3 > 0.
	if (customer.segment === "Payroll") {
		if (customer.payrollCreditM1 <= 0 || customer.payrollCreditM3 <= 0) {
			reasons.push("Payroll must be active (M-1 and M-3 > 0)");
		}
	}

	// Block Code Check: Allowed codes are strictly '' (blank) or 'BA' (For ETB).
	if (customer.segment === "ETB" && customer.ccBlockCode !== "" && customer.ccBlockCode !== "BA") {
		reasons.push("CC Block Code must be blank or 'BA' for ETB segment");
	}

	// Collectibility Check: Must be strictly 1 (Current).
	if (customer.collectibility !== 1) {
		reasons.push("Collectibility must be 1 (Current)");
	}

	// CC Bscore Check: CC Bscore > threshold (For ETB & Payroll).
	if ((customer.segment === "ETB" || customer.segment === "Payroll") && (customer.ccBscore === null || customer.ccBscore <= bscoreThreshold)) {
		reasons.push(`CC Bscore must be > ${bscoreThreshold}`);
	}

	// CC Util Check: CC Util <= threshold (For ETB & Payroll).
	if ((customer.segment === "ETB" || customer.segment === "Payroll") && (customer.ccUtil === null || customer.ccUtil > utilThreshold)) {
		reasons.push(`CC Utilization must be <= ${utilThreshold}%`);
	}

	return {
		isEligible: reasons.length === 0,
		reasons,
	};
};

export const calculateDashboardStats = (data: Customer[]) => {
	let totalEligibleAUM = 0;
	let healthyCount = 0;
	let highRiskExposure = 0;

	data.forEach((customer) => {
		const { isEligible } = checkEligibility(customer);
		if (isEligible) {
			totalEligibleAUM += customer.aum;
		}

		// Healthy Portfolio Ratio (% of customers with Collectibility = 1 & Allowed Block Code).
		// Assuming "Allowed Block Code" means "" or "BA" generally for this KPI.
		if (customer.collectibility === 1 && (customer.ccBlockCode === "" || customer.ccBlockCode === "BA")) {
			healthyCount++;
		}

		// High-Risk Exposure (Total CC Balance + PL Balance of customers with CC Util > 80%).
		if (customer.ccUtil !== null && customer.ccUtil > 80) {
			highRiskExposure += (customer.ccBalance || 0) + customer.plBalance;
		}
	});

	return {
		totalEligibleAUM,
		healthyPortfolioRatio: (healthyCount / data.length) * 100,
		highRiskExposure,
	};
};
