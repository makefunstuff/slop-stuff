---
title: "Transistors & tubes"
description: "BJTs, MOSFETs, JFETs, and vacuum tubes: operation, biasing, and circuits."
category: "Electronics"
tags: ["active devices", "BJT", "MOSFET", "triode"]
weight: 350
lead: "Amplification, from silicon to glass."
version: "active devices"
---
Transistors and vacuum tubes do one job: a small signal at the control terminal steers a much larger current. Learn the families, how to bias them, and the circuits they power.

## Quick reference {#quickref}

The facts you reach for most — polarity, gain, thresholds, and operating regions — at a glance. Full explanations live in the numbered sections below.

### NPN vs PNP

Same rules, opposite polarity. The emitter arrow shows conventional current direction.

```
NPN: base +0.7 V above emitter → ON
     Ic flows C → E  (current sink)
PNP: base −0.7 V below emitter → ON
     Ic flows E → C  (current source)
```

### Gain

BJT is current gain (β); FETs and tubes are voltage gain via transconductance.

```
Ic = hFE · Ib      β ≈ 100–300
gm  = ΔId / ΔVgs    # transconductance
Av  ≈ −gm · Rd      # common source / emitter
```

### BJT states

Three regions decide switch vs amplifier.

```
cutoff:     Vbe < 0.7 V  → Ic ≈ 0
active:     Ic = hFE · Ib  → amplify
saturation: Vce ≈ 0.2 V  → closed switch
```

### MOSFET gate & threshold

Voltage-controlled; the gate is a capacitor, not a resistor.

```
N-ch ON: Vgs > Vth   # Vth ≈ 1–4 V
P-ch ON: Vgs < Vth
gate draws ~0 DC; 10k pull to a defined level
```

### Saturation vs cutoff

Switch = slam between the two; amplifier = stay in the middle.

```
saturation: fully ON,  Vce ≈ 0.2 V / Vds ≈ 0
cutoff:     fully OFF, Ic ≈ 0
linear:     in between → amplifier
```

### Triode vs pentode

Extra grids around the basic triode trade feedback for gain.

```
triode:  cathode · grid · anode   μ ≈ 20–100
tetrode: + screen grid  (less Miller feedback)
pentode: + suppressor grid (no secondary emission)
```

### Common-emitter amp

The go-to voltage gain stage; it inverts the signal.

```
Av ≈ −Rc / Re    # BJT, inverting
Av ≈ −gm · Rd     # FET common source
bias mid-active region; AC-couple in/out
```

### Bias point

Resistors set the DC operating point the signal swings around.

```
Vb = Vcc · R2 / (R1 + R2)
Ve = Vb − 0.7 V
Ic ≈ Ie = Ve / Re
```

## One device, two jobs {#start}

Every active device is a controlled valve: a weak input signal throttles a strong current.

**Input** (small signal) → **Control** (base · gate · grid) → **Output** (large current / voltage)

### 1. Switch

Drive it between cutoff and saturation: `Vgs >> Vth`, or base current large enough to saturate.

### 2. Amplify

Bias the device mid-way in its linear region, then swing a small signal around that point.

### 3. Current vs voltage

BJT is current-controlled (base). FET and tube are voltage-controlled (gate / grid).

### 4. Bias

Resistors set the quiescent point — the DC operating point the signal swings around.

| Device | Terminals | Controlled by | Type | Typical use |
| --- | --- | --- | --- | --- |
| `BJT` (NPN/PNP) | base · collector · emitter | base current | current-controlled | analog amps, switches |
| `JFET` | gate · drain · source | gate voltage | voltage-controlled | low-noise preamps |
| `MOSFET` | gate · source · drain | gate voltage | voltage-controlled | switching, power, logic |
| `IGBT` | gate · collector · emitter | gate voltage | voltage-controlled | motor drives, inverters |
| `Tube` (triode) | grid · anode · cathode | grid voltage | voltage-controlled | audio, RF, high voltage |

- `BJT on = base +0.7 V` — Current-controlled; limit base current.
- `MOSFET on = Vgs > Vth` — Voltage-controlled; charge the gate.
- `Tube on = grid > cutoff` — Grid voltage steers plate current.
- `switch = cutoff ↔ saturation` — Amplifier = biased mid-region.

