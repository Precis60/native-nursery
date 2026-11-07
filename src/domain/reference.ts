export const batches = [
  "Batch A, sown or struck Nov–Dec 2026 (wattles, sheoak, gums, Lomandra, Goodenia): tubes ready about Mar–May 2027 for winter revegetation.",
  "Batch B, struck or sown Feb–Apr 2027 (Correa, Westringia, saltbush, boobialla, Banksia, Bursaria, Poa): tubes ready about Jul–Sep, 140 mm pots about Aug–Oct.",
  "Batch C, sown Sep 2027: wattles, Kennedia and Baby Blue for spring retail and the following season.",
  "Slow lines (Banksia, Dianella, Bursaria in 140 mm) may miss October 2027. Treat them as following-year stock.",
];

export const zones = [
  { zone: "Propagation benches under 50% shade", holds: "About 40 trays at a time", area: "10–15 m²" },
  { zone: "Tube standing-out on weed mat, 50% shade", holds: "80 crates of 50", area: "About 11 m² net, 25 m² with paths" },
  { zone: "140 mm standing-out on weed mat", holds: "1,000 pots at about 50 per m²", area: "About 20 m² net, 40 m² with paths" },
  { zone: "Hardening in full sun", holds: "Stock rotates 3–4 weeks before sale", area: "40–60 m²" },
  { zone: "Potting, mix bay, tank, pickup", holds: "Work and sales space", area: "40–60 m²" },
];

export const channels = [
  { channel: "Council", target: "City of Greater Geelong (environment and parks)", contact: "https://www.geelongcity.vic.gov.au/", need: "Local provenance, supplier registration, insurance, often 6–12 months' lead time." },
  { channel: "Council", target: "Borough of Queenscliffe", contact: "https://www.queenscliffe.vic.gov.au/", need: "Coastal indigenous species and local provenance. The site blocked an automated check; open it in a browser." },
  { channel: "Landcare", target: "Bellarine Landcare (runs its own nursery: a partner as well as a possible buyer)", contact: "https://bellarinelandcare.org.au/activities/indigenous-nursery", need: "Bellarine projects. Orders are often placed in December for winter. Public phone on that page: 0439 392 369." },
  { channel: "Catchment", target: "Corangamite CMA", contact: "https://www.ccma.vic.gov.au/", need: "Revegetation grants and contracts, provenance records." },
  { channel: "Revegetation", target: "Greening Australia; Trees on Farms via local Landcare", contact: "https://www.greeningaustralia.org.au/", need: "Volume tubestock, contract growing, provenance." },
  { channel: "Landscapers", target: "Geelong and Bellarine landscapers (no named list in the notes)", contact: "", need: "Consistent 140 mm quality, delivery, trade price." },
  { channel: "Retail", target: "Diaco's Geelong and local garden centres", contact: "https://diacos.com.au/", need: "Labels with pictures. NGIV accreditation helps." },
  { channel: "Market", target: "Drysdale Community Market (3rd Sunday, Drysdale Recreation Reserve)", contact: "https://drysdaleps.vic.edu.au/drysdale-community-market/", need: "Stall booking. Fee was not published. Contact drysdalemarket@outlook.com." },
  { channel: "On-site", target: "Honesty stall or open days at the rented property", contact: "", need: "The landowner's agreement, plus a council check on signage and sales." },
  { channel: "Online", target: "Facebook Marketplace, an availability list, HortOS grower listing", contact: "https://au.hortosapp.com/for-growers", need: "Photos and a current stock list. HortOS listing was described as free for growers." },
];

export const compliance = [
  { text: "Written agreement with the landowner: nursery use, area, water, structures, visitors, sales, signage and insurance.", meta: "First" },
  { text: "City of Greater Geelong planning: confirm whether retail plant sales and signage at the rented property need a permit.", meta: "Before sales" },
  { text: "ABN (abr.gov.au). GST registration is required once turnover reaches $75,000, and is optional below that.", meta: "November" },
  { text: "Public and product liability insurance. Councils and markets often ask for about $10–20 m cover. No premium was found.", meta: "Before sales" },
  { text: "Buy seed. If you later collect wild seed, a DEECA permit under the Flora and Fauna Guarantee Act is needed on public land, plus landholder permission on private land.", meta: "Buy first" },
  { text: "Plant labels: botanical name, common name, size, care, nursery name.", meta: "Before sales" },
  { text: "Biosecurity: clean stock, records, and Agriculture Victoria rules.", meta: "Ongoing" },
  { text: "Optional: NGIV membership and Nursery Production FMS accreditation.", meta: "Year 1–2" },
];

