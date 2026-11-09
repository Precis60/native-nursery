/**
 * Year-1 nursery economics in AUD.
 *
 * Trading prices are ex GST. Kit cash is the published shelf-price total
 * (many lines were listed inc GST) and is labelled as a cash estimate.
 *
 * The sales target is the number of plants to sell. It is not multiplied
 * by the 85% sell-through figure. That rate only grosses up production:
 *   saleable = sales / sell-through
 *   germinated = saleable / survival
 *   starts = germinated / germination
 *
 * Variable cost is charged on saleable plants produced, not only on plants sold.
 * It is a residual rate and does not repeat seed, media, fertiliser or tubes.
 * Purchased seed, growing consumables and reusable containers are separate cash
 * lines, each once. Only durable gear is one-off equipment, and that sits below
 * operating profit. Owner hours are economic, not cash. Hired hours are cash.
 * Business rent is an optional allocation. Household rent is not a model input.
 */

export const PROFIT_GOAL_AUD = 40_000;
export const RENT_WEEKS = 52;
/** Shown so the exclusion is explicit. Never added by evaluate(). */
export const HOUSEHOLD_RENT_WEEKLY_CONTEXT = 450;

export const MONTH_LABELS = [
  "Nov 2026",
  "Dec 2026",
  "Jan 2027",
  "Feb 2027",
  "Mar 2027",
  "Apr 2027",
  "May 2027",
  "Jun 2027",
  "Jul 2027",
  "Aug 2027",
  "Sep 2027",
  "Oct 2027",
] as const;

export type Issue = { field: string; message: string };

export type ScenarioInput = {
  salesTarget: number;
  tubeShare: number;
  tubePriceExGst: number;
  potPriceExGst: number;
  germinationRate: number;
  survivalRate: number;
  sellThroughRate: number;
  variableCostPerSaleableUnit: number;
  purchasedSeedAllowance: number;
  annualOverhead: number;
  oneOffEquipment: number;
  reusableContainers: number;
  growingConsumables: number;
  /** null means quote-needed items are excluded. It does not mean they are free. */
  quoteNeededCash: number | null;
  ownerHoursPerWeek: number;
  ownerHourlyRate: number;
  hiredHoursPerWeek: number;
  hiredHourlyRate: number;
  weeksPerYear: number;
  businessRentPerWeek: number;
  openingCash: number;
  monthlySalesWeights: number[];
  /**
   * Months between spending on growing media and the plant being sold.
   * Growing consumables and the per-plant cost follow sales this many months
   * earlier. Absent on older scenarios, which keep the November lump.
   */
  growLeadMonths?: number;
  /** Registered for GST: collect 10% on sales, claim credits back on BAS. */
  gstRegistered?: boolean;
  /** Share of cash operating profit to put aside for income tax. 0 to 1. */
  taxSetAsideRate?: number;
  /** Optional species, seed and shopping edits. Absent on older saved scenarios. */
  plan?: import("./plan.ts").NurseryPlan;
};

export type BreakEven = {
  status: "solved" | "impossible";
  message: string;
  operatingSalesUnits: number | null;
  cashSalesUnits: number | null;
};

export type MonthCash = {
  label: string;
  /** Growing consumables spent this month. */
  consumables: number;
  gstCollected: number;
  gstCredits: number;
  /** Net BAS paid this month. Negative is a refund. */
  basPayment: number;
  share: number;
  unitsSold: number;
  revenue: number;
  variableCost: number;
  overhead: number;
  hiredLabour: number;
  businessRent: number;
  seed: number;
  inventory: number;
  capex: number;
  netCash: number;
  closingCash: number;
};

