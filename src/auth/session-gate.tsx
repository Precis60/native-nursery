import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { gatePhase, type GatePhase } from "./gate.ts";
import { clearNurseryCache } from "../lib/nursery-cache.ts";
import { supabase, supabaseConfig } from "../lib/supabase.ts";

let signOutNotice: string | null = null;

export function rememberSignOutNotice(message: string | null) {
  signOutNotice = message;
}

export function SessionGate({ children }: { children: (userId: string) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState(true);
  const [owner, setOwner] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setPending(false);
      return;
    }
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      if (!data.session) {
        clearNurseryCache();
        setNotice(signOutNotice);
        signOutNotice = null;
        setPending(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setOwner(null);
      if (!next) {
        clearNurseryCache();
        setNotice(signOutNotice);
        signOutNotice = null;
        setPending(false);
      } else {
        setPending(true);
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    let alive = true;
    setPending(true);
    void supabase.rpc("native_nursery_session_is_owner").then(({ data, error }) => {
      if (!alive) return;
      setOwner(!error && data === true);
      setFormError(error ? "The owner check failed. The planner stays closed." : null);
      setPending(false);
    });
    return () => {
      alive = false;
    };
  }, [session]);

  const phase: GatePhase = gatePhase({
    configured: supabaseConfig.configured,
    pending: supabaseConfig.configured && (pending || (Boolean(session) && owner == null)),
    signedIn: Boolean(session),
    owner,
  });

  async function signIn() {
    if (!supabase) return;
    if (!email.includes("@") || password.length < 8) {
      setFormError("Use an email address and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPassword("");
    setFormError(error ? "Sign-in failed. Check the email and password." : null);
    setBusy(false);
  }

  if (phase === "ready" && session) return children(session.user.id);

  return (
    <main id="content" className="mx-auto grid w-full max-w-lg gap-4 px-4 py-10">
      <h1 className="font-serif text-4xl text-olive">Native Nursery</h1>
      {phase === "checking" ? <p role="status">Checking your sign-in…</p> : null}
      {phase === "unavailable" ? (
        <section className="callout" role="status">
          <p className="font-semibold">Sign-in is not available in this build.</p>
          <p className="mt-2">The planner opens only for the allowlisted owner. There is no browser-only copy.</p>
        </section>
      ) : null}
      {phase === "denied" ? (
        <section className="callout bad" role="alert">
          <p className="font-semibold">This sign-in is not the nursery owner.</p>
          <p className="mt-2">Signing in does not grant access, and this page cannot register an owner.</p>
          {formError ? <p className="mt-2">{formError}</p> : null}
          <button className="btn btn-secondary mt-3" type="button" onClick={() => void supabase?.auth.signOut()}>
            Sign out
          </button>
        </section>
      ) : null}
      {phase === "signed-out" ? (
        <form
          className="panel grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn();
          }}
        >
          <p>Sign in as the nursery owner to open the planner. There is no public registration.</p>
          {notice ? (
            <p className="callout" role="status">
              {notice} The copy on this browser was removed.
            </p>
          ) : null}
          <label className="field" htmlFor="gate-email">
            <span>Email</span>
            <input id="gate-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field" htmlFor="gate-password">
            <span>Password</span>
            <input
              id="gate-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {formError ? <p className="alert">{formError}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Sign in
          </button>
        </form>
      ) : null}
    </main>
  );
}