> **KEY:** **Switch or amplify?** Driven between fully-off and fully-on, any active device is a switch; biased into the middle of its linear region, it's an amplifier. The only real difference is where you set the operating point.

## Bipolar junction transistors {#bjt}

Current-controlled three-terminal device: a small base current sets a much larger collector current.

- **Cutoff** — `Vbe < 0.7 V` — both junctions off, `Ic ≈ 0`. Open switch.
- **Active** — B-E forward, B-C reverse — `Ic = hFE · Ib`. Amplifier.
- **Saturation** — Both junctions forward — `Vce ≈ 0.2 V`. Closed switch.
- **Reverse** — E and C swapped — low β, rarely used.

### Current gain (hFE)

Collector current is base current times beta.

```
Ic = hFE · Ib        # β = hFE, ~100–300
Vbe ≈ 0.7 V          # silicon (0.3 V Ge)
Ie = Ib + Ic = (β + 1) · Ib
```

### NPN vs PNP

Same rules, opposite polarity. The emitter arrow shows conventional current direction.

```
NPN: turn on with base +0.7 V above emitter
     current flows C → E
PNP: turn on with base −0.7 V below emitter
     current flows E → C
```

### Voltage-divider bias

Two resistors set a stable base voltage; the emitter resistor sets the current.

```
Vb = Vcc · R2 / (R1 + R2)
Ve = Vb − 0.7 V
Ic ≈ Ie = Ve / Re
```

> **⚠:** **Never drive a base without a resistor.** The base-emitter junction is a diode: once `Vbe` passes ~0.7 V it looks like a short. Pick `Rb = (Vin − Vbe) / Ib` to limit base current.

<details>
<summary>Common BJT part numbers</summary>

#### Small-signal

```
2N3904  NPN, 200 mA
2N3906  PNP, 200 mA
2N2222  NPN, 800 mA
BC547   NPN / BC557 PNP
```

#### Power

```
2N3055  NPN, 15 A
TIP120  NPN Darlington, 5 A
BD139   NPN, 1.5 A
TIP41C  NPN, 6 A
```

</details>

## Metal-oxide-semiconductor FETs {#mosfet}

Voltage-controlled, high-impedance gate; the workhorse of switching and power.

| Channel | Turn-on condition | Current | Used for |
| --- | --- | --- | --- |
| `N-channel` | Vgs > Vth (gate above source) | drain → source | low-side switch, logic |
| `P-channel` | Vgs < Vth (gate below source) | source → drain | high-side switch |
| `Enhancement` | normally off; needs Vgs | — | most common |
| `Depletion` | normally on; needs Vgs to turn off | — | rare, constant-current |

`N-channel` `P-channel` `enhancement` `depletion` `logic-level`

### Threshold & on-resistance

Drive the gate well past threshold to reach a low on-resistance.

```
Vgs(th)  ≈ 1–4 V    # logic-level 1–2 V
Rds(on)  ≈ mΩ–Ω     # lower = less heat
fully ON: Vgs ≫ Vth, Vds ≈ Id · Rds(on)
```

### Gate drive

The gate is a capacitor, not a resistor: it draws current only while charging.

```
Qg (gate charge) ≈ few–100 nC
Ciss = Cgs + Cgd   # input capacitance
hard drive: 10–12 V, low-impedance driver
floating gate → add 10k pull-down
```

### Logic-level vs standard

Logic-level parts turn fully on at 3.3–5 V; standard parts need ~10 V gate drive.

```
logic-level: Vgs(th) ~1 V, spec'd at 4.5 V
standard:    Vgs(th) ~2–4 V, spec'd at 10 V
check Rds(on) at YOUR gate voltage
```

> **ESD:** **The gate oxide is thin and fragile.** A floating gate charges to an unpredictable voltage (device half-on and hot), and static discharge can puncture the oxide outright. Tie the gate to a defined level and mind ESD.

<details>
<summary>Reading a MOSFET datasheet</summary>

#### Static limits

```
Vds(max)   drain-source voltage
Id(max)    continuous drain current
Vgs(max)   gate voltage (±20 V typ)
```

#### Switching specs

```
Vgs(th)  threshold
Rds(on)  on-resistance @ Vgs
Qg       total gate charge
Ciss     input capacitance
```

</details>

## JFET, IGBT, and the rest {#fet}

