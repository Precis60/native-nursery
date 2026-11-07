import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  Batch,
  ChecklistFlags,
  ExpenseEntry,
  LabourWeek,
  NurseryOrder,
  PurchaseFlag,
  RecordsState,
  SaleEntry,
} from "../domain/records.ts";
import {
  createSupabaseRecordsStore,
  ENTRY_KINDS,
  entryList,
  loadRecords,
  mergeRemoteRows,
  saveRecords,
  type EntryKind,
  type RecordsRemoteStore,
} from "../persistence/records-store.ts";
import { memoryStore, type KeyValueStore } from "../persistence/local-store.ts";
import { publicError } from "../persistence/types.ts";
import { supabase } from "../lib/supabase.ts";
import { usePlanner } from "./planner-context.tsx";

export type SyncState = "local" | "syncing" | "synced" | "error";

type EntryOf<K extends EntryKind> = K extends "sale"
  ? SaleEntry
  : K extends "expense"
    ? ExpenseEntry
    : K extends "batch"
      ? Batch
      : K extends "order"
        ? NurseryOrder
        : LabourWeek;

type NewEntry<E> = Omit<E, "id" | "updatedAt"> & { id?: string };

type RecordsValue = {
  records: RecordsState;
  syncState: SyncState;
  syncError: string | null;
  warning: string | null;
  dismissWarning: () => void;
  saveEntry: <K extends EntryKind>(kind: K, entry: NewEntry<EntryOf<K>>) => EntryOf<K>;
  deleteEntry: (kind: EntryKind, id: string) => void;
  setChecklist: (key: string, done: boolean) => void;
  setPurchase: (key: string, flag: PurchaseFlag | null) => void;
  replaceRecords: (records: RecordsState) => void;
};

const RecordsContext = createContext<RecordsValue | null>(null);

function browserStorage(): KeyValueStore {
  return typeof localStorage === "undefined" ? memoryStore() : localStorage;
}

function removeById(records: RecordsState, kind: EntryKind, id: string): RecordsState {
  switch (kind) {
    case "sale":
      return { ...records, sales: records.sales.filter((item) => item.id !== id) };
    case "expense":
      return { ...records, expenses: records.expenses.filter((item) => item.id !== id) };
    case "batch":
      return { ...records, batches: records.batches.filter((item) => item.id !== id) };
    case "order":
      return { ...records, orders: records.orders.filter((item) => item.id !== id) };
    case "labour":
      return { ...records, labour: records.labour.filter((item) => item.id !== id) };
  }
}

function upsertLocal<E extends { id: string; updatedAt: string }>(list: E[], entry: E): E[] {
  const index = list.findIndex((item) => item.id === entry.id);
  if (index < 0) return [...list, entry];
  const next = [...list];
  next[index] = entry;
  return next;
}

function withEntry<E extends { id: string; updatedAt: string }>(records: RecordsState, kind: EntryKind, entry: E): RecordsState {
  switch (kind) {
    case "sale":
      return { ...records, sales: upsertLocal(records.sales, entry as unknown as SaleEntry) };
    case "expense":
      return { ...records, expenses: upsertLocal(records.expenses, entry as unknown as ExpenseEntry) };
    case "batch":
      return { ...records, batches: upsertLocal(records.batches, entry as unknown as Batch) };
    case "order":
      return { ...records, orders: upsertLocal(records.orders, entry as unknown as NurseryOrder) };
    case "labour":
      return { ...records, labour: upsertLocal(records.labour, entry as unknown as LabourWeek) };
  }
}

