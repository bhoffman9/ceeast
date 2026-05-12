import { useEffect, useMemo, useState } from "react";
import { loadReservesData, loadKrisPayments } from "../lib/data";
import { fd, fdate } from "../lib/format";

const KRIS_RATE = 0.25;

export default function Commissions() {
  const [loads, setLoads] = useState([]);
  const [payments, setPayments] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    Promise.all([loadReservesData(), loadKrisPayments()])
      .then(([l, p]) => { setLoads(l); setPayments(p); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onServices = useMemo(
    () => loads.filter((l) => l.customer === "On Services"),
    [loads],
  );

  // Build an index of paid (invoice, leg) -> { date, amount } so per-load checkmarks
  // can resolve quickly. Each row in kris_payments.csv is one leg of one invoice.
  const paidIndex = useMemo(() => {
    const m = new Map();
    for (const p of payments) {
      const key = `${p.invoice_number}|${p.leg}`;
      m.set(key, { date: p.payment_date, amount: Number(p.amount || 0), notes: p.notes });
    }
    return m;
  }, [payments]);

  const lines = useMemo(() => {
    return onServices.map((l) => {
      // Negative funded counts — when a load loses money Kris's commission goes
      // negative too. Confirmed with Ben against the 2/25/26 payment: invoice 38013
      // had funded = -$565, contributing -$141.25 to Kris's commission, and the
      // batch still totaled the right $613.25.
      const funded = Number(l.funded || 0);
      const fundedComm = funded * KRIS_RATE;
      // For the reserve leg: use the actual released amount when the load is
      // released (released_reserves preserves the real Triumph/Flexent paid-out
      // figure — old Triumph loads were ~3.25%, not 5%). For unreleased loads,
      // estimate at the current 5% Flexent rate (the `reserves` column).
      const actualReserve = Number(l.released_reserves || l.release_amount || l.reserves || 0);
      const projectedReserve = Number(l.reserves || 0);
      const reserveComm = l.released ? actualReserve * KRIS_RATE : 0;
      const reserveCommPotential = projectedReserve * KRIS_RATE;
      const fundedPaid = paidIndex.get(`${l.invoice_number}|funded`) || null;
      const reservePaid = paidIndex.get(`${l.invoice_number}|reserve`) || null;
      return {
        ...l,
        actualReserve,
        projectedReserve,
        fundedComm,
        reserveComm,
        reserveCommPotential,
        totalDue: fundedComm + reserveComm,
        fundedPaid,
        reservePaid,
      };
    }).sort((a, b) => String(b.invoice_date || "").localeCompare(String(a.invoice_date || "")));
  }, [onServices, paidIndex]);

  const totals = useMemo(() => {
    const totalFunded = lines.reduce((s, l) => s + l.fundedComm, 0);
    const totalReserveEarned = lines.reduce((s, l) => s + l.reserveComm, 0);
    const totalReservePending = lines.reduce(
      (s, l) => s + (l.released ? 0 : l.reserveCommPotential),
      0,
    );
    const totalEarned = totalFunded + totalReserveEarned;
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const outstanding = totalEarned - totalPaid;

    const outstandingFunded = lines
      .filter((l) => !l.fundedPaid)
      .reduce((s, l) => s + l.fundedComm, 0);
    const outstandingReserve = lines
      .filter((l) => l.released && !l.reservePaid)
      .reduce((s, l) => s + l.reserveComm, 0);

    return {
      loads: lines.length,
      released: lines.filter((l) => l.released).length,
      totalFunded,
      totalReserveEarned,
      totalReservePending,
      totalEarned,
      totalPaid,
      outstanding,
      outstandingFunded,
      outstandingReserve,
      fundedLegsPaid: lines.filter((l) => l.fundedPaid).length,
      reserveLegsPaid: lines.filter((l) => l.reservePaid).length,
    };
  }, [lines, payments]);

  // Group per-leg payments back into payment-date batches for the history view.
  const paymentHistory = useMemo(() => {
    const m = new Map();
    for (const p of payments) {
      const key = p.payment_date || "—";
      const cur = m.get(key) || { date: key, count: 0, total: 0, notes: new Set() };
      cur.count += 1;
      cur.total += Number(p.amount || 0);
      if (p.notes) cur.notes.add(p.notes);
      m.set(key, cur);
    }
    return [...m.values()]
      .map((b) => ({ ...b, notes: [...b.notes].join("; ") }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [payments]);

  const visibleLines = showAll ? lines : lines.slice(0, 30);

  if (loading) return <div className="empty">Loading…</div>;
  if (err) return <div className="err">Failed to load data: {err}</div>;

  return (
    <div>
      <div className="ptitle">Commissions — On Services (Kris)</div>
      <div className="psub">
        25% of CSV <code>funded</code> per load + 25% of released reserves
      </div>

      <div className="g4" style={{ marginBottom: 14 }}>
        <Kpi label="Total Earned" value={fd(totals.totalEarned, 2)} color="#3ddc84" big />
        <Kpi label="Paid to Date" value={fd(totals.totalPaid, 2)} color="#4fc3f7" />
        <Kpi
          label="Outstanding"
          value={fd(totals.outstanding, 2)}
          color={totals.outstanding > 0 ? "#f5c542" : "#3ddc84"}
          big
        />
        <Kpi label="On Services Loads" value={`${totals.released}/${totals.loads} released`} color="#4fc3f7" />
      </div>

      <div className="g4" style={{ marginBottom: 14 }}>
        <Kpi label={`Funded Comm Outstanding (${totals.loads - totals.fundedLegsPaid} loads)`} value={fd(totals.outstandingFunded, 2)} color="#f5c542" />
        <Kpi label={`Reserve Comm Outstanding (${totals.released - totals.reserveLegsPaid} loads)`} value={fd(totals.outstandingReserve, 2)} color="#f5c542" />
        <Kpi label="Reserve Comm Pending Release" value={fd(totals.totalReservePending, 2)} color="var(--mu)" />
        <Kpi label="Funded Comm Earned (all-time)" value={fd(totals.totalFunded, 2)} color="#3ddc84" />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="ctit">Payment History</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Legs</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((b, i) => (
              <tr key={i}>
                <td>{fdate(b.date)}</td>
                <td>{b.count}</td>
                <td>{fd(b.total, 2)}</td>
                <td style={{ fontSize: 11, color: "var(--mu)" }}>{b.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{payments.length}</td>
              <td>{fd(totals.totalPaid, 2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="ctit" style={{ marginBottom: 0 }}>On Services Loads — Per-Load Detail</div>
          {lines.length > 30 && (
            <button className="input" style={{ cursor: "pointer" }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? `Show top 30` : `Show all ${lines.length}`}
            </button>
          )}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Inv Date</th>
                <th>Amount</th>
                <th>Funded</th>
                <th>Kris (Funded)</th>
                <th title="Funded leg paid">F✓</th>
                <th>Released</th>
                <th>Reserve</th>
                <th>Kris (Reserve)</th>
                <th title="Reserve leg paid">R✓</th>
                <th>Total Kris</th>
              </tr>
            </thead>
            <tbody>
              {visibleLines.map((l) => {
                const negFunded = l.fundedComm < 0;
                return (
                  <tr key={l.invoice_number}>
                    <td>{l.invoice_number}</td>
                    <td>{fdate(l.invoice_date)}</td>
                    <td>{fd(l.invoice_amount, 0)}</td>
                    <td style={{ color: l.funded < 0 ? "#ff5252" : undefined }}>{fd(l.funded, 2)}</td>
                    <td style={{ color: negFunded ? "#ff5252" : "#3ddc84" }}>{fd(l.fundedComm, 2)}</td>
                    <td title={l.fundedPaid ? `Paid ${l.fundedPaid.date} — ${fd(l.fundedPaid.amount, 2)}` : "Unpaid"}
                        style={{ textAlign: "center", color: l.fundedPaid ? "#3ddc84" : "var(--mu)", fontSize: 14 }}>
                      {l.fundedPaid ? "✓" : "—"}
                    </td>
                    <td style={{ fontSize: 11, color: l.released ? "#3ddc84" : "var(--mu)" }}>
                      {l.released ? (l.release_date ? fdate(l.release_date) : "yes") : "no"}
                    </td>
                    <td>{fd(l.released ? l.actualReserve : l.projectedReserve, 2)}</td>
                    <td style={{ color: l.released ? "#3ddc84" : "#f5c542" }}>
                      {fd(l.released ? l.reserveComm : l.reserveCommPotential, 2)}
                    </td>
                    <td title={l.reservePaid ? `Paid ${l.reservePaid.date} — ${fd(l.reservePaid.amount, 2)}` : (l.released ? "Released, unpaid" : "Pending release")}
                        style={{ textAlign: "center", color: l.reservePaid ? "#3ddc84" : "var(--mu)", fontSize: 14 }}>
                      {l.reservePaid ? "✓" : "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{fd(l.totalDue + (l.released ? 0 : l.reserveCommPotential), 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color, big }) {
  return (
    <div className="kpi">
      <div className="klbl">{label}</div>
      <div className="kval" style={{ color, fontSize: big ? 28 : 24 }}>{value}</div>
    </div>
  );
}
