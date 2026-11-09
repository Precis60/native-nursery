import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import { evaluate } from "./model.ts";
import { coerceInputs, parseImport, scenarioToCsv, serializeBundle, serializeScenario } from "./io.ts";

describe("import and export", () => {
  it("round-trips one scenario and a bundle", () => {
    const inputs = createDefaultInputs();
    const single = parseImport(serializeScenario({ name: "Spring", inputs }));
    expect("scenarios" in single && single.scenarios[0]?.name).toBe("Spring");
    expect("scenarios" in single && single.scenarios[0]?.inputs.salesTarget).toBe(5000);
    const bundle = parseImport(
      serializeBundle([
        { name: "A", inputs },
        { name: "B", inputs: { ...inputs, salesTarget: 3500 } },
      ]),
    );
    expect("scenarios" in bundle && bundle.scenarios).toHaveLength(2);
  });

  it("maps an old single equipment figure without treating it as media", () => {
    const legacy = { ...createDefaultInputs(), equipmentExSeed: 6250 } as Record<string, unknown>;
    delete legacy.oneOffEquipment;
    delete legacy.reusableContainers;
    delete legacy.growingConsumables;
    const parsed = parseImport(JSON.stringify({ name: "Old", inputs: legacy }));
    if (!("scenarios" in parsed)) throw new Error(parsed.error);
    expect(parsed.scenarios[0]?.inputs.oneOffEquipment).toBe(6250);
    expect(parsed.scenarios[0]?.inputs.reusableContainers).toBe(0);
    expect(parsed.scenarios[0]?.inputs.growingConsumables).toBe(0);
  });

  it("rejects a broken file and a percent typed as 85", () => {
    expect("error" in parseImport("{")).toBe(true);
    const bad = parseImport(JSON.stringify({ name: "Bad", inputs: { ...createDefaultInputs(), sellThroughRate: 85 } }));
    expect("error" in bad && bad.error).toContain("0.85");
  });

  it("exports csv without NaN and neutralises formula text", () => {
    const csv = scenarioToCsv("=2+2", evaluate(createDefaultInputs()));
    expect(csv).toContain("revenue_ex_gst");
    expect(csv).toContain("'=2+2");
    expect(csv).not.toContain("NaN");
    expect(csv.split("\n").some((line) => line.startsWith("month,Nov 2026"))).toBe(true);
  });
});

describe("cash-timing settings", () => {
  it("round-trips lead time, GST and tax, and still reads scenarios saved without them", () => {
    const inputs = { ...createDefaultInputs(), growLeadMonths: 4, gstRegistered: true, taxSetAsideRate: 0.3 };
    const back = coerceInputs(JSON.parse(JSON.stringify(inputs)));
    expect(back?.growLeadMonths).toBe(4);
    expect(back?.gstRegistered).toBe(true);
    expect(back?.taxSetAsideRate).toBe(0.3);
    const { growLeadMonths: _lead, gstRegistered: _gst, taxSetAsideRate: _tax, ...legacy } = inputs;
    const old = coerceInputs(legacy);
    expect(old).not.toBeNull();
    expect(old?.growLeadMonths).toBeUndefined();
    expect(coerceInputs({ ...inputs, gstRegistered: "yes" })).toBeNull();
  });
});
