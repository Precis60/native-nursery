import { batches, calendar, channels, compliance, risks, setupChecks, sources, sowing, zones } from "../domain/reference.ts";

export function CalendarPage() {
  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Calendar and checks</h1>
          <p className="mt-2 max-w-3xl text-muted">November 2026 to October 2027. Hours are estimates for one person. Nothing on the checklist is marked done.</p>
        </div>
        <button className="btn btn-secondary no-print" type="button" onClick={() => window.print()}>
          Print
        </button>
      </header>
      <section className="panel">
        <h2 className="font-serif text-2xl">Batches</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {batches.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Work calendar</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <caption className="sr-only">Monthly tasks and hours</caption>
            <thead>
              <tr>
                <th>Month</th>
                <th>Tasks</th>
                <th>Solo hrs/wk</th>
                <th>With helper</th>
              </tr>
            </thead>
            <tbody>
              {calendar.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.month}</th>
                  <td>{row.tasks}</td>
                  <td>{row.solo}</td>
                  <td>{row.helper}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Sowing calendar</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>Month</th>
                <th>Sow or strike</th>
                <th>Pot on / tasks</th>
              </tr>
            </thead>
            <tbody>
              {sowing.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.month}</th>
                  <td>{row.sow}</td>
                  <td>{row.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Before you sell</h2>
        <ul className="mt-3 grid gap-2">
          {compliance.map((item) => (
            <li key={item.text} className="rounded-xl border border-line bg-white px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gold">{item.meta}</span>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Setup checklist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {setupChecks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Space</h2>
        <p className="note mt-1">About 160–200 m² all up. Check that against the site agreement. The layout is a working arrangement, not a survey.</p>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Holds</th>
                <th>Area</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((row) => (
                <tr key={row.zone}>
                  <th scope="row">{row.zone}</th>
                  <td>{row.holds}</td>
                  <td>{row.area}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Buyers</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Who</th>
                <th>What they need</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((row) => (
                <tr key={`${row.channel}-${row.target}`}>
                  <th scope="row">{row.channel}</th>
                  <td>
                    {row.contact ? (
                      <a className="underline" href={row.contact}>
                        {row.target}
                      </a>
                    ) : (
                      row.target
                    )}
                  </td>
                  <td>{row.need}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Sources</h2>
        <ul className="mt-3 grid gap-2">
          {sources.map((source) => (
            <li key={source.href}>
              <a className="underline" href={source.href}>
                {source.title}
              </a>
              {source.note ? <p className="note">{source.note}</p> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Risks</h2>
        <div className="table-wrap mt-3">
          <table className="data">
            <thead>
              <tr>
                <th>Risk</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((row) => (
                <tr key={row.risk}>
                  <th scope="row">{row.risk}</th>
                  <td>{row.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
