# CE East Dashboard — CLAUDE.md

Capacity Express East LLC — owner-facing dashboard. Two tabs:
- **Income** (default) — live QBO P&L + Balance Sheet, distribution estimator, shareholder payback tracker
- **Reserves** — load-by-load reserve tracking against the live load book + Flexent PDFs

## Live URL

**https://ceeast.vercel.app** — auto-deploys on push to GitHub `main` (note: `main`, not `master`).

Password-gated: **`East`** (defined in [src/PasswordGate.jsx](src/PasswordGate.jsx); 30-day localStorage unlock per device, override via `VITE_APP_PASSWORD` env var).

## Repo

- GitHub: `bhoffman9/ceeast` (public)
- Local: `c:\Users\hoffm\Desktop\Freight\ce-east\`

## Tech Stack

- **Frontend:** React 18 + Vite 5, no router (manual tab state in `App.jsx`)
- **CSV parsing:** PapaParse (browser-side)
- **Live QBO data:** consumed via the CFO dashboard's serverless endpoints — this project has no `api/` folder of its own
- **PDF pipeline:** Python + `pdfplumber` + `openpyxl`, run locally (no CI)
- **Styling:** dark theme, Barlow Condensed (`var(--f2)`) for headlines + IBM Plex Mono (`var(--f1)`) for body/numbers. Orange `#f47820` accent, yellow `#f5c542` highlight, green `#3ddc84` positive, red `#ff5252` negative. All CSS lives in [src/styles.js](src/styles.js).
- **Hosting:** Vercel (static SPA only — no serverless functions)

## Commands

```bash
npm install          # First-time setup
npm run dev          # Vite dev server (port varies — first free in 5173..5179)
npm run build        # → dist/
npm run preview      # Serve production build locally

# Pipeline (after dropping the Excel + new Flexent reserve PDFs into incoming/)
pip install -r requirements.txt
python process.py
git add public/data/*.csv && git commit -m "..." && git push
```

## Project Structure

```
ce-east/
├── CLAUDE.md
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── requirements.txt              # Python deps (pdfplumber, openpyxl)
├── process.py                    # Excel + PDFs → public/data/*.csv (run locally)
├── incoming/                     # Drop the Excel load book + new reserve PDFs here.
│                                 #   Excel stays (live, kept updating). PDFs move to docs/ after processing.
│                                 #   .xlsx + .pdf are gitignored — only derived CSV is committed.
├── docs/                         # Archived reserve PDFs after process.py runs (also gitignored)
├── public/
│   └── data/
│       ├── loads.csv             # Output: every CE East load + release status (dashboard reads this)
│       └── reserve_status.csv    # Output: PDF-parsed release events (audit / cross-check)
└── src/
    ├── main.jsx
    ├── App.jsx                   # Shell + top-level tab navigation
    ├── PasswordGate.jsx          # Wraps App; 30-day localStorage; password = "East"
    ├── styles.js                 # All CSS (dark theme + tabs + tables)
    ├── lib/
    │   ├── format.js             # fd, fn, fp, fdate
    │   ├── data.js               # loads.csv fetch + numeric coercion (Reserves tab)
    │   └── qbo.js                # CFO-dashboard QBO endpoint client (Income tab)
    └── views/
        ├── OwnerPayback.jsx      # Tab 1 (labeled "Income") — live QBO P&L + BS + payback estimator
        └── Reserves/
            ├── index.jsx         # Tab 2 shell — sub-tabs Unreleased (default) | Released
            ├── Unreleased.jsx    # Live exposure: KPI tiles + searchable/sortable load detail
            └── Released.jsx      # Customer roll-up subtotal + collapsible per-load detail
```

The component file is still named `OwnerPayback.jsx` for git history; the displayed tab label is "Income."

## Tab Structure

Top-level tabs in [src/App.jsx](src/App.jsx):
1. **Income** (default) — live QBO P&L + BS, distribution estimator, shareholder payback tracker
2. **Reserves** — sub-tabs: **Unreleased** (default — live exposure) and **Released** (customer rollup)

The Reserves sub-tab default is `unreleased` because that's the live exposure — Released is a historical roll-up.

---

## Tab 1: Income (live QBO)

`OwnerPayback.jsx` mounts `lib/qbo.js → fetchOwnerPaybackData()` which fires **7 parallel fetches** to the CFO dashboard:

| Endpoint | Returns |
|---|---|
| `cfo-dashboard-eta.vercel.app/api/qbo-pnl?company=ce_east` × 6 | All-time + YTD + prior full year + 3 most-recent complete months |
| `cfo-dashboard-eta.vercel.app/api/qbo-bs?company=ce_east` × 1 | Current Balance Sheet (assets / equity / liabilities) |

Both endpoints have CORS open (`*`). The CFO dashboard owns the QBO OAuth tokens and refreshes them automatically.

