# Year-1 model

All trading prices are ex GST, in AUD, and are estimates. The kit totals are cash outlays taken from shelf prices. Many of those shelf prices were listed inc GST, so the kit is not a reconstructed ex-GST cost base.

The sales target is the number of plants you plan to sell. It is not multiplied by 85%.

```
tube sales = sales target × tube share
pot sales = sales target − tube sales
revenue = tube sales × tube price + pot sales × pot price

saleable = sales target / sell-through
germinated = saleable / survival
starts = germinated / germination
```

Sell-through defaults to 85%, which is the written plan’s “85% sold” case. It only increases production. Survival defaults to 87.5%, the middle of the “grow 10–15% extra” note. Germination defaults to 80% because the notes did not publish one rate.

```
variable cost = cost per saleable plant × saleable
```

That charges production, not only the plants that sell.

Cash operating profit, before owner labour:

```
revenue
− illustrative per-plant cost × saleable plants
− purchased seed allowance
− growing consumables (media, fertiliser, chemicals)
− reusable containers (tubes, crates, pots, trays)
− annual overhead
− hired wages
− business rent allocation
```

The per-plant rate defaults to $0.10. That figure is an unsourced illustration for a label or small top-up. It does not include Debco, seed-raising mix, perlite, fertiliser, tubes or seed.

Owner hours × rate × active weeks are economic and are subtracted only in “after owner labour”. Hired hours are the cash wages. They are not added twice.

One-off equipment is shade, heat, irrigation hardware, benches and tools. It is capital. Cash movement is operating profit before owner labour, minus that equipment, minus a quote-needed amount only when you type one. An empty quote is excluded. It is not $0 and it is not a guessed full cost.

The selected shopping total is the sum of included lines. Items marked can wait, and the tank, stay out until chosen. The earlier rounded figures of $2,490, $6,800 and $7,730 are references, not the selected totals. The app calculates the selected totals from the classified rows.

Household rent of $450 a week would be paid whether or not the nursery runs. The business allocation defaults to $0 and is the only rent in the model.

Operating break-even is fixed cash operating costs divided by contribution per sale:

```
contribution per sale = blended price − (cost per saleable plant / sell-through)
```

If that contribution is zero or negative, break-even is reported as impossible rather than as infinity or NaN. Cash break-even adds equipment and any explicit quote on top of the fixed cash costs. Seed is already in the fixed cash costs, so it is not in equipment.

The $40,000 gap is measured on cash operating profit before owner labour and before equipment. The screen also shows the gap after owner labour. A zero production rate with a positive sales target does not produce a profit figure.

A handoff note wrote `profit = revenue − (kit + seed + opex + tank)` and `break-even = costs / average price`. The first counts seed twice and counts the tank twice when the kit already includes it, and it treats equipment as operating profit. The second ignores variable production cost. Those formulas are not used. `src/domain/model.test.ts` checks the difference.

## Cash timing, GST and tax

These settings move cash between months. They do not change profit.

- **Grow lead time** (default 3 months). Growing consumables and the per-plant cost are spent that many months before the sales they grow. Growing for sales in the first months of the year lands in November. The final months grow for the following year, so this year does not pay for them. Seed, containers and equipment still leave in November. Scenarios saved before this setting existed keep the November lump.
- **GST registered** (default off). Sales collect 10% on top of the ex-GST price. Costs are shelf cash, so a credit of one eleventh is claimed on media, the per-plant cost, overhead, seed, containers and equipment, but not on wages or rent. Each quarter's balance is paid or refunded in its BAS month: Nov–Dec in February, Jan–Mar in April, Apr–Jun in July and Jul–Sep in October. October's GST is due after the year ends, so it is held back from closing cash. Revenue at or above $75,000 shows a registration warning.
- **Income tax set-aside** (default 0%). A share of positive cash operating profit, shown as closing cash after tax. The right rate depends on other income.
