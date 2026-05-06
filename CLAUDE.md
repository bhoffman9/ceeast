# CE East Dashboard — CLAUDE.md

Capacity Express East LLC — owner-facing dashboard. Tracks shareholder payback, reserve activity against the live load book, and (future) operational metrics specific to the East entity.

## Live URL

**https://ceeast.vercel.app** — auto-deploys on push to GitHub `master`.

## Repo

- GitHub: `bhoffman9/ceeast` (public)
- Local: `c:\Users\hoffm\Desktop\Freight\ce-east\`

## Tech Stack

- **Frontend:** React 18 + Vite 5, no router (manual tab state in `App.jsx`)
- **CSV parsing:** PapaParse (browser-side)
- **Charts:** none yet — Recharts is the default if/when we add them (consistent with sibling dashboards)
- **PDF pipeline:** Python + `pdfplumber`, run locally (no CI)
- **Styling:** dark theme, Barlow Condensed (`var(--f2)`) for headlines + IBM Plex Mono (`var(--f1)`) for body/numbers. Orange `#f47820` accent, yellow `#f5c542` highlight, green `#3ddc84` positive, red `#ff5252` negative. All CSS lives in [src/styles.js](src/styles.js).
- **Hosting:** Vercel (static SPA, no API routes / serverless yet)

## Commands

```bash
npm install          # First-time setup
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # → dist/
npm run preview      # Serve production build locally

# Pipeline (after dropping the Excel + reserve PDFs into incoming/)
pip install -r requirements.txt
python process.py
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
├── process.py                    # Excel + PDFs -> public/data/*.csv
├── incoming/                     # Drop the Excel load book + new reserve PDFs here.
│                                 #   Excel stays (live, kept updating). PDFs move to docs/ after processing.
├── docs/                         # Archived reserve PDFs after process.py runs
├── public/
│   └── data/
│       ├── loads.csv             # Output: every CE East load + release status (dashboard reads this)
│       └── reserve_status.csv    # Output: PDF-parsed release events (audit / cross-check)
└── src/
    ├── main.jsx
    ├── App.jsx                   # Shell + top-level tab navigation
    ├── styles.js                 # All CSS (dark theme + tabs + tables)
    ├── lib/
    │   ├── format.js             # fd, fn, fp, fdate
    │   └── data.js               # CSV fetch + numeric coercion
    └── views/
        ├── OwnerPayback.jsx      # Tab 1 — shareholder payback estimator + manual P&L
        └── Reserves/
            ├── index.jsx         # Tab 2 shell — sub-tabs Unreleased (default) | Released
            ├── Unreleased.jsx    # Live exposure: KPI tiles + searchable/sortable load detail
            └── Released.jsx      # Customer roll-up subtotal + collapsible per-load detail
```

## Tab Structure

Top-level tabs in [src/App.jsx](src/App.jsx):
1. **Owner Payback** (default) — shareholder loan payback estimator + 2025/2026 P&L snapshot
2. **Reserves** — sub-tabs: **Unreleased** (default, most important) and **Released**

The Reserves sub-tab default is `unreleased` because that's the live exposure — released is a historical roll-up.

## Data Flow

```
incoming/CE East Coast Expenses.xlsx ──┐
incoming/CliRsvRept*.pdf              ──┴──► process.py ──► public/data/loads.csv
                                                          └► public/data/reserve_status.csv (audit)

loads.csv ──► loadReservesData() ──► <Reserves> splits into:
                                       • released === false → <Unreleased />
                                       • released === true  → <Released />
```

The Excel is the **source of truth**. Its `RELEASED RESERVES` / `RESERVES RELEASED` column is hand-populated by Cecy (or whoever maintains the book) when reserves come in. The dashboard treats a non-zero value in that column as "released."

