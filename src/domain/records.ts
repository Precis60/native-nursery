import { csvCell } from "./format.ts";
import { MONTH_LABELS, type ModelResult, type ScenarioInput } from "./model.ts";

/**
 * Recorded actuals for the running nursery, kept separate from planning inputs.
 * Money is entered the way it was charged: `includesGst` marks amounts that
 * already carry GST, and ex-GST figures are derived, never typed twice.
 */
export const GST_RATE = 0.1;

export const SALE_CHANNELS = [
  "Council",
  "Landcare",
  "Catchment",
  "Revegetation",
  "Landscapers",
  "Retail",
  "Market",
  "On-site",
  "Online",
  "Other",
] as const;

export type SaleChannel = (typeof SALE_CHANNELS)[number];

export type SizeKind = "tube" | "pot140" | "other";

export const SIZE_LABEL: Record<SizeKind, string> = {
  tube: "Tube",
  pot140: "140 mm",
  other: "Other",
};

export type SaleEntry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  channel: string;
  description: string;
  /** Botanical name when the sale is linked to a planned species. Older rows omit it. */
  species?: string;
  size: SizeKind;
  units: number;
  /** Unit price as charged. GST basis is carried by includesGst. */
  unitPrice: number;
  includesGst: boolean;
  updatedAt: string;
};

export const EXPENSE_CATEGORIES = [
  "consumables",
  "containers",
  "seed",
  "equipment",
  "overhead",
  "labour",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  consumables: "Growing consumables",
  containers: "Reusable containers",
  seed: "Purchased seed",
  equipment: "One-off equipment",
  overhead: "Overhead",
  labour: "Hired labour",
  other: "Other",
};

export type ExpenseEntry = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  includesGst: boolean;
  updatedAt: string;
};

export type Batch = {
  id: string;
  name: string;
  species: string;
  size: "tube" | "pot140";
  /** YYYY-MM-DD the batch was sown or struck. */
  startedAt: string;
  started: number;
  germinated: number;
  saleable: number;
  sold: number;
  updatedAt: string;
};

export const ORDER_STATUSES = ["enquiry", "confirmed", "delivered", "paid", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  enquiry: "Enquiry",
  confirmed: "Confirmed",
  delivered: "Delivered",
  paid: "Paid",
  cancelled: "Cancelled",
};

export type NurseryOrder = {
  id: string;
  buyer: string;
  channel: string;
  description: string;
  size: SizeKind;
  units: number;
  unitPrice: number;
  includesGst: boolean;
  status: OrderStatus;
  updatedAt: string;
};

export type LabourWeek = {
  id: string;
  /** YYYY-MM-DD for the Monday (or any day) the week started. */
  weekStart: string;
  ownerHours: number;
  hiredHours: number;
  updatedAt: string;
};

/** key -> ISO timestamp the item was ticked. Absent means not done. */
export type ChecklistFlags = Record<string, string>;
export type PurchaseFlag = { paid: number | null; at: string };
export type PurchaseFlags = Record<string, PurchaseFlag>;

export type RecordsState = {
  sales: SaleEntry[];
  expenses: ExpenseEntry[];
  batches: Batch[];
  orders: NurseryOrder[];
  labour: LabourWeek[];
  checklist: ChecklistFlags;
  purchases: PurchaseFlags;
};

export function emptyRecords(): RecordsState {
  return { sales: [], expenses: [], batches: [], orders: [], labour: [], checklist: {}, purchases: {} };
}

export function exGst(amount: number, includesGst: boolean): number {
  return includesGst ? amount / (1 + GST_RATE) : amount;
}

export function gstPart(amount: number, includesGst: boolean): number {
  return includesGst ? amount - exGst(amount, includesGst) : 0;
}

/** Nov 2026 is month 0 and Oct 2027 is month 11. Dates outside return null. */
export function businessMonthIndex(year: number, monthZero: number): number | null {
  const index = (year - 2026) * 12 + monthZero - 10;
  return index >= 0 && index <= 11 ? index : null;
}

export function dateMonthIndex(date: string): number | null {
  const match = /^(\d{4})-(\d{2})/.exec(date.trim());
  if (!match) return null;
  return businessMonthIndex(Number(match[1]), Number(match[2]) - 1);
}

/** The business month the date falls in, clamped to the year for plan-vs-actual. */
export function currentMonthIndex(now: Date = new Date()): number {
  const index = businessMonthIndex(now.getFullYear(), now.getMonth());
  if (index == null) return now.getFullYear() * 12 + now.getMonth() < 2026 * 12 + 10 ? 0 : 11;
  return index;
}

