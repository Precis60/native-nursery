import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import { evaluate } from "./model.ts";
import { buildRangeReport, DRIVERS, stressed } from "./sensitivity.ts";

describe("range report", () => {
  const inputs = createDefaultInputs();
  const report = buildRangeReport(inputs);

  it("keeps the base case equal to the planner result", () => {
    const base = report.cases.find((row) => row.id === "base")!;
    expect(base.cashProfit).toBeCloseTo(evaluate(inputs).operatingProfitBeforeOwnerLabour!);
  });

  it("orders the cases cautious < base < strong on cash profit", () => {
    const [cautious, base, strong] = report.cases;
    expect(cautious!.cashProfit!).toBeLessThan(base!.cashProfit!);
    expect(strong!.cashProfit!).toBeGreaterThan(base!.cashProfit!);
    expect(cautious!.starts!).toBeGreaterThan(strong!.starts!);
  });

  it("stresses a copy and leaves the scenario alone", () => {
    const before = JSON.stringify(inputs);
    stressed(inputs, "cautious");
    expect(JSON.stringify(inputs)).toBe(before);
  });

  it("sorts the drivers by how far they move profit", () => {
    expect(report.bars).toHaveLength(DRIVERS.length);
    for (let index = 1; index < report.bars.length; index += 1) {
      expect(Math.abs(report.bars[index - 1]!.spread)).toBeGreaterThanOrEqual(Math.abs(report.bars[index]!.spread));
    }
    // Volume carries the default plan.
    expect(report.bars[0]!.id).toBe("volume");
  });

  it("treats every bar's strong side as at least as good as its cautious side", () => {
    for (const bar of report.bars) expect(bar.strong).toBeGreaterThanOrEqual(bar.cautious);
  });

  it("puts germination and survival on starts, not cash", () => {
    const germination = report.production.find((row) => row.id === "germination")!;
    expect(germination.cautiousStarts!).toBeGreaterThan(evaluate(inputs).startedRequired!);
    expect(germination.strongStarts!).toBeLessThan(evaluate(inputs).startedRequired!);
  });

  it("finds the lowest cash month", () => {
    const base = report.cases[1]!;
    const lows = base.result.monthly!.map((month) => month.closingCash);
    expect(base.lowestCash).toBeCloseTo(Math.min(...lows));
    expect(base.lowestCashMonth).not.toBeNull();
  });

  it("returns an invalid report rather than ranges for broken inputs", () => {
    const broken = buildRangeReport({ ...inputs, salesTarget: Number.NaN });
    expect(broken.status).toBe("invalid");
    expect(broken.bars).toHaveLength(0);
  });

  it("never pushes a rate to zero or a price below zero", () => {
    const low = stressed({ ...inputs, germinationRate: 0.06, tubePriceExGst: 0 }, "cautious");
    expect(low.germinationRate).toBeGreaterThan(0);
    expect(low.tubePriceExGst).toBe(0);
    expect(evaluate(low).status).toBe("ok");
  });
});
