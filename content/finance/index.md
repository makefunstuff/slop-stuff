---
title: "Finance — value investing cheatsheet"
description: "Statements, FCFF/FCFE, ratio herding, DCF, MoS, EDGAR workflow, and AI-slop kill-list."
category: "Quantitative"
tags: ["finance", "FCFF", "DCF", "margin of safety", "ROIC"]
weight: 520
lead: "Buy businesses, not tickers — with explicit math."
version: "value investing"
---
Value investing means estimating `intrinsic value` and buying only with an explicit `margin of safety`. This page herds the formulas, ratios, and process — not vibes.

## Quick reference {#quickref}

| Thing | Formula / rule |
| --- | --- |
| `MoS` | `1 − Price/IV` — buy vs **bottom** of IV range, not a feeling |
| `EV bridge` | `MktCap + Debt + Pref + NCI − Cash (− non-ops)` |
| `FCFF` | `EBIT(1−t)+D&A−Capex−ΔNWC` → discount @ **WACC** → **EV** |
| `FCFE` | `FCFF−Int(1−t)+NetBorrow` → discount @ **r_e** → **Equity** |
| `WACC` | `(E/V)r_e + (D/V)r_d(1−t)` — **market** weights |
| `TV (Gordon)` | `FCFF_{n+1}/(WACC−g)` — need `WACC>g`; `g≲2–4%` |
| `TV (exit)` | `EBITDA_{n+1}×ExitMult` — back out implied `g` |
| `Equity/sh` | `(EV − NetDebt − Pref − NCI) / diluted shares` |
| Cash ≠ EBITDA | Prefer `CFO` / `FCF` / `FCFF` — EBITDA skips capex, WC, tax, SBC |

Eight multiples to herd (always **sector + cycle + quality**):

| Multiple | Cheap *context* | Watch |
| --- | --- | --- |
| `P/E`, fwd `P/E` | vs peers / history | cyclicals, GAAP vs non-GAAP |
| `PEG` | `<1` rough | define growth period |
| `P/B` | banks/asset-heavy | needs ROE/ROTE |
| `P/S` | early / trough | ignores margins |
| `EV/EBITDA`, `EV/EBIT` | cap-structure neutral | leases, SBC, capex |
| `EV/FCF`, FCF yield | label **equity vs firm** | define FCF |

## Mindset {#start}

Four ideas. Price is what you pay; value is what you get.

1. **Intrinsic value** — PV of future cash the business will produce.
2. **Margin of safety** — explicit % below estimated IV (sized to uncertainty).
3. **Mr. Market** — daily quote you may ignore or exploit.
4. **Circle of competence** — only businesses you can understand and value.

> **KEY:** **Think in decades.** A share is ownership in a business you'd hold for ten years — not a ticket to flip on the next print.

## Statements map {#statements}

Three reports + notes. Read together; normalize before ratios.

| Statement | What it says | Herd |
| --- | --- | --- |
| Income | Rev → COGS → GP → OpInc → NI | mix, one-offs, SBC |
| Balance | Assets = Liab + Equity | cash, AR, inv, debt, goodwill, NCI |
| Cash flow | Op / Inv / Fin | CFO vs NI; capex; buybacks |
| Equity stmt | Shares, OCI, NCI | dilution, RSU, buybacks |

**Normalize before you trust a number:**

| Adjust | Why |
| --- | --- |
| One-offs | Strip (carefully) for run-rate |
| SBC | Real cost — expense **or** dilution |
| Leases | Add for IFRS16 peer comps |
| Op vs non-op | Value non-ops separately in EV bridge |
| Diluted shares | Options/RSU treasury method |
| NCI / Pref | In EV bridge; don't orphan them |

> **✓:** **Cash is fact, earnings are opinion.** Want `FCF ≈ NI`. Rising AR/inventory vs sales → accruals / channel risk.

## Ratio tables {#ratios}

Each row: formula · meaning · use · pitfall. Prefer **5–10y** history + peers.

### Profitability

| Metric | Formula | Use | Pitfall |
| --- | --- | --- | --- |
| Gross margin | `(Rev−COGS)/Rev` | pricing power vs peers | mix / freight / reseller |
| Op margin | `EBIT/Rev` | core ops | restructuring, lease/SBC class |
| Net margin | `NI/Rev` | quick only | financing distorts — prefer FCF margin |
| ROE | `NI/Avg equity` | quality if sustained | leverage & buybacks inflate |
| ROA | `NI/Avg assets` | asset-heavy / banks | intensity differs by model |
| **ROIC** | `NOPAT/IC` · `NOPAT=EBIT(1−t)` | **ROIC>WACC** = value create | avg IC; goodwill consistency |
| FCF margin | `FCF/Rev` | cash conversion | lumpy capex; maint vs growth |

