---
title: "KiCad"
description: "Schematic, layout, footprints, design rules, and fabrication output."
category: "Electronics"
tags: ["PCB", "schematic", "layout", "gerber"]
weight: 340
lead: "Design boards from schematic to gerber."
version: "PCB design"
---
KiCad is a free, open-source EDA suite: capture the schematic in Eeschema, route the board in Pcbnew, run ERC and DRC, then export Gerbers for fabrication. One flow, start to finish.

## The 20-second version {#quickref}

Schematic → netlist → PCB → DRC → gerbers. Six commands carry the flow; a handful of hotkeys do the editing.

### The flow

```
1. Schematic  place symbols, wire, run ERC
2. Netlist    assign footprints, sync to board
3. PCB        place, route, pour a GND plane
4. DRC        fix clearance + connectivity errors
5. Gerbers    copper + mask + silk + drill → zip
6. Fabricate  upload zip, check the preview
```

### Key hotkeys

```
A  add symbol     W  wire / route
P  power port     V  drop a via
L  net label      B  refill zones
M  move           F  flip side
G  drag           R  rotate CCW
E  properties     `  highlight net
```

- `kicad-cli sch export netlist board.kicad_sch` — Schematic → netlist.
- `kicad-cli sch erc board.kicad_sch` — Electrical rules check.
- `kicad-cli pcb drc board.kicad_pcb` — Design rules check.
- `kicad-cli pcb export gerbers -o gerbers/ board.kicad_pcb` — Copper, mask, silk — one file per layer.
- `kicad-cli pcb export drill -o gerbers/ board.kicad_pcb` — Excellon drill file (.drl).
- `kicad-cli pcb export pos -o pos.csv --format csv board.kicad_pcb` — Pick-and-place positions.
- `kicad-cli sch export bom -o bom.csv board.kicad_sch` — Bill of materials.
- `kicad-cli jobset run board.kicad_pro` — Run a saved output jobset (KiCad 9+).

## Schematic to gerber, one pipeline {#start}

The whole job is a pipeline: draw the schematic, generate a netlist, lay out and route the PCB, run DRC, then export Gerbers for the fab.

1. **Schematic** — Eeschema: place symbols (`A`), connect wires (`W`), label nets (`L`), add power symbols (`P`).
1. **Netlist** — Assign footprints, run ERC, then generate the netlist — it links every schematic pin to a board pad.
1. **PCB layout** — Pcbnew: place footprints, route tracks, pour a GND plane on the back layer.
1. **DRC** — Run the Design Rules Checker; fix clearances, widths, and unconnected nets.
1. **Gerber** — Plot copper, mask, and silkscreen layers plus the drill file into one zip.
1. **Fabrication** — Upload the zip to JLCPCB, check the preview, and order boards.
`Eeschema` `Pcbnew` `GerbView` `kicad-cli` `JLCPCB`

### 1. Install

```
brew install --cask kicad   # macOS
sudo apt install kicad      # Debian/Ubuntu
winget install KiCad.KiCad  # Windows
```

Current stable: **KiCad 10** (Mar 2026); 9.0.x is still maintained.

### 2. New project

```
File → New Project → "board"
# creates board.kicad_pro
#          board.kicad_sch
#          board.kicad_pcb
```

### 3. Draw schematic

```
A  add symbol
W  draw wire
P  add power (GND/VCC)
L  add net label
```

### 4. Hand off to PCB

```
Tools → Update PCB
      from Schematic
# or:
kicad-cli sch export netlist
```

> **NET:** **Every symbol needs a footprint.** Assign footprints (Tools → Assign Footprints) before Update PCB, or the board shows missing-footprint placeholders and the layout is incomplete.

## Symbols, wires, labels, power {#schematic}

Place symbols, connect pins with wires, name nets with labels, add GND/VCC power symbols, run ERC, then generate the netlist.

| Element | Hotkey | What it does |
| --- | --- | --- |
| Symbol | `A` | Place a component from a library. |
| Wire | `W` | Connect two pins electrically. |
| Net label | `L` | Name a net — two labels with the same name are the same net. |
| Power symbol | `P` | `GND`, `VCC`, `+3V3`, `+5V`… |
| No-connect flag | — | Mark a pin intentionally unconnected so ERC stays quiet. |
| Junction | `U` | Join two crossing wires into one connection. |

`GND` `VCC` `+3V3` `+5V` `PWR_FLAG`

### Run ERC before you leave

The Electrical Rules Checker catches unconnected pins, duplicate references, and power-net mistakes.

```
Inspect → Electrical Rules Checker
# or on the command line:
kicad-cli sch erc board.kicad_sch
```

### Generate the netlist

The netlist is the list of connections that Pcbnew turns into copper. KiCad 7 and later (9/10) also sync it directly via “Update PCB from Schematic”.

```
kicad-cli sch export netlist \
  board.kicad_sch
