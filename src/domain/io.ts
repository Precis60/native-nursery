import { coercePlan } from "./plan.ts";
import { evaluate, type ModelResult, type ScenarioInput } from "./model.ts";
import { csvCell } from "./format.ts";

export const EXPORT_VERSION = 1;

export type PortableScenario = { name: string; inputs: ScenarioInput };

const INPUT_KEYS: (keyof ScenarioInput)[] = [
  "salesTarget",
  "tubeShare",
  "tubePriceExGst",
  "potPriceExGst",
  "germinationRate",
  "survivalRate",
  "sellThroughRate",
  "variableCostPerSaleableUnit",
  "purchasedSeedAllowance",
  "annualOverhead",
  "oneOffEquipment",
  "reusableContainers",
  "growingConsumables",
  "quoteNeededCash",
  "ownerHoursPerWeek",
  "ownerHourlyRate",
  "hiredHoursPerWeek",
  "hiredHourlyRate",
  "weeksPerYear",
  "businessRentPerWeek",
  "openingCash",
  "monthlySalesWeights",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function coerceInputs(value: unknown): ScenarioInput | null {
  if (!isRecord(value)) return null;
  const inputs = {} as ScenarioInput;
  for (const key of INPUT_KEYS) {
    if (key === "quoteNeededCash") {
      const quote = value[key];
      if (quote == null) inputs.quoteNeededCash = null;
      else if (typeof quote === "number") inputs.quoteNeededCash = quote;
      else return null;
      continue;
    }
    if (key === "monthlySalesWeights") {
      const weights = value[key];
      if (!Array.isArray(weights) || !weights.every((item) => typeof item === "number")) return null;
      inputs.monthlySalesWeights = [...weights];
      continue;
    }
    const field = value[key];
    if (typeof field !== "number") {
      const legacyEquipment = value.equipmentExSeed;
      const missingSplit =
        (key === "oneOffEquipment" || key === "reusableContainers" || key === "growingConsumables") &&
        typeof legacyEquipment === "number" &&
        value.oneOffEquipment == null &&
        value.reusableContainers == null &&
        value.growingConsumables == null;
      if (missingSplit && key === "oneOffEquipment") {
        inputs.oneOffEquipment = legacyEquipment;
        inputs.reusableContainers = 0;
        inputs.growingConsumables = 0;
        continue;
      }
      if (missingSplit) continue;
      return null;
    }
    Object.assign(inputs, { [key]: field });
  }
  // Optional cash-timing settings. Older scenarios omit them.
  if (value.growLeadMonths != null) {
    if (typeof value.growLeadMonths !== "number") return null;
    inputs.growLeadMonths = value.growLeadMonths;
  }
  if (value.gstRegistered != null) {
    if (typeof value.gstRegistered !== "boolean") return null;
    inputs.gstRegistered = value.gstRegistered;
  }
  if (value.taxSetAsideRate != null) {
    if (typeof value.taxSetAsideRate !== "number") return null;
    inputs.taxSetAsideRate = value.taxSetAsideRate;
  }
  if ("plan" in value && value.plan != null) {
    const plan = coercePlan(value.plan);
    if (!plan) return null;
    inputs.plan = plan;
  }
  return inputs;
}

export function parseImport(raw: string): { scenarios: PortableScenario[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That file is not JSON." };
  }
  const records: PortableScenario[] = [];
  const push = (name: unknown, inputs: unknown): string | null => {
    const coerced = coerceInputs(inputs);
    if (!coerced) return "A scenario is missing numbers the planner needs.";
    const result = evaluate(coerced);
    if (result.status === "invalid") {
      return result.issues[0]?.message ?? "A scenario has an invalid number.";
    }
    const label = typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "Imported scenario";
    records.push({ name: label, inputs: coerced });
    return null;
  };

  if (Array.isArray(parsed)) {
    if (parsed.length > 50) return { error: "Import up to 50 scenarios at a time." };
    for (const item of parsed) {
      if (!isRecord(item)) return { error: "Each item in the file needs to be an object." };
      const error = push(item.name, item.inputs ?? item);
      if (error) return { error };
    }
    return records.length ? { scenarios: records } : { error: "The file has no scenarios." };
  }
  if (!isRecord(parsed)) return { error: "The file has no scenario object." };
  if (Array.isArray(parsed.scenarios)) {
    if (parsed.scenarios.length > 50) return { error: "Import up to 50 scenarios at a time." };
    for (const item of parsed.scenarios) {
      if (!isRecord(item)) return { error: "Each scenario needs to be an object." };
      const error = push(item.name, item.inputs);
      if (error) return { error };
    }
    return records.length ? { scenarios: records } : { error: "The file has no scenarios." };
  }
  const error = push(parsed.name, parsed.inputs ?? parsed);
  if (error) return { error };
  return { scenarios: records };
}

export function serializeScenario(scenario: PortableScenario): string {
  return JSON.stringify({ app: "native-nursery", version: EXPORT_VERSION, name: scenario.name, inputs: scenario.inputs }, null, 2);
}

export function serializeBundle(scenarios: PortableScenario[]): string {
  return JSON.stringify({ app: "native-nursery", version: EXPORT_VERSION, scenarios }, null, 2);
}

export function scenarioToCsv(name: string, result: ModelResult): string {
  const rows: (string | number | null)[][] = [
    ["section", "metric", "value"],
    ["annual", "scenario", name],
    ["annual", "status", result.status],
    ["annual", "revenue_ex_gst", result.revenueExGst],
    ["annual", "units_sold", result.unitsSold],
    ["annual", "saleable_required", result.saleableRequired],
    ["annual", "germinated_required", result.germinatedRequired],
    ["annual", "started_required", result.startedRequired],
    ["annual", "variable_production_cost", result.variableProductionCost],
    ["annual", "purchased_seed", result.purchasedSeed],
    ["annual", "annual_overhead", result.annualOverhead],
    ["annual", "hired_labour_cash", result.hiredLabourCash],
    ["annual", "owner_labour_economic", result.ownerLabourEconomic],
    ["annual", "business_rent", result.businessRent],
    ["annual", "operating_profit_before_owner_labour", result.operatingProfitBeforeOwnerLabour],
    ["annual", "operating_profit_after_owner_labour", result.operatingProfitAfterOwnerLabour],
    ["annual", "one_off_equipment", result.oneOffEquipment],
    ["annual", "reusable_containers", result.reusableContainers],
    ["annual", "growing_consumables", result.growingConsumables],
    ["annual", "quote_needed_included", result.quoteNeededIncluded ? "yes" : "no"],
    ["annual", "quote_needed_cash", result.quoteNeededCash],
    ["annual", "cash_movement_after_capex", result.cashMovementAfterCapex],
    ["annual", "closing_cash", result.closingCash],
    ["annual", "grow_lead_months", result.growLeadMonths],
    ["annual", "gst_registered", result.gstRegistered ? "yes" : "no"],
    ["annual", "gst_owed_at_year_end", result.gstOwedAtYearEnd],
    ["annual", "tax_set_aside_rate", result.taxSetAsideRate],
    ["annual", "tax_set_aside", result.taxSetAside],
    ["annual", "closing_cash_after_tax", result.closingCashAfterTax],
    ["annual", "break_even_status", result.breakEven?.status ?? ""],
    ["annual", "operating_break_even_sales", result.breakEven?.operatingSalesUnits ?? null],
    ["annual", "cash_break_even_sales", result.breakEven?.cashSalesUnits ?? null],
    ["annual", "gap_to_40000_before_owner_labour", result.gapToProfitGoalBeforeOwnerLabour],
  ];
  for (const month of result.monthly ?? []) {
    rows.push(["month", month.label, month.revenue]);
    rows.push(["month_cash", month.label, month.netCash]);
    if (result.gstRegistered) rows.push(["month_bas", month.label, month.basPayment]);
  }
  return rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");
}
