import { describe, expect, it } from "vitest";
import { applyKit, createDefaultInputs, KIT_PRESETS } from "./defaults.ts";
import {
  BAS_DUE_MONTH,
  evaluate,
  HOUSEHOLD_RENT_WEEKLY_CONTEXT,
  MONTH_LABELS,
  PROFIT_GOAL_AUD,
  RENT_WEEKS,
  type ScenarioInput,
} from "./model.ts";

function walk(value: unknown): void {
  if (typeof value === "number") {
    expect(Number.isNaN(value)).toBe(false);
    expect(Number.isFinite(value)).toBe(true);
  } else if (Array.isArray(value)) {
    value.forEach(walk);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(walk);
  }
}

function base(patch: Partial<ScenarioInput> = {}): ScenarioInput {
  return { ...createDefaultInputs(), ...patch, monthlySalesWeights: patch.monthlySalesWeights ?? createDefaultInputs().monthlySalesWeights };
}

describe("published kit identity", () => {
  it("sums classified lines and keeps the old round totals as a reference only", () => {
    for (const kit of Object.values(KIT_PRESETS)) {
      expect(kit.oneOffEquipment + kit.reusableContainers + kit.growingConsumables + kit.seed).toBeCloseTo(kit.selectedTotal, 8);
    }
    expect(KIT_PRESETS.starter.publishedRoughTotal).toBe(2490);
    expect(KIT_PRESETS.starter.selectedTotal).toBeCloseTo(2490, 0);
    expect(KIT_PRESETS.full.publishedRoughTotal).toBe(6800);
    expect(KIT_PRESETS.tank.publishedRoughTotal).toBe(7730);
    expect(KIT_PRESETS.full.selectedTotal).not.toBeCloseTo(6800, 0);
    expect(KIT_PRESETS.tank.selectedTotal).not.toBeCloseTo(7730, 0);
    expect(KIT_PRESETS.full.selectedTotal).toBeLessThan(6800);
    expect(KIT_PRESETS.full.growingConsumables).toBeGreaterThan(1400);
    expect(KIT_PRESETS.full.reusableContainers).toBeGreaterThan(900);
    expect(KIT_PRESETS.full.oneOffEquipment).toBeLessThan(KIT_PRESETS.full.growingConsumables);
    expect(KIT_PRESETS.tank.oneOffEquipment - KIT_PRESETS.full.oneOffEquipment).toBeCloseTo(925, 2);
    expect(KIT_PRESETS.tank.growingConsumables).toBe(KIT_PRESETS.full.growingConsumables);
    expect(applyKit(createDefaultInputs(), "tank").purchasedSeedAllowance).toBe(550);
    expect(applyKit(createDefaultInputs(), "starter").reusableContainers).toBe(KIT_PRESETS.starter.reusableContainers);
  });
});

describe("sales are not shrunk by sell-through", () => {
  it("takes revenue from the sales target and uses 85% only to gross up production", () => {
    const result = evaluate(base());
    expect(result.status).toBe("ok");
    expect(result.unitsSold).toBe(5000);
    expect(result.tubeUnitsSold).toBe(4000);
    expect(result.potUnitsSold).toBe(1000);
    expect(result.blendedPriceExGst).toBeCloseTo(3.32, 10);
    expect(result.revenueExGst).toBeCloseTo(16600, 8);
    expect(result.saleableRequired).toBeCloseTo(5000 / 0.85, 8);
    expect(result.germinatedRequired).toBeCloseTo(result.saleableRequired! / 0.875, 8);
    expect(result.startedRequired).toBeCloseTo(result.germinatedRequired! / 0.8, 8);
    expect(result.unitsSold).not.toBeCloseTo(5000 * 0.85, 6);
  });

  it("keeps revenue steady when sell-through changes and variable cost is zero", () => {
    const full = evaluate(base({ sellThroughRate: 1, variableCostPerSaleableUnit: 0 }));
    const half = evaluate(base({ sellThroughRate: 0.5, variableCostPerSaleableUnit: 0 }));
    expect(half.revenueExGst).toBe(full.revenueExGst);
    expect(half.saleableRequired).toBeCloseTo(full.saleableRequired! * 2, 8);
  });
});