/** Cumulative share of the monthly sales weights for months 0..throughIndex. */
export function expectedShare(weights: number[], throughIndex: number): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!(total > 0)) return 0;
  const end = Math.min(Math.max(throughIndex, -1), weights.length - 1);
  let elapsed = 0;
  for (let index = 0; index <= end; index += 1) elapsed += weights[index] ?? 0;
  return elapsed / total;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export type MonthlyActual = {
  label: string;
  index: number;
  units: number;
  revenueExGst: number;
  spend: number;
};

export type ActualsSummary = {
  saleCount: number;
  unitsSold: number;
  tubeUnits: number;
  potUnits: number;
  otherUnits: number;
  /** Ex GST, after unwrapping any inc-GST prices. */
  revenueExGst: number;
  /** Cash that actually arrived, including any GST portion. */
  cashReceived: number;
  gstCollected: number;
  blendedPriceExGst: number | null;
  spendTotal: number;
  cashSpent: number;
  gstPaid: number;
  spendByCategory: Record<ExpenseCategory, number>;
  started: number;
  germinated: number;
  saleable: number;
  soldFromBatches: number;
  observedGermination: number | null;
  observedSurvival: number | null;
  observedSellThrough: number | null;
  tubeStock: number;
  potStock: number;
  stockOnHand: number;
  enquiryUnits: number;
  committedUnits: number;
  ownerHours: number;
  hiredHours: number;
  monthly: MonthlyActual[];
};

export function summarise(records: RecordsState): ActualsSummary {
  const spendByCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, 0])) as Record<
    ExpenseCategory,
    number
  >;
  const monthly = MONTH_LABELS.map((label, index) => ({ label, index, units: 0, revenueExGst: 0, spend: 0 }));
  let unitsSold = 0;
  let tubeUnits = 0;
  let potUnits = 0;
  let otherUnits = 0;
  let revenueExGst = 0;
  let cashReceived = 0;
  let gstCollected = 0;
  for (const sale of records.sales) {
    const units = sale.units;
    const gross = units * sale.unitPrice;
    unitsSold += units;
    if (sale.size === "tube") tubeUnits += units;
    else if (sale.size === "pot140") potUnits += units;
    else otherUnits += units;
    revenueExGst += exGst(gross, sale.includesGst);
    cashReceived += gross;
    gstCollected += gstPart(gross, sale.includesGst);
    const index = dateMonthIndex(sale.date);
    if (index != null) {
      monthly[index]!.units += units;
      monthly[index]!.revenueExGst += exGst(gross, sale.includesGst);
    }
  }
  let spendTotal = 0;
  let gstPaid = 0;
  for (const expense of records.expenses) {
    spendByCategory[expense.category] += expense.amount;
    spendTotal += expense.amount;
    gstPaid += gstPart(expense.amount, expense.includesGst);
    const index = dateMonthIndex(expense.date);
    if (index != null) monthly[index]!.spend += expense.amount;
  }
  let started = 0;
  let germinated = 0;
  let saleable = 0;
  let soldFromBatches = 0;
  let tubeStock = 0;
  let potStock = 0;
  for (const batch of records.batches) {
    started += batch.started;
    germinated += batch.germinated;
    saleable += batch.saleable;
    soldFromBatches += batch.sold;
    const remaining = Math.max(batch.saleable - batch.sold, 0);
    if (batch.size === "tube") tubeStock += remaining;
    else potStock += remaining;
  }
  let enquiryUnits = 0;
  let committedUnits = 0;
  for (const order of records.orders) {
    if (order.status === "enquiry") enquiryUnits += order.units;
    else if (order.status === "confirmed") committedUnits += order.units;
  }
  let ownerHours = 0;
  let hiredHours = 0;
  for (const week of records.labour) {
    ownerHours += week.ownerHours;
    hiredHours += week.hiredHours;
  }
  return {
    saleCount: records.sales.length,
    unitsSold,
    tubeUnits,
    potUnits,
    otherUnits,
    revenueExGst,
    cashReceived,
    gstCollected,
    blendedPriceExGst: ratio(revenueExGst, unitsSold),
    spendTotal,
    cashSpent: spendTotal,
    gstPaid,
    spendByCategory,
    started,
    germinated,
    saleable,
    soldFromBatches,
    observedGermination: ratio(germinated, started),
    observedSurvival: ratio(saleable, germinated),
    observedSellThrough: ratio(soldFromBatches, saleable),
    tubeStock,
    potStock,
    stockOnHand: tubeStock + potStock,
    enquiryUnits,
    committedUnits,
    ownerHours,
    hiredHours,
    monthly,
  };
}

