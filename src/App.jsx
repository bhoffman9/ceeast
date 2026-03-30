import { useState } from "react";

// ── HELPERS ──────────────────────────────────────────────────
const fd = (n, d = 2) => {
  if (n == null || isNaN(n) || !isFinite(n)) return "—";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};
const fn = (n, d = 1) => {
  if (n == null || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
};
const fp = n => (n == null || isNaN(n)) ? "—" : Number(n).toFixed(1) + "%";


const CE_EAST = {
  // Balance Sheet — as of Mar 30, 2026
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
  // P&L — All Dates (lifetime)
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
    // Salary breakdown
    salCEEmployee: 9900.00, salColombia: 53925.90, salNelly: 4000.00, salShareholder: 20000.00,
  },
  // CE East monthly 2026 (from monthly P&L)
  months2026: [
    { m:"Jan 26", rev:258555.00, gp:33360.69, carrier:220755.00, fees:4439.31, exp:24581.60, netInc:8779.09 },
    { m:"Feb 26", rev:156830.01, gp:30796.68, carrier:123492.50, fees:2540.83, exp:16162.62, netInc:14634.06 },
    { m:"Mar 26", rev:182571.25, gp:48974.39, carrier:132815.00, fees:781.86,  exp:12666.87, netInc:36307.52 },
  ],
  // 2026 YTD totals from monthly P&L
  ytd2026: {
    revenue: 597956.26, carrier: 477062.50, fees: 7762.00, cogs: 484824.50,
    grossProfit: 113131.76, expenses: 53411.09, netIncome: 59720.67,
  },
  ytdDays: 89,  // Jan 1 – Mar 30, 2026
};

let MONTHLY_REVENUE = [
  { m:"Jan 25", ce:497382.58,  di:1711.95,   sf:292888.00, total:791982.53,   gp:425681.70  },
  { m:"Feb 25", ce:686500.11,  di:9952.70,   sf:292092.07, total:988544.88,   gp:497290.85  },
  { m:"Mar 25", ce:592210.90,  di:289.80,    sf:284544.97, total:877045.67,   gp:431962.46  },
  { m:"Apr 25", ce:869265.27,  di:5760.98,   sf:358950.85, total:1233977.10,  gp:717272.72  },
  { m:"May 25", ce:862538.86,  di:3702.65,   sf:538481.33, total:1404722.84,  gp:759321.74  },
  { m:"Jun 25", ce:938510.81,  di:6187.50,   sf:481709.97, total:1426408.28,  gp:742241.86  },
  { m:"Jul 25", ce:527972.77,  di:13759.82,  sf:300008.34, total:841740.93,   gp:485307.97  },
  { m:"Aug 25", ce:410166.07,  di:28767.54,  sf:264170.48, total:703104.09,   gp:398559.76  },
  { m:"Sep 25", ce:1076320.01, di:22451.73,  sf:302688.84, total:1401460.58,  gp:687931.95  },
  { m:"Oct 25", ce:1395076.43, di:1679.60,   sf:349400.22, total:1746156.25,  gp:822352.46  },
  { m:"Nov 25", ce:1005762.30, di:14476.99,  sf:259241.07, total:1279480.36,  gp:591933.37  },
  { m:"Dec 25", ce:943893.79,  di:40732.01,  sf:232991.76, total:1222781.06,  gp:460955.04  },
  { m:"Jan 26", ce:663460.14,  di:14947.25,  sf:314754.40, total:993161.79,   gp:480933.50  },
];

const INCOME_2025 = {
  total: 13917404.57,
  grossProfit: 7020811.88,
};

