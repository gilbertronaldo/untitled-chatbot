export interface EcommerceRecord {
  order_id: string;
  order_date: string;
  category: string;
  region: string;
  channel: "Online" | "Marketplace" | "Retail";
  quantity: number;
  revenue_usd: number;
  discount_pct: number;
}

export const ecommerceDataset: EcommerceRecord[] = [
  { order_id: "ORD-1001", order_date: "2026-01-02", category: "Electronics", region: "North", channel: "Online", quantity: 3, revenue_usd: 1250, discount_pct: 5 },
  { order_id: "ORD-1002", order_date: "2026-01-05", category: "Home", region: "West", channel: "Retail", quantity: 5, revenue_usd: 860, discount_pct: 8 },
  { order_id: "ORD-1003", order_date: "2026-01-09", category: "Fashion", region: "East", channel: "Marketplace", quantity: 8, revenue_usd: 540, discount_pct: 12 },
  { order_id: "ORD-1004", order_date: "2026-01-15", category: "Electronics", region: "South", channel: "Online", quantity: 2, revenue_usd: 980, discount_pct: 4 },
  { order_id: "ORD-1005", order_date: "2026-01-20", category: "Beauty", region: "West", channel: "Marketplace", quantity: 10, revenue_usd: 430, discount_pct: 15 },
  { order_id: "ORD-1006", order_date: "2026-01-24", category: "Sports", region: "North", channel: "Retail", quantity: 4, revenue_usd: 620, discount_pct: 6 },
  { order_id: "ORD-1007", order_date: "2026-02-02", category: "Home", region: "East", channel: "Online", quantity: 6, revenue_usd: 1140, discount_pct: 7 },
  { order_id: "ORD-1008", order_date: "2026-02-06", category: "Electronics", region: "West", channel: "Marketplace", quantity: 2, revenue_usd: 1450, discount_pct: 3 },
  { order_id: "ORD-1009", order_date: "2026-02-11", category: "Fashion", region: "South", channel: "Online", quantity: 9, revenue_usd: 770, discount_pct: 10 },
  { order_id: "ORD-1010", order_date: "2026-02-17", category: "Beauty", region: "North", channel: "Retail", quantity: 7, revenue_usd: 515, discount_pct: 14 },
  { order_id: "ORD-1011", order_date: "2026-02-23", category: "Sports", region: "East", channel: "Marketplace", quantity: 5, revenue_usd: 690, discount_pct: 9 },
  { order_id: "ORD-1012", order_date: "2026-03-01", category: "Home", region: "South", channel: "Online", quantity: 3, revenue_usd: 930, discount_pct: 5 },
  { order_id: "ORD-1013", order_date: "2026-03-06", category: "Electronics", region: "North", channel: "Retail", quantity: 1, revenue_usd: 820, discount_pct: 2 },
  { order_id: "ORD-1014", order_date: "2026-03-10", category: "Fashion", region: "West", channel: "Online", quantity: 11, revenue_usd: 890, discount_pct: 13 },
  { order_id: "ORD-1015", order_date: "2026-03-14", category: "Beauty", region: "East", channel: "Marketplace", quantity: 6, revenue_usd: 470, discount_pct: 11 },
];

export const ecommerceDatasetSchema = `
Dataset: Ecommerce Sales (${ecommerceDataset.length} records)
Fields:
- order_id: Unique order identifier
- order_date: Date of order (YYYY-MM-DD)
- category: Product category
- region: Sales region
- channel: Sales channel (Online, Marketplace, Retail)
- quantity: Units sold
- revenue_usd: Revenue amount in USD
- discount_pct: Applied discount percentage
`;