export type PlanVsActual = {
  monthIndex: number;
  share: number;
  expectedUnits: number;
  expectedRevenue: number;
  breakEvenProgress: number | null;
  preorderCoverage: number | null;
  /** opening cash + cash received - cash spent, vs the sketch's closing cash. */
  cashPosition: number;
  sketchClosing: number | null;
};

export function planVsActual(
  summary: ActualsSummary,
  inputs: ScenarioInput,
  result: ModelResult,
  now: Date = new Date(),
): PlanVsActual {
  const monthIndex = currentMonthIndex(now);
  const share = expectedShare(inputs.monthlySalesWeights, monthIndex);
  const operatingBreakEven = result.breakEven?.status === "solved" ? (result.breakEven.operatingSalesUnits ?? null) : null;
  const sketchClosing = result.monthly?.[monthIndex]?.closingCash ?? null;
  return {
    monthIndex,
    share,
    expectedUnits: inputs.salesTarget * share,
    expectedRevenue: (result.revenueExGst ?? 0) * share,
    breakEvenProgress: operatingBreakEven != null && operatingBreakEven > 0 ? summary.unitsSold / operatingBreakEven : null,
    preorderCoverage:
      result.saleableRequired != null && result.saleableRequired > 0 ? summary.committedUnits / result.saleableRequired : null,
    cashPosition: inputs.openingCash + summary.cashReceived - summary.cashSpent,
    sketchClosing,
  };
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) && !Number.isNaN(Date.parse(`${value.trim()}T00:00:00Z`));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function flag(value: unknown): boolean {
  return value === true;
}

function coerceCommon(value: Record<string, unknown>) {
  const id = text(value.id);
  if (!id) return null;
  return {
    id,
    updatedAt: text(value.updatedAt, new Date(0).toISOString()),
  };
}

export function coerceSale(value: unknown): SaleEntry | null {
  if (!isRecord(value)) return null;
  const common = coerceCommon(value);
  if (!common || !isISODate(text(value.date))) return null;
  const size = text(value.size);
  return {
    ...common,
    date: text(value.date),
    channel: text(value.channel, "Other"),
    description: text(value.description),
    species: typeof value.species === "string" && value.species.trim() ? value.species : undefined,
    size: size === "tube" || size === "pot140" ? size : "other",
    units: num(value.units),
    unitPrice: num(value.unitPrice),
    includesGst: flag(value.includesGst),
  };
}

export function coerceExpense(value: unknown): ExpenseEntry | null {
  if (!isRecord(value)) return null;
  const common = coerceCommon(value);
  if (!common || !isISODate(text(value.date))) return null;
  const category = text(value.category);
  return {
    ...common,
    date: text(value.date),
    category: (EXPENSE_CATEGORIES as readonly string[]).includes(category) ? (category as ExpenseCategory) : "other",
    description: text(value.description),
    amount: num(value.amount),
    includesGst: flag(value.includesGst),
  };
}

export function coerceBatch(value: unknown): Batch | null {
  if (!isRecord(value)) return null;
  const common = coerceCommon(value);
  if (!common || !isISODate(text(value.startedAt))) return null;
  const size = text(value.size);
  return {
    ...common,
    name: text(value.name, "Batch"),
    species: text(value.species),
    size: size === "pot140" ? "pot140" : "tube",
    startedAt: text(value.startedAt),
    started: num(value.started),
    germinated: num(value.germinated),
    saleable: num(value.saleable),
    sold: num(value.sold),
  };
}

export function coerceOrder(value: unknown): NurseryOrder | null {
  if (!isRecord(value)) return null;
  const common = coerceCommon(value);
  if (!common) return null;
  const status = text(value.status);
  const size = text(value.size);
  return {
    ...common,
    buyer: text(value.buyer),
    channel: text(value.channel, "Other"),
    description: text(value.description),
    size: size === "tube" || size === "pot140" ? size : "other",
    units: num(value.units),
    unitPrice: num(value.unitPrice),
    includesGst: flag(value.includesGst),
    status: (ORDER_STATUSES as readonly string[]).includes(status) ? (status as OrderStatus) : "enquiry",
  };
}

export function coerceLabour(value: unknown): LabourWeek | null {
  if (!isRecord(value)) return null;
  const common = coerceCommon(value);
  if (!common || !isISODate(text(value.weekStart))) return null;
  return {
    ...common,
    weekStart: text(value.weekStart),
    ownerHours: num(value.ownerHours),
    hiredHours: num(value.hiredHours),
  };
}

