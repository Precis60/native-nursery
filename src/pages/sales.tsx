import { useMemo, useState } from "react";
import { CheckField, SelectField, TextField, toNumber, todayISO } from "../components/record-fields.tsx";
import { formatAud, formatUnits } from "../domain/format.ts";
import {
  exGst,
  isISODate,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  SALE_CHANNELS,
  SIZE_LABEL,
  summarise,
  type NurseryOrder,
  type OrderStatus,
  type SizeKind,
} from "../domain/records.ts";
import { useRecords } from "../state/records-context.tsx";

const channelOptions = SALE_CHANNELS.map((channel) => [channel, channel] as const);
const sizeOptions = (Object.entries(SIZE_LABEL) as [SizeKind, string][]).map(([value, label]) => [value, label] as const);
const statusOptions = ORDER_STATUSES.map((status) => [status, ORDER_STATUS_LABEL[status]] as const);

export function SalesPage() {
  const { records, syncError, warning, dismissWarning, saveEntry, deleteEntry } = useRecords();
  const summary = useMemo(() => summarise(records), [records]);
  const [message, setMessage] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [channel, setChannel] = useState<string>("Other");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState<SizeKind>("tube");
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [includesGst, setIncludesGst] = useState(false);

  const [buyer, setBuyer] = useState("");
  const [orderChannel, setOrderChannel] = useState<string>("Other");
  const [orderDescription, setOrderDescription] = useState("");
  const [orderSize, setOrderSize] = useState<SizeKind>("tube");
  const [orderUnits, setOrderUnits] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderIncludesGst, setOrderIncludesGst] = useState(false);

  const sortedSales = useMemo(() => [...records.sales].sort((a, b) => b.date.localeCompare(a.date)), [records.sales]);
  const activeOrders = useMemo(
    () => records.orders.filter((order) => order.status !== "cancelled"),
    [records.orders],
  );

  function addSale() {
    const unitCount = toNumber(units);
    const unitPrice = toNumber(price);
    if (!isISODate(date)) return setMessage("Enter the sale date as YYYY-MM-DD.");
    if (unitCount == null || unitCount <= 0) return setMessage("Units sold needs to be above zero.");
    if (unitPrice == null || unitPrice < 0) return setMessage("Unit price needs to be zero or more.");
    saveEntry("sale", { date, channel, description: description.trim(), size, units: unitCount, unitPrice, includesGst });
    setDescription("");
    setUnits("");
    setPrice("");
    setMessage(null);
  }

  function addOrder() {
    const unitCount = toNumber(orderUnits);
    const unitPrice = orderPrice.trim() === "" ? 0 : toNumber(orderPrice);
    if (!buyer.trim()) return setMessage("Name the buyer, even if it is a market stall or an online listing.");
    if (unitCount == null || unitCount <= 0) return setMessage("Order units needs to be above zero.");
    if (unitPrice == null || unitPrice < 0) return setMessage("Order price needs to be zero or more. A blank price is kept as $0 until quoted.");
    saveEntry("order", {
      buyer: buyer.trim(),
      channel: orderChannel,
      description: orderDescription.trim(),
      size: orderSize,
      units: unitCount,
      unitPrice,
      includesGst: orderIncludesGst,
      status: "enquiry",
    });
    setBuyer("");
    setOrderDescription("");
    setOrderUnits("");
    setOrderPrice("");
    setMessage(null);
  }

  function setOrderStatus(order: NurseryOrder, status: OrderStatus) {
    saveEntry("order", { ...order, status });
  }

  function logAsSale(order: NurseryOrder) {
    saveEntry("sale", {
      date: todayISO(),
      channel: order.channel,
      description: order.description || order.buyer,
      size: order.size,
      units: order.units,
      unitPrice: order.unitPrice,
      includesGst: order.includesGst,
    });
    saveEntry("order", { ...order, status: "paid" });
    setMessage(`Logged ${formatUnits(order.units)} × ${order.buyer} as a sale and marked the order paid.`);
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Sales and orders</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Recorded actuals, not estimates. Tick “includes GST” when the price charged already carries GST and the ex-GST
          figures are worked out for you. Sales feed the dashboard; orders track demand that has not been delivered yet.
        </p>
      </header>
      {warning ? (
        <div className="callout" role="status">
          <p>{warning}</p>
          <button className="btn btn-ghost mt-2" type="button" onClick={dismissWarning}>
            Dismiss
          </button>
        </div>
      ) : null}
      {syncError ? (
        <div className="callout bad" role="alert">
          <p>The account sync failed and this device kept the records: {syncError}</p>
        </div>
      ) : null}
      {message ? (
        <div className="callout" role="status">
          {message}
        </div>
      ) : null}

      <section className="panel">
        <h2 className="font-serif text-2xl">Record a sale</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="sale-date" label="Date" type="date" value={date} onChange={setDate} />
          <SelectField id="sale-channel" label="Channel" value={channel} onChange={setChannel} options={channelOptions} />
          <SelectField id="sale-size" label="Size" value={size} onChange={(value) => setSize(value as SizeKind)} options={sizeOptions} />
          <TextField id="sale-units" label="Units" type="number" value={units} onChange={setUnits} placeholder="e.g. 400" />
          <TextField id="sale-price" label="Unit price" type="number" value={price} onChange={setPrice} placeholder="e.g. 2.20" />
          <TextField
            id="sale-description"
            label="What was sold"
            value={description}
            onChange={setDescription}
            placeholder="e.g. Acacia pycnantha tubes"
          />
          <CheckField
            id="sale-gst"
            label="Price includes GST"
            hint="Untick for ex-GST wholesale invoices. GST collected shows on the dashboard."
            checked={includesGst}
            onChange={setIncludesGst}
          />
        </div>
        <button className="btn btn-primary mt-3" type="button" onClick={addSale}>
          Record sale
        </button>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Sales ledger</h2>
        <p className="note mt-1">
          {formatUnits(summary.unitsSold)} units · {formatAud(summary.revenueExGst, 2)} ex GST
          {summary.gstCollected > 0 ? ` · ${formatAud(summary.gstCollected, 2)} GST collected` : ""}
        </p>
        {sortedSales.length === 0 ? (
          <p className="mt-3">No sales recorded yet.</p>
        ) : (
          <div className="table-wrap mt-3">
            <table className="data">
              <caption className="sr-only">Recorded sales</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Sold</th>
                  <th className="num">Units</th>
                  <th className="num">Unit price</th>
                  <th className="num">Ex GST</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((sale) => (
                  <tr key={sale.id}>
                    <th scope="row">{sale.date}</th>
                    <td>{sale.channel}</td>
                    <td>
                      {sale.description || "—"}
                      <span className="mt-1 block text-muted">
                        {SIZE_LABEL[sale.size]}
                        {sale.includesGst ? " · inc GST" : ""}
                      </span>
                    </td>
                    <td className="num">{formatUnits(sale.units)}</td>
                    <td className="num">{formatAud(sale.unitPrice, 2)}</td>
                    <td className="num">{formatAud(exGst(sale.units * sale.unitPrice, sale.includesGst), 2)}</td>
                    <td className="num">
                      <button className="btn btn-ghost" type="button" onClick={() => deleteEntry("sale", sale.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Order pipeline</h2>
        <p className="note mt-1">
          {formatUnits(summary.committedUnits)} units confirmed · {formatUnits(summary.enquiryUnits)} units in enquiries.
          Confirmed orders are the pre-order coverage on the dashboard — the plan asks for most tubes committed before
          winter.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="order-buyer" label="Buyer" value={buyer} onChange={setBuyer} placeholder="e.g. Bellarine Landcare" />
          <SelectField id="order-channel" label="Channel" value={orderChannel} onChange={setOrderChannel} options={channelOptions} />
          <SelectField id="order-size" label="Size" value={orderSize} onChange={(value) => setOrderSize(value as SizeKind)} options={sizeOptions} />
          <TextField id="order-units" label="Units" type="number" value={orderUnits} onChange={setOrderUnits} placeholder="e.g. 1000" />
          <TextField
            id="order-price"
            label="Unit price"
            type="number"
            value={orderPrice}
            onChange={setOrderPrice}
            placeholder="Blank until quoted"
          />
          <TextField
            id="order-description"
            label="What they want"
            value={orderDescription}
            onChange={setOrderDescription}
            placeholder="e.g. mixed revegetation tubes"
          />
          <CheckField id="order-gst" label="Price includes GST" checked={orderIncludesGst} onChange={setOrderIncludesGst} />
        </div>
        <button className="btn btn-primary mt-3" type="button" onClick={addOrder}>
          Add order
        </button>
        {activeOrders.length === 0 ? (
          <p className="mt-3">No open orders. Council, Landcare and CMA buyers are listed on the calendar page.</p>
        ) : (
          <div className="table-wrap mt-3">
            <table className="data">
              <caption className="sr-only">Open orders</caption>
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Order</th>
                  <th className="num">Units</th>
                  <th className="num">Ex GST</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.id}>
                    <th scope="row">
                      {order.buyer}
                      <span className="mt-1 block font-normal text-muted">{order.channel}</span>
                    </th>
                    <td>
                      {order.description || "—"}
                      <span className="mt-1 block text-muted">
                        {SIZE_LABEL[order.size]}
                        {order.includesGst ? " · inc GST" : ""}
                      </span>
                    </td>
                    <td className="num">{formatUnits(order.units)}</td>
                    <td className="num">{formatAud(exGst(order.units * order.unitPrice, order.includesGst), 2)}</td>
                    <td>
                      <label className="sr-only" htmlFor={`status-${order.id}`}>
                        Status for {order.buyer}
                      </label>
                      <select
                        id={`status-${order.id}`}
                        className="rounded-lg border border-line bg-white px-2 py-2"
                        value={order.status}
                        onChange={(event) => setOrderStatus(order, event.target.value as OrderStatus)}
                      >
                        {statusOptions.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num">
                      <div className="flex flex-wrap justify-end gap-1">
                        {order.status === "delivered" || order.status === "confirmed" ? (
                          <button className="btn btn-secondary" type="button" onClick={() => logAsSale(order)}>
                            Log as sale
                          </button>
                        ) : null}
                        <button className="btn btn-ghost" type="button" onClick={() => deleteEntry("order", order.id)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel">
        <h2 className="font-serif text-2xl">Settled orders</h2>
        <SettledOrders orders={records.orders} onRemove={(id) => deleteEntry("order", id)} />
      </section>
    </div>
  );
}

function SettledOrders({ orders, onRemove }: { orders: NurseryOrder[]; onRemove: (id: string) => void }) {
  const settled = orders.filter((order) => order.status === "paid" || order.status === "cancelled");
  if (settled.length === 0) return <p className="mt-2">Nothing paid or cancelled yet.</p>;
  return (
    <div className="table-wrap mt-3">
      <table className="data">
        <caption className="sr-only">Paid and cancelled orders</caption>
        <thead>
          <tr>
            <th>Buyer</th>
            <th>Order</th>
            <th className="num">Units</th>
            <th className="num">Ex GST</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {settled.map((order) => (
            <tr key={order.id}>
              <th scope="row">{order.buyer}</th>
              <td>{order.description || "—"}</td>
              <td className="num">{formatUnits(order.units)}</td>
              <td className="num">{formatAud(exGst(order.units * order.unitPrice, order.includesGst), 2)}</td>
              <td>{ORDER_STATUS_LABEL[order.status]}</td>
              <td className="num">
                <button className="btn btn-ghost" type="button" onClick={() => onRemove(order.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
