import { useState } from "react";
import { fd, fp } from "../lib/format";

const CE_EAST = {
  bs: {
    cash: 4907.63,
    arFunding: 75967.87, arReleased: 18359.75, arUnreleased: 11573.50,
    arFlexentReserves: 2110.00,
    arTotal: 108011.12, dueFromAnthony: 23000.00,
    totalAssets: 135918.75,
    shareholderChris: 129642.77, shareholderAnthony: 6810.24,
    totalLiab: 0,
    retainedEarnings: -51572.93, netIncome2026: 59720.67,
    totalEquity: 135918.75,
  },
  pl: {
    revenue: 1087233.77, directRevenue: 6100, revenueLoss: -13600,
    totalIncome: 1079733.77,
    cogs: 923292.90,
    grossProfit: 156440.87, expenses: 148293.13,
    netIncome: 8147.74,
    salaries: 87825.90, freightIns: 14990.24, computers: 17299.00,
    travel: 11621.19, utilities: 2984.96, officeSup: 4884.83,
    rent: 4390.00, meals: 598.11, commissions: 2880.75,
    costOfLabor: 818.15,
    carrierPay: 907175.00, merchantFees: 16117.90,
    salCEEmployee: 9900.00, salColombia: 53925.90, salNelly: 4000.00, salShareholder: 20000.00,
  },
  months2026: [
    { m: "Jan 26", rev: 258555.00, gp: 33360.69, carrier: 220755.00, fees: 4439.31, exp: 24581.60, netInc: 8779.09 },
    { m: "Feb 26", rev: 156830.01, gp: 30796.68, carrier: 123492.50, fees: 2540.83, exp: 16162.62, netInc: 14634.06 },
    { m: "Mar 26", rev: 182571.25, gp: 48974.39, carrier: 132815.00, fees: 781.86, exp: 12666.87, netInc: 36307.52 },
  ],
  ytd2026: {
    revenue: 597956.26, carrier: 477062.50, fees: 7762.00, cogs: 484824.50,
    grossProfit: 113131.76, expenses: 53411.09, netIncome: 59720.67,
  },
  ytdDays: 89,
};

