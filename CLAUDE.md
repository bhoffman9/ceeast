# CE East Dashboard — CLAUDE.md

Capacity Express East LLC — owner-facing dashboard.

> **As of 2026-06-20 the dashboard is Income-only.** The **Reserves** and **Commissions** tabs were removed from `src/App.jsx`. Their view components (`Reserves/`, `Commissions.jsx`), the reserve CSV/PDF pipeline (`process.py`, `public/data/*.csv`), and `kris_payments.csv` all remain in the repo and are recoverable from git — they're just no longer surfaced in the UI. The sections documenting them below are retained for that reason and are flagged **[UNWIRED]**.

**Live tab:**
- **Income** (default) — live QBO P&L + Balance Sheet, distribution estimator, shareholder payback tracker

**Removed 2026-06-20 (data/pipeline still maintained, UI unwired):**
- **Reserves** — load-by-load reserve tracking against the live load book + Flexent PDFs, with per-invoice transfer queue
- **Commissions** — partner commission tracker (Kris on On Services loads). Dropped because funded commission needs the hauler carrier cost, which lives only in Ben's Excel — Alvys exposes `TripValue` (the full billed rate = invoice amount), not the outside-hauler cost, so it can't supply funded.

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
├── docs/                         # Archived reserve PDFs (re-read by process.py every run; gitignored)
├── public/
│   └── data/
│       ├── loads.csv             # Output: every CE East load + release status (dashboard reads this)
│       ├── reserve_status.csv    # Output: PDF-parsed release events (audit; CE East only)
│       ├── reserve_transfers.csv # Manually maintained: invoices where the cash was moved out of CE East
│       └── kris_payments.csv     # Manually maintained: per-leg payments made to Kris (Commissions tab)
└── src/
    ├── main.jsx
    ├── App.jsx                   # Shell + top-level tab navigation
    ├── PasswordGate.jsx          # Wraps App; 30-day localStorage; password = "East"
    ├── styles.js                 # All CSS (dark theme + tabs + tables)
    ├── lib/
    │   ├── format.js             # fd, fn, fp, fdate
    │   ├── data.js               # CSV fetchers + numeric coercion (loadReservesData, loadKrisPayments, loadReserveTransfers)
    │   └── qbo.js                # CFO-dashboard QBO endpoint client (Income tab)
    └── views/
        ├── OwnerPayback.jsx      # Tab 1 (labeled "Income") — live QBO P&L + BS + payback estimator
        ├── Commissions.jsx       # Tab 3 — Kris on On Services (25% funded + 25% released reserves; per-leg checkmarks)
        └── Reserves/
            ├── index.jsx         # Tab 2 shell — sub-tabs Unreleased (default) | Released
            ├── Unreleased.jsx    # Live exposure: KPI tiles + searchable/sortable load detail
            └── Released.jsx      # Reserves-to-Transfer panel + all-time customer roll-up + per-load detail
