export type PrototypeValue = string | number | boolean;
export type PrototypeRow = { id: string; status: string; severity: string; owner: string; [key: string]: PrototypeValue };
export type PrototypeMetric = { label: string; value: string; trend: string; status: 'good' | 'warning' | 'danger' | 'neutral' };
export type PrototypeChartPoint = { label: string; value: number; secondary?: number };
export type PrototypePageFixture = {
  pageId: string;
  generatedAt: string;
  freshness: string;
  coverage: number;
  metrics: PrototypeMetric[];
  chart: PrototypeChartPoint[];
  rows: PrototypeRow[];
  timeline: { time: string; title: string; detail: string; status: string }[];
  relationships: { source: string; relation: string; target: string }[];
};
