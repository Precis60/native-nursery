import { useEffect } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { AccountPage } from "./pages/account.tsx";
import { CalendarPage } from "./pages/calendar.tsx";
import { ComparePage } from "./pages/compare.tsx";
import { LibraryPage } from "./pages/library.tsx";
import { PlannerPage } from "./pages/planner.tsx";
import { ShoppingPage } from "./pages/shopping.tsx";
import { SpeciesPage } from "./pages/species.tsx";
import { PlannerProvider, usePlanner } from "./state/planner-context.tsx";

const links = [
  ["/", "Planner"],
  ["/species", "Species"],
  ["/shopping", "Shopping"],
  ["/calendar", "Calendar"],
  ["/compare", "Compare"],
  ["/library", "Scenarios"],
  ["/account", "Account"],
] as const;

function Shell() {
  const location = useLocation();
  const { userEmail, configured } = usePlanner();
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
            {userEmail ? userEmail : configured ? "Signed out" : "This browser only"}
          </p>
        </div>
        <nav aria-label="Sections" className="mx-auto flex w-full min-w-0 max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className="chip shrink-0">
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<PlannerPage />} />
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
        GitHub Pages planner with hash routing. Estimates are in AUD. Trading prices are ex GST. Kit totals follow the selected shelf-price lines, often inc GST. Account save is pending owner setup.
      </footer>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <PlannerProvider>
        <Shell />
      </PlannerProvider>
    </HashRouter>
  );
}
