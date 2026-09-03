---
title: "ArduPilot"
description: "Firmware, flight modes, failsafes, tuning, and Mission Planner."
category: "Drones & FPV"
tags: ["drone", "flight modes", "failsafe", "EKF"]
weight: 360
lead: "Autopilot for anything that flies."
version: "4.6"
---
ArduPilot is open-source autopilot firmware for Copter, Plane, Rover, and Sub. Flash it, calibrate the sensors, tune the PIDs, and hand over the stick.

## Quick reference {#quickref}

The 90% cheat sheet — ground station, calibration, the modes you'll actually fly, failsafes, and the EKF.

### Ground station

`Mission Planner` (Windows) or `QGroundControl` (all platforms) — flash firmware, set parameters, and plan missions over MAVLink.

### Calibrate first

Accel (all 6 faces) → compass (every axis) → radio (full range) → GPS outdoors for a 3D fix.

### Stabilize

Self-levels, throttle is manual — your takeoff and recovery mode.

### AltHold

Holds altitude on the barometer; you steer, mid-throttle = hover.

### Loiter

Holds GPS position + altitude; stops and waits.

### RTL

Climbs to `RTL_ALT`, flies home, lands. Keep it one switch throw away.

### Auto

Flies the loaded mission waypoint by waypoint — survey, mapping, autonomous legs.

### Failsafes

Battery, radio, GCS, and EKF — set them before the first flight. `FS_BATT_*`, `FS_THR_ENABLE`, `FS_EKF_*`.

### EKF

Fuses IMU + GPS + compass + barometer into one estimate. Watch `VIBE` and `HDOP`.

### Arm / disarm

Throttle down + yaw right to arm, yaw left to disarm.

## What ArduPilot is {#start}

Open-source autopilot firmware that flies Copter, Plane, Rover, and Sub — configured from Mission Planner or QGroundControl. Current stable is 4.6 (Copter, Plane, Rover).

### 1. Firmware

ArduPilot is the software running on the flight controller. One codebase, four vehicles:

```
Copter    # multirotor
Plane     # fixed-wing
Rover     # ground
Sub       # ROV / boat
```

### 2. Autopilot

Reads the IMU, GPS, compass, and barometer, fuses them in the EKF, then drives motors and servos in a real-time control loop.

```
sensors → EKF → attitude/position
              → rate/angle PID
              → motor & servo output
```

### 3. Ground station

Mission Planner (Windows) or QGroundControl (all platforms) set parameters, plan missions, and show telemetry over MAVLink.

`Mission Planner` `QGroundControl` `MAVProxy`

### 4. Boards

Any supported flight controller — Pixhawk 6X/6C, Cube Orange, Matek, Omnibus — with a matching firmware target such as `fmuv3`.

> **KEY:** **Everything is a parameter.** Behavior is tuned through named parameters — `RTL_ALT`, `FS_THR_ENABLE`, `ATC_RAT_RLL_P` — stored on the board and edited from the GCS *Full Parameter List*.

<details>
<summary>Ground station connections</summary>

#### USB

Direct to the flight controller for setup and bench testing.

#### Telemetry radio

900 MHz (US) or 433 MHz (EU) serial link for in-flight telemetry.

#### Wi-Fi / TCP / UDP

Some boards stream MAVLink over the network to a ground station on any device.

</details>

- `arducopter` — multirotor firmware build.
- `arduplane` — fixed-wing firmware build.
- `ardurover` — ground vehicle firmware build.
- `ardusub` — underwater ROV firmware build.

## Setup & calibration {#setup}

Flash the right build, calibrate every sensor, and level the frame before the first arm.

1. **Flash firmware** — Mission Planner → *Install Firmware* (or QGC → *Firmware*), pick the vehicle type, and write the correct board target.
1. **Calibrate sensors** — Accelerometer (all 6 orientations), compass (rotate about every axis), then radio (move each stick and switch through its full range).
1. **Calibrate ESCs** — Props off: power with throttle high, then low — the ESCs learn the PWM range and spin up in sync.
1. **Level & failsafes** — Set the level reference, configure battery and radio failsafes, then assign flight modes to a transmitter switch.

### Sensor calibration

```
Accel:   set each face flat & level
Compass: rotate about every axis
Radio:   sticks + switches, full range
GPS:     outdoors, 3D fix before arm
```

### ESC calibration (props off!)

