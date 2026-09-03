---
title: "Finance — value investing cheatsheet"
description: "Financial statements, valuation ratios, DCF, and margin of safety."
category: "Quantitative"
tags: ["finance", "P/E", "DCF", "margin of safety"]
weight: 520
lead: "Buy businesses, not tickers."
version: "value investing"
---
Value investing means estimating a company's `intrinsic value` and buying only when Mr. Market offers it at a big enough `margin of safety`.

## Quick reference {#quickref}

The nine numbers you'll reach for first — each is expanded in the sections below.

- `P/E = Price ÷ EPS` — < 15× cheap · > 25× pricey — always compare within a sector.
- `P/B = Price ÷ Book value per share` — < 1.5× cheap · > 3× pricey. The key metric for banks, insurers, and asset-heavy firms.
- `ROE = Net income ÷ Equity` — Consistently > 15% over 5+ years = a compounding machine.
- `DCF = Σ FCFₜ/(1+r)ᵗ + TV/(1+r)ⁿ` — Intrinsic value = discounted future cash + terminal value. Run a range, never a single point.
- `Margin of safety = 1 − Price ÷ Value` — Buy only when > 30% below intrinsic value — the discount absorbs your estimation error.
- `Graham number = √(22.5 × EPS × BVPS)` — Fair-value ceiling for a defensive stock — 15× P/E × 1.5× P/B.
- `FCF = Operating cash flow − Capex` — The cash a business can return to owners. Want FCF ≈ net income.
- `EV/EBITDA = (Mkt cap + Debt − Cash) ÷ EBITDA` — < 8× cheap · > 14× pricey. Best for capital-intensive firms where depreciation hides economics.
- `PEG = P/E ÷ EPS growth rate` — < 1 cheap · > 2 pricey — credits fast growers a higher P/E.

## Value investing mindset {#start}

Four ideas define the discipline. Price is what you pay; value is what you get.

### 1. Intrinsic value

The present value of all future cash flows a business will produce. Independent of what the market quotes today.

### 2. Margin of safety

Buy only when price sits well below intrinsic value — the discount absorbs your estimation error.

### 3. Mr. Market

Graham's manic partner quotes a price daily. You're free to ignore him, or profit when he's fearful.

### 4. Circle of competence

Invest only in businesses you can understand and value. The size of the circle matters less than knowing its edge.

The fifth idea ties them together:

> **KEY:** **Think in decades, not quarters.** Compounding needs time. Treat a share as a slice of ownership in a real business you'd be glad to hold for ten years — not a ticket to flip on the next earnings print.

## Financial statements {#statements}

Three linked reports tell the story. Read them together, never in isolation.

### Income statement

- Revenue — the top line.
- COGS — direct cost of goods sold.
- Gross profit = revenue − COGS.
- Operating income — after opex.
- Net income — the bottom line.

### Balance sheet

- Assets = liabilities + equity.
- Current vs non-current.
- Watch cash, receivables, inventory.
- Watch debt, goodwill, intangibles.
- Book value = assets − liabilities.

### Cash flow statement

- Operating — cash from the business.
- Investing — capex, acquisitions.
- Financing — debt, dividends, buybacks.
- FCF = operating cash flow − capex.

What to look for:

> **✓:** **Cash is fact, earnings are opinion.** Prefer companies where `free cash flow ≈ net income`. Be wary when receivables or inventory grow faster than sales — it can mean earnings are being pulled forward with accruals.

## Valuation ratios {#ratios}

Quick heuristics for what's cheap and what's expensive. Always compare within a sector.

| Ratio | Formula | Cheap signal | Expensive signal |
| --- | --- | --- | --- |
| `P/E` | Price ÷ EPS | < 15× | > 25× |
| `P/B` | Price ÷ book value / share | < 1.5× | > 3× |
| `P/S` | Market cap ÷ revenue | < 1× | > 3× |
| `EV/EBITDA` | (Mkt cap + debt − cash) ÷ EBITDA | < 8× | > 14× |
| `PEG` | P/E ÷ EPS growth rate | < 1 | > 2 |
| `Dividend yield` | Dividend ÷ price | > 4% | < 1.5% |

