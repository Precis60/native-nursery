import { DRAFT_KEY, SCENARIO_KEY, type KeyValueStore } from "../persistence/local-store.ts";
import { RECORDS_KEY } from "../persistence/records-store.ts";

const PREFIX = "native-nursery.";

export function clearNurseryCache(store?: KeyValueStore): void {
  const known = [DRAFT_KEY, SCENARIO_KEY, RECORDS_KEY, `${DRAFT_KEY}.unreadable`, `${SCENARIO_KEY}.unreadable`, `${RECORDS_KEY}.unreadable`];
  for (const key of known) store?.removeItem(key);
  if (typeof localStorage === "undefined") return;
  const found: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(PREFIX)) found.push(key);
  }
  for (const key of found) localStorage.removeItem(key);
}