```
1. Remove all props
2. Throttle to max, power the ESCs
3. Beep → throttle to zero
4. Reboot, verify motors spin together
```

- `INS_ACCEL*` — accelerometer offsets & scaling.
- `COMPASS_OFS_*` — compass hard-iron offsets.
- `RC1_MIN / RC1_MAX` — radio channel endpoints.
- `MOT_PWM_MIN / MOT_PWM_MAX` — motor output range.

> **!:** **Props off for every bench test.** Radio, ESC, and motor tests all happen before props go on. A stray arm with props on is a flying saw.

<details>
<summary>Arm / disarm</summary>

Mode 2 defaults: hold the throttle stick down, then yaw right to arm and yaw left to disarm.

<kbd>throttle down</kbd> then <kbd>yaw right</kbd> arms

</details>

## Flight modes {#modes}

Copter ships 25 built-in modes — 10 are used day-to-day. Each hands a different amount of control back to the pilot, from full manual to a loaded mission.

| Mode | What it does | Use when |
| --- | --- | --- |
| `Stabilize` | Self-levels and holds attitude; throttle is manual. | Takeoff, recovery, first flights. |
| `AltHold` | Holds altitude (barometer); pilot steers, mid-throttle = hover. | Height-constrained manual flight. |
| `Loiter` | Holds position + altitude with GPS; stops and waits. | Hands-off hover, inspection. |
| `RTL` | Climbs to `RTL_ALT`, returns to home, descends and lands. | Come home now. |
| `Auto` | Flies the mission loaded from the GCS, waypoint by waypoint. | Survey, mapping, autonomous legs. |
| `Guided` | Follows position commands from the GCS — click “fly to” and it goes. | GCS-directed repositioning. |
| `Acro` | Rate control, no self-leveling; sticks command angular rate directly. | Flips, agility, manual flying. |
| `PosHold` | Like Loiter, but moving the sticks gives immediate manual control; recenter to hold. | Manual flying with a position safety net. |
| `Land` | Descends straight down and lands where it is — no horizontal travel. | Immediate, controlled touchdown. |
| `Brake` | Stops the vehicle dead and holds position. | Recover from a flyaway or lost orientation. |
| `Sport` | Rate control (like Acro) but holds attitude when the sticks center. | Agile flying with a leveling safety net. |
| `SmartRTL` | Retraces the exact path flown back to home (battery-backed). | Return home through complex terrain. |

- **Manual** — `Acro`, `Stabilize` — you fly, it levels.
- **Assisted** — `AltHold`, `Loiter`, `PosHold` — it holds, you steer.
- **Autonomous** — `Auto`, `RTL`, `Guided`, `SmartRTL`, `Land` — it flies itself.
> **KEY:** **Mode switch = transmitter channel.** Map a 3-position switch to a channel, then assign modes to its low / mid / high PWM ranges in *Flight Modes*. Keep `Stabilize` or `RTL` one switch throw away.

<details>
<summary>GPS-dependent vs manual modes</summary>

#### Need a GPS fix

`Loiter`, `PosHold`, `RTL`, `SmartRTL`, `Auto`, `Guided`, and `Brake` require a healthy position estimate.

#### Fly without GPS

`Stabilize`, `AltHold`, `Acro`, `Sport`, and `Land` work on the IMU and barometer alone.

</details>

## Failsafes {#failsafes}

What the vehicle does on its own when battery, radio, or link goes away.

| Failsafe | Trigger | Default action | Key params |
| --- | --- | --- | --- |
| `Battery` | Voltage sags below threshold (or mAh spent) | RTL, then land | `FS_BATT_ENABLE`, `FS_BATT_VOLTAGE` |
| `Radio` | RC signal lost / throttle PWM out of range | RTL | `FS_THR_ENABLE` |
| `GCS` | No heartbeat from ground station for N seconds | RTL | `FS_GCS_ENABLE`, `FS_GCS_TIMEOUT` |
| `Geofence` | Breach of the altitude / radius / polygon fence | RTL or Land | `FENCE_ENABLE`, `FENCE_ACTION` |
| `EKF` | Position estimate becomes unhealthy | Land | `FS_EKF_ACTION`, `FS_EKF_THRESH` |

