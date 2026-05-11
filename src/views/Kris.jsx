import { useEffect, useMemo, useState } from "react";
import { loadReservesData, loadKrisPayments } from "../lib/data";
import { fd, fdate } from "../lib/format";

const KRIS_RATE = 0.25;

export default function Kris() {
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

  const lines = useMemo(() => {
    return onServices.map((l) => {
      const funded = Number(l.funded || 0);
      const reserve = Number(l.release_amount || l.reserves || 0);
      const fundedComm = funded > 0 ? funded * KRIS_RATE : 0;
      const reserveComm = l.released ? reserve * KRIS_RATE : 0;
      return {
        ...l,
        fundedComm,
        reserveComm,
        totalDue: fundedComm + reserveComm,
        reserveCommPotential: reserve * KRIS_RATE,
      };
    }).sort((a, b) => String(b.invoice_date || "").localeCompare(String(a.invoice_date || "")));
  }, [onServices]);

  const totals = useMemo(() => {
    const totalFunded = lines.reduce((s, l) => s + l.fundedComm, 0);
    const totalReserveEarned = lines.reduce((s, l) => s + l.reserveComm, 0);
    const totalReservePending = lines.reduce(
      (s, l) => s + (l.released ? 0 : l.reserveCommPotential),
      0,
    );
    const totalEarned = totalFunded + totalReserveEarned;
    const totalPaid = payments.reduce((s, p) => s + (p.payment_amount || 0), 0);
    const outstanding = totalEarned - totalPaid;
    return {
      loads: lines.length,
      released: lines.filter((l) => l.released).length,
      totalFunded,
      totalReserveEarned,
      totalReservePending,
      totalEarned,
      totalPaid,
      outstanding,
    };
  }, [lines, payments]);

  const visibleLines = showAll ? lines : lines.slice(0, 30);

  if (loading) return <div className="empty">Loading…</div>;
  if (err) return <div className="err">Failed to load data: {err}</div>;

  return (
    <div>
      <div className="ptitle">Kris — On Services Commission</div>
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
        <Kpi label="Funded Commission (earned)" value={fd(totals.totalFunded, 2)} color="#3ddc84" />
        <Kpi label="Reserve Commission (released)" value={fd(totals.totalReserveEarned, 2)} color="#3ddc84" />
        <Kpi label="Reserve Commission (pending release)" value={fd(totals.totalReservePending, 2)} color="#f5c542" />
        <Kpi label="" value="" color="transparent" />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="ctit">Payment History</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .slice()
              .sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)))
              .map((p, i) => (
                <tr key={i}>
                  <td>{fdate(p.payment_date)}</td>
                  <td>{fd(p.payment_amount, 2)}</td>
                  <td style={{ fontSize: 11, color: "var(--mu)" }}>{p.notes || "—"}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
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
                <th>Released</th>
                <th>Reserve</th>
                <th>Kris (Reserve)</th>
                <th>Total Kris</th>
              </tr>
            </thead>
            <tbody>
              {visibleLines.map((l) => (
                <tr key={l.invoice_number}>
                  <td>{l.invoice_number}</td>
                  <td>{fdate(l.invoice_date)}</td>
                  <td>{fd(l.invoice_amount, 0)}</td>
                  <td>{fd(l.funded, 2)}</td>
                  <td style={{ color: "#3ddc84" }}>{fd(l.fundedComm, 2)}</td>
                  <td style={{ fontSize: 11, color: l.released ? "#3ddc84" : "var(--mu)" }}>
                    {l.released ? (l.release_date ? fdate(l.release_date) : "yes") : "no"}
                  </td>
                  <td>{fd(l.released ? (l.release_amount || l.reserves || 0) : (l.reserves || 0), 2)}</td>
                  <td style={{ color: l.released ? "#3ddc84" : "#f5c542" }}>
                    {fd(l.released ? l.reserveComm : l.reserveCommPotential, 2)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fd(l.totalDue + (l.released ? 0 : l.reserveCommPotential), 2)}</td>
                </tr>
              ))}
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
