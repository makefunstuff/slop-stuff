---
title: "Excel & spreadsheets"
description: "Formulas, functions, pivot tables, lookups, and shortcuts."
category: "Data & databases"
tags: ["spreadsheet", "XLOOKUP", "pivot", "SUMIFS"]
weight: 230
lead: "Wrangle data in a grid."
version: "spreadsheets"
---
Excel turns a blank grid into a live calculation engine. Learn the functions, lookups, and shortcuts that do the heavy lifting — then steal the formulas.

## Quick reference {#quickref}

The daily surface on one screen — each formula is expanded in the sections below.

- `=SUM(A2:A10)` — Add a range — `AVERAGE` and `COUNT` take the same shape.
- `=IF(B2>1000, "High", "Low")` — Branch on a condition; use `=IFS(t1, v1, t2, v2)` for several cases.
- `=SUMIFS(B:B, A:A, "West", C:C, ">0.2")` — Sum where criteria match — `COUNTIFS`/`AVERAGEIFS` work the same.
- `=XLOOKUP(E2, A2:A10, B2:B10, "Not found")` — Modern lookup: exact by default, looks in any direction.
- `=UNIQUE(A2:A10) · =SORT(B2:B10) · =FILTER(A2:B10, C2:C10>100)` — Dynamic arrays: dedupe, sort, and filter — results spill down.
- `$A$1` — Absolute reference (locked) vs relative `A1` — press <kbd>F4</kbd> to cycle.
- `=TEXTJOIN(", ", TRUE, A2:A10) · =TEXTSPLIT(A2, ",")` — Join with a delimiter, then split it back apart.
- `Insert → PivotTable` — Summarize rows by dragging fields into Rows and Values.
- `Ctrl+Shift+L · F2 · F4 · Ctrl+T` — Filters · edit cell · cycle refs · make a Table.

## The essentials {#start}

Every formula starts with `=`. Learn how Excel addresses cells before you write anything else.

### 1. Cells & ranges

A colon spans a contiguous block.

```
=A1 + B2
=SUM(A1:A10)
```

### 2. References

`$` locks the part that follows it.

```
$A$1   locked row + column
$A1    locked column only
A$1    locked row only
A1     both shift
```

### 3. Autofill

Drag the fill handle to extend a pattern.

```
Jan, Feb, Mar…
1, 2, 3…
Q1, Q2, Q3…
```

### 4. Formula basics

Type, commit, edit, cancel.

```
=SUM(B2:B10)   Enter commits
F2             edits the cell
Esc            cancels
```

### Operators

Arithmetic and comparison operators build the conditions inside every formula.

```
+  -  *  /  ^         arithmetic
=  >  <  >=  <=  <>    compare
```

### Order of operations

Multiplication binds tighter than addition; parentheses always win.

```
=(B2 + C2) * D2
=B2 + C2 * D2
```

> **KEY:** **Absolute vs relative.** `$A$1` is fully locked; `A$1` locks the row; `$A1` locks the column; plain `A1` shifts both when copied or filled. Press <kbd>F4</kbd> to cycle through them.

## Key functions {#functions}

The ten functions that answer most spreadsheet questions.

| Function | What it does | Example |
| --- | --- | --- |
| `SUM` | Adds a range of numbers | `=SUM(B2:B10)` |
| `AVERAGE` | Mean of a range | `=AVERAGE(B2:B10)` |
| `COUNT` | Counts numeric cells only | `=COUNT(B2:B10)` |
| `MAX` / `MIN` | Largest / smallest value | `=MAX(B2:B10)` |
| `IF` | Branch on a condition | `=IF(B2>1000,"High","Low")` |
| `SUMIF(S)` | Sum that meets criteria | `=SUMIF(A:A,"West",B:B)` |
| `COUNTIF(S)` | Count that meets criteria | `=COUNTIFS(A:A,"West",C:C,">0.2")` |
| `TEXT` | Format a number as text | `=TEXT(B2,"$#,##0.00")` |
| `DATE` | Build a date from parts | `=DATE(2025,1,15)` |
| `ROUND` | Round to N digits | `=ROUND(B2,2)` |