export type ModelResult = {
  status: "ok" | "invalid";
  issues: Issue[];
  warnings: Issue[];
  tubeUnitsSold: number | null;
  potUnitsSold: number | null;
  unitsSold: number | null;
  blendedPriceExGst: number | null;
  revenueExGst: number | null;
  productionStatus: "ok" | "impossible";
  productionMessage: string | null;
  saleableRequired: number | null;
  germinatedRequired: number | null;
  startedRequired: number | null;
  variableProductionCost: number | null;
  purchasedSeed: number | null;
  annualOverhead: number | null;
  hiredLabourCash: number | null;
  ownerLabourEconomic: number | null;
  businessRent: number | null;
  contributionAfterVariable: number | null;
  contributionPerSoldUnit: number | null;
  fixedCashOperating: number | null;
  operatingProfitBeforeOwnerLabour: number | null;
  operatingProfitAfterOwnerLabour: number | null;
  oneOffEquipment: number | null;
  reusableContainers: number | null;
  growingConsumables: number | null;
  quoteNeededIncluded: boolean;
  quoteNeededCash: number | null;
  /** Equipment, containers, consumables and seed. Quote-needed cash is not in this figure. */
  cashSetupExcludingQuote: number | null;
  cashMovementAfterCapex: number | null;
  closingCash: number | null;
  breakEven: BreakEven | null;
  profitGoal: number;
  gapToProfitGoalBeforeOwnerLabour: number | null;
  gapToProfitGoalAfterOwnerLabour: number | null;
  salesUnitsForProfitGoal: number | null;
  monthly: MonthCash[] | null;
  growLeadMonths: number | null;
  gstRegistered: boolean;
  /** GST from the October quarter, due after the year ends. */
  gstOwedAtYearEnd: number | null;
  taxSetAsideRate: number;
  taxSetAside: number | null;
  closingCashAfterTax: number | null;
};

function emptyResult(issues: Issue[]): ModelResult {
  return {
    status: "invalid",
    issues,
    warnings: [],
    tubeUnitsSold: null,
    potUnitsSold: null,
    unitsSold: null,
    blendedPriceExGst: null,
    revenueExGst: null,
    productionStatus: "impossible",
    productionMessage: null,
    saleableRequired: null,
    germinatedRequired: null,
    startedRequired: null,
    variableProductionCost: null,
    purchasedSeed: null,
    annualOverhead: null,
    hiredLabourCash: null,
    ownerLabourEconomic: null,
    businessRent: null,
    contributionAfterVariable: null,
    contributionPerSoldUnit: null,
    fixedCashOperating: null,
    operatingProfitBeforeOwnerLabour: null,
    operatingProfitAfterOwnerLabour: null,
    oneOffEquipment: null,
    reusableContainers: null,
    growingConsumables: null,
    quoteNeededIncluded: false,
    quoteNeededCash: null,
    cashSetupExcludingQuote: null,
    cashMovementAfterCapex: null,
    closingCash: null,
    breakEven: null,
    profitGoal: PROFIT_GOAL_AUD,
    gapToProfitGoalBeforeOwnerLabour: null,
    gapToProfitGoalAfterOwnerLabour: null,
    salesUnitsForProfitGoal: null,
    monthly: null,
    growLeadMonths: null,
    gstRegistered: false,
    gstOwedAtYearEnd: null,
    taxSetAsideRate: 0,
    taxSetAside: null,
    closingCashAfterTax: null,
  };
}

function readNumber(
  issues: Issue[],
  field: string,
  label: string,
  value: number,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    issues.push({ field, message: `Enter a number for ${label}.` });
    return;
  }
  if (!Number.isFinite(value)) {
    issues.push({ field, message: `${label} has to be a finite number.` });
    return;
  }
  if (value < min) {
    issues.push({ field, message: `${label} cannot be below ${min}.` });
    return;
  }
  if (value > max) {
    issues.push({ field, message: `${label} cannot be above ${max.toLocaleString("en-AU")}.` });
  }
}

function readRate(issues: Issue[], field: string, label: string, value: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 1 && value <= 100) {
    issues.push({
      field,
      message: `${label} is ${value}. Use a fraction from 0 to 1, so 85% is 0.85.`,
    });
    return;
  }
  readNumber(issues, field, label, value, 0, 1);
}

