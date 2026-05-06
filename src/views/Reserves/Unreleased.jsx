import { useMemo, useState } from "react";
import { fd, fdate } from "../../lib/format";

const COLS = [
  { k: "invoice_number", label: "Invoice", type: "text" },
  { k: "invoice_date", label: "Inv Date", type: "date" },
  { k: "customer", label: "Customer", type: "text" },
  { k: "carrier", label: "Carrier", type: "text" },
  { k: "invoice_amount", label: "Gross", type: "money" },
  { k: "carrier_pay", label: "Carrier Pay", type: "money" },
  { k: "fees", label: "Fee", type: "money" },
  { k: "reserves", label: "Reserve Held", type: "money" },
  { k: "age", label: "Age", type: "num" },
  { k: "source_sheet", label: "Sheet", type: "text" },
];

export default function Unreleased({ rows }) {
  const [sortKey, setSortKey] = useState("invoice_date");
  const [sortDir, setSortDir] = useState("desc");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      COLS.some((c) => String(r[c.k] ?? "").toLowerCase().includes(needle))
    );
  }, [rows, q]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return out;
  }, [filtered, sortKey, sortDir]);

  const totals = useMemo(() => ({
    count: filtered.length,
    gross: filtered.reduce((s, r) => s + (r.invoice_amount || 0), 0),
    carrier: filtered.reduce((s, r) => s + (r.carrier_pay || 0), 0),
    fee: filtered.reduce((s, r) => s + (r.fees || 0), 0),
    reserve: filtered.reduce((s, r) => s + (r.reserves || 0), 0),
  }), [filtered]);

  const onSort = (k) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const renderCell = (r, col) => {
    const v = r[col.k];
    if (v == null || v === "") return "—";
    if (col.type === "money") return fd(v, 0);
    if (col.type === "date") return fdate(v);
    if (col.type === "num") return v;
    return v;
  };

  return (
    <div>
      <div className="g4" style={{ marginBottom: 14 }}>
        <Kpi label="Unreleased Loads" value={totals.count} color="#f5c542" />
        <Kpi label="Gross" value={fd(totals.gross, 0)} color="#3ddc84" />
        <Kpi label="Carrier Pay" value={fd(totals.carrier, 0)} color="#ff8a65" />
        <Kpi label="Reserve Held" value={fd(totals.reserve, 0)} color="#f5c542" big />
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <div className="ctit" style={{ marginBottom: 0 }}>Unreleased Loads — Detail</div>
          <input
            className="input"
            placeholder="Search invoice, customer, carrier, lane…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 280 }}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.k} onClick={() => onSort(c.k)}>
                    {c.label}{sortKey === c.k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.invoice_number || i}>
                  {COLS.map((c) => <td key={c.k}>{renderCell(r, c)}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Totals · {totals.count} loads</td>
                <td>{fd(totals.gross, 0)}</td>
                <td>{fd(totals.carrier, 0)}</td>
                <td>{fd(totals.fee, 0)}</td>
                <td>{fd(totals.reserve, 0)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
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