<details>
<summary>A few more worth knowing</summary>

- `=IFERROR(formula, fallback)` — Hide #N/A and other errors.
- `=IFS(test1, v1, test2, v2)` — Cleaner than nested IF.
- `=MEDIAN(B2:B10)` — Middle value, ignores outliers.
- `=SUMPRODUCT(A2:A10, B2:B10)` — Weighted sum without an array formula.
- `=YEAR(A2) / MONTH(A2) / DAY(A2)` — Pull date parts apart.
- `=EDATE(A2, 3)` — Shift a date by N months.
- `=UNIQUE(A2:A10)` — Distinct values, spilled down.
- `=FILTER(A2:B10, C2:C10>100)` — Rows that meet a condition.
- `=XMATCH(E2, A2:A10)` — Position of a match — INDEX's modern partner.
- `=TAKE(A2:A100, 5) / =DROP(A2:A100, 1)` — Keep or remove the first/last N rows.

</details>

> **✓:** **Tip:** `COUNT` ignores text and blanks; use `COUNTA` to count any non-empty cell and `COUNTBLANK` for the empties.

## Lookups {#lookup}

Match a value in one place and pull back the value next to it.

| Function | Use when | Example |
| --- | --- | --- |
| `XLOOKUP` | Modern default — exact by default, any direction | `=XLOOKUP(E2,A2:A10,B2:B10,"Not found")` |
| `VLOOKUP` | Classic; searches first column, returns right | `=VLOOKUP(E2,A2:C10,3,FALSE)` |
| `HLOOKUP` | Horizontal version of VLOOKUP | `=HLOOKUP(E2,A1:J2,2,FALSE)` |
| `INDEX`/`MATCH` | Two-way, pre-XLOOKUP workhorse | `=INDEX(B2:B10,MATCH(E2,A2:A10,0))` |

> **⌁:** **XLOOKUP syntax:** `=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])`. A `match_mode` of `0` forces an exact match; `-1`/`1` allow approximate.

<details>
<summary>XLOOKUP match modes</summary>

| match_mode | Meaning |
| --- | --- |
| `0` | Exact match (default) |
| `-1` | Exact, else next smaller |
| `1` | Exact, else next larger |
| `2` | Wildcard match (`*` and `?`) |

</details>

### XLOOKUP vs VLOOKUP

XLOOKUP can return **left** of the lookup column, defaults to exact match, and never needs a column index number.

```
=XLOOKUP("West", A2:A10, B2:B10)
=VLOOKUP("West", A2:C10, 3, FALSE)
```

### INDEX/MATCH, step by step

`MATCH` finds the row number; `INDEX` returns the value at that row.

```
=MATCH(E2, A2:A10, 0)
=INDEX(B2:B10, 3)
```

## Pivot tables & analysis {#pivot}

Summarize thousands of rows into a report without writing a single formula.

1. **Select** — Click a cell in your data and go to Insert → PivotTable.
1. **Choose range** — Pick the data range (or a Table) and where the pivot should land.
1. **Drag fields** — Drop fields into `Rows` (categories), `Columns`, `Values` (numbers), and `Filters`.
1. **Set summary** — Values default to Sum; switch to Count or Average via Value Field Settings.
1. **Refresh** — Press <kbd>Alt</kbd><kbd>F5</kbd> when the source data changes.

### Charts

Select data → Insert → Chart. <kbd>Alt</kbd><kbd>F1</kbd> inserts one instantly.

### Conditional formatting

Home → Conditional Formatting to color-code values, bars, and duplicates.

### Data validation

Data → Data Validation to restrict input or build dropdown lists.

### Slicers

PivotTable Analyze → Insert Slicer for clickable, visual filters.

<details>
<summary>Common pivot tweaks</summary>

