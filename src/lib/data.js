import Papa from "papaparse";

const NUM_COLS = new Set([
  "age",
  "invoice_amount",
  "funded",
  "reserves",
  "released_reserves",
  "fees",
  "carrier_pay",
  "release_amount",
]);

const BOOL_COLS = new Set(["released"]);

const coerce = (row) => {
  const out = { ...row };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v == null || v === "") {
      if (NUM_COLS.has(k)) out[k] = null;
      continue;
    }
    if (NUM_COLS.has(k)) {
      const n = Number(String(v).replace(/[$,]/g, ""));
      out[k] = isNaN(n) ? null : n;
    } else if (BOOL_COLS.has(k)) {
      out[k] = String(v).toLowerCase() === "true";
    }
  }
  return out;
};

const fetchCsv = async (path) => {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data.map(coerce);
};

export const loadReservesData = async () => {
  return await fetchCsv("/data/loads.csv");
};

export const loadKrisPayments = async () => {
  const rows = await fetchCsv("/data/kris_payments.csv");
  return rows.map((r) => ({
    ...r,
    payment_amount: Number(String(r.payment_amount || "0").replace(/[$,]/g, "")) || 0,
  }));
};
