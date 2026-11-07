export type Species = {
  botanical: string;
  common: string;
  type: string;
  heightM: number;
  size: string;
  local: string;
  method: string;
  pretreatment: string;
  sow: string;
  month: number;
  germ: string;
  sale: string;
  notes: string;
  wholesale: string;
  wholesaleMin: number;
  retail: string;
  seed: string;
};

export const SPECIES: Species[] = [
  { botanical: "Eucalyptus stricklandii", common: "Strickland's gum", type: "Tree", heightM: 8, size: "6–10 x 4–6 m", local: "No (WA)", method: "Seed", pretreatment: "None", sow: "Nov–Dec", month: 11, germ: "7–14", sale: "4–5 mo", notes: "Easy from seed. Tall.", wholesale: "$15.00 (1 grower)", wholesaleMin: 15, retail: "no price found", seed: "Nindethana $4.50/pkt (~50 seeds); Ausseed $12.00/25g ex GST; Ole Lantana $3.80/200 seeds" },
  { botanical: "Myoporum insulare", common: "Common boobialla", type: "Large shrub", heightM: 4, size: "2–5 x 3–4 m", local: "Yes", method: "Cuttings", pretreatment: "Seed very slow; use semi-hardwood cuttings", sow: "Feb–Apr cuttings", month: 3, germ: "Roots 4–6 wk", sale: "5–6 mo", notes: "Easy from cuttings, salt-hardy windbreak.", wholesale: "$7.27–$17.99 (med $8.50)", wholesaleMin: 7.27, retail: "no price found", seed: "Ausseed $20.20 smallest qty ex GST" },
  { botanical: "Allocasuarina verticillata", common: "Drooping sheoak", type: "Tree", heightM: 8, size: "4–10 x 3–6 m", local: "Yes", method: "Seed", pretreatment: "None", sow: "Nov–Dec or Sep", month: 11, germ: "7–21", sale: "6–8 mo", notes: "Easy; key revegetation species. Tall.", wholesale: "no 140mm price found", wholesaleMin: 0, retail: "no price found", seed: "Ausseed $40.50 smallest qty ex GST" },
  { botanical: "Acacia pycnantha", common: "Golden wattle", type: "Large shrub", heightM: 6, size: "4–8 x 3–5 m", local: "Yes", method: "Seed", pretreatment: "Boiling water, soak overnight", sow: "Nov–Dec, Sep–Oct", month: 11, germ: "7–21", sale: "3–4 mo", notes: "Very easy, fast. Short-lived.", wholesale: "$6.50–$7.15", wholesaleMin: 6.5, retail: "no price found", seed: "Ausseed $15.50/25g ex GST" },
  { botanical: "Banksia marginata", common: "Silver banksia", type: "Large shrub", heightM: 5, size: "2–8 x 2–4 m", local: "Yes", method: "Seed", pretreatment: "Heat cones to release seed (oven/fire)", sow: "Mar–Apr", month: 3, germ: "20–40", sale: "8–10 mo", notes: "Moderate; avoid overwatering. Florist value.", wholesale: "$5.50–$23.99 (med $11.55)", wholesaleMin: 5.5, retail: "no price found", seed: "Ausseed $26.40 smallest qty ex GST" },
  { botanical: "Melaleuca lanceolata", common: "Moonah", type: "Small tree", heightM: 6, size: "4–8 x 4–6 m", local: "Yes", method: "Seed", pretreatment: "None; surface sow (fine seed)", sow: "Nov–Feb", month: 12, germ: "10–21", sale: "6–8 mo", notes: "Easy; coastal, salt tolerant.", wholesale: "$24.00 (1 grower)", wholesaleMin: 24, retail: "no price found", seed: "Ausseed $18.50 smallest qty ex GST" },
  { botanical: "Bursaria spinosa", common: "Sweet bursaria", type: "Large shrub", heightM: 4, size: "2–5 x 2–3 m", local: "Yes", method: "Seed", pretreatment: "None (fresh seed); smoke water helps", sow: "Mar–May", month: 4, germ: "20–40", sale: "8–10 mo", notes: "Moderate; erratic germination.", wholesale: "$12.17–$28.00", wholesaleMin: 12.17, retail: "no price found", seed: "Ausseed $10.00 smallest qty ex GST" },
  { botanical: "Correa alba", common: "White correa", type: "Shrub", heightM: 1.5, size: "1–2 x 1–2 m", local: "Yes", method: "Cuttings", pretreatment: "Semi-hardwood tip cuttings + rooting hormone", sow: "Feb–Apr cuttings", month: 2, germ: "Roots 5–8 wk", sale: "6–8 mo", notes: "Easy from cuttings. Strong retail seller. Stays low.", wholesale: "$3.85–$9.47 (med $6.98)", wholesaleMin: 3.85, retail: "$14.95–$16.00 inc GST", seed: "Cuttings only" },
  { botanical: "Leucophyta brownii", common: "Cushion bush", type: "Shrub", heightM: 0.8, size: "0.5–1 x 1 m", local: "Yes", method: "Cuttings", pretreatment: "Tip cuttings, keep dry-ish", sow: "Mar–Apr cuttings", month: 3, germ: "Roots 4–6 wk", sale: "4–6 mo", notes: "Easy; silver florist filler.", wholesale: "$5.00–$16.99 (med $11.00)", wholesaleMin: 5, retail: "no price found", seed: "Cuttings only" },
  { botanical: "Rhagodia candolleana", common: "Seaberry saltbush", type: "Shrub", heightM: 1.5, size: "1–2 x 2–3 m", local: "Yes", method: "Seed or cuttings", pretreatment: "Remove fruit pulp; none", sow: "Mar–Apr", month: 3, germ: "14–30", sale: "5–6 mo", notes: "Easy; dune and coastal revegetation.", wholesale: "no 140mm price found", wholesaleMin: 0, retail: "no price found", seed: "no price found" },
  { botanical: "Atriplex cinerea", common: "Coast saltbush", type: "Shrub", heightM: 1.2, size: "1–1.5 x 2 m", local: "Yes", method: "Cuttings", pretreatment: "Seed: soak/leach 2 hr; cuttings easier", sow: "Feb–Apr cuttings", month: 2, germ: "Roots 3–5 wk", sale: "4–5 mo", notes: "Easy; silver foliage, salt tolerant.", wholesale: "$7.27 (1 grower)", wholesaleMin: 7.27, retail: "no price found", seed: "Ausseed $15.60 smallest qty ex GST" },
  { botanical: "Goodenia ovata", common: "Hop goodenia", type: "Shrub", heightM: 1.5, size: "1–2 x 1–2 m", local: "Yes", method: "Cuttings", pretreatment: "Softwood cuttings, root easily", sow: "Nov–Dec cuttings", month: 11, germ: "Roots 3–4 wk", sale: "3–4 mo", notes: "Very easy, fast.", wholesale: "$4.50 up (med $6.48)", wholesaleMin: 4.5, retail: "no price found", seed: "Cuttings only" },
  { botanical: "Kennedia prostrata", common: "Running postman", type: "Groundcover", heightM: 0.1, size: "0.1 x 1–2 m", local: "Yes", method: "Seed", pretreatment: "Boiling water, soak overnight", sow: "Sep–Oct", month: 9, germ: "10–21", sale: "4–5 mo", notes: "Easy; needs sharp drainage.", wholesale: "$6.50–$15.00 (med $11.00)", wholesaleMin: 6.5, retail: "no price found", seed: "no price found" },
  { botanical: "Dianella revoluta", common: "Black-anther flax-lily", type: "Groundcover (strappy)", heightM: 0.6, size: "0.5–0.8 x 0.6 m", local: "Yes", method: "Seed", pretreatment: "Clean pulp; smoke water", sow: "Mar–Apr", month: 3, germ: "30–90", sale: "8–12 mo", notes: "Slow, erratic; division faster.", wholesale: "$5.50–$19.99 (med $7.65)", wholesaleMin: 5.5, retail: "no price found", seed: "Ausseed $34.80 smallest qty ex GST" },
  { botanical: "Poa labillardierei", common: "Common tussock-grass", type: "Groundcover (grass)", heightM: 0.9, size: "0.8–1 x 0.8 m", local: "Yes", method: "Seed", pretreatment: "None", sow: "Mar–Apr, Sep–Oct", month: 3, germ: "10–21", sale: "4–5 mo", notes: "Easy; landscaper staple.", wholesale: "$5.00–$6.95", wholesaleMin: 5, retail: "no price found", seed: "no price found" },
  { botanical: "Lomandra longifolia", common: "Spiny-headed mat-rush", type: "Groundcover (strappy)", heightM: 0.9, size: "0.5–1 x 1 m", local: "Yes", method: "Seed", pretreatment: "Soak 24 hr; warm (20–25°C)", sow: "Nov–Jan", month: 11, germ: "30–60", sale: "6–9 mo", notes: "Slow germ; high-volume seller.", wholesale: "$4.95 up (med $6.80)", wholesaleMin: 4.95, retail: "no price found", seed: "Ausseed $8.60 smallest qty ex GST" },
  { botanical: "Acacia acinacea", common: "Gold-dust wattle", type: "Shrub", heightM: 2, size: "1–3 x 2 m", local: "Yes", method: "Seed", pretreatment: "Boiling water, soak overnight", sow: "Nov–Dec, Sep–Oct", month: 11, germ: "7–21", sale: "3–4 mo", notes: "Very easy from seed. Stays relatively low.", wholesale: "$18.99 (1 grower)", wholesaleMin: 18.99, retail: "no price found", seed: "Nindethana $1.32/g (10–249 g); Ausseed $41.20 smallest qty ex GST" },
  { botanical: "Eucalyptus pulverulenta 'Baby Blue'", common: "Silver-leaved mountain gum", type: "Small tree (coppiced)", heightM: 4, size: "3–6 x 3 m (cut as foliage)", local: "No", method: "Seed", pretreatment: "Cold stratify 4–6 wk (fridge, moist)", sow: "Sep–Oct", month: 9, germ: "10–21", sale: "4–5 mo", notes: "Easy; top florist foliage.", wholesale: "$7.00–$15.95", wholesaleMin: 7, retail: "no price found", seed: "Ausseed $47.00/5g ex GST" },
  { botanical: "Eucalyptus kruseana", common: "Bookleaf mallee", type: "Mallee", heightM: 3, size: "2–4 x 2–3 m", local: "No (WA)", method: "Seed", pretreatment: "None", sow: "Nov–Dec", month: 11, germ: "7–14", sale: "4–5 mo", notes: "Easy from seed. Florist foliage. Can be kept low by coppicing.", wholesale: "$15.00 (1 grower)", wholesaleMin: 15, retail: "no price found", seed: "Ausseed $31.60 smallest qty ex GST" },
  { botanical: "Westringia fruticosa", common: "Coast rosemary", type: "Shrub", heightM: 1.5, size: "1–2 x 1–2 m", local: "No (NSW)", method: "Cuttings", pretreatment: "Semi-hardwood cuttings", sow: "Feb–Apr cuttings", month: 2, germ: "Roots 4–6 wk", sale: "5–6 mo", notes: "Easy; widely sold hedge native.", wholesale: "$5.25–$16.50 (med $7.00)", wholesaleMin: 5.25, retail: "$13.43–$13.98 inc GST", seed: "Cuttings only" },
];

