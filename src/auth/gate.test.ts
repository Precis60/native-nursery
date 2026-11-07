import { describe, expect, it } from "vitest";
import { gatePhase } from "./gate.ts";

describe("sign-in gate", () => {
  it("hides the planner until an allowlisted owner is confirmed", () => {
    expect(gatePhase({ configured: false, pending: false, signedIn: false, owner: null })).toBe("unavailable");
    expect(gatePhase({ configured: true, pending: true, signedIn: false, owner: null })).toBe("checking");
    expect(gatePhase({ configured: true, pending: false, signedIn: false, owner: null })).toBe("signed-out");
    expect(gatePhase({ configured: true, pending: false, signedIn: true, owner: false })).toBe("denied");
    expect(gatePhase({ configured: true, pending: false, signedIn: true, owner: null })).toBe("denied");
    expect(gatePhase({ configured: true, pending: false, signedIn: true, owner: true })).toBe("ready");
  });
});
