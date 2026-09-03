---
title: "ArduPilot"
description: "Copter 4.6: modes, failsafes, params, EKF, tune order, maiden ladder, and AI-slop kill-list."
category: "Drones & FPV"
tags: ["drone", "Copter", "failsafe", "EKF", "Mission Planner"]
weight: 360
lead: "Autopilot for anything that flies — pin Copter 4.6."
version: "Copter 4.6.x"
---
ArduPilot Copter **4.6.x** (stable **4.6.3**). Units are **cm / cm/s / cdeg** unless noted. Wiki pages that show `RTL_ALT_M`, `LAND_SPD_MS`, `PSC_NE_*`, `ARMING_SKIPCHK` are **4.7** — do not copy them onto a 4.6 craft.

## Quick reference {#quickref}

| Topic | 4.6 truth |
| --- | --- |
| GCS | `Mission Planner` (Windows, `.BIN` logs, CompassMot) · `QGroundControl` (cross-platform flash) — don’t dual-write params |
| Cal order | Frame reboot → AHRS → accel 6-face → compass → radio + `FS_THR_VALUE` → ESC → motor test → level → battery FS → modes → outdoor GPS |
| Maiden | **Stabilize → AltHold → Loiter → test RTL → Auto** |
| Radio FS | `FS_THR_ENABLE=1` RTL · `FS_THR_VALUE` ≥10µs below `RC3_MIN`, >910 |
| Battery FS | Stock `BATT_FS_LOW_ACT=0` = **warn only** → set **`2` RTL**; `BATT_LOW_VOLT` default 10.5V is **3S** |
| EKF FS | Two variances > `FS_EKF_THRESH` (0.8) → Land · **don’t raise thresh** |
| RTL climb | `RTL_ALT=1500` = **15 m** (cm!) · home = **arm point** · straight line |
| Arm | Throttle low + yaw right if `ARMING_RUDDER=2` · `ARMING_CHECK=1` never 0 |
| Tune order | Linear motors → hover → **harmonic notch** → rate P/D → AutoTune → angle/pos later |

## GCS {#gcs}

| | Mission Planner | QGroundControl |
| --- | --- | --- |
| Best at | Param bitmasks, CompassMot, `.BIN` log analysis | Flash, cross-platform UI |
| Trap | Dual-open with QGC = param fights | Weak CompassMot / log workflow |

Flash **Copter 4.6.x** for your board target — not Plane, not “latest 4.7 beta”.

## Frame & arming {#frame}

| Param | Default / note | Pitfall |
| --- | --- | --- |
| `FRAME_CLASS` | 1 Quad typical · **reboot** | 0 = pre-arm; Heli class on multicopter firmware = invalid |
| `FRAME_TYPE` | 1 X typical · **reboot** | BF/DJI X ≠ ArduPilot X → flip on takeoff |
| `ARMING_CHECK` | **1 All** | **Never 0** “to make it arm” |
| `ARMING_RUDDER` | Copter **2** ArmOrDisarm | Plane default **1** ArmOnly — don’t copy |
| `BRD_SAFETY_DEFLT` | 1 on Pixhawk-class | Was `BRD_SAFETYENABLE`; press safety or set 0 + reboot |
| `DISARM_DELAY` | 10 s | 0 + crash on side = motors stay live |

## Calibration order {#cal}

**Props off until maiden.** Battery off during RC cal if USB can power the FC.

1. `FRAME_CLASS` / `FRAME_TYPE` → reboot · Motor Test map
2. `AHRS_ORIENTATION` if not arrow-forward → reboot
3. Accel — all 6 faces, level → reboot
4. Compass — prefer external mast mag; disable **internal** (`COMPASS_USEn=0`) if inconsistent; CompassMot = **last resort**
5. Radio — Mode 2; Copter wants **throttle low** on center dialog; set `FS_THR_VALUE` from numbers
6. ESC — **DShot**: set `MOT_PWM_TYPE`, no analog cal · **Analog**: `ESC_CALIBRATION=3`, props off, reboot, wait tones — **not** high-throttle-then-power
7. Motor Test → set `MOT_SPIN_ARM` < `MOT_SPIN_MIN`
8. Level horizon · `BATT_MONITOR` + capacity · **`BATT_FS_LOW_ACT=2`**
9. `FLTMODE_CH=5` with Stabilize/AltHold + RTL on throws
10. Outdoor: 3D fix, HDOP ≤ `GPS_HDOP_GOOD` (default **1.40**)

## Flight mode matrix {#modes}

