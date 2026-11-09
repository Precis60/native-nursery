import { MONTH_LABELS, RENT_WEEKS, type ModelResult, type ScenarioInput } from "./model.ts";
import { currentMonthIndex, type ActualsSummary } from "./records.ts";

/**
 * Rolling year-end forecast: what has happened, plus what the plan still
 * expects from here.
 *
 * Months before the current one are closed and use actuals only. In the
 * current month, whatever the plan expected that has not yet been sold is
 * still to come. Later months use the plan.
 *
 * Two views of the rest of the year:
 *   on plan  — the remaining months follow the scenario unchanged
 *   at pace  — the remaining months are scaled by actual ÷ expected so far
 *
 * Cash costs still to come are the remaining months of overhead, hired wages
 * and rent, the variable cost of the plants still to be sold, and whatever
 * part of each setup budget (seed, consumables, containers, equipment) has
 * not yet been spent. Spending over a setup budget is not refunded.
 *
 * Germination switches to the batch result once enough seed has been sown.
 * Survival and sell-through stay on the plan: a batch still growing, or still
 * on the bench, would read as losses that have not happened. Their batch
 * figures are shown beside the plan, not used.
 */

/** Plants that must sit behind an observed rate before it replaces the plan. */
export const MIN_OBSERVED_SAMPLE = 100;
/** Pace is not shown until the plan expected at least this share of the year. */
export const MIN_PACE_SHARE = 0.05;
const PACE_CAP = 3;

export type RateSource = {
  label: string;
  plan: number;
  observed: number | null;
  sample: number;
  used: number;
  source: "observed" | "plan";
};

export type ReforecastView = {
  revenueRemaining: number;
  unitsRemaining: number;
  yearEndUnits: number;
  yearEndRevenue: number;
  costsRemaining: number;
  /** Cash operating profit before owner labour for the year: actual + remaining. */
  yearEndCashProfit: number;
  yearEndClosingCash: number;
  /** Plants still to start for the remaining sales, after stock on hand. */
  startsStillNeeded: number | null;
};

export type Reforecast = {
  status: "ok" | "invalid";
  monthIndex: number;
  monthLabel: string;
  closedMonths: number;
  actualUnits: number;
  actualRevenue: number;
  actualSpend: number;
  cashNow: number;
  expectedUnitsToDate: number;
  expectedRevenueToDate: number;
  /** actual ÷ expected revenue to date, or null when too early to judge. */
  pace: number | null;
  planYearEndRevenue: number | null;
  planYearEndCashProfit: number | null;
  rates: RateSource[];
  onPlan: ReforecastView | null;
  atPace: ReforecastView | null;
  monthly: { label: string; actual: number | null; onPlan: number; atPace: number | null }[];
};

function rateSource(label: string, plan: number, observed: number | null, sample: number, settled: boolean): RateSource {
  const usable = settled && observed != null && sample >= MIN_OBSERVED_SAMPLE && observed > 0;
  return { label, plan, observed, sample, used: usable ? observed : plan, source: usable ? "observed" : "plan" };
}

