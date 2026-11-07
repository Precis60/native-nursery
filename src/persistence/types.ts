import type { ScenarioInput } from "../domain/model.ts";

export type ScenarioSource =
  | { kind: "new" }
  | { kind: "local"; id: string }
  | { kind: "cloud"; id: string };

export type DraftRecord = {
  name: string;
  inputs: ScenarioInput;
  source: ScenarioSource;
};

export type SavedScenario = {
  id: string;
  name: string;
  inputs: ScenarioInput;
  createdAt: string;
  updatedAt: string;
};

export type ScenarioStore = {
  list(): Promise<SavedScenario[]>;
  create(name: string, inputs: ScenarioInput): Promise<SavedScenario>;
  update(id: string, name: string, inputs: ScenarioInput): Promise<SavedScenario>;
  rename(id: string, name: string): Promise<SavedScenario>;
  delete(id: string): Promise<void>;
};

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

export function validateScenarioName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a scenario name.";
  if (trimmed.length > 120) return "Use a name of 120 characters or fewer.";
  return null;
}

export function publicError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Something went wrong saving that scenario.";
  if (/service_role|secret|bearer|password|apikey|api_key|jwt/i.test(raw)) {
    return "The request was rejected. Check that you are signed in, then try again.";
  }
  return raw.slice(0, 240);
}