| Mode | GPS | Alt | Sticks | Use |
| --- | --- | --- | --- | --- |
| Stabilize | N | manual thr | lean; center levels | maiden + bailout |
| Acro | N | manual | rate; center ≠ level | after tune |
| AltHold | N | baro | Stab + mid holds alt | 2nd flight |
| Loiter | **Y** | baro+GPS | velocity; center stops | daily GPS hover |
| PosHold | **Y** | baro | lean like Stab; release brakes | prefer Loiter |
| RTL | **Y** | baro/terrain opt | auto | home switch |
| Auto | **Y** | mission | auto | missions |
| Guided | **Y** | GCS | GCS | click-to-fly |
| Land | N* | baro | descent `LAND_SPEED` | FS fallback |
| Brake | **Y** | baro | ignores sticks | flyaway |
| SmartRTL | **Y** | baro | breadcrumb | obstacles to home |
| FlowHold | flow cam | baro | Loiter-like | only if FLOW set up |
| Sport | N | baro | rate + hold attitude | **often compiled out** in 4.6 |

\*Land uses position if healthy. Only **Stabilize/Acro** save a bad EKF — RTL will not.

`FLTMODE1`–`6` PWM slots on `FLTMODE_CH` (Copter **5**, Plane **8**). Never put only GPS modes on a 3-pos with no Stab/AltHold bailout.

## Failsafe matrix {#failsafes}

Triggers debounce; actions **don’t auto-clear** — flick the mode switch.

| FS | Trigger | Rec action | Misconfig |
| --- | --- | --- | --- |
| Radio | no pulses **or** ch3 < `FS_THR_VALUE` (~1s) | `FS_THR_ENABLE=1` RTL | VALUE inside stick range; RX hold-last; RX forcing ch5=RTL (**wiki: do not**) |
| Batt low | V < `BATT_LOW_VOLT` 10s or mAh | **`BATT_FS_LOW_ACT=2` RTL** | stock **0 warn-only**; 10.5V is 3S; reboot to clear |
| Batt crit | lower V/mAh | Land (`1`) | CRT≥LOW pre-arm; Terminate=motors off |
| GCS | no heartbeat 5s, **after GCS connected** | `1` RTL if telem; else leave `0` | closing MP mid-flight; bit4 continues pilot modes |
| EKF | any **two** variances >0.8 ~1s | Land (`1`); **don’t raise thresh** | raising lengthens flyaways |
| Dead-reckon (4.6) | lost pos/vel | `FS_DR_ENABLE` RTL then EKF after ~30s | ≠ EKF FS |
| Fence | alt/circle/polygon | RTL/Land | enable with none defined; no position+fence = no arm |

Pre-4.0 names `FS_BATT_*` are **slop** — use `BATT_FS_LOW_ACT`, `BATT_LOW_VOLT`, `BATT_CRT_*`.

## Must-have params {#params}

### GPS / EKF

| Param | 4.6 note | Pitfall |
| --- | --- | --- |
| `GPS1_TYPE` | was `GPS_TYPE` | `0` + EKF wants GPS = cannot arm |
| `GPS_HDOP_GOOD` | **140** (=1.40) | raising under trees → Loiter toiletbowl |
| `EK3_ENABLE` | **1** (EKF3) | EKF2 gone from default builds |
| `EK3_SRC1_POSXY/VELXY` | GPS | match sources to hardware |
| `EK3_SRC1_YAW` | Compass | Copter ≠ Plane auto-GSF |
| `FS_EKF_THRESH` | **0.8** | **don’t raise** to “stop landing” |

### Motors / ESC

| Param | Note | Pitfall |
| --- | --- | --- |
| `MOT_SPIN_ARM` | < `MOT_SPIN_MIN` | find with Motor Test |
| `MOT_THST_HOVER` | learns ~0.2–0.5 | hover **>0.7** unsafe for AltHold |
| `MOT_PWM_TYPE` | DShot 4–7 | DShot → skip analog ESC cal |
| `ESC_CALIBRATION` | set **3**, props off | not high-throttle plug-in |

### RTL / Land (cm!)

| Param | Default meaning | Pitfall |
| --- | --- | --- |
| `RTL_ALT` | **1500** = 15 **m** | `15` = 15 **cm** → tree |
| `RTL_ALT_FINAL` | **0** = land | non-zero = hover and wait |
| `LAND_SPEED` | **50** cm/s | 4.7 name `LAND_SPD_MS` |
| `ANGLE_MAX` | **3000** cdeg = 30° | 4.7 → `ATC_ANGLE_MAX` in degrees |

### Tune order (not a PID dump)

