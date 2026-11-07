import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScenarioInput } from "../domain/model.ts";
import { coerceInputs } from "../domain/io.ts";
import type { SavedScenario, ScenarioStore } from "./types.ts";
import { StoreError, publicError, validateScenarioName } from "./types.ts";

export const SCENARIO_TABLE = "native_nursery_scenarios";
const COLUMNS = "id,user_id,name,inputs,created_at,updated_at";

type RemoteRow = {
  id: string;
  user_id: string;
  name: string;
  inputs: unknown;
  created_at: string;
  updated_at: string;
};

type Result<T> = { data: T | null; error: { message: string } | null };

type Query = {
  select(columns: string): Query;
  insert(values: Record<string, unknown>): Query;
  update(values: Record<string, unknown>): Query;
  delete(): Query;
  eq(column: string, value: string): Query;
  order(column: string, options: { ascending: boolean }): Query;
  single(): Promise<Result<RemoteRow>>;
  then<TResult1 = Result<RemoteRow[]>, TResult2 = never>(
    onfulfilled?: ((value: Result<RemoteRow[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
};

type ScenarioClient = { from(table: string): Query };

function toSaved(row: RemoteRow): SavedScenario {
  const inputs = coerceInputs(row.inputs);
  if (!inputs) throw new StoreError("A saved scenario was missing its numbers.");
  return {
    id: row.id,
    name: row.name,
    inputs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function unwrap<T>(result: Result<T>, empty: string): T {
  if (result.error) throw new StoreError(publicError(new Error(result.error.message)));
  if (result.data == null) throw new StoreError(empty);
  return result.data;
}

export function createSupabaseScenarioStore(client: SupabaseClient, getUserId: () => string | null): ScenarioStore {
  const db = client as unknown as ScenarioClient;
  const userId = () => {
    const id = getUserId();
    if (!id) throw new StoreError("Sign in before using account scenarios.");
    return id;
  };
  return {
    async list() {
      const id = userId();
      const result = await db.from(SCENARIO_TABLE).select(COLUMNS).eq("user_id", id).order("updated_at", { ascending: false });
      return unwrap(result, "No scenarios were returned.").map(toSaved);
    },
    async create(name, inputs) {
      const problem = validateScenarioName(name);
      if (problem) throw new StoreError(problem);
      const id = userId();
      const result = await db
        .from(SCENARIO_TABLE)
        .insert({ user_id: id, name: name.trim(), inputs })
        .select(COLUMNS)
        .single();
      const row = unwrap(result, "The scenario was not returned after saving.");
      if (row.user_id !== id) throw new StoreError("The saved scenario did not belong to this account.");
      return toSaved(row);
    },
    async update(id, name, inputs) {
      const problem = validateScenarioName(name);
      if (problem) throw new StoreError(problem);
      const owner = userId();
      const result = await db
        .from(SCENARIO_TABLE)
        .update({ name: name.trim(), inputs, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", owner)
        .select(COLUMNS)
        .single();
      return toSaved(unwrap(result, "That account scenario could not be updated. It may belong to another sign-in."));
    },
    async rename(id, name) {
      const owner = userId();
      const existing = await db.from(SCENARIO_TABLE).select(COLUMNS).eq("id", id).eq("user_id", owner).single();
      const row = unwrap(existing, "That account scenario is not in this sign-in.");
      return this.update(id, name, toSaved(row).inputs);
    },
    async delete(id) {
      const owner = userId();
      const result = await db.from(SCENARIO_TABLE).delete().eq("id", id).eq("user_id", owner).select(COLUMNS);
      const rows = unwrap(result, "That account scenario could not be deleted.");
      if (rows.length === 0) throw new StoreError("That account scenario is not in this sign-in.");
    },
  };
}

export type { ScenarioInput };