### Leverage / liquidity

| Metric | Formula | Use | Pitfall |
| --- | --- | --- | --- |
| Current | `CA/CL` | near-term solvency | inventory-heavy mirage |
| Quick | `(Cash+ST+AR)/CL` | stress | AR quality |
| D/E | `IB debt / Equity` | gearing screen | prefer **Net debt**; hybrids |
| Interest cover | `EBIT/Interest` | debt cushion | cyclical EBIT; leases |
| Net debt/EBITDA | `(Debt−cash)/EBITDA` | credit comps | EBITDA≠cash; add leases |

### Efficiency

| Metric | Formula | Use | Pitfall |
| --- | --- | --- | --- |
| Asset turnover | `Rev/Avg assets` | DuPont | model intensity |
| Inventory days | `(Avg inv/COGS)×365` | mfg/retail | seasonality, write-downs |
| DSO | `(Avg AR/Rev)×365` | collections | ↑↑ vs sales → stuffing |
| CCC | `Inv days + DSO − DPO` | WC quality | negative CCC ≠ always good |

### Valuation

| Metric | Formula | Use | Pitfall |
| --- | --- | --- | --- |
| P/E | `Price/EPS` (diluted TTM/NTM) | peer + history | cycle peak EPS |
| Fwd P/E | `Price/FY1` | growth bet | stale estimates |
| PEG | `(P/E)/g%` | growth-adj | define `g` |
| P/B | `Price/BVPS` | banks/asset-heavy | intangibles; needs ROE |
| P/S | `MktCap/Rev` | early / trough | ignores margins |
| EV/EBITDA | `EV/EBITDA` | firm comps | capex/SBC/leases |
| EV/EBIT | `EV/EBIT` | after D&A | still pre-reinvestment |
| EV/FCF | `EV/FCFF` | cash firm mult | define FCF |
| FCF yield | `FCF/MktCap` **or** `FCFF/EV` | owner screen | **label equity vs firm** |
| Earn. yield | `EPS/Price` or `EBIT(1−t)/EV` | vs bonds | earnings quality |

### Quality

| Metric | Idea | Use | Pitfall |
| --- | --- | --- | --- |
| Accruals | `(NI−CFO)/Avg assets` | earnings vs cash | single-year noise |
| Owner earnings | `NI + non-cash − maint. capex (−ΔWC)` | Buffett cash base | maint. capex is **estimate** |
| Rule of 40 | `growth% + margin% ≥ 40` | **SaaS only** | margin definition varies |

## Sector lens {#sectors}

| Sector | Prefer | Avoid / caution |
| --- | --- | --- |
| Industrials | EV multiples, ROIC, FCF | absolute “cheap P/E” |
| Banks / insurers | P/B, ROE/ROTE, NIM, NPL, capital | EV/EBITDA as primary |
| SaaS | Rule of 40, NRR, FCF margin | industrial templates |
| Cyclicals | mid-cycle / normalized EPS | trough P/E as “expensive”, peak as “cheap” |
| Asset-heavy | EV/EBITDA, FCF, maint. capex | P/E alone |

> **⌁:** Cyclicals look cheapest at the **top** (peak EPS). Low multiples can be a **value trap**.

## DCF machine {#dcf}

**Match cash to rate to value:**

| Path | Cash | Rate | Result |
| --- | --- | --- | --- |
| Firm | FCFF | WACC | Enterprise value |
| Equity | FCFE | `r_e` | Equity value |

```
# FCFF (CFA-style)
FCFF = EBIT(1−t) + D&A − Capex − ΔNWC
     = NI + NCC + Int(1−t) − FCInv − WCInv
     = CFO + Int(1−t) − Capex     # US GAAP: CFO after interest

FCFE = FCFF − Int(1−t) + NetBorrow
     = NI + NCC − FCInv − WCInv + NetBorrow

WACC = (E/V)·r_e + (D/V)·r_d·(1−t)   # V = market E+D
EV   = Σ FCFF_t/(1+WACC)^t + TV_n/(1+WACC)^n
TV   = FCFF_{n+1}/(WACC−g)           # require WACC>g
   or  EBITDA_{n+1}×ExitMult         # check implied g

Equity = EV − NetDebt − Pref − NCI (+ non-op assets)
Value/sh = Equity / diluted shares
```

**Knobs:** forecast margins/growth · WACC · `g` or exit mult · diluted count · TV share of EV (flag if `>80%`).

<details>
<summary>Tiny worked path (illustrative)</summary>

