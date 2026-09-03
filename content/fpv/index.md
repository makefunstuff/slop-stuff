---
title: "FPV engineer"
description: "Frames, motors, ESCs, VTX, radios, batteries, and build workflow."
category: "Drones & FPV"
tags: ["drone", "motors", "VTX", "ELRS"]
weight: 380
lead: "Build the drone from parts."
version: "drone tech"
---
An FPV quad is a short list of off-the-shelf parts wired into one machine: frame, flight controller, ESC, motors, VTX, camera, and receiver. Pick compatible pieces, wire them in the right order, and tune the result.

## Quick reference {#quickref}

The parts and numbers you reach for before every build — each item expands in its section below.

- `Frame` — Size = prop diameter: `3"` micro, `5"` freestyle, `7"` long range. Carbon plate + standoffs.
- `FC + RX` — FC runs `Betaflight` / `INAV`; the ELRS/Crossfire RX feeds stick positions over `CRSF` on a UART.
- `ESC` — `4-in-1` 40–60 A board on `DShot600`; `dshot_bidir = ON` adds RPM telemetry for filtering.
- `Motors + KV` — `2207 1750KV` on 6S, `2450KV` on 4S (5"). KV = unloaded RPM per volt; lower KV swings bigger props.
- `Props` — `5.1"` × 3-blade; more pitch = more grip and amp draw. Match hub to shaft (1.5 vs 5 mm).
- `Battery` — LiPo cells in series — `4S` = 14.8 V, `6S` = 22.2 V. Max amps = capacity(A) × C-rating.
- `VTX power` — `25 mW` race, `200–400 mW` general, `800 mW+` long range. Antenna goes on before the battery.
- `ELRS binding` — One shared **binding phrase** on module + RX pairs forever (WiFi / Lua). 2.4 GHz = 50–500 Hz, 900 MHz = up to 200 Hz.

> **⚡:** **Props off, smoke stopper on.** Build and bench-test with no props, first-power through a smoke stopper, and never store a LiPo full or below `3.0 V/cell`.

## The build anatomy {#start}

Nine parts make a quad. Everything else — GPS, buzzer, LEDs — is optional. Pick a frame size first; it decides every other component.

**Frame** (carbon skeleton) → **FC** (flight controller) → **ESC** (motor driver) → **Motors** (brushless) → **Props** (thrust) → **Battery** (LiPo power) → **VTX** (video out) → **Camera** (video in) → **RX** (control link)

### 1. Frame

Size is prop diameter: `3"` micro, `5"` freestyle, `7"` long range. Carbon plate + standoffs.

```
5" freestyle  ·  ~250 g AUW
7" long range  ·  ~400 g AUW
```

### 2. FC + RX

The FC runs `Betaflight` or `INAV`. The receiver (ELRS/Crossfire) feeds it stick positions over a UART.

```
FC: F405 / F722 / H743
RX: ExpressLRS 2.4 GHz
```

### 3. Power train

Battery → ESC → motors → props. ESC amperage must cover the motors' burst draw.

```
4S/6S LiPo → 45A ESC
→ 2207 1750KV → 5.1"
```

### 4. Video + control

Camera feeds the VTX, which broadcasts to your goggles. Analog or digital (DJI / Walksnail / HDZero).

```
camera → VTX → antenna
RC: radio → RX → FC
```

> **KEY:** **Choose the battery voltage first.** It locks in motor KV and ESC rating: `6S` wants `~1750 KV` motors on a 5", while `4S` wants `~2450 KV`. Mixing them up gives a sluggish or overheated quad.

## Motors & ESCs {#power}

Motor size and KV set the thrust; the ESC's amperage and DShot protocol decide how cleanly it's delivered.

| Motor size | Typical build | KV range | Prop |
| --- | --- | --- | --- |
| `0702 / 0802` | Tiny whoop (1S) | `18000–25000` | 31–40 mm |
| `1404 / 1505` | Micro (2–3") | `3800–4500` | 3" |
| `2207 / 2306` | Freestyle (5") | `1700–1900` (6S) | 5" |
| `2207 / 2306` | Freestyle (5") | `2300–2500` (4S) | 5" |
| `2507 / 2806.5` | Long range (7") | `1300–1600` | 7" |

### Motor size & KV

`2207` = 22 mm stator width, 7 mm tall — bigger stator, more torque. KV is unloaded RPM per volt: lower KV spins bigger props efficiently, higher KV favors small props.

```
2207 1750KV × 6S ≈ 38 850 RPM no-load
1404 4500KV × 4S ≈ 66 600 RPM no-load
```

### Thrust-to-weight

Every gram counts. A 5" freestyle quad should push `≥4:1`; anything below `2:1` barely flies. Check motor thrust tables at your prop size.

```
thrust = 4 × 900 g  →  3600 g
AUW   = 700 g      →  ~5:1
```

### ESC amperage

Rate the ESC above the motors' peak draw with margin. A `4-in-1` ESC carries all four motors on one board; individual ESCs sit on the arms.

```
5" 6S:  40–60 A (4-in-1)
7" LR:  40–55 A (4-in-1)
```

### DShot protocol

Digital ESC protocol, immune to calibration drift. `DShot300/600` is standard; `bidirectional DShot` reads motor RPM for filtering.

```
set dshot_bidir = ON
set motor_poles = 14
```

> **⌁:** Prop size and pitch tune the feel: more pitch (`5.1 × 4.3`) = more grip and amp draw, less pitch = more efficiency and float. Match the prop's hub to the motor's shaft (1.5 mm vs 5 mm).

`DShot300` `DShot600` `bidirectional` `RPM filter` `4-in-1` `prop-in` `prop-out`

## Video & VTX {#video}

The camera and VTX make the live feed. Analog is cheap and resilient; digital systems trade latency and price for a clean image.

| System | Latency | Image | Notes |
| --- | --- | --- | --- |
| `Analog` | ~20 ms | 700 TVL | Cheapest, degrades to snow instead of dropping out. |
| `DJI O3 / O4 / O4 Pro` | ~28–40 ms | 4K / 1080p | Closed ecosystem; O4 Pro adds 4K/120 and better dynamic range. |
| `Walksnail` | ~22–32 ms | 1080p | Open, compatible goggles, good night mode. |
| `HDZero` | ~14 ms fixed | 720p / 1080p | Lowest, fixed-latency digital; race standard. |

### VTX power

More milliwatts = more range, more heat, more interference for others. Race on `25 mW`, fly around on `200–400 mW`, push `800 mW–1 W+` for long range.

```
25 mW   — indoor / race
200 mW  — general
800 mW  — long range
```

### Antennas

Circular-polarized (CP) antennas reject multipath. `RHCP` and `LHCP` must match on both ends; mixing halves the signal. Omni for all-around, patch/helical for range.

```
VTX: RHCP omni (u.FL / MMCX / SMA)
Goggle: RHCP omni + patch
```

### Channels & bands

5.8 GHz, 40 channels across bands `A/B/E/F/R`. Raceband is the community default — spacing avoids bleed-over between pilots.

```
R1 5658 · R2 5695 · R3 5732 · R4 5769
R5 5806 · R6 5843 · R7 5880 · R8 5917
```

### VTX tables

Betaflight needs a VTX table matching your hardware to set power and channel from the OSD. Load the manufacturer's JSON via the Video Transmitter tab.

```
SA (SmartAudio)  — many analog VTX
IRC Tramp        — TBS / others
```

`RHCP` `LHCP` `u.FL` `MMCX` `SMA` `RP-SMA` `omni` `patch`

## Radio links {#radio}

The control link is a serial stream from your radio to the flight controller. ExpressLRS is the modern default; Crossfire owns the long-range niche.

| Link | Band | Packet rate | Notes |
| --- | --- | --- | --- |
| `ExpressLRS (ELRS)` | 2.4 GHz / 900 MHz | 50–500 Hz (2.4G) | Open-source, cheap; 3.x firmware, 500 Hz max on 2.4 GHz, 200 Hz on 900 MHz. |
| `TBS Crossfire` | 900 MHz | 50–150 Hz | Proven long range, up to 2 W, paid hardware. |
| `FrSky ACCST / ACCESS` | 2.4 GHz | ~9 ms | Legacy; being replaced by ELRS. |

### Protocols to the FC

The receiver talks to the FC over a serial protocol. `CRSF` (ELRS/Crossfire) is the one you want; `SBUS` and `PPM` are older and slower.

```
CRSF  — full telemetry, native
SBUS  — inverted serial, no telemetry
```

### Binding ELRS

Set one **binding phrase** on the module and receiver — they pair automatically on every boot. Flash over WiFi, the ELRS Configurator, or Betaflight passthrough.

```
# shared passphrase (ELRS 3.x), e.g.
my-fpv-quad-01
# update: WiFi / Configurator / Lua
```

### Failsafe

Configure what the FC does when the link dies. `Drop` disarms immediately; `Land` glides down. Stage 1 holds last input, stage 2 enacts the action.

```
failsafe = DROP
guard time ≈ 1.0 s (stage 1)
```

### Link quality

Watch `LQ` (0–100) and `RSSI dBm` in the OSD, not just RSSI percent. 2.4 GHz is low latency; 900 MHz penetrates walls and range better.

```
LQ ≥ 80  — solid
LQ < 50  — turn back
RSSI dBm ≤ -105 — near limit
```

> **✓:** **Tip:** set the receiver protocol to `CRSF` and enable `Telemetry` on the same UART in the Ports tab, or your radio shows nothing about battery voltage or link health.

`2.4 GHz` `900 MHz` `500 Hz` `CRSF` `SBUS` `telemetry` `binding phrase`

## Batteries & power {#battery}

A LiPo is cells in series. Cell count sets voltage; capacity and C-rating set how hard and how long it can push current.

| Cells | Nominal | Full charge | Storage | Typical use |
| --- | --- | --- | --- | --- |
| `1S` | 3.7 V | 4.2 V | 3.8 V | Tiny whoop |
| `2S` | 7.4 V | 8.4 V | 7.6 V | Micro / 2" |
| `3S` | 11.1 V | 12.6 V | 11.4 V | Light 3" |
| `4S` | 14.8 V | 16.8 V | 15.2 V | 3–5" classic |
| `6S` | 22.2 V | 25.2 V | 22.8 V | 5–7" modern |

### C-rating & mAh

Capacity (`mAh`) is runtime; C-rating is max current = `capacity(A) × C`. A 1300 mAh 100C pack claims 130 A burst — treat peak C as optimistic.

```
1.3 Ah × 100C = 130 A (burst)
300 mAh whoop → 1300 mAh 5" → 3000 mAh 7"
```

### Connectors

`XT30` for small builds, `XT60` for 5" and up. The balance lead (JST-XH) lets the charger watch each cell.

```
XT30 — ≤ ~30 A (micro)
XT60 — ≤ ~60 A (5"+)
```

### Charging

Balance-charge at `1C`: a 1300 mAh pack charges at 1.3 A. Never leave a LiPo unattended, and charge in a LiPo-safe bag.

```
1300 mAh @ 1C → 1.3 A
4S  → "4S 14.8V" balance mode
```

### Storage & safety

Store at `3.8 V/cell`, never below `3.0 V/cell`. Land around `3.5 V/cell` under load so it recovers to ~3.7 V resting.

```
storage: 3.8 V/cell
never below: 3.0 V/cell (damage)
```

<kbd>1S</kbd> = <kbd>3.7 V</kbd> · <kbd>4S</kbd> = <kbd>14.8 V</kbd> · <kbd>6S</kbd> = <kbd>22.2 V</kbd> · <kbd>storage</kbd> = <kbd>3.8 V/cell</kbd> · <kbd>min</kbd> = <kbd>3.0 V/cell</kbd>

- **4.20 V/cell** — Fully charged — fly soon, never store a pack here for days.
- **3.80 V/cell** — Storage voltage — the safe resting point between sessions.
- **3.50 V/cell** — Under-load landing target; recovers to ~3.7 V resting.
- **< 3.0 V/cell** — Over-discharged — permanent damage and fire risk on recharge.

<details>
<summary>Parallel charging</summary>

#### Rules

Only charge identical packs — same cell count and similar capacity — and keep cell voltages close before connecting to the board.

#### Math

Total current = `1C × sum of capacities`. Two 1300 mAh packs in parallel charge at `2.6 A`.

</details>

> **⚠:** **LiPos are a fire risk.** A punctured, over-discharged, or over-charged cell can vent with flame. Dispose of puffing or damaged packs at a battery recycler — never in household trash.

## Build & solder {#build}

Build in an order that keeps the wiring testable: frame, then electronics, then a smoke test before any prop ever goes on.

1. **Prep the frame** — Mount motors on the arms and route wires to the center. Use a frame diagram to keep left/right straight.
1. **Solder the stack** — Tin pads and wires first, use flux, and keep the iron at `350–400 °C`. ESC power pads → XT60 pigtail; FC → ESC signal harness.
1. **Wire motor order** — Match each ESC output to Betaflight's motor number, or remap with `resource` so signal wires don't cross.
1. **Set prop direction** — Diagonal motors spin the same way. Verify each motor's rotation in the Motors tab before mounting props.
1. **Smoke test** — Power up through a **smoke stopper** (current-limiting bulb). A bright, steady bulb means a short — fix it before full power.

### Motor order (Quad X)

Betaflight's default numbering, viewed from above with the nose away from you:

```
1  rear-right   CW
2  front-right  CCW
3  rear-left    CCW
4  front-left   CW
```

### Solder checklist

Clean joints are shiny and shaped like a tent; cold joints are dull and balled. Heat-shrink every joint, strain-relief with zip ties.

```
✓ tin pads + wires   ✓ flux
✓ no bridges         ✓ heat shrink
✓ multimeter continuity check
```

- `resource MOTOR 1 B04` — remap a motor signal to another pin.
- `set motor_pwm_protocol = DSHOT600` — pick the ESC protocol.
- `set dshot_bidir = ON` — enable RPM telemetry for filtering.
- `set motor_poles = 14` — match the motor's magnet count.
- `diff all` — save your full config as text.

> **✓:** **Tip:** build and configure the whole quad with **no props installed**. Props go on only after the motors spin correctly, the FC arms, and the smoke test passes.

## First flight & tuning {#tuning}

Bench-test everything in Betaflight before the maiden, then tune rates and PIDs from a conservative baseline.

### Betaflight setup

- `flash firmware` — match the board target (F405/F722/H743).
- `set protocol DSHOT600` — ESC protocol in Motors tab.
- `CRSF on a UART` — Ports → Serial RX + Telemetry.
- `gyro orientation` — board arrow matches movement.
- `arm switch + modes` — ARM, ANGLE, ACRO, and a beeper.
- `failsafe = DROP` — disarm on link loss.

### Rates

Rates set max rotation speed and feel. Start with Betaflight defaults, then raise super rate for a snappier stick response.

```
RC rate 1.00 · super 0.70 · expo 0.00
→ ~667 °/s (default feel)
```

1. **Verify on the bench** — Props off. Arm, spin each motor, confirm direction and that the gyro trace reacts the right way when you tilt.
1. **Maiden hover** — First real flight in `ANGLE` (self-leveling) over grass. It should hover with the sticks near center.
1. **Switch to ACRO** — Acro/air mode has no self-leveling — hold small stick inputs and build feel low and slow.
1. **Tune from baseline** — Change one thing at a time: rates first, then PIDs only if it oscillates, washes out, or bounces after flips.
- **ACRO** — No self-leveling — full manual control, the end goal for freestyle.
- **ANGLE** — Self-levels and caps tilt angle — maiden flights and rescues.
- **HORIZON** — Self-levels near stick center, full rates at the edges.
- **AIR MODE** — Keeps PID authority at zero throttle — always on for acro.

<details>
<summary>Common tuning symptoms</summary>

#### Oscillates / shakes

Too much P or D gain. Drop the master multiplier or the affected axis.

#### Washes out in dives

Raise D, or add a touch of I on the affected axis.

#### Bounces after flips

Raise D slightly to damp the stop; too much D makes motors run hot.

#### Feels sluggish

Raise super rate before touching PIDs — usually a feel problem, not a tune problem.

</details>

## Pitfalls {#gotchas}

Eight mistakes wreck more quads than crashes do. Check these before every first arm.

### Wrong prop direction

A backwards prop (or one mounted on the wrong motor) makes the quad flip instantly on arm. CW and CCW are printed on the hub — match them to the motor.

```
flip on arm → check prop CW/CCW
```

### Motor order mismatch

If the FC thinks motor 1 is front-left but it's wired rear-right, the quad flips. Verify each output in the Motors tab.

```
Motors tab → spin #1 → front-left spins?
```

### Short circuits

A solder bridge between power and ground, or a cold joint, can kill the ESC or FC on first power. Always first-power through a smoke stopper.

```
bright bulb = short → desolder, re-check
```

### VTX without antenna

Powering a VTX with no antenna loads the power amplifier and burns it out within seconds. The antenna goes on before the battery, every time.

```
power VTX with antenna attached ONLY
```

### Battery sag

Voltage dips hard under load — old, low-C, or cold packs sag more and can brown out the FC. Land at ~3.5 V/cell under load.

```
resting 3.7 V/cell after flight = healthy
```

### Arming indoors

Never arm a quad with props on indoors or near people. Props off for bench tests; maiden outside, away from yourself and others.

```
bench = props OFF · maiden = outside
```

### Gyro orientation wrong

If the board arrow isn't forward (or the FC is mounted rotated), the gyro feeds the wrong axes and the quad flips or drifts. Set Board & Sensor Alignment, then confirm the 3D model mirrors the quad.

```
tilt quad → model mirrors it, arrow forward
```

### Wrong KV for voltage

Running a high-KV (4S) motor on 6S draws far more current and can smoke motors or ESCs; a low-KV (6S) motor on 4S flies sluggish with hot batteries. Match KV to cell count.

```
6S ↔ ~1750KV · 4S ↔ ~2450KV (5")
```

> **⚠:** **Props cut deep.** Treat an armed quad as live: remove props for any bench work, set a pre-arm switch, and stand clear when arming.