- **RTL** — Climb to `RTL_ALT`, fly home, loiter `RTL_LOIT_TIME`, then land.
- **Land** — Descend straight down at the current position — no horizontal travel.
- **Continue** — Keep flying on last-known inputs (rarely the safe choice).
- `FS_THR_ENABLE` — radio failsafe on RC loss.
- `FS_BATT_VOLTAGE` — low-voltage threshold.
- `FS_BATT_MAH` — capacity-used threshold.
- `FS_GCS_TIMEOUT` — seconds without GCS heartbeat.
- `FENCE_ACTION` — RTL or Land on fence breach.
- `FS_EKF_THRESH` — EKF variance trigger.

> **⚠:** **Set battery and radio failsafes before the first flight.** Test them deliberately (low battery, TX off) at a safe altitude. A quad that ignores radio loss will fly away.

## EKF & sensors {#ekf}

The EKF fuses IMU, GPS, compass, and barometer into one position and attitude estimate.

**IMU** (accel + gyro) → **GPS** (position + velocity) → **EKF** (fuse & filter) → **Attitude** (roll / pitch / yaw) → **Position** (lat / lon / alt)

### Sensor health

```
GPS:       HDOP < 2, ≥ 8 sats
Compass:   offsets after MAG_CAL
Baro:      shield it from propwash
Vibration: X/Y/Z < 30 m/s²
```

### Vibration kills the EKF

Clipped IMU samples feed garbage into the estimator. Soft-mount the board, balance props and motors, and watch `VIBE` in the logs before pushing gains.

- **Healthy** — All sensors fused; position and attitude are trusted.
- **Degraded** — A sensor dropped (e.g. GPS lost); the estimate drifts over time.
- **Unhealthy** — Variance above `FS_EKF_THRESH` — the failsafe action fires.
> **EKF:** **One estimate, many inputs.** Lose GPS and the EKF degrades to dead-reckoning; lose the compass and yaw drifts. The failsafe (`FS_EKF_ACTION`) fires when variance stays above `FS_EKF_THRESH` — land, don't trust the estimate.

<details>
<summary>Compass & GPS specifics</summary>

#### Compass interference

Hard-iron offsets change when the battery, mount, or wires move. Recalibrate and confirm the HUD heading matches reality.

#### GPS quality

`HDOP` below 2 with 8+ satellites is a solid fix; RTK GPS adds centimeter accuracy.

</details>

- `EK3_ENABLE` — use the EKF3 estimator.
- `EK3_SRC1_POSXY` — horizontal position source (GPS).
- `EK3_SRC1_VELZ` — vertical velocity source.
- `EK3_SRC1_YAW` — yaw / heading source.

## Tuning {#tuning}

Rate and angle PIDs, autotune, and notch filtering that turn twitch into smooth.

### Two loops

The inner **rate** loop controls angular velocity; the outer **angle** (Stabilize) loop turns angle error into a rate target.

- `ATC_RAT_RLL_P / I / D` — roll rate PID.
- `ATC_RAT_PIT_P / I / D` — pitch rate PID.
- `ATC_ANG_RLL_P` — roll angle → rate.
- `ATC_ANG_PIT_P` — pitch angle → rate.

### Notch filter

A notch cuts the prop/frame resonance frequency before it reaches the PIDs.

- `INS_NOTCH_ENABLE` — turn it on.
- `INS_NOTCH_FREQ` — center frequency (Hz).
- `INS_NOTCH_BW` — width of the notch.
- `INS_NOTCH_ATT` — attenuation (dB).

1. **Fly on stock PIDs** — Default gains are a safe baseline — record how it feels before changing anything.
1. **Run autotune** — Assign `AUTOTUNE_ENABLE` to a switch (or set `AUTOTUNE_AXES`), fly gentle maneuvers, and let it raise the rate gains.
1. **Trim by hand** — Raise `P` until it oscillates, then back off ~30%. Add `D` to damp and `I` to hold attitude.
1. **Shape the throttle** — `MOT_THST_EXPO` softens mid-stick; `MOT_THST_HOVER` centers the curve on hover throttle.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Slow, mushy response | Rate `P` too low | Raise `ATC_RAT_*_P`. |
| Fast oscillation | Rate `P` too high | Lower `P` or add `D`. |
| Hovers, then wanders | `I` too low | Raise `ATC_RAT_*_I`. |
| Propwash wobble on descent | Gain too high / no notch | Lower `P`, enable the notch. |