```
fcf  = [100, 108, 117, 126, 136]   # explicit FCFF
r,g  = 0.10, 0.03
pv   = Σ f/(1+r)**t
tv   = fcf[-1]*(1+g)/(r−g)
EV   = pv + tv/(1+r)**n
# then − net debt, ÷ diluted → IV/share; MoS vs bottom of range
```

</details>

> **!:** **Single-point DCF is theatre.** Bear/base/bull; sensitivity on `g`/WACC/margins; sanity-check exit mult vs peers; fade ROIC→WACC in the stable phase.

## Margin of safety {#mos}

```
MoS = 1 − Price / IntrinsicValue
# Buy when Price ≤ IV_low × (1 − required_MoS)
# e.g. IV range 80–120, require 30% → buy ≤ ~56–70 vs low end — pick a rule and stick to it
```

MoS is an **explicit haircut** to estimated IV, sized to how wrong you might be — not “feels cheap.”

## Graham shortcuts {#graham}

```
Graham number = √(22.5 × EPS × BVPS)   # 15×P/E × 1.5×P/B — ceiling heuristic, NOT IV
Owner earnings = NI + D&A + other non-cash − maintenance capex (− ΔWC if needed)
```

Defensive screen (compressed): adequate size · current ≥2 · low LT debt · 10y positive EPS · long dividend record · EPS growth · P/E≤15 on avg EPS · P/B≤1.5 (or P/E×P/B≤22.5).

> **!:** **Owner earnings ≠ reported earnings.** Maintenance capex is judgment. Graham number is a **ceiling**, not a DCF substitute.

## Workflow {#process}

1. **EDGAR** — 10-K / 10-Q / 20-F: Business, Risks, MD&A, statements + notes, auditor. IR decks = non-GAAP — reconcile.
2. **Normalize** — one-offs, SBC, leases, op vs non-op, diluted shares, NCI.
3. **Ratios** — 5–10y; DuPont on ROE; accruals & CCC.
4. **Comps** — same model; EV multiples for industrials; P/B+ROE for banks.
5. **DCF** — bear/base/bull; TV share; implied `g`; ROIC fade.
6. **MoS** — vs **bottom** of credible IV range.
7. **Checklist** — moat · capital allocation · dilution · cyclical peak · BS survival.

**Data:** SEC EDGAR + IR are primary. Aggregators (Macrotrends etc.): lag, TTM stitch errors, non-GAAP pollution — **spot-check the 10-K**.

<details>
<summary>Screening starters (hypothesis generators)</summary>

- Quality: ROE/ROIC sustained, FCF≈NI, low accruals
- Solvency: net debt/EBITDA sane, interest cover, BS survival
- Price: peer-relative multiples + MoS to IV range — not absolute bands alone

</details>

## AI-slop kill-list {#gotchas}

| Slop | Reality |
| --- | --- |
| EBITDA ≈ cash | Ignores capex/WC/tax/SBC/interest → CFO/FCF/FCFF |
| DCF off raw NI | Need FCFF/FCFE + reinvestment + interest shield |
| Ignore dilution/SBC | Per **diluted** share; SBC = cost or dilution |
| Mix TTM↔fwd, GAAP↔non-GAAP | Label everything; reconcile footnotes |
| Gordon `g≥WACC` | TV blows up; cap `g`; exit-mult cross-check |
| MoS as “feels cheap” | Explicit % below estimated IV |
| Equity multiple on EV (or reverse) | P/E world ≠ EV/EBITDA world |
| Bank ratios = industrial | Skip EV/EBITDA; P/B, ROE/ROTE, NIM, NPL, capital |
| `FCF=CFO−capex` as FCFF w/o `+Int(1−t)` | US GAAP CFO is after interest |
| Single-point DCF | Sensitivity; report a **range** |
| Absolute “cheap P/E” bands | Sector + cycle + ROIC-growth context |
| Graham number as IV | Ceiling heuristic only |

Also: value traps, channel stuffing, survivorship bias, anchoring, confirmation bias, recency bias — build the **bear** case before you buy.

## Refs {#refs}

1. [Damodaran](https://pages.stern.nyu.edu/~adamodar/)
2. [Damodaran ch.15 (valuation)](https://pages.stern.nyu.edu/~adamodar/pdfiles/valn2ed/ch15.pdf)
3. [CFA — Free Cash Flow Valuation](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation)
4. [SEC — How to Read a 10-K](https://www.sec.gov/fast-answers/answersreada10khtm.html)
5. [SEC EDGAR](https://www.sec.gov/search-filings)
6. [SEC — Beginners’ Guide to Financial Statements](https://www.sec.gov/about/reports-publications/beginners-guide-financial-statements)
7. [Buffett 1986 — owner earnings](https://www.berkshirehathaway.com/letters/1986.html)
8. Graham — *The Intelligent Investor* (Mr. Market, MoS)
