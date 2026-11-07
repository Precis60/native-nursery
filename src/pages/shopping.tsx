import { useState } from "react";
import { KIT_PRESETS } from "../domain/defaults.ts";
import { formatAud } from "../domain/format.ts";
import { OWNED_140MM_POTS } from "../domain/species.ts";
import {
  CLASS_LABEL,
  DAY_ONE,
  FULL_SCALE,
  PRICE_CHECKED,
  QUOTE_NEEDED,
  classifyLines,
  lineIncluded,
  type ShopLine,
  type ShoppingChoice,
} from "../domain/shopping.ts";
import { usePlanner } from "../state/planner-context.tsx";

export function ShoppingPage() {
  const { draft, setInputs } = usePlanner();
  const [list, setList] = useState<"day" | "full">("full");
  const [includeTank, setIncludeTank] = useState(false);
  const [includeCanWait, setIncludeCanWait] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const lines = list === "day" ? DAY_ONE : FULL_SCALE;
  const choice: ShoppingChoice = { includeCanWait: list === "full" && includeCanWait, includeTank: list === "full" && includeTank };
  const amounts: Record<string, number> = {};
  let editError = false;
  for (const line of lines) {
    const raw = edits[`${list}:${line.id}`];
    if (raw == null || raw.trim() === "") {
      if (line.amount != null) amounts[line.id] = line.amount;
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) editError = true;
    else amounts[line.id] = value;
  }
  const totals = classifyLines(lines, amounts, choice);
  const rough = list === "day" ? KIT_PRESETS.starter.publishedRoughTotal : includeTank ? KIT_PRESETS.tank.publishedRoughTotal : KIT_PRESETS.full.publishedRoughTotal;

  function applySelection(useEdits: boolean) {
    if (useEdits && editError) {
      setMessage("Fix the edited prices before applying them. Use a blank field to keep the listed price.");
      return;
    }
    const applied = classifyLines(lines, useEdits ? amounts : {}, choice);
    setInputs(
      {
        ...draft.inputs,
        purchasedSeedAllowance: applied.seed,
        oneOffEquipment: applied.equipment,
        reusableContainers: applied.containers,
        growingConsumables: applied.consumables,
      },
      true,
    );
    setMessage(
      `Scenario now uses ${formatAud(applied.total, 2)} from the ticked lines: ${formatAud(applied.equipment, 2)} equipment, ${formatAud(applied.containers, 2)} containers, ${formatAud(applied.consumables, 2)} consumables and ${formatAud(applied.seed, 2)} seed. The earlier ${formatAud(rough)} figure is only a rough reference. Quotes were left unchanged.`,
    );
  }

  function applyQuotes() {
    const entered = QUOTE_NEEDED.map((item) => quotes[item.id] ?? "").filter((value) => value.trim() !== "");
    if (entered.length === 0) {
      setInputs({ ...draft.inputs, quoteNeededCash: null }, true);
      setMessage("Quote-needed items are excluded from the scenario. They are not recorded as $0.");
      return;
    }
    if (entered.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)) {
      setMessage("Quote amounts need to be zero or a positive number. Leave a row blank to keep it out.");
      return;
    }
    const total = entered.reduce((sum, value) => sum + Number(value), 0);
    setInputs({ ...draft.inputs, quoteNeededCash: total }, true);
    setMessage(`Quote-needed cash is now ${formatAud(total, 2)}. Blank rows stayed out of that total.`);
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Shopping reference</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Shelf prices checked {PRICE_CHECKED}. GST follows each listing, so the kit is a cash outlay estimate rather than a pure ex-GST cost. The planner’s trading prices are ex GST. {OWNED_140MM_POTS} × 140 mm pots are already owned and are not priced.
        </p>
      </header>
      {message ? <div className="callout" role="status">{message}</div> : null}
      <section className="panel">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Shopping list">
          <button className="chip" type="button" aria-pressed={list === "day"} onClick={() => setList("day")}>
            Day-one
          </button>
          <button className="chip" type="button" aria-pressed={list === "full"} onClick={() => setList("full")}>
            Full scale
          </button>
        </div>
        {list === "full" ? (
          <div className="mt-3 grid gap-2">
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={includeCanWait} onChange={(event) => setIncludeCanWait(event.target.checked)} />
              Include lines marked can wait
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={includeTank} onChange={(event) => setIncludeTank(event.target.checked)} />
              Include the 5,000 L tank
            </label>
          </div>
        ) : null}
        <p className="note mt-3">
          Selected total {formatAud(totals.total, 2)}: equipment {formatAud(totals.equipment, 2)}, containers {formatAud(totals.containers, 2)}, consumables {formatAud(totals.consumables, 2)}, seed {formatAud(totals.seed, 2)}. Earlier rough reference {formatAud(rough)}. Can-wait lines and the tank stay out until you tick them. A missing quote is not $0.
        </p>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">{list === "day" ? "Day-one shopping list" : "Full-scale shopping list"}</caption>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>GST</th>
                <th className="num">Line</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <ShopRow key={line.id} line={line} list={list} edits={edits} setEdits={setEdits} included={lineIncluded(line, choice)} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-semibold">Selected total {formatAud(totals.total, 2)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" type="button" onClick={() => applySelection(false)}>
            Use listed prices for ticked lines
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => applySelection(true)}>
            Use edited prices for ticked lines
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Still quote-needed</h2>
        <p className="note mt-1">These stay out of the kit. A blank row is excluded. It is not costed at $0 and it is not given a guessed full price.</p>
        <ul className="mt-3 grid gap-3">
          {QUOTE_NEEDED.map((item) => (
            <li key={item.id} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
              <div>
                <p className="font-semibold">
                  {item.href ? (
                    <a className="underline" href={item.href}>
                      {item.item}
                    </a>
                  ) : (
                    item.item
                  )}
                </p>
                <p className="note">{item.note}</p>
              </div>
              <label className="field" htmlFor={`quote-${item.id}`}>
                <span className="sr-only">Your quote for {item.item}</span>
                <input
                  id={`quote-${item.id}`}
                  inputMode="decimal"
                  placeholder="Your quote"
                  value={quotes[item.id] ?? ""}
                  onChange={(event) => setQuotes((current) => ({ ...current, [item.id]: event.target.value }))}
                />
              </label>
            </li>
          ))}
        </ul>
        <button className="btn btn-secondary mt-3" type="button" onClick={applyQuotes}>
          Apply quotes to the scenario
        </button>
      </section>
    </div>
  );
}

