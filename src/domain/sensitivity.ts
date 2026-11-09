import { OPEX_MONTHLY_DEFAULT, OPEX_MONTHLY_HIGH, OPEX_MONTHLY_LOW, POT_PRICE_DEFAULT, POT_PRICE_HIGH, POT_PRICE_LOW, TUBE_PRICE_DEFAULT, TUBE_PRICE_HIGH, TUBE_PRICE_LOW } from "./defaults.ts";
import { evaluate, type ModelResult, type ScenarioInput } from "./model.ts";

/**
 * Ranges around the open scenario.
 *
 * Every driver swings the scenario's own value, so an edited scenario keeps its
 * edits. Price and overhead swings reuse the spread of the planning ranges
 * already in the app: tubes $1.80–$2.50 around $2.15, 140 mm $6–$10 around $8,
 * overhead $220–$660 a month around $440. Volume and rates use plain planning
 * swings, listed with each driver so the screen can say what was assumed.
 */

export type Side = "cautious" | "strong";

export type Driver = {
  id: string;
  label: string;
  /** Plain description of the swing, shown beside the chart. */
  swing: string;
  apply: (inputs: ScenarioInput, side: Side) => ScenarioInput;
};

const clampRate = (value: number) => Math.min(1, Math.max(0.05, value));
const scale = (value: number, factor: number) => Math.max(0, value * factor);

const TUBE_DOWN = TUBE_PRICE_LOW / TUBE_PRICE_DEFAULT;
const TUBE_UP = TUBE_PRICE_HIGH / TUBE_PRICE_DEFAULT;
const POT_DOWN = POT_PRICE_LOW / POT_PRICE_DEFAULT;
const POT_UP = POT_PRICE_HIGH / POT_PRICE_DEFAULT;
const OPEX_DOWN = OPEX_MONTHLY_LOW / OPEX_MONTHLY_DEFAULT;
const OPEX_UP = OPEX_MONTHLY_HIGH / OPEX_MONTHLY_DEFAULT;

const pct = (factor: number) => `${Math.round(Math.abs(factor - 1) * 100)}%`;

export const DRIVERS: Driver[] = [
  {
    id: "volume",
    label: "Plants sold",
    swing: "±20% on the sales target",
    apply: (inputs, side) => ({ ...inputs, salesTarget: scale(inputs.salesTarget, side === "strong" ? 1.2 : 0.8) }),
  },
  {
    id: "tubePrice",
    label: "Tube price",
    swing: `−${pct(TUBE_DOWN)} / +${pct(TUBE_UP)}, the spread of the $1.80–$2.50 range`,
    apply: (inputs, side) => ({ ...inputs, tubePriceExGst: scale(inputs.tubePriceExGst, side === "strong" ? TUBE_UP : TUBE_DOWN) }),
  },
  {
    id: "potPrice",
    label: "140 mm price",
    swing: `±${pct(POT_UP)}, the spread of the $6–$10 range`,
    apply: (inputs, side) => ({ ...inputs, potPriceExGst: scale(inputs.potPriceExGst, side === "strong" ? POT_UP : POT_DOWN) }),
  },
  {
    id: "tubeShare",
    label: "Tube / pot mix",
    swing: "Tube share ±10 points (more pots is the strong side)",
    apply: (inputs, side) => ({
      ...inputs,
      tubeShare: Math.min(1, Math.max(0, inputs.tubeShare + (side === "strong" ? -0.1 : 0.1))),
    }),
  },
  {
    id: "sellThrough",
    label: "Sell-through",
    swing: "±10 points",
    apply: (inputs, side) => ({ ...inputs, sellThroughRate: clampRate(inputs.sellThroughRate + (side === "strong" ? 0.1 : -0.1)) }),
  },
  {
    id: "overhead",
    label: "Overhead",
    swing: `±${pct(OPEX_UP)}, the spread of the $220–$660 a month estimate`,
    apply: (inputs, side) => ({ ...inputs, annualOverhead: scale(inputs.annualOverhead, side === "strong" ? OPEX_DOWN : OPEX_UP) }),
  },
  {
    id: "consumables",
    label: "Media and containers",
    swing: "±25% on growing consumables and reusable containers",
    apply: (inputs, side) => {
      const factor = side === "strong" ? 0.75 : 1.25;
      return {
        ...inputs,
        growingConsumables: scale(inputs.growingConsumables, factor),
        reusableContainers: scale(inputs.reusableContainers, factor),
      };
    },
  },
];