describe("cost buckets are not double counted", () => {
  it("charges variable cost on saleable production, not only on plants sold", () => {
    const result = evaluate(base({ salesTarget: 100, sellThroughRate: 0.5, variableCostPerSaleableUnit: 2 }));
    expect(result.variableProductionCost).toBeCloseTo(400, 8);
    expect(result.variableProductionCost).not.toBeCloseTo(200, 8);
  });

  it("puts seed in operating profit once and leaves equipment out of it", () => {
    const first = evaluate(base());
    const moreSeed = evaluate(base({ purchasedSeedAllowance: 650 }));
    const moreEquipment = evaluate(base({ oneOffEquipment: first.oneOffEquipment! + 1000 }));
    const moreMedia = evaluate(base({ growingConsumables: first.growingConsumables! + 100 }));
    expect(moreSeed.operatingProfitBeforeOwnerLabour).toBeCloseTo(first.operatingProfitBeforeOwnerLabour! - 100, 8);
    expect(moreSeed.cashMovementAfterCapex).toBeCloseTo(first.cashMovementAfterCapex! - 100, 8);
    expect(moreSeed.oneOffEquipment).toBe(first.oneOffEquipment);
    expect(moreMedia.operatingProfitBeforeOwnerLabour).toBeCloseTo(first.operatingProfitBeforeOwnerLabour! - 100, 8);
    expect(moreMedia.oneOffEquipment).toBe(first.oneOffEquipment);
    expect(moreEquipment.operatingProfitBeforeOwnerLabour).toBe(first.operatingProfitBeforeOwnerLabour);
    expect(moreEquipment.cashMovementAfterCapex).toBeCloseTo(first.cashMovementAfterCapex! - 1000, 8);
  });

  it("shows the handoff brief double-counting seed and the tank", () => {
    const revenue = 16600;
    const kitWithTank = 7730;
    const seed = 550;
    const opex = 5280;
    const tank = 930;
    const naive = revenue - (kitWithTank + seed + opex + tank);
    const rigorous = evaluate(
      base({
        purchasedSeedAllowance: seed,
        annualOverhead: opex,
        oneOffEquipment: kitWithTank - seed,
        reusableContainers: 0,
        growingConsumables: 0,
        variableCostPerSaleableUnit: 0,
        hiredHoursPerWeek: 0,
        businessRentPerWeek: 0,
      }),
    );
    expect(rigorous.revenueExGst).toBeCloseTo(revenue, 8);
    expect(rigorous.operatingProfitBeforeOwnerLabour).toBeCloseTo(revenue - seed - opex, 8);
    expect(rigorous.cashMovementAfterCapex).toBeCloseTo(revenue - seed - opex - (kitWithTank - seed), 8);
    expect(rigorous.cashMovementAfterCapex! - naive).toBeCloseTo(seed + tank, 8);
    expect(rigorous.operatingProfitBeforeOwnerLabour).not.toBeCloseTo(naive, 6);
  });

  it("treats a blank quote as excluded and an explicit zero as entered", () => {
    const blank = evaluate(base({ quoteNeededCash: null }));
    const zero = evaluate(base({ quoteNeededCash: 0 }));
    const priced = evaluate(base({ quoteNeededCash: 1000 }));
    expect(blank.quoteNeededIncluded).toBe(false);
    expect(zero.quoteNeededIncluded).toBe(true);
    expect(blank.cashMovementAfterCapex).toBe(zero.cashMovementAfterCapex);
    expect(priced.cashMovementAfterCapex).toBeCloseTo(blank.cashMovementAfterCapex! - 1000, 8);
    expect(priced.operatingProfitBeforeOwnerLabour).toBe(blank.operatingProfitBeforeOwnerLabour);
  });
});