function ShopRow({
  line,
  list,
  edits,
  setEdits,
  included,
}: {
  line: ShopLine;
  list: string;
  edits: Record<string, string>;
  setEdits: (value: Record<string, string> | ((current: Record<string, string>) => Record<string, string>)) => void;
  included: boolean;
}) {
  const key = `${list}:${line.id}`;
  return (
    <tr>
      <th scope="row">
        {line.href ? (
          <a className="underline" href={line.href}>
            {line.item}
          </a>
        ) : (
          line.item
        )}
        <span className="mt-1 block font-normal text-muted">
          {CLASS_LABEL[line.costClass]}
          {line.canWait ? " · Can wait" : ""}
          {line.optional ? " · Tank only" : ""}
          {included ? "" : " · Excluded"}
          {" · "}
          {line.supplier}
        </span>
      </th>
      <td>{line.qty}</td>
      <td>{line.unit}</td>
      <td>{line.gst}</td>
      <td className="num">
        <label className="sr-only" htmlFor={key}>
          Line price for {line.item}
        </label>
        <input
          id={key}
          className="w-28 rounded-lg border border-line bg-white px-2 py-2 text-right"
          inputMode="decimal"
          value={edits[key] ?? (line.amount == null ? "" : String(line.amount))}
          onChange={(event) => setEdits((current) => ({ ...current, [key]: event.target.value }))}
        />
      </td>
    </tr>
  );
}
