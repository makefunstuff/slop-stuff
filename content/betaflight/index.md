---
title: "Betaflight"
description: "Rates, PIDs, filters, modes, and CLI for FPV drones."
category: "Drones & FPV"
tags: ["drone", "PID", "rates", "filters"]
weight: 370
lead: "Tune the quad to fly itself."
version: "flight controller"
---
Betaflight is the open-source firmware that runs FPV flight controllers. It turns gyro data, your rates, and a PID loop into the motor commands that keep you in the air.

## Quick reference {#quickref}

The essentials you reach for on every build and tune — each section below expands on one of them.

- `Flash + Configurator` — Firmware Flasher → pick target + latest stable (4.6), Load Online. Configurator is date-versioned (2025.12+).
- `PID profiles` — Up to 6 profiles; switch with `profile N`. Tune P → D → I → F per quad.
- `Rates` — `rates_type = ACTUAL` sets center + max deg/s directly; switch with `rateprofile N`.
- `Filters & dynamic notch` — RPM filter first (`dshot_bidir = ON`), then dynamic notch, then raise lowpass cutoffs.
- `Modes` — `ARM` on a dedicated switch; `ANGLE` self-levels, `ACRO` is default, `AIRMODE` on for freestyle.
- `DShot` — `DShot300`/`DShot600` on the Motors tab; `dshot_bidir` adds RPM telemetry.
- `CLI diff / dump` — `diff all` is your whole tune; `dump all` is the full config. Back up before changes.
- `Arming flags` — `status` prints why it won't arm — `RX_FAILSAFE`, `THROTTLE`, `CALIBRATING`…

> **⚡:** **Props off for every bench step.** Flash, motor test, and first arm are the dangerous moments — no props, and no battery when USB is enough.

## What Betaflight is {#start}

Betaflight is open-source firmware for flight controllers (FCs). It reads the gyro, runs the PID loop, and drives the ESCs — the brain between your radio and the motors.

### 1. Flight controller firmware

Runs the `gyro → PID → motor` loop at 4–8 kHz to control roll, pitch, and yaw.

### 2. Targets

Firmware is built per board target, e.g. `STM32F405 (S4FO)`. The Configurator auto-selects it when you flash.

### 3. Configurator

The GUI (Betaflight Configurator 2025.12+ (date-versioned)) edits every setting; the CLI exposes the same values as text.

### 4. Board orientation

The FC's arrow must face forward. If it's mounted rotated, set Board & Sensor Alignment so up and forward match the quad.

**Sticks** (RC input) → **Receiver** (SBUS / CRSF) → **FC · PID** (gyro + loop) → **ESC** (DShot) → **Motors** (thrust)

> **KEY:** **Read the loop left to right.** Your sticks become a requested rotation rate, the gyro measures what actually happens, and the PID loop corrects the difference up to 8,000 times a second. **Rates set the target, PIDs chase it, filters clean the signal.**

## Setup & firmware {#setup}

Flash the right target, set your ports and protocols, then confirm the gyro sees the correct axes before you ever arm.

1. **Enter DFU mode** — Hold the boot button while plugging USB, or type `bl` in the CLI.
1. **Flash firmware** — Configurator → Firmware Flasher: pick target + version, then Load Online (or a local hex).
1. **Apply defaults** — Press *Apply Custom Defaults* or restore the board's factory configuration.
1. **Configure** — Calibrate the accelerometer, set board/sensor alignment, then ports and protocols.

| Setting | Where | Typical value |
| --- | --- | --- |
| Receiver protocol | Receiver tab | `CRSF` (ELRS/Crossfire) or `SBUS` |
| Serial RX port | Ports tab | the UART your receiver is wired to |
| ESC / motor protocol | Motors tab | `DShot300` or `DShot600` |
| Gyro & PID loop | Configuration tab | 4 kHz / 4 kHz (8 kHz capable) |
| Board alignment | Setup tab | FC arrow matches the quad's forward |

