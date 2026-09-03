---
title: "Electrical concepts"
description: "Ohm's law, logic levels, pull-ups, voltage dividers, and power for firmware devs."
category: "Embedded & hardware"
tags: ["electronics", "Ohm's law", "pull-up", "levels"]
weight: 260
lead: "The physics behind the firmware."
version: "for embedded"
---
Voltage, current, and resistance are the silicon's native language. These are the circuit facts — Ohm's law, pull-ups, logic levels, buses — you need to read a schematic and wire a board without releasing the magic smoke.

## Quick reference {#quickref}

The formulas and defaults you reach for most often, at a glance. Full explanations live in the numbered sections below.

### Ohm's law

```
V = I × R
I = V / R
R = V / I
```

### Power

```
P = V × I
P = I² × R
P = V² / R
```

### 3.3 V vs 5 V

A 3.3 V output drives a 5 V *TTL* input; 5 V into a 3.3 V pin over-voltages it — shift it down.

```
3.3 V:   VIH 2.0 V · VIL 0.8 V
5 V TTL: VIH 2.0 V · VIL 0.8 V
5 V CMOS: VIH 3.5 V · VIL 1.5 V
```

### Pull-up

10 kΩ is the universal default; use 4.7 kΩ on I²C.

```
Buttons:     10k
GPIO idle:   10k – 100k
I²C SDA/SCL: 4.7k
```

### Voltage divider

```
Vout = Vin × R2 / (R1 + R2)
# 12 V → 3.3 V: R1=2.7k, R2=1k
```

### Decoupling

Small caps at every IC power pin.

```
100 nF → each VCC pin
10 µF  → regulator bulk
```

### LED resistor

```
R = (Vcc − Vf) / If
# 5 V, red LED ≈ 150 Ω
```

### Buses

UART = 2 wires, I²C = 2 + pull-ups, SPI = 4.

```
UART: TX↔RX, 115200 8N1
I²C:  SDA + SCL (pull-ups)
SPI:  SCK, MOSI, MISO, CS
```

### ADC

```
count = Vin / Vref × (2^N − 1)
# 12-bit, 3.3 V → ~0.8 mV/step
```

## Fundamentals {#start}

Three quantities describe every DC circuit: voltage pushes, current flows, resistance resists. Master `V = IR` and `P = IV` and you can reason about almost any board.

