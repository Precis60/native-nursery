import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import { evaluate } from "./model.ts";
import { buildReforecast, MIN_OBSERVED_SAMPLE } from "./reforecast.ts";
import { emptyRecords, summarise, type RecordsState } from "./records.ts";

const stamp = "2026-11-07T00:00:00.000Z";
const inputs = createDefaultInputs();
const result = evaluate(inputs);

function records(patch: Partial<RecordsState> = {}): RecordsState {
  return { ...emptyRecords(), ...patch };
}

function sale(date: string, units: number, unitPrice: number) {
  return { id: `${date}-${units}`, date, channel: "Retail", description: "Tubes", size: "tube" as const, units, unitPrice, includesGst: false, updatedAt: stamp };
}

describe("rolling reforecast", () => {
  it("matches the plan before anything has happened", () => {
    const forecast = buildReforecast(inputs, result, summarise(records()), new Date(2026, 9, 20));
    expect(forecast.status).toBe("ok");
    expect(forecast.onPlan!.yearEndRevenue).toBeCloseTo(result.revenueExGst!);
    expect(forecast.onPlan!.yearEndUnits).toBeCloseTo(inputs.salesTarget);
    expect(forecast.onPlan!.yearEndCashProfit).toBeCloseTo(result.operatingProfitBeforeOwnerLabour!, 0);
    expect(forecast.onPlan!.yearEndClosingCash).toBeCloseTo(result.closingCash!, 0);
    expect(forecast.pace).toBeNull();
  });

  it("swaps closed months for actuals and keeps the plan for the rest", () => {
    // 1 Feb 2027 is month 3. Months 0–2 are closed and month 3 is open.
    const state = records({ sales: [sale("2026-12-10", 100, 2), sale("2027-01-15", 50, 2)] });
    const forecast = buildReforecast(inputs, result, summarise(state), new Date(2027, 1, 1));
    const weights = inputs.monthlySalesWeights;
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const laterShare = weights.slice(3).reduce((sum, weight) => sum + weight, 0) / total;
    expect(forecast.monthIndex).toBe(3);
    expect(forecast.actualRevenue).toBe(300);
    expect(forecast.onPlan!.yearEndRevenue).toBeCloseTo(300 + result.revenueExGst! * laterShare);
  });

  it("scales the rest of the year by pace once enough of the plan has passed", () => {
    // By end of March (month 4) the first five weights were expected. Sell exactly half of it.
    const weights = inputs.monthlySalesWeights;
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const expected = (result.revenueExGst! * weights.slice(0, 5).reduce((sum, weight) => sum + weight, 0)) / total;
    const state = records({ sales: [sale("2027-03-31", 1, expected / 2)] });
    const forecast = buildReforecast(inputs, result, summarise(state), new Date(2027, 2, 31));
    expect(forecast.pace).toBeCloseTo(0.5);
    expect(forecast.atPace!.revenueRemaining).toBeCloseTo(forecast.onPlan!.revenueRemaining * 0.5);
    expect(forecast.atPace!.yearEndCashProfit).toBeLessThan(forecast.onPlan!.yearEndCashProfit);
  });

  it("does not double count a setup budget that has been spent", () => {
    const seedPaid = inputs.purchasedSeedAllowance;
    const state = records({
      expenses: [{ id: "s", date: "2026-11-02", category: "seed", description: "Seed", amount: seedPaid, includesGst: false, updatedAt: stamp }],
    });
    const before = buildReforecast(inputs, result, summarise(records()), new Date(2026, 10, 1));
    const after = buildReforecast(inputs, result, summarise(state), new Date(2026, 10, 1));
    expect(after.onPlan!.costsRemaining).toBeCloseTo(before.onPlan!.costsRemaining - seedPaid);
    expect(after.onPlan!.yearEndCashProfit).toBeCloseTo(before.onPlan!.yearEndCashProfit);
  });

  it("uses observed rates only once a batch sample is big enough", () => {
    const small = records({
      batches: [{ id: "b", name: "B", species: "x", size: "tube", startedAt: "2026-11-01", started: 50, germinated: 25, saleable: 20, sold: 0, updatedAt: stamp }],
    });
    const big = records({
      batches: [{ id: "b", name: "B", species: "x", size: "tube", startedAt: "2026-11-01", started: MIN_OBSERVED_SAMPLE * 4, germinated: MIN_OBSERVED_SAMPLE * 2, saleable: 150, sold: 0, updatedAt: stamp }],
    });
    const now = new Date(2026, 10, 15);
    const fromSmall = buildReforecast(inputs, result, summarise(small), now);
    const fromBig = buildReforecast(inputs, result, summarise(big), now);
    expect(fromSmall.rates[0]!.source).toBe("plan");
    expect(fromBig.rates[0]!.source).toBe("observed");
    expect(fromBig.rates[0]!.used).toBeCloseTo(0.5);
    // Survival and sell-through on young batches are not used, however big the sample.
    expect(fromBig.rates[1]!.source).toBe("plan");
    expect(fromBig.rates[2]!.source).toBe("plan");
    // Half the germination of the plan's 80% means more starts, even after the stock on hand.
    expect(fromBig.onPlan!.startsStillNeeded!).toBeGreaterThan(fromSmall.onPlan!.startsStillNeeded!);
  });

  it("reports an invalid forecast for a broken scenario", () => {
    const broken = evaluate({ ...inputs, salesTarget: Number.NaN });
    const forecast = buildReforecast(inputs, broken, summarise(records()), new Date(2027, 1, 1));
    expect(forecast.status).toBe("invalid");
    expect(forecast.onPlan).toBeNull();
  });

  it("builds a cumulative line that ends at the year-end forecast", () => {
    const state = records({ sales: [sale("2026-12-10", 100, 2)] });
    const forecast = buildReforecast(inputs, result, summarise(state), new Date(2027, 1, 1));
    expect(forecast.monthly).toHaveLength(12);
    expect(forecast.monthly[11]!.onPlan).toBeCloseTo(forecast.onPlan!.yearEndRevenue, -1);
    expect(forecast.monthly[5]!.actual).toBeNull();
  });
});