`SBUS` `CRSF` `ELRS` `IBUS` `F.Port` `DShot300` `DShot600` `Bluejay`

> **!:** **Props off for the whole setup.** A stray arm during flashing or motor testing spins all four motors at once. Remove props, and leave the LiPo unplugged when only USB power is needed.

## PIDs {#pid}

P chases the error, I holds attitude, D damps the response, and feedforward adds stick input straight to the motors.

| Term | Role | Raise it → | Too high → |
| --- | --- | --- | --- |
| `P` | Proportional — answers current error | crisper, snappier response | oscillation / bounce |
| `I` | Integral — sums past error, holds attitude | resists drift and wind | slow wobble, I-term wind-up |
| `D` | Derivative — damps P, anticipates change | less bounce, smoother | hot motors, D noise / jitter |
| `F` | Feedforward — adds stick input directly | sharper, less delay | overshoot on stops |

### Sample 5-inch PIDs

Betaflight 4.x defaults — a sane starting point for a 5-inch freestyle build.

```
# PID profile 1
set p_roll = 45
set i_roll = 90
set d_roll = 40
set f_roll = 100
set p_pitch = 50
set i_pitch = 90
set d_pitch = 40
set f_pitch = 100
set p_yaw = 45
set i_yaw = 90
set d_yaw = 0
set f_yaw = 100
```

### PID profiles

Up to 6 profiles, switched with `profile N` or the Adjustments tab. Keep one per build — tune per quad, not per pack.

```
profile 1   # switch profile
set p_roll = 42
save        # persist to flash
```

1. **Raise P** — Increase until it feels crisp and just starts to oscillate, then back off a few points.
1. **Raise D** — Add D to kill bounce and propwash; stop when motors run hot or D sounds rough.
1. **Set I** — Raise I until it holds attitude against wind without slow wobble.
1. **Add feedforward** — Increase F for snappier stick response; reduce it on overshoot.
> **⌁:** **D amplifies noise.** Raise D only after the filters are clean (see Filters); otherwise you trade propwash for hot, noisy motors.

## Rates {#rates}

Rates convert stick position into a requested rotation speed in degrees per second. They define how the quad *feels*, not how stable it is.

### ACTUAL vs BETAFLIGHT

`rates_type = ACTUAL` sets the center deg/s and the max deg/s directly (recommended). `BETAFLIGHT` is the legacy RC rate + super rate + expo formula.

```
set rates_type = ACTUAL
set roll_rc_rate = 100   # deg/s at center
set roll_srate = 70      # super rate 0–100
set roll_expo = 0        # center softening
```

### Rate profiles

Up to 6 profiles, switched with `rateprofile N`. Keep a race profile and a freestyle profile, or assign them per flight mode.

```
rateprofile 1
set pitch_rc_rate = 100
set yaw_rc_rate = 100
save
```

| Setting | What it changes | Turn it up when |
| --- | --- | --- |
| `rc_rate` | base deg/s around center | flips feel slow near center stick |
| `srate` | boost toward full stick | you want faster flips without a twitchy center |
| `expo` | softens center, keeps edges | hovering feels too twitchy |
| `max rate` | full-stick deg/s (ACTUAL) | you want a higher top-end spin rate |

<details>
<summary>Full rates dump (ACTUAL)</summary>

All three axes in one paste — center deg/s plus super rate and expo.

```
set rates_type = ACTUAL
set roll_rc_rate = 100
set roll_srate = 70
set roll_expo = 0
set pitch_rc_rate = 100
set pitch_srate = 70
set pitch_expo = 0
set yaw_rc_rate = 100
set yaw_srate = 70
set yaw_expo = 0
```

</details>

> **→:** Start at defaults and change **one axis at a time**. A few points of super rate is a large change in feel; max rate is where most people feel the difference first.

## Filters {#filters}