function validate(input: ScenarioInput): Issue[] {
  const issues: Issue[] = [];
  readNumber(issues, "salesTarget", "Sales target", input.salesTarget, 0, 10_000_000);
  readNumber(issues, "tubeShare", "Tube share", input.tubeShare, 0, 1);
  readNumber(issues, "tubePriceExGst", "Tube price", input.tubePriceExGst, 0, 1_000_000);
  readNumber(issues, "potPriceExGst", "140 mm price", input.potPriceExGst, 0, 1_000_000);
  readRate(issues, "germinationRate", "Germination", input.germinationRate);
  readRate(issues, "survivalRate", "Survival", input.survivalRate);
  readRate(issues, "sellThroughRate", "Sell-through", input.sellThroughRate);
  readNumber(
    issues,
    "variableCostPerSaleableUnit",
    "Cost per saleable plant",
    input.variableCostPerSaleableUnit,
    0,
    1_000_000,
  );
  readNumber(issues, "purchasedSeedAllowance", "Purchased seed", input.purchasedSeedAllowance, 0, 1_000_000_000);
  readNumber(issues, "annualOverhead", "Annual overhead", input.annualOverhead, 0, 1_000_000_000);
  readNumber(issues, "oneOffEquipment", "One-off equipment", input.oneOffEquipment, 0, 1_000_000_000);
  readNumber(issues, "reusableContainers", "Reusable containers", input.reusableContainers, 0, 1_000_000_000);
  readNumber(issues, "growingConsumables", "Growing consumables", input.growingConsumables, 0, 1_000_000_000);
  if (typeof input.quoteNeededCash === "undefined") {
    issues.push({
      field: "quoteNeededCash",
      message: "Quote-needed cash must be a number or empty. Empty means excluded, not free.",
    });
  } else if (input.quoteNeededCash !== null) {
    readNumber(issues, "quoteNeededCash", "Quote-needed cash", input.quoteNeededCash, 0, 1_000_000_000);
  }
  readNumber(issues, "ownerHoursPerWeek", "Owner hours per week", input.ownerHoursPerWeek, 0, 168);
  readNumber(issues, "ownerHourlyRate", "Owner hourly rate", input.ownerHourlyRate, 0, 10_000);
  readNumber(issues, "hiredHoursPerWeek", "Hired hours per week", input.hiredHoursPerWeek, 0, 10_000);
  readNumber(issues, "hiredHourlyRate", "Hired hourly rate", input.hiredHourlyRate, 0, 10_000);
  readNumber(issues, "weeksPerYear", "Weeks per year", input.weeksPerYear, 0, 52);
  readNumber(issues, "businessRentPerWeek", "Business rent allocation", input.businessRentPerWeek, 0, 1_000_000);
  readNumber(issues, "openingCash", "Opening cash", input.openingCash, -1_000_000_000, 1_000_000_000);
  if (input.growLeadMonths != null) {
    readNumber(issues, "growLeadMonths", "Grow lead time", input.growLeadMonths, 0, 11);
    if (Number.isFinite(input.growLeadMonths) && !Number.isInteger(input.growLeadMonths)) {
      issues.push({ field: "growLeadMonths", message: "Grow lead time is a whole number of months." });
    }
  }
  if (input.taxSetAsideRate != null) readRate(issues, "taxSetAsideRate", "Tax set-aside", input.taxSetAsideRate);
  if (!Array.isArray(input.monthlySalesWeights) || input.monthlySalesWeights.length !== 12) {
    issues.push({ field: "monthlySalesWeights", message: "Enter twelve monthly sales weights, November through October." });
  } else {
    input.monthlySalesWeights.forEach((weight, index) => {
      readNumber(issues, `monthlySalesWeights.${index}`, `${MONTH_LABELS[index]} weight`, weight, 0, 1_000_000);
    });
  }
  return issues;
}

