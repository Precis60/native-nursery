import { TUBE_PRICE_DEFAULT } from "./defaults.ts";
import { MONTH_LABELS, type ScenarioInput } from "./model.ts";
import { SALE_CHANNELS } from "./records.ts";
import { OWNED_140MM_POTS, POT_PLAN, SEED_REFERENCE, SPECIES, TUBE_PLAN, type Species } from "./species.ts";

export const SUGGESTION_CHECKED = "5 Nov 2026";
export const TUBE_PRICE_BASIS =
  "Illustrative midpoint of the prior planning range $1.80–$2.50 ex GST. Not a species listing and not a current quote.";
export const RATE_BASIS =
  "Illustrative planning rates: germination 80% because the notes did not publish one rate, survival 87.5% as the middle of “grow 10–15% extra”, sell-through 85% from the written plan. Not measured results.";

export type PriceChoice =
  | { kind: "suggestion" }
  | { kind: "missing" }
  | { kind: "override"; amount: number };

export type LineEdit = {
  tubeSold: number | null;
  potSold: number | null;
  tubePrice: PriceChoice;
  potPrice: PriceChoice;
  germination: number | null;
  survival: number | null;
  sellThrough: number | null;
  channel: string | null;
  saleMonth: number | null;
};

export type SeedEdit = {
  packs: number | null;
  /** null uses the listed pack price. "missing" keeps the line out of the cash total. */
  unitPrice: number | null | "missing";
};

export type NurseryPlan = {
  lines: Record<string, LineEdit>;
  seeds: Record<string, SeedEdit>;
  shopEdits: Record<string, string>;
  /** Optional hours typed over the calendar range. Not wages and not added to cash costs. */
  calendarHours: (number | null)[] | null;
};

export type PlanIssue = { field: string; message: string };

export type ForecastLine = {
  id: string;
  botanical: string;
  common: string;
  tubeSold: number;
  potSold: number;
  sold: number;
  tubePrice: number | null;
  potPrice: number | null;
  tubePriced: boolean;
  potPriced: boolean;
  revenueExGst: number;
  unpricedUnits: number;
  germination: number;
  survival: number;
  sellThrough: number;
  starts: number | null;
  productionNote: string | null;
  channel: string;
  saleMonth: number | null;
  saleWindow: string | null;
  tubePriceNote: string;
  potPriceNote: string;
  quantityNote: string;
};

export type SeedForecast = {
  id: string;
  species: string;
  suggestion: string;
  priceNote: string;
  href: string;
  gst: string;
  packs: number | null;
  unitPrice: number | null;
  cash: number | null;
  missing: boolean;
};

export type Forecast = {
  issues: PlanIssue[];
  lines: ForecastLine[];
  seeds: SeedForecast[];
  sold: number;
  tubeSold: number;
  potSold: number;
  pricedUnits: number;
  unpricedUnits: number;
  revenueExGst: number;
  starts: number | null;
  seedCash: number;
  seedMissing: string[];
  ownedPots: number;
  byChannel: { channel: string; units: number; revenueExGst: number }[];
  byMonth: { label: string; units: number; revenueExGst: number }[];
  blendedPrice: number | null;
  margin: number | null;
  markup: number | null;
  marginNote: string;
};

const emptyLine = (): LineEdit => ({
  tubeSold: null,
  potSold: null,
  tubePrice: { kind: "suggestion" },
  potPrice: { kind: "suggestion" },
  germination: null,
  survival: null,
  sellThrough: null,
  channel: null,
  saleMonth: null,
});