/** Germination and survival change how many plants you start, not the cash lines. */
export const PRODUCTION_DRIVERS: Driver[] = [
  {
    id: "germination",
    label: "Germination",
    swing: "±10 points",
    apply: (inputs, side) => ({ ...inputs, germinationRate: clampRate(inputs.germinationRate + (side === "strong" ? 0.1 : -0.1)) }),
  },
  {
    id: "survival",
    label: "Survival",
    swing: "±7.5 points",
    apply: (inputs, side) => ({ ...inputs, survivalRate: clampRate(inputs.survivalRate + (side === "strong" ? 0.075 : -0.075)) }),
  },
];

export type CaseId = "cautious" | "base" | "strong";

export type CaseSummary = {
  id: CaseId;
  label: string;
  inputs: ScenarioInput;
  result: ModelResult;
  revenue: number | null;
  cashProfit: number | null;
  profitAfterOwner: number | null;
  closingCash: number | null;
  lowestCash: number | null;
  lowestCashMonth: string | null;
  starts: number | null;
  breakEvenUnits: number | null;
};

export type SensitivityBar = {
  id: string;
  label: string;
  swing: string;
  cautious: number;
  strong: number;
  /** strong − cautious, the width of the bar. */
  spread: number;
};

export type ProductionRange = {
  id: string;
  label: string;
  swing: string;
  cautiousStarts: number | null;
  strongStarts: number | null;
};

export type RangeReport = {
  status: "ok" | "invalid";
  cases: CaseSummary[];
  bars: SensitivityBar[];
  production: ProductionRange[];
  baseProfit: number | null;
  /** True when the cautious case still makes a cash profit before owner labour. */
  cautiousProfitable: boolean | null;
};

function summariseCase(id: CaseId, label: string, inputs: ScenarioInput): CaseSummary {
  const result = evaluate(inputs);
  let lowestCash: number | null = null;
  let lowestCashMonth: string | null = null;
  for (const month of result.monthly ?? []) {
    if (lowestCash == null || month.closingCash < lowestCash) {
      lowestCash = month.closingCash;
      lowestCashMonth = month.label;
    }
  }
  return {
    id,
    label,
    inputs,
    result,
    revenue: result.revenueExGst,
    cashProfit: result.operatingProfitBeforeOwnerLabour,
    profitAfterOwner: result.operatingProfitAfterOwnerLabour,
    closingCash: result.closingCash,
    lowestCash,
    lowestCashMonth,
    starts: result.startedRequired,
    breakEvenUnits: result.breakEven?.status === "solved" ? result.breakEven.operatingSalesUnits : null,
  };
}

/** Apply every driver on one side, cash and production alike. */
export function stressed(inputs: ScenarioInput, side: Side): ScenarioInput {
  return [...DRIVERS, ...PRODUCTION_DRIVERS].reduce((next, driver) => driver.apply(next, side), inputs);
}

export function buildRangeReport(inputs: ScenarioInput): RangeReport {
  const base = summariseCase("base", "Base", inputs);
  if (base.result.status !== "ok" || base.cashProfit == null) {
    return { status: "invalid", cases: [base], bars: [], production: [], baseProfit: null, cautiousProfitable: null };
  }
  const cautious = summariseCase("cautious", "Cautious", stressed(inputs, "cautious"));
  const strong = summariseCase("strong", "Strong", stressed(inputs, "strong"));

  const profitOf = (next: ScenarioInput) => evaluate(next).operatingProfitBeforeOwnerLabour;
  const bars: SensitivityBar[] = [];
  for (const driver of DRIVERS) {
    const low = profitOf(driver.apply(inputs, "cautious"));
    const high = profitOf(driver.apply(inputs, "strong"));
    if (low == null || high == null) continue;
    bars.push({ id: driver.id, label: driver.label, swing: driver.swing, cautious: low, strong: high, spread: high - low });
  }
  bars.sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread));

  const production = PRODUCTION_DRIVERS.map((driver) => ({
    id: driver.id,
    label: driver.label,
    swing: driver.swing,
    cautiousStarts: evaluate(driver.apply(inputs, "cautious")).startedRequired,
    strongStarts: evaluate(driver.apply(inputs, "strong")).startedRequired,
  }));

  return {
    status: "ok",
    cases: [cautious, base, strong],
    bars,
    production,
    baseProfit: base.cashProfit,
    cautiousProfitable: cautious.cashProfit == null ? null : cautious.cashProfit > 0,
  };
}