- `MOT_THST_EXPO` — throttle curve exponent.
- `MOT_THST_HOVER` — hover throttle (0–1).
- `MOT_SPIN_MIN / MOT_SPIN_ARM` — idle / armed spin speed.
- `ATC_THR_MIX_MAN` — manual throttle authority.

> **⚠:** **Autotune is not magic.** It tunes rate PIDs only, needs calm air and open space, and can over-gain a flexy frame. Always be ready to flip back to `Stabilize`.

## Missions & navigation {#mission}

Waypoints, RTL, geofence, and terrain following over MAVLink.

### Waypoints

A mission is an ordered list of items — each a command with a position (lat / lon / alt) in a frame.

- `MAV_CMD_NAV_WAYPOINT` — 16 · fly to point.
- `MAV_CMD_NAV_TAKEOFF` — 22 · climb to alt.
- `MAV_CMD_NAV_LAND` — 21 · land here.
- `MAV_CMD_NAV_RETURN_TO_LAUNCH` — 20 · RTL.

### Geofence

A virtual box or cylinder the vehicle may not leave.

- `FENCE_ENABLE` — turn the fence on.
- `FENCE_TYPE` — alt / circle / polygon.
- `FENCE_ALT_MAX` — max altitude.
- `FENCE_ACTION` — RTL or Land on breach.

### Terrain following

With `TERRAIN_FOLLOW` enabled, waypoint altitudes become above-ground-level using SRTM terrain data uploaded from the GCS.

`TERRAIN_FOLLOW` `TERRAIN_ENABLE` `SRTM`

- `RTL_ALT` — min climb before returning.
- `RTL_LOIT_TIME` — loiter over home before landing.
- `RTL_SPEED` — return cruise speed.
- `WPNAV_SPEED` — waypoint cruise speed.
- `WPNAV_RADIUS` — turn / acceptance radius.
- `TERRAIN_FOLLOW` — altitudes become AGL.

1. **Arm & takeoff** — `MAV_CMD_NAV_TAKEOFF` to a safe altitude, or arm and switch to `Auto`.
1. **Fly the legs** — Waypoints in sequence; `WPNAV_SPEED` sets cruise and `WPNAV_RADIUS` the turn radius.
1. **RTL or land** — End with `MAV_CMD_NAV_LAND`, or trigger `RTL` to come home and auto-land.
> **MAV:** **MAVLink is the wire.** The GCS talks to the vehicle over MAVLink (`HEARTBEAT`, `GLOBAL_POSITION_INT`, `COMMAND_LONG`, `PARAM_SET`) on a serial, UDP, or telemetry-radio link.

## Pitfalls {#gotchas}

The mistakes that ground most builds — and how to avoid them.

### GPS interference

Mount the GPS high and away from ESCs, power wires, VTX, and carbon fiber. Wait for a 3D fix and `HDOP < 2` before arming — never arm indoors.

### Vibration

A hard-mounted IMU saturates on resonance. Soft-mount the flight controller, balance props, and check `VIBE` in the logs before pushing gains.

### Compass calibration

Recalibrate after moving anything magnetic — battery, mount, wires. Keep the compass away from power lines and verify the HUD heading matches the real vehicle.

### Props off

Bench tests, radio calibration, ESC calibration, and the first motor-spin all happen with props removed. Throttle checks are the classic way to lose a finger.

### RTL_ALT below obstacles

RTL climbs to `RTL_ALT` then flies a straight line home — if a tree or ridge is taller, it flies straight into it. Set `RTL_ALT` above everything on the route and confirm before trusting RTL.

### Never test the failsafes

A failsafe you've never triggered is a failsafe you don't have. Deliberately test low battery and radio loss at a safe altitude before you need them.

> **⚠:** **Battery failsafe first.** Set `FS_BATT_ENABLE`, `FS_BATT_VOLTAGE`, and `FS_BATT_MAH` before flying. Too high and a sagging pack triggers RTL mid-flight; too low and you brown out the ESCs.

<details>
<summary>Common pre-arm failures</summary>

#### “Compass not calibrated”

Run compass calibration and check the offsets aren't huge.

#### “GPS: no fix”

Move outside, wait for a 3D fix, and confirm the GPS isn't blocked.

#### “Battery failsafe triggered”

Charge the pack or lower `FS_BATT_VOLTAGE`; verify real pack voltage.

#### “PreArm: throttle not at minimum”

Lower the throttle stick and recalibrate the radio.

</details>
