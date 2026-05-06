import { useMemo, useState } from "react";
import { fd, fdate } from "../../lib/format";

export default function Released({ rows }) {
  const [expanded, setExpanded] = useState(false);

  const totals = useMemo(() => ({
    count: rows.length,
    gross: rows.reduce((s, r) => s + (r.invoice_amount || 0), 0),
    reserve: rows.reduce((s, r) => s + (r.reserves || 0), 0),
    released: rows.reduce((s, r) => s + (r.release_amount || r.released_reserves || r.reserves || 0), 0),
  }), [rows]);

  const byCustomer = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const k = r.customer || "—";
      const cur = map.get(k) || { customer: k, count: 0, released: 0, gross: 0 };
      cur.count += 1;
      cur.released += r.release_amount || r.released_reserves || r.reserves || 0;
      cur.gross += r.invoice_amount || 0;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.released - a.released);
  }, [rows]);

  const sortedDetail = useMemo(() =>
    [...rows].sort((a, b) => String(b.release_date || "").localeCompare(String(a.release_date || ""))),
  [rows]);

  return (
    <div>
      <div className="g4" style={{ marginBottom: 14 }}>
        <Kpi label="Released Loads" value={totals.count} color="#3ddc84" />
        <Kpi label="Gross" value={fd(totals.gross, 0)} color="#3ddc84" />
        <Kpi label="Reserve Released" value={fd(totals.released, 0)} color="#3ddc84" big />
        <Kpi label="Customers Paid" value={byCustomer.length} color="#4fc3f7" />
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="ctit">Released by Customer</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Loads</th>
              <th>Gross</th>
              <th>Released</th>
            </tr>
          </thead>
          <tbody>
            {byCustomer.map((c) => (
              <tr key={c.customer}>
                <td>{c.customer}</td>
                <td>{c.count}</td>
                <td>{fd(c.gross, 0)}</td>
                <td>{fd(c.released, 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{totals.count}</td>
              <td>{fd(totals.gross, 0)}</td>
              <td>{fd(totals.released, 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="ctit" style={{ marginBottom: 0 }}>Released Loads — Detail</div>
          <button className="input" style={{ cursor: "pointer" }} onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide detail" : "Show detail"}
          </button>
        </div>
        {expanded && (
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Carrier</th>
                  <th>Released</th>
                  <th>Amount</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {sortedDetail.map((r, i) => (
                  <tr key={r.invoice_number || i}>
                    <td>{r.invoice_number}</td>
                    <td>{r.customer || "—"}</td>
                    <td>{r.carrier || "—"}</td>
                    <td>{r.release_date ? fdate(r.release_date) : "—"}</td>
                    <td>{fd(r.release_amount || r.released_reserves || r.reserves || 0, 0)}</td>
                    <td style={{ fontSize: 10, color: "var(--mu)" }}>{r.release_source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