The PDFs are a **cross-check + date source**. `process.py` parses every `Pmt` row from the Flexent reserve detail reports and:
- fills `release_date` on rows that the Excel already marked released (Excel doesn't track dates)
- flags rows as released if the PDF shows a `Pmt` but Excel hasn't been updated yet — these get `release_source=pdf` so you can see the gap

### loads.csv schema (dashboard input)
```
invoice_number, status, invoice_date, submission_date, po_load,
customer, customer_raw, age, invoice_amount, funded, reserves, reserves_excel,
released_reserves, fees, carrier, carrier_invoice, carrier_pay, source_sheet,
released, release_date, release_amount, release_source
```
- `released` is `"true"`/`"false"` (string in CSV, coerced to bool in `lib/data.js`)
- `release_source` is `excel` (Excel column populated), `pdf` (PDF only — Excel lagging), or `both`
- `customer` is the **normalized** name (e.g. "Rentex"); `customer_raw` is the original string from the Excel cell
- `reserves` is the **5% calculated** reserve (`invoice_amount × 0.05`); `reserves_excel` is the raw Excel value (kept for audit)
- `release_amount` for released loads = the 5% reserve = the amount Flexent gives back when the customer pays
- All money columns are coerced to numbers in `lib/data.js` — `NUM_COLS` lists which keys
- `source_sheet` lets you filter by month sheet (`JAN 2026 INV`, `FEB 2026 INV`, etc.) for QA

### Reserve calculation
Flexent holds **5% of every funded invoice** as reserve. When the customer pays, that 5% is released back. `process.py` computes this per load (`RESERVE_RATE = 0.05`) — the dashboard never trusts the Excel `RESERVES` column directly because:
- old fee tiers (pre-2026) were a different rate
- some rows have stale/missing values
- the 5% rule is what's actually in the Flexent contract today

### Customer name normalizer
`process.py` collapses spelling and location variants to a canonical name via `CUSTOMER_PREFIX_RULES`. To add a new variant: append `(prefix, canonical)` to that list. Current rules consolidate `Rentex - MA` / `RENTEX MASSACHUSETTS` / `RENTEX, INC/ HQ` etc. into a single "Rentex". The original string is kept in `customer_raw` for audit.

### reserve_status.csv schema (audit only)
```
invoice_number, released, release_date, release_amount, source_pdf
```
The dashboard does NOT read this. It exists so you can audit which Pmt rows came from which PDF.

## Pipeline (process.py)

1. Drop the Excel load book + any new reserve PDFs into `incoming/`
2. `python process.py`:
   - Walks every sheet whose name contains `invoice list` or `inv` (handles both pre-Apr `Invoice/Status/...` and Apr+ `InvNo/InvDate/...` schemas)
   - Parses every `Pmt` row out of the PDFs (regex: invoice + ref + check + debtor + date + days + `Pmt` + amount)
   - Cross-merges Excel ⨝ PDF on `invoice_number`
   - Writes `loads.csv` + `reserve_status.csv`
   - Moves PDFs to `docs/`. Excel stays in `incoming/` (the user keeps editing it)
3. Commit + push `loads.csv` + `reserve_status.csv` — Vercel redeploys

**The Excel itself is gitignored** (contains payroll, contact info, expenses). Only the derived CSV gets committed.

### Initial run (2026-05-06)
- 595 loads parsed and deduped (167 from `2025 Invoice List` + 428 from monthly 2026 sheets)
- 421 released, 174 unreleased
- Unreleased exposure: $403K gross / $20K reserve held @ 5%
- Released to date: $895K gross / $44.8K reserve released @ 5%
- 79 invoices flagged released by PDFs but not yet in Excel (`release_source=pdf`) — Cecy can reconcile

## Deploy

- Push to GitHub `master` — Vercel auto-deploys.
- No env vars currently needed (no API routes, no auth).

## Key Rules

- **Owner Payback view is hand-curated** — numbers in `OwnerPayback.jsx` (BS, P&L, monthly revenue) are pasted from QBO snapshots. They do **not** auto-refresh. Update by editing the `CE_EAST` and `MONTHLY_REVENUE` constants when a new month closes.
- **Reserves view is data-driven** — never hardcode load data into JSX. All comes from `public/data/*.csv`.
- **CSV money columns are coerced to numbers** in `lib/data.js`. Non-numeric strings become `null`. If a new column needs coercion, add it to `NUM_COLS`.
- **Unreleased = `released === false` in `loads.csv`**. The Excel column is the primary signal; PDF Pmt rows fill the gap when Excel is lagging.
- **Default Reserves sub-tab is Unreleased** — that's the live exposure. Don't change without a reason.
- **Excel is gitignored.** Don't `git add` the .xlsx. Only the derived CSV is committed.
- **PDFs auto-archive.** After `process.py` runs, PDFs are in `docs/` — committing them lets you trace `release_source=pdf` rows back to a specific PDF.

## Open Items / TODO

- Add per-customer aging on Unreleased (days since invoice_date → flag stale reserves)
- Optional: CSV export button on the Unreleased tab
- Reserves Due tile on the Owner Payback tab is currently hardcoded ($13,683.50) — wire it to live `reserves` total from `loads.csv` filtered to `released=false`

## Related

- Flexent dashboard (parent): `c:\Users\hoffm\Desktop\Freight\` — has its own reserve pipeline + `ce_east_funding.csv` for bank funding reconciliation
- CFO dashboard: `c:\Users\hoffm\Desktop\Freight\cfo-dashboard\` — has live QBO P&L for `ce_east` company; this dashboard is intentionally non-QBO (manual numbers + reserve tracking)