**Sections rendered:**
- Prior full year card — derived from the prior-year P&L call
- Last 3 Months strip — rolls dynamically based on today's date (e.g. on 2026-05-09 it shows Feb/Mar/Apr 2026)
- 2026 YTD Total — derived from YTD P&L call
- Distribution Estimator — slider/input scaled off avg of monthly GPs
- Shareholder Breakdown:
  - Chris contribution + repaid status — **hardcoded** (QBO equity shows post-distribution balance, not original principal)
  - Anthony contribution + repaid status — **hardcoded** (currently 100% repaid)
  - Due From Anthony — **live** from `bs.assets["Due from Shareholder - Anthony"]`
- YTD P&L breakdown — Total Revenue, COGS, Gross Profit, Total Expenses, Net Income
- Avg Monthly Expense Run-Rate — derived from YTD expense object ÷ months elapsed, sorted by amount

**Hardcoded constants (update in [src/views/OwnerPayback.jsx](src/views/OwnerPayback.jsx) when these change):**
- `SHAREHOLDER.chris.contributed` / `.repaid` — original principal + current paid-down amount
- `SHAREHOLDER.anthony.contributed` / `.repaid` — same
- `OWNERS` array — distribution % splits (Chris 45 / Anthony 45 / Gabriel 4 / Jon 6)

Loan principals stay hardcoded because QBO's "Shareholder Contributions - Chris" equity account shows the *current* balance after distributions, not the original deposit.

---

## Tab 2: Reserves (CSV pipeline)

```
incoming/CE East Coast Expenses.xlsx ──┐
incoming/CliRsvRept*.pdf              ──┴──► process.py ──► public/data/loads.csv
                                                          └► public/data/reserve_status.csv (audit)

loads.csv ──► loadReservesData() ──► <Reserves>
                                       • released === false → <Unreleased />
                                       • released === true  → <Released />
```

The Excel is the **load universe** — every CE East load lives in Ben's working book and `process.py` reads every sheet. But for release status, the Excel `RELEASED RESERVES` / `RESERVES RELEASED` column is **only trusted as a Triumph-era signal** (loads released under our previous factor, before Flexent). Ben's hand-keying of that column for current Flexent loads is no longer used — the PDFs are authoritative there.

The Flexent reserve PDFs are the **authoritative release source for the Flexent era**. `process.py` parses every `Pmt` row across all PDFs in both `incoming/` (new this week) and `docs/` (archived) and:
- marks the load as released, source=`flexent`, with the PDF's release date
- overrides any Excel keying on the same invoice (PDF wins)

Loads with no PDF Pmt fall back to the Excel flag and get source=`triumph` — these are pre-Flexent releases done under our prior factor, which is why no Flexent PDF will ever cover them.

### loads.csv schema
```
invoice_number, status, invoice_date, submission_date, po_load,
customer, customer_raw, age, invoice_amount, funded, reserves, reserves_excel,
released_reserves, fees, carrier, carrier_invoice, carrier_pay, source_sheet,
released, release_date, release_amount, release_source
```
- `released` is `"true"`/`"false"` (string in CSV, coerced to bool in `lib/data.js`)
- `release_source`: `flexent` (Flexent PDF Pmt row exists — authoritative) | `triumph` (Excel `RELEASED RESERVES` populated, no Flexent PDF — pre-Flexent release under our previous factor) | empty (unreleased)
- `customer` is the **normalized** name (e.g. "Rentex"); `customer_raw` preserves the original spelling for audit
- `reserves` is the **5% calculated** reserve (`invoice_amount × 0.05`); `reserves_excel` is the raw Excel value (kept for audit)
- `release_amount` for released loads = the 5% reserve = the amount Flexent gives back when the customer pays
- All money columns coerced to numbers in `lib/data.js` — `NUM_COLS` lists which keys
- `source_sheet` (`JAN 2026 INV`, etc.) for filtering and QA

### reserve_status.csv schema (audit only — dashboard does NOT read this)
```
invoice_number, released, release_date, release_amount, source_pdf
```
Flexent's `CliRsvRept` PDF covers BOTH CE and CE East under the same client number (1107208). `process.py` intersects PDF Pmt rows against the Excel load book and drops the CE-only rows (typically the 7-digit `2000xxx`/`2001xxx` invoice range, plus any 5-digit invoices not in CE East's Excel). The Excel is the canonical CE East invoice list.

### Reserve calculation
Flexent holds **5% of every funded invoice** as reserve. When the customer pays, that 5% is released back. `process.py` computes this per load (`RESERVE_RATE = 0.05`) — the dashboard never trusts the Excel `RESERVES` column directly because:
- old fee tiers (pre-2026) used different rates
- some rows have stale or missing values
- 5% is the current Flexent contract

### Customer name normalizer
`process.py` collapses spelling and location variants to a canonical name via `CUSTOMER_PREFIX_RULES`. Current rules consolidate Rentex / Insomniac / Insync / Ironclad / Capacity Express / On Services / Gofo variants. Also strips leading flags like `(Dnu)`, `(Old)`, `(New)` so footnoted entries don't fragment the rollup. Add new variants by appending `(prefix, canonical)` to the list — order matters (longer prefixes first).