export function buildReforecast(
  inputs: ScenarioInput,
  result: ModelResult,
  summary: ActualsSummary,
  now: Date = new Date(),
): Reforecast {
  const monthIndex = currentMonthIndex(now);
  const weights = inputs.monthlySalesWeights;
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const share = (index: number) => (weightTotal > 0 ? (weights[index] ?? 0) / weightTotal : 0);

  const rates = [
    rateSource("Germination", inputs.germinationRate, summary.observedGermination, summary.started, true),
    rateSource("Survival", inputs.survivalRate, summary.observedSurvival, summary.germinated, false),
    rateSource("Sell-through", inputs.sellThroughRate, summary.observedSellThrough, summary.saleable, false),
  ];

  const actualUnits = summary.unitsSold;
  const actualRevenue = summary.revenueExGst;
  const actualSpend = summary.cashSpent;
  const cashNow = inputs.openingCash + summary.cashReceived - summary.cashSpent;

  const base = {
    monthIndex,
    monthLabel: MONTH_LABELS[monthIndex] ?? "",
    closedMonths: monthIndex,
    actualUnits,
    actualRevenue,
    actualSpend,
    cashNow,
    rates,
  };

  if (result.status !== "ok" || result.revenueExGst == null || weightTotal <= 0) {
    return {
      ...base,
      status: "invalid",
      expectedUnitsToDate: 0,
      expectedRevenueToDate: 0,
      pace: null,
      planYearEndRevenue: result.revenueExGst,
      planYearEndCashProfit: result.operatingProfitBeforeOwnerLabour,
      onPlan: null,
      atPace: null,
      monthly: [],
    };
  }

  const planRevenue = result.revenueExGst;
  const planUnits = inputs.salesTarget;
  let expectedShareToDate = 0;
  for (let index = 0; index <= monthIndex; index += 1) expectedShareToDate += share(index);
  const expectedUnitsToDate = planUnits * expectedShareToDate;
  const expectedRevenueToDate = planRevenue * expectedShareToDate;
  const pace =
    expectedShareToDate >= MIN_PACE_SHARE && expectedRevenueToDate > 0
      ? Math.min(PACE_CAP, actualRevenue / expectedRevenueToDate)
      : null;

  const startIndex = 2026 * 12 + 10;
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  const yearOver = nowIndex > startIndex + 11;

  // Plan still to come: the unmet part of this month, then every later month.
  const monthPlanRevenue = (index: number) => planRevenue * share(index);
  const monthPlanUnits = (index: number) => planUnits * share(index);
  const currentActual = summary.monthly[monthIndex];
  const currentRevenueLeft = yearOver ? 0 : Math.max(monthPlanRevenue(monthIndex) - (currentActual?.revenueExGst ?? 0), 0);
  const currentUnitsLeft = yearOver ? 0 : Math.max(monthPlanUnits(monthIndex) - (currentActual?.units ?? 0), 0);
  let laterRevenue = 0;
  let laterUnits = 0;
  for (let index = monthIndex + 1; index < 12; index += 1) {
    laterRevenue += monthPlanRevenue(index);
    laterUnits += monthPlanUnits(index);
  }

  // Running costs for later months plus the unexpired part of this month.
  // Before the year starts every month is still open; after it ends none are.
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthFractionLeft =
    nowIndex < startIndex ? 1 : nowIndex > startIndex + 11 ? 0 : 1 - (now.getDate() - 1) / daysInMonth;
  const monthsLeft = 11 - monthIndex + monthFractionLeft;
  const hiredAnnual = inputs.hiredHoursPerWeek * inputs.hiredHourlyRate * inputs.weeksPerYear;
  const rentAnnual = inputs.businessRentPerWeek * RENT_WEEKS;
  const runningLeft = ((inputs.annualOverhead + hiredAnnual + rentAnnual) * monthsLeft) / 12;
  const spent = summary.spendByCategory;
  const setupLeft =
    Math.max(inputs.purchasedSeedAllowance - spent.seed, 0) +
    Math.max(inputs.growingConsumables - spent.consumables, 0) +
    Math.max(inputs.reusableContainers - spent.containers, 0) +
    Math.max(inputs.oneOffEquipment + (inputs.quoteNeededCash ?? 0) - spent.equipment, 0);
  const equipmentActual = spent.equipment;
  const equipmentLeft = Math.max(inputs.oneOffEquipment + (inputs.quoteNeededCash ?? 0) - spent.equipment, 0);

  const [germ, surv, sell] = rates;
  const view = (factor: number): ReforecastView => {
    const revenueRemaining = (currentRevenueLeft + laterRevenue) * factor;
    const unitsRemaining = (currentUnitsLeft + laterUnits) * factor;
    const saleableNeeded = sell!.used > 0 ? unitsRemaining / sell!.used : null;
    const variableLeft = saleableNeeded == null ? 0 : saleableNeeded * inputs.variableCostPerSaleableUnit;
    const costsRemaining = runningLeft + setupLeft + variableLeft;
    const toGrow = saleableNeeded == null ? null : Math.max(saleableNeeded - summary.stockOnHand, 0);
    const startsStillNeeded =
      toGrow == null || !(surv!.used > 0) || !(germ!.used > 0) ? null : toGrow / surv!.used / germ!.used;
    // Cash profit excludes equipment, as the planner does.
    const yearEndCashProfit =
      actualRevenue + revenueRemaining - (actualSpend - equipmentActual) - (costsRemaining - equipmentLeft);
    return {
      revenueRemaining,
      unitsRemaining,
      yearEndUnits: actualUnits + unitsRemaining,
      yearEndRevenue: actualRevenue + revenueRemaining,
      costsRemaining,
      yearEndCashProfit,
      yearEndClosingCash: cashNow + revenueRemaining - costsRemaining,
      startsStillNeeded,
    };
  };

  const onPlan = view(1);
  const atPace = pace == null ? null : view(pace);

  // Cumulative revenue line: actuals through the current month, forecasts after.
  let actualRunning = 0;
  let planRunning = 0;
  let paceRunning = 0;
  const monthly = MONTH_LABELS.map((label, index) => {
    if (index <= monthIndex) {
      actualRunning += summary.monthly[index]?.revenueExGst ?? 0;
      planRunning = actualRunning;
      paceRunning = actualRunning;
      if (index === monthIndex) {
        planRunning += currentRevenueLeft;
        paceRunning += currentRevenueLeft * (pace ?? 1);
      }
      return { label, actual: Math.round(actualRunning), onPlan: Math.round(planRunning), atPace: pace == null ? null : Math.round(paceRunning) };
    }
    planRunning += monthPlanRevenue(index);
    paceRunning += monthPlanRevenue(index) * (pace ?? 1);
    return { label, actual: null, onPlan: Math.round(planRunning), atPace: pace == null ? null : Math.round(paceRunning) };
  });

  return {
    ...base,
    status: "ok",
    expectedUnitsToDate,
    expectedRevenueToDate,
    pace,
    planYearEndRevenue: planRevenue,
    planYearEndCashProfit: result.operatingProfitBeforeOwnerLabour,
    rates,
    onPlan,
    atPace,
    monthly,
  };
}