export default function OwnerPayback() {
  const [distAmt, setDistAmt] = useState(
    Math.round(CE_EAST.months2026.reduce((s, r) => s + r.gp, 0) / CE_EAST.months2026.length * 0.5)
  );

  const bs = CE_EAST.bs;
  const pl = CE_EAST.pl;

  const dueToChr = bs.shareholderChris;
  const dueToAnt = bs.shareholderAnthony;
  const totalDue = dueToChr + dueToAnt;
  const dueFromAnt = bs.dueFromAnthony;

  const monthlyGP = CE_EAST.months2026.reduce((s, r) => s + r.gp, 0) / CE_EAST.months2026.length;

  const OWNERS = [
    { name: "Chris", pct: 0.45, color: "#ff5252" },
    { name: "Anthony", pct: 0.45, color: "#4fc3f7" },
    { name: "Gabriel Colon", pct: 0.04, color: "#3ddc84" },
    { name: "Jon Marcus", pct: 0.06, color: "#f5c542" },
  ];
  const monthlyDist = distAmt;
  const annualDist = monthlyDist * 12;

  return (
    <div>
      <div className="ptitle">CE East — Owner Payback</div>
      <div className="psub">Distributions begin when cumulative gross profit exceeds shareholder loans</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="ctit">2025 Full Year — CE East</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--bd)" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)" }}>Gross Profit</div>
              <div style={{ fontSize: 10, color: "var(--mu)" }}>{fp(43372.61 / 481841.01 * 100)} GP margin</div>
            </div>
            <div style={{ fontFamily: "var(--f2)", fontSize: 28, fontWeight: 900, color: "#f5c542" }}>{fd(43372.61, 0)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 11, color: "var(--tx)" }}>Total Revenue</div>
            <div style={{ fontFamily: "var(--f2)", fontSize: 18, fontWeight: 700, color: "#3ddc84" }}>{fd(481841.01, 0)}</div>
          </div>
        </div>
        <div className="card">
          <div className="ctit">2026 Monthly Revenue — CE East</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {CE_EAST.months2026.map(row => (
              <div key={row.m} style={{ background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 3, padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--f2)", fontSize: 13, fontWeight: 800, letterSpacing: 1, color: "var(--or)", marginBottom: 6 }}>{row.m}</div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 26, fontWeight: 900, color: "#f5c542", lineHeight: 1 }}>{fd(row.gp, 0)}</div>
                <div style={{ fontSize: 9, color: "var(--mu)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2, marginBottom: 6 }}>Gross Profit</div>
                <div style={{ fontSize: 12, color: "#3ddc84" }}>{fd(row.rev, 0)}</div>
                <div style={{ fontSize: 9, color: "var(--mu)" }}>Revenue · {fp(row.gp / row.rev * 100)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 0", borderTop: "1px solid var(--bd)", marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--tx)" }}>2026 YTD Total</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--f2)", fontSize: 20, fontWeight: 900, color: "#f5c542" }}>
                {fd(CE_EAST.months2026.reduce((s, r) => s + r.gp, 0), 0)} GP
              </div>
              <div style={{ fontSize: 10, color: "var(--mu)" }}>
                {fd(CE_EAST.months2026.reduce((s, r) => s + r.rev, 0), 0)} revenue
              </div>
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
                  <input type="number" min={0} max={Math.round(monthlyGP)} step={500} value={distAmt}
                    onChange={e => setDistAmt(Math.min(Math.round(monthlyGP), Math.max(0, +e.target.value || 0)))}
                    style={{
                      width: 120, fontFamily: "var(--f2)", fontSize: 22, fontWeight: 900, color: "#3ddc84",
                      background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 3,
                      padding: "4px 8px", textAlign: "right", outline: "none",
                    }} />
                </div>
              </div>
              <input type="range" min={0} max={Math.round(monthlyGP)} step={500} value={distAmt}
                onChange={e => setDistAmt(+e.target.value)}
                style={{ width: "100%", accentColor: "#3ddc84" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--mu)", marginTop: 4 }}>
                <span>$0</span><span>$8K</span><span>$16K</span><span>$24K</span><span>{fd(monthlyGP, 0)}</span>
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
              <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 4 }}>{fd(annualDist, 0)}/yr · {fp(monthlyGP > 0 ? monthlyDist / monthlyGP * 100 : 0)} of {fd(monthlyGP, 0)}/mo avg GP</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {OWNERS.map(o => (
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
            {[25, 50, 75, 100].map(pct => {
              const mo = Math.round(monthlyGP * pct / 100);
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
                  <div style={{ fontSize: 11, color: "var(--tx)", fontWeight: 600, marginBottom: 4 }}>Chris Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width: "100%", background: "#3ddc84" }} /></div>
                  <div style={{ fontSize: 10, color: "#3ddc84", fontWeight: 700, marginTop: 4 }}>✓ Repaid in full — March 2026 via gross profits</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16 }}>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 24, fontWeight: 900, color: "#3ddc84" }}>{fd(dueToChr, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)" }}>100% repaid</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 0", borderBottom: "1px solid var(--bd)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "var(--tx)", fontWeight: 600, marginBottom: 4 }}>Anthony Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width: "50%", background: "#f5c542" }} /></div>
                  <div style={{ fontSize: 10, color: "#f5c542", fontWeight: 600, marginTop: 4 }}>$6,810 repaid — $6,810 remaining (50%)</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16 }}>
                  <div style={{ fontFamily: "var(--f2)", fontSize: 24, fontWeight: 900, color: "#ff8a65" }}>{fd(dueToAnt, 0)}</div>
                  <div style={{ fontSize: 9, color: "var(--mu)" }}>50% repaid</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12 }}>
              <div style={{ fontFamily: "var(--f2)", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "var(--mu)" }}>Total Contributions</div>
              <div style={{ fontFamily: "var(--f2)", fontSize: 26, fontWeight: 900, color: "var(--tx)" }}>{fd(totalDue, 0)}</div>
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
                <div style={{ fontFamily: "var(--f2)", fontSize: 22, fontWeight: 900, color: "#4fc3f7", marginLeft: 16 }}>{fd(dueFromAnt, 0)}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="ctit">All-Time P&L — CE East</div>
            <div style={{ fontSize: 9, color: "var(--mu)", marginBottom: 14 }}>All dates · as of Mar 30, 2026</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "rgba(245,197,66,.08)", border: "1px solid rgba(245,197,66,.25)", borderRadius: 4, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#f5c542", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Gross Profit</div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 36, fontWeight: 900, color: "#f5c542", lineHeight: 1 }}>{fd(pl.grossProfit, 0)}</div>
                <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>{fp(pl.grossProfit / pl.revenue * 100)} margin</div>
              </div>
              <div style={{
                background: pl.netIncome >= 0 ? "rgba(61,220,132,.08)" : "rgba(255,82,82,.08)",
                border: `1px solid ${pl.netIncome >= 0 ? "rgba(61,220,132,.25)" : "rgba(255,82,82,.25)"}`,
                borderRadius: 4, padding: "16px", textAlign: "center"
              }}>
                <div style={{ fontSize: 9, color: pl.netIncome >= 0 ? "#3ddc84" : "#ff5252", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Net Income</div>
                <div style={{ fontFamily: "var(--f2)", fontSize: 36, fontWeight: 900, color: pl.netIncome >= 0 ? "#3ddc84" : "#ff5252", lineHeight: 1 }}>{fd(pl.netIncome, 0)}</div>
                <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 4 }}>{fp(pl.netIncome / pl.revenue * 100)} net margin</div>
              </div>
            </div>

            {[
              { label: "Total Revenue", val: pl.revenue, color: "#3ddc84" },
              { label: "Carrier Pay", val: -pl.carrierPay, color: "#ff5252" },
              { label: "Triumph/Flexent Fees", val: -pl.merchantFees, color: "#ff8a65" },
              { label: "Gross Profit", val: pl.grossProfit, color: "#f5c542", bold: true },
              { label: "Salaries & Wages", val: -pl.salaries, color: "#ff5252" },
              { label: "Freight Insurance", val: -pl.freightIns, color: "#ff5252" },
              { label: "Computers & Software", val: -pl.computers, color: "#ff5252" },
              { label: "Travel Expenses", val: -pl.travel, color: "#ff5252" },
              { label: "Other Expenses", val: -(pl.expenses - pl.salaries - pl.freightIns - pl.computers - pl.travel), color: "#ff5252" },
              { label: "Net Income", val: pl.netIncome, color: pl.netIncome >= 0 ? "#3ddc84" : "#ff5252", bold: true },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 0", borderBottom: "1px solid var(--bd)",
                background: item.bold ? "rgba(245,197,66,.04)" : "transparent",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: item.bold ? item.color : "var(--tx)", fontWeight: item.bold ? 700 : 400 }}>{item.label}</div>
                  {!item.bold && <div style={{ fontSize: 9, color: "var(--mu)" }}>{fp(Math.abs(item.val) / pl.revenue * 100)} of revenue</div>}
                </div>
                <div style={{ fontFamily: "var(--f2)", fontSize: item.bold ? 18 : 14, fontWeight: item.bold ? 900 : 600, color: item.color }}>
                  {fd(item.val, 0)}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="ctit">Avg Monthly Expense Snapshot</div>
            <div style={{ fontSize: 10, color: "var(--mu)", marginBottom: 10 }}>Fixed/recurring monthly costs — CE East operations</div>
            {(() => {
              const items = [
                { label: "CE East Staff", amt: 7250, color: "#4fc3f7" },
                { label: "Computer & Software", amt: 2280, color: "#b39ddb" },
                { label: "Freight Insurance", amt: 1930.73, color: "#ff8a65" },
                { label: "Rent", amt: 1100, color: "#f47820" },
                { label: "Nelly", amt: 1000, color: "#3ddc84" },
                { label: "Sales Commission", amt: 750, color: "#f5c542" },
                { label: "Utilities", amt: 600, color: "#26a69a" },
                { label: "Vinix", amt: 188.64, color: "#ef5350" },
              ];
              const total = items.reduce((s, i) => s + i.amt, 0);
              return (
                <>
                  {items.map(item => (
                    <div key={item.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 0", borderBottom: "1px solid var(--bd)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "var(--tx)" }}>{item.label}</span>
                      </div>
                      <span style={{ fontFamily: "var(--f2)", fontSize: 13, fontWeight: 700, color: item.color }}>{fd(item.amt, 0)}/mo</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
                    <span style={{ fontFamily: "var(--f2)", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "var(--or)" }}>Total Monthly</span>
                    <span style={{ fontFamily: "var(--f2)", fontSize: 20, fontWeight: 900, color: "var(--or)" }}>{fd(total, 0)}/mo</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 10, color: "var(--mu)", marginTop: 2 }}>
                    {fd(total * 12, 0)}/yr
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