Sector caveats — the same number means different things in different industries:

<details>
<summary>Why a “cheap” multiple isn't universal</summary>

#### Cyclicals

P/E looks lowest at the peak of the cycle — earnings are inflated. Use normalized, mid-cycle earnings.

#### Banks & insurers

P/E and EV/EBITDA mislead; use P/B and ROE, and watch loan-loss reserves.

#### Asset-heavy

Depreciation hides true economics; EV/EBITDA and FCF matter more than P/E.

#### Growth

A high P/E can be fair if growth and ROIC justify it; lean on PEG and DCF.

</details>

A low multiple is a hypothesis, not a verdict:

> **⌁:** Cyclicals look cheapest at the top (high earnings inflate the denominator) and dearest at the bottom. Low `P/E` can also signal a **value trap** — a cheap business in permanent decline. Cross-check every multiple against quality and growth.

## Quality metrics {#quality}

Cheap and good beats cheap and bad. These measure whether the business compounds.

- `ROE = Net income ÷ Equity` — Return on equity; consistently > 15% is strong.
- `ROIC = NOPAT ÷ Invested capital` — Value is created only when ROIC > WACC.
- `Gross margin = (Rev − COGS) ÷ Rev` — Pricing power; compare to industry peers.
- `Operating margin = Op income ÷ Rev` — Efficiency before interest and taxes.
- `Net margin = Net income ÷ Rev` — What's actually left for shareholders.
- `Debt/equity = Total debt ÷ Equity` — < 1 is conservative; check interest coverage too.
- `FCF = OCF − Capex` — Cash the business can return to owners.
- `Moat = durable advantage` — Network effects, switching costs, brand, cost lead.

## DCF & intrinsic value {#dcf}

Intrinsic value is the discounted sum of future cash. Here's the whole machine.

```
Value  = Σ FCF_t / (1 + r)^t  +  TV / (1 + r)^n
TV     = FCF_{n+1} / (r − g)              # Gordon growth (needs r > g)

Gordon growth model:  P  = D_1 / (r − g)
Present value:        PV = FV / (1 + r)^t
```

The pipeline from forecast to per-share value:

**FCF forecasts** (5–10 years) → **Discount** (@ WACC) → **+ Terminal value** (Gordon growth) → **Enterprise value** (− net debt) → **Intrinsic / share** (÷ shares)

The three knobs:

### WACC

The blended cost of capital. `WACC = (E/V)·rₑ + (D/V)·r_d·(1 − t)`. Higher WACC → lower value.

### Discount rate

The required return you demand (often 8–12%). Use it to discount each year's cash flow back to today.

### Terminal value

Value of everything beyond the forecast. Gordon growth `FCF_{n+1} / (r − g)` needs `r > g`.

Worked example — the arithmetic behind the terminal above:

<details>
<summary>DCF step by step</summary>

```
fcf  = [100, 108, 117, 126, 136]     # M, next 5 years
r    = 0.10                           # WACC / discount rate
g    = 0.03                           # perpetual growth

pv   = sum(f/(1+r)**(i+1) for i,f in enumerate(fcf))
# ≈ 90.9 + 89.3 + 87.9 + 86.1 + 84.5 = 438.6

tv    = fcf[-1] * (1+g) / (r - g)     # = 140.08 / 0.07 ≈ 2001
value = pv + tv / (1+r)**5            # = 438.6 + 1242.5 ≈ 1681

margin = 1 - price / value            # buy when > 0.30
```

</details>

> **!:** **The output is only as good as the inputs.** Small changes in `g` or the discount rate swing the answer wildly. Run a range (bear / base / bull), never a single point.

## Graham & Buffett {#graham}

Two quick intrinsic-value shortcuts and the discipline behind them.

