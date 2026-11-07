import { describe, expect, it } from "vitest";
import { memoryStore } from "../persistence/local-store.ts";
import { clearNurseryCache } from "./nursery-cache.ts";

describe("nursery cache", () => {
  it("removes draft, scenario and record copies", () => {
    const store = memoryStore();
    store.setItem("native-nursery.draft.v1", "{}");
    store.setItem("native-nursery.scenarios.v1", "[]");
    store.setItem("native-nursery.records.v1", "{}");
    clearNurseryCache(store);
    expect(store.getItem("native-nursery.draft.v1")).toBeNull();
    expect(store.getItem("native-nursery.scenarios.v1")).toBeNull();
    expect(store.getItem("native-nursery.records.v1")).toBeNull();
  });
});