1. Linear motors / expo (`MOT_THST_EXPO`)
2. Stable hover
3. **Harmonic notch** (`INS_HNTCH_*`) — before AutoTune
4. Rate P/D (`ATC_RAT_*`) — I≈P on multicopters
5. AutoTune (rate only)
6. Angle / position later (`ATC_ANG_*`, `PSC_*`)

`PSC_ACCZ_*`: keep **I ≈ 2×P**; never raise on a vibey craft (climb-to-the-moon). Toiletbowl in Loiter = **compass**, not `PSC_POSXY_P`.

## EKF / vibes {#ekf}

| Check | Target |
| --- | --- |
| `VIBE` | < ~30; **Clip = 0** |
| XKF4 variances | < `FS_EKF_THRESH` |
| Mag vs throttle | walk = relocate mag, not CompassMot first |

> **KEY:** Raising `FS_EKF_THRESH` extends flyaways. Fix mount, props, mag, GPS — don’t paper over variances.

## Maiden ladder {#maiden}

1. Props on, outdoor clear, HDOP ≤ 1.4
2. **Stabilize** — hover ~mid stick, practice bailout
3. **AltHold** — mid holds height; watch climb on vibe
4. **Loiter** — center stops; watch toiletbowl
5. **RTL at altitude** — confirm climb, home, land behavior
6. **Auto** — only with a real mission loaded

Logs: CTUN alt track · VIBE/Clip · MAG · XKF variances.

## Plane landmines {#plane}

| Don’t paste onto Copter | Why |
| --- | --- |
| `THR_FAILSAFE`, `RTL_ALTITUDE` | Plane names |
| `MODE_CH=8` / `FLTMODE_CH=8` | Copter default **5** |
| `Q_*` VTOL | Plane/QuadPlane |
| `ARMING_RUDDER=1` | Copter wants **2** for yaw disarm |
| Wiki `_M` / `_MS` / `PSC_NE_*` | **4.7** |

## AI-slop kill-list {#gotchas}

| Slop | Reality |
| --- | --- |
| BF rates = `ATC_RAT_*` | Ardu has rate + angle + pos + ACCZ |
| `FS_THR_VALUE` near stick low | Must sit **below** `RC3_MIN` |
| `ARMING_CHECK=0` | Not a fix |
| Raise `FS_EKF_THRESH` | Extends flyaways |
| CompassMot first | Disable internal mag first |
| Plane params on Copter | See landmines |
| MP + QGC both writing | Pick one writer |
| GPS modes without 3D / HDOP | Toiletbowl / FS |
| Disarm vs Land vs Terminate | AirMode keeps motors up — RC-loss won’t disarm |
| `RTL_ALT=1500` as “1500 m” | It’s **15 m** (cm) |
| `GPS_TYPE` | Use **`GPS1_TYPE`** |
| AutoTune flight 1 | Notch first |
| Default battery FS = RTL | Stock is **warn only** |
| Sport/FlowHold as universal | Often missing / needs hardware |
| Home = launch pad vibe | Home = **arm point** |
| RX forces mode-ch to RTL | Wiki **do not** |
| Teach 4.7 names on 4.6 | `RTL_ALT_M`, `ARMING_SKIPCHK`, `PSC_NE_*` |

**4.5→4.6 teach:** `GPS1_TYPE`, `ARMING_NEED_LOC`, `FS_DR_*`, `ATC_LAND_*_MULT`, PID bit in `LOG_BITMASK`, Sport often gone.

## Refs {#refs}

- [Flight modes](https://ardupilot.org/copter/docs/flight-modes.html)
- [Radio failsafe](https://ardupilot.org/copter/docs/radio-failsafe.html) · [Battery](https://ardupilot.org/copter/docs/failsafe-battery.html) · [GCS](https://ardupilot.org/copter/docs/gcs-failsafe.html) · [EKF](https://ardupilot.org/copter/docs/ekf-inav-failsafe.html)
- [ESC calibration](https://ardupilot.org/copter/docs/esc-calibration.html) · [Tuning process](https://ardupilot.org/copter/docs/tuning-process-instructions.html) · [IMU notch](https://ardupilot.org/copter/docs/common-imu-notch-filtering.html)
- [Param name changes](https://ardupilot.org/copter/docs/common-param-name-changes.html) — translate wiki 4.7 → 4.6
- [Copter-4.6.3 Parameters.cpp](https://raw.githubusercontent.com/ArduPilot/ardupilot/Copter-4.6.3/ArduCopter/Parameters.cpp) — 4.6 truth