### Pipeline (process.py)

1. Drop the Excel load book + any new reserve PDFs into `incoming/`
2. `python process.py`:
   - Walks every sheet whose name contains `invoice list` or `inv`. Re-detects headers as it goes — sheets like MAR 2026 have **two distinct header sections** (rows 4 and 45 with different column orders) and the parser switches mapping mid-sheet.
   - Skips footer rows (`Totals`) and embedded sub-headers (`InvNo`, `Invoice`)
   - Dedupes by invoice_number — last sheet wins (so monthly sheets supersede the 2025 list)
   - Parses every `Pmt` row out of **every PDF in `incoming/` AND every PDF in `docs/`** — Flexent reports are cumulative for the current period only, so the archive must be re-read every run or PDF-only release flags would silently drop off when a newer report supersedes an older one
   - Cross-merges Excel ⨝ PDF on `invoice_number` — PDF wins for the Flexent era; Excel flag is the fallback for Triumph-era loads
   - Writes `loads.csv` + `reserve_status.csv`
   - Moves `incoming/` PDFs to `docs/` (archived PDFs stay put). Excel stays in `incoming/` (Ben keeps editing it)
3. Commit + push `loads.csv` + `reserve_status.csv` — Vercel redeploys

The Excel itself is gitignored (payroll, contact info, expenses). PDFs are also gitignored. Only the derived CSV gets committed.

### Run state (2026-05-11)
- 614 loads parsed and deduped
- 421 released ($895K gross / $44.8K reserve released @ 5%)
  - **96** released by Flexent (`release_source=flexent`, PDF-backed)
  - **325** released by Triumph (`release_source=triumph`, Excel-only — pre-Flexent)
- 193 unreleased ($403K gross / $20.2K reserve held @ 5%)
- PDF coverage: Mar 13 → May 4, 2026 (3 archived reports in `docs/`)

## Deploy

- Push to GitHub `main` — Vercel auto-deploys (~30s)
- Bundle hash on the live HTML matches the local build hash → confirms fresh deploy
- No env vars currently set on Vercel (password gate and QBO endpoints both work without project-specific config)

## Key Rules

- **Income tab pulls live every page load.** No caching, no manual refresh. If QBO returns 401 (refresh token expired after 100 days idle), the tab shows an error message — re-OAuth via the CFO dashboard's Connect flow.
- **Reserves tab data is a snapshot.** It only changes when someone runs `process.py` and pushes the resulting CSVs.
- **Excel is gitignored.** Don't `git add` the .xlsx. Only the derived CSV is committed.
- **CSV money columns are coerced to numbers** in `src/lib/data.js`. New numeric columns must be added to `NUM_COLS`.
- **Unreleased = `released === false` in `loads.csv`**. PDF Pmt rows are the authoritative signal for the Flexent era; Excel `RELEASED RESERVES` keying is only trusted for pre-Flexent (Triumph-era) loads where no PDF exists.
- **Default Reserves sub-tab is Unreleased** — that's the live exposure. Don't change without a reason.
- **Loan principals are hardcoded.** Ben confirmed Anthony repaid in full 2026-05-07. Update `SHAREHOLDER` constant in `OwnerPayback.jsx` if a new contribution happens.
- **Income tab depends on the CFO dashboard staying live.** Loose coupling per Ben's decision (Path B).

## Dependencies on Other Projects

| Project | Purpose | Failure mode |
|---|---|---|
| CFO dashboard (`cfo-dashboard-eta.vercel.app`) | Hosts `/api/qbo-pnl` and `/api/qbo-bs` for `company=ce_east` | Income tab fails to load (Reserves still works) |
| QBO OAuth tokens (Supabase `qbo_tokens` row for `ce_east`) | P&L + BS data source | Income tab returns 401 → reconnect via CFO dashboard's Connect button |
| Flexent reserve report PDFs | `release_date` cross-check on Reserves tab | Stale dates / unreconciled `release_source=pdf` lag stays larger |

## Open Items / TODO

- Per-customer aging on Unreleased (days since invoice_date → flag stale reserves)
- CSV export button on the Unreleased tab
- Optional: pull Chris's contribution principal from QBO journal entries (currently hardcoded — QBO equity shows current balance, not original deposit)
- Optional: "Data refreshed: YYYY-MM-DD" timestamp on the Reserves tab so viewers know how stale the snapshot is

## Related Projects

- **Flexent dashboard** (`Desktop/Freight/`) — independent reserve pipeline + `ce_east_funding.csv` for bank funding reconciliation. Doesn't share data with this project.
- **CFO dashboard** (`Desktop/Freight/cfo-dashboard/`) — owns the QBO OAuth tokens and serves the `qbo-pnl` + `qbo-bs` endpoints this dashboard consumes. Also has its own CE East panel showing the same QBO data alongside CE & SF Combined.
