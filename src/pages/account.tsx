import { useState } from "react";
import { usePlanner } from "../state/planner-context.tsx";

export function AccountPage() {
  const planner = usePlanner();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.includes("@") || password.length < 8) {
      setMessage("Use an email address and a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    const error = await planner.signIn(email, password);
    setPassword("");
    setMessage(error);
    setBusy(false);
  }

  return (
    <div className="grid max-w-3xl gap-5">
      <header>
        <h1 className="font-serif text-4xl">Account</h1>
        <p className="mt-2 text-muted">
          The planner can be read without an account. Saved scenarios open only for the allowlisted nursery owner. This page has sign-in only. It does not register anyone, and the first account is not an admin. The browser uses the project URL and the publishable key. The service role key is not in this app.
        </p>
      </header>

      <section className="callout" role="status">
        <p className="font-semibold">Owner setup is still pending.</p>
        <p className="mt-2">
          The records table is already in the database. The owner allowlist is empty, so cloud save is not available.
          This page cannot create the owner or add anyone to the allowlist.
        </p>
      </section>

      {!planner.configured ? (
        <section className="callout" role="status">
          <p className="font-semibold">Supabase is not connected in this build.</p>
          <p className="mt-2">
            {planner.configProblem ??
              "A production build needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Until then every save stays in this browser and is labelled that way."}
          </p>
        </section>
      ) : null}

      {planner.cloudState === "loading" && !planner.userEmail ? <p>Checking the saved session…</p> : null}

      {planner.userEmail ? (
        <section className="panel">
          <p>
            Signed in as <strong>{planner.userEmail}</strong>
          </p>
          <button
            className="btn btn-secondary mt-3"
            type="button"
            onClick={() => void planner.signOut().then((error) => setMessage(error))}
          >
            Sign out
          </button>
        </section>
      ) : (
        <form
          className="panel grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label className="field" htmlFor="email">
            <span>Email</span>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="field" htmlFor="password">
            <span>Password</span>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit" disabled={busy || !planner.configured}>
              Sign in
            </button>
          </div>
          <p className="note">
            There is no public registration here. The database allowlist is a server-side list of auth user ids. It is not profile metadata, and the first account to sign up is not added automatically. Email links use PKCE and return to this site’s path, without the hash.
          </p>
        </form>
      )}

      {message ? (
        <div className="callout" role="status">
          {message}
        </div>
      ) : null}
      {planner.cloudError ? (
        <div className="callout bad" role="alert">
          {planner.cloudError}
        </div>
      ) : null}
    </div>
  );
}
