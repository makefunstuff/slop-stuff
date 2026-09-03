---
title: "Electronics"
description: "Components, circuits, op-amps, power supplies, and practical electronics."
category: "Electronics"
tags: ["circuits", "op-amp", "regulator", "circuit"]
weight: 330
lead: "The parts that make it work."
version: "circuits"
---
From Ohm's law to op-amps and the 555 timer — a visual reference for the components, circuits, and power rules you reach for on every build.

## Quick reference {#quickref}

The numbers and formulas you reach for on every build — each one expanded in its own section below.

- `V = I × R` — Ohm's law — rearrange for I or R. Power: P = V × I = I² × R = V² ÷ R.
- `digit · digit × multiplier ± tolerance` — Resistor bands — black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9; gold ±5%, silver ±10%.
- `Vout = Vin × R2 / (R1 + R2)` — Voltage divider — scale a voltage down.
- `fc = 1 / (2π × R × C)` — RC filter — -3 dB cutoff for low- and high-pass.
- `Gain = 1 + R2 / R1` — Op-amp non-inverting gain — inverting: Gain = -Rf / Rin; follower: Gain = 1.
- `f = 1.44 / ((R1 + 2R2) × C)` — 555 astable frequency — duty = (R1 + R2) / (R1 + 2R2), always >50%.
- `R = (Vs - Vf) / I` — LED series resistor — limit current to ~20 mA.
- `7805: 7–25 V in → 5 V out` — Regulators — 7805/LDO linear (7805 dropout ≈ 2 V, LDO far lower); buck Vout = duty × Vin; boost Vout = Vin / (1 - duty).
- `100 nF + 10 µF` — Decoupling — 100 nF ceramic at every IC power pin, 10 µF bulk per rail.