export const calendar = [
  { month: "Nov 2026", tasks: "Landowner agreement, ABN, council check. Buy Batch A seed (allow about $200). Order tubes and mix, lay weed mat, build shade, sow Batch A, strike Goodenia cuttings.", solo: "20–25", helper: "12–15" },
  { month: "Dec 2026", tasks: "Finish irrigation and timer. Sow Melaleuca and more wattles. Contact City of Greater Geelong, Corangamite CMA and Landcare about winter orders.", solo: "15–20", helper: "10–12" },
  { month: "Jan 2027", tasks: "Prick out and pot Batch A into tubes (about 2,000) and 140 mm pots. Heatwave watering.", solo: "20–25", helper: "12–15" },
  { month: "Feb 2027", tasks: "Strike Batch B cuttings (Correa, Westringia, saltbush, boobialla). Pot gums into 140 mm.", solo: "20–25", helper: "12–15" },
  { month: "Mar 2027", tasks: "Sow Banksia, Rhagodia, Poa and Dianella. Send an availability list. First on-site sales if the landowner has agreed.", solo: "20–25", helper: "12–15" },
  { month: "Apr 2027", tasks: "Pot rooted cuttings. Sow Bursaria. Start the Drysdale market stall.", solo: "20–25", helper: "12–15" },
  { month: "May 2027", tasks: "Deliver revegetation tube orders. Pot Batch B into tubes.", solo: "20–25", helper: "12–15" },
  { month: "Jun 2027", tasks: "Peak tube sales and deliveries. Cold-stratify Baby Blue seed.", solo: "15–20", helper: "10–12" },
  { month: "Jul 2027", tasks: "Tube sales. Weeding, spacing, re-labelling.", solo: "12–15", helper: "8–10" },
  { month: "Aug 2027", tasks: "Last winter tube sales. Prepare trays for spring.", solo: "12–15", helper: "8–10" },
  { month: "Sep 2027", tasks: "Sow Batch C. Spring retail and landscaper push for 140 mm pots. Markets.", solo: "15–20", helper: "10–12" },
  { month: "Oct 2027", tasks: "Spring sales. Stocktake. Take the next year's revegetation pre-orders. Review the year.", solo: "15–20", helper: "10–12" },
];

export const sowing = [
  { month: "Nov 2026", sow: "E. stricklandii, E. kruseana, A. pycnantha, A. acinacea, Allocasuarina, Lomandra; Goodenia cuttings", tasks: "Build benches and shade. Order seed before the first sowing." },
  { month: "Dec 2026", sow: "Melaleuca lanceolata; follow-up wattle and gum sowings", tasks: "Prick out eucalypts at two true leaves." },
  { month: "Jan 2027", sow: "Lomandra (late). Little else in the heat.", tasks: "Pot wattles and gums into 140 mm. 50% shade, water twice a day in heat." },
  { month: "Feb 2027", sow: "Correa, Westringia and Atriplex cuttings", tasks: "Pot Goodenia. Harden the first eucalypts." },
  { month: "Mar 2027", sow: "Myoporum and Leucophyta cuttings; Banksia (heat the cones), Rhagodia, Dianella, Poa", tasks: "First wattle and gum 140 mm sales." },
  { month: "Apr 2027", sow: "Bursaria; more cuttings", tasks: "Pot on rooted cuttings." },
  { month: "May 2027", sow: "Bursaria (late)", tasks: "Revegetation orders for winter planting." },
  { month: "Jun 2027", sow: "Rest. Cold-stratify Baby Blue in the fridge.", tasks: "Main revegetation planting-season sales." },
  { month: "Jul 2027", sow: "None in the cold.", tasks: "Pot Poa and Rhagodia. Weed and space pots." },
  { month: "Aug 2027", sow: "Prepare mix and trays.", tasks: "Banksia and Dianella potting." },
  { month: "Sep 2027", sow: "E. pulverulenta Baby Blue, Kennedia, Poa, wattles (second round)", tasks: "Spring retail push." },
  { month: "Oct 2027", sow: "Kennedia, Allocasuarina (second round)", tasks: "Correa and Westringia ready. Spring sales." },
];

export const risks = [
  { risk: "Damping off", mitigation: "Fresh sterile mix, clean trays, thin sowing, grit top dressing, morning watering, airflow." },
  { risk: "Heatwaves and hot northerlies", mitigation: "50% shade, a second timer cycle at midday, wet the weed mat, move young stock under cover." },
  { risk: "Water supply failure", mitigation: "5,000 L tank if water is not reliable, check the agreement's water rights, drip or capillary watering." },
  { risk: "Unsold stock", mitigation: "Aim most tubes at pre-orders, keep the 140 mm range smaller, and don't over-sow past the production plan." },
  { risk: "Snails, aphids, scale, rabbits, birds", mitigation: "Raised benches, rabbit-proof fence, weekly checks, iron-based snail bait." },
  { risk: "Salt wind", mitigation: "Shade cloth on the windward side, salt-tolerant species, harden stock gradually." },
  { risk: "Permission", mitigation: "Written agreement with the landowner, council confirmation, keep structures movable." },
];