export type Allocation = { name: string; count: number; start: string };

export const TUBE_PLAN: Allocation[] = [
  { name: "Allocasuarina verticillata", count: 400, start: "Seed Nov–Dec" },
  { name: "Acacia pycnantha", count: 400, start: "Seed Nov–Dec" },
  { name: "Melaleuca lanceolata", count: 400, start: "Seed Dec–Feb" },
  { name: "Acacia acinacea", count: 300, start: "Seed Nov–Dec" },
  { name: "Myoporum insulare", count: 300, start: "Cuttings Feb–Mar" },
  { name: "Poa labillardierei (Hiko)", count: 300, start: "Seed Mar" },
  { name: "Bursaria spinosa", count: 250, start: "Seed Mar–Apr" },
  { name: "Banksia marginata", count: 250, start: "Seed Mar" },
  { name: "Correa alba", count: 250, start: "Cuttings Feb" },
  { name: "Atriplex cinerea", count: 250, start: "Cuttings Feb" },
  { name: "Rhagodia candolleana", count: 250, start: "Seed Mar" },
  { name: "Lomandra longifolia", count: 250, start: "Seed Nov–Dec" },
  { name: "Goodenia ovata", count: 200, start: "Cuttings Nov" },
  { name: "Dianella revoluta", count: 100, start: "Seed Mar (slow)" },
  { name: "Kennedia prostrata", count: 100, start: "Seed Nov / Sep" },
];

