import { useState } from "react";
import { evaluate } from "../domain/model.ts";
import { formatAud, formatUnits } from "../domain/format.ts";
import { usePlanner } from "../state/planner-context.tsx";

type Column = { key: string; label: string; result: ReturnType<typeof evaluate> };

export function ComparePage() {
  const { draft, result, localScenarios, cloudScenarios } = usePlanner();
  const columns: Column[] = [
    { key: "draft", label: `Working draft · ${draft.name}`, result },
    ...localScenarios.map((item) => ({ key: `local:${item.id}`, label: `This browser · ${item.name}`, result: evaluate(item.inputs) })),
    ...cloudScenarios.map((item) => ({ key: `cloud:${item.id}`, label: `Account · ${item.name}`, result: evaluate(item.inputs) })),
  ];
  const [selected, setSelected] = useState<string[]>(["draft"]);
  const chosen = columns.filter((column) => selected.includes(column.key)).slice(0, 4);

  function toggle(key: string) {
    setSelected((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= 4) return current;
      return [...current, key];
    });
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Compare</h1>
        <p className="mt-2 text-muted">Up to four scenarios. Account rows appear after you sign in. Browser rows never leave this browser.</p>
      </header>
      {columns.length < 2 ? (
        <div className="callout">Save another scenario to put a second column beside the working draft.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => (
            <button key={column.key} className="chip" type="button" aria-pressed={selected.includes(column.key)} onClick={() => toggle(column.key)}>
              {column.label}
            </button>
          ))}
        </div>
      )}
      {chosen.length === 0 ? (
        <p>Select a scenario to see its results.</p>
      ) : (
        <section className="panel">
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">Scenario comparison</caption>
              <thead>
                <tr>
                  <th>Measure</th>
                  {chosen.map((column) => (
                    <th key={column.key} className="num">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="Revenue" values={chosen.map((column) => money(column.result.revenueExGst))} />
                <Row label="Saleable plants" values={chosen.map((column) => units(column.result.saleableRequired))} />
                <Row label="Cash operating profit" values={chosen.map((column) => money(column.result.operatingProfitBeforeOwnerLabour))} />
                <Row label="After owner labour" values={chosen.map((column) => money(column.result.operatingProfitAfterOwnerLabour))} />
                <Row label="Cash after equipment" values={chosen.map((column) => money(column.result.cashMovementAfterCapex))} />
                <Row label="Gap to $40,000" values={chosen.map((column) => money(column.result.gapToProfitGoalBeforeOwnerLabour))} />
                <Row
                  label="Operating break-even"
                  values={chosen.map((column) =>
                    column.result.breakEven?.status === "solved"
                      ? `${formatUnits(column.result.breakEven.operatingSalesUnits ?? 0)} sales`
                      : "Not a sales quantity",
                  )}
                />
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function money(value: number | null): string {
  return value == null ? "—" : formatAud(value);
}

function units(value: number | null): string {
  return value == null ? "—" : formatUnits(value);
}

function Row({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="num">
          {value}
        </td>
      ))}
    </tr>
  );
}