function CEEast() {
  const [distAmt, setDistAmt] = useState(Math.round(CE_EAST.months2026.reduce((s,r)=>s+r.gp,0) / CE_EAST.months2026.length * 0.5));

  const bs = CE_EAST.bs;
  const pl = CE_EAST.pl;

  // ── Shareholder obligations ──
  const dueToChr  = bs.shareholderChris;
  const dueToAnt  = bs.shareholderAnthony;
  const totalDue  = dueToChr + dueToAnt;
  const dueFromAnt = bs.dueFromAnthony;

  const gpAllTime = pl.grossProfit;
  const gap       = totalDue - gpAllTime;

  // ── 2026 GP pace — from actual monthly data ──
  const monthlyGP  = CE_EAST.months2026.reduce((s,r)=>s+r.gp,0) / CE_EAST.months2026.length; // avg of Jan/Feb/Mar
  const monthsLeft = Math.max(0, gap / monthlyGP);

  // ── Distribution date ──
  const distDate = new Date(2026, 2, 18);
  distDate.setDate(distDate.getDate() + Math.ceil(monthsLeft * 30.44));
  const distStr  = distDate.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });

  // ── Distribution splits ──
  const OWNERS = [
    { name:"Chris",         pct:0.45, color:"#ff5252" },
    { name:"Anthony",       pct:0.45, color:"#4fc3f7" },
    { name:"Gabriel Colon", pct:0.04, color:"#3ddc84" },
    { name:"Jon Marcus",    pct:0.06, color:"#f5c542" },
  ];
  const monthlyDist = distAmt;
  const annualDist  = monthlyDist * 12;

  // ── 2026 monthly revenue (from MONTHLY_REVENUE) ──
  const rev2026 = MONTHLY_REVENUE.filter(r => r.m.includes("26"));
  const rev2025Total = INCOME_2025.total;
  const rev2025GP    = INCOME_2025.grossProfit;

  return (
    <div>
      <div className="ptitle">CE East — Owner Payback</div>
      <div className="psub">Distributions begin when cumulative gross profit exceeds shareholder loans</div>


      {/* 2025 + 2026 revenue — top horizontal */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14 }}>
        <div className="card">
          <div className="ctit">2025 Full Year — CE East</div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--bd)" }}>
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:"var(--tx)" }}>Gross Profit</div>
              <div style={{ fontSize:10,color:"var(--mu)" }}>{fp(43372.61/481841.01*100)} GP margin</div>
            </div>
            <div style={{ fontFamily:"var(--f2)",fontSize:28,fontWeight:900,color:"#f5c542" }}>{fd(43372.61,0)}</div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0" }}>
            <div style={{ fontSize:11,color:"var(--tx)" }}>Total Revenue</div>
            <div style={{ fontFamily:"var(--f2)",fontSize:18,fontWeight:700,color:"#3ddc84" }}>{fd(481841.01,0)}</div>
          </div>
        </div>
        <div className="card">
          <div className="ctit">2026 Monthly Revenue — CE East</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            {CE_EAST.months2026.map(row => (
              <div key={row.m} style={{ background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:3,padding:"12px 14px" }}>
                <div style={{ fontFamily:"var(--f2)",fontSize:13,fontWeight:800,letterSpacing:1,color:"var(--or)",marginBottom:6 }}>{row.m}</div>
                <div style={{ fontFamily:"var(--f2)",fontSize:26,fontWeight:900,color:"#f5c542",lineHeight:1 }}>{fd(row.gp,0)}</div>
                <div style={{ fontSize:9,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase",marginTop:2,marginBottom:6 }}>Gross Profit</div>
                <div style={{ fontSize:12,color:"#3ddc84" }}>{fd(row.rev,0)}</div>
                <div style={{ fontSize:9,color:"var(--mu)" }}>Revenue · {fp(row.gp/row.rev*100)}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0 0",borderTop:"1px solid var(--bd)",marginTop:10 }}>
            <div style={{ fontSize:11,fontWeight:800,color:"var(--tx)" }}>2026 YTD Total</div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"var(--f2)",fontSize:20,fontWeight:900,color:"#f5c542" }}>
                {fd(CE_EAST.months2026.reduce((s,r)=>s+r.gp,0),0)} GP
              </div>
              <div style={{ fontSize:10,color:"var(--mu)" }}>
                {fd(CE_EAST.months2026.reduce((s,r)=>s+r.rev,0),0)} revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="g2" style={{ marginBottom:14 }}>
        {/* Left: Distribution estimator */}
        <div>
          <div className="card" style={{ marginBottom:14 }}>
            <div className="ctit">Distribution Estimator</div>

            {/* Slider + input */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <label className="lbl" style={{ margin:0 }}>Monthly Distribution Amount</label>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <span style={{ color:"var(--mu)",fontSize:14 }}>$</span>
                  <input type="number" min={0} max={Math.round(monthlyGP)} step={500} value={distAmt}
                    onChange={e => setDistAmt(Math.min(Math.round(monthlyGP), Math.max(0, +e.target.value || 0)))}
                    style={{
                      width:120, fontFamily:"var(--f2)", fontSize:22, fontWeight:900, color:"#3ddc84",
                      background:"var(--bg)", border:"1px solid var(--bd)", borderRadius:3,
                      padding:"4px 8px", textAlign:"right", outline:"none",
                    }} />
                </div>
              </div>
              <input type="range" min={0} max={Math.round(monthlyGP)} step={500} value={distAmt}
                onChange={e => setDistAmt(+e.target.value)}
                style={{ width:"100%",accentColor:"#3ddc84" }} />
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--mu)",marginTop:4 }}>
                <span>$0</span><span>$8K</span><span>$16K</span><span>$24K</span><span>{fd(monthlyGP,0)}</span>
              </div>
            </div>

            {/* Total distribution result */}
            <div style={{ background:"rgba(61,220,132,.08)",border:"1px solid rgba(61,220,132,.2)",
              borderRadius:3,padding:"14px",marginBottom:14,textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#3ddc84",letterSpacing:3,textTransform:"uppercase",marginBottom:4 }}>Total Monthly Distribution</div>
              <div style={{ fontFamily:"var(--f2)",fontSize:44,fontWeight:900,color:"#3ddc84",lineHeight:1 }}>
                {fd(monthlyDist,0)}<span style={{ fontSize:16,color:"var(--mu)" }}>/mo</span>
              </div>
              <div style={{ fontSize:11,color:"var(--mu)",marginTop:4 }}>{fd(annualDist,0)}/yr · {fp(monthlyGP > 0 ? monthlyDist/monthlyGP*100 : 0)} of {fd(monthlyGP,0)}/mo avg GP</div>
            </div>

            {/* Owner splits */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
              {OWNERS.map(o => (
                <div key={o.name} style={{ background:"var(--bg)",border:`1px solid ${o.color}30`,
                  borderRadius:3,padding:"12px",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:o.color,letterSpacing:2,textTransform:"uppercase",marginBottom:4 }}>
                    {o.name} · {fp(o.pct*100)}
                  </div>
                  <div style={{ fontFamily:"var(--f2)",fontSize:24,fontWeight:900,color:o.color }}>{fd(monthlyDist*o.pct,0)}</div>
                  <div style={{ fontSize:10,color:"var(--mu)",marginTop:2 }}>per month · {fd(monthlyDist*o.pct*12,0)}/yr</div>
                </div>
              ))}
            </div>

            {/* Quick reference table */}
            <div style={{ fontSize:10,color:"var(--mu)",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>Quick Reference</div>
            {[25,50,75,100].map(pct => {
              const mo = Math.round(monthlyGP * pct/100);
              const sel = distAmt === mo;
              return (
                <div key={pct} onClick={() => setDistAmt(mo)} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",marginBottom:4,borderRadius:3,cursor:"pointer",
                  background:sel?"rgba(61,220,132,.1)":"var(--bg)",
                  border:`1px solid ${sel?"#3ddc84":"var(--bd)"}`,
                }}>
                  <span style={{ fontFamily:"var(--f2)",fontSize:14,fontWeight:700,color:sel?"#3ddc84":"var(--mu)" }}>{pct}% of GP</span>
                  <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                    <span style={{ fontFamily:"var(--f2)",fontSize:16,fontWeight:800,color:sel?"#3ddc84":"var(--tx)" }}>{fd(mo,0)}/mo</span>
                    <span style={{ fontSize:10,color:"var(--mu)" }}>{fd(mo*12,0)}/yr</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shareholder breakdown */}
          <div className="card">
            <div className="ctit">Shareholder Breakdown — Contributions</div>

            {/* Chris */}
            <div style={{ padding:"12px 0",borderBottom:"1px solid var(--bd)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11,color:"var(--tx)",fontWeight:600,marginBottom:4 }}>Chris Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width:"100%",background:"#3ddc84" }} /></div>
                  <div style={{ fontSize:10,color:"#3ddc84",fontWeight:700,marginTop:4 }}>✓ Repaid in full — March 2026 via gross profits</div>
                </div>
                <div style={{ textAlign:"right",marginLeft:16 }}>
                  <div style={{ fontFamily:"var(--f2)",fontSize:24,fontWeight:900,color:"#3ddc84" }}>{fd(dueToChr,0)}</div>
                  <div style={{ fontSize:9,color:"var(--mu)" }}>100% repaid</div>
                </div>
              </div>
            </div>

            {/* Anthony */}
            <div style={{ padding:"12px 0",borderBottom:"1px solid var(--bd)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11,color:"var(--tx)",fontWeight:600,marginBottom:4 }}>Anthony Contribution</div>
                  <div className="bar"><div className="bfil" style={{ width:"50%",background:"#f5c542" }} /></div>
                  <div style={{ fontSize:10,color:"#f5c542",fontWeight:600,marginTop:4 }}>🔄 $6,810 repaid — $6,810 remaining (50%)</div>
                </div>
                <div style={{ textAlign:"right",marginLeft:16 }}>
                  <div style={{ fontFamily:"var(--f2)",fontSize:24,fontWeight:900,color:"#ff8a65" }}>{fd(dueToAnt,0)}</div>
                  <div style={{ fontSize:9,color:"var(--mu)" }}>50% repaid</div>
                </div>
              </div>
            </div>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12 }}>
              <div style={{ fontFamily:"var(--f2)",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"var(--mu)" }}>Total Contributions</div>
              <div style={{ fontFamily:"var(--f2)",fontSize:26,fontWeight:900,color:"var(--tx)" }}>{fd(totalDue,0)}</div>
            </div>
            {/* Anthony offset */}
            <div style={{ marginTop:12,padding:"12px 14px",
              background:"rgba(79,195,247,.07)",border:"1px solid rgba(79,195,247,.25)",borderRadius:3 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:9,color:"#4fc3f7",letterSpacing:2,textTransform:"uppercase",marginBottom:3 }}>Separate — Due FROM Anthony</div>
                  <div style={{ fontSize:10,color:"var(--mu)" }}>Anthony owes the company · not part of threshold</div>
                </div>
                <div style={{ fontFamily:"var(--f2)",fontSize:22,fontWeight:900,color:"#4fc3f7",marginLeft:16 }}>{fd(dueFromAnt,0)}</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* All-Time P&L — GP and Net Income prominent */}
          <div className="card">
            <div className="ctit">All-Time P&L — CE East</div>
            <div style={{ fontSize:9,color:"var(--mu)",marginBottom:14 }}>All dates · as of Mar 30, 2026</div>

            {/* Two hero numbers */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
              <div style={{ background:"rgba(245,197,66,.08)",border:"1px solid rgba(245,197,66,.25)",borderRadius:4,padding:"16px",textAlign:"center" }}>
                <div style={{ fontSize:9,color:"#f5c542",letterSpacing:3,textTransform:"uppercase",marginBottom:6 }}>Gross Profit</div>
                <div style={{ fontFamily:"var(--f2)",fontSize:36,fontWeight:900,color:"#f5c542",lineHeight:1 }}>{fd(pl.grossProfit,0)}</div>
                <div style={{ fontSize:10,color:"var(--mu)",marginTop:4 }}>{fp(pl.grossProfit/pl.revenue*100)} margin</div>
              </div>
              <div style={{ background:pl.netIncome>=0?"rgba(61,220,132,.08)":"rgba(255,82,82,.08)",border:`1px solid ${pl.netIncome>=0?"rgba(61,220,132,.25)":"rgba(255,82,82,.25)"}`,borderRadius:4,padding:"16px",textAlign:"center" }}>
                <div style={{ fontSize:9,color:pl.netIncome>=0?"#3ddc84":"#ff5252",letterSpacing:3,textTransform:"uppercase",marginBottom:6 }}>Net Income</div>
                <div style={{ fontFamily:"var(--f2)",fontSize:36,fontWeight:900,color:pl.netIncome>=0?"#3ddc84":"#ff5252",lineHeight:1 }}>{fd(pl.netIncome,0)}</div>
                <div style={{ fontSize:10,color:"var(--mu)",marginTop:4 }}>{fp(pl.netIncome/pl.revenue*100)} net margin</div>
              </div>
            </div>

            {/* Full breakdown */}
            {[
              { label:"Total Revenue",         val:pl.revenue,       color:"#3ddc84" },
              { label:"Carrier Pay",            val:-pl.carrierPay,   color:"#ff5252" },
              { label:"Triumph/Flexent Fees",   val:-pl.merchantFees, color:"#ff8a65" },
              { label:"Gross Profit",           val:pl.grossProfit,   color:"#f5c542", bold:true },
              { label:"Salaries & Wages",       val:-pl.salaries,     color:"#ff5252" },
              { label:"Freight Insurance",      val:-pl.freightIns,   color:"#ff5252" },
              { label:"Computers & Software",   val:-pl.computers,    color:"#ff5252" },
              { label:"Travel Expenses",        val:-pl.travel,       color:"#ff5252" },
              { label:"Other Expenses",         val:-(pl.expenses-pl.salaries-pl.freightIns-pl.computers-pl.travel), color:"#ff5252" },
              { label:"Net Income",             val:pl.netIncome,     color:pl.netIncome>=0?"#3ddc84":"#ff5252", bold:true },
            ].map(item => (
              <div key={item.label} style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"7px 0",borderBottom:"1px solid var(--bd)",
                background:item.bold?"rgba(245,197,66,.04)":"transparent",
              }}>
                <div>
                  <div style={{ fontSize:11,color:item.bold?item.color:"var(--tx)",fontWeight:item.bold?700:400 }}>{item.label}</div>
                  {!item.bold && <div style={{ fontSize:9,color:"var(--mu)" }}>{fp(Math.abs(item.val)/pl.revenue*100)} of revenue</div>}
                </div>
                <div style={{ fontFamily:"var(--f2)",fontSize:item.bold?18:14,fontWeight:item.bold?900:600,color:item.color }}>
                  {fd(item.val,0)}
                </div>
              </div>
            ))}
          </div>

          {/* Reserves Due */}
          <div style={{
            marginTop:14,padding:"20px 22px",borderRadius:6,
            background:"linear-gradient(135deg,rgba(245,197,66,.12),rgba(245,197,66,.04))",
            border:"2px solid rgba(245,197,66,.4)",
          }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"var(--f2)",fontSize:14,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"#f5c542",marginBottom:4 }}>Reserves Due</div>
                <div style={{ fontSize:12,color:"var(--mu)" }}>Reserves held — released upon customer payment</div>
              </div>
              <div style={{ fontFamily:"var(--f2)",fontSize:36,fontWeight:900,color:"#f5c542",marginLeft:16 }}>{fd(13683.50,0)}</div>
            </div>
          </div>

          {/* Monthly Expense Snapshot */}
          <div className="card" style={{ marginTop:14 }}>
            <div className="ctit">Avg Monthly Expense Snapshot</div>
            <div style={{ fontSize:10,color:"var(--mu)",marginBottom:10 }}>Fixed/recurring monthly costs — CE East operations</div>
            {(() => {
              const items = [
                { label:"CE East Staff",       amt:7250,    color:"#4fc3f7" },
                { label:"Computer & Software", amt:2280,    color:"#b39ddb" },
                { label:"Freight Insurance",   amt:1930.73, color:"#ff8a65" },
                { label:"Rent",                amt:1100,    color:"#f47820" },
                { label:"Nelly",               amt:1000,    color:"#3ddc84" },
                { label:"Sales Commission",    amt:750,     color:"#f5c542" },
                { label:"Utilities",           amt:600,     color:"#26a69a" },
                { label:"Vinix",               amt:188.64,  color:"#ef5350" },
              ];
              const total = items.reduce((s,i) => s+i.amt, 0);
              return (
                <>
                  {items.map(item => (
                    <div key={item.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"6px 0",borderBottom:"1px solid var(--bd)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <div style={{ width:8,height:8,borderRadius:2,background:item.color,flexShrink:0 }} />
                        <span style={{ fontSize:11,color:"var(--tx)" }}>{item.label}</span>
                      </div>
                      <span style={{ fontFamily:"var(--f2)",fontSize:13,fontWeight:700,color:item.color }}>{fd(item.amt,0)}/mo</span>
                    </div>
                  ))}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10 }}>
                    <span style={{ fontFamily:"var(--f2)",fontSize:12,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"var(--or)" }}>Total Monthly</span>
                    <span style={{ fontFamily:"var(--f2)",fontSize:20,fontWeight:900,color:"var(--or)" }}>{fd(total,0)}/mo</span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"flex-end",fontSize:10,color:"var(--mu)",marginTop:2 }}>
                    {fd(total*12,0)}/yr
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

// ── STYLES ────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0b0d10; --s1: #12151c; --s2: #181c26; --bd: #1f2535;
  --or: #f47820; --or2: #c45e10; --orl: rgba(244,120,32,.12);
  --ye: #f5c542; --gn: #3ddc84; --rd: #ff5252; --bl: #4fc3f7; --pu: #b39ddb;
  --tx: #e8eaf0; --mu: #5a6370;
  --f1: 'IBM Plex Mono', monospace; --f2: 'Barlow Condensed', sans-serif;
}
body { background: var(--bg); color: var(--tx); font-family: var(--f1); }
.app { display: flex; flex-direction: column; min-height: 100vh; }

/* header */
.hdr { background: var(--s1); border-bottom: 2px solid var(--or); height: 52px;
  display: flex; align-items: center; padding: 0 22px; gap: 14px; }
.logo { font-family: var(--f2); font-size: 22px; font-weight: 900; letter-spacing: 3px; color: var(--or); }
.logo b { color: var(--ye); font-weight: 900; }
.hsub { font-size: 10px; color: var(--mu); letter-spacing: 2px; text-transform: uppercase;
  border-left: 1px solid var(--bd); padding-left: 12px; }
.hbdg { margin-left: auto; display: flex; gap: 7px; }
.bdg { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; padding: 3px 8px;
  border-radius: 2px; border: 1px solid; }
.bdg-o { background: var(--orl); color: var(--or); border-color: var(--or); }
.bdg-g { background: rgba(61,220,132,.1); color: var(--gn); border-color: rgba(61,220,132,.4); }

/* layout */
.main { flex: 1; padding: 22px; max-width: 1160px; width: 100%; margin: 0 auto; }
.ptitle { font-family: var(--f2); font-size: 32px; font-weight: 900; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 3px; }
.psub { font-size: 10px; color: var(--mu); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }

/* grids */
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

/* cards */
.card { background: var(--s1); border: 1px solid var(--bd); border-radius: 4px; padding: 18px; }
.ctit { font-family: var(--f2); font-size: 11px; font-weight: 700; letter-spacing: 3px;
  text-transform: uppercase; color: var(--or); margin-bottom: 14px; }

/* kpi tiles */
.kpi { background: var(--s2); border: 1px solid var(--bd); border-radius: 3px; padding: 13px 15px; }
.klbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--mu); margin-bottom: 4px; }
.kval { font-family: var(--f2); font-size: 24px; font-weight: 800; line-height: 1; }
.ksub { font-size: 10px; color: var(--mu); margin-top: 3px; }

/* inputs */
.lbl { display: block; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--mu); margin-bottom: 4px; }

/* progress bar */
.bar { height: 5px; background: var(--bd); border-radius: 3px; overflow: hidden; margin-top: 6px; }
.bfil { height: 100%; border-radius: 3px; }

/* table */
.tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
.tbl th { background: var(--s2); color: var(--mu); font-family: var(--f2); font-size: 9px;
  font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 8px 9px;
  text-align: right; border-bottom: 1px solid var(--bd); white-space: nowrap; }
.tbl th:first-child, .tbl th:nth-child(2) { text-align: left; }
.tbl td { padding: 6px 9px; border-bottom: 1px solid var(--bd); text-align: right; }
.tbl td:first-child, .tbl td:nth-child(2) { text-align: left; }
.tbl tr:hover td { background: var(--s2); }
.tbl tfoot td { background: var(--s2); font-family: var(--f2); font-weight: 700;
  font-size: 11px; color: var(--or); border-top: 1px solid var(--or); }

/* info boxes */
.ibox { background: var(--orl); border: 1px solid rgba(244,120,32,.35); border-radius: 3px;
  padding: 11px 14px; font-size: 11px; line-height: 1.7; margin-bottom: 14px; }

@media (max-width: 700px) {
  .g2, .g3 { grid-template-columns: 1fr; }
  .main { padding: 14px; }
  .hbdg { display: none; }
}
`;

// ── APP ──────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="hdr">
        <div className="logo">CE<b>EAST</b></div>
        <div className="hsub">Capacity Express East LLC</div>
        <div className="hbdg">
          <div className="bdg bdg-o">Owner Dashboard</div>
          <div className="bdg bdg-g">Live</div>
        </div>
      </div>
      <div className="main">
        <CEEast />
      </div>
    </div>
  );
}
