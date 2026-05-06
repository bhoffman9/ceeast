export const fd = (n, d = 2) => {
  if (n == null || isNaN(n) || !isFinite(n)) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const fn = (n, d = 1) => {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const fp = (n) => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(1) + "%";

export const fdate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString("en-US", { year: "2-digit", month: "short", day: "numeric" });
};