**Voltage V** (potential · volts (V)) → **Current I** (flow · amperes (A)) → **Resistance R** (opposition · ohms (Ω)) → **V = I · R** (Ohm's law)

### Ohm's law

Rearrange for whatever you're missing.

```
V = I × R      # volts
I = V / R      # amps
R = V / I      # ohms
```

### Power

Heat dissipated in a load or resistor.

```
P = V × I      # watts
P = I² × R
P = V² / R
```

### Series vs parallel

Resistors add in series; capacitors add in parallel. The other way round, they divide.

```
R_series = R1 + R2 + R3
R_par    = 1/(1/R1 + 1/R2)
C_series = 1/(1/C1 + 1/C2)
C_par    = C1 + C2
```

> **Σ:** **Kirchhoff's laws.** KCL (current): the sum of currents into any node is zero — what flows in flows out. KVL (voltage): the sum of voltage drops around any closed loop is zero. Together they solve any resistor network.

<details>
<summary>SI units & prefixes</summary>

#### Common prefixes

```
k  kilo   10³    10,000 Ω = 10 kΩ
M  mega   10⁶    1,000,000 Ω = 1 MΩ
m  milli  10⁻³   0.001 A = 1 mA
µ  micro  10⁻⁶   0.000001 F = 1 µF
n  nano   10⁻⁹   0.000000001 F = 1 nF
p  pico   10⁻¹²  0.000000000001 F = 1 pF
```

#### Resistor color code

```
0 black    5 green
1 brown    6 blue
2 red      7 violet
3 orange   8 grey
4 yellow   9 white

4-band: [1st][2nd] × 10^[3rd] ± [4th]
# brown-black-red-gold
# = 10 × 10² = 1 kΩ ±5%
```

</details>

## Logic levels & signals {#levels}

A "1" is a voltage window, not a single value. Mixing 3.3 V and 5 V families without reading the thresholds is the classic first-board bug.

| Family | Supply | VIL max | VIH min | VOH min | VOL max |
| --- | --- | --- | --- | --- | --- |
| CMOS 3.3 V | 3.3 V | 0.8 V | 2.0 V | 2.4 V | 0.4 V |
| CMOS 5 V | 5 V | 1.5 V | 3.5 V | 4.4 V | 0.1 V |
| TTL 5 V | 5 V | 0.8 V | 2.0 V | 2.4 V | 0.4 V |

### Open-drain / open-collector

A pin only pulls *low* and releases to high-impedance — it never drives high. An external pull-up supplies the high level. This is why I²C tolerates mixed voltages on one bus.

```
open-drain:
  LOW  → transistor ON
  HIGH → released + pull-up
# the bus never fights itself
```

### Level shifting

5 V → 3.3 V: two-resistor divider or a shifter chip. 3.3 V → 5 V: usually fine into TTL, or use a TXS0108 / BSS138 for bidirectional.

```
5V ── R1 ──┬── 3.3V
            R2
            │
           GND
# R1:R2 ≈ 1:2 → 5V becomes 3.3V
```

> **!:** **The mismatch.** A 3.3 V output drives a 5 V TTL input fine (VOH 2.4 V > VIH 2.0 V). A 5 V output into a 3.3 V input exceeds the rail and can forward-bias the ESD diode — shift it down or use a 5 V-tolerant input.

## Pull-ups & pull-downs {#pull}

A CMOS input has near-infinite impedance: left unconnected it floats and reads random values or oscillates. A pull resistor ties it to a defined state.

### Pull-up

Resistor to VCC. Idle reads `HIGH`; a button or open-drain driver pulls it low.

```
VCC ── 10k ──┬── GPIO
             │
           button
             │
            GND   # pressed = LOW
```

### Pull-down

Resistor to GND. Idle reads `LOW`; a switch to VCC pulls it high.

```
VCC ── button
             │
           GPIO ── 10k ── GND
             # pressed = HIGH
```

### Typical values

10 kΩ is the universal default. Lower = stronger (faster edges, more current); higher = weaker (slower edges, less current).

```
GPIO idle:  10k – 100k
I²C SDA/SCL: 1.8k – 10k (3.3 V)
             4.7k (classic, 5 V)
Buttons:     10k
```

### I²C pull-ups

The bus is open-drain: pull-ups to the rail are required or the lines never rise. Too strong wastes power; too weak rounds the clock edges. Two 4.7 kΩ to 3.3 V is the safe default for most speeds.

```
SCL ── 4.7k ── 3.3V
SDA ── 4.7k ── 3.3V
# one pair for the whole bus
```

### Internal pull-ups

Most MCUs can enable a weak (~20–100 kΩ) internal pull-up or pull-down per pin in firmware — handy for buttons and idle states, too weak for I²C.

```
// Arduino
pinMode(BTN, INPUT_PULLUP);
// ESP-IDF
gpio_set_pull_mode(PIN, GPIO_PULLUP_ONLY);
// STM32 HAL
GPIO_Init.Pull = GPIO_PULLUP;
```

> **Ω:** **Rule of thumb:** use the MCU's internal pull for buttons and chip-selects, an external 10 kΩ for anything leaving the board, and real 4.7 kΩ (or per-bus calculated) pull-ups on I²C.

## Voltage dividers & ADCs {#dividers}

Two resistors scale a voltage down linearly. It's how you measure a 12 V rail with a 3.3 V ADC — and the basis of a simple low-pass filter.

### Divider formula

The output is the ratio of R2 to the total.

```
Vout = Vin × R2 / (R1 + R2)

Vin ── R1 ──┬── Vout
            R2
            │
           GND
```

### ADC reading

An N-bit ADC maps 0…Vref to 0…2^N−1 counts.

```
count = Vin / Vref × (2^N − 1)
Vin   = count × Vref / (2^N − 1)

# 12-bit, Vref = 3.3 V:
# 1 count ≈ 0.806 mV
```

### Source impedance

The divider's output impedance is R1 ∥ R2. Keep it under the ADC's maximum (often ~10 kΩ for SAR ADCs) or the sample-and-hold cap won't settle.

```
Rout = R1 × R2 / (R1 + R2)
# R1 = R2 = 10k → Rout = 5k ✓
```

1. **Sensor** — The voltage source to measure — a thermistor, battery, or potentiometer.
1. **Divider** — Scale it into the ADC's 0…Vref range with R1/R2.
1. **RC filter** — Add a cap to ground at the ADC pin to strip ripple and noise.
1. **Sample** — Read several samples, average them, then convert counts to volts in firmware.
> **RC:** **RC low-pass.** A capacitor from Vout to GND gives a cutoff `fc = 1 / (2πRC)`. A 10 kΩ + 100 nF pair gives fc ≈ 159 Hz — enough to kill PWM ripple or mains hum off a slow sensor. Place the cap close to the ADC pin.

## Passive components {#components}

The handful of two- and three-pin parts that surround every IC. Know what each does to current and voltage and most datasheet schematics become obvious.

### Resistor

Limits current, divides voltage, pulls pins. Rated in ohms and watts (¼ W is the through-hole default).

```
R = V / I
# 5 V, want 20 mA LED:
R = (5 - 2) / 0.02 = 150 Ω
```

### Capacitor

Stores charge, smooths voltage, blocks DC and passes AC. Decoupling caps sit next to every power pin.

```
C = Q / V      (farads)
100 nF → each IC VCC pin
10 µF  → regulator in/out
```

### Inductor

Stores energy in a magnetic field and resists changes in current. Used in buck/boost converters and filters.

```
V = L × dI/dt
# buck/boost energy storage
# + output smoothing
```

### Diode

Current flows one way only (anode → cathode). Forward drop ≈ 0.7 V silicon, ≈ 0.2–0.4 V Schottky.

```
Anode ──▶|── Cathode
  +          −   (band)
```

### LED + limiting resistor

An LED is a diode: it does not limit its own current. Always add a series resistor sized for the forward voltage.

```
R = (Vsupply - Vf) / If
# red LED Vf ≈ 2 V, 20 mA:
R = (5 - 2) / 0.02 = 150 Ω
```

### BJT vs MOSFET

Both switch a load from a small signal. A BJT is current-driven; a MOSFET is voltage-driven and wastes less at high current.

```
BJT:    Ic = β × Ib
MOSFET: Vgs > Vth → on
# logic-level FET: Vth ≤ 2 V
```

> **⚡:** **Switching a load:** for a relay or LED on 3.3 V logic, use an N-channel logic-level MOSFET (or an NPN with a base resistor). The transistor carries the load current so the GPIO only sources a few mA.

<details>
<summary>Reading component markings</summary>

#### Capacitors

```
104 = 10 × 10⁴ pF = 100 nF
103 = 10 × 10³ pF = 10 nF
# ceramic: 3-digit code, in pF
# electrolytic: value + volts printed
```

#### SMD resistors

```
103 = 10 × 10³ = 10 kΩ
472 = 47 × 10² = 4.7 kΩ
# 3 digits: value × 10^[last]
# 4 digits: value × 10^[last]
```

</details>

## Power & protection {#power}

Regulate the rail, then protect it. Most "mysterious resets" and dead boards trace back to power, not code.

### LDO vs buck

An LDO is simple and quiet but burns the drop as heat; a buck switches and stays efficient at large step-downs.

```
LDO:  5 V → 3.3 V, 100 mA
      P_drop = (5 - 3.3) × 0.1 = 0.17 W
Buck: 12 V → 3.3 V, 1 A
      P_drop ≈ small (η ~ 90%)
```

### Decoupling

Small caps at each IC power pin supply the fast current spikes the regulator can't. 100 nF per pin, 10 µF bulk near the regulator.

```
IC VCC ──┬── 100nF ── GND
         └── 10µF  ── GND (bulk)
# keep the 100nF < 2 mm from the pin
```

### Reverse polarity

Powering a board backwards can destroy ICs instantly. A series Schottky diode (low drop) or a P-FET circuit blocks it.

```
VIN ──▶|── load   (drop ~0.3 V)
# or a P-MOSFET high-side switch
```

### ESD protection

TVS diodes clamp transients to a safe level. Put them on connectors — USB, buttons, and any pin exposed to the outside world.

```
signal ──┬── TVS ── GND
         │
        IC pin   # clamps above Vcc
```

### Brownout & inrush

Brownout: the rail sags below the MCU's minimum under load and it resets (or corrupts flash). Inrush: bulk caps draw a huge current spike at power-on.

```
# brownout → bigger caps, better supply
# inrush   → soft-start, NTC, or
#            current-limited hot-plug
```

> **!:** **Budget for spikes.** Wi-Fi/BLE and motor inrush can pull 2–5× the average current for milliseconds. Size the regulator and bulk cap for the peak, and keep the brownout detector (`BOD`) enabled so the MCU resets cleanly instead of corrupting flash.

## Common buses {#comm}

UART for point-to-point, I²C for many devices on two wires, SPI for speed, RS-485 and CAN for noise-immune industrial runs.

| Bus | Wires | Topology | Speed | Notes |
| --- | --- | --- | --- | --- |
| `UART` | 2 (TX, RX) + GND | point-to-point | up to ~1–4 Mbit/s | No clock; both ends need the same baud. TTL 3.3/5 V or RS-232 ±12 V. |
| `I²C` | 2 (SDA, SCL) | multi-drop, 7-bit addr | 100 k / 400 k / 1 M | Open-drain — needs pull-ups. Address set by pins or fixed. |
| `SPI` | 4 (SCK, MOSI, MISO, CS) | one controller, per-device CS | 1–50+ MHz | Full-duplex and clocked. One CS line per peripheral. |
| `RS-485` | 2 (A, B) | multi-drop bus | up to 10 Mbit/s (short) | Differential; 120 Ω termination at both ends of a long run. |
| `CAN` | 2 (CANH, CANL) | multi-master bus | 125 k – 1 Mbit/s | Differential; 120 Ω at each physical end of the bus. |

### UART

TX of one device goes to RX of the other — cross the wires. A common default is 115200 8N1. A MAX3232 bridges TTL to RS-232.

```
TX  ── RX
RX  ── TX
GND ── GND
```

### I²C addressing

Each device has a 7-bit address; the 8th bit is read/write. Scan the bus to discover it. Pull SDA/SCL up once per bus, not per device.

```
// Arduino scan
Wire.beginTransmission(addr);
if (Wire.endTransmission() == 0)
  found(addr);   // 0x3C, 0x68, …
```

### SPI chip-select

Every device gets its own CS (active low). Assert CS, clock data, release CS. Mode (CPOL/CPHA) must match both ends.

```
CS   ── GPIO (one per chip)
SCK  ── SCK
MOSI ── MOSI
MISO ── MISO
```

<details>
<summary>Termination & addressing</summary>

#### Differential termination

RS-485 and CAN need a 120 Ω resistor at each physical end of the bus to absorb reflections. Use exactly two terminators — no more, no fewer — on the whole line.

#### I²C addresses

7-bit addresses 0x08–0x77 are free for peripherals; 0x00–0x07 and 0x78–0x7F are reserved. Check the datasheet — many chips document the address already shifted into 8-bit form.

</details>

## Pitfalls {#gotchas}

The bugs that survive code review because they live in hardware. Most are cheap to prevent and expensive to debug.

### Floating inputs

An unconnected CMOS input is neither 0 nor 1 — it picks up noise, oscillates, and burns extra current. Tie every unused input high or low.

```
GPIO ── 10k ── GND  # defined LOW
# never leave reset/enable open
```

### Ringing

Fast edges on long traces reflect and ring, overshooting the rail. Add a series resistor (22–100 Ω) at the driver, or terminate the line.

```
driver ── 33Ω ─── trace ─── input
# slows the edge, kills the ring
```

### Ground loops

Two ground paths at different potentials let current flow between them and inject hum into analog readings. Use a single-point (star) ground for analog.

```
# star ground: all returns meet
# at ONE point, analog separate
# from high-current returns
```

### Inrush current

Bulk capacitance charges like a short at power-on; connectors spark and fuses pop. Limit with soft-start, an NTC, or slow-blow fusing.

```
I_inrush = C × dV/dt
# 1000 µF, 5 V in 1 ms → 5 A spike
```

### Component ratings

Resistor power, capacitor voltage, diode current — derate to 50–80% of the datasheet max. A ¼ W resistor carrying 0.3 W runs hot and drifts.

```
P = I²R
# 100 mA through 10 Ω  = 0.1 W ✓
# 100 mA through 100 Ω = 1 W   ✗
```

### Noise on analog

Digital switching couples into ADC traces. Keep analog lines short, away from clocks and switch nodes, add an RC filter, and average samples.

```
sensor ── R ──┬── ADC
              C
              │
             GND   # fc = 1/(2πRC)
```

### GPIO current limits

An MCU pin sources/sinks only ~10–20 mA (some 3.3 V parts just 4–8 mA). Driving a relay, motor, or LED string directly can damage the pin — buffer with a transistor.

```
# per-pin: 10–20 mA max
# per-port: ~100–200 mA total
# → use a MOSFET/BJT for loads
```

### Capacitor polarity

Electrolytic and tantalum caps are polarized. Reverse one and it vents, pops, or shorts. The stripe marks the cathode (−) — point it at the more-negative node.

```
+ ──[ 100µF ]── GND
# stripe = −, goes to the
# lower-voltage side
```

### Cable voltage drop

Thin or long wires drop `V = I × R_wire` at the far end. A USB cable carrying 1–2 A can sag a 5 V rail enough to brown out a device — measure at the load.

```
V_drop = I × R_wire
# 28 AWG ≈ 0.2 Ω/m per wire
# VCC and GND both count
```