describe("labour, rent and the profit goal", () => {
  it("keeps owner labour economic and hired labour cash", () => {
    const first = evaluate(base());
    const owner = evaluate(base({ ownerHourlyRate: 99 }));
    const hired = evaluate(base({ hiredHoursPerWeek: 2, hiredHourlyRate: 30 }));
    const hiredCash = 2 * 30 * 52;
    expect(owner.operatingProfitBeforeOwnerLabour).toBe(first.operatingProfitBeforeOwnerLabour);
    expect(owner.cashMovementAfterCapex).toBe(first.cashMovementAfterCapex);
    expect(owner.operatingProfitAfterOwnerLabour).toBeCloseTo(
      first.operatingProfitBeforeOwnerLabour! - 18 * 99 * 52,
      6,
    );
    expect(hired.hiredLabourCash).toBe(hiredCash);
    expect(hired.operatingProfitBeforeOwnerLabour).toBeCloseTo(first.operatingProfitBeforeOwnerLabour! - hiredCash, 6);
    expect(hired.ownerLabourEconomic).toBe(first.ownerLabourEconomic);
  });

  it("leaves household rent out and uses only the business allocation", () => {
    const first = evaluate(base());
    expect(first.businessRent).toBe(0);
    expect(HOUSEHOLD_RENT_WEEKLY_CONTEXT).toBe(450);
    const allocated = evaluate(base({ businessRentPerWeek: 450 }));
    expect(allocated.businessRent).toBe(450 * RENT_WEEKS);
    expect(allocated.operatingProfitBeforeOwnerLabour).toBeCloseTo(
      first.operatingProfitBeforeOwnerLabour! - 450 * RENT_WEEKS,
      6,
    );
  });

  it("measures the $40,000 gap on cash operating profit before owner labour", () => {
    const result = evaluate(base());
    expect(result.gapToProfitGoalBeforeOwnerLabour).toBeCloseTo(
      PROFIT_GOAL_AUD - result.operatingProfitBeforeOwnerLabour!,
      6,
    );
    expect(result.gapToProfitGoalAfterOwnerLabour).toBeCloseTo(
      PROFIT_GOAL_AUD - result.operatingProfitAfterOwnerLabour!,
      6,
    );
    expect(result.salesUnitsForProfitGoal).not.toBeNull();
    const atGoal = evaluate(base({ salesTarget: result.salesUnitsForProfitGoal! }));
    expect(atGoal.operatingProfitBeforeOwnerLabour).toBeCloseTo(PROFIT_GOAL_AUD, 4);
  });
});

describe("break-even is a contribution calculation", () => {
  it("recovers fixed cash from contribution after variable production cost", () => {
    const input = base({
      salesTarget: 1000,
      tubeShare: 0.8,
      tubePriceExGst: 2,
      potPriceExGst: 8,
      sellThroughRate: 0.85,
      germinationRate: 0.8,
      survivalRate: 0.9,
      variableCostPerSaleableUnit: 1,
      purchasedSeedAllowance: 550,
      annualOverhead: 1200,
      hiredHoursPerWeek: 0,
      businessRentPerWeek: 0,
      oneOffEquipment: 2290,
      reusableContainers: 0,
      growingConsumables: 0,
      quoteNeededCash: null,
    });
    const result = evaluate(input);
    const contribution = 3.2 - 1 / 0.85;
    const fixed = 550 + 1200;
    expect(result.contributionPerSoldUnit).toBeCloseTo(contribution, 8);
    expect(result.breakEven?.status).toBe("solved");
    expect(result.breakEven?.operatingSalesUnits).toBeCloseTo(fixed / contribution, 6);
    const solved = evaluate({ ...input, salesTarget: result.breakEven!.operatingSalesUnits! });
    expect(solved.operatingProfitBeforeOwnerLabour).toBeCloseTo(0, 4);
    expect(solved.cashMovementAfterCapex).toBeCloseTo(-2290, 4);

    const naiveCosts = 2290 + 550 + 550 + 1200;
    const naiveBreakEven = naiveCosts / 3.2;
    const atNaive = evaluate({ ...input, salesTarget: naiveBreakEven });
    expect(atNaive.operatingProfitBeforeOwnerLabour).not.toBeCloseTo(0, 0);
    expect(Math.abs(atNaive.operatingProfitBeforeOwnerLabour!)).toBeGreaterThan(100);
  });

  it("says break-even is impossible when each sale loses cash", () => {
    const result = evaluate(
      base({
        tubePriceExGst: 1,
        potPriceExGst: 1,
        tubeShare: 1,
        variableCostPerSaleableUnit: 2,
        sellThroughRate: 0.5,
      }),
    );
    expect(result.contributionPerSoldUnit).toBeLessThan(0);
    expect(result.breakEven?.status).toBe("impossible");
    expect(result.breakEven?.operatingSalesUnits).toBeNull();
    expect(result.salesUnitsForProfitGoal).toBeNull();
    expect(result.breakEven?.message.toLowerCase()).toContain("no break-even");
  });

  it("solves at zero sales when there is no fixed cash and contribution is positive", () => {
    const result = evaluate(
      base({
        purchasedSeedAllowance: 0,
        annualOverhead: 0,
        hiredHoursPerWeek: 0,
        businessRentPerWeek: 0,
        oneOffEquipment: 0,
        reusableContainers: 0,
        growingConsumables: 0,
        variableCostPerSaleableUnit: 0,
        quoteNeededCash: null,
      }),
    );
    expect(result.breakEven?.operatingSalesUnits).toBe(0);
    expect(result.breakEven?.cashSalesUnits).toBe(0);
  });
});

