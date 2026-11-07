import { describe, expect, it } from "vitest";
import { keyLooksSecret } from "./supabase.ts";

function jwt(payload: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return `aaa.${encoded}.sig`;
}

describe("browser key guard", () => {
  it("accepts a publishable key and rejects a service role", () => {
    expect(keyLooksSecret("sb_publishable_example")).toBe(false);
    expect(keyLooksSecret(jwt({ role: "anon" }))).toBe(false);
    expect(keyLooksSecret("sb_secret_example")).toBe(true);
    expect(keyLooksSecret(jwt({ role: "service_role" }))).toBe(true);
    expect(keyLooksSecret("service_role_key")).toBe(true);
  });
});