Close cousins with different strengths — pick by voltage, speed, and noise.

| Device | Gate | Mode | Input impedance | Best for |
| --- | --- | --- | --- | --- |
| `JFET` | reverse-biased PN junction | normally on (depletion) | very high, low noise | preamps, RF front-ends, current sources |
| `MOSFET` | insulated (oxide) | enhancement (normally off) | extremely high | switching, power, logic |
| `IGBT` | insulated (MOS gate) | normally off | high | high-voltage, high-current switching |

### JFET

Normally on; the gate is a reverse-biased junction, so it draws almost no current and adds little noise.

```
N-ch: Id flows drain → source at Vgs = 0
off:  Vgs < Vgs(off)   # pinch-off, negative
use:  low-noise preamp, RF, current source
```

### IGBT

A MOS gate driving a bipolar output: easy to drive, yet handles big volts and amps.

```
ratings: 600 V / 1200 V, 10s–100s of amps
turn-on: Vge > Vge(th) (~4–6 V)
slower than MOSFET, has tail current
use: VFD, inverter, welder, EV traction
```

> **⌁:** **Pick by the job.** Low-noise, high-impedance small-signal → `JFET`. Fast logic-level switching → `MOSFET`. High voltage + high current at moderate speed → `IGBT`. Very high voltage or RF power → `tube`.

## Vacuum tubes {#tubes}

Thermionic valves: a heated cathode, a control grid, and hundreds of volts.

**Cathode** (heated, emits electrons) → **Grid** (controls flow) → **Anode** (collects electrons)

| Tube | Elements | What it adds | Use |
| --- | --- | --- | --- |
| `Diode` | cathode, anode | one-way flow | rectifier, detector |
| `Triode` | + control grid | voltage gain (μ) | audio/RF amps |
| `Tetrode` | + screen grid | less Miller feedback | RF power |
| `Pentode` | + suppressor grid | suppresses secondary emission; high gain, high Rp | audio/RF power |

### Grid bias

The grid must sit negative relative to the cathode to set the idle plate current.

```
cathode bias: Rk develops Vk = Ik · Rk
              grid referenced to 0 V → Vgk = −Vk
fixed bias:   negative supply on the grid
```

### Plate curves & load line

Plate current vs plate voltage for stepped grid voltages; the load line picks the operating point.

```
μ  = amplification factor (triode ~20–100)
gm = transconductance (mA/V)
Rp = plate resistance (kΩ)
load line: Vp = B+ − Ip · Ra
```

> **HV:** **Plate supply is lethal.** `B+` is typically 200–500 V, and filter capacitors hold that charge long after power-off. Drain the caps before touching anything, and keep one hand in your pocket.

<details>
<summary>Common tube types</summary>

#### Preamp / driver

```
12AX7  high-μ dual triode
12AU7  medium-μ dual triode
6SN7   octal dual triode
EF86   small-signal pentode
```

#### Power & rectifier

```
EL84    small pentode (15 W)
6L6     beam power (25 W)
EL34    power pentode (25 W)
5AR4    full-wave rectifier
```

</details>

## Amplifier circuits {#circuits}

Three basic configurations cover almost every amplifier you'll build.

| BJT | FET | Gain | Phase | Use |
| --- | --- | --- | --- | --- |
| `Common emitter` | `Common source` | high (Av ≈ −Rc/Re) | inverts | voltage gain stage |
| `Common collector` | `Common drain` | ≈ 1 | non-inverting | buffer / follower |
| `Common base` | `Common gate` | high | non-inverting | RF, high-frequency |

### Emitter / source follower

Gain is ~1, but it turns a weak, high-impedance source into a stiff, low-impedance one.

```
Av ≈ 1 (no inversion)
Zin high, Zout low
CE  → CC  → load   # buffer the output
```

### Class & push-pull

Two devices each handle half the waveform; class controls how much they overlap.

```
A  : conducts 360°, clean, ~25–30% efficient
B  : 180° each, crossover distortion
AB : slight overlap, no crossover, ~50–60%
D  : PWM switching, ~90%+
```

1. **Bias** — Set the quiescent point in the active region so the device never clips the signal.
1. **Gain stage** — Common emitter / source (or a tube) multiplies the small signal.
1. **Follower** — An emitter / source follower buffers the output to drive a real load.
1. **Output** — AC-couple through a capacitor to remove the DC bias.