- `Show Values As → % of Grand Total` — Turn raw counts into percentages.
- `Right-click a date → Group…` — Group by month, quarter, or year.
- `Design → Report Layout → Repeat All Item Labels` — Fill blank row labels down.
- `Sort → More Sort Options → Value` — Sort by a value column, not the label.
- `Design → Report Layout → Tabular Form` — Flatten the default compact layout.
- `Right-click → Refresh` — Re-read the source data on demand.

</details>

## Text & cleaning {#text}

Functions that split, join, trim, and reshape messy strings.

| Function | What it does | Example |
| --- | --- | --- |
| `CONCAT` | Join text with no separator | `=CONCAT(A2,B2)` |
| `TEXTJOIN` | Join with a delimiter, skip blanks | `=TEXTJOIN(", ",TRUE,A2:A10)` |
| `TEXTSPLIT` | Split text by a delimiter | `=TEXTSPLIT(A2,",")` |
| `TEXTBEFORE` / `TEXTAFTER` | Text before / after a delimiter — no FIND needed | `=TEXTBEFORE(A2,",")` |
| `TRIM` | Strip leading, trailing, and double spaces | `=TRIM(A2)` |
| `SUBSTITUTE` | Replace exact text occurrences | `=SUBSTITUTE(A2,"-","")` |
| `LEN` | Character count | `=LEN(A2)` |
| `FIND` | Position of a substring (case-sensitive) | `=FIND("@",A2)` |
| `LEFT` / `RIGHT` / `MID` | Slice text from either end or the middle | `=MID(A2,4,3)` |

<details>
<summary>Handy cleaning recipes</summary>

#### Split “Last, First”

```
=TEXTBEFORE(A2, ",")
```

#### Extract the domain

```
=TEXTAFTER(A2, "@")
```

#### First word of a cell

```
=LEFT(A2, FIND(" ", A2)-1)
```

#### Clean then split

```
=TEXTSPLIT(TRIM(A2), ",")
```

</details>

> **⌁:** **Cleaning pipeline:** chain `=TRIM(SUBSTITUTE(A2, CHAR(160), " "))` to nuke non-breaking spaces, then `LEFT`/`MID` to split on position.

## Shortcuts {#shortcuts}

Move, select, and edit without ever touching the mouse.

### Navigation

- Jump to edge of data — <kbd>Ctrl</kbd><kbd>→</kbd><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd>
- Go to A1 / last cell — <kbd>Ctrl</kbd><kbd>Home</kbd><kbd>Ctrl</kbd><kbd>End</kbd>
- Next / previous sheet — <kbd>Ctrl</kbd><kbd>PgDn</kbd><kbd>PgUp</kbd>
- Go To dialog — <kbd>F5</kbd>

### Selection

- Extend to edge of data — <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>→</kbd>
- Select current region — <kbd>Ctrl</kbd><kbd>A</kbd>
- Select row / column — <kbd>Shift</kbd><kbd>Space</kbd><kbd>Ctrl</kbd><kbd>Space</kbd>
- Select to last cell — <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>End</kbd>

### Editing

- Edit active cell — <kbd>F2</kbd>
- Cycle reference type — <kbd>F4</kbd>
- Fill down / right — <kbd>Ctrl</kbd><kbd>D</kbd><kbd>Ctrl</kbd><kbd>R</kbd>
- New line inside cell — <kbd>Alt</kbd><kbd>Enter</kbd>

### Formatting

- Toggle filters — <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>L</kbd>
- Format Cells dialog — <kbd>Ctrl</kbd><kbd>1</kbd>
- Bold / italic — <kbd>Ctrl</kbd><kbd>B</kbd><kbd>Ctrl</kbd><kbd>I</kbd>
- Currency / percent — <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>$</kbd><kbd>%</kbd>

### Entering data