```

> **!:** **Power nets need a PWR_FLAG.** A net driven only by power symbols (like `GND` or `VCC`) triggers “power output pin connected to power output pin”. Place a `PWR_FLAG` symbol on each such net to tell ERC it's powered.

## Placement, routing, copper pours {#layout}

Place footprints, route tracks between pads, pour a GND plane on the back layer, and manage layers and vias.

1. **Place** — Connectors on the board edge, ICs grouped by function, decoupling caps right next to power pins.
1. **Route** — `W` routes a track, `V` drops a via to switch layers. Keep power and ground tracks short and fat.
1. **Pour** — Draw a filled zone on `B.Cu` (and `F.Cu`) assigned to `GND`; press `B` to refill it.
1. **Verify** — Run DRC and fix unconnected nets, clearance violations, and unrouted tracks.
**F.Cu** (top copper · signals) → **In1.Cu** (inner 1 · GND plane) → **In2.Cu** (inner 2 · VCC plane) → **B.Cu** (bottom copper · signals)

### Copper pour (GND plane)

A filled zone on `B.Cu` gives every ground pin a low-impedance return path.

```
Select B.Cu
Draw a filled zone around the board
Zone → net: GND
Press B to refill
```

### Vias

A via connects a track to another layer. The default is a 0.6 mm pad with a 0.3 mm hole — size up for high current.

```
during routing: V (drop a via)
via size: 0.6 mm pad / 0.3 mm drill
high current: 0.8 mm pad / 0.4 mm drill
```

## Footprints, pads, packages {#footprints}

The footprint editor defines pads and silkscreen; DRC clearances and standard packages do the rest.

| Package | Dimensions | Pad pitch | Typical use |
| --- | --- | --- | --- |
| `0805` | 2.0 × 1.25 mm | — | Resistors / caps; the comfortable default for hand-soldering. |
| `0603` | 1.6 × 0.8 mm | — | Tighter passives where space matters. |
| `SOIC-8` | ~5 × 6 mm | 1.27 mm | Op-amps and small ICs; easy to hand-solder. |
| `TSSOP-16` | ~5 × 4.4 mm | 0.65 mm | Fine-pitch ICs; needs care or a stencil. |
| `QFN-32` | 5 × 5 mm | 0.5 mm | MCUs; exposed center pad = ground + heatsink. |

### Footprint editor

Pads carry the electrical connection; pad numbers must match the symbol's pin numbers exactly, or the netlist won't line up.

```
SMD pad:  F.Cu + F.Mask + F.Paste
TH pad:   through all Cu layers
F.Fab:    fabrication outline + pin 1
# pad number = symbol pin number
```

### Courtyard & silkscreen

The courtyard layer stops footprints from touching; silkscreen marks the reference designator and pin 1.

```
F.Courtyard: keep-out outline
F.Silkscreen: refdes + pin-1 dot
# keep refdes off pads & holes
```

> **1:** **Match pin 1.** The dot or notch must agree between the symbol, the footprint, and the real part — otherwise the component gets soldered in rotated 180°.

## Clearances, widths, vias {#design}

Set trace width, clearance, and via sizes up front; place decoupling caps and pour solid ground planes with thermal reliefs.

| Parameter | Typical (2-layer) | Notes |
| --- | --- | --- |
| Track width | `0.2 mm` (8 mil) | Power tracks wider: 0.5–1 mm for 1 A+. |
| Clearance | `0.2 mm` (8 mil) | `0.127 mm` (5 mil) is JLCPCB's floor. |
| Via | `0.6 / 0.3 mm` | Pad / drill; bigger for high current. |
| Edge to copper | `≥ 0.3 mm` | Keep copper away from Edge.Cuts. |

<kbd>10 mil</kbd> ≈ <kbd>1 A</kbd>
<kbd>20 mil</kbd> ≈ <kbd>1.5 A</kbd>
<kbd>40 mil</kbd> ≈ <kbd>2.5 A</kbd>
<kbd>1 oz Cu</kbd> = <kbd>35 µm</kbd>

- **Clean** — Zero violations — ready to export.
- **Warning** — Unfilled zone or unrouted track — usually safe, review it.
- **Error** — Clearance or connectivity violation — fix before export.
- **Excluded** — A waived violation — approved and ignored.

### Decoupling capacitors

One `100 nF` ceramic per power pin, as close to the pin as possible, plus a `10 µF` bulk cap per rail. Trace width matters less than loop area.

### Ground planes & thermal reliefs

Pour `GND` on `B.Cu`. Thermal relief spokes keep pads solderable; use a solid connection where high current must flow straight to the plane.

> **A:** **Check current before you trust a width.** The numbers above assume 1 oz copper and a 10 °C rise. Use Tools → Calculator Tools → Track Width for exact values.

## Gerbers, drills, BOM, positions {#output}

Export Gerber layers, the drill file, a BOM, and the pick-and-place position file, then upload to JLCPCB.

- `kicad-cli pcb export gerbers -o gerbers/ board.kicad_pcb` — Gerber files — one per layer.
- `kicad-cli pcb export drill -o gerbers/ board.kicad_pcb` — Excellon drill file (.drl).
- `kicad-cli pcb export pos -o pos.csv --format csv board.kicad_pcb` — Pick-and-place position file.
- `kicad-cli sch export bom -o bom.csv board.kicad_sch` — Bill of materials.
- `kicad-cli pcb drc board.kicad_pcb` — Design-rule report.
- `kicad-cli sch erc board.kicad_sch` — Electrical-rule report.

| JLCPCB setting | Recommended |
| --- | --- |
| Layers | 2 (or 4 when you need inner planes) |
| Board thickness | `1.6 mm` |
| Copper weight | `1 oz` (2 oz for high current) |
| Min track / clearance | `6/6 mil` standard (5/5 mil min) |
| Surface finish | HASL (lead-free) or ENIG |
| Soldermask color | Green (default) |

### What's in the zip

KiCad's default Protel extensions, one file per layer.

```
board-F_Cu.gtl        top copper
board-B_Cu.gbl        bottom copper
board-F_Mask.gts      top solder mask
board-B_Mask.gbs      bottom solder mask
board-F_Silkscreen.gto  top silkscreen
board-B_Silkscreen.gbo  bottom silkscreen
board-Edge_Cuts.gko   board outline
board.drl             drill file
```

### Review before you upload

Open GerbView, load every layer, and sanity-check the outline and drill alignment.

```
File → Open Gerber Plot File(s)
# check Edge.Cuts outline
# check drills line up with pads
# check silkscreen is legible
```

> **ZIP:** **Zip the Gerbers and the drill file together** and upload as one archive — JLCPCB auto-detects the layers. Review every layer in GerbView before you order.

## The hotkeys you'll reach for {#shortcuts}

Defaults for a standard keyboard — remap them in Preferences → Preferences → Hotkeys.

### Move & edit

- Move item — <kbd>M</kbd>
- Drag (connections stay attached) — <kbd>G</kbd>
- Rotate 90° counter-clockwise — <kbd>R</kbd>
- Edit properties — <kbd>E</kbd>
- Copy / paste — <kbd>Ctrl</kbd><kbd>C</kbd><kbd>Ctrl</kbd><kbd>V</kbd>
- Delete — <kbd>Del</kbd>
- Cancel current tool — <kbd>Esc</kbd>
- Undo / redo — <kbd>Ctrl</kbd><kbd>Z</kbd><kbd>Ctrl</kbd><kbd>Y</kbd>

### Schematic (Eeschema)

- Begin wire — <kbd>W</kbd>
- Add symbol — <kbd>A</kbd>
- Add power port (GND/VCC) — <kbd>P</kbd>
- Add net label — <kbd>L</kbd>
- Mirror horizontally — <kbd>X</kbd>
- Mirror vertically — <kbd>Y</kbd>

### Board (Pcbnew)

- Route track — <kbd>W</kbd>
- Add via (switch layer) — <kbd>V</kbd>
- Flip to other side — <kbd>F</kbd>
- Refill zones — <kbd>B</kbd>
- Highlight net — <kbd>`</kbd>
- Zoom to fit — <kbd>Home</kbd>
> **F1:** **Press `Ctrl+F1`** in either editor to open the interactive hotkey list, or remap anything under Preferences → Preferences → Hotkeys.