> **QR:** **Where to find it:** fundamentals and passive parts → [01](#start)/[02](#components), gain and filters → [04](#opamp), regulators and decoupling → [05](#power), divider/555/LED → [06](#circuits).

## Fundamentals {#start}

Voltage pushes, current flows, resistance resists. Master these three quantities plus Ohm's law, and every other rule on this page follows.

### 1. Voltage (V)

Electrical pressure that moves charge, in volts. Think of it as the height of a water tank — the higher, the harder the push.

### 2. Current (I)

The rate charge flows through a circuit, in amperes. Current only flows in a closed loop, and it is the same everywhere in a series path.

### 3. Resistance (R)

Opposition to current, in ohms. Wire is near `0 Ω`; open air is near-infinite. Resistors set the current in a path.

### 4. Power (P)

Energy per second, in watts. In a resistor it becomes heat — the reason parts carry wattage ratings.

<kbd>1 kΩ</kbd> = <kbd>1000 Ω</kbd>
<kbd>1 mA</kbd> = <kbd>0.001 A</kbd>
<kbd>1 µF</kbd> = <kbd>10⁻⁶ F</kbd>
<kbd>1 nF</kbd> = <kbd>10⁻⁹ F</kbd>
<kbd>1 pF</kbd> = <kbd>10⁻¹² F</kbd>

> **Ω:** **Ohm's law:** `V = I × R` — rearrange for whichever quantity is unknown: `I = V ÷ R`, `R = V ÷ I`. Power follows: `P = V × I = I² × R = V² ÷ R`.

### Series & parallel

In series, current is shared and voltage divides. In parallel, voltage is shared and current divides.

```
series:   R_total = R1 + R2
parallel: R_total = (R1 × R2) / (R1 + R2)

series:   C_total = 1 / (1/C1 + 1/C2)
parallel: C_total = C1 + C2
```

### Kirchhoff's laws

**KCL** (current law): currents into a node sum to zero. **KVL** (voltage law): voltages around a loop sum to zero.

```
KCL:  Σ I_in = Σ I_out
KVL:  Σ V_loop = 0
```

## Passive components {#components}

Parts that store or resist energy without amplifying: resistors, capacitors, inductors, and transformers.

### Resistor

Limits current and drops voltage. Value in ohms, marked by color bands or printed digits.

### Capacitor

Stores energy in an electric field; blocks DC and passes AC. Values are tiny — µF, nF, pF.

### Inductor

Stores energy in a magnetic field; resists changes in current. Value in henries (H).

### Transformer

Two inductors sharing a core; steps AC voltage up or down by the turns ratio `V2/V1 = N2/N1`.

| Color | Digit | Multiplier |
| --- | --- | --- |
| Black | 0 | ×1 Ω |
| Brown | 1 | ×10 Ω |
| Red | 2 | ×100 Ω |
| Orange | 3 | ×1 kΩ |
| Yellow | 4 | ×10 kΩ |
| Green | 5 | ×100 kΩ |
| Blue | 6 | ×1 MΩ |
| Violet | 7 | ×10 MΩ |
| Grey | 8 | ×100 MΩ |
| White | 9 | ×1 GΩ |

> **4B:** **Reading a 4-band resistor:** digit, digit, multiplier, tolerance — `red red brown gold` = 2, 2, ×10, ±5% → `220 Ω`. Gold = ±5%, silver = ±10%, no band = ±20%.

### Capacitor types

Pick by value, polarity, and frequency. Electrolytics are polarized — mind the stripe.

```
ceramic:     1 pF – 10 µF, non-polar, HF
electrolytic: 1 µF – 10000 µF, polarized, DC
film:         1 nF – 10 µF, precise, audio
tantalum:     0.1 µF – 470 µF, compact, polarized
```

### Ratings & tolerance

Every part has a maximum voltage and power rating — stay well under it. Tolerance tells you the value spread.

```
±5% (E24) → 100 Ω = 95–105 Ω
±1% (E96) → tighter, for precision
0.25 W, 0.5 W  → resistor power ratings
```

## Active components {#active}

Semiconductors that control, switch, and amplify current. Op-amps get their own section below.

### Diode

Conducts one way only — anode to cathode. Drops about `0.7 V` forward (silicon) or `0.3 V` (Schottky) when on.

```
forward:  anode → cathode
reverse:  blocks (until it breaks)
```

### LED

A diode that emits light. Always add a series resistor to limit current; forward voltage is ~`1.8–3.3 V` by color.

```
R = (Vs - Vf) / I
R = (5 - 2) / 0.02 = 150 Ω
```

### Transistor (BJT)

A current-controlled switch and amplifier: a small base current switches a bigger collector–emitter current. NPN switches the low side.

```
Ic = β × Ib    (β = hFE, ~100–300)
```

### Voltage regulator

Turns a varying input into a steady output. Linear types (7805, LDO) waste heat; switching types (buck, boost) are efficient.

```
7805: 7–25 V in → 5 V out
```

| Property | BJT | MOSFET |
| --- | --- | --- |
| Controlled by | base current | gate voltage |
| Input | current gain β | near-zero gate current |
| Low-side switch | NPN | N-channel |
| On-state drop | Vce(sat) ≈ 0.2 V | Rds(on) × Id |

`1N4148` `1N4007` `2N2222` `BC547` `LM358` `LM7805` `IRFZ44N`

> **OP:** **Op-amps** are the building block of amplification, filtering, and comparison — see [section 04](#opamp) for the circuits and formulas.

## Op-amps {#opamp}

High-gain differential amplifiers tamed by feedback. Two golden rules plus a few circuits cover most real designs.

### Inverting amplifier

Output is an inverted, scaled copy of the input. Gain is set by two resistors.

```
Gain = -Rf / Rin
Vout = -Vin × (Rf / Rin)
```

### Non-inverting amplifier

Output follows the input in phase, amplified by `1 + R2/R1`. Gain is always ≥ 1.

```
Gain = 1 + R2 / R1
Vout = Vin × (1 + R2 / R1)
```

**V+ / V-** (differential input) → **A·(V+ - V-)** (open-loop gain) → **Vout** (feedback sets it)

| Mode | Gain / behavior | Use for |
| --- | --- | --- |
| Inverting | `-Rf / Rin` | Scaling + phase inversion |
| Non-inverting | `1 + R2 / R1` | Buffered gain ≥ 1 |
| Comparator | Output saturates to a rail | Threshold / level detect |
| Voltage follower | Gain = 1 (`Vout = Vin`) | Buffer a high-impedance source |

> **G:** **Golden rules** (with negative feedback): 1) the inputs draw no current; 2) the op-amp drives `Vout` so that `V+ = V-` — on an inverting circuit that makes the input a `virtual ground`.