- Confirm and move down / right — <kbd>Enter</kbd><kbd>Tab</kbd>
- Fill selection with active cell — <kbd>Ctrl</kbd><kbd>Enter</kbd>
- Today's date / current time — <kbd>Ctrl</kbd><kbd>;</kbd><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>:</kbd>
- Insert a comment / note — <kbd>Shift</kbd><kbd>F2</kbd>
> **!:** **On a Mac,** swap <kbd>Ctrl</kbd> for <kbd>⌘</kbd> and <kbd>Alt</kbd> for <kbd>⌥</kbd>; function keys often need <kbd>Fn</kbd> too.

## Advanced {#advanced}

Once basics are boring, these techniques scale to real models.

### Array formulas

Modern Excel spills results into adjacent cells; reference the whole spill with `#`.

```
=SORT(A2:A10)
=UNIQUE(A2:A10)
=FILTER(A2:B10, C2:C10>100)
=A2#
```

### LET

Name intermediate values so a formula reads top-to-bottom and calculates once.

```
=LET(x, A2:A10,
     y, x*1.2,
     SUM(y))
```

### LAMBDA

Define your own reusable function, with or without a named range.

```
=LAMBDA(price, price*1.2)(A2)
```

### Named ranges

Formulas → Name Manager to name cells, then reference them by name.

```
=SUM(West_Sales)
```

### Tables

Press <kbd>Ctrl</kbd><kbd>T</kbd> to make a Table; structured references use column names.

```
=[@Sales]*[@Qty]
```

### Power Query

Data → Get Data imports and shapes data repeatably — each recorded step reruns on refresh.

> **⌁:** **Formula aggregates (2024):** `GROUPBY` and `PIVOTBY` roll rows into a summary table with one formula — no pivot table required. `=GROUPBY(A2:A100, B2:B100, SUM)`.

> **!:** **Spill errors.** Dynamic array formulas fill adjacent cells automatically; if anything is in the way you get `#SPILL!`. Clear the blocking cells to let the array spill.

## Pitfalls {#gotchas}

Small behaviors that silently corrupt a workbook.

### VLOOKUP can't look left

It only searches the **first** column and returns to the **right**. Use `XLOOKUP` or `INDEX`/`MATCH` to return a column to the left.

### Text vs number

`"123"` is not `123`. Numbers stored as text break `SUM` and sorting. Fix with `=VALUE(A2)` or Text to Columns.

### Forgotten $ locks

Copying `=A1*B1` down becomes `=A2*B2` — usually right, but a tax rate in `B1` should be `$B$1`.

### Volatile functions

`NOW()`, `TODAY()`, `RAND()`, `OFFSET()`, and `INDIRECT()` recalculate on every change and slow large workbooks.

### VLOOKUP's hidden approximate mode

Omit the 4th argument and VLOOKUP defaults to `TRUE` — an approximate match that needs sorted data and silently returns the nearest value. Always pass `FALSE` for exact.

### Dates are serial numbers

Excel stores dates as days since Jan 1, 1900 (`1` = that day). Subtract two date cells to get a day count, and check the format when a “number” should be a date.

### Floating-point drift

`=0.1+0.2` is not exactly `0.3` in binary. Sums and comparisons of decimals can drift — wrap money math in `=ROUND(…, 2)`.

### Leading zeros vanish

Typing `00123` stores `123`. For ZIP codes, phone numbers, and IDs, set the column to Text **before** entering, or prefix with an apostrophe `'`.

> **!:** **Merged cells** break sorting, filtering, and range references. Prefer “Center Across Selection” (Format Cells → Alignment) for the same look with none of the pain.

<details>
<summary>Error values, decoded</summary>

| Error | Meaning |
| --- | --- |
| `#N/A` | Value not found — usually a lookup miss. |
| `#VALUE!` | Wrong type, e.g. math on text. |
| `#REF!` | Reference was deleted or is invalid. |
| `#DIV/0!` | Division by zero or an empty cell. |
| `#NAME?` | Unrecognized function or range name. |
| `#NUM!` | Invalid numeric value, e.g. `SQRT` of a negative. |
| `#SPILL!` | A dynamic array can't spill — something is blocking. |
| `#NULL!` | Range intersection that doesn't exist. |

</details>