## Pitfalls that bite every board once {#gotchas}

Small mistakes that turn into a re-spin.

### Missing ERC / DRC

Skip the checks and you ship unconnected nets and clearance shorts. Run both before every export.

```
kicad-cli sch erc board.kicad_sch
kicad-cli pcb drc board.kicad_pcb
```

### Wrong footprint

A symbol assigned to an `0805` when you ordered `SOIC-8`. Verify the package against the actual part before ordering.

```
Tools → Assign Footprints
# compare against the datasheet
```

### Netlist mismatch

You edited the board but not the schematic. Re-sync so the two can't drift apart.

```
Tools → Update PCB
      from Schematic
```

### Power flags missing

`GND`/`VCC` nets driven only by power symbols need a `PWR_FLAG`, or ERC reports “power pin connected to power pin”.

```
place PWR_FLAG on each
power-only net
```

### Silkscreen overlap

Refdes text sitting on pads or over holes. Move it to open space and keep it off copper — a covered pad can't be soldered.

```
move refdes to open space
# keep silk off pads & holes
# DXF export: --subtract-soldermask
```

### No board outline

If `Edge.Cuts` is missing or open, the fab can't cut your board shape.

```
draw a closed shape on
Edge.Cuts around the board
```

### Zones not refilled

DRC ignores unfilled zones, so pads on the GND pour read as unconnected. Press `B` to refill every zone before you run DRC or export Gerbers.

```
press B in Pcbnew
# refill → re-run DRC → export
```

### Missing drill file

Gerbers without the `.drl` can't be drilled. The drill file must sit in the same zip as the copper, mask, and silk layers.

```
kicad-cli pcb export drill \
  -o gerbers/ board.kicad_pcb
```

> **!:** **Verify before you order.** Check the board outline (Edge.Cuts), pin-1 orientation, and that every part has a footprint. A re-spin costs more than the extra hour of checking.