export function coerceFlags(value: unknown): { checklist: ChecklistFlags; purchases: PurchaseFlags } {
  const out = { checklist: {} as ChecklistFlags, purchases: {} as PurchaseFlags };
  if (!isRecord(value)) return out;
  if (isRecord(value.checklist)) {
    for (const [key, done] of Object.entries(value.checklist)) {
      if (typeof done === "string") out.checklist[key] = done;
    }
  }
  if (isRecord(value.purchases)) {
    for (const [key, flagValue] of Object.entries(value.purchases)) {
      if (isRecord(flagValue)) {
        out.purchases[key] = {
          paid: typeof flagValue.paid === "number" && Number.isFinite(flagValue.paid) ? flagValue.paid : null,
          at: text(flagValue.at, new Date(0).toISOString()),
        };
      }
    }
  }
  return out;
}

export function coerceRecords(value: unknown): RecordsState {
  const records = emptyRecords();
  if (!isRecord(value)) return records;
  if (Array.isArray(value.sales)) {
    for (const item of value.sales) {
      const sale = coerceSale(item);
      if (sale) records.sales.push(sale);
    }
  }
  if (Array.isArray(value.expenses)) {
    for (const item of value.expenses) {
      const expense = coerceExpense(item);
      if (expense) records.expenses.push(expense);
    }
  }
  if (Array.isArray(value.batches)) {
    for (const item of value.batches) {
      const batch = coerceBatch(item);
      if (batch) records.batches.push(batch);
    }
  }
  if (Array.isArray(value.orders)) {
    for (const item of value.orders) {
      const order = coerceOrder(item);
      if (order) records.orders.push(order);
    }
  }
  if (Array.isArray(value.labour)) {
    for (const item of value.labour) {
      const week = coerceLabour(item);
      if (week) records.labour.push(week);
    }
  }
  const flags = coerceFlags(value);
  records.checklist = flags.checklist;
  records.purchases = flags.purchases;
  return records;
}

export function recordsToCsv(records: RecordsState): string {
  const lines: string[] = [`exported_at,${csvCell(new Date().toISOString())}`];
  const emit = (rows: (string | number | null)[][]) => {
    for (const row of rows) lines.push(row.map((cell) => csvCell(cell)).join(","));
    lines.push("");
  };

  lines.push("sales");
  emit([
    ["date", "channel", "description", "size", "units", "unit_price", "includes_gst", "total_ex_gst", "gst"],
    ...records.sales.map((sale) => [
      sale.date,
      sale.channel,
      sale.description,
      sale.size,
      sale.units,
      sale.unitPrice,
      sale.includesGst ? "yes" : "no",
      exGst(sale.units * sale.unitPrice, sale.includesGst).toFixed(2),
      gstPart(sale.units * sale.unitPrice, sale.includesGst).toFixed(2),
    ]),
  ]);

  lines.push("expenses");
  emit([
    ["date", "category", "description", "amount", "includes_gst", "ex_gst", "gst"],
    ...records.expenses.map((expense) => [
      expense.date,
      EXPENSE_CATEGORY_LABEL[expense.category],
      expense.description,
      expense.amount,
      expense.includesGst ? "yes" : "no",
      exGst(expense.amount, expense.includesGst).toFixed(2),
      gstPart(expense.amount, expense.includesGst).toFixed(2),
    ]),
  ]);

  lines.push("orders");
  emit([
    ["buyer", "channel", "description", "size", "units", "unit_price", "includes_gst", "total_ex_gst", "status"],
    ...records.orders.map((order) => [
      order.buyer,
      order.channel,
      order.description,
      order.size,
      order.units,
      order.unitPrice,
      order.includesGst ? "yes" : "no",
      exGst(order.units * order.unitPrice, order.includesGst).toFixed(2),
      ORDER_STATUS_LABEL[order.status],
    ]),
  ]);

  lines.push("batches");
  emit([
    ["name", "species", "size", "started_at", "started", "germinated", "saleable", "sold"],
    ...records.batches.map((batch) => [
      batch.name,
      batch.species,
      batch.size,
      batch.startedAt,
      batch.started,
      batch.germinated,
      batch.saleable,
      batch.sold,
    ]),
  ]);

  lines.push("labour");
  emit([
    ["week_start", "owner_hours", "hired_hours"],
    ...records.labour.map((week) => [week.weekStart, week.ownerHours, week.hiredHours]),
  ]);

  return lines.join("\n");
}