Filters strip gyro and motor noise so the PID loop sees only real movement. Too much filtering adds latency; too little cooks motors.

**Gyro** (raw samples) → **Lowpass** (gyro_lpf) → **Notch** (dyn + RPM) → **PID** (P · I · D · F) → **Motors** (DShot)

| Filter | Removes | Key CLI |
| --- | --- | --- |
| Gyro lowpass | high-frequency vibration / electrical noise | `gyro_lpf1_static_hz`, `gyro_lpf1_dyn_min_hz` |
| D-term lowpass | noise amplified by D | `dterm_lpf1_static_hz`, `dterm_lpf1_dyn_min_hz` |
| Dynamic notch | motor/prop resonance | `dyn_notch_min_hz`, `dyn_notch_max_hz`, `dyn_notch_count` |
| RPM filter | per-motor harmonics | `dshot_bidir = ON`, `motor_poles` |

### Bidirectional DShot + RPM

Enables ESC → FC RPM telemetry, which the RPM filter locks onto. Needs BLHeli_S/32 (or Bluejay) ESCs.

```
set dshot_bidir = ON
set motor_poles = 14   # match your motor
# verify per-motor RPM:
dshot_telemetry_info
```

### Clean baseline (5-inch)

A quiet starting point; raise cutoffs until it's clean but not mushy.

```
set gyro_lpf1_static_hz = 250
set gyro_lpf1_dyn_min_hz = 250
set gyro_lpf1_dyn_max_hz = 500
set dterm_lpf1_static_hz = 75
set dterm_lpf1_dyn_min_hz = 75
set dterm_lpf1_dyn_max_hz = 150
set dyn_notch_count = 3
```

`lowpass` `notch` `dynamic` `static` `RPM filter` `bidi-DShot`

> **⚠:** **Under-filtering = hot motors and mid-throttle oscillations; over-filtering = a mushy, delayed quad.** Set up RPM filtering first, then raise the lowpass cutoffs until it flies clean.

## Modes & features {#modes}

Modes are armed by AUX switch ranges on the Modes tab. Assign each to a switch position; only one flight mode (angle / horizon / acro) is active at a time.

| Mode / feature | Effect | Notes |
| --- | --- | --- |
| `ARM` | enables the motors | required — motors only spin when armed |
| `ANGLE` | self-levels and caps tilt | best for beginners and GPS rescue |
| `HORIZON` | self-level near center, acro at full stick | transitional training |
| `ACRO` | no self-level; holds angular rate | the default FPV mode (no mode selected) |
| `AIRMODE` | keeps PID authority at zero throttle | on for freestyle; keeps control in dives |
| `TURTLE` | reverses motors to flip upright | "flip over after crash" |
| `GPS RESCUE` | returns home on failsafe / switch | needs GPS + barometer |
| `FAILSAFE` | action on signal loss | drop, land, or GPS rescue |
| `OSD` | telemetry overlay on video | configure in the OSD tab |

<kbd>Arm switch</kbd> then <kbd>Throttle</kbd> lift off <kbd>Disarm</kbd> touchdown

- **Disarmed** — Motors off; arming checks pass before the switch arms.
- **Armed** — PID loop live; throttle controls thrust. AIRMODE keeps authority.
- **Failsafe stage 1** — Link lost — wait `failsafe_delay` before acting.
- **Failsafe stage 2** — Drop, land, or GPS rescue, depending on config.
> **✓:** **AIRMODE keeps fighting when the ground touches it.** Land by disarming just before touchdown — otherwise the quad bounces and skitters. Assign arm to a dedicated switch, not the throttle.

## CLI {#cli}

Every GUI setting is a CLI variable. `diff all` is your whole tune in one paste; `set` changes a value; `save` writes it to flash.