<details>
<summary>Op-amp filters</summary>

#### Low-pass

```
fc = 1 / (2π × R × C)
```

Passes below `fc`, rolls off above at -20 dB/decade.

#### High-pass

```
fc = 1 / (2π × R × C)
```

Passes above `fc`, blocks DC and low frequencies.

#### Band-pass

```
cascade LP + HP
```

Passes a band between two cutoff frequencies.

#### Notch

```
twin-T, or a state-variable
```

Rejects a single narrow frequency (e.g. 50/60 Hz hum).

</details>

<details>
<summary>Choosing an op-amp</summary>

| Spec | Meaning | Rule of thumb |
| --- | --- | --- |
| Gain-bandwidth (GBW) | gain × bandwidth product | pick GBW > gain × f_signal × 10 |
| Slew rate | max V/µs the output can move | SR > 2π × f × V_peak |
| Rail-to-rail | output swings to the supplies | needed for low-voltage, single-supply |
| Input offset | DC error at the input | µV–mV; matters for precision DC |

</details>

## Power supplies {#power}

Turning a wall wart or battery into a clean, stable rail — linear or switching, plus rectification and decoupling.

| Regulator | Type | What it does |
| --- | --- | --- |
| `7805` | Linear | Fixed +5 V out, ~1 A, needs ≥ 7 V in |
| `LDO` | Linear | Regulates with a tiny input–output headroom |
| Buck | Switching | Efficiently steps voltage down (e.g. 12 V → 5 V) |
| Boost | Switching | Efficiently steps voltage up (e.g. 3.7 V → 5 V) |

| Rail | Typical use |
| --- | --- |
| 3.3 V | modern logic, sensors, microcontrollers |
| 5 V | Arduino, USB, classic logic |
| 12 V | motors, relays, LED strips |
| 24 V | industrial, robotics |

### Linear vs switching

Linear regulators are simple and quiet but burn the difference as heat. Switching regulators are efficient but add ripple and EMI.

```
linear:    P_loss = (Vin - Vout) × I
switching: η ≈ 85–95%

buck:   Vout = duty × Vin
boost:  Vout = Vin / (1 - duty)
```

### Rectification

Diodes turn AC into pulsing DC. A full-wave bridge uses both half-cycles, so it is smoother than a single diode.

```
half-wave:   Vdc ≈ 0.45 × Vac
full bridge: Vdc ≈ 0.9  × Vac

ripple shrinks as C × I grows
```

1. **AC mains** — 120/230 V AC from the wall outlet.
1. **Transformer** — Steps the voltage down to a safe, low AC level.
1. **Rectifier** — A diode bridge turns AC into pulsating DC.
1. **Filter** — A bulk capacitor smooths the ripple.
1. **Regulator** — A 7805 or LDO locks the output to a fixed DC rail.
1. **DC rail** — Clean, steady voltage for your circuit.
> **C:** **Decouple every IC:** a `100 nF` ceramic right at each power pin, plus a `10 µF` bulk cap per rail. It soaks up the current spikes that cause glitches and resets.

## Common circuits {#circuits}

Five breadboard staples with the formula for each — memorize these and you can build most beginner projects.

- `Vout = Vin × R2 / (R1 + R2)` — Voltage divider — scale a voltage down.
- `fc = 1 / (2π × R × C)` — RC low-pass filter — -3 dB cutoff.
- `f = 1.44 / ((R1 + 2R2) × C)` — 555 astable — oscillation frequency.
- `duty = (R1 + R2) / (R1 + 2R2)` — 555 astable — duty cycle (>50%).
- `R = (Vs - Vf) / I` — LED series resistor — current limiting.
- `Rb = (Vin - Vbe) / Ib` — Transistor switch — base resistor.