export const setupChecks = [
  "Seed-raising mix: sterile, fine, low-phosphorus native mix. Propagating sand plus perlite for cuttings.",
  "Potting mix for 140 mm pots: native premium, low phosphorus, slow-release native fertiliser.",
  "Punnets or 50-cell trays, labels and a waterproof marker.",
  "50% shade over benches, at least 30 cm off the ground, with a windbreak against salt wind.",
  "Watering: mist or a fine rose for seed, drip or overhead on a timer for pots. Rainwater if you have it.",
  "Heat mat or a warm spot for Lomandra and cuttings. Fridge space for cold stratification.",
  "Hygiene: new or bleach-washed trays, fresh mix, morning water, airflow, thin sowing, a fine grit topping.",
  "A full-sun hardening area for 3–4 weeks before sale.",
  "A record of species, seed lot or provenance, sow date and germination. Revegetation buyers ask for provenance.",
];

export const sources = [
  { title: "HortOS wholesale plant search", href: "https://au.hortosapp.com/plants/correa-alba", note: "140/150 mm grower listings, checked 5 Nov 2026 AEDT. Ex GST where the listing says so." },
  { title: "Nindethana full seed list", href: "https://www.nindethana.net.au/full-seed-list", note: "Seed prices used in the allowance." },
  { title: "Australian Seed Co 2026 catalogue", href: "https://www.ausseed.com.au/downloads/Ausseed_Catalogue_2026.pdf", note: "Figures are ex GST unless a product page says otherwise." },
  { title: "Australian Seed shop", href: "https://www.australianseed.com/shop/category/australian-native", note: "Pack prices, some inc GST." },
  { title: "Sage Hort 140 mm pots", href: "https://www.sagehort.com.au/product/plastic-pot-black-1-55l-140mm-140mm/", note: "Extra pots only. 500 are already owned." },
  { title: "Danbar forestry tube starter pack", href: "https://www.danbar.com.au/plastic_injection_products/nursery_plant_pots_planter_pots_and_forestry_tubes_products_gardening_pots_plastic_pots/display/28-a-native-tree-std-tube-starter-pack-2-", note: "Earlier capital note, not the shopping-list tube price." },
  { title: "Northcote Nursery Correa alba", href: "https://northcotenursery.com.au/products/correa-alba", note: "Retail $14.95, inc GST." },
  { title: "White House Nursery Correa alba 140 mm", href: "https://www.whitehousenursery.com.au/display/662-correa-alba-white-correa", note: "Retail $16, inc GST." },
  { title: "Bunnings 140 mm Westringia", href: "https://www.bunnings.com.au/140mm-westringea-grey-box_p3866678", note: "Retail $13.43, inc GST." },
  { title: "Garden Feast Westringia 140 mm", href: "https://gardenfeast.com.au/product/westringea-little-westie-140mm/", note: "Retail $13.98, inc GST." },
  { title: "Bellarine Landcare Indigenous Nursery", href: "https://bellarinelandcare.org.au/activities/indigenous-nursery", note: "Forestry tubes were about $2.28 in a 2021 guide." },
  { title: "Greater Geelong planning", href: "https://www.geelongaustralia.com.au/planning/", note: "Check sales and signage before you sell." },
  { title: "ABN registration", href: "https://abr.gov.au/", note: "" },
  { title: "ATO GST registration", href: "https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/registering-for-gst", note: "$75,000 turnover threshold." },
  { title: "Agriculture Victoria biosecurity", href: "https://www.agriculture.vic.gov.au/biosecurity", note: "" },
  { title: "Greenlife Industry Australia", href: "https://www.greenlifeindustry.com.au/", note: "Nursery Production FMS." },
];

export const wholesaleIllustration = {
  title: "Separate illustration: 500 × 140 mm",
  wholesale: "$4,420–$5,680 ex GST",
  retail: "$6,715–$8,000 inc GST",
  detail: "Eighteen species had 140/150 mm prices on HortOS. Twenty-five pots each at the lowest to median grower price was $3,981–$5,115 ex GST, scaled to 500 pots. Retail listings were found only for Correa and Westringia, so the retail range is a rough guide. This illustration does not deduct costs and is not the scenario result.",
};