```

The component file is still named `OwnerPayback.jsx` for git history; the displayed tab label is "Income."

## Tab Structure

Top-level tabs in [src/App.jsx](src/App.jsx) — **only Income is wired as of 2026-06-20**:
1. **Income** (default) — live QBO P&L + BS, distribution estimator, shareholder payback tracker

**[UNWIRED]** (removed from `TABS` array 2026-06-20; components still in repo — re-add the import + `TABS` entry to restore):
2. **Reserves** — sub-tabs: **Unreleased** (default — live exposure) and **Released** (Reserves-to-Transfer queue + all-time customer rollup)
3. **Commissions** — Partner commission tracker scoped to Kris on On Services loads (25% of `funded` per load + 25% of released reserves for `customer = "On Services"`). See [src/views/Commissions.jsx](src/views/Commissions.jsx).

## Weekly Monday workflow

> Steps 3, 4, 6 below are **Commissions-related and now obsolete** (tab removed 2026-06-20) unless the Commissions tab is revived. The reserve steps (1, 2, 5) still apply if/when the Reserves tab is re-wired.

Ben drops `CliRsvRept*.pdf` (the latest Flexent reserve report) and the updated Excel into [incoming/](incoming/). Assistant runs the full drill end-to-end:

1. `python process.py` — refreshes [public/data/loads.csv](public/data/loads.csv) and [reserve_status.csv](public/data/reserve_status.csv). Reads PDFs from both `incoming/` and `docs/` so PDF-only release flags persist; filters reserve_status to CE East invoices to drop CE Brokerage noise.
2. **Reserves to Transfer** — diff PDF-released loads against [reserve_transfers.csv](public/data/reserve_transfers.csv). Report new cash sitting in CE East that needs to be moved out.
3. **New On Services loads** — flag any On Services invoices new to the Excel since last week, with funded amount + projected Kris commission.
4. **Newly released On Services reserves** — list reserve commission newly owed to Kris (25% × actual release amount; use `released_reserves` for Triumph-era).
5. **Sanity audit** — cross-check `reserve_status.csv` PDF events vs dashboard release status; confirm no On Services release got dropped.
6. **Commissions cycle check** — flag any On Services load whose funded leg has been unpaid for >2 weeks.

Then ask Ben:
- Did you transfer the cash? → append to [reserve_transfers.csv](public/data/reserve_transfers.csv)
- Did you pay Kris? → append per-leg rows to [kris_payments.csv](public/data/kris_payments.csv)

Commit + push to `main` → Vercel redeploys.

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

## Tab 3: Commissions (Kris on On Services) — [UNWIRED 2026-06-20]

Kris is a partner whose commission is tied to On Services loads only:
- **Funded commission** = 25% × `funded` (the CSV column) — earned once the load is funded, regardless of release
- **Reserve commission** = 25% × released reserves — earned when Flexent releases the 5% reserve

Both legs sum to "Total Kris" per load. Pending reserve commission is shown in yellow for unreleased loads.

Data: filtered from `public/data/loads.csv` (`customer === "On Services"`) + `public/data/kris_payments.csv` (manually maintained record of payments made to Kris).

### kris_payments.csv schema
```
payment_date, invoice_number, leg, amount, notes
```
One row per (invoice, leg) paid. `leg` is `funded` or `reserve`. **Multiple rows per (invoice, leg) are allowed** — the dashboard sums them. Within 1¢ of the expected commission → green ✓ "fully paid". Less than expected → yellow ½ "partial" with `expected − paid` carried as outstanding (tooltip shows the breakdown).

### Allocation when Ben pays a lump sum
Ben's preferred mode is "apply it however you need to, even if an invoice is partial" (confirmed 2026-05-18). When a payment arrives without a leg list:
1. Snapshot unpaid funded legs as of the payment date (not today)
2. Sort oldest invoice_date first
3. Allocate the lump sum across them in order
4. Split the final load to hit the exact total (partial row)

Don't include reserve legs unless Ben explicitly says so.

### Payment history (verified)
- 2026-01-29 $620.00 — funded for 37077/37078/37079/37080 (4 × $155)
- 2026-02-25 $613.25 — funded for 38009/38250/38013/38011/38012/38251 ($496.25, incl. −$141.25 on 38013 loss) + reserves for 37077-37080 ($117)
- 2026-03-20 $1,147.50 — funded for 38247/38248/38249/38496/38498
- 2026-04-13 $1,917.50 — funded for 38497/38499/38846/38847/39400/39399/39398/39417
- 2026-05-12 $2,041.31 — funded for 38246 + 11 April invoices (oldest-first) + $51.28 partial on 2000561 ($123.72 still owed)

---

## Tab 2: Reserves (CSV pipeline) — [UNWIRED 2026-06-20; pipeline still maintained]

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
   - Moves `incoming/` PDFs to `docs/`. **If a same-named PDF already exists in `docs/`, adds a date-stamp suffix** (e.g. `CliRsvRept (1)_20260518.pdf`) instead of overwriting — Flexent re-uses filenames like `CliRsvRept (1).pdf` week to week and overwrites would silently destroy historical PDF coverage. Excel stays in `incoming/` (Ben keeps editing it)
3. Commit + push `loads.csv` + `reserve_status.csv` — Vercel redeploys

The Excel itself is gitignored (payroll, contact info, expenses). PDFs are also gitignored. Only the derived CSV gets committed.

### Run state (2026-05-18)
- 630 loads parsed and deduped
- 431 released
  - **110** released by Flexent (`release_source=flexent`, PDF-backed)
  - **321** released by Triumph (`release_source=triumph`, Excel-only — pre-Flexent)
- 199 unreleased — **$22,334 in reserves still held by Flexent** (future inflow to CE East at 5%)
  - Concentrated in On Services ($6.2K, 35 loads), Gofo Inc ($5.4K, 18 loads), Rentex ($5.2K, 101 loads)
- Reserve transfer queue: **All caught up ✓** ($8,011.78 transferred to date across 110 loads)
- Kris commission status: $8,685.88 earned / $6,339.54 paid / **$2,346.36 outstanding**

### Avg days from invoice → reserve release (Flexent era, n=40 of 110)
- Rentex: **27 days** (fastest)
- On Services: 33 days
- Insync Productions: 39 days
- Gofo Inc: **110 days** (outlier — investigate)
- All customers: 38 days avg / 33 median
- Excluding Gofo: 32.5 days avg / 29 median

**Data quality caveat:** 70 of 110 Flexent-released loads have a blank `invoice_date` in the Excel (63 of those are Rentex). Days-to-pay numbers are only based on the 40 loads that have both dates. Back-fill invoice_date for the missing 70 to get a more reliable customer-aging picture.

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
- **"Reserves to Transfer"** is the gold-bordered panel at the top of the Released sub-tab. It shows every Flexent-PDF-released load whose `invoice_number` is NOT yet in [public/data/reserve_transfers.csv](public/data/reserve_transfers.csv). When empty, it flips to a green "All caught up" state. Schema: `transfer_date, invoice_number, amount, notes`. The `transfer_date` column is history/audit only — the pending filter is just `released && release_date && !transferred`.
- **Loan principals are hardcoded.** Ben confirmed Anthony repaid in full 2026-05-07. Update `SHAREHOLDER` constant in `OwnerPayback.jsx` if a new contribution happens.
- **Income tab depends on the CFO dashboard staying live.** Loose coupling per Ben's decision (Path B).

## Dependencies on Other Projects

| Project | Purpose | Failure mode |
|---|---|---|
| CFO dashboard (`cfo-dashboard-eta.vercel.app`) | Hosts `/api/qbo-pnl` and `/api/qbo-bs` for `company=ce_east` | Income tab fails to load (Reserves still works) |
| QBO OAuth tokens (Supabase `qbo_tokens` row for `ce_east`) | P&L + BS data source | Income tab returns 401 → reconnect via CFO dashboard's Connect button |
| Flexent reserve report PDFs | Authoritative release source for Flexent-era loads + powers the Reserves-to-Transfer queue | Missing weekly PDF → new releases don't surface, transfer queue goes stale |

## Open Items / TODO

- **Back-fill `invoice_date` for the 70 Flexent-released loads missing it in the Excel** (63 Rentex + 4 On Services + 2 Gofo Express + 1 Insync) — currently breaks days-to-pay analysis
- Investigate why Gofo Inc reserves take ~110 days to release (vs ~27 days for Rentex)
- Collect remaining $123.72 from Kris payment for 2000561 next time he gets paid (partial after 5/12)
- Per-customer aging on Unreleased (days since invoice_date → flag stale reserves)
- CSV export button on the Unreleased tab
- Optional: pull Chris's contribution principal from QBO journal entries (currently hardcoded — QBO equity shows current balance, not original deposit)
- Optional: "Data refreshed: YYYY-MM-DD" timestamp on the Reserves tab so viewers know how stale the snapshot is
- Resolve whether 7-digit `2000xxx`/`2001xxx` invoices in the CE East Excel are actually CE East or were mis-keyed from CE Brokerage — currently they show up under the Commissions tab via `customer = "On Services"` matching

## Related Projects

- **Flexent dashboard** (`Desktop/Freight/`) — independent reserve pipeline + `ce_east_funding.csv` for bank funding reconciliation. Doesn't share data with this project.
- **CFO dashboard** (`Desktop/Freight/cfo-dashboard/`) — owns the QBO OAuth tokens and serves the `qbo-pnl` + `qbo-bs` endpoints this dashboard consumes. Also has its own CE East panel showing the same QBO data alongside CE & SF Combined.