export const POT_PLAN: Allocation[] = [
  { name: "Correa alba", count: 150, start: "Cuttings Feb → sale Aug–Oct" },
  { name: "Westringia fruticosa", count: 150, start: "Cuttings Feb → sale Aug–Oct" },
  { name: "Leucophyta brownii", count: 100, start: "Cuttings Mar → sale Aug–Oct" },
  { name: "Eucalyptus pulverulenta Baby Blue", count: 100, start: "Seed Nov → sale Apr–Oct" },
  { name: "Lomandra longifolia", count: 100, start: "Seed Nov → sale Jul–Oct" },
  { name: "Eucalyptus stricklandii", count: 75, start: "Seed Nov → sale Mar–Oct" },
  { name: "Eucalyptus kruseana", count: 75, start: "Seed Nov → sale Mar–Oct" },
  { name: "Dianella revoluta", count: 75, start: "Divisions/seed → sale Sep–Oct" },
  { name: "Banksia marginata", count: 50, start: "Seed Mar → sale Oct+" },
  { name: "Myoporum insulare", count: 50, start: "Cuttings Feb → sale Aug–Oct" },
  { name: "Kennedia prostrata", count: 50, start: "Seed Nov → sale Apr–Oct" },
  { name: "Goodenia ovata", count: 25, start: "Cuttings Nov → sale Mar–Oct" },
];

