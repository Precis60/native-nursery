import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Link } from "react-router-dom";
import { parseImport, serializeBundle } from "../domain/io.ts";
import { downloadText } from "../lib/download.ts";
import { usePlanner } from "../state/planner-context.tsx";
import type { SavedScenario } from "../persistence/types.ts";

export function LibraryPage() {
  const planner = usePlanner();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<{ where: "local" | "cloud"; scenario: SavedScenario } | null>(null);

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Scenarios</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Browser copies stay on this device. Account copies are available only after Supabase is connected and you sign in. Nothing here is a public sample of a private plan.
        </p>
      </header>
      {message ? (
        <div className="callout" role="status">
          {message}
        </div>
      ) : null}
      <section className="panel">
        <h2 className="font-serif text-2xl">This browser</h2>
        <p className="note mt-1">Not a private cloud save.</p>
        {planner.localScenarios.length === 0 ? (
          <p className="mt-3">No saved scenarios in this browser yet. The working draft is still on the planner.</p>
        ) : (
          <ScenarioList
            scenarios={planner.localScenarios}
            onOpen={(id) => planner.loadLocal(id)}
            onRename={(id, name) => planner.renameLocal(id, name).then(setMessage)}
            onDelete={(scenario) => setPending({ where: "local", scenario })}
          />
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() =>
              downloadText(
                "native-nursery-browser.json",
                serializeBundle(planner.localScenarios.map((item) => ({ name: item.name, inputs: item.inputs }))),
                "application/json",
              )
            }
          >
            Export browser JSON
          </button>
          <label className="btn btn-secondary">
            Import JSON
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void file.text().then(async (text) => {
                  const parsed = parseImport(text);
                  if ("error" in parsed) {
                    setMessage(parsed.error);
                    return;
                  }
                  const error = await planner.importLocal(parsed.scenarios);
                  setMessage(error ?? `Saved ${parsed.scenarios.length} scenario${parsed.scenarios.length === 1 ? "" : "s"} in this browser.`);
                });
              }}
            />
          </label>
        </div>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Your account</h2>
        {planner.cloudState === "off" ? <p className="mt-2">Supabase is not connected. {planner.configProblem ?? "Add the project URL and publishable key to use private saves."}</p> : null}
        {planner.cloudState === "signed-out" ? <p className="mt-2">Sign in on the Account page to load private scenarios.</p> : null}
        {planner.cloudState === "loading" ? <p className="mt-2">Loading your scenarios…</p> : null}
        {planner.cloudState === "error" ? (
          <p className="alert mt-2" role="alert">
            {planner.cloudError ?? "The account scenarios could not be loaded."}
          </p>
        ) : null}
        {planner.cloudState === "ready" && planner.cloudScenarios.length === 0 ? <p className="mt-2">No scenarios in your account yet.</p> : null}
        {planner.cloudScenarios.length > 0 ? (
          <ScenarioList
            scenarios={planner.cloudScenarios}
            onOpen={(id) => planner.loadCloud(id)}
            onRename={(id, name) => planner.renameCloud(id, name).then(setMessage)}
            onDelete={(scenario) => setPending({ where: "cloud", scenario })}
          />
        ) : null}
      </section>
      <p>
        <Link className="underline" to="/">
          Back to the planner
        </Link>
      </p>
      <Dialog.Root open={pending != null} onOpenChange={(open) => !open && setPending(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="dialog">
            <Dialog.Title className="font-serif text-2xl">Delete this scenario?</Dialog.Title>
            <Dialog.Description className="mt-2 text-muted" id="delete-copy">
              This removes “{pending?.scenario.name}” from {pending?.where === "cloud" ? "your account" : "this browser"}. The working draft stays.
            </Dialog.Description>
            <div className="mt-4 flex gap-2">
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => {
                  if (!pending) return;
                  const action = pending.where === "cloud" ? planner.deleteCloud(pending.scenario.id) : planner.deleteLocal(pending.scenario.id);
                  void action.then((error) => {
                    setMessage(error);
                    setPending(null);
                  });
                }}
              >
                Delete
              </button>
              <Dialog.Close className="btn btn-secondary" type="button">
                Keep
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function ScenarioList({
  scenarios,
  onOpen,
  onRename,
  onDelete,
}: {
  scenarios: SavedScenario[];
  onOpen: (id: string) => void;
  onRename: (id: string, name: string) => Promise<unknown>;
  onDelete: (scenario: SavedScenario) => void;
}) {
  const [names, setNames] = useState<Record<string, string>>({});
  return (
    <ul className="mt-3 grid gap-3">
      {scenarios.map((scenario) => (
        <li key={scenario.id} className="rounded-xl border border-line bg-white p-3">
          <p className="font-semibold">{scenario.name}</p>
          <p className="note">Updated {new Date(scenario.updatedAt).toLocaleString("en-AU")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="btn btn-primary" to="/" onClick={() => onOpen(scenario.id)}>
              Open
            </Link>
            <label className="field min-w-40 flex-1" htmlFor={`rename-${scenario.id}`}>
              <span className="sr-only">New name for {scenario.name}</span>
              <input
                id={`rename-${scenario.id}`}
                value={names[scenario.id] ?? scenario.name}
                onChange={(event) => setNames((current) => ({ ...current, [scenario.id]: event.target.value }))}
              />
            </label>
            <button className="btn btn-secondary" type="button" onClick={() => void onRename(scenario.id, names[scenario.id] ?? scenario.name)}>
              Rename
            </button>
            <button className="btn btn-danger" type="button" onClick={() => onDelete(scenario)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
