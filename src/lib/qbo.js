const PNL_BASE = "https://cfo-dashboard-eta.vercel.app/api/qbo-pnl?company=ce_east";
const BS_BASE  = "https://cfo-dashboard-eta.vercel.app/api/qbo-bs?company=ce_east";

const pad = (n) => String(n).padStart(2, "0");

export const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const lastDayOfMonth = (year, month0) => new Date(year, month0 + 1, 0).getDate();

export const fetchPnl = async (start, end) => {
  const url = `${PNL_BASE}&start_date=${start}&end_date=${end}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`QBO P&L ${start}..${end}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`QBO: ${data.error}`);
  return data.report;
};

export const fetchBs = async () => {
  const res = await fetch(BS_BASE, { cache: "no-store" });
  if (!res.ok) throw new Error(`QBO BS: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`QBO: ${data.error}`);
  return data.bs;
};

// Pull everything Owner Payback needs in parallel.
// Returns: { allTime, ytd, lastYear, months: [{label, start, end, report}, ...] }
export const fetchOwnerPaybackData = async () => {
  const today = new Date();
  const todayStr = fmtDate(today);
  const yearNow = today.getFullYear();

  // Last 3 *complete* months — today is May 7 2026 → Feb, Mar, Apr 2026
  const months = [];
  for (let i = 3; i >= 1; i--) {
    const monthStart = new Date(yearNow, today.getMonth() - i, 1);
    const y = monthStart.getFullYear();
    const m = monthStart.getMonth();
    months.push({
      label: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      start: `${y}-${pad(m + 1)}-01`,
      end: `${y}-${pad(m + 1)}-${lastDayOfMonth(y, m)}`,
    });
  }

  const [allTime, ytd, lastYear, bs, ...monthReports] = await Promise.all([
    fetchPnl("2020-01-01", todayStr),                                  // since inception (CE East formed 2025)
    fetchPnl(`${yearNow}-01-01`, todayStr),                            // YTD
    fetchPnl(`${yearNow - 1}-01-01`, `${yearNow - 1}-12-31`),          // prior full year
    fetchBs(),                                                          // current BS (Due From Anthony, etc.)
    ...months.map((m) => fetchPnl(m.start, m.end)),
  ]);

  return {
    allTime,
    ytd,
    lastYear,
    bs,
    months: months.map((m, i) => ({ ...m, report: monthReports[i] })),
    ytdDays: Math.ceil((today - new Date(`${yearNow}-01-01`)) / (1000 * 60 * 60 * 24)) + 1,
  };
};
