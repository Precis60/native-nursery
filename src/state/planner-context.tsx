import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { applyKit, type KitId } from "../domain/defaults.ts";
import type { PortableScenario } from "../domain/io.ts";
import { evaluate, type ModelResult, type ScenarioInput } from "../domain/model.ts";
import { createLocalScenarioStore, freshDraft, loadDraft, memoryStore, saveDraft, type KeyValueStore } from "../persistence/local-store.ts";
import { createSupabaseScenarioStore } from "../persistence/supabase-store.ts";
import { publicError, validateScenarioName, type DraftRecord, type SavedScenario } from "../persistence/types.ts";
import { supabase, supabaseConfig } from "../lib/supabase.ts";

type CloudState = "off" | "signed-out" | "loading" | "ready" | "error";

type PlannerValue = {
  draft: DraftRecord;
  dirty: boolean;
  warning: string | null;
  dismissWarning: () => void;
  result: ModelResult;
  formEpoch: number;
  setName: (name: string) => void;
  setInput: <K extends keyof ScenarioInput>(key: K, value: ScenarioInput[K]) => void;
  setInputs: (inputs: ScenarioInput, resetFields?: boolean) => void;
  applyPreset: (kitId: KitId) => void;
  localScenarios: SavedScenario[];
  saveLocal: (mode: "update" | "new") => Promise<string | null>;
  loadLocal: (id: string) => void;
  renameLocal: (id: string, name: string) => Promise<string | null>;
  deleteLocal: (id: string) => Promise<string | null>;
  cloudScenarios: SavedScenario[];
  cloudState: CloudState;
  cloudError: string | null;
  userEmail: string | null;
  userId: string | null;
  configured: boolean;
  configProblem: string | null;
  saveCloud: (mode: "update" | "new") => Promise<string | null>;
  loadCloud: (id: string) => void;
  renameCloud: (id: string, name: string) => Promise<string | null>;
  deleteCloud: (id: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
  newDraft: () => void;
  importLocal: (scenarios: PortableScenario[]) => Promise<string | null>;
};

const PlannerContext = createContext<PlannerValue | null>(null);

function browserStorage(): KeyValueStore {
  return typeof localStorage === "undefined" ? memoryStore() : localStorage;
}

export function PlannerProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(browserStorage, []);
  const localStore = useMemo(() => createLocalScenarioStore(storage), [storage]);
  const opened = useMemo(() => loadDraft(storage), [storage]);
  const [draft, setDraft] = useState<DraftRecord>(opened.draft);
  const [dirty, setDirty] = useState(false);
  const [warning, setWarning] = useState<string | null>(opened.warning);
  const [formEpoch, setFormEpoch] = useState(0);
  const [localScenarios, setLocalScenarios] = useState<SavedScenario[]>([]);
  const [cloudScenarios, setCloudScenarios] = useState<SavedScenario[]>([]);
  const [cloudState, setCloudState] = useState<CloudState>(supabase ? "loading" : "off");
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const result = useMemo(() => evaluate(draft.inputs), [draft.inputs]);

  const write = useCallback(
    (next: DraftRecord, options?: { dirty?: boolean; resetFields?: boolean }) => {
      setDraft(next);
      saveDraft(storage, next);
      setDirty(options?.dirty ?? true);
      if (options?.resetFields) setFormEpoch((value) => value + 1);
    },
    [storage],
  );

  const refreshLocal = useCallback(async () => {
    setLocalScenarios(await localStore.list());
  }, [localStore]);

  useEffect(() => {
    void refreshLocal();
  }, [refreshLocal]);

  const refreshCloud = useCallback(async (userId: string) => {
    if (!supabase) return;
    setCloudState("loading");
    setCloudError(null);
    try {
      const store = createSupabaseScenarioStore(supabase, () => userId);
      setCloudScenarios(await store.list());
      setCloudState("ready");
    } catch (error) {
      setCloudScenarios([]);
      setCloudError(publicError(error));
      setCloudState("error");
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) setCloudError(publicError(error));
      setSession(data.session);
      if (!data.session) setCloudState("signed-out");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setCloudScenarios([]);
        setCloudState("signed-out");
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const userId = session?.user.id;
    if (!userId) return;
    void refreshCloud(userId);
  }, [refreshCloud, session?.user.id]);

  const cloudStore = useCallback(() => {
    if (!supabase || !session?.user.id) throw new Error("Sign in before using account scenarios.");
    return createSupabaseScenarioStore(supabase, () => session.user.id);
  }, [session?.user.id]);

  const value = useMemo<PlannerValue>(() => {
    const userId = session?.user.id ?? null;
    return {
      draft,
      dirty,
      warning,
      dismissWarning: () => setWarning(null),
      result,
      formEpoch,
      configured: supabaseConfig.configured,
      configProblem: supabaseConfig.problem,
      userEmail: session?.user.email ?? null,
      userId,
      localScenarios,
      cloudScenarios,
      cloudState,
      cloudError,
      setName: (name) => write({ ...draft, name }),
      setInput: (key, field) => write({ ...draft, inputs: { ...draft.inputs, [key]: field } }),
      setInputs: (inputs, resetFields = false) => write({ ...draft, inputs }, { resetFields }),
      applyPreset: (kitId) => write({ ...draft, inputs: applyKit(draft.inputs, kitId) }, { resetFields: true }),
      saveLocal: async (mode) => {
        const problem = validateScenarioName(draft.name);
        if (problem) return problem;
        if (result.status === "invalid") return result.issues[0]?.message ?? "Fix the highlighted numbers before saving.";
        try {
          if (mode === "update" && draft.source.kind === "local") {
            await localStore.update(draft.source.id, draft.name, draft.inputs);
            setDirty(false);
          } else {
            const created = await localStore.create(draft.name, draft.inputs);
            write({ ...draft, source: { kind: "local", id: created.id } }, { dirty: false });
          }
          await refreshLocal();
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      loadLocal: (id) => {
        const found = localScenarios.find((item) => item.id === id);
        if (!found) return;
        write({ name: found.name, inputs: found.inputs, source: { kind: "local", id } }, { dirty: false, resetFields: true });
      },
      renameLocal: async (id, name) => {
        try {
          await localStore.rename(id, name);
          if (draft.source.kind === "local" && draft.source.id === id) write({ ...draft, name }, { dirty: false });
          await refreshLocal();
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      deleteLocal: async (id) => {
        try {
          await localStore.delete(id);
          if (draft.source.kind === "local" && draft.source.id === id) {
            write({ ...draft, source: { kind: "new" } }, { dirty: true });
          }
          await refreshLocal();
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      saveCloud: async (mode) => {
        const problem = validateScenarioName(draft.name);
        if (problem) return problem;
        if (!userId) return "Sign in on the Account page before saving to your account.";
        if (result.status === "invalid") return result.issues[0]?.message ?? "Fix the highlighted numbers before saving.";
        try {
          const store = cloudStore();
          if (mode === "update" && draft.source.kind === "cloud") {
            await store.update(draft.source.id, draft.name, draft.inputs);
            setDirty(false);
          } else {
            const created = await store.create(draft.name, draft.inputs);
            write({ ...draft, source: { kind: "cloud", id: created.id } }, { dirty: false });
          }
          await refreshCloud(userId);
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      loadCloud: (id) => {
        const found = cloudScenarios.find((item) => item.id === id);
        if (!found) return;
        write({ name: found.name, inputs: found.inputs, source: { kind: "cloud", id } }, { dirty: false, resetFields: true });
      },
      renameCloud: async (id, name) => {
        if (!userId) return "Sign in before renaming an account scenario.";
        try {
          const store = cloudStore();
          await store.rename(id, name);
          if (draft.source.kind === "cloud" && draft.source.id === id) write({ ...draft, name }, { dirty: false });
          await refreshCloud(userId);
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      deleteCloud: async (id) => {
        if (!userId) return "Sign in before deleting an account scenario.";
        try {
          const store = cloudStore();
          await store.delete(id);
          if (draft.source.kind === "cloud" && draft.source.id === id) {
            write({ ...draft, source: { kind: "new" } }, { dirty: true });
          }
          await refreshCloud(userId);
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
      signIn: async (email, password) => {
        if (!supabase) return supabaseConfig.problem ?? "Supabase is not connected.";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? publicError(error) : null;
      },
      signOut: async () => {
        if (!supabase) return null;
        const { error } = await supabase.auth.signOut();
        return error ? publicError(error) : null;
      },
      newDraft: () => write(freshDraft(), { dirty: false, resetFields: true }),
      importLocal: async (scenarios) => {
        if (scenarios.length === 0) return "The file has no scenarios.";
        try {
          let last: { id: string; name: string; inputs: ScenarioInput } | null = null;
          for (const scenario of scenarios) {
            const created = await localStore.create(scenario.name, scenario.inputs);
            last = { id: created.id, name: scenario.name, inputs: scenario.inputs };
          }
          await refreshLocal();
          if (last) {
            write({ name: last.name, inputs: last.inputs, source: { kind: "local", id: last.id } }, { dirty: false, resetFields: true });
          }
          return null;
        } catch (error) {
          return publicError(error);
        }
      },
    };
  }, [
    cloudError,
    cloudScenarios,
    cloudState,
    cloudStore,
    draft,
    dirty,
    formEpoch,
    localScenarios,
    localStore,
    refreshCloud,
    refreshLocal,
    result,
    session?.user.email,
    session?.user.id,
    warning,
    write,
  ]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerValue {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("usePlanner must be used inside PlannerProvider");
  return value;
}
