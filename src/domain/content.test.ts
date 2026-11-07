import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "./defaults.ts";
import * as reference from "./reference.ts";
import { classifyLines, DAY_ONE, FULL_SCALE, QUOTE_NEEDED, sumShopLines } from "./shopping.ts";
import {
  POT_PLAN,
  REFERENCE_POT_UNITS,
  REFERENCE_TUBE_UNITS,
  SPECIES,
  TUBE_PLAN,
  scaleToFive,
} from "./species.ts";

describe("plan reference data", () => {
  it("keeps 20 species and the 4,000 / 1,000 mix", () => {
    expect(SPECIES).toHaveLength(20);
    expect(new Set(SPECIES.map((row) => row.botanical)).size).toBe(20);
    expect(TUBE_PLAN.reduce((total, row) => total + row.count, 0)).toBe(REFERENCE_TUBE_UNITS);
    expect(POT_PLAN.reduce((total, row) => total + row.count, 0)).toBe(REFERENCE_POT_UNITS);
    expect(SPECIES.filter((row) => row.local === "Yes")).toHaveLength(16);
  });

  it("scales the 3,500 case by 0.7 and rounds to five", () => {
    expect(scaleToFive(400, 2800, 4000)).toBe(280);
    expect(scaleToFive(75, 700, 1000)).toBe(55);
    expect(scaleToFive(25, 700, 1000)).toBe(20);
    expect(scaleToFive(400, 0, 4000)).toBe(0);
  });

  it("classifies shopping lines and leaves can-wait and quotes out of the required total", () => {
    const required = { includeCanWait: false, includeTank: false };
    const day = classifyLines(DAY_ONE, {}, required);
    expect(day.total).toBeCloseTo(2490, 0);
    expect(day.seed).toBe(200);
    expect(day.consumables).toBeGreaterThan(day.equipment);
    expect(QUOTE_NEEDED.every((item) => !("amount" in item))).toBe(true);
    const full = classifyLines(FULL_SCALE, {}, required);
    const withTank = classifyLines(FULL_SCALE, {}, { includeCanWait: false, includeTank: true });
    const withWaits = classifyLines(FULL_SCALE, {}, { includeCanWait: true, includeTank: false });
    expect(full.total).toBeLessThan(6800);
    expect(full.consumables).toBeGreaterThan(1400);
    expect(FULL_SCALE.find((line) => line.id === "potting")?.costClass).toBe("consumables");
    expect(FULL_SCALE.find((line) => line.id === "tubes")?.costClass).toBe("containers");
    expect(FULL_SCALE.find((line) => line.id === "smoke")?.canWait).toBe(true);
    expect(withWaits.consumables - full.consumables).toBeCloseTo(120, 2);
    expect(withTank.equipment - full.equipment).toBeCloseTo(925, 2);
    expect(withTank.total - full.total).toBeCloseTo(925, 2);
    expect(sumShopLines(FULL_SCALE, required)).toBeCloseTo(full.total, 8);
    expect(FULL_SCALE.find((line) => line.id === "seed")?.amount).toBe(550);
    expect(FULL_SCALE.find((line) => line.id === "tank")?.optional).toBe(true);
  });

  it("does not carry the old property name, person or address", () => {
    const blob = JSON.stringify({ reference, speciesCount: SPECIES.length, defaults: createDefaultInputs() });
    expect(blob).not.toMatch(/bello/i);
    expect(blob).not.toMatch(/\bmarco\b/i);
    expect(blob).not.toMatch(/\bmara\b/i);
    expect(blob).not.toMatch(/founds/i);
    expect(reference.channels.some((row) => row.target.includes("Trees on Farms"))).toBe(true);
    expect(reference.calendar).toHaveLength(12);
    expect(reference.sowing).toHaveLength(12);
  });
});
