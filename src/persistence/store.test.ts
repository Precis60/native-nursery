import { describe, expect, it } from "vitest";
import { createDefaultInputs } from "../domain/defaults.ts";
import { createLocalScenarioStore, loadDraft, memoryStore, saveDraft } from "./local-store.ts";
import { createSupabaseScenarioStore, SCENARIO_TABLE } from "./supabase-store.ts";
import { publicError } from "./types.ts";
import type { ScenarioInput } from "../domain/model.ts";

describe("browser scenario store", () => {
  it("creates, renames, updates, lists and deletes without leaving the browser store", async () => {
    const storage = memoryStore();
    const store = createLocalScenarioStore(storage);
    const created = await store.create("Starter", createDefaultInputs());
    const renamed = await store.rename(created.id, "Starter renamed");
    expect(renamed.name).toBe("Starter renamed");
    const updated = await store.update(created.id, "Starter renamed", { ...createDefaultInputs(), salesTarget: 3500 });
    expect(updated.inputs.salesTarget).toBe(3500);
    expect(await store.list()).toHaveLength(1);
    await store.delete(created.id);
    expect(await store.list()).toEqual([]);
    await expect(store.delete(created.id)).rejects.toThrow(/no longer here/);
  });

  it("keeps a draft labelled as browser data and archives unreadable JSON", () => {
    const storage = memoryStore();
    saveDraft(storage, { name: "Desk", inputs: createDefaultInputs(), source: { kind: "new" } });
    expect(loadDraft(storage).draft.name).toBe("Desk");
    storage.setItem("native-nursery.draft.v1", "{");
    const recovered = loadDraft(storage);
    expect(recovered.warning).toMatch(/could not be read/);
    expect(recovered.draft.inputs.salesTarget).toBe(5000);
    expect(storage.getItem("native-nursery.draft.v1.unreadable")).toBe("{");
  });
});

type Row = {
  id: string;
  user_id: string;
  name: string;
  inputs: ScenarioInput;
  created_at: string;
  updated_at: string;
};

function fakeClient(seed: Row[] = []) {
  const rows = [...seed];
  const tables: string[] = [];
  class Query {
    private op: "select" | "insert" | "update" | "delete" = "select";
    private filters: { column: string; value: string }[] = [];
    private payload: Record<string, unknown> | null = null;
    private one = false;
    select() {
      return this;
    }
    insert(values: Record<string, unknown>) {
      this.op = "insert";
      this.payload = values;
      return this;
    }
    update(values: Record<string, unknown>) {
      this.op = "update";
      this.payload = values;
      return this;
    }
    delete() {
      this.op = "delete";
      return this;
    }
    eq(column: string, value: string) {
      this.filters.push({ column, value });
      return this;
    }
    order() {
      return this;
    }
    single() {
      this.one = true;
      return Promise.resolve(this.exec());
    }
    then(
      onfulfilled?:
        | ((value: { data: Row | Row[] | null; error: { message: string } | null }) => unknown)
        | null,
    ) {
      return Promise.resolve(this.exec()).then(onfulfilled ?? undefined);
    }
    private matches(row: Row) {
      return this.filters.every((filter) => String(row[filter.column as keyof Row]) === filter.value);
    }
    private exec(): { data: Row | Row[] | null; error: { message: string } | null } {
      if (this.op === "insert" && this.payload) {
        const row: Row = {
          id: crypto.randomUUID(),
          user_id: String(this.payload.user_id),
          name: String(this.payload.name),
          inputs: this.payload.inputs as ScenarioInput,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        rows.push(row);
        return { data: this.one ? row : [row], error: null };
      }
      const matched = rows.filter((row) => this.matches(row));
      if (this.op === "delete") {
        for (const row of matched) rows.splice(rows.indexOf(row), 1);
        return { data: matched, error: null };
      }
      if (this.op === "update" && this.payload) {
        const row = matched[0];
        if (!row) return { data: null, error: { message: "No rows" } };
        row.name = String(this.payload.name ?? row.name);
        row.inputs = (this.payload.inputs as ScenarioInput) ?? row.inputs;
        row.updated_at = String(this.payload.updated_at ?? new Date().toISOString());
        return { data: row, error: null };
      }
      const sorted = [...matched].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      return { data: this.one ? sorted[0] ?? null : sorted, error: null };
    }
  }
  return {
    rows,
    tables,
    from(table: string) {
      tables.push(table);
      if (table !== SCENARIO_TABLE) throw new Error(`unexpected table ${table}`);
      return new Query();
    },
  };
}

describe("account scenario store", () => {
  it("creates, lists, renames, updates and deletes only the signed-in user's rows", async () => {
    const client = fakeClient([
      {
        id: "other",
        user_id: "person-b",
        name: "Someone else",
        inputs: createDefaultInputs(),
        created_at: "2026-11-01T00:00:00.000Z",
        updated_at: "2026-11-01T00:00:00.000Z",
      },
    ]);
    const store = createSupabaseScenarioStore(client as never, () => "person-a");
    const created = await store.create("Mine", createDefaultInputs());
    expect(created.name).toBe("Mine");
    expect(client.tables.every((table) => table === SCENARIO_TABLE)).toBe(true);
    const listed = await store.list();
    expect(listed.map((item) => item.name)).toEqual(["Mine"]);
    await store.rename(created.id, "Mine renamed");
    await store.update(created.id, "Mine renamed", { ...createDefaultInputs(), salesTarget: 3500 });
    expect((await store.list())[0]?.inputs.salesTarget).toBe(3500);
    await store.delete(created.id);
    expect(await store.list()).toEqual([]);
    expect(client.rows.map((row) => row.user_id)).toEqual(["person-b"]);
    await expect(store.delete("other")).rejects.toThrow(/not in this sign-in/);
  });

  it("hides secrets from error text", () => {
    expect(publicError(new Error("permission denied, service_role key eyJhbGci"))).toMatch(/signed in/);
    expect(publicError(new Error("permission denied for table"))).toMatch(/permission denied/);
  });
});
