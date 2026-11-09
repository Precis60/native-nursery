import { useEffect } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AccountPage } from "./pages/account.tsx";
import { BatchesPage } from "./pages/batches.tsx";
import { CalendarPage } from "./pages/calendar.tsx";
import { ComparePage } from "./pages/compare.tsx";
import { CostsPage } from "./pages/costs.tsx";
import { DashboardPage } from "./pages/dashboard.tsx";
import { LibraryPage } from "./pages/library.tsx";
import { PlannerPage } from "./pages/planner.tsx";
import { SalesPage } from "./pages/sales.tsx";
import { ShoppingPage } from "./pages/shopping.tsx";
import { SpeciesPage } from "./pages/species.tsx";
import { rememberSignOutNotice, SessionGate } from "./auth/session-gate.tsx";
import { PlannerProvider, usePlanner } from "./state/planner-context.tsx";
import { RecordsProvider } from "./state/records-context.tsx";

const navGroups = [
  { label: "Plan", links: [["/", "Planner"], ["/species", "Species"], ["/shopping", "Shopping"], ["/calendar", "Calendar"]] },
  { label: "Run", links: [["/dashboard", "Dashboard"], ["/sales", "Sales"], ["/costs", "Costs"], ["/batches", "Batches"]] },
  { label: "Scenarios", links: [["/compare", "Compare"], ["/library", "Saved"]] },
  { label: "", links: [["/account", "Account"]] },
] as const;

export function Shell() {
  const location = useLocation();
  const planner = usePlanner();
  const { userEmail } = planner;
  async function leave() {
    const error = await planner.saveCloud(planner.draft.source.kind === "cloud" ? "update" : "new");
    if (error) rememberSignOutNotice(`The account save did not finish (${error}).`);
    await planner.signOut();
  }
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="no-print sticky top-0 z-10 border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="font-serif text-xl text-olive">Native Nursery</p>
          <p className="text-sm text-muted" data-testid="account-pill">
            {userEmail ?? "Owner"}
          </p>
          <button className="btn btn-secondary" type="button" onClick={() => void leave()}>
            Sign out
          </button>
        </div>
        <nav aria-label="Sections" className="mx-auto flex w-full min-w-0 max-w-6xl gap-3 overflow-x-auto px-4 pb-3">
          {navGroups.map((group, index) => (
            <div key={group.label || index} role="group" aria-label={group.label || "Account"} className={`flex shrink-0 items-center gap-2 ${index > 0 ? "border-l border-line pl-3" : ""}`}>
              {group.label ? <span className="nav-group">{group.label}</span> : null}
              {group.links.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === "/"} className="chip shrink-0">
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<PlannerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/costs" element={<CostsPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/species" element={<SpeciesPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<PlannerPage />} />
        </Routes>
      </main>
      <footer className="no-print mx-auto max-w-6xl px-4 pb-10 text-sm text-muted">
        All figures are estimates in AUD. Sale prices are ex GST; kit prices are shelf prices, often inc GST.
      </footer>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <SessionGate>
        {(userId) => (
          <PlannerProvider userId={userId}>
            <RecordsProvider>
              <Shell />
            </RecordsProvider>
          </PlannerProvider>
        )}
      </SessionGate>
    </HashRouter>
  );
}
