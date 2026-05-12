import { useMemo, useState } from "react";
import { fd, fdate } from "../../lib/format";

export default function Released({ rows, transfers = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [pendingExpanded, setPendingExpanded] = useState(true);

  const totals = useMemo(() => ({
    count: rows.length,
    gross: rows.reduce((s, r) => s + (r.invoice_amount || 0), 0),
    reserve: rows.reduce((s, r) => s + (r.reserves || 0), 0),
    released: rows.reduce((s, r) => s + (r.release_amount || r.released_reserves || r.reserves || 0), 0),
  }), [rows]);

  // A released load is "pending transfer" until a row exists for it in
  // reserve_transfers.csv. Each Monday's pipeline pulls in new Flexent payouts;
  // the user marks them transferred by appending to that file.
  const transferredInvs = useMemo(
    () => new Set(transfers.map((t) => String(t.invoice_number).trim())),
    [transfers],
  );

  const pending = useMemo(() => {
    const dated = rows.filter((r) => r.release_date && !transferredInvs.has(String(r.invoice_number).trim()));
    const sorted = [...dated].sort((a, b) => String(b.release_date).localeCompare(String(a.release_date)));
    const total = sorted.reduce((s, r) => s + (r.release_amount || r.released_reserves || r.reserves || 0), 0);
    return {
      rows: sorted,
      count: sorted.length,
      total,
      start: sorted.length ? sorted[sorted.length - 1].release_date : null,
      end: sorted.length ? sorted[0].release_date : null,
    };
  }, [rows, transferredInvs]);

  const pendingByCustomer = useMemo(() => {
    const map = new Map();
    for (const r of pending.rows) {
      const k = r.customer || "—";
      const cur = map.get(k) || { customer: k, count: 0, released: 0 };
      cur.count += 1;
      cur.released += r.release_amount || r.released_reserves || r.reserves || 0;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.released - a.released);
  }, [pending.rows]);

  // Most recent batch of completed transfers, grouped by transfer_date.
  const lastTransferBatch = useMemo(() => {
    if (!transfers.length) return null;
    const sorted = [...transfers].sort((a, b) => String(b.transfer_date).localeCompare(String(a.transfer_date)));
    const latestDate = sorted[0].transfer_date;
    const batch = sorted.filter((t) => t.transfer_date === latestDate);
    return {
      date: latestDate,
      count: batch.length,
      total: batch.reduce((s, t) => s + (t.amount || 0), 0),
    };
  }, [transfers]);

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
      {pending.count > 0 ? (
        <div
          className="card"
          style={{
            marginBottom: 14,
            border: "1px solid #f5c542",
            background: "linear-gradient(180deg, rgba(245,197,66,0.08) 0%, rgba(245,197,66,0.02) 100%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div className="ctit" style={{ marginBottom: 2, color: "#f5c542" }}>Reserves to Transfer</div>
              <div style={{ fontSize: 11, color: "var(--mu)" }}>
                Released by Flexent {fdate(pending.start)} → {fdate(pending.end)} — not yet transferred out of CE East
              </div>
            </div>
            <button className="input" style={{ cursor: "pointer" }} onClick={() => setPendingExpanded((e) => !e)}>
              {pendingExpanded ? "Hide detail" : "Show detail"}
            </button>
          </div>

          <div className="g4" style={{ marginBottom: pendingExpanded ? 14 : 0 }}>
            <Kpi label="Loads Pending" value={pending.count} color="#f5c542" />
            <Kpi label="Amount to Transfer" value={fd(pending.total, 0)} color="#f5c542" big />
            <Kpi label="Customers" value={pendingByCustomer.length} color="#f5c542" />
            <Kpi
              label="Last transfer batch"
              value={lastTransferBatch ? `${fdate(lastTransferBatch.date)} • ${fd(lastTransferBatch.total, 0)}` : "—"}
              color="var(--mu)"
            />
          </div>

          {pendingExpanded && (
            <>
              <table className="tbl" style={{ marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Loads</th>
                    <th>Released</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingByCustomer.map((c) => (
                    <tr key={c.customer}>
                      <td>{c.customer}</td>
                      <td>{c.count}</td>
                      <td>{fd(c.released, 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{pending.count}</td>
                    <td>{fd(pending.total, 0)}</td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Released</th>
                      <th>Invoice</th>
                      <th>Customer</th>
                      <th>Carrier</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.rows.map((r, i) => (
                      <tr key={r.invoice_number || i}>
                        <td>{r.release_date ? fdate(r.release_date) : "—"}</td>
                        <td>{r.invoice_number}</td>
                        <td>{r.customer || "—"}</td>
                        <td>{r.carrier || "—"}</td>
                        <td>{fd(r.release_amount || r.released_reserves || r.reserves || 0, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className="card"
          style={{
            marginBottom: 14,
            border: "1px solid #3ddc84",
            background: "linear-gradient(180deg, rgba(61,220,132,0.08) 0%, rgba(61,220,132,0.02) 100%)",
          }}
        >
          <div className="ctit" style={{ marginBottom: 2, color: "#3ddc84" }}>Reserves to Transfer — All caught up ✓</div>
          <div style={{ fontSize: 12, color: "var(--mu)" }}>
            Every released reserve has been transferred out of CE East.
            {lastTransferBatch && (
              <> Last batch: {fdate(lastTransferBatch.date)}, {lastTransferBatch.count} loads, {fd(lastTransferBatch.total, 2)}.</>
            )}
          </div>
        </div>
      )}

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
