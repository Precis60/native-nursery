import { KIT_PRESETS, matchingKit } from "../domain/defaults.ts";
import { formatAud, formatUnits } from "../domain/format.ts";
import { HOUSEHOLD_RENT_WEEKLY_CONTEXT, type ModelResult } from "../domain/model.ts";
import { INVENTORY_COVER } from "../domain/shopping.ts";
import type { ScenarioInput } from "../domain/model.ts";
import { CashChart, ProfitChart } from "./charts.tsx";
import { More } from "./more.tsx";

function money(value: number | null, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatAud(value, digits);
}

export function ResultBoard({ result, inputs }: { result: ModelResult; inputs: ScenarioInput }) {
  const kit = matchingKit(inputs);
  const gap = result.gapToProfitGoalBeforeOwnerLabour;
  const gapText =
    gap == null ? "The $40,000 gap needs a finite cash operating profit." : gap > 0 ? `${formatAud(gap)} short of $40,000` : gap < 0 ? `${formatAud(Math.abs(gap))} above $40,000` : "Meets $40,000";

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
        <article className="panel">
          <p className="note">Revenue, ex GST</p>
          <p className="metric-value" data-testid="revenue">
            {money(result.revenueExGst)}
          </p>
        </article>
        <article className="panel">
          <p className="note">Cash operating profit</p>
          <p className="metric-value" data-testid="cash-profit">
            {money(result.operatingProfitBeforeOwnerLabour)}
          </p>
          <p className="note">Before owner labour and equipment</p>
        </article>
        <article className="panel">
          <p className="note">Goal</p>
          <p className="metric-value" data-testid="goal-gap">
            {gap == null ? "—" : formatAud(gap)}
          </p>
          <p className="note">{gapText}</p>
        </article>
      </div>

      {result.status === "invalid" ? (
        <div className="callout bad" role="alert">
          <p className="font-semibold">Some inputs need a correction.</p>
          <ul className="mt-2 list-disc pl-5">
            {result.issues.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.productionStatus === "impossible" ? (
        <div className="callout bad" data-testid="break-even">
          <p className="font-semibold">Production cannot supply this sales target.</p>
          <p className="mt-1">{result.productionMessage}</p>
          <p className="mt-2">{result.breakEven?.message}</p>
        </div>
      ) : (
        <div className={result.breakEven?.status === "impossible" ? "callout bad" : "callout"} data-testid="break-even">
          <p className="font-semibold">
            {result.breakEven?.status === "solved"
              ? `Operating break-even at ${formatUnits(result.breakEven.operatingSalesUnits ?? 0)} sales`
              : "Break-even is not a sales quantity"}
          </p>
          <p className="mt-1">{result.breakEven?.message}</p>
          {result.breakEven?.status === "solved" && result.breakEven.cashSalesUnits != null ? (
            <p className="mt-2">
              Cash break-even, after equipment{result.quoteNeededIncluded ? " and the quote you entered" : ""}, is{" "}
              {formatUnits(result.breakEven.cashSalesUnits)} sales.
            </p>
          ) : null}
          {result.salesUnitsForProfitGoal != null ? (
            <p className="mt-2">About {formatUnits(result.salesUnitsForProfitGoal)} sales reach $40,000 of cash operating profit, before owner labour and before equipment.</p>
          ) : result.status === "ok" && result.productionStatus === "ok" ? (
            <p className="mt-2">No sales volume reaches $40,000 while each sale contributes nothing, or loses cash, after variable cost.</p>
          ) : null}
        </div>
      )}

      <section className="panel">
        <h2 className="font-serif text-2xl">Production from the sales target</h2>
        <More>
          <p>{formatUnits(inputs.salesTarget)} is the number you plan to sell. Saleable stock is that number divided by sell-through, then survival and germination gross up the plants you have to start.</p>
        </More>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="note">Starts</dt>
            <dd className="text-xl font-semibold">{result.startedRequired == null ? "—" : formatUnits(result.startedRequired)}</dd>
          </div>
          <div>
            <dt className="note">Germinated</dt>
            <dd className="text-xl font-semibold">{result.germinatedRequired == null ? "—" : formatUnits(result.germinatedRequired)}</dd>
          </div>
          <div>
            <dt className="note">Saleable</dt>
            <dd className="text-xl font-semibold">{result.saleableRequired == null ? "—" : formatUnits(result.saleableRequired)}</dd>
          </div>
          <div>
            <dt className="note">Sold</dt>
            <dd className="text-xl font-semibold">{result.unitsSold == null ? "—" : formatUnits(result.unitsSold)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Ledger</h2>
        <More>
          <p>
          Seed, growing media and reusable tubes or pots are each counted once, and none of them is called equipment. Durable gear is capital. {kit === "tank" ? "The tank is inside one-off equipment." : kit === "full" ? `Required full-scale lines total ${formatAud(KIT_PRESETS.full.selectedTotal, 2)}. The earlier $6,800 figure is a rough reference, not this total.` : kit === "starter" ? `Day-one lines total ${formatAud(KIT_PRESETS.starter.selectedTotal, 2)}, against a rough $2,490 reference.` : "These amounts do not match a preset."} Household rent of {formatAud(HOUSEHOLD_RENT_WEEKLY_CONTEXT)} a week is not in the ledger.
          </p>
        </More>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">Cash and economic results for the open scenario</caption>
            <thead>
              <tr>
                <th>Line</th>
                <th>Treatment</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <Ledger label="Revenue" treatment="Ex GST, from the sales target" amount={result.revenueExGst} />
              <Ledger label="Illustrative per-plant cost" treatment="Residual only. Not tubes, media or seed" amount={result.variableProductionCost} />
              <Ledger label="Growing consumables" treatment="Media, fertiliser and chemicals, once" amount={result.growingConsumables} />
              <Ledger label="Reusable containers" treatment="Tubes, crates, pots and trays, once" amount={result.reusableContainers} />
              <Ledger label="Purchased seed" treatment="Cash allowance, once" amount={result.purchasedSeed} />
              <Ledger label="Overhead" treatment="Water, fuel, market and phone estimate. Not the Debco buy" amount={result.annualOverhead} />
              <Ledger label="Hired labour" treatment="Cash wages" amount={result.hiredLabourCash} />
              <Ledger label="Business rent allocation" treatment="Cash. Default is $0" amount={result.businessRent} />
              <Ledger label="Cash operating profit" treatment="Before owner labour and equipment" amount={result.operatingProfitBeforeOwnerLabour} strong />
              <Ledger label="Owner labour" treatment="Economic value, not a cash wage" amount={result.ownerLabourEconomic} />
              <Ledger label="After owner labour" treatment="Cash profit minus economic labour" amount={result.operatingProfitAfterOwnerLabour} strong />
              <Ledger label="One-off equipment" treatment="Shade, heat, irrigation gear, benches and tools. Not media or tubes" amount={result.oneOffEquipment} />
              <Ledger
                label="Quote-needed items"
                treatment={result.quoteNeededIncluded ? "Explicit amount you entered" : "Excluded. Not treated as $0"}
                amount={result.quoteNeededIncluded ? result.quoteNeededCash : null}
                blank={result.quoteNeededIncluded ? undefined : "Excluded"}
              />
              <Ledger label="Cash movement after equipment" treatment="Operating profit minus capital" amount={result.cashMovementAfterCapex} strong />
              <Ledger label="Opening cash" treatment="Your assumption" amount={inputs.openingCash} />
              {result.gstRegistered ? (
                <Ledger
                  label="GST still owed"
                  treatment="October quarter, due on the February BAS. Held back from closing cash"
                  amount={result.gstOwedAtYearEnd}
                />
              ) : null}
              <Ledger
                label="Closing cash"
                treatment={result.gstRegistered ? "Opening cash plus the movement, after GST" : "Opening cash plus the movement"}
                amount={result.closingCash}
                strong
              />
              {result.taxSetAsideRate > 0 ? (
                <>
                  <Ledger label="Income tax set-aside" treatment={`${Math.round(result.taxSetAsideRate * 1000) / 10}% of cash profit, kept for the tax bill`} amount={result.taxSetAside} />
                  <Ledger label="Closing cash after tax" treatment="What is left to spend" amount={result.closingCashAfterTax} strong />
                </>
              ) : null}
            </tbody>
          </table>
        </div>
        {result.gapToProfitGoalAfterOwnerLabour != null ? (
          <p className="note mt-3">
            After owner labour, the gap to $40,000 is {formatAud(result.gapToProfitGoalAfterOwnerLabour)}. That goal line above stays on cash operating profit, with owner time unpaid, which is how the year-1 notes framed it.
          </p>
        ) : null}
        <InventoryNote inputs={inputs} saleable={result.saleableRequired} />
      </section>

      <ProfitChart result={result} />
      <CashChart result={result} />

      {result.warnings.length > 0 ? (
        <div className="callout" role="status">
          {result.warnings.map((warning) => (
            <p key={warning.field}>{warning.message}</p>
          ))}
        </div>
      ) : null}

      {result.monthly ? (
        <section className="panel">
          <h2 className="font-serif text-2xl">Illustrative monthly cash</h2>
          <p className="note mt-1">
            Revenue follows your sales weights.{" "}
            {result.growLeadMonths == null
              ? "Seed, media, tubes and durable gear leave in November."
              : `Growing media and the per-plant cost leave ${result.growLeadMonths} month${result.growLeadMonths === 1 ? "" : "s"} before the sales they grow. Seed, tubes and durable gear leave in November.`}{" "}
            Overhead, hired wages and rent are spread evenly.
            {result.gstRegistered ? " Revenue is ex GST; net cash adds the 10% GST collected, and the BAS column is each quarter's refund (+) or payment (−) in its due month." : ""} Owner labour is not cash.
          </p>
          <div className="table-wrap mt-3">
            <table className="data">
              <caption className="sr-only">Illustrative cash by month</caption>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Sales</th>
                  <th className="num">Revenue</th>
                  {result.gstRegistered ? <th className="num">BAS</th> : null}
                  <th className="num">Net cash</th>
                  <th className="num">Closing</th>
                </tr>
              </thead>
              <tbody>
                {result.monthly.map((month) => (
                  <tr key={month.label}>
                    <td>{month.label}</td>
                    <td className="num">{formatUnits(month.unitsSold)}</td>
                    <td className="num">{formatAud(month.revenue)}</td>
                    {result.gstRegistered ? <td className="num">{month.basPayment === 0 ? "—" : `${month.basPayment < 0 ? "+" : "−"}${formatAud(Math.abs(month.basPayment))}`}</td> : null}
                    <td className="num">{formatAud(month.netCash)}</td>
                    <td className="num">{formatAud(month.closingCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InventoryNote({ inputs, saleable }: { inputs: ScenarioInput; saleable: number | null }) {
  const full = KIT_PRESETS.full;
  const day = KIT_PRESETS.starter;
  const cover =
    inputs.reusableContainers === full.reusableContainers && inputs.growingConsumables === full.growingConsumables
      ? INVENTORY_COVER.full
      : inputs.reusableContainers === day.reusableContainers && inputs.growingConsumables === day.growingConsumables
        ? INVENTORY_COVER.day
        : null;
  if (!cover) {
    return (
      <p className="note mt-3">
        Container and media dollars do not match a shopping preset, so this view does not assume the 3,920-tube or day-one capacities. The per-plant rate is still extra and does not replace those dollars.
      </p>
    );
  }
  const slots = cover.tubeSlots + cover.potsPurchased + cover.potsOwned;
  const perSlot = slots > 0 ? inputs.reusableContainers / slots : null;
  const perMedia = cover.mediaPlantsNoted > 0 ? inputs.growingConsumables / cover.mediaPlantsNoted : null;
  return (
    <p className="note mt-3">
      Container buy {formatAud(inputs.reusableContainers, 2)} covers {formatUnits(cover.tubeSlots)} purchased tube slots plus {formatUnits(cover.potsPurchased)} purchased 140 mm pots and {formatUnits(cover.potsOwned)} already owned
      {perSlot != null ? ` (${formatAud(perSlot, 2)} per slot)` : ""}. Media and other consumables {formatAud(inputs.growingConsumables, 2)} were described for about {formatUnits(cover.mediaPlantsNoted)} plants
      {perMedia != null ? ` (${formatAud(perMedia, 2)} each)` : ""}.
      {saleable != null ? ` This scenario needs ${formatUnits(saleable)} saleable plants.` : ""} The {formatAud(inputs.variableCostPerSaleableUnit, 2)} per saleable plant is an illustrative residual for a label or small top-up. It is not a second charge for Debco, tubes or seed.
    </p>
  );
}

function Ledger({
  label,
  treatment,
  amount,
  strong,
  blank,
}: {
  label: string;
  treatment: string;
  amount: number | null;
  strong?: boolean;
  blank?: string;
}) {
  return (
    <tr>
      <th scope="row" className={strong ? "font-semibold normal-case text-ink" : "normal-case text-ink"}>
        {label}
      </th>
      <td>{treatment}</td>
      <td className="num">{blank ?? money(amount)}</td>
    </tr>
  );
}
