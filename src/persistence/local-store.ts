import { createDefaultInputs, DEFAULT_SCENARIO_NAME } from "../domain/defaults.ts";
import { coerceInputs } from "../domain/io.ts";
import type { DraftRecord, SavedScenario, ScenarioStore } from "./types.ts";
import { StoreError, validateScenarioName } from "./types.ts";

export const DRAFT_KEY = "native-nursery.draft.v1";
export const SCENARIO_KEY = "native-nursery.scenarios.v1";

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export function freshDraft(): DraftRecord {
  return { name: DEFAULT_SCENARIO_NAME, inputs: createDefaultInputs(), source: { kind: "new" } };
}

function readRaw(store: KeyValueStore, key: string): { value: unknown; corrupt: boolean } {
  const raw = store.getItem(key);
  if (!raw) return { value: null, corrupt: false };
  try {
    return { value: JSON.parse(raw) as unknown, corrupt: false };
  } catch {
    store.setItem(`${key}.unreadable`, raw);
    store.removeItem(key);
    return { value: null, corrupt: true };
  }
}

export function draftKey(userId: string): string {
  return `native-nursery.draft.${userId}`;
}

export function loadDraft(store: KeyValueStore, key = DRAFT_KEY): { draft: DraftRecord; warning: string | null } {
  const { value, corrupt } = readRaw(store, key);
  if (corrupt) {
    return { draft: freshDraft(), warning: "A draft in this browser could not be read. A fresh planning draft is open. The unreadable copy was kept aside in this browser." };
  }
  if (!value || typeof value !== "object") return { draft: freshDraft(), warning: null };
  const record = value as Partial<DraftRecord>;
  const inputs = coerceInputs(record.inputs);
  if (!inputs) {
    return { draft: freshDraft(), warning: "The browser draft was incomplete, so a fresh planning draft is open." };
  }
  const name = typeof record.name === "string" && record.name.trim() ? record.name.slice(0, 120) : DEFAULT_SCENARIO_NAME;
  const source = record.source;
  const safeSource =
    source && source.kind === "local" && typeof source.id === "string"
      ? source
      : source && source.kind === "cloud" && typeof source.id === "string"
        ? source
        : { kind: "new" as const };
  return { draft: { name, inputs, source: safeSource }, warning: null };
}

export function saveDraft(store: KeyValueStore, draft: DraftRecord, key = DRAFT_KEY): void {
  store.setItem(key, JSON.stringify(draft));
}

function readScenarios(store: KeyValueStore): SavedScenario[] {
  const { value } = readRaw(store, SCENARIO_KEY);
  if (!Array.isArray(value)) return [];
  const scenarios: SavedScenario[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SavedScenario>;
    const inputs = coerceInputs(row.inputs);
    if (!inputs || typeof row.id !== "string" || typeof row.name !== "string") continue;
    scenarios.push({
      id: row.id,
      name: row.name,
      inputs,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : now(),
      updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now(),
    });
  }
  return scenarios;
}

function writeScenarios(store: KeyValueStore, scenarios: SavedScenario[]) {
  store.setItem(SCENARIO_KEY, JSON.stringify(scenarios));
}

export function createLocalScenarioStore(store: KeyValueStore): ScenarioStore {
  return {
    async list() {
      return readScenarios(store).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async create(name, inputs) {
      const problem = validateScenarioName(name);
      if (problem) throw new StoreError(problem);
      const stamp = now();
      const scenario: SavedScenario = { id: newId(), name: name.trim(), inputs, createdAt: stamp, updatedAt: stamp };
      writeScenarios(store, [scenario, ...readScenarios(store)]);
      return scenario;
    },
    async update(id, name, inputs) {
      const problem = validateScenarioName(name);
      if (problem) throw new StoreError(problem);
      const scenarios = readScenarios(store);
      const index = scenarios.findIndex((item) => item.id === id);
      if (index < 0) throw new StoreError("That browser scenario is no longer here.");
      const current = scenarios[index];
      if (!current) throw new StoreError("That browser scenario is no longer here.");
      const next: SavedScenario = { ...current, name: name.trim(), inputs, updatedAt: now() };
      scenarios[index] = next;
      writeScenarios(store, scenarios);
      return next;
    },
    async rename(id, name) {
      const scenarios = readScenarios(store);
      const current = scenarios.find((item) => item.id === id);
      if (!current) throw new StoreError("That browser scenario is no longer here.");
      return this.update(id, name, current.inputs);
    },
    async delete(id) {
      const scenarios = readScenarios(store);
      if (!scenarios.some((item) => item.id === id)) throw new StoreError("That browser scenario is no longer here.");
      writeScenarios(store, scenarios.filter((item) => item.id !== id));
    },
  };
}

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}