describe("edge cases stay finite", () => {
  it("handles zero sales without dividing by a rate", () => {
    const result = evaluate(base({ salesTarget: 0, sellThroughRate: 0, germinationRate: 0, survivalRate: 0 }));
    expect(result.status).toBe("ok");
    expect(result.revenueExGst).toBe(0);
    expect(result.saleableRequired).toBe(0);
    expect(result.variableProductionCost).toBe(0);
    expect(result.operatingProfitBeforeOwnerLabour).toBeCloseTo(-result.fixedCashOperating!, 8);
    expect(result.breakEven?.status).toBe("impossible");
    walk(result.revenueExGst);
    expect(JSON.stringify(result)).not.toContain("NaN");
    expect(JSON.stringify(result)).not.toContain("Infinity");
  });

  it("refuses a zero rate when sales are positive", () => {
    for (const patch of [
      { sellThroughRate: 0 },
      { germinationRate: 0 },
      { survivalRate: 0 },
    ]) {
      const result = evaluate(base(patch));
      expect(result.status).toBe("ok");
      expect(result.productionStatus).toBe("impossible");
      expect(result.revenueExGst).toBeNull();
      expect(result.operatingProfitBeforeOwnerLabour).toBeNull();
      expect(result.breakEven?.status).toBe("impossible");
      expect(result.monthly).toBeNull();
      expect(JSON.stringify(result)).not.toContain("NaN");
      expect(JSON.stringify(result)).not.toContain("Infinity");
    }
  });

  it("rejects non-finite and out-of-range inputs", () => {
    expect(evaluate(base({ salesTarget: Number.NaN })).status).toBe("invalid");
    expect(evaluate(base({ tubePriceExGst: Number.POSITIVE_INFINITY })).status).toBe("invalid");
    expect(evaluate(base({ salesTarget: -1 })).issues[0]?.field).toBe("salesTarget");
    expect(evaluate(base({ sellThroughRate: 85 })).issues[0]?.message).toContain("0.85");
    expect(evaluate(base({ tubeShare: 1.2 })).status).toBe("invalid");
    const badWeights = evaluate(base({ monthlySalesWeights: [1, 1, 1] }));
    expect(badWeights.status).toBe("invalid");
    expect(JSON.stringify(evaluate(base({ openingCash: Number.NaN })))).not.toContain("NaN");
  });

  it("supports an all-tube mix, an all-pot mix and a negative opening cash balance", () => {
    const tubes = evaluate(base({ tubeShare: 1 }));
    const pots = evaluate(base({ tubeShare: 0 }));
    expect(tubes.potUnitsSold).toBe(0);
    expect(tubes.revenueExGst).toBeCloseTo(5000 * 2.15, 6);
    expect(pots.tubeUnitsSold).toBe(0);
    expect(pots.revenueExGst).toBeCloseTo(5000 * 8, 6);
    const overdrawn = evaluate(base({ openingCash: -500 }));
    expect(overdrawn.closingCash).toBeCloseTo(-500 + overdrawn.cashMovementAfterCapex!, 6);
  });
});