export function RecordsProvider({ children }: { children: ReactNode }) {
  const planner = usePlanner();
  const storage = useMemo(browserStorage, []);
  const opened = useMemo(() => loadRecords(storage), [storage]);
  const [records, setRecords] = useState<RecordsState>(opened.records);
  const [warning, setWarning] = useState<string | null>(opened.warning);
  const [syncState, setSyncState] = useState<SyncState>("local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const stateRowId = useRef<string | null>(null);
  const recordsRef = useRef(records);
  const userId = planner.userId;

  const persist = useCallback(
    (next: RecordsState) => {
      recordsRef.current = next;
      setRecords(next);
      saveRecords(storage, next);
    },
    [storage],
  );

  const remote = useCallback((): RecordsRemoteStore | null => {
    if (!supabase || !userId) return null;
    return createSupabaseRecordsStore(supabase, () => userId);
  }, [userId]);

  const push = useCallback(
    (action: (store: RecordsRemoteStore) => Promise<void>) => {
      const store = remote();
      if (!store) return;
      void action(store).catch((error: unknown) => {
        setSyncState("error");
        setSyncError(publicError(error));
      });
    },
    [remote],
  );

  const statePayload = useCallback(
    (source: RecordsState): Record<string, unknown> => ({
      checklist: source.checklist as ChecklistFlags,
      purchases: source.purchases as Record<string, PurchaseFlag>,
    }),
    [],
  );

  // Merge cloud rows into the local ledger on sign-in, then push up anything
  // the cloud is missing or holding an older copy of.
  useEffect(() => {
    if (!supabase || !userId) {
      setSyncState("local");
      stateRowId.current = null;
      return;
    }
    let alive = true;
    setSyncState("syncing");
    setSyncError(null);
    const store = createSupabaseRecordsStore(supabase, () => userId);
    void store
      .listAll()
      .then((rows) => {
        if (!alive) return;
        const remoteIds = new Map<string, string>();
        for (const row of rows) remoteIds.set(`${row.kind}:${row.id}`, row.updatedAt);
        const merged = mergeRemoteRows(recordsRef.current, rows);
        stateRowId.current = merged.stateRowId;
        persist(merged.records);
        const uploads: Promise<void>[] = [];
        for (const kind of ENTRY_KINDS) {
          for (const entry of entryList(merged.records, kind)) {
            const remoteStamp = remoteIds.get(`${kind}:${entry.id}`);
            if (!remoteStamp || remoteStamp < entry.updatedAt) {
              uploads.push(store.upsert(kind, entry.id, { ...entry } as Record<string, unknown>, entry.updatedAt));
            }
          }
        }
        if (!stateRowId.current) stateRowId.current = crypto.randomUUID();
        uploads.push(
          store.upsert("state", stateRowId.current, statePayload(merged.records), new Date().toISOString()),
        );
        void Promise.all(uploads).catch((error: unknown) => {
          if (alive) {
            setSyncState("error");
            setSyncError(publicError(error));
          }
        });
        if (alive) setSyncState("synced");
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setSyncState("error");
        setSyncError(publicError(error));
      });
    return () => {
      alive = false;
    };
  }, [userId, persist, statePayload]);

  const value = useMemo<RecordsValue>(
    () => ({
      records,
      syncState,
      syncError,
      warning,
      dismissWarning: () => setWarning(null),
      saveEntry: (kind, entry) => {
        const stamp = new Date().toISOString();
        const full = { ...entry, id: entry.id ?? crypto.randomUUID(), updatedAt: stamp } as EntryOf<typeof kind>;
        persist(withEntry(recordsRef.current, kind, full));
        push((store) => store.upsert(kind, full.id, { ...full } as Record<string, unknown>, stamp));
        return full;
      },
      deleteEntry: (kind, id) => {
        persist(removeById(recordsRef.current, kind, id));
        push((store) => store.remove(kind, id));
      },
      setChecklist: (key, done) => {
        const checklist = { ...recordsRef.current.checklist };
        if (done) checklist[key] = new Date().toISOString();
        else delete checklist[key];
        const next = { ...recordsRef.current, checklist };
        persist(next);
        if (!stateRowId.current) stateRowId.current = crypto.randomUUID();
        const rowId = stateRowId.current;
        push((store) => store.upsert("state", rowId, statePayload(next), new Date().toISOString()));
      },
      setPurchase: (key, flag) => {
        const purchases = { ...recordsRef.current.purchases };
        if (flag) purchases[key] = flag;
        else delete purchases[key];
        const next = { ...recordsRef.current, purchases };
        persist(next);
        if (!stateRowId.current) stateRowId.current = crypto.randomUUID();
        const rowId = stateRowId.current;
        push((store) => store.upsert("state", rowId, statePayload(next), new Date().toISOString()));
      },
      replaceRecords: (next) => {
        persist(next);
      },
    }),
    [persist, push, records, statePayload, syncError, syncState, warning],
  );

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords(): RecordsValue {
  const value = useContext(RecordsContext);
  if (!value) throw new Error("useRecords must be used inside RecordsProvider");
  return value;
}