**Vin** (input) → **R1** (top resistor) → **Vout** (tap point) → **R2** (bottom resistor) → **GND** (0 V)

<details>
<summary>Worked examples</summary>

#### LED resistor

```
Vs = 5 V, Vf = 2 V, I = 20 mA
R = (5 - 2) / 0.02 = 150 Ω
```

#### 555 astable

```
R1 = 1 kΩ, R2 = 10 kΩ, C = 10 µF
f = 1.44 / ((1k + 2×10k) × 10µ) ≈ 6.9 Hz
```

#### Voltage divider

```
Vin = 12 V, R1 = R2 = 10 kΩ
Vout = 12 × 10k / 20k = 6 V
```

#### RC low-pass

```
R = 1 kΩ, C = 100 nF
fc = 1 / (2π × 1k × 100n) ≈ 1.6 kHz
```

</details>

## Signals & measurement {#signals}

Analog vs digital, PWM for fake analog, and the instruments that show you what is really on the wire.

### Analog vs digital

Analog is a continuous voltage with infinite resolution but is noise-sensitive. Digital is two discrete levels, so it shrugs off noise.

```
analog:  0–5 V, continuous (sensor, audio)
digital: 0/1, thresholds (logic, I²C, SPI)
```

### PWM

Pulse-width modulation fakes an analog level by switching a pin on and off fast. The average voltage tracks the duty cycle.

```
Vavg = duty × Vsupply
duty = t_on / (t_on + t_off)
```

- **HIGH** — Logic 1 — at or near Vcc. On 3.3 V CMOS that is roughly > 2 V.
- **LOW** — Logic 0 — at or near 0 V / ground.
- **Floating** — An unconnected input — undefined and oscillating. Always tie it high or low.
- **PWM** — Switching 0 to Vcc fast; the average is `duty × Vcc`.

| Logic (typical) | Input HIGH | Input LOW |
| --- | --- | --- |
| 5 V TTL | ≥ 2.0 V | ≤ 0.8 V |
| 3.3 V CMOS | ≥ 2.0 V | ≤ 0.8 V |
| 5 V CMOS | ≥ 3.5 V | ≤ 1.5 V |

| Instrument | Measures | Reach for it when |
| --- | --- | --- |
| Multimeter | Voltage, current, resistance, continuity | Checking rails, values, wiring |
| Oscilloscope | Voltage over time (waveforms) | Ripple, timing, glitches, signals |
| Logic analyzer | Many digital channels, timed | Protocol debug — I²C, SPI, UART |

> **!:** **Measure right:** voltmeters go in parallel, ammeters in series. Connecting an ammeter across a supply shorts it and pops the fuse.

## Pitfalls {#gotchas}

The mistakes that smoke parts and confuse beginners — learn them once, save a breadboard.

### Polarity

Electrolytic capacitors, LEDs, and diodes are polarized. Reverse an electrolytic and it vents; reverse a diode and it blocks until it breaks.

### Ratings

Every part has a maximum voltage, current, and power. Stay under ~70% and read the datasheet — a resistor dissipating 0.25 W needs at least a 0.5 W part.

### Heat

Regulators and transistors drop voltage and shed it as heat. Add a heatsink when `P_loss` makes the part too hot to hold.

### Decoupling

ICs glitch without bypass caps. Random resets and noise are usually a missing `100 nF` at the power pin.

### Floating inputs

An unconnected CMOS input floats and oscillates randomly. Tie it high or low with a pull-up or pull-down resistor.

### ESD

Static discharge destroys MOSFETs and CMOS. Ground yourself first, use a wrist strap, and store ICs in anti-static bags.

### Shared ground

Every part of a circuit must share one common `0 V` reference. Two boards or modules with no joined ground — or a forgotten `GND` jumper — is the classic "nothing works" cause.

### Flyback / back-EMF

Switching off a relay coil, motor, or solenoid collapses its magnetic field into a voltage spike that can kill the driver transistor. Put a flyback diode across the coil, cathode to `+V`.

> **!:** **Before powering on:** check polarity, confirm the supply voltage matches the board, and double-check capacitor orientation. Smoke is permanent.