describe("illustrative monthly timing", () => {
  it("puts seed and equipment in November and reconciles to the annual cash movement", () => {
    const result = evaluate(base({ quoteNeededCash: 100 }));
    expect(result.monthly).toHaveLength(12);
    expect(result.monthly!.map((month) => month.label)).toEqual([...MONTH_LABELS]);
    expect(result.monthly![0]?.seed).toBe(result.purchasedSeed);
    expect(result.monthly!.slice(1).every((month) => month.seed === 0)).toBe(true);
    expect(result.monthly![0]?.capex).toBeCloseTo(result.oneOffEquipment! + 100, 8);
    expect(result.monthly![0]?.inventory).toBeCloseTo(result.reusableContainers!, 8);
    expect(result.monthly!.slice(1).every((month) => month.inventory === 0)).toBe(true);
    const media = result.monthly!.reduce((total, month) => total + month.consumables, 0);
    expect(media).toBeCloseTo(result.growingConsumables!, 8);
    const net = result.monthly!.reduce((total, month) => total + month.netCash, 0);
    expect(net).toBeCloseTo(result.cashMovementAfterCapex!, 6);
    expect(result.monthly!.at(-1)?.closingCash).toBeCloseTo(result.closingCash!, 6);
    const ownerInMonths = result.monthly!.reduce((total, month) => total + month.hiredLabour, 0);
    expect(ownerInMonths).toBeCloseTo(result.hiredLabourCash!, 6);
    expect(JSON.stringify(result.monthly)).not.toContain(String(result.ownerLabourEconomic));
  });

  it("normalises uneven weights and refuses an all-zero timing", () => {
    const skewed = evaluate(base({ monthlySalesWeights: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0] }));
    const revenue = skewed.monthly!.reduce((total, month) => total + month.revenue, 0);
    expect(revenue).toBeCloseTo(skewed.revenueExGst!, 6);
    const silent = evaluate(base({ monthlySalesWeights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(silent.status).toBe("ok");
    expect(silent.monthly).toBeNull();
    expect(silent.revenueExGst).toBeCloseTo(16600, 6);
    expect(silent.warnings[0]?.field).toBe("monthlySalesWeights");
  });
});

describe("default scenario arithmetic", () => {
  it("matches the full-scale planning case used as the opening draft", () => {
    const result = evaluate(createDefaultInputs());
    const kit = KIT_PRESETS.full;
    const saleable = 5000 / 0.85;
    const variable = 0.1 * saleable;
    const operating = 16600 - variable - kit.seed - kit.growingConsumables - kit.reusableContainers - 5280;
    expect(result.variableProductionCost).toBeCloseTo(variable, 6);
    expect(result.growingConsumables).toBeCloseTo(kit.growingConsumables, 6);
    expect(result.oneOffEquipment).toBeCloseTo(kit.oneOffEquipment, 6);
    expect(result.operatingProfitBeforeOwnerLabour).toBeCloseTo(operating, 4);
    expect(result.cashMovementAfterCapex).toBeCloseTo(operating - kit.oneOffEquipment, 4);
    expect(result.oneOffEquipment).not.toBeCloseTo(6800 - 550, 0);
    expect(result.ownerLabourEconomic).toBe(18 * 35 * 52);
    expect(result.closingCash).toBeCloseTo(8000 + result.cashMovementAfterCapex!, 6);
    walk(result);
  });
});

describe("cash timing", () => {
  const inputs = createDefaultInputs();

  it("keeps the old November lump for scenarios saved before lead time existed", () => {
    const legacy = evaluate({ ...inputs, growLeadMonths: undefined });
    expect(legacy.monthly![0]!.consumables).toBeCloseTo(legacy.growingConsumables!, 8);
    expect(legacy.monthly![0]!.inventory).toBeCloseTo(legacy.reusableContainers! + legacy.growingConsumables!, 8);
  });

  it("spends growing media the lead time before the sale and changes no annual total", () => {
    const lead = evaluate({ ...inputs, growLeadMonths: 3 });
    const none = evaluate({ ...inputs, growLeadMonths: 0 });
    const weights = inputs.monthlySalesWeights;
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    // June sales (month 7) are grown from March (month 4).
    expect(lead.monthly![4]!.consumables).toBeCloseTo((lead.growingConsumables! * weights[7]!) / total, 8);
    // Sales in the first lead months were grown before November and land in November.
    const early = weights.slice(0, 4).reduce((sum, weight) => sum + weight, 0);
    expect(lead.monthly![0]!.consumables).toBeCloseTo((lead.growingConsumables! * early) / total, 8);
    // The last lead months grow for next year, which this year does not pay for.
    expect(lead.monthly![11]!.consumables).toBe(0);
    expect(lead.operatingProfitBeforeOwnerLabour).toBeCloseTo(none.operatingProfitBeforeOwnerLabour!, 8);
    expect(lead.closingCash).toBeCloseTo(none.closingCash!, 6);
    expect(Math.min(...lead.monthly!.map((month) => month.closingCash))).toBeLessThan(
      Math.min(...none.monthly!.map((month) => month.closingCash)),
    );
  });

  it("rejects a fractional or out-of-range lead time", () => {
    expect(evaluate({ ...inputs, growLeadMonths: 1.5 }).status).toBe("invalid");
    expect(evaluate({ ...inputs, growLeadMonths: 12 }).status).toBe("invalid");
  });

  it("adds no GST cash when not registered", () => {
    const result = evaluate(inputs);
    expect(result.monthly!.every((month) => month.gstCollected === 0 && month.basPayment === 0)).toBe(true);
    expect(result.gstOwedAtYearEnd).toBeNull();
  });

  it("pays each quarter's GST on its BAS month and holds October back", () => {
    const result = evaluate({ ...inputs, gstRegistered: true });
    const months = result.monthly!;
    const net = (index: number) => months[index]!.gstCollected - months[index]!.gstCredits;
    expect(BAS_DUE_MONTH).toHaveLength(12);
    // Feb pays Nov and Dec, Apr pays Jan to Mar, Jul pays Apr to Jun, Oct pays Jul to Sep.
    expect(months[3]!.basPayment).toBeCloseTo(net(0) + net(1), 8);
    expect(months[5]!.basPayment).toBeCloseTo(net(2) + net(3) + net(4), 8);
    expect(months[8]!.basPayment).toBeCloseTo(net(5) + net(6) + net(7), 8);
    expect(months[11]!.basPayment).toBeCloseTo(net(8) + net(9) + net(10), 8);
    expect(result.gstOwedAtYearEnd).toBeCloseTo(net(11), 8);
    expect(months[0]!.gstCollected).toBeCloseTo(months[0]!.revenue * 0.1, 8);
    // GST is passed through, so profit does not move.
    expect(result.operatingProfitBeforeOwnerLabour).toBeCloseTo(evaluate(inputs).operatingProfitBeforeOwnerLabour!, 8);
    // Closing cash is the sketch's last month less the GST still owed.
    expect(result.closingCash).toBeCloseTo(months[11]!.closingCash - result.gstOwedAtYearEnd!, 6);
  });

  it("warns at the GST registration threshold", () => {
    const big = evaluate({ ...inputs, salesTarget: 40_000 });
    expect(big.warnings.some((warning) => warning.field === "gstRegistered")).toBe(true);
    expect(evaluate({ ...inputs, salesTarget: 40_000, gstRegistered: true }).warnings.some((warning) => warning.field === "gstRegistered")).toBe(false);
  });

  it("sets tax aside on profit only", () => {
    const result = evaluate({ ...inputs, taxSetAsideRate: 0.3 });
    expect(result.taxSetAside).toBeCloseTo(result.operatingProfitBeforeOwnerLabour! * 0.3, 8);
    expect(result.closingCashAfterTax).toBeCloseTo(result.closingCash! - result.taxSetAside!, 8);
    const loss = evaluate({ ...inputs, salesTarget: 500, taxSetAsideRate: 0.3 });
    expect(loss.taxSetAside).toBe(0);
    expect(evaluate({ ...inputs, taxSetAsideRate: 30 }).status).toBe("invalid");
  });
});
