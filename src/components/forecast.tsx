import { buildForecast } from "../domain/plan.ts";
import { formatAud, formatPercent, formatUnits } from "../domain/format.ts";
import type { ScenarioInput } from "../domain/model.ts";
export function ForecastBoard({ inputs }: { inputs: ScenarioInput }) {
  const forecast = buildForecast(inputs);
  const monthRevenue = forecast.byMonth.reduce((sum, row) => sum + row.revenueExGst, 0);
  return (
    <section className="panel" data-testid="forecast">
      <h2 className="font-serif text-2xl">Sales forecast</h2>
      <p className="note mt-1">
        Plants sold are the quantities you plan to sell. Starts are those sales grossed up by sell-through, survival and germination. {forecast.ownedPots} already-owned 140 mm pots add space and no dollars. Seed cash is the known pack total only and is not also inside equipment, media or pots.
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="note">Plants to sell</dt>
          <dd className="text-xl font-semibold">{formatUnits(forecast.sold)}</dd>
        </div>
        <div>
          <dt className="note">Priced revenue, ex GST</dt>
          <dd className="text-xl font-semibold">{formatAud(forecast.revenueExGst)}</dd>
        </div>
        <div>
          <dt className="note">Unpriced plants</dt>
          <dd className="text-xl font-semibold">{formatUnits(forecast.unpricedUnits)}</dd>
        </div>
        <div>
          <dt className="note">Starts</dt>
          <dd className="text-xl font-semibold">{forecast.starts == null ? "—" : formatUnits(forecast.starts)}</dd>
        </div>
      </dl>
      <p className="note mt-3">
        Margin {forecast.margin == null ? "—" : formatPercent(forecast.margin)}. Markup {forecast.markup == null ? "—" : formatPercent(forecast.markup)}. {forecast.marginNote}
      </p>
      <p className="note mt-2">
        Purchased seed in the cash forecast is {formatAud(forecast.seedCash, 2)}. {forecast.seedMissing.length} seed lines have no pack price and are excluded, not costed at $0.
      </p>
      {forecast.issues.length > 0 ? (
        <ul className="mt-3 list-disc pl-5 text-sm">
          {forecast.issues.slice(0, 6).map((issue) => (
            <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      <div className="table-wrap mt-3">
        <table className="data">
          <caption className="sr-only">Forecast by channel</caption>
          <thead>
            <tr>
              <th>Channel</th>
              <th className="num">Priced plants</th>
              <th className="num">Revenue ex GST</th>
            </tr>
          </thead>
          <tbody>
            {forecast.byChannel.map((row) => (
              <tr key={row.channel}>
                <th scope="row">{row.channel}</th>
                <td className="num">{formatUnits(row.units)}</td>
                <td className="num">{formatAud(row.revenueExGst)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note mt-3">
        Monthly priced revenue sums to {formatAud(monthRevenue)}. A line with a sale month sits in that month. Other priced plants follow the planner’s monthly weights, which are a timing sketch.
      </p>
    </section>
  );
}
