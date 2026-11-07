export type CostClass = "equipment" | "containers" | "consumables" | "seed";

export type ShopLine = {
  id: string;
  item: string;
  supplier: string;
  href?: string;
  qty: string;
  unit: string;
  amount: number | null;
  gst: string;
  canWait: boolean;
  optional: boolean;
  costClass: CostClass;
};

export const PRICE_CHECKED = "7 Nov 2026 AEDT";

export const DAY_ONE: ShopLine[] = [
  { id: "shade", item: "50% shade cloth 3.66 m wide (starter ~30 m²)", supplier: "Bunnings Coolaroo", href: "https://www.bunnings.com.au/coolaroo-3-66m-wide-white-50-uv-block-garden-shade-cloth-p-mtr_p3300400", qty: "8 lin. m", unit: "$26.50/m", amount: 212, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "weed", item: "Weed mat 1.83 x 50 m (91.5 m²)", supplier: "Permathene Noweed", href: "https://www.permathene.com.au/weed-matting/143-weed-mat-premium-183m-x-50m-noweed-9352845000754.html", qty: "1 roll", unit: "$112.49", amount: 112.49, gst: "tax included", canWait: false, optional: false, costClass: "equipment" },
  { id: "tunnel", item: "Mini poly tunnel 3 m", supplier: "Bunnings Maze", href: "https://www.bunnings.com.au/maze-3m-garden-poly-tunnel_p3321570", qty: "1", unit: "$92.00", amount: 92, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "mat", item: "Propagation heat mat large 525 x 1215 mm", supplier: "Sage Hort (Hallam)", href: "https://www.sagehort.com.au/product/propagation-heat-mat-large/", qty: "1", unit: "$80.00", amount: 80, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "thermo", item: "Heat mat thermostat (Ryset)", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/ryset-heat-mat-thermostat/", qty: "1", unit: "$60.00", amount: 60, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "tubes", item: "Forestry tubes 50 mm (GCP T50SFK), pack 980", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/native-tube-50mm/", qty: "1 pack", unit: "$225.50", amount: 225.5, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "crates", item: "Tube crates TR50FK (40 tubes each)", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/native-tube-crate-for-holding-50mm-native-tubes/", qty: "20", unit: "$3.52 each", amount: 70.4, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "trays", item: "Seedling punnet trays (SP tray)", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/seedling-punnet-tray-sp-tray/", qty: "2 packs of 10", unit: "$27.50 / pack", amount: 55, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "seed-mix", item: "Seed-raising mix 25 L (Grow Better)", supplier: "Baroona / Grow Better", href: "https://baroona.com.au/products/grow-better-seed-raising-mix-ao-certified-25l", qty: "4 bags", unit: "$16.95", amount: 67.8, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "potting", item: "Debco Native Premium potting mix 25 L", supplier: "Cape View Nursery", href: "https://capeviewnursery.com.au/debco-native-potting-mix-25l/", qty: "36 bags", unit: "$18.95", amount: 682.2, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "perlite", item: "Perlite 100 L coarse", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/perlite-100-litre-bag-coarse/", qty: "1", unit: "$40.00", amount: 40, gst: "inc GST", canWait: false, optional: false, costClass: "consumables" },
  { id: "verm", item: "Vermiculite 100 L", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/vermiculite-100-litre-bag/", qty: "1", unit: "$50.00", amount: 50, gst: "inc GST", canWait: false, optional: false, costClass: "consumables" },
  { id: "fert", item: "Troforte M Native fertiliser 3.5 kg", supplier: "Garden Express", href: "https://gardenexpress.com.au/products/troforte-native-gardens-fertiliser", qty: "1", unit: "$39.95", amount: 39.95, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "clonex", item: "Clonex rooting gel 50 ml", supplier: "Bunnings Trade Yates", href: "https://trade.bunnings.com.au/yates-50ml-red-clonex-rooting-hormone-gel-red_p3010341", qty: "1", unit: "$16.33", amount: 16.33, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "mist", item: "Holman 25 m misting kit with tap timer", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/holman-25-meter-misting-kit-with-tap-timer/", qty: "1", unit: "$99.00", amount: 99, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "fungicide", item: "Yates Anti Rot fungicide 500 ml", supplier: "Bunnings", href: "https://www.bunnings.com.au/yates-500ml-anti-rot-fungicide_p2961096", qty: "1", unit: "$24.61", amount: 24.61, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "bleach", item: "Peerless JAL chlorite bleach 5 L", supplier: "Bunnings", href: "https://www.bunnings.com.au/peerless-jal-5l-chlorite-liquid-bleach_p4463935", qty: "1", unit: "$23.00", amount: 23, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "snail", item: "Multiguard snail and slug killer 2.5 kg", supplier: "Bunnings", href: "https://www.bunnings.com.au/multicrop-2-5kg-multiguard-snail-and-slug-killer_p3019000", qty: "1", unit: "$18.97", amount: 18.97, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "traps", item: "The Buzz mini sticky insect traps 5-pack", supplier: "Bunnings", href: "https://www.bunnings.com.au/the-buzz-mini-insect-indoor-pot-traps-5-pack_p0081776", qty: "2 packs", unit: "$6.78 / pack", amount: 13.56, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "bench", item: "Maze 150 kg greenhouse / potting work bench", supplier: "Bunnings", href: "https://www.bunnings.com.au/maze-150kg-greenhouse-work-bench_p3320753", qty: "1", unit: "$190.00", amount: 190, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "secateurs", item: "Felco 2 secateurs", supplier: "Bunnings", href: "https://www.bunnings.com.au/felco-2-original-secateurs_p3358858", qty: "1", unit: "$88.00", amount: 88, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "meter", item: "Thermometer / hygrometer (SwitchBot Meter Plus)", supplier: "Bunnings", href: "https://www.bunnings.com.au/switchbot-meter-plus-smart-thermometer-and-hygrometer_p1125086", qty: "1", unit: "$29.00", amount: 29, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "seed", item: "Purchased seed allowance (Batch A)", supplier: "Estimate from Nindethana, Australian Seed and Ausseed. Not a supplier quote.", qty: "1 lot", unit: "Allow $200 incl. freight and replacement", amount: 200, gst: "estimate, mixed GST", canWait: false, optional: false, costClass: "seed" },
];

export const FULL_SCALE: ShopLine[] = [
  { id: "shade", item: "50% shade cloth 3.66 x 50 m roll (~183 m²)", supplier: "Protrade / Big B's", href: "https://protectivefilm.com.au/shade-cloth-50-shade-scaffolding-mesh-3.66m-50m", qty: "1 roll", unit: "$362.55 inc GST ($329.59 ex)", amount: 362.55, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "weed", item: "Weed mat 1.83 x 50 m", supplier: "Permathene", href: "https://www.permathene.com.au/weed-matting/143-weed-mat-premium-183m-x-50m-noweed-9352845000754.html", qty: "2 rolls", unit: "$112.49 each", amount: 224.98, gst: "tax included", canWait: false, optional: false, costClass: "equipment" },
  { id: "tunnel", item: "Mini poly tunnel 3 m", supplier: "Bunnings Maze", href: "https://www.bunnings.com.au/maze-3m-garden-poly-tunnel_p3321570", qty: "1", unit: "$92.00", amount: 92, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "mat", item: "Heat mat large + thermostat", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/propagation-heat-mat-large/", qty: "2 mats + 1 thermostat", unit: "$80 + $80 + $60", amount: 220, gst: "inc GST", canWait: false, optional: false, costClass: "equipment" },
  { id: "tubes", item: "Forestry tubes 50 mm pack 980", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/native-tube-50mm/", qty: "4 packs (3,920 tubes)", unit: "$225.50 / pack", amount: 902, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "crates", item: "Tube crates TR50FK", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/native-tube-crate-for-holding-50mm-native-tubes/", qty: "100", unit: "$3.52", amount: 352, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "pots", item: "Extra 140 mm pots (500 already owned)", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/plastic-pot-black-1-55l-140mm-140mm/", qty: "456-pack + 50-pack", unit: "$192.50 + $23.32", amount: 215.82, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "trays", item: "Seedling SP trays", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/seedling-punnet-tray-sp-tray/", qty: "4 packs of 10", unit: "$27.50", amount: 110, gst: "inc GST", canWait: false, optional: false, costClass: "containers" },
  { id: "seed-mix", item: "Seed-raising mix 25 L", supplier: "Grow Better", href: "https://baroona.com.au/products/grow-better-seed-raising-mix-ao-certified-25l", qty: "8 bags", unit: "$16.95", amount: 135.6, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "potting", item: "Debco Native Premium 25 L", supplier: "Cape View", href: "https://capeviewnursery.com.au/debco-native-potting-mix-25l/", qty: "76 bags", unit: "$18.95", amount: 1440.2, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "perlite", item: "Perlite 100 L + vermiculite 100 L", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/perlite-100-litre-bag-coarse/", qty: "2 + 2 bags", unit: "$40 / $50", amount: 180, gst: "inc GST", canWait: false, optional: false, costClass: "consumables" },
  { id: "fert", item: "Troforte M Native 3.5 kg", supplier: "Garden Express", href: "https://gardenexpress.com.au/products/troforte-native-gardens-fertiliser", qty: "3", unit: "$39.95", amount: 119.85, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "smoke", item: "Regen 2000 SmokeWater 20 L", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/regen-2000-smokewater-20-litre/", qty: "1", unit: "$120.00", amount: 120, gst: "inc GST", canWait: true, optional: false, costClass: "consumables" },
  { id: "clonex", item: "Clonex 50 ml", supplier: "Bunnings Trade", href: "https://trade.bunnings.com.au/yates-50ml-red-clonex-rooting-hormone-gel-red_p3010341", qty: "2", unit: "$16.33", amount: 32.66, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "mist", item: "Holman 25 m misting kit + timer", supplier: "Sage Hort", href: "https://www.sagehort.com.au/product/holman-25-meter-misting-kit-with-tap-timer/", qty: "2 kits", unit: "$99.00", amount: 198, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "controller", item: "Holman Pro+46 4-station controller", supplier: "House Trade Supplies", href: "https://housetradesupplies.com.au/holman-pro-46-controller-4-station-co1444.html", qty: "1", unit: "$74.95", amount: 74.95, gst: "listing", canWait: true, optional: false, costClass: "equipment" },
  { id: "sprayer", item: "STIHL SGA 85 backpack sprayer (tool only)", supplier: "STIHL", href: "https://www.stihl.com.au/en/p/mistblowers-sprayers-sga-85-battery-sprayer-ap-system-1010744", qty: "1", unit: "$649 sale / $699 RRP", amount: 649, gst: "inc GST", canWait: true, optional: false, costClass: "equipment" },
  { id: "bench", item: "Maze work bench", supplier: "Bunnings", href: "https://www.bunnings.com.au/maze-150kg-greenhouse-work-bench_p3320753", qty: "1", unit: "$190.00", amount: 190, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "bench-2", item: "Second Maze work bench", supplier: "Bunnings", href: "https://www.bunnings.com.au/maze-150kg-greenhouse-work-bench_p3320753", qty: "1", unit: "$190.00", amount: 190, gst: "listing", canWait: true, optional: false, costClass: "equipment" },
  { id: "barrow", item: "Sherlock 100 L galvanised wheelbarrow", supplier: "Bunnings Trade", href: "https://trade.bunnings.com.au/sherlock-100l-heavy-duty-galvanised-steel-tray-wheelbarrow_p3360559", qty: "1", unit: "$299.00", amount: 299, gst: "listing", canWait: true, optional: false, costClass: "equipment" },
  { id: "tools", item: "Felco 2 + SwitchBot meter", supplier: "Bunnings", href: "https://www.bunnings.com.au/felco-2-original-secateurs_p3358858", qty: "1 + 1", unit: "$88 + $29", amount: 117, gst: "listing", canWait: false, optional: false, costClass: "equipment" },
  { id: "chem", item: "Anti Rot, bleach, Multiguard and sticky traps", supplier: "Bunnings", href: "https://www.bunnings.com.au/yates-500ml-anti-rot-fungicide_p2961096", qty: "day-one lines, plus 1 extra Multiguard", unit: "sum of listings", amount: 80.11, gst: "listing", canWait: false, optional: false, costClass: "consumables" },
  { id: "seed", item: "Purchased seed allowance (full year)", supplier: "Estimate from observed pack prices, oversowing, freight and replacement. Not a supplier quote.", qty: "1 lot", unit: "Allow $550", amount: 550, gst: "estimate, mixed GST", canWait: false, optional: false, costClass: "seed" },
  { id: "tank", item: "5,000 L poly tank, only if water is unreliable", supplier: "ASC Tanks", href: "https://asctanks.com.au/product/urban-poly-5000lt-round-rain-water-tank/", qty: "1", unit: "from $925, GST not stated", amount: 925, gst: "GST not stated", canWait: true, optional: true, costClass: "equipment" },
];

export type QuoteItem = { id: string; item: string; href?: string; note: string };

export const QUOTE_NEEDED: QuoteItem[] = [
  { id: "frame", item: "Shade-house frame, posts and clips", note: "No listing price in the November 2026 notes. An earlier capital note guessed $500–$1,500 and that guess is not used as a cost." },
  { id: "pump", item: "Irrigation pump and filter", note: "Left out of the kit. Do not enter $0 unless a supplier has quoted zero." },
  { id: "ags", item: "Australian Growing Solutions bulk native / low-P mix", href: "https://www.agsolutions.net.au/potting-mix", note: "Alternative to bagged Debco. Not added on top of the Debco line." },
  { id: "sand", item: "Coarse propagating sand", note: "Quote when you know the volume." },
  { id: "labels", item: "Plant labels in bulk", note: "Overhead already has room for tags if you leave the per-plant cost at $0." },
  { id: "dibbers", item: "Scoops and dibbers", note: "Small tools. Still excluded rather than priced at $0." },
  { id: "cuttings", item: "Purchased cutting or tip material", note: "For Correa, Westringia, Leucophyta, Myoporum, Atriplex and Goodenia if you have no mother stock." },
];

export type ShoppingChoice = {
  includeCanWait: boolean;
  includeTank: boolean;
};

export type ClassTotals = {
  equipment: number;
  containers: number;
  consumables: number;
  seed: number;
  total: number;
};

/** Plants the listed container and media buys were described against. Owned pots add slots and no dollars. */
export const INVENTORY_COVER = {
  day: { tubeSlots: 980, potsPurchased: 0, potsOwned: 500, mediaPlantsNoted: 1000 },
  full: { tubeSlots: 3920, potsPurchased: 506, potsOwned: 500, mediaPlantsNoted: 4500 },
} as const;

export function lineIncluded(line: ShopLine, choice: ShoppingChoice): boolean {
  if (line.amount == null) return false;
  if (line.optional) return choice.includeTank;
  if (line.canWait) return choice.includeCanWait;
  return true;
}

export function classifyLines(
  lines: ShopLine[],
  amounts: Record<string, number>,
  choice: ShoppingChoice,
): ClassTotals {
  const totals: ClassTotals = { equipment: 0, containers: 0, consumables: 0, seed: 0, total: 0 };
  for (const line of lines) {
    if (!lineIncluded(line, choice)) continue;
    const amount = amounts[line.id] ?? line.amount;
    if (amount == null || !Number.isFinite(amount)) continue;
    totals[line.costClass] += amount;
    totals.total += amount;
  }
  return totals;
}

export function sumShopLines(lines: ShopLine[], choice: ShoppingChoice): number {
  return classifyLines(lines, {}, choice).total;
}

export const CLASS_LABEL: Record<CostClass, string> = {
  equipment: "One-off equipment",
  containers: "Reusable containers",
  consumables: "Growing consumables",
  seed: "Purchased seed",
};
