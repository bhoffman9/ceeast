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

  // Build an index of paid (invoice, leg) -> { totalPaid, lastDate, rows }.
  // Multiple rows can exist for the same leg when a payment is partial — the
  // ones must sum to the expected commission before the leg is "fully paid."
  const paidIndex = useMemo(() => {
    const m = new Map();
    for (const p of payments) {
      const key = `${p.invoice_number}|${p.leg}`;
      const cur = m.get(key) || { totalPaid: 0, lastDate: "", rows: [] };
      cur.totalPaid += Number(p.amount || 0);
      cur.rows.push(p);
      if (!cur.lastDate || String(p.payment_date) > cur.lastDate) cur.lastDate = p.payment_date;
      m.set(key, cur);
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
      const fundedPayInfo = paidIndex.get(`${l.invoice_number}|funded`) || null;
      const reservePayInfo = paidIndex.get(`${l.invoice_number}|reserve`) || null;
      const fundedPaid = fundedPayInfo ? fundedPayInfo.totalPaid : 0;
      const reservePaid = reservePayInfo ? reservePayInfo.totalPaid : 0;
      // "Fully paid" tolerates 1¢ rounding diffs between expected and paid.
      const fundedFullyPaid = fundedPayInfo && Math.abs(fundedPaid - fundedComm) < 0.01;
      const fundedPartial = fundedPayInfo && !fundedFullyPaid;
      const fundedRemaining = fundedComm - fundedPaid;
      const reserveFullyPaid = reservePayInfo && Math.abs(reservePaid - reserveComm) < 0.01;
      const reservePartial = reservePayInfo && !reserveFullyPaid;
      const reserveRemaining = reserveComm - reservePaid;
      return {
        ...l,
        actualReserve,
        projectedReserve,
        fundedComm,
        reserveComm,
        reserveCommPotential,
        totalDue: fundedComm + reserveComm,
        fundedPayInfo,
        reservePayInfo,
        fundedPaid,
        reservePaid,
        fundedFullyPaid,
        fundedPartial,
        fundedRemaining,
        reserveFullyPaid,
        reservePartial,
        reserveRemaining,
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

    // Outstanding = expected − paid per leg. Handles partial payments correctly:
    // a load with $175 expected and $51.28 paid contributes $123.72 to outstanding.
    const outstandingFunded = lines.reduce((s, l) => s + (l.fundedFullyPaid ? 0 : l.fundedRemaining), 0);
    const outstandingReserve = lines
      .filter((l) => l.released)
      .reduce((s, l) => s + (l.reserveFullyPaid ? 0 : l.reserveRemaining), 0);

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
      fundedLegsPaid: lines.filter((l) => l.fundedFullyPaid).length,
      reserveLegsPaid: lines.filter((l) => l.reserveFullyPaid).length,
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
                    <td title={
                      l.fundedFullyPaid ? `Paid ${l.fundedPayInfo.lastDate} — ${fd(l.fundedPaid, 2)}` :
                      l.fundedPartial ? `Partial: paid ${fd(l.fundedPaid, 2)} of ${fd(l.fundedComm, 2)} (${fd(l.fundedRemaining, 2)} remaining)` :
                      "Unpaid"
                    }
                        style={{ textAlign: "center", color: l.fundedFullyPaid ? "#3ddc84" : l.fundedPartial ? "#f5c542" : "var(--mu)", fontSize: 14 }}>
                      {l.fundedFullyPaid ? "✓" : l.fundedPartial ? "½" : "—"}
                    </td>
                    <td style={{ fontSize: 11, color: l.released ? "#3ddc84" : "var(--mu)" }}>
                      {l.released ? (l.release_date ? fdate(l.release_date) : "yes") : "no"}
                    </td>
                    <td>{fd(l.released ? l.actualReserve : l.projectedReserve, 2)}</td>
                    <td style={{ color: l.released ? "#3ddc84" : "#f5c542" }}>
                      {fd(l.released ? l.reserveComm : l.reserveCommPotential, 2)}
                    </td>
                    <td title={
                      l.reserveFullyPaid ? `Paid ${l.reservePayInfo.lastDate} — ${fd(l.reservePaid, 2)}` :
                      l.reservePartial ? `Partial: paid ${fd(l.reservePaid, 2)} of ${fd(l.reserveComm, 2)} (${fd(l.reserveRemaining, 2)} remaining)` :
                      l.released ? "Released, unpaid" : "Pending release"
                    }
                        style={{ textAlign: "center", color: l.reserveFullyPaid ? "#3ddc84" : l.reservePartial ? "#f5c542" : "var(--mu)", fontSize: 14 }}>
                      {l.reserveFullyPaid ? "✓" : l.reservePartial ? "½" : "—"}
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
