import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import { applyForecast, buildForecast, coercePlan, emptyPlan, suggestedPackPrice, suggestedPotPrice } from "./plan.ts";
import { evaluate } from "./model.ts";
import { SPECIES } from "./species.ts";

describe("suggestions stay dated and missing prices stay out", () => {
  it("does not turn a missing wholesale note into zero", () => {
    const missing = SPECIES.find((row) => row.botanical === "Allocasuarina verticillata");
    const listed = SPECIES.find((row) => row.botanical === "Acacia pycnantha");
    expect(suggestedPotPrice(missing!).amount).toBeNull();
    expect(suggestedPotPrice(missing!).note.toLowerCase()).toContain("not entered as $0");
    expect(suggestedPotPrice(listed!).amount).toBe(6.5);
  });

  it("reads a single pack price and refuses ranges and per-gram rates", () => {
    expect(suggestedPackPrice("$26.00 / 25 g")).toBe(26);
    expect(suggestedPackPrice("From $1.32/g (10–249 g)")).toBeNull();
    expect(suggestedPackPrice("~$4.50–$10.50 / pkt or per g")).toBeNull();
    expect(suggestedPackPrice("Line prices vary — inside the allowance")).toBeNull();
  });
});

describe("species forecast", () => {
  it("counts plants sold separately from starts and omits unpriced pots from revenue", () => {
    const inputs = createDefaultInputs();
    const plan = emptyPlan();
    plan.lines["Acacia pycnantha"] = {
      tubeSold: 10,
      potSold: 4,
      tubePrice: { kind: "override", amount: 2 },
      potPrice: { kind: "missing" },
      germination: 0.5,
      survival: 0.5,
      sellThrough: 0.5,
      channel: "Landcare",
      saleMonth: 0,
    };
    const forecast = buildForecast({ ...inputs, plan });
    const line = forecast.lines.find((row) => row.id === "Acacia pycnantha");
    expect(line?.sold).toBe(14);
    expect(line?.unpricedUnits).toBe(4);
    expect(line?.revenueExGst).toBe(20);
    expect(line?.starts).toBeCloseTo(14 / 0.5 / 0.5 / 0.5, 6);
    expect(line?.starts).not.toBe(line?.sold);
    expect(forecast.byChannel.find((row) => row.channel === "Landcare")?.revenueExGst).toBeGreaterThan(0);
    expect(forecast.byMonth[0]?.revenueExGst).toBeGreaterThanOrEqual(20);
  });

  it("puts known seed packs into purchased seed once and leaves equipment unchanged", () => {
    const inputs = createDefaultInputs();
    const plan = emptyPlan();
    plan.seeds["Acacia pycnantha"] = { packs: 2, unitPrice: 26 };
    const applied = applyForecast(inputs, plan);
    const forecast = buildForecast(applied);
    expect(applied.purchasedSeedAllowance).toBeCloseTo(forecast.seedCash, 6);
    expect(applied.oneOffEquipment).toBe(inputs.oneOffEquipment);
    expect(applied.growingConsumables).toBe(inputs.growingConsumables);
    expect(applied.reusableContainers).toBe(inputs.reusableContainers);
    const result = evaluate(applied);
    expect(result.purchasedSeed).toBeCloseTo(applied.purchasedSeedAllowance, 6);
    expect(result.oneOffEquipment).toBe(inputs.oneOffEquipment);
    expect(forecast.ownedPots).toBe(500);
    expect(forecast.seedMissing.length).toBeGreaterThan(0);
  });

  it("reports margin and markup from contribution without treating them as the same ratio", () => {
    const forecast = buildForecast(createDefaultInputs());
    expect(forecast.margin).not.toBeNull();
    expect(forecast.markup).not.toBeNull();
    expect(forecast.margin).not.toBeCloseTo(forecast.markup!, 2);
    expect(forecast.marginNote.toLowerCase()).toContain("markup");
  });

  it("rejects a negative quantity and keeps a round-trip of a valid plan", () => {
    const plan = emptyPlan();
    plan.lines["Correa alba"] = {
      tubeSold: -1,
      potSold: null,
      tubePrice: { kind: "suggestion" },
      potPrice: { kind: "suggestion" },
      germination: null,
      survival: null,
      sellThrough: null,
      channel: null,
      saleMonth: null,
    };
    expect(buildForecast({ ...createDefaultInputs(), plan }).issues[0]?.message).toContain("zero or more");
    const saved = coercePlan(JSON.parse(JSON.stringify(emptyPlan())));
    expect(saved).toEqual(emptyPlan());
    expect(coercePlan({ lines: { bad: { tubePrice: { kind: "nope" } } } })).toBeNull();
  });
});