export const REFERENCE_TUBE_UNITS = 4000;
export const REFERENCE_POT_UNITS = 1000;
export const OWNED_140MM_POTS = 500;

export const CUTTINGS_SPECIES = [
  "Correa alba",
  "Westringia fruticosa",
  "Leucophyta brownii",
  "Myoporum insulare",
  "Atriplex cinerea",
  "Goodenia ovata",
];

export type SeedReference = {
  species: string;
  target: string;
  buy: string;
  price: string;
  gst: string;
  href: string;
};

export const SEED_REFERENCE: SeedReference[] = [
  { species: "Acacia pycnantha", target: "~400 tubes", buy: "25 g (~50 seeds/g; sow ~3×)", price: "$26.00 / 25 g", gst: "incl GST", href: "https://www.australianseed.com/shop/item/acacia-pycnantha-golden-wattle" },
  { species: "Allocasuarina verticillata", target: "~400 tubes", buy: "25 g (Ausseed minimum)", price: "$40.50 / 25 g", gst: "ex GST (+GST on invoice)", href: "https://www.ausseed.com.au/downloads/Ausseed_Catalogue_2026.pdf" },
  { species: "Melaleuca lanceolata", target: "~400 tubes", buy: "25 g (fine seed; oversows easily)", price: "$7.50 / 25 g", gst: "Nindethana listing", href: "https://www.nindethana.net.au/Product-Detail.aspx?p=1720" },
  { species: "Acacia acinacea", target: "~300 tubes", buy: "~25 g or several packets", price: "From $1.32/g (10–249 g)", gst: "Nindethana list", href: "https://www.nindethana.net.au/full-seed-list" },
  { species: "Lomandra longifolia", target: "~350 tubes and pots", buy: "10 g (~130 seeds/g; sow ~4×)", price: "$15.40 / 10 g", gst: "incl GST", href: "https://www.australianseed.com/shop/item/lomandra-longifolia" },
  { species: "Banksia marginata", target: "~300 tubes and pots", buy: "100 seeds (germination variable)", price: "$72.05 / 100 seeds (1,000 seeds $418.00)", gst: "listing price", href: "https://www.australianseed.com/shop/item/banksia-marginata" },
  { species: "Kennedia prostrata", target: "~150", buy: "10 g", price: "$15.40 / 10 g", gst: "incl GST", href: "https://www.australianseed.com/shop/item/kennedia-prostrata" },
  { species: "Eucalyptus stricklandii", target: "~75 pots", buy: "2–5 packets (~50 seeds/pkt)", price: "$4.95 / pkt (~50 seeds)", gst: "listing price", href: "https://www.nindethana.net.au/Product-Detail.aspx?p=1286" },
  { species: "Eucalyptus kruseana", target: "~75 pots", buy: "1–2 g (~160–200 seeds/g)", price: "~$4.50–$10.50 / pkt or per g", gst: "Nindethana", href: "https://www.nindethana.net.au/Product-Detail.aspx?p=1116" },
  { species: "Eucalyptus pulverulenta", target: "~100 pots", buy: "2–3 packets (~80 seeds/g)", price: "$10.45 / pkt", gst: "incl GST", href: "https://www.australianseed.com/shop/item/eucalyptus-pulverulenta" },
  { species: "Bursaria spinosa", target: "~250 tubes", buy: "Several packets or small grams", price: "$4.95 / pkt", gst: "Australian Seed", href: "https://www.australianseed.com/shop/item/bursaria-spinosa" },
  { species: "Poa, Rhagodia, Dianella", target: "~725 combined", buy: "Packets or grams as available", price: "Line prices vary — inside the allowance", gst: "mixed", href: "https://www.nindethana.net.au/full-seed-list" },
];