function rateBlockMessage(germination: number, survival: number, sellThrough: number): string {
  const blocked: string[] = [];
  if (germination <= 0) blocked.push("germination is 0%");
  if (survival <= 0) blocked.push("survival is 0%");
  if (sellThrough <= 0) blocked.push("sell-through is 0%");
  const why = blocked.length > 0 ? blocked.join(" and ") : "a production rate is 0%";
  return `No finite production quantity can supply a sale because ${why}. Raise that rate above zero, or set the sales target to zero if nothing will be sold.`;
}

function solveBreakEven(
  contributionPerSoldUnit: number | null,
  fixedCash: number,
  recoveryCash: number,
  ratesOk: boolean,
): BreakEven {
  if (!ratesOk || contributionPerSoldUnit == null || !Number.isFinite(contributionPerSoldUnit)) {
    return {
      status: "impossible",
      message:
        "Break-even is not a sales quantity. Germination, survival and sell-through all have to be above 0% before a sale can be supplied.",
      operatingSalesUnits: null,
      cashSalesUnits: null,
    };
  }
  if (contributionPerSoldUnit < 0) {
    return {
      status: "impossible",
      message:
        "Each sale contributes less than $0 after the variable cost of the plants produced to supply it. Selling more widens the cash loss, so there is no break-even volume.",
      operatingSalesUnits: null,
      cashSalesUnits: null,
    };
  }
  if (contributionPerSoldUnit === 0) {
    if (fixedCash === 0 && recoveryCash === 0) {
      return {
        status: "solved",
        message:
          "Price matches the variable cost of supplying one sale, and fixed cash costs and equipment are $0. Cash operating profit is $0 at every sales volume.",
        operatingSalesUnits: 0,
        cashSalesUnits: 0,
      };
    }
    return {
      status: "impossible",
      message:
        "Price matches the variable cost of supplying one sale, so fixed cash costs or equipment are never recovered.",
      operatingSalesUnits: null,
      cashSalesUnits: null,
    };
  }
  const operatingSalesUnits = fixedCash / contributionPerSoldUnit;
  const cashSalesUnits = (fixedCash + recoveryCash) / contributionPerSoldUnit;
  if (!Number.isFinite(operatingSalesUnits) || !Number.isFinite(cashSalesUnits)) {
    return {
      status: "impossible",
      message: "Break-even is not a finite number of sales for these inputs.",
      operatingSalesUnits: null,
      cashSalesUnits: null,
    };
  }
  return {
    status: "solved",
    message:
      "Operating break-even is the sales volume where cash operating profit before owner labour is $0. Cash break-even also recovers equipment and any quote you have explicitly priced. Seed is in the operating costs once and is not in equipment.",
    operatingSalesUnits,
    cashSalesUnits,
  };
}

export const GST_RATE = 0.1;
export const GST_REGISTRATION_TURNOVER = 75_000;

/**
 * Quarterly BAS: the month (0 = Nov 2026) each month's GST is paid in, or null
 * when it falls due after October 2027. Quarters are Oct–Dec (due 28 Feb),
 * Jan–Mar (28 Apr), Apr–Jun (28 Jul) and Jul–Sep (28 Oct).
 */
export const BAS_DUE_MONTH: (number | null)[] = [3, 3, 5, 5, 5, 8, 8, 8, 11, 11, 11, null];

type MonthlyCosts = {
  unitsSold: number;
  revenue: number;
  variable: number;
  consumables: number;
  overhead: number;
  hired: number;
  rent: number;
  seed: number;
  containers: number;
  capex: number;
};

