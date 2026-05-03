'use client';

import ExecutiveSummary from "@/components/dashboard/executive-summary";

export default function DashboardPage() {


	const syncData = async () => {

	};


	const mockData = generateMockData(10000);
	return (
		<>
		<ExecutiveSummary data={mockData} onSync={syncData} isSyncing={false}></ExecutiveSummary>
		</>
	);
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Segment, ProductApply, CCBlockCode } from "@/types";

const generateRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateRandomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const generateMockData = (count: number = 10000): Customer[] => {
	const data: Customer[] = [];

	for (let i = 1; i <= count; i++) {
		const productApply: ProductApply = Math.random() > 0.5 ? "CC" : "PL";
		const appId = `${productApply}${String(i).padStart(4, "0")}`;

		// Segment: Payroll (60%), ETB (30%), others (10%)
		const segmentRand = Math.random();
		let segment: Segment = "NTB";
		if (segmentRand < 0.6) segment = "Payroll";
		else if (segmentRand < 0.9) segment = "ETB";
		else if (segmentRand < 0.95) segment = "ETB Priority";
		else segment = "NTB";

		// Collectibility: 1 (80%), others (20%)
		const collectibility = Math.random() < 0.8 ? 1 : generateRandomInt(2, 5);

		// AUM: 70% between 5,000,000 - 10,000,000. Range: 100,000 to 9,999,999,999
		let aum: number;
		if (Math.random() < 0.7) {
			aum = generateRandomInt(5000000, 10000000);
		} else {
			aum = generateRandomInt(100000, 9999999999);
		}

		const mob = generateRandomInt(0, 120);

		// PL Balance: 50% is 0. Range: -10,000 to 300,000,000
		let plBalance: number;
		if (Math.random() < 0.5) {
			plBalance = 0;
		} else {
			plBalance = generateRandomInt(-10000, 300000000);
		}

		// Payroll Credit M-1, M-2, M-3: Only non-zero if Segment is "Payroll"
		let payrollCreditM1 = 0;
		let payrollCreditM2 = 0;
		let payrollCreditM3 = 0;
		if (segment === "Payroll") {
			payrollCreditM1 = generateRandomInt(0, 100000000);
			payrollCreditM2 = generateRandomInt(0, 100000000);
			payrollCreditM3 = generateRandomInt(0, 100000000);
		}

		// CC Bscore: >410 (30%), blank (60%), others (10%)
		const bscoreRand = Math.random();
		let ccBscore: number | null = null;
		if (bscoreRand < 0.6) {
			ccBscore = null;
		} else if (bscoreRand < 0.9) {
			ccBscore = generateRandomInt(411, 800);
		} else {
			ccBscore = generateRandomInt(50, 410);
		}

		// CC Block Code: Only if CC Bscore is not blank
		let ccBlockCode: CCBlockCode = "";
		if (ccBscore !== null) {
			const blockRand = Math.random();
			if (blockRand < 0.7) ccBlockCode = "";
			else if (blockRand < 0.8) ccBlockCode = "BA";
			else if (blockRand < 0.9) ccBlockCode = "OL";
			else ccBlockCode = "CP";
		}

		// CC Limit: Only if CC Bscore is not blank. Target 80% < 50,000,000. Rounded to millions.
		let ccLimit: number | null = null;
		if (ccBscore !== null) {
			if (Math.random() < 0.8) {
				ccLimit = generateRandomInt(2, 49) * 1000000;
			} else {
				ccLimit = generateRandomInt(50, 80) * 1000000;
			}
		}

		// CC Balance: Only if CC Bscore is not blank. Range: -5,000 up to (CC Limit + 5%)
		let ccBalance: number | null = null;
		let ccUtil: number | null = null;
		if (ccBscore !== null && ccLimit !== null) {
			ccBalance = generateRandomInt(-5000, Math.floor(ccLimit * 1.05));
			ccUtil = (ccBalance / ccLimit) * 100;
		}

		data.push({
			id: String(i),
			productApply,
			appId,
			segment,
			collectibility,
			aum,
			mob,
			plBalance,
			payrollCreditM1,
			payrollCreditM2,
			payrollCreditM3,
			ccBscore,
			ccBlockCode,
			ccLimit,
			ccBalance,
			ccUtil,
		});
	}

	return data;
};