```
Graham number  = √(22.5 × EPS × BVPS)      # 22.5 = 15 P/E × 1.5 P/B

Owner earnings = Net income
               + depreciation & amortization
               − maintenance capex
               − Δ working capital
```

Buffett's refinement of Graham:

### Defensive investor criteria

- Adequate size (a large company).
- Current ratio ≥ 2; low long-term debt.
- Positive EPS for the past 10 years.
- 20 years of uninterrupted dividends.
- EPS growth ≥ 33% over 10 years.
- P/E ≤ 15× average 3-year EPS.
- P/B ≤ 1.5× (or P/E × P/B ≤ 22.5).

### Moat thinking

“It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.” A durable moat lets a business earn excess returns for years.

`network effects` `switching costs` `cost advantage` `brand` `intangibles`

> **!:** **Owner earnings ≠ reported earnings.** It subtracts the capex needed to *maintain* the business — a company can report profit while quietly consuming its productive base.

## Screening & checklist {#process}

Turn the philosophy into a repeatable pipeline.

1. **Screen** — Filter a universe by ratios: P/E < 20, P/B < 2, ROE > 15%, debt/equity < 1, positive FCF.
1. **Read the filings** — 10-K / 10-Q, MD&A, and footnotes. Understand how the company actually makes money.
1. **Estimate intrinsic value** — DCF, Graham number, or conservative comps. Use a range, not a point.
1. **Decide** — Buy only with a margin of safety. No good price for a bad business; no bad price for a good one you don't understand.
Rules of thumb to run the first pass:

<details>
<summary>Screening criteria</summary>

- `P/E < 20, P/B < 2` — Cheap enough to investigate further.
- `ROE > 15% for 5+ years` — A compounding machine.
- `Debt/equity < 1` — Survives a downturn.
- `FCF > 0 and growing` — Real cash, not accounting profit.
- `Dividends ≤ FCF` — The payout is actually affordable.
- `Insider ownership > 0` — Management has skin in the game.

</details>

Due diligence in two columns:

### Quantitative checklist

- Revenue and EPS growth over 5–10 years.
- Stable or rising gross / operating margins.
- ROE and ROIC above cost of capital.
- FCF ≈ net income; low accruals.
- Debt serviceable; interest coverage > 3.

### Qualitative questions

- Is there a durable moat, or will competition erode it?
- Is management honest and aligned with owners?
- Is the industry growing, stable, or shrinking?
- Is there customer or supplier concentration risk?

> **✕:** **Red flags:** revenue recognized before cash, receivables/inventory outpacing sales, serial acquisitions that grow goodwill, constant non-GAAP add-backs, auditor or CFO churn, and related-party deals.

## Pitfalls {#gotchas}

Ways a value investor loses money. Know them before the market teaches you.

### Value traps

Cheap keeps getting cheaper because the business is deteriorating. Cheap ≠ undervalued. Ask the hard question: is the decline cyclical (recoverable) or secular (permanent)?

### Accounting tricks

Channel stuffing, capitalizing expenses, cookie-jar reserves, aggressive revenue recognition. Always reconcile cash flow against earnings — when they diverge, find out why.

### Survivorship bias

Backtests and index histories omit the companies that went bankrupt, so past returns look rosier than they were. You're seeing the winners who lived.

### Over-leverage

Debt amplifies losses in a downturn. A leveraged company earns more in good times, but a single bad year can wipe out equity entirely.

### Anchoring

Fixating on your purchase price or a past high instead of intrinsic value. Your cost basis is irrelevant to what the business is worth today — the market owes you nothing.

### Confirmation bias

Seeking only evidence that agrees with your thesis. Actively build the bear case and read the short sellers' argument before you buy.

### Precision illusion

A DCF spits out a number with false precision, yet small changes in growth or discount rate swing it wildly. Treat the model as a range, not a fact.

### Dilution

Stock-based compensation and secondary offerings quietly grow the share count, shrinking each share's claim. Value the business per share, not just in total.

### Recency bias

Extrapolating the last few quarters into forever. Mean reversion is brutal — growth that can't be sustained gets priced back down.