function buildMonths(
  input: ScenarioInput,
  totals: MonthlyCosts,
): { months: MonthCash[] | null; warning: Issue | null; gstOwedAtYearEnd: number } {
  const weights = input.monthlySalesWeights;
  const sum = weights.reduce((total, weight) => total + weight, 0);
  if (!(sum > 0)) {
    return {
      months: null,
      warning: {
        field: "monthlySalesWeights",
        message: "Monthly sales weights are all zero, so there is no illustrative timing. Annual totals are unchanged.",
      },
      gstOwedAtYearEnd: 0,
    };
  }
  const salesShare = weights.map((weight) => weight / sum);
  // Production share: each month's sales pulled back by the lead time. Growing
  // that would have started before November is spent in November.
  const lead = input.growLeadMonths;
  const growShare =
    lead == null
      ? salesShare.map((_, index) => (index === 0 ? 1 : 0))
      : salesShare.map((_, index) => {
          if (index === 0) return salesShare.slice(0, lead + 1).reduce((total, share) => total + share, 0);
          return salesShare[index + lead] ?? 0;
        });
  const registered = input.gstRegistered === true;
  // Costs are shelf cash, which carries GST. Wages and rent do not.
  const credit = (amount: number) => (registered ? amount / 11 : 0);
  const basDue = new Array<number>(12).fill(0);
  let gstOwedAtYearEnd = 0;

  const rows = salesShare.map((share, index) => {
    const revenue = totals.revenue * share;
    const variable = lead == null ? totals.variable * share : totals.variable * growShare[index]!;
    const consumables = totals.consumables * growShare[index]!;
    const overhead = totals.overhead / 12;
    const hired = totals.hired / 12;
    const rent = totals.rent / 12;
    const seed = index === 0 ? totals.seed : 0;
    const containers = index === 0 ? totals.containers : 0;
    const capex = index === 0 ? totals.capex : 0;
    const gstCollected = registered ? revenue * GST_RATE : 0;
    const gstCredits = credit(variable + consumables + overhead + seed + containers + capex);
    const net = gstCollected - gstCredits;
    const due = BAS_DUE_MONTH[index];
    if (due == null) gstOwedAtYearEnd += net;
    else basDue[due]! += net;
    return { share, revenue, variable, consumables, overhead, hired, rent, seed, containers, capex, gstCollected, gstCredits };
  });

  let closing = input.openingCash;
  const months = rows.map((row, index) => {
    const basPayment = basDue[index]!;
    const netCash =
      row.revenue +
      row.gstCollected -
      row.variable -
      row.consumables -
      row.overhead -
      row.hired -
      row.rent -
      row.seed -
      row.containers -
      row.capex -
      basPayment;
    closing += netCash;
    return {
      label: MONTH_LABELS[index],
      share: row.share,
      unitsSold: totals.unitsSold * row.share,
      revenue: row.revenue,
      variableCost: row.variable,
      consumables: row.consumables,
      overhead: row.overhead,
      hiredLabour: row.hired,
      businessRent: row.rent,
      seed: row.seed,
      inventory: row.containers + (lead == null ? row.consumables : 0),
      capex: row.capex,
      gstCollected: row.gstCollected,
      gstCredits: row.gstCredits,
      basPayment,
      netCash,
      closingCash: closing,
    };
  });
  return { months, warning: null, gstOwedAtYearEnd };
}

