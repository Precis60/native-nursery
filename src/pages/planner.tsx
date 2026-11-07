import { useState } from "react";
import { NumberField, PercentField } from "../components/fields.tsx";
import { ResultBoard } from "../components/results.tsx";
import {
  DEFAULT_GERMINATION,
  DEFAULT_SELL_THROUGH,
  DEFAULT_SURVIVAL,
  ILLUSTRATIVE_UNIT_COST,
  KIT_PRESETS,
  OPEX_MONTHLY_DEFAULT,
  OPEX_MONTHLY_HIGH,
  OPEX_MONTHLY_LOW,
  POT_PRICE_HIGH,
  POT_PRICE_LOW,
  TUBE_PRICE_HIGH,
  TUBE_PRICE_LOW,
} from "../domain/defaults.ts";
import { scenarioToCsv, serializeScenario } from "../domain/io.ts";
import { MONTH_LABELS, issueFor } from "../domain/model.ts";
import { formatAud } from "../domain/format.ts";
import { downloadText } from "../lib/download.ts";
import { ForecastBoard } from "../components/forecast.tsx";
import { usePlanner } from "../state/planner-context.tsx";

export function PlannerPage() {
  const planner = usePlanner();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const source = planner.draft.source;
  const sourceLabel =
    source.kind === "cloud"
      ? "Editing an account scenario. Account saves are private to the signed-in user."
      : source.kind === "local"
        ? "Editing a copy saved in this browser only."
        : "Kept for this sign-in. It is sent to your account when the numbers are valid.";

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setMessage(await action());
    setBusy(false);
  }

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Year 1</p>
        <h1 className="font-serif text-4xl text-olive sm:text-5xl">Native Nursery</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Independent nursery planner for a proposed rented site near Geelong. Figures are estimates in AUD. Sale prices are ex GST. The tube default is the midpoint of an old planning range, not a current quote. Owner time is economic. Hired wages are cash. Business rent stays $0 until you allocate it. Household rent is not added.
        </p>
      </header>

      {planner.warning ? (
        <div className="callout" role="status">
          <p>{planner.warning}</p>
          <button className="btn btn-ghost mt-2" type="button" onClick={planner.dismissWarning}>
            Dismiss
          </button>
        </div>
      ) : null}
      {message ? (
        <div className={message.toLowerCase().includes("confirm") ? "callout" : "callout bad"} role="alert">
          {message}
        </div>
      ) : null}

      <section className="panel">
        <label className="field" htmlFor="scenario-name">
          <span>Scenario name</span>
          <input
            id="scenario-name"
            className="text-input"
            value={planner.draft.name}
            onChange={(event) => planner.setName(event.target.value)}
          />
        </label>
        <p className="note mt-2" data-testid="storage-label">
          {sourceLabel}
          {planner.dirty ? " Unsaved changes." : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void run(() => planner.saveLocal(source.kind === "local" ? "update" : "new"))}>
            {source.kind === "local" ? "Update browser copy" : "Save in this browser"}
          </button>
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void run(() => planner.saveLocal("new"))}>
            Save as new browser copy
          </button>
          <button className="btn btn-secondary" type="button" disabled={busy || !planner.userEmail} onClick={() => void run(() => planner.saveCloud(source.kind === "cloud" ? "update" : "new"))}>
            {source.kind === "cloud" ? "Update account copy" : "Save to your account"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={planner.newDraft}>
            New draft
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => downloadText(`${planner.draft.name}.json`, serializeScenario({ name: planner.draft.name, inputs: planner.draft.inputs }), "application/json")}
          >
            Export JSON
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => downloadText(`${planner.draft.name}.csv`, scenarioToCsv(planner.draft.name, planner.result), "text/csv")}
          >
            Export CSV
          </button>
        </div>
        {planner.cloudError ? <p className="note mt-2">Account save did not finish. {planner.cloudError} The latest edit is still held for this sign-in.</p> : null}
      </section>

      <ForecastBoard inputs={planner.draft.inputs} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="order-2 min-w-0 lg:order-1">
          <PlannerForm key={planner.formEpoch} />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <ResultBoard result={planner.result} inputs={planner.draft.inputs} />
        </div>
      </div>
    </div>
  );
}