export function emptyPlan(): NurseryPlan {
  return { lines: {}, seeds: {}, shopEdits: {}, calendarHours: null };
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function allocationCount(rows: { name: string; count: number }[], botanical: string): number {
  const plant = norm(botanical);
  const row = rows.find((item) => {
    const name = norm(item.name);
    return plant.startsWith(name) || name.startsWith(plant);
  });
  return row?.count ?? 0;
}

export function tubeSuggestion(botanical: string): number {
  return allocationCount(TUBE_PLAN, botanical);
}

export function potSuggestion(botanical: string): number {
  return allocationCount(POT_PLAN, botanical);
}

export function saleWindow(botanical: string): string | null {
  const plant = norm(botanical);
  const row = [...POT_PLAN, ...TUBE_PLAN].find((item) => {
    const name = norm(item.name);
    return plant.startsWith(name) || name.startsWith(plant);
  });
  if (!row) return null;
  const match = /sale\s+([A-Za-z]{3}(?:–[A-Za-z]{3})?(?:\+)?)/.exec(row.start);
  return match?.[1] ?? null;
}

export function suggestedPotPrice(species: Species): { amount: number | null; note: string } {
  if (/no price|no 140mm/i.test(species.wholesale) || !(species.wholesaleMin > 0)) {
    return {
      amount: null,
      note: "No 140 mm price in the HortOS notes checked 5 Nov 2026. Left out of revenue. Not entered as $0.",
    };
  }
  return {
    amount: species.wholesaleMin,
    note: `Low end of the noted range (${species.wholesale}), HortOS checked 5 Nov 2026. Not a new quote.`,
  };
}

/** A single explicit pack price from the November 2026 notes. Ranges and per-gram rates are not turned into a pack total. */
export function suggestedPackPrice(price: string): number | null {
  if (/from\s+\$/i.test(price) || /–/.test(price) || /vary/i.test(price)) return null;
  const match = /\$(\d+(?:\.\d+)?)/.exec(price);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function finite(value: number | null, fallback: number): number {
  return value == null ? fallback : value;
}

function priceAmount(choice: PriceChoice, suggestion: number | null, illustrative: number | null): number | null {
  if (choice.kind === "missing") return null;
  if (choice.kind === "override") return choice.amount;
  return suggestion ?? illustrative;
}

export function lineEdit(plan: NurseryPlan | undefined, id: string): LineEdit {
  return plan?.lines[id] ?? emptyLine();
}

export function buildForecast(inputs: ScenarioInput): Forecast {
  const plan = inputs.plan ?? emptyPlan();
  const issues: PlanIssue[] = [];
  const lines: ForecastLine[] = [];
  let tubeSold = 0;
  let potSold = 0;
  let revenueExGst = 0;
  let unpricedUnits = 0;
  let pricedUnits = 0;
  let starts: number | null = 0;
  const channelMap = new Map<string, { units: number; revenueExGst: number }>();
  const monthUnits = MONTH_LABELS.map(() => 0);
  const monthRevenue = MONTH_LABELS.map(() => 0);
  const weightSum = inputs.monthlySalesWeights.reduce((sum, weight) => sum + (Number.isFinite(weight) ? weight : 0), 0);

  for (const species of SPECIES) {
    const edit = lineEdit(plan, species.botanical);
    const tubeRaw = finite(edit.tubeSold, tubeSuggestion(species.botanical));
    const potRaw = finite(edit.potSold, potSuggestion(species.botanical));
    if (!Number.isFinite(tubeRaw) || !Number.isFinite(potRaw) || tubeRaw < 0 || potRaw < 0) {
      issues.push({ field: species.botanical, message: `${species.common} quantities need to be zero or more.` });
    }
    const tubes = Number.isFinite(tubeRaw) ? Math.max(tubeRaw, 0) : 0;
    const pots = Number.isFinite(potRaw) ? Math.max(potRaw, 0) : 0;
    const germination = finite(edit.germination, inputs.germinationRate);
    const survival = finite(edit.survival, inputs.survivalRate);
    const sellThrough = finite(edit.sellThrough, inputs.sellThroughRate);
    const potSuggestionPrice = suggestedPotPrice(species);
    const tubePrice = priceAmount(edit.tubePrice, null, TUBE_PRICE_DEFAULT);
    const potPrice = priceAmount(edit.potPrice, potSuggestionPrice.amount, null);
    for (const [label, rate] of [
      ["Germination", germination],
      ["Survival", survival],
      ["Sell-through", sellThrough],
    ] as const) {
      if (!(rate > 0 && rate <= 1)) {
        issues.push({ field: species.botanical, message: `${species.common} ${label.toLowerCase()} must be above 0 and at most 1.` });
      }
    }
    if (edit.tubePrice.kind === "override" && !(edit.tubePrice.amount >= 0)) {
      issues.push({ field: species.botanical, message: `${species.common} tube price cannot be negative.` });
    }
    if (edit.potPrice.kind === "override" && !(edit.potPrice.amount >= 0)) {
      issues.push({ field: species.botanical, message: `${species.common} pot price cannot be negative.` });
    }
    const sold = Math.max(tubes, 0) + Math.max(pots, 0);
    const tubeRevenue = tubePrice == null ? 0 : Math.max(tubes, 0) * tubePrice;
    const potRevenue = potPrice == null ? 0 : Math.max(pots, 0) * potPrice;
    const lineUnpriced = (tubePrice == null ? Math.max(tubes, 0) : 0) + (potPrice == null ? Math.max(pots, 0) : 0);
    const lineRevenue = tubeRevenue + potRevenue;
    const linePriced = sold - lineUnpriced;
    let lineStarts: number | null = null;
    let productionNote: string | null = null;
    if (sold > 0 && !(germination > 0 && survival > 0 && sellThrough > 0)) {
      productionNote = "No finite starts while a rate is 0.";
      starts = null;
    } else if (starts != null) {
      lineStarts = sold === 0 ? 0 : sold / sellThrough / survival / germination;
      starts += lineStarts;
    }
    const channel = edit.channel && (SALE_CHANNELS as readonly string[]).includes(edit.channel) ? edit.channel : "Unassigned";
    const bucket = channelMap.get(channel) ?? { units: 0, revenueExGst: 0 };
    bucket.units += linePriced;
    bucket.revenueExGst += lineRevenue;
    channelMap.set(channel, bucket);
    const month = edit.saleMonth;
    if (month != null && month >= 0 && month < 12 && weightSum >= 0) {
      monthUnits[month] += linePriced;
      monthRevenue[month] += lineRevenue;
    } else if (weightSum > 0) {
      inputs.monthlySalesWeights.forEach((weight, index) => {
        const share = weight / weightSum;
        monthUnits[index] += linePriced * share;
        monthRevenue[index] += lineRevenue * share;
      });
    }
    tubeSold += Math.max(tubes, 0);
    potSold += Math.max(pots, 0);
    revenueExGst += lineRevenue;
    unpricedUnits += lineUnpriced;
    pricedUnits += linePriced;
    lines.push({
      id: species.botanical,
      botanical: species.botanical,
      common: species.common,
      tubeSold: Math.max(tubes, 0),
      potSold: Math.max(pots, 0),
      sold,
      tubePrice,
      potPrice,
      tubePriced: tubePrice != null,
      potPriced: potPrice != null,
      revenueExGst: lineRevenue,
      unpricedUnits: lineUnpriced,
      germination,
      survival,
      sellThrough,
      starts: lineStarts,
      productionNote,
      channel,
      saleMonth: month != null && month >= 0 && month < 12 ? month : null,
      saleWindow: saleWindow(species.botanical),
      tubePriceNote: edit.tubePrice.kind === "override" ? "Your override, ex GST." : edit.tubePrice.kind === "missing" ? "Marked missing. Not $0." : TUBE_PRICE_BASIS,
      potPriceNote: edit.potPrice.kind === "override" ? "Your override, ex GST." : potSuggestionPrice.note,
      quantityNote: "Blank quantities use the year-1 plan counts from the November 2026 notes. Zero means none in that plan.",
    });
  }

  const seeds: SeedForecast[] = SEED_REFERENCE.map((row) => {
    const edit = plan.seeds[row.species];
    const listed = suggestedPackPrice(row.price);
    const missing = edit?.unitPrice === "missing" || (edit?.unitPrice == null && listed == null);
    const unitPrice = edit?.unitPrice === "missing" ? null : edit?.unitPrice == null ? listed : edit.unitPrice;
    const packs = edit?.packs == null ? (listed == null ? null : 1) : edit.packs;
    if (packs != null && packs < 0) issues.push({ field: row.species, message: `${row.species} pack count cannot be negative.` });
    if (typeof unitPrice === "number" && unitPrice < 0) issues.push({ field: row.species, message: `${row.species} pack price cannot be negative.` });
    const cash = missing || unitPrice == null || packs == null ? null : Math.max(packs, 0) * unitPrice;
    return {
      id: row.species,
      species: row.species,
      suggestion: `${row.buy}. Noted price: ${row.price}.`,
      priceNote: listed == null ? "No single pack price in the notes. Not entered as $0." : `Pack price from the November 2026 notes (${row.gst}).`,
      href: row.href,
      gst: row.gst,
      packs: packs == null ? null : Math.max(packs, 0),
      unitPrice,
      cash,
      missing: cash == null,
    };
  });
  const seedCash = seeds.reduce((sum, row) => sum + (row.cash ?? 0), 0);
  const seedMissing = seeds.filter((row) => row.missing).map((row) => row.species);
  const blendedPrice = pricedUnits > 0 ? revenueExGst / pricedUnits : null;
  const variablePerSold =
    inputs.sellThroughRate > 0 ? inputs.variableCostPerSaleableUnit / inputs.sellThroughRate : null;
  const contribution = blendedPrice != null && variablePerSold != null ? blendedPrice - variablePerSold : null;
  const margin = contribution != null && blendedPrice != null && blendedPrice > 0 ? contribution / blendedPrice : null;
  const markup = contribution != null && variablePerSold != null && variablePerSold > 0 ? contribution / variablePerSold : null;

  return {
    issues,
    lines,
    seeds,
    sold: tubeSold + potSold,
    tubeSold,
    potSold,
    pricedUnits,
    unpricedUnits,
    revenueExGst,
    starts,
    seedCash,
    seedMissing,
    ownedPots: OWNED_140MM_POTS,
    byChannel: [...channelMap.entries()].map(([channel, row]) => ({ channel, ...row })),
    byMonth: MONTH_LABELS.map((label, index) => ({ label, units: monthUnits[index] ?? 0, revenueExGst: monthRevenue[index] ?? 0 })),
    blendedPrice,
    margin,
    markup,
    marginNote:
      "Margin is contribution divided by the priced selling price. Markup is contribution divided by the illustrative per-plant cost of supplying one sale. Seed, media, pots and equipment are not inside that per-plant cost.",
  };
}

export function applyForecast(inputs: ScenarioInput, plan: NurseryPlan): ScenarioInput {
  const next = { ...inputs, plan };
  const forecast = buildForecast(next);
  const pricedTubes = forecast.lines.reduce((sum, line) => sum + (line.tubePrice == null ? 0 : line.tubeSold), 0);
  const pricedPots = forecast.lines.reduce((sum, line) => sum + (line.potPrice == null ? 0 : line.potSold), 0);
  const tubeRevenue = forecast.lines.reduce((sum, line) => sum + (line.tubePrice == null ? 0 : line.tubeSold * line.tubePrice), 0);
  const potRevenue = forecast.lines.reduce((sum, line) => sum + (line.potPrice == null ? 0 : line.potSold * line.potPrice), 0);
  const salesTarget = pricedTubes + pricedPots;
  let germination = 0;
  let survival = 0;
  let sellThrough = 0;
  let weight = 0;
  for (const line of forecast.lines) {
    if (line.sold <= 0) continue;
    germination += line.germination * line.sold;
    survival += line.survival * line.sold;
    sellThrough += line.sellThrough * line.sold;
    weight += line.sold;
  }
  return {
    ...next,
    salesTarget,
    tubeShare: salesTarget > 0 ? pricedTubes / salesTarget : inputs.tubeShare,
    tubePriceExGst: pricedTubes > 0 ? tubeRevenue / pricedTubes : inputs.tubePriceExGst,
    potPriceExGst: pricedPots > 0 ? potRevenue / pricedPots : inputs.potPriceExGst,
    germinationRate: weight > 0 ? germination / weight : inputs.germinationRate,
    survivalRate: weight > 0 ? survival / weight : inputs.survivalRate,
    sellThroughRate: weight > 0 ? sellThrough / weight : inputs.sellThroughRate,
    purchasedSeedAllowance: forecast.seedCash,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function priceChoice(value: unknown): PriceChoice | null {
  if (!isRecord(value) || typeof value.kind !== "string") return null;
  if (value.kind === "suggestion" || value.kind === "missing") return { kind: value.kind };
  if (value.kind === "override" && typeof value.amount === "number") return { kind: "override", amount: value.amount };
  return null;
}

export function coercePlan(value: unknown): NurseryPlan | null {
  if (!isRecord(value)) return null;
  const lines: Record<string, LineEdit> = {};
  if (value.lines != null) {
    if (!isRecord(value.lines)) return null;
    for (const [id, raw] of Object.entries(value.lines)) {
      if (!isRecord(raw)) return null;
      const tubePrice = priceChoice(raw.tubePrice);
      const potPrice = priceChoice(raw.potPrice);
      if (!tubePrice || !potPrice) return null;
      const numOrNull = (field: unknown) => (field == null ? null : typeof field === "number" ? field : Number.NaN);
      const tubeSold = numOrNull(raw.tubeSold);
      const potSold = numOrNull(raw.potSold);
      const germination = numOrNull(raw.germination);
      const survival = numOrNull(raw.survival);
      const sellThrough = numOrNull(raw.sellThrough);
      if ([tubeSold, potSold, germination, survival, sellThrough].some((item) => item != null && !Number.isFinite(item))) return null;
      const saleMonth = raw.saleMonth == null ? null : typeof raw.saleMonth === "number" ? raw.saleMonth : Number.NaN;
      if (saleMonth != null && !Number.isFinite(saleMonth)) return null;
      lines[id] = {
        tubeSold,
        potSold,
        tubePrice,
        potPrice,
        germination,
        survival,
        sellThrough,
        channel: typeof raw.channel === "string" ? raw.channel : null,
        saleMonth,
      };
    }
  }
  const seeds: Record<string, SeedEdit> = {};
  if (value.seeds != null) {
    if (!isRecord(value.seeds)) return null;
    for (const [id, raw] of Object.entries(value.seeds)) {
      if (!isRecord(raw)) return null;
      const packs = raw.packs == null ? null : typeof raw.packs === "number" ? raw.packs : Number.NaN;
      if (packs != null && !Number.isFinite(packs)) return null;
      const unitPrice = raw.unitPrice === "missing" || raw.unitPrice == null || typeof raw.unitPrice === "number" ? raw.unitPrice ?? null : null;
      if (unitPrice !== "missing" && unitPrice != null && !Number.isFinite(unitPrice)) return null;
      seeds[id] = { packs, unitPrice: unitPrice === undefined ? null : unitPrice };
    }
  }
  const shopEdits: Record<string, string> = {};
  if (value.shopEdits != null) {
    if (!isRecord(value.shopEdits)) return null;
    for (const [id, raw] of Object.entries(value.shopEdits)) {
      if (typeof raw !== "string") return null;
      shopEdits[id] = raw;
    }
  }
  let calendarHours: (number | null)[] | null = null;
  if (value.calendarHours != null) {
    if (!Array.isArray(value.calendarHours) || value.calendarHours.length !== 12) return null;
    calendarHours = value.calendarHours.map((item) => (item == null ? null : typeof item === "number" ? item : Number.NaN));
    if (calendarHours.some((item) => item != null && !Number.isFinite(item))) return null;
  }
  return { lines, seeds, shopEdits, calendarHours };
}