- `diff all` — Only settings that differ from defaults — your saved config.
- `dump all` — The full config: settings, resources, aux, vtxtable.
- `get rates_type` — Read a setting, its current value, and valid range.
- `set rates_type = ACTUAL` — Change a setting (persist with `save`).
- `save` — Write current settings to flash.
- `defaults` — Reset everything to firmware defaults.
- `bl` — Reboot into DFU/bootloader for flashing.
- `status` — Arming flags, voltage, gyro, version — read first when it won't arm.
- `tasks` — CPU load per loop/task (keep the busiest below ~60%).
- `resource` — List the pin → function map.
- `resource MOTOR 1 B00` — Remap motor 1 to pin B00, then `save`.
- `resource show all` — Print the full resource map.
- `vtx` — Current VTX table, band, channel, and power.
- `beeper` — Trigger the beeper; `beeper -GYRO_CALIBRATED` lists flags.
- `dshot_telemetry_info` — Per-motor RPM telemetry (verify RPM filter).
- `motor` — Spin each motor in sequence — props off!
- `version` — Firmware, target, and configurator versions.

<details>
<summary>VTX table & resource remapping</summary>

#### VTX table

Define the bands, channels, and power levels your VTX supports so the OSD and SmartAudio can drive it.

```
vtxtable bands 5
vtxtable channels 8
vtxtable band 1 BOSCAM_A A FACTORY 5865 5845 ...
vtxtable powerlevels 4
vtxtable powervalues 14 20 26 30
vtxtable powerlabels 25 100 400 800
```

#### Resource remapping

Move a function to a different MCU pin when you've rebuilt the wiring or need a spare UART.

```
resource
resource MOTOR 1 B00
resource MOTOR 2 B01
resource MOTOR 3 A03
resource MOTOR 4 A02
save
```

</details>

> **⌘:** Paste your `diff all` into a text file before every major change — it's a one-command backup of the entire tune.

## Pitfalls {#gotchas}

The five mistakes that turn a fresh build into a flipped quad — or a hospital trip.

### Props off when testing

Arming spins all four motors instantly. Remove props before the motor tab, `motor`, or any bench tuning — and never arm a quad you're holding.

```
motor   # motor test — PROPS OFF
```

### Motor order & direction

Motors must match the wiring diagram *and* spin the right way, or the quad flips on arming. Reverse rotation in the BLHeli/Bluejay configurator — not in Betaflight.

```
dshot_telemetry_info   # verify RPM per motor
```

### Board orientation

If the FC arrow isn't forward, the gyro corrects the wrong axis and it flips. Set Board & Sensor Alignment, then watch the 3D model in Setup follow the real quad.

```
set align_board_yaw = 90   # if arrow is rotated
```

### Failsafe not configured

Defaults may keep the motors running or drop without warning. Set Drop (or GPS rescue), and verify by switching the radio off while armed on the bench.

```
set failsafe_switch_mode = STAGE1
status   # check the arming flags
```

### Filter over-tuning

Too-low cutoffs feel mushy and can still overheat; too-high amplifies noise into hot motors. Change one filter at a time and test in the air.

```
get gyro_lpf1_dyn_min_hz   # before you touch it
```

### Arming disabled flags

"Why won't it arm?" — `status` prints the exact reason as flags: `RX_FAILSAFE` (no link), `THROTTLE` (stick not down), `ARM_SWITCH`, `CALIBRATING`, `MSP`, `CLI`. Fix the flag, not the switch.

```
status   # list arming disable flags
```

### ESC protocol mismatch

If the FC outputs DShot but the ESC is configured for Oneshot/PWM (or vice versa), motors can runaway or the quad flips on arm. Match the protocol in the Motors tab and the ESC configurator.

```
set motor_pwm_protocol = DSHOT600
save
```

`RX_FAILSAFE` `THROTTLE` `ANGLE` `ARM_SWITCH` `CLI` `CALIBRATING`

> **⚠:** **The rule again: props off.** Nearly every Betaflight injury is a quad that armed with props on during setup. Remove them, and only arm with the quad secured.
