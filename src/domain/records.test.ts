import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import { evaluate } from "./model.ts";
import {
  businessMonthIndex,
  coerceRecords,
  currentMonthIndex,
  dateMonthIndex,
  emptyRecords,
  exGst,
  expectedShare,
  gstPart,
  isISODate,
  planVsActual,
  recordsToCsv,
  summarise,
  type RecordsState,
} from "./records.ts";

function records(patch: Partial<RecordsState> = {}): RecordsState {
  return { ...emptyRecords(), ...patch };
}

const stamp = "2026-11-07T00:00:00.000Z";

describe("GST unwrap", () => {
  it("unwraps inc-GST amounts and leaves ex-GST amounts alone", () => {
    expect(exGst(11, true)).toBeCloseTo(10);
    expect(gstPart(11, true)).toBeCloseTo(1);
    expect(exGst(10, false)).toBe(10);
    expect(gstPart(10, false)).toBe(0);
  });
});

describe("business months", () => {
  it("maps Nov 2026 to month 0 and Oct 2027 to month 11", () => {
    expect(businessMonthIndex(2026, 10)).toBe(0);
    expect(businessMonthIndex(2027, 9)).toBe(11);
    expect(businessMonthIndex(2026, 9)).toBeNull();
    expect(businessMonthIndex(2027, 10)).toBeNull();
    expect(dateMonthIndex("2027-06-15")).toBe(7);
    expect(dateMonthIndex("not a date")).toBeNull();
  });

  it("clamps the current month into the business year", () => {
    expect(currentMonthIndex(new Date("2026-01-01T00:00:00Z"))).toBe(0);
    expect(currentMonthIndex(new Date("2027-02-14T00:00:00Z"))).toBe(3);
    expect(currentMonthIndex(new Date("2028-03-01T00:00:00Z"))).toBe(11);
  });

  it("scales cumulative weights into an expected share", () => {
    expect(expectedShare([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0)).toBeCloseTo(0.5);
    expect(expectedShare([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 11)).toBe(1);
    expect(expectedShare([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 5)).toBe(0);
  });
});

describe("summarise", () => {
  const state = records({
    sales: [
      { id: "a", date: "2026-11-10", channel: "Council", description: "tubes", size: "tube", units: 100, unitPrice: 2.2, includesGst: false, updatedAt: stamp },
      { id: "b", date: "2027-05-01", channel: "Retail", description: "pots", size: "pot140", units: 10, unitPrice: 11, includesGst: true, updatedAt: stamp },
      { id: "c", date: "2025-01-01", channel: "Other", description: "outside the year", size: "other", units: 5, unitPrice: 4, includesGst: false, updatedAt: stamp },
    ],
    expenses: [
      { id: "e1", date: "2026-11-02", category: "seed", description: "seed order", amount: 220, includesGst: true, updatedAt: stamp },
      { id: "e2", date: "2026-12-01", category: "equipment", description: "benches", amount: 300, includesGst: false, updatedAt: stamp },
    ],
    batches: [
      { id: "b1", name: "Batch A", species: "Acacia pycnantha", size: "tube", startedAt: "2026-11-15", started: 400, germinated: 300, saleable: 250, sold: 100, updatedAt: stamp },
      { id: "b2", name: "Batch B", species: "Correa alba", size: "pot140", startedAt: "2027-02-01", started: 100, germinated: 0, saleable: 0, sold: 0, updatedAt: stamp },
    ],
    orders: [
      { id: "o1", buyer: "Landcare", channel: "Landcare", description: "tubes", size: "tube", units: 500, unitPrice: 2, includesGst: false, status: "confirmed", updatedAt: stamp },
      { id: "o2", buyer: "Council", channel: "Council", description: "tubes", size: "tube", units: 200, unitPrice: 0, includesGst: false, status: "enquiry", updatedAt: stamp },
      { id: "o3", buyer: "Old", channel: "Other", description: "gone", size: "tube", units: 50, unitPrice: 2, includesGst: false, status: "cancelled", updatedAt: stamp },
    ],
    labour: [
      { id: "l1", weekStart: "2026-11-02", ownerHours: 18, hiredHours: 4, updatedAt: stamp },
      { id: "l2", weekStart: "2026-11-09", ownerHours: 22, hiredHours: 0, updatedAt: stamp },
    ],
  });

  it("totals units, ex-GST revenue, GST and cash across sales", () => {
    const summary = summarise(state);
    expect(summary.unitsSold).toBe(115);
    expect(summary.tubeUnits).toBe(100);
    expect(summary.potUnits).toBe(10);
    expect(summary.revenueExGst).toBeCloseTo(100 * 2.2 + 10 * 10 + 5 * 4);
    expect(summary.cashReceived).toBeCloseTo(220 + 110 + 20);
    expect(summary.gstCollected).toBeCloseTo(10);
    expect(summary.blendedPriceExGst).toBeCloseTo(summary.revenueExGst / 115);
  });

  it("totals spend, GST paid and per-category amounts", () => {
    const summary = summarise(state);
    expect(summary.spendTotal).toBe(520);
    expect(summary.gstPaid).toBeCloseTo(20);
    expect(summary.spendByCategory.seed).toBe(220);
    expect(summary.spendByCategory.equipment).toBe(300);
    expect(summary.spendByCategory.other).toBe(0);
  });

  it("derives observed rates and stock from batches", () => {
    const summary = summarise(state);
    expect(summary.observedGermination).toBeCloseTo(300 / 500);
    expect(summary.observedSurvival).toBeCloseTo(250 / 300);
    expect(summary.observedSellThrough).toBeCloseTo(100 / 250);
    expect(summary.stockOnHand).toBe(150);
    expect(summary.tubeStock).toBe(150);
    expect(summary.potStock).toBe(0);
  });

  it("counts confirmed orders as committed and ignores cancelled", () => {
    const summary = summarise(state);
    expect(summary.committedUnits).toBe(500);
    expect(summary.enquiryUnits).toBe(200);
  });

  it("buckets monthly actuals and skips sales outside the year", () => {
    const summary = summarise(state);
    expect(summary.monthly[0]?.units).toBe(100);
    expect(summary.monthly[6]?.units).toBe(10);
    expect(summary.monthly.reduce((sum, month) => sum + month.units, 0)).toBe(110);
    expect(summary.monthly[0]?.spend).toBe(220);
    expect(summary.monthly[1]?.spend).toBe(300);
  });

  it("sums labour weeks", () => {
    const summary = summarise(state);
    expect(summary.ownerHours).toBe(40);
    expect(summary.hiredHours).toBe(4);
  });

  it("returns null rates with no batches", () => {
    const summary = summarise(records());
    expect(summary.observedGermination).toBeNull();
    expect(summary.observedSurvival).toBeNull();
    expect(summary.observedSellThrough).toBeNull();
    expect(summary.blendedPriceExGst).toBeNull();
  });
});

describe("plan vs actual", () => {
  it("projects expected-to-date from the sales weights", () => {
    const inputs = { ...createDefaultInputs(), salesTarget: 1200, monthlySalesWeights: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const result = evaluate(inputs);
    const state = records({
      sales: [{ id: "a", date: "2026-11-10", channel: "Other", description: "", size: "tube", units: 60, unitPrice: 1, includesGst: false, updatedAt: stamp }],
    });
    const summary = summarise(state);
    const pva = planVsActual(summary, inputs, result, new Date("2026-11-20T00:00:00Z"));
    expect(pva.monthIndex).toBe(0);
    expect(pva.share).toBe(1);
    expect(pva.expectedUnits).toBe(1200);
    expect(pva.breakEvenProgress).not.toBeNull();
    expect(pva.cashPosition).toBe(inputs.openingCash + 60);
  });
});

describe("coercion and CSV", () => {
  it("drops malformed rows and keeps the good ones", () => {
    const state = coerceRecords({
      sales: [
        { id: "ok", date: "2026-11-10", channel: "Retail", size: "pot140", units: 4, unitPrice: 9, includesGst: true, updatedAt: stamp },
        { id: "bad-date", date: "yesterday", units: 4 },
        { missing: "id" },
        "not an object",
      ],
      checklist: { "compliance:0": stamp, "compliance:1": 42 },
      purchases: { "full:tubes": { paid: 900, at: stamp }, "full:weed": "nope" },
    });
    expect(state.sales).toHaveLength(1);
    expect(state.sales[0]?.size).toBe("pot140");
    expect(state.checklist["compliance:0"]).toBe(stamp);
    expect(state.checklist["compliance:1"]).toBeUndefined();
    expect(state.purchases["full:tubes"]?.paid).toBe(900);
    expect(state.purchases["full:weed"]).toBeUndefined();
  });

  it("coerces an empty or foreign payload into an empty ledger", () => {
    expect(coerceRecords(null).sales).toEqual([]);
    expect(coerceRecords({ other: 1 }).batches).toEqual([]);
  });

  it("emits CSV sections for each ledger", () => {
    const csv = recordsToCsv(
      records({
        sales: [{ id: "a", date: "2026-11-10", channel: "Retail", description: "sale, with comma", size: "pot140", units: 2, unitPrice: 11, includesGst: true, updatedAt: stamp }],
        expenses: [{ id: "e", date: "2026-11-02", category: "seed", description: "seed", amount: 110, includesGst: true, updatedAt: stamp }],
      }),
    );
    expect(csv).toContain("sales");
    expect(csv).toContain("expenses");
    expect(csv).toContain('"sale, with comma"');
    expect(csv).toContain("10.00");
    expect(csv).toContain("100.00");
  });

  it("accepts ISO dates and rejects loose text", () => {
    expect(isISODate("2026-11-07")).toBe(true);
    expect(isISODate("7 Nov 2026")).toBe(false);
    expect(isISODate("2026-13-99")).toBe(false);
  });
});