export function scaleToFive(count: number, units: number, referenceUnits: number): number {
  if (!Number.isFinite(units) || units <= 0 || referenceUnits <= 0) return 0;
  return Math.round((count * (units / referenceUnits)) / 5) * 5;
}

export function scalePlan(rows: Allocation[], units: number, referenceUnits: number): Allocation[] {
  return rows.map((row) => ({ ...row, count: scaleToFive(row.count, units, referenceUnits) }));
}

export type SpeciesFilter = "all" | "local" | "seed" | "cuttings";
export type SpeciesSort = "name" | "height" | "month" | "price";

export function filterSpecies(rows: Species[], filter: SpeciesFilter): Species[] {
  if (filter === "local") return rows.filter((row) => row.local === "Yes");
  if (filter === "seed") return rows.filter((row) => row.method.startsWith("Seed"));
  if (filter === "cuttings") return rows.filter((row) => row.method === "Cuttings");
  return rows;
}

export function sortSpecies(rows: Species[], sort: SpeciesSort): Species[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "name") return a.botanical.localeCompare(b.botanical);
    if (sort === "height") return b.heightM - a.heightM;
    if (sort === "price") return b.wholesaleMin - a.wholesaleMin;
    return ((a.month + 1) % 12) - ((b.month + 1) % 12);
  });
  return copy;
}
