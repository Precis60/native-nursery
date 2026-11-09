import type { ReactNode } from "react";

/** Assumptions and method notes, closed until asked for. */
export function More({ summary = "How this is worked out", children }: { summary?: string; children: ReactNode }) {
  return (
    <details className="more mt-1">
      <summary>{summary}</summary>
      <div className="note grid gap-2 pb-1">{children}</div>
    </details>
  );
}
