import { useMemo, useState } from "react";
import { CheckField, SelectField, TextField, toNumber, todayISO } from "../components/record-fields.tsx";
import { formatAud } from "../domain/format.ts";
import {
  exGst,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  isISODate,
  summarise,
  type ExpenseCategory,
} from "../domain/records.ts";
import { usePlanner } from "../state/planner-context.tsx";
import { useRecords } from "../state/records-context.tsx";

const categoryOptions = EXPENSE_CATEGORIES.map((category) => [category, EXPENSE_CATEGORY_LABEL[category]] as const);

export function CostsPage() {
  const { draft } = usePlanner();
  const { records, syncError, warning, dismissWarning, saveEntry, deleteEntry } = useRecords();
  const summary = useMemo(() => summarise(records), [records]);
  const [message, setMessage] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<ExpenseCategory>("overhead");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [includesGst, setIncludesGst] = useState(true);

  const [weekStart, setWeekStart] = useState(todayISO());
  const [ownerHours, setOwnerHours] = useState("");
  const [hiredHours, setHiredHours] = useState("");

  const sortedExpenses = useMemo(() => [...records.expenses].sort((a, b) => b.date.localeCompare(a.date)), [records.expenses]);
  const sortedLabour = useMemo(() => [...records.labour].sort((a, b) => b.weekStart.localeCompare(a.weekStart)), [records.labour]);
  const weeksLogged = sortedLabour.length;
  const ownerAverage = weeksLogged > 0 ? summary.ownerHours / weeksLogged : null;
  const hiredAverage = weeksLogged > 0 ? summary.hiredHours / weeksLogged : null;

  function addExpense() {
    const value = toNumber(amount);
    if (!isISODate(date)) return setMessage("Enter the expense date as YYYY-MM-DD.");
    if (value == null || value < 0) return setMessage("Amount needs to be zero or more.");
    saveEntry("expense", { date, category, description: description.trim(), amount: value, includesGst });
    setDescription("");
    setAmount("");
    setMessage(null);
  }

  function addWeek() {
    const owner = ownerHours.trim() === "" ? 0 : toNumber(ownerHours);
    const hired = hiredHours.trim() === "" ? 0 : toNumber(hiredHours);
    if (!isISODate(weekStart)) return setMessage("Enter the week start as YYYY-MM-DD.");
    if (owner == null || owner < 0 || owner > 168) return setMessage("Owner hours for a week sit between 0 and 168.");
    if (hired == null || hired < 0 || hired > 168) return setMessage("Hired hours for a week sit between 0 and 168.");
    const existing = records.labour.find((week) => week.weekStart === weekStart);
    saveEntry("labour", { id: existing?.id, weekStart, ownerHours: owner, hiredHours: hired });
    setOwnerHours("");
    setHiredHours("");
    setMessage(existing ? "That week was updated." : null);
  }

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Costs and labour</h1>
        <p className="mt-2 max-w-3xl text-muted">
          What actually left the bank account, categorised the same way as the planner. Tick “includes GST” for inc-GST
          receipts and the ex-GST figure is worked out for the dashboard and the export.
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
        <h2 className="font-serif text-2xl">Record an expense</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField id="expense-date" label="Date" type="date" value={date} onChange={setDate} />
          <SelectField
            id="expense-category"
            label="Category"
            value={category}
            onChange={(value) => setCategory(value as ExpenseCategory)}
            options={categoryOptions}
            hint="Same classes the planner uses. Equipment stays capital, everything else is operating."
          />
          <TextField id="expense-amount" label="Amount" type="number" value={amount} onChange={setAmount} placeholder="e.g. 84.50" />
          <TextField
            id="expense-description"
            label="What it was"
            value={description}
            onChange={setDescription}
            placeholder="e.g. Debco 25 L × 12"
          />
          <CheckField
            id="expense-gst"
            label="Amount includes GST"
            hint="Most shelf prices do. Untick for ex-GST invoices and GST-free items."
            checked={includesGst}
            onChange={setIncludesGst}
          />
        </div>
        <button className="btn btn-primary mt-3" type="button" onClick={addExpense}>
          Record expense
        </button>
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Expense ledger</h2>
        <p className="note mt-1">
          {formatAud(summary.spendTotal, 2)} spent{summary.gstPaid > 0 ? ` · ${formatAud(summary.gstPaid, 2)} of that is GST paid` : ""}
        </p>
        {sortedExpenses.length === 0 ? (
          <p className="mt-3">No expenses recorded yet.</p>
        ) : (
          <>
            <div className="table-wrap mt-3">
              <table className="data">
                <caption className="sr-only">Recorded expenses</caption>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>What</th>
                    <th className="num">Amount</th>
                    <th className="num">Ex GST</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <th scope="row">{expense.date}</th>
                      <td>{EXPENSE_CATEGORY_LABEL[expense.category]}</td>
                      <td>
                        {expense.description || "—"}
                        {expense.includesGst ? <span className="mt-1 block text-muted">inc GST</span> : null}
                      </td>
                      <td className="num">{formatAud(expense.amount, 2)}</td>
                      <td className="num">{formatAud(exGst(expense.amount, expense.includesGst), 2)}</td>
                      <td className="num">
                        <button className="btn btn-ghost" type="button" onClick={() => deleteEntry("expense", expense.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-wrap mt-4">
              <table className="data">
                <caption className="sr-only">Spend by category</caption>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Spent</th>
                    <th className="num">Planned</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Growing consumables</th>
                    <td className="num">{formatAud(summary.spendByCategory.consumables, 2)}</td>
                    <td className="num">{formatAud(draft.inputs.growingConsumables, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Reusable containers</th>
                    <td className="num">{formatAud(summary.spendByCategory.containers, 2)}</td>
                    <td className="num">{formatAud(draft.inputs.reusableContainers, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Purchased seed</th>
                    <td className="num">{formatAud(summary.spendByCategory.seed, 2)}</td>
                    <td className="num">{formatAud(draft.inputs.purchasedSeedAllowance, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">One-off equipment</th>
                    <td className="num">{formatAud(summary.spendByCategory.equipment, 2)}</td>
                    <td className="num">{formatAud(draft.inputs.oneOffEquipment + (draft.inputs.quoteNeededCash ?? 0), 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Overhead</th>
                    <td className="num">{formatAud(summary.spendByCategory.overhead, 2)}</td>
                    <td className="num">{formatAud(draft.inputs.annualOverhead, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Hired labour</th>
                    <td className="num">{formatAud(summary.spendByCategory.labour, 2)}</td>
                    <td className="num">
                      {formatAud(draft.inputs.hiredHoursPerWeek * draft.inputs.hiredHourlyRate * draft.inputs.weeksPerYear, 2)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Other</th>
                    <td className="num">{formatAud(summary.spendByCategory.other, 2)}</td>
                    <td className="num">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <h2 className="font-serif text-2xl">Labour log</h2>
        <p className="note mt-1">
          One row per week. The plan budgets {draft.inputs.ownerHoursPerWeek} owner hours and{" "}
          {draft.inputs.hiredHoursPerWeek} hired hours a week.
          {ownerAverage != null
            ? ` Logged so far: ${ownerAverage.toFixed(1)} owner and ${(hiredAverage ?? 0).toFixed(1)} hired hours a week on average.`
            : ""}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <TextField id="week-start" label="Week starting" type="date" value={weekStart} onChange={setWeekStart} />
          <TextField id="week-owner" label="Owner hours" type="number" value={ownerHours} onChange={setOwnerHours} />
          <TextField id="week-hired" label="Hired hours" type="number" value={hiredHours} onChange={setHiredHours} />
        </div>
        <button className="btn btn-primary mt-3" type="button" onClick={addWeek}>
          Log week
        </button>
        {sortedLabour.length === 0 ? (
          <p className="mt-3">No weeks logged yet.</p>
        ) : (
          <div className="table-wrap mt-3">
            <table className="data">
              <caption className="sr-only">Logged labour weeks</caption>
              <thead>
                <tr>
                  <th>Week starting</th>
                  <th className="num">Owner hrs</th>
                  <th className="num">Hired hrs</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sortedLabour.map((week) => (
                  <tr key={week.id}>
                    <th scope="row">{week.weekStart}</th>
                    <td className="num">{week.ownerHours}</td>
                    <td className="num">{week.hiredHours}</td>
                    <td className="num">
                      <button className="btn btn-ghost" type="button" onClick={() => deleteEntry("labour", week.id)}>
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
    </div>
  );
}
