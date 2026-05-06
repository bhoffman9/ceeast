export const CSS = `
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
.bdg-y { background: rgba(245,197,66,.1); color: var(--ye); border-color: rgba(245,197,66,.4); }

/* tabs */
.tabs { display: flex; gap: 4px; padding: 0 22px; background: var(--s1); border-bottom: 1px solid var(--bd); }
.tab { font-family: var(--f2); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  padding: 12px 18px; cursor: pointer; color: var(--mu); border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s; }
.tab:hover { color: var(--tx); }
.tab.active { color: var(--or); border-bottom-color: var(--or); }

.subtabs { display: flex; gap: 4px; margin-bottom: 18px; border-bottom: 1px solid var(--bd); }
.subtab { font-family: var(--f2); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  padding: 8px 14px; cursor: pointer; color: var(--mu); border-bottom: 2px solid transparent; }
.subtab:hover { color: var(--tx); }
.subtab.active { color: var(--ye); border-bottom-color: var(--ye); }

/* layout */
.main { flex: 1; padding: 22px; max-width: 1160px; width: 100%; margin: 0 auto; }
.ptitle { font-family: var(--f2); font-size: 32px; font-weight: 900; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 3px; }
.psub { font-size: 10px; color: var(--mu); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }

/* grids */
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

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
.input { background: var(--bg); border: 1px solid var(--bd); border-radius: 3px;
  padding: 6px 10px; color: var(--tx); font-family: var(--f1); font-size: 11px; outline: none; }
.input:focus { border-color: var(--or); }

/* progress bar */
.bar { height: 5px; background: var(--bd); border-radius: 3px; overflow: hidden; margin-top: 6px; }
.bfil { height: 100%; border-radius: 3px; }

/* table */
.tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
.tbl th { background: var(--s2); color: var(--mu); font-family: var(--f2); font-size: 9px;
  font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 8px 9px;
  text-align: right; border-bottom: 1px solid var(--bd); white-space: nowrap; cursor: pointer; user-select: none; }
.tbl th:first-child, .tbl th:nth-child(2) { text-align: left; }
.tbl th:hover { color: var(--tx); }
.tbl td { padding: 6px 9px; border-bottom: 1px solid var(--bd); text-align: right; }
.tbl td:first-child, .tbl td:nth-child(2) { text-align: left; }
.tbl tr:hover td { background: var(--s2); }
.tbl tfoot td { background: var(--s2); font-family: var(--f2); font-weight: 700;
  font-size: 11px; color: var(--or); border-top: 1px solid var(--or); }

/* info boxes */
.ibox { background: var(--orl); border: 1px solid rgba(244,120,32,.35); border-radius: 3px;
  padding: 11px 14px; font-size: 11px; line-height: 1.7; margin-bottom: 14px; }
.empty { padding: 40px 20px; text-align: center; color: var(--mu); font-size: 11px; }
.err { padding: 14px 16px; background: rgba(255,82,82,.08); border: 1px solid rgba(255,82,82,.35);
  border-radius: 3px; color: var(--rd); font-size: 11px; margin-bottom: 14px; }

@media (max-width: 700px) {
  .g2, .g3, .g4 { grid-template-columns: 1fr; }
  .main { padding: 14px; }
  .hbdg { display: none; }
}
`;