<details>
<summary>Gain formulas, quickly</summary>

#### Common emitter / source

```
Av ≈ −Rc / Re   (BJT)
Av ≈ −gm · Rd    (FET)
```

#### Follower

```
Av ≈ 1
Zin = β · Re (BJT)
```

</details>

## Switching & power {#switching}

Drive the gate, switch the load, and keep the heat under control.

| Arrangement | Switch | Gate drive | Notes |
| --- | --- | --- | --- |
| `Low-side` | N-MOSFET (source to GND) | gate to GND — easy | load between V+ and drain |
| `High-side` | P-MOSFET, or N-MOSFET | P: pull gate below V+; N: bootstrap/charge pump | load between source and GND |

### H-bridge

Four switches steer current both ways through a motor; PWM sets speed, diagonals set direction.

```
forward:  Q1 + Q4 on
reverse:  Q2 + Q3 on
brake:    short the motor (low sides on)
add dead time → no shoot-through
```

### Linear vs switching

A linear regulator burns the difference as heat; a switcher chops it for efficiency.

```
linear:    P = (Vin − Vout) · I   # ~50% typ
switching: ~85–95%, needs inductor
low noise → linear; efficiency → switching
```

### Heat

Every dissipated watt raises the junction temperature; keep it under the limit.

```
Pconduction = Id² · Rds(on)
Tj = Ta + P · Rθja
heat sink → lower Rθ; Tj(max) ≈ 150 °C
```

> **⌁:** **Inductive loads need a flyback diode.** When the switch opens, a motor or relay coil forces its current to keep flowing, generating a voltage spike that can destroy the transistor. Put a diode across the coil, cathode to V+.

<details>
<summary>Choosing a switching FET</summary>

#### Must hold

```
Vds(max) > supply + spikes
Id(max)  > load current
Vgs(th)  < your drive voltage
```

#### Must be low

```
Rds(on)  → less conduction heat
Qg       → faster switching, less loss
Rθja     → cooler junction
```

</details>

## Pitfalls {#gotchas}

The failure modes that quietly kill transistor and tube circuits.

### Forgot the base resistor?

A BJT base-emitter junction is a diode; once it hits ~0.7 V it passes huge current.

```
Rb = (Vin − Vbe) / Ib
Ib = Ic / hFE
no Rb → dead transistor
```

### Floating MOSFET gate

A gate left unconnected charges to an unpredictable voltage, so the transistor turns half-on and overheats.

```
gate pull-down (N) / pull-up (P): 10k
ESD can puncture the thin oxide
solder/discharge to GND when handling
```

### Thermal runaway (BJT)

As the junction heats, β and Ic rise, which heats it more — a positive feedback loop.

```
cause: Ic ↑ → heat ↑ → β ↑ → Ic ↑ …
fix: emitter resistor Re (degeneration)
     heatsink + keep Vce low in saturation
```

### Tube high voltage

B+ and the filter capacitors stay charged after power-off and can deliver a lethal shock.

```
B+ = 200–500 V+
discharge caps before probing
one hand in pocket; never work live
```

### Bad bias

Bias too cold → crossover/clipping; too hot → the device runs hot and wastes power.

```
too low:  signal clips (cutoff)
too high: saturation, wasted heat
check the quiescent current (Ic / Id / Ip)
```

### No heat sink

Even a few watts can push a TO-220 past its 150 °C junction limit.

```
P = V · I  (or Id² · Rds(on))
Rθja without sink ≈ 60 °C/W
add sink → Rθja drops to ~10 °C/W
```

### Gate ringing / oscillation

Long or un-damped gate traces can ring, spiking Vgs past its limit and making the device switch erratically.

```
fix: series gate resistor (10–100 Ω)
     short, wide traces; local bypass cap
     keep Vgs within ±20 V
```

### Exceeding the SOA

A device can fail even inside its max V and I ratings if it sees high voltage and high current at the same time.

```
secondary breakdown → local hotspot
linear pass: P = (Vin − Vout) · I
check the SOA curve; keep Tj < 150 °C
```

> **!:** **When in doubt, measure.** Bias is set by resistors and voltages — not vibes. Check `Vbe` (~0.6–0.7 V), `Vgs` vs `Vth`, and the idle current before you trust a circuit.