function PlannerForm() {
  const { draft, result, setInput, setInputs, applyPreset } = usePlanner();
  const inputs = draft.inputs;
  const error = (field: string) => issueFor(result, field);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="panel">
        <h2 className="font-serif text-2xl">Sales</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="chip" type="button" onClick={() => setInputs({ ...inputs, salesTarget: 3500 }, true)}>
            3,500 sales
          </button>
          <button className="chip" type="button" onClick={() => setInputs({ ...inputs, salesTarget: 5000 }, true)}>
            5,000 sales
          </button>
          {(Object.keys(KIT_PRESETS) as (keyof typeof KIT_PRESETS)[]).map((id) => (
            <button key={id} className="chip" type="button" onClick={() => applyPreset(id)}>
              {KIT_PRESETS[id].label} {formatAud(KIT_PRESETS[id].selectedTotal, 2)}
            </button>
          ))}
        </div>
        <p className="note mt-2">
          Button amounts are the sum of included lines. Earlier notes rounded a longer list to about $2,490, $6,800 and $7,730. Those are references. Items that can wait, and anything still needing a quote, stay out until you include them.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NumberField id="sales-target" label="Sales target" suffix="plants sold" hint="This is the number you plan to sell. It is not cut by 85%." value={inputs.salesTarget} onChange={(value) => setInput("salesTarget", value)} error={error("salesTarget")} />
          <PercentField id="tube-share" label="Tube share" hint="The rest are 140 mm pots. Default plan is 80% tubes." value={inputs.tubeShare} onChange={(value) => setInput("tubeShare", value)} error={error("tubeShare")} />
          <NumberField id="tube-price" label="Tube price" suffix="ex GST" hint={`Prior planning range ${formatAud(TUBE_PRICE_LOW, 2)}–${formatAud(TUBE_PRICE_HIGH, 2)}. Not a current quote. Default is the midpoint.`} value={inputs.tubePriceExGst} onChange={(value) => setInput("tubePriceExGst", value)} error={error("tubePriceExGst")} />
          <NumberField id="pot-price" label="140 mm price" suffix="ex GST" hint={`Prior planning range ${formatAud(POT_PRICE_LOW, 2)}–${formatAud(POT_PRICE_HIGH, 2)}. Not a current quote. Default is the midpoint.`} value={inputs.potPriceExGst} onChange={(value) => setInput("potPriceExGst", value)} error={error("potPriceExGst")} />
        </div>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Germination, survival, sell-through</h2>
        <p className="note mt-1">
          These are three different rates. Sell-through defaults to {Math.round(DEFAULT_SELL_THROUGH * 100)}%, the plan’s “85% sold” case, and it only increases how many saleable plants you need. Survival defaults to {Math.round(DEFAULT_SURVIVAL * 1000) / 10}%, about the middle of the “grow 10–15% extra” note. Germination defaults to {Math.round(DEFAULT_GERMINATION * 100)}% because the notes never published one rate.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PercentField id="germination" label="Germination / strike" value={inputs.germinationRate} onChange={(value) => setInput("germinationRate", value)} error={error("germinationRate")} />
          <PercentField id="survival" label="Survival to saleable" value={inputs.survivalRate} onChange={(value) => setInput("survivalRate", value)} error={error("survivalRate")} />
          <PercentField id="sell-through" label="Sell-through" value={inputs.sellThroughRate} onChange={(value) => setInput("sellThroughRate", value)} error={error("sellThroughRate")} />
        </div>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Cash costs</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <NumberField id="unit-cost" label="Illustrative cost per saleable plant" suffix="ex GST" hint={`Default ${formatAud(ILLUSTRATIVE_UNIT_COST, 2)} is an unsourced allowance for a label or small top-up. Charged on plants produced. Debco, fertiliser, tubes and seed are separate and are not in this rate.`} value={inputs.variableCostPerSaleableUnit} onChange={(value) => setInput("variableCostPerSaleableUnit", value)} error={error("variableCostPerSaleableUnit")} />
          <NumberField id="consumables" label="Growing consumables" hint="Debco, seed-raising mix, perlite, vermiculite, fertiliser and chemicals. Counted once. Not equipment." value={inputs.growingConsumables} onChange={(value) => setInput("growingConsumables", value)} error={error("growingConsumables")} />
          <NumberField id="containers" label="Reusable containers" hint="Forestry tubes, crates, extra 140 mm pots and trays. The 500 pots already owned are not in this cash figure." value={inputs.reusableContainers} onChange={(value) => setInput("reusableContainers", value)} error={error("reusableContainers")} />
          <NumberField id="seed" label="Purchased seed allowance" hint="Full-year estimate is $550, day-one $200, both including freight and replacement. Not added again inside consumables or equipment." value={inputs.purchasedSeedAllowance} onChange={(value) => setInput("purchasedSeedAllowance", value)} error={error("purchasedSeedAllowance")} />
          <NumberField id="overhead" label="Annual overhead" hint={`Default ${formatAud(OPEX_MONTHLY_DEFAULT * 12)} is ${formatAud(OPEX_MONTHLY_DEFAULT)} a month, the middle of the ${formatAud(OPEX_MONTHLY_LOW)}–${formatAud(OPEX_MONTHLY_HIGH)} estimate for water, fuel, market and phone. It is not a second Debco purchase.`} value={inputs.annualOverhead} onChange={(value) => setInput("annualOverhead", value)} error={error("annualOverhead")} />
          <NumberField id="equipment" label="One-off equipment" hint="Shade, heat mats, irrigation hardware, benches and hand tools. Tubes, media and seed are not in this number. The tank is included only on the tank preset." value={inputs.oneOffEquipment} onChange={(value) => setInput("oneOffEquipment", value)} error={error("oneOffEquipment")} />
          <NumberField id="quote" label="Quote-needed cash" hint="Leave blank to keep frame, pump, filter and small tools out of the model. Blank is not $0." value={inputs.quoteNeededCash ?? Number.NaN} onChange={(value) => setInput("quoteNeededCash", Number.isNaN(value) ? null : value)} error={error("quoteNeededCash")} />
          <NumberField id="opening" label="Opening cash" hint="An assumption for the cash sketch, not a recorded bank balance." value={inputs.openingCash} onChange={(value) => setInput("openingCash", value)} error={error("openingCash")} />
        </div>
        <button className="btn btn-secondary mt-3" type="button" onClick={() => setInputs({ ...inputs, purchasedSeedAllowance: 900 }, true)}>
          Set seed allowance to $900
        </button>
        <p className="note mt-2">That replaces the allowance with the note about buying Banksia as 1,000 seeds (about $350 more than the $550 full-year allowance). It does not add $350 on top.</p>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Labour and rent</h2>
        <p className="note mt-1">Owner hours are priced as economic time and stay out of cash profit. Hired hours are wages. A helper was estimated to cut peak weeks by about 40%, which you can reflect by lowering owner hours and adding hired hours.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <NumberField id="owner-hours" label="Owner hours per week" hint="Flat estimate inside the calendar’s roughly 12–25 hours." value={inputs.ownerHoursPerWeek} onChange={(value) => setInput("ownerHoursPerWeek", value)} error={error("ownerHoursPerWeek")} />
          <NumberField id="owner-rate" label="Owner hourly rate" hint="Planning estimate, not an award rate and not cash." value={inputs.ownerHourlyRate} onChange={(value) => setInput("ownerHourlyRate", value)} error={error("ownerHourlyRate")} />
          <NumberField id="hired-hours" label="Hired hours per week" value={inputs.hiredHoursPerWeek} onChange={(value) => setInput("hiredHoursPerWeek", value)} error={error("hiredHoursPerWeek")} />
          <NumberField id="hired-rate" label="Hired hourly rate" hint="Cash. Used only when hired hours are above zero." value={inputs.hiredHourlyRate} onChange={(value) => setInput("hiredHourlyRate", value)} error={error("hiredHourlyRate")} />
          <NumberField id="weeks" label="Active weeks" hint="Labour uses this. Rent allocation always uses 52 weeks." value={inputs.weeksPerYear} onChange={(value) => setInput("weeksPerYear", value)} error={error("weeksPerYear")} />
          <NumberField id="rent" label="Business rent per week" hint="Household rent of $450 a week would be paid anyway and is not charged here. Leave this at $0 unless you choose to allocate some rent to the nursery." value={inputs.businessRentPerWeek} onChange={(value) => setInput("businessRentPerWeek", value)} error={error("businessRentPerWeek")} />
        </div>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Monthly sales timing</h2>
        <p className="note mt-1">Weights are scaled to 100%. The default piles sales into the winter tube season and spring pots. It is illustrative.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MONTH_LABELS.map((label, index) => (
            <NumberField
              key={label}
              id={`month-${index}`}
              label={label}
              value={inputs.monthlySalesWeights[index] ?? Number.NaN}
              onChange={(value) => {
                const next = [...inputs.monthlySalesWeights];
                next[index] = value;
                setInput("monthlySalesWeights", next);
              }}
              error={error(`monthlySalesWeights.${index}`) ?? (index === 0 ? error("monthlySalesWeights") : undefined)}
            />
          ))}
        </div>
      </section>
    </form>
  );
}
