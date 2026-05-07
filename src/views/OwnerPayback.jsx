import { useEffect, useMemo, useState } from "react";
import { fd, fp } from "../lib/format";
import { fetchOwnerPaybackData } from "../lib/qbo";

// ── Hardcoded contribution amounts ─────────────────────────────
// Original loan principals stay hardcoded — QBO Shareholder Contributions account
// shows current balance after distributions, not the original deposit amount.
// Update if a new contribution is made.
const SHAREHOLDER = {
  chris:    { name: "Chris",   contributed: 129642.77, repaid: 129642.77, status: "✓ Repaid in full — March 2026 via gross profits" },
  anthony:  { name: "Anthony", contributed: 13620.48,  repaid: 13620.48,  status: "✓ Repaid in full" },
  // dueFromAnthony comes live from QBO BS (assets["Due from Shareholder - Anthony"])
};

// Owner distribution split (policy, not data)
const OWNERS = [
  { name: "Chris",         pct: 0.45, color: "#ff5252" },
  { name: "Anthony",       pct: 0.45, color: "#4fc3f7" },
  { name: "Gabriel Colon", pct: 0.04, color: "#3ddc84" },
  { name: "Jon Marcus",    pct: 0.06, color: "#f5c542" },
];

export default function OwnerPayback() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [distAmt, setDistAmt] = useState(0);

  useEffect(() => {
    fetchOwnerPaybackData()
      .then((d) => {
        setData(d);
        // Default the distribution slider to 50% of avg monthly GP
        const avgGp = d.months.reduce((s, m) => s + (m.report.totals.grossProfit || 0), 0) / d.months.length;
        setDistAmt(Math.round(avgGp * 0.5 / 500) * 500);
      })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="err">Failed to load QBO P&L: {err}</div>;
  if (!data) return <div className="empty">Loading live QBO data…</div>;

  return <OwnerPaybackBody data={data} distAmt={distAmt} setDistAmt={setDistAmt} />;
}

function OwnerPaybackBody({ data, distAmt, setDistAmt }) {
  const ytdT = data.ytd.totals;
  const allTimeT = data.allTime.totals;
  const lastYearT = data.lastYear.totals;

  const monthlyGPs = data.months.map((m) => m.report.totals.grossProfit || 0);
  const avgMonthlyGP = useMemo(() =>
    monthlyGPs.length ? monthlyGPs.reduce((s, x) => s + x, 0) / monthlyGPs.length : 0,
    [monthlyGPs]
  );

  const totalContrib = SHAREHOLDER.chris.contributed + SHAREHOLDER.anthony.contributed;
  const totalRepaid = SHAREHOLDER.chris.repaid + SHAREHOLDER.anthony.repaid;
  const remainingDue = totalContrib - totalRepaid;
  const dueFromAnthony = data.bs?.assets?.["Due from Shareholder - Anthony"] || 0;

  const monthlyDist = distAmt;
  const annualDist = monthlyDist * 12;

  // Avg monthly expense run-rate from YTD expense breakdown
  const ytdExpenses = data.ytd.expenses || {};
  const ytdMonths = Math.max(1, data.ytdDays / 30.44);
  const expenseLineItems = Object.entries(ytdExpenses)
    .map(([label, amt]) => ({ label, amt: amt / ytdMonths }))
    .sort((a, b) => b.amt - a.amt);
  const totalMonthlyExp = expenseLineItems.reduce((s, i) => s + i.amt, 0);
  const expColors = ["#4fc3f7", "#b39ddb", "#ff8a65", "#f47820", "#3ddc84", "#f5c542", "#26a69a", "#ef5350", "#ce93d8", "#ffd54f"];

  // P&L breakdown for the All-Time card
  const breakdown = [
    { label: "Total Revenue",        val: ytdT.totalIncome,       color: "#3ddc84" },
    { label: "Cost of Goods Sold",   val: -(ytdT.totalCOGS || 0), color: "#ff5252" },
    { label: "Gross Profit",         val: ytdT.grossProfit,       color: "#f5c542", bold: true },
    { label: "Total Expenses",       val: -(ytdT.totalExpenses || 0), color: "#ff5252" },
    { label: "Net Income",           val: ytdT.netIncome,         color: ytdT.netIncome >= 0 ? "#3ddc84" : "#ff5252", bold: true },
  ];

  return (
    <div>
      <div className="ptitle">CE East — Owner Payback</div>
      <div className="psub">Distributions begin when cumulative gross profit exceeds shareholder loans · live QBO</div>

      {/* 2025 + 2026 monthly strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="ctit">{new Date().getFullYear() - 1} Full Year — CE East</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--bd)" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)" }}>Gross Profit</div>
              <div style={{ fontSize: 10, color: "var(--mu)" }}>{fp((lastYearT.grossProfit / lastYearT.totalIncome) * 100)} GP margin</div>
            </div>
            <div style={{ fontFamily: "var(--f2)", fontSize: 28, fontWeight: 900, color: "#f5c542" }}>{fd(lastYearT.grossProfit, 0)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 11, color: "var(--tx)" }}>Total Revenue</div>
            <div style={{ fontFamily: "var(--f2)", fontSize: 18, fontWeight: 700, color: "#3ddc84" }}>{fd(lastYearT.totalIncome, 0)}</div>
          </div>
        </div>
        <div className="card">
          <div className="ctit">Last 3 Months — CE East</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {data.months.map((m) => {
              const t = m.report.totals;
              const gp = t.grossProfit || 0;
              const rev = t.totalIncome || 0;
              return (
                <div key={m.label} style={{ background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 3, padding: "12px 14px" }}>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 13, fontWeight: 800, letterSpacing: 1, color: "var(--or)", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 26, fontWeight: 900, color: "#f5c542", lineHeight: 1 }}>{fd(gp, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2, marginBottom: 6 }}>Gross Profit</div>
                  <div style={{ fontSize: 12, color: "#3ddc84" }}>{fd(rev, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)" }}>Revenue · {rev > 0 ? fp((gp / rev) * 100) : "—"}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 0", borderTop: "1px solid var(--bd)", marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--tx)" }}>{new Date().getFullYear()} YTD Total</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--f2)", fontSize: 20, fontWeight: 900, color: "#f5c542" }}>{fd(ytdT.grossProfit, 0)} GP</div>
              <div style={{ fontSize: 10, color: "var(--mu)" }}>{fd(ytdT.totalIncome, 0)} revenue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 14 }}>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="ctit">Distribution Estimator</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="lbl" style={{ margin: 0 }}>Monthly Distribution Amount</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "var(--mu)", fontSize: 14 }}>$</span>
                  <input type="number" min={0} max={Math.round(avgMonthlyGP)} step={500} value={distAmt}
                    onChange={(e) => setDistAmt(Math.min(Math.round(avgMonthlyGP), Math.max(0, +e.target.value || 0)))}
                    style={{
                      width: 120, fontFamily: "var(--f2)", fontSize: 22, fontWeight: 900, color: "#3ddc84",
                      background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 3,
                      padding: "4px 8px", textAlign: "right", outline: "none",
                    }} />
                </div>
              </div>
              <input type="range" min={0} max={Math.round(avgMonthlyGP)} step={500} value={distAmt}
                onChange={(e) => setDistAmt(+e.target.value)}
                style={{ width: "100%", accentColor: "#3ddc84" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--mu)", marginTop: 4 }}>
                <span>$0</span>
                <span>{fd(avgMonthlyGP * 0.25, 0)}</span>
                <span>{fd(avgMonthlyGP * 0.5, 0)}</span>
                <span>{fd(avgMonthlyGP * 0.75, 0)}</span>
                <span>{fd(avgMonthlyGP, 0)}</span>
              </div>
            </div>

            <div style={{
              background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.2)",
              borderRadius: 3, padding: "14px", marginBottom: 14, textAlign: "center"
            }}>
              <div style={{ fontSize: 9, color: "#3ddc84", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Total Monthly Distribution</div>
              <div style={{ fontFamily: "var(--f2)", fontSize: 44, fontWeight: 900, color: "#3ddc84", lineHeight: 1 }}>
                {fd(monthlyDist, 0)}<span style={{ fontSize: 16, color: "var(--mu)" }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 4 }}>
                {fd(annualDist, 0)}/yr · {fp(avgMonthlyGP > 0 ? (monthlyDist / avgMonthlyGP) * 100 : 0)} of {fd(avgMonthlyGP, 0)}/mo avg GP
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {OWNERS.map((o) => (
                <div key={o.name} style={{
                  background: "var(--bg)", border: `1px solid ${o.color}30`,
                  borderRadius: 3, padding: "12px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 9, color: o.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                    {o.name} · {fp(o.pct * 100)}
                  </div>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 24, fontWeight: 900, color: o.color }}>{fd(monthlyDist * o.pct, 0)}</div>
                  <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 2 }}>per month · {fd(monthlyDist * o.pct * 12, 0)}/yr</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, color: "var(--mu)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Quick Reference</div>
            {[25, 50, 75, 100].map((pct) => {
              const mo = Math.round(avgMonthlyGP * pct / 100);
              const sel = distAmt === mo;
              return (
                <div key={pct} onClick={() => setDistAmt(mo)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", marginBottom: 4, borderRadius: 3, cursor: "pointer",
                  background: sel ? "rgba(61,220,132,.1)" : "var(--bg)",
                  border: `1px solid ${sel ? "#3ddc84" : "var(--bd)"}`,
                }}>
                  <span style={{ fontFamily: "var(--f2)", fontSize: 14, fontWeight: 700, color: sel ? "#3ddc84" : "var(--mu)" }}>{pct}% of GP</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--f2)", fontSize: 16, fontWeight: 800, color: sel ? "#3ddc84" : "var(--tx)" }}>{fd(mo, 0)}/mo</span>
                    <span style={{ fontSize: 10, color: "var(--mu)" }}>{fd(mo * 12, 0)}/yr</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="ctit">Shareholder Breakdown — Contributions</div>

            <div style={{ padding: "12px 0", borderBottom: "1px solid var(--bd)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--tx)", fontWeight: 600, marginBottom: 4 }}>{SHAREHOLDER.chris.name} Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width: `${(SHAREHOLDER.chris.repaid / SHAREHOLDER.chris.contributed) * 100}%`, background: "#3ddc84" }} /></div>
                  <div style={{ fontSize: 10, color: "#3ddc84", fontWeight: 700, marginTop: 4 }}>{SHAREHOLDER.chris.status}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16 }}>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 24, fontWeight: 900, color: "#3ddc84" }}>{fd(SHAREHOLDER.chris.contributed, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)" }}>{fp((SHAREHOLDER.chris.repaid / SHAREHOLDER.chris.contributed) * 100)} repaid</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 0", borderBottom: "1px solid var(--bd)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--tx)", fontWeight: 600, marginBottom: 4 }}>{SHAREHOLDER.anthony.name} Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width: "100%", background: "#3ddc84" }} /></div>
                  <div style={{ fontSize: 10, color: "#3ddc84", fontWeight: 700, marginTop: 4 }}>{SHAREHOLDER.anthony.status}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16 }}>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 24, fontWeight: 900, color: "#3ddc84" }}>{fd(SHAREHOLDER.anthony.contributed, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)" }}>{fp((SHAREHOLDER.anthony.repaid / SHAREHOLDER.anthony.contributed) * 100)} repaid</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
              <div style={{ fontFamily: "var(--f2)", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "var(--mu)" }}>Total Contributions</div>
              <div style={{ fontFamily: "var(--f2)", fontSize: 26, fontWeight: 900, color: "var(--tx)" }}>{fd(totalContrib, 0)}</div>
            </div>

            <div style={{
              marginTop: 12, padding: "12px 14px",
              background: "rgba(79,195,247,.07)", border: "1px solid rgba(79,195,247,.25)", borderRadius: 3
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#4fc3f7", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Separate — Due FROM Anthony</div>
                  <div style={{ fontSize: 10, color: "var(--mu)" }}>Anthony owes the company · not part of threshold</div>
                </div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 22, fontWeight: 900, color: "#4fc3f7", marginLeft: 16 }}>{fd(dueFromAnthony, 0)}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 9, color: "var(--mu)", textAlign: "center", fontStyle: "italic" }}>
              Due-from-Anthony pulled live from QBO · contribution principals entered manually
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ctit">{new Date().getFullYear()} YTD P&L — CE East · Live QBO</div>
            <div style={{ fontSize: 9, color: "var(--mu)", marginBottom: 14 }}>
              {data.ytd && `Jan 1 – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`} · {data.ytdDays} days
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "rgba(245,197,66,.08)", border: "1px solid rgba(245,197,66,.25)", borderRadius: 4, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#f5c542", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Gross Profit</div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 36, fontWeight: 900, color: "#f5c542", lineHeight: 1 }}>{fd(ytdT.grossProfit, 0)}</div>
                <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>{fp((ytdT.grossProfit / ytdT.totalIncome) * 100)} margin</div>
              </div>
              <div style={{
                background: ytdT.netIncome >= 0 ? "rgba(61,220,132,.08)" : "rgba(255,82,82,.08)",
                border: `1px solid ${ytdT.netIncome >= 0 ? "rgba(61,220,132,.25)" : "rgba(255,82,82,.25)"}`,
                borderRadius: 4, padding: "16px", textAlign: "center"
              }}>
                <div style={{ fontSize: 9, color: ytdT.netIncome >= 0 ? "#3ddc84" : "#ff5252", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Net Income</div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 36, fontWeight: 900, color: ytdT.netIncome >= 0 ? "#3ddc84" : "#ff5252", lineHeight: 1 }}>{fd(ytdT.netIncome, 0)}</div>
                <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>{fp((ytdT.netIncome / ytdT.totalIncome) * 100)} net margin</div>
              </div>
            </div>

            {breakdown.map((item) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 0", borderBottom: "1px solid var(--bd)",
                background: item.bold ? "rgba(245,197,66,.04)" : "transparent",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: item.bold ? item.color : "var(--tx)", fontWeight: item.bold ? 700 : 400 }}>{item.label}</div>
                  {!item.bold && ytdT.totalIncome > 0 && <div style={{ fontSize: 9, color: "var(--mu)" }}>{fp(Math.abs(item.val) / ytdT.totalIncome * 100)} of revenue</div>}
                </div>
                <div style={{ fontFamily: "var(--f2)", fontSize: item.bold ? 18 : 14, fontWeight: item.bold ? 900 : 600, color: item.color }}>
                  {fd(item.val, 0)}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 12, fontSize: 9, color: "var(--mu)", textAlign: "right" }}>
              All-time GP: {fd(allTimeT.grossProfit, 0)} · NI: {fd(allTimeT.netIncome, 0)}
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="ctit">Avg Monthly Expense Run-Rate · Live QBO</div>
            <div style={{ fontSize: 10, color: "var(--mu)", marginBottom: 10 }}>
              YTD expenses ÷ {ytdMonths.toFixed(1)} months · CE East operations
            </div>
            {expenseLineItems.map((item, i) => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: "1px solid var(--bd)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: expColors[i % expColors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--tx)" }}>{item.label}</span>
                </div>
                <span style={{ fontFamily: "var(--f2)", fontSize: 13, fontWeight: 700, color: expColors[i % expColors.length] }}>{fd(item.amt, 0)}/mo</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
              <span style={{ fontFamily: "var(--f2)", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "var(--or)" }}>Total Monthly</span>
              <span style={{ fontFamily: "var(--f2)", fontSize: 20, fontWeight: 900, color: "var(--or)" }}>{fd(totalMonthlyExp, 0)}/mo</span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 10, color: "var(--mu)", marginTop: 2 }}>
              {fd(totalMonthlyExp * 12, 0)}/yr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