export function evaluate(input: ScenarioInput): ModelResult {
  const issues = validate(input);
  if (issues.length > 0) return emptyResult(issues);

  const tubeUnitsSold = input.salesTarget * input.tubeShare;
  const potUnitsSold = input.salesTarget - tubeUnitsSold;
  const blendedFromShare = input.tubeShare * input.tubePriceExGst + (1 - input.tubeShare) * input.potPriceExGst;
  const blendedPriceExGst =
    input.salesTarget > 0
      ? (tubeUnitsSold * input.tubePriceExGst + potUnitsSold * input.potPriceExGst) / input.salesTarget
      : blendedFromShare;
  const purchasedSeed = input.purchasedSeedAllowance;
  const annualOverhead = input.annualOverhead;
  const hiredLabourCash = input.hiredHoursPerWeek * input.hiredHourlyRate * input.weeksPerYear;
  const ownerLabourEconomic = input.ownerHoursPerWeek * input.ownerHourlyRate * input.weeksPerYear;
  const businessRent = input.businessRentPerWeek * RENT_WEEKS;
  const oneOffEquipment = input.oneOffEquipment;
  const reusableContainers = input.reusableContainers;
  const growingConsumables = input.growingConsumables;
  const quoteNeededIncluded = input.quoteNeededCash !== null;
  const quoteNeededCash = input.quoteNeededCash ?? 0;
  const fixedCashOperating =
    purchasedSeed + growingConsumables + reusableContainers + annualOverhead + hiredLabourCash + businessRent;
  const cashSetupExcludingQuote = oneOffEquipment + reusableContainers + growingConsumables + purchasedSeed;
  const ratesOk = input.germinationRate > 0 && input.survivalRate > 0 && input.sellThroughRate > 0;
  const warnings: Issue[] = [];

  const base = {
    status: "ok" as const,
    issues: [],
    tubeUnitsSold,
    potUnitsSold,
    unitsSold: input.salesTarget,
    blendedPriceExGst,
    purchasedSeed,
    annualOverhead,
    hiredLabourCash,
    ownerLabourEconomic,
    businessRent,
    oneOffEquipment,
    reusableContainers,
    growingConsumables,
    quoteNeededIncluded,
    quoteNeededCash: quoteNeededIncluded ? input.quoteNeededCash : null,
    cashSetupExcludingQuote,
    fixedCashOperating,
    profitGoal: PROFIT_GOAL_AUD,
  };

  if (input.salesTarget > 0 && !ratesOk) {
    return {
      ...base,
      warnings,
      revenueExGst: null,
      productionStatus: "impossible",
      productionMessage: rateBlockMessage(input.germinationRate, input.survivalRate, input.sellThroughRate),
      saleableRequired: null,
      germinatedRequired: null,
      startedRequired: null,
      variableProductionCost: null,
      contributionAfterVariable: null,
      contributionPerSoldUnit: null,
      operatingProfitBeforeOwnerLabour: null,
      operatingProfitAfterOwnerLabour: null,
      cashMovementAfterCapex: null,
      closingCash: null,
      breakEven: solveBreakEven(null, fixedCashOperating, oneOffEquipment + quoteNeededCash, false),
      gapToProfitGoalBeforeOwnerLabour: null,
      gapToProfitGoalAfterOwnerLabour: null,
      salesUnitsForProfitGoal: null,
      monthly: null,
      growLeadMonths: input.growLeadMonths ?? null,
      gstRegistered: input.gstRegistered === true,
      gstOwedAtYearEnd: null,
      taxSetAsideRate: input.taxSetAsideRate ?? 0,
      taxSetAside: null,
      closingCashAfterTax: null,
    };
  }

  const saleableRequired = input.salesTarget === 0 ? 0 : input.salesTarget / input.sellThroughRate;
  const germinatedRequired = input.salesTarget === 0 ? 0 : saleableRequired / input.survivalRate;
  const startedRequired = input.salesTarget === 0 ? 0 : germinatedRequired / input.germinationRate;
  const revenueExGst = tubeUnitsSold * input.tubePriceExGst + potUnitsSold * input.potPriceExGst;
  const variableProductionCost = input.variableCostPerSaleableUnit * saleableRequired;
  const contributionAfterVariable = revenueExGst - variableProductionCost;
  const contributionPerSoldUnit = ratesOk ? blendedPriceExGst - input.variableCostPerSaleableUnit / input.sellThroughRate : null;
  const operatingProfitBeforeOwnerLabour = revenueExGst - variableProductionCost - fixedCashOperating;
  const operatingProfitAfterOwnerLabour = operatingProfitBeforeOwnerLabour - ownerLabourEconomic;
  const capex = oneOffEquipment + quoteNeededCash;
  const cashMovementAfterCapex = operatingProfitBeforeOwnerLabour - capex;
  const closingCash = input.openingCash + cashMovementAfterCapex;

  if (
    !Number.isFinite(saleableRequired) ||
    !Number.isFinite(germinatedRequired) ||
    !Number.isFinite(startedRequired) ||
    !Number.isFinite(revenueExGst) ||
    !Number.isFinite(operatingProfitBeforeOwnerLabour) ||
    !Number.isFinite(cashMovementAfterCapex)
  ) {
    return emptyResult([
      { field: "salesTarget", message: "These inputs do not produce a finite result. Reduce the sales target or raise a rate that is almost zero." },
    ]);
  }

  const breakEven = solveBreakEven(
    contributionPerSoldUnit,
    fixedCashOperating,
    capex,
    ratesOk,
  );
  const salesUnitsForProfitGoal =
    ratesOk && contributionPerSoldUnit != null && contributionPerSoldUnit > 0
      ? (PROFIT_GOAL_AUD + fixedCashOperating) / contributionPerSoldUnit
      : null;
  const finiteGoalUnits =
    salesUnitsForProfitGoal != null && Number.isFinite(salesUnitsForProfitGoal) ? salesUnitsForProfitGoal : null;

  const timing = buildMonths(input, {
    unitsSold: input.salesTarget,
    revenue: revenueExGst,
    variable: variableProductionCost,
    consumables: growingConsumables,
    overhead: annualOverhead,
    hired: hiredLabourCash,
    rent: businessRent,
    seed: purchasedSeed,
    containers: reusableContainers,
    capex,
  });
  if (timing.warning) warnings.push(timing.warning);
  const gstRegistered = input.gstRegistered === true;
  if (!gstRegistered && revenueExGst >= GST_REGISTRATION_TURNOVER) {
    warnings.push({
      field: "gstRegistered",
      message: `Revenue of ${Math.round(revenueExGst).toLocaleString("en-AU")} dollars is at or above the $75,000 GST turnover threshold. Registration would be required, so tick GST registered.`,
    });
  }
  // With GST, closing cash also carries the GST collected and the credits
  // claimed back. GST still owed for the October quarter is held back too.
  const gstCashEffect = timing.months
    ? timing.months.reduce((total, month) => total + month.gstCollected - month.basPayment, 0) - timing.gstOwedAtYearEnd
    : 0;
  const closingCashWithGst = closingCash + gstCashEffect;
  const taxSetAsideRate = input.taxSetAsideRate ?? 0;
  const taxSetAside = taxSetAsideRate * Math.max(operatingProfitBeforeOwnerLabour, 0);

  return {
    ...base,
    warnings,
    revenueExGst,
    productionStatus: "ok",
    productionMessage: null,
    saleableRequired,
    germinatedRequired,
    startedRequired,
    variableProductionCost,
    contributionAfterVariable,
    contributionPerSoldUnit,
    operatingProfitBeforeOwnerLabour,
    operatingProfitAfterOwnerLabour,
    cashMovementAfterCapex,
    closingCash: closingCashWithGst,
    breakEven,
    gapToProfitGoalBeforeOwnerLabour: PROFIT_GOAL_AUD - operatingProfitBeforeOwnerLabour,
    gapToProfitGoalAfterOwnerLabour: PROFIT_GOAL_AUD - operatingProfitAfterOwnerLabour,
    salesUnitsForProfitGoal: finiteGoalUnits,
    monthly: timing.months,
    growLeadMonths: input.growLeadMonths ?? null,
    gstRegistered,
    gstOwedAtYearEnd: gstRegistered ? timing.gstOwedAtYearEnd : null,
    taxSetAsideRate,
    taxSetAside,
    closingCashAfterTax: closingCashWithGst - taxSetAside,
  };
}

export function issueFor(result: ModelResult, field: string): string | undefined {
  return result.issues.find((issue) => issue.field === field)?.message;
}
