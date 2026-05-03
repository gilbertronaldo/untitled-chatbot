import { bankingDataset } from "@/data/banking-dataset";
import {
  aggregateBy,
  averageBy,
  averageByGroup,
  distributionBy,
  sumBy,
  utilization,
} from "@/lib/analytics";
import type {
  ChartDataPoint,
  DashboardSpec,
  MetricSpec,
  TableSpec,
} from "@/lib/visualization-parser";

const totalAum = sumBy(bankingDataset, (record) => record.AUM_IDR);
const totalPlBalance = sumBy(bankingDataset, (record) => record.PL_balance);
const avgCreditScore = Math.round(
  averageBy(bankingDataset, (record) => record.CC_score)
);
const avgUtilizationPct = Math.round(
  averageBy(bankingDataset, (record) =>
    utilization(record.CC_balance, record.CC_limit)
  ) * 100
);

const segmentDistribution = distributionBy(
  bankingDataset,
  (record) => record.segment
);

const aumBySegment = aggregateBy(
  bankingDataset,
  (record) => record.segment,
  (record) => record.AUM_IDR
);

const utilizationBySegment = averageByGroup(
  bankingDataset,
  (record) => record.segment,
  (record) => utilization(record.CC_balance, record.CC_limit) * 100
);

const collectibilityDistribution = distributionBy(
  bankingDataset,
  (record) => `C${record.collectibility}`
);

const payrollTrend: ChartDataPoint[] = [
  {
    label: "M-3",
    value: averageBy(bankingDataset, (record) => record.payroll_credit_M3),
  },
  {
    label: "M-2",
    value: averageBy(bankingDataset, (record) => record.payroll_credit_M2),
  },
  {
    label: "M-1",
    value: averageBy(bankingDataset, (record) => record.payroll_credit_M1),
  },
];

const topAumTable: TableSpec = {
  type: "table",
  title: "Top AUM Customers",
  columns: ["App ID", "Segment", "AUM (IDR)"],
  rows: [...bankingDataset]
    .sort((a, b) => b.AUM_IDR - a.AUM_IDR)
    .slice(0, 5)
    .map((record) => ({
      "App ID": record.app_id,
      Segment: record.segment,
      "AUM (IDR)": record.AUM_IDR,
    })),
};

const executiveKpis: MetricSpec[] = [
  {
    type: "metric",
    title: "Total AUM",
    value: totalAum,
    delta: "↑ 6.2%",
    trend: "up",
    description: "Across all active customers",
  },
  {
    type: "metric",
    title: "Avg Credit Score",
    value: avgCreditScore,
    delta: "↑ 1.8%",
    trend: "up",
    description: "Portfolio-wide score trend",
  },
  {
    type: "metric",
    title: "PL Balance",
    value: totalPlBalance,
    delta: "↓ 0.9%",
    trend: "down",
    description: "Outstanding personal loans",
  },
  {
    type: "metric",
    title: "Avg CC Utilization",
    value: `${avgUtilizationPct}%`,
    delta: "Stable",
    trend: "flat",
    description: "Balance vs. limit",
  },
];

export const sampleDashboards: Record<string, DashboardSpec> = {
  "Executive Dashboard": {
    type: "dashboard",
    title: "Executive Dashboard",
    widgets: [
      ...executiveKpis,
      {
        type: "chart",
        chartType: "bar",
        title: "Customer Segment Distribution",
        data: segmentDistribution,
      },
      {
        type: "chart",
        chartType: "line",
        title: "Payroll Credit Trend",
        data: payrollTrend,
      },
      {
        type: "chart",
        chartType: "pie",
        title: "Collectibility Mix",
        data: collectibilityDistribution,
      },
    ],
  },
  "Credit Risk Dashboard": {
    type: "dashboard",
    title: "Credit Risk Dashboard",
    widgets: [
      {
        type: "metric",
        title: "High Risk Accounts",
        value: bankingDataset.filter((record) => record.collectibility >= 3)
          .length,
        delta: "↑ 2",
        trend: "up",
        description: "Collectibility ≥ 3",
      },
      {
        type: "metric",
        title: "Blocked Cards",
        value: bankingDataset.filter((record) => record.CC_block_code === "B")
          .length,
        delta: "↑ 1",
        trend: "up",
        description: "Active block flags",
      },
      {
        type: "chart",
        chartType: "bar",
        title: "Utilization by Segment",
        data: utilizationBySegment,
      },
      {
        type: "chart",
        chartType: "pie",
        title: "Collectibility Distribution",
        data: collectibilityDistribution,
      },
    ],
  },
  "Customer Segment Dashboard": {
    type: "dashboard",
    title: "Customer Segment Dashboard",
    widgets: [
      {
        type: "chart",
        chartType: "bar",
        title: "Segments by Count",
        data: segmentDistribution,
      },
      {
        type: "chart",
        chartType: "bar",
        title: "AUM by Segment",
        data: aumBySegment,
      },
      {
        type: "chart",
        chartType: "line",
        title: "Average Credit Score by Segment",
        data: averageByGroup(
          bankingDataset,
          (record) => record.segment,
          (record) => record.CC_score
        ),
      },
    ],
  },
  "Payroll Overview": {
    type: "dashboard",
    title: "Payroll Overview",
    widgets: [
      {
        type: "metric",
        title: "Average Monthly Payroll",
        value: Math.round(
          averageBy(
            bankingDataset,
            (record) =>
              (record.payroll_credit_M1 +
                record.payroll_credit_M2 +
                record.payroll_credit_M3) /
              3
          )
        ),
        delta: "↑ 3.1%",
        trend: "up",
        description: "Across all customers",
      },
      {
        type: "chart",
        chartType: "line",
        title: "Payroll Trend (3 Months)",
        data: payrollTrend,
      },
      topAumTable,
    ],
  },
  "Credit Utilization Dashboard": {
    type: "dashboard",
    title: "Credit Utilization Dashboard",
    widgets: [
      {
        type: "metric",
        title: "Average Utilization",
        value: `${avgUtilizationPct}%`,
        delta: "Stable",
        trend: "flat",
        description: "Portfolio-wide",
      },
      {
        type: "chart",
        chartType: "bar",
        title: "Utilization by Segment",
        data: utilizationBySegment,
      },
      {
        type: "chart",
        chartType: "pie",
        title: "Segment Distribution",
        data: segmentDistribution,
      },
    ],
  },
};

export const sampleDashboardList = Object.entries(sampleDashboards).map(
  ([title, spec]) => ({
    title,
    spec,
  })
);
