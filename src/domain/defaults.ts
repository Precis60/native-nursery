import type { ScenarioInput } from "./model.ts";
import { classifyLines, DAY_ONE, FULL_SCALE, type ClassTotals } from "./shopping.ts";

export const TUBE_PRICE_LOW = 1.8;
export const TUBE_PRICE_HIGH = 2.5;
export const TUBE_PRICE_DEFAULT = 2.15;
export const POT_PRICE_LOW = 6;
export const POT_PRICE_HIGH = 10;
export const POT_PRICE_DEFAULT = 8;

export const DEFAULT_GERMINATION = 0.8;
export const DEFAULT_SURVIVAL = 0.875;
export const DEFAULT_SELL_THROUGH = 0.85;

/** Illustrative residual per saleable plant. Not a supplier quote, and not the tubes, media or seed. */
export const ILLUSTRATIVE_UNIT_COST = 0.1;

export const OPEX_MONTHLY_LOW = 220;
export const OPEX_MONTHLY_HIGH = 660;
export const OPEX_MONTHLY_DEFAULT = 440;

export const DEFAULT_WEIGHTS = [1, 1, 2, 2, 5, 8, 16, 18, 14, 10, 13, 10];

const REQUIRED = { includeCanWait: false, includeTank: false };
const WITH_TANK = { includeCanWait: false, includeTank: true };

function presetFrom(id: "starter" | "full" | "tank", label: string, rough: number, totals: ClassTotals, includesTank: boolean) {
  return {
    id,
    label,
    /** Earlier rounded planning figure. Not the sum of the lines now included. */
    publishedRoughTotal: rough,
    seed: totals.seed,
    oneOffEquipment: totals.equipment,
    reusableContainers: totals.containers,
    growingConsumables: totals.consumables,
    selectedTotal: totals.total,
    includesTank,
  };
}

export const KIT_PRESETS = {
  starter: presetFrom("starter", "Day-one required lines", 2490, classifyLines(DAY_ONE, {}, REQUIRED), false),
  full: presetFrom("full", "Full scale, required lines", 6800, classifyLines(FULL_SCALE, {}, REQUIRED), false),
  tank: presetFrom("tank", "Required lines plus tank", 7730, classifyLines(FULL_SCALE, {}, WITH_TANK), true),
} as const;

export type KitId = keyof typeof KIT_PRESETS;

export const DEFAULT_SCENARIO_NAME = "Year 1 full scale";

export function createDefaultInputs(): ScenarioInput {
  const kit = KIT_PRESETS.full;
  return {
    salesTarget: 5000,
    tubeShare: 0.8,
    tubePriceExGst: TUBE_PRICE_DEFAULT,
    potPriceExGst: POT_PRICE_DEFAULT,
    germinationRate: DEFAULT_GERMINATION,
    survivalRate: DEFAULT_SURVIVAL,
    sellThroughRate: DEFAULT_SELL_THROUGH,
    variableCostPerSaleableUnit: ILLUSTRATIVE_UNIT_COST,
    purchasedSeedAllowance: kit.seed,
    annualOverhead: OPEX_MONTHLY_DEFAULT * 12,
    oneOffEquipment: kit.oneOffEquipment,
    reusableContainers: kit.reusableContainers,
    growingConsumables: kit.growingConsumables,
    quoteNeededCash: null,
    ownerHoursPerWeek: 18,
    ownerHourlyRate: 35,
    hiredHoursPerWeek: 0,
    hiredHourlyRate: 35,
    weeksPerYear: 52,
    businessRentPerWeek: 0,
    openingCash: 8000,
    monthlySalesWeights: [...DEFAULT_WEIGHTS],
  };
}

export function applyKit(inputs: ScenarioInput, kitId: KitId): ScenarioInput {
  const kit = KIT_PRESETS[kitId];
  return {
    ...inputs,
    purchasedSeedAllowance: kit.seed,
    oneOffEquipment: kit.oneOffEquipment,
    reusableContainers: kit.reusableContainers,
    growingConsumables: kit.growingConsumables,
  };
}

export function matchingKit(inputs: ScenarioInput): KitId | null {
  for (const kit of Object.values(KIT_PRESETS)) {
    if (
      inputs.purchasedSeedAllowance === kit.seed &&
      inputs.oneOffEquipment === kit.oneOffEquipment &&
      inputs.reusableContainers === kit.reusableContainers &&
      inputs.growingConsumables === kit.growingConsumables
    ) {
      return kit.id;
    }
  }
  return null;
}
