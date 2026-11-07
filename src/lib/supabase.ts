import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function keyLooksSecret(key: string): boolean {
  const lower = key.toLowerCase();
  if (lower.includes("service_role") || lower.startsWith("sb_secret")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { role?: string };
    return json.role === "service_role";
  } catch {
    return false;
  }
}

const url = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

export const supabaseConfig: { configured: boolean; problem: string | null } = (() => {
  if (!url && !key) return { configured: false, problem: null };
  if (!url || !key) return { configured: false, problem: "Set both the project URL and the publishable key." };
  if (!url.startsWith("https://")) return { configured: false, problem: "The project URL needs to start with https://." };
  if (keyLooksSecret(key)) {
    return { configured: false, problem: "That key is a secret. Use the publishable key in the browser, never the service role." };
  }
  return { configured: true, problem: null };
})();

export const supabase: SupabaseClient | null = supabaseConfig.configured
  ? createClient(url, key, {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function authRedirectUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}
