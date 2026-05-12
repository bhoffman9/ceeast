import { useEffect, useMemo, useState } from "react";
import { loadReservesData, loadReserveTransfers } from "../../lib/data";
import Unreleased from "./Unreleased";
import Released from "./Released";

export default function Reserves() {
  const [sub, setSub] = useState("unreleased");
  const [loads, setLoads] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadReservesData(), loadReserveTransfers()])
      .then(([l, t]) => { setLoads(l); setTransfers(t); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const { unreleased, released } = useMemo(() => ({
    unreleased: loads.filter((l) => !l.released),
    released: loads.filter((l) => l.released),
  }), [loads]);

  return (
    <div>
      <div className="ptitle">CE East — Reserves</div>
      <div className="psub">Tracking reserve releases against the live load book</div>

      <div className="subtabs">
        <div className={"subtab" + (sub === "unreleased" ? " active" : "")} onClick={() => setSub("unreleased")}>
          Unreleased ({unreleased.length})
        </div>
        <div className={"subtab" + (sub === "released" ? " active" : "")} onClick={() => setSub("released")}>
          Released ({released.length})
        </div>
      </div>

      {err && <div className="err">Failed to load data: {err}</div>}
      {loading && <div className="empty">Loading…</div>}
      {!loading && !err && loads.length === 0 && (
        <div className="empty">
          No load data yet. Drop your CE East load file at <code>public/data/loads.csv</code> and reserve PDFs in <code>incoming/</code>, then run <code>python extract_reserves.py</code>.
        </div>
      )}
      {!loading && !err && loads.length > 0 && (
        sub === "unreleased" ? <Unreleased rows={unreleased} /> : <Released rows={released} transfers={transfers} />
      )}
    </div>
  );
}
