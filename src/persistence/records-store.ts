import type { SupabaseClient } from "@supabase/supabase-js";
import {
  coerceBatch,
  coerceExpense,
  coerceFlags,
  coerceLabour,
  coerceOrder,
  coerceRecords,
  coerceSale,
  emptyRecords,
  type RecordsState,
} from "../domain/records.ts";
import type { KeyValueStore } from "./local-store.ts";
import { publicError, StoreError } from "./types.ts";

export const RECORDS_KEY = "native-nursery.records.v1";
export const RECORDS_TABLE = "native_nursery_records";

export type EntryKind = "sale" | "expense" | "batch" | "order" | "labour";
export type RecordKind = EntryKind | "state";

export const ENTRY_KINDS: EntryKind[] = ["sale", "expense", "batch", "order", "labour"];

export type RemoteRecord = {
  kind: RecordKind;
  id: string;
  payload: unknown;
  updatedAt: string;
};

export function loadRecords(store: KeyValueStore): { records: RecordsState; warning: string | null } {
  const raw = store.getItem(RECORDS_KEY);
  if (!raw) return { records: emptyRecords(), warning: null };
  try {
    return { records: coerceRecords(JSON.parse(raw)), warning: null };
  } catch {
    store.setItem(`${RECORDS_KEY}.unreadable`, raw);
    store.removeItem(RECORDS_KEY);
    return {
      records: emptyRecords(),
      warning:
        "Recorded sales, costs and batches in this browser could not be read, so an empty ledger is open. The unreadable copy was kept aside in this browser.",
    };
  }
}

export function saveRecords(store: KeyValueStore, records: RecordsState): void {
  store.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function entryList(records: RecordsState, kind: EntryKind): { id: string; updatedAt: string }[] {
  switch (kind) {
    case "sale":
      return records.sales;
    case "expense":
      return records.expenses;
    case "batch":
      return records.batches;
    case "order":
      return records.orders;
    case "labour":
      return records.labour;
  }
}

function upsertById<T extends { id: string; updatedAt: string }>(list: T[], entry: T): T[] {
  const index = list.findIndex((item) => item.id === entry.id);
  if (index < 0) return [...list, entry];
  const current = list[index];
  if (current && current.updatedAt > entry.updatedAt) return list;
  const next = [...list];
  next[index] = entry;
  return next;
}

/**
 * Merge remote rows into the local ledger. Newer updatedAt wins per entry.
 * Flag maps merge per key on their own timestamps. Returns the merged records
 * and the remote state-row id so the caller can keep updating that row.
 */
export function mergeRemoteRows(
  records: RecordsState,
  rows: RemoteRecord[],
): { records: RecordsState; stateRowId: string | null } {
  const next: RecordsState = {
    sales: [...records.sales],
    expenses: [...records.expenses],
    batches: [...records.batches],
    orders: [...records.orders],
    labour: [...records.labour],
    checklist: { ...records.checklist },
    purchases: { ...records.purchases },
  };
  let stateRowId: string | null = null;
  for (const row of rows) {
    switch (row.kind) {
      case "sale": {
        const sale = coerceSale({ ...(row.payload as object), id: row.id, updatedAt: row.updatedAt });
        if (sale) next.sales = upsertById(next.sales, sale);
        break;
      }
      case "expense": {
        const expense = coerceExpense({ ...(row.payload as object), id: row.id, updatedAt: row.updatedAt });
        if (expense) next.expenses = upsertById(next.expenses, expense);
        break;
      }
      case "batch": {
        const batch = coerceBatch({ ...(row.payload as object), id: row.id, updatedAt: row.updatedAt });
        if (batch) next.batches = upsertById(next.batches, batch);
        break;
      }
      case "order": {
        const order = coerceOrder({ ...(row.payload as object), id: row.id, updatedAt: row.updatedAt });
        if (order) next.orders = upsertById(next.orders, order);
        break;
      }
      case "labour": {
        const week = coerceLabour({ ...(row.payload as object), id: row.id, updatedAt: row.updatedAt });
        if (week) next.labour = upsertById(next.labour, week);
        break;
      }
      case "state": {
        stateRowId = row.id;
        const flags = coerceFlags(row.payload);
        for (const [key, done] of Object.entries(flags.checklist)) {
          const current = next.checklist[key];
          if (!current || current < done) next.checklist[key] = done;
        }
        for (const [key, flag] of Object.entries(flags.purchases)) {
          const current = next.purchases[key];
          if (!current || current.at < flag.at) next.purchases[key] = flag;
        }
        break;
      }
    }
  }
  return { records: next, stateRowId };
}

type RemoteRow = {
  id: string;
  user_id: string;
  kind: string;
  payload: unknown;
  created_at: string;
  updated_at: string;
};

type Result<T> = { data: T | null; error: { message: string } | null };

type Query = {
  select(columns: string): Query;
  insert(values: Record<string, unknown>): Query;
  upsert(values: Record<string, unknown>): Query;
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

type RecordsClient = { from(table: string): Query };

const COLUMNS = "id,user_id,kind,payload,created_at,updated_at";

function unwrap<T>(result: Result<T>, empty: string): T {
  if (result.error) throw new StoreError(publicError(new Error(result.error.message)));
  if (result.data == null) throw new StoreError(empty);
  return result.data;
}

export type RecordsRemoteStore = {
  listAll(): Promise<RemoteRecord[]>;
  upsert(kind: RecordKind, id: string, payload: Record<string, unknown>, updatedAt: string): Promise<void>;
  remove(kind: RecordKind, id: string): Promise<void>;
};

export function createSupabaseRecordsStore(client: SupabaseClient, getUserId: () => string | null): RecordsRemoteStore {
  const db = client as unknown as RecordsClient;
  const userId = () => {
    const id = getUserId();
    if (!id) throw new StoreError("Sign in before syncing records to your account.");
    return id;
  };
  return {
    async listAll() {
      const id = userId();
      const result = await db.from(RECORDS_TABLE).select(COLUMNS).eq("user_id", id).order("updated_at", { ascending: false });
      const rows = unwrap(result, "No records were returned.");
      return rows.map(
        (row): RemoteRecord => ({
          kind: (["sale", "expense", "batch", "order", "labour", "state"] as const).includes(row.kind as RecordKind)
            ? (row.kind as RecordKind)
            : "sale",
          id: row.id,
          payload: row.payload,
          updatedAt: row.updated_at,
        }),
      );
    },
    async upsert(kind, id, payload, updatedAt) {
      const owner = userId();
      const result = await db
        .from(RECORDS_TABLE)
        .upsert({ id, user_id: owner, kind, payload, updated_at: updatedAt })
        .select(COLUMNS);
      unwrap(result, "That record could not be saved to your account.");
    },
    async remove(kind, id) {
      const owner = userId();
      const result = await db.from(RECORDS_TABLE).delete().eq("id", id).eq("kind", kind).eq("user_id", owner).select(COLUMNS);
      unwrap(result, "That record could not be deleted.");
    },
  };
}
