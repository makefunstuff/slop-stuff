---
title: "PID tuning"
description: "P/I/D terms, tuning methods, symptoms, and implementation."
category: "Drones & FPV"
tags: ["control", "P I D", "Ziegler", "windup"]
weight: 390
lead: "Make the loop behave."
version: "control loops"
---
A PID controller steers a process to its setpoint by combining three views of the error — present, past, and future. Tune the three gains and the loop settles fast, tracks accurately, and shrugs off disturbance.

## Quick reference {#quickref}

The whole loop on one screen: the equation, the three terms, the tuning order, and the constants you'll actually reach for.

### 1. The equation

Output = present + past + future.

```
u = Kp·e + Ki·∫e dt + Kd·de/dt
```

### 2. P — proportional

Acts on error `e = r − y` now. Raise for speed; too high → overshoot + oscillation.

### 3. I — integral

Sums past error `∫e dt`. Kills steady-state offset; too high → slow oscillation + windup.

### 4. D — derivative

Rate of change `de/dt`. Damps overshoot; too high → noise, jittery output.

### 5. Tune in order

`P` first, then `D`, then `I` — one gain at a time, watch the step after each move.

### 6. Ziegler–Nichols

Ultimate gain: `Kp = 0.6·Ku`, `Ti = Tu/2`, `Td = Tu/8`. Aggressive — back off 20–30%.

### 7. Anti-windup

Clamp `u` and stop integrating while saturated, or the integral overshoots on recovery.

### 8. Derivative on measurement

Differentiate `y`, not `e` — avoids a derivative kick on setpoint steps.

## The PID loop {#start}

A PID controller closes a feedback loop: measure, compare to the setpoint, compute a correction, apply it, repeat.

**Setpoint** (r — target) → **Error** (e = r − y) → **PID** (Kp·e + Ki·∫e + Kd·de/dt) → **Plant** (process) → **Output** (y — measured)

### 1. Setpoint

The target `r` the process should hold — a temperature, speed, level, or position.

### 2. Error

The gap the controller acts on: `e = r − y`. Zero error means the loop is on target.

### 3. Output

The control signal `u` sent to the actuator — heater power, valve position, motor PWM.

### 4. Feedback

The measured `y` loops back and is subtracted from `r` to recompute `e` every sample.

> **KEY:** **The loop closes when the measured output `y` is subtracted from the setpoint `r` to form the error `e` — the only signal the controller sees.** Each sample, the PID computes `u` from `e` and writes it to the actuator; the plant responds; the sensor reads the new `y`; the cycle repeats.

<details>
<summary>Worked example: one sample</summary>

Setpoint `r = 100`, measurement `y = 90`, gains `Kp = 2`, `Ki = 0.5`, `Kd = 1`, `dt = 0.1`, integral so far `2`, previous measurement `88`.

```
e        = 100 - 90        = 10
P term   = 2 * 10           = 20
integral = 2 + 10 * 0.1     = 3
I term   = 0.5 * 3          = 1.5
D term   = 1 * (88 - 90)/0.1 = -20
u        = 20 + 1.5 - 20    = 1.5
```

One sample, three terms: `P` pushes on the present error, `I` adds the accumulated history, `D` pulls back because the measurement is rising toward the setpoint.

</details>

## P, I, D terms {#terms}

Proportional (now), integral (past / steady-state), derivative (future / damping) — what each fixes and what it breaks.

| Term | Looks at | What it fixes | What it breaks |
| --- | --- | --- | --- |
| `P` proportional | present error `e` | speeds response, reduces error now | too high → overshoot + oscillation; leaves steady-state error |
| `I` integral | accumulated past error `∫e dt` | eliminates steady-state error | too high → slow oscillation + windup |
| `D` derivative | rate of change `de/dt` | damps, predicts, reduces overshoot | too high → amplifies noise, jittery output |

### Now, past, future

`P` answers the present, `I` remembers the past, `D` anticipates the future. Most loops get `P` first, then `D`, then `I` — in that order.

```
error   = setpoint - measurement
output  = Kp*error
output += Ki*integral_of(error)
output += Kd*derivative_of(error)
```

### Parallel vs ideal form

Parallel form uses `Ki` and `Kd` directly. Classic tables give integral time `Ti` and derivative time `Td` instead — convert with `Ki = Kp/Ti` and `Kd = Kp·Td`.

```
u = Kp·e + (Kp/Ti)·∫e dt + (Kp·Td)·de/dt
Ti = Kp/Ki      Td = Kd/Kp
```

### Raise / lower

- `Kp ↑` — faster, more overshoot.
- `Kp ↓` — slower, steadier.
- `Ki ↑` — kills offset, more windup risk.
- `Kd ↑` — more damping, more noise.

## Symptoms {#behavior}

Read the step response: the shape of the curve tells you which gain to move.

| Symptom | Likely cause | Adjust |
| --- | --- | --- |
| Overshoot on a step | `Kp` too high, or `Kd` too low | lower `Kp` or raise `Kd` |
| Sustained oscillation | `Kp` (or `Ki`) too high | lower `Kp`, then `Ki` |
| Slow / sluggish response | `Kp` too low | raise `Kp` |
| Steady-state error (offset) | `Ki` missing or too low | raise `Ki` |
| Noisy / jittery output | `Kd` too high | lower `Kd` or filter the derivative |
| Slow settle after oscillation | `Kd` too low | raise `Kd` |

> **⚠:** **Change one gain at a time** and watch the step response after each move. If you touch two knobs at once you can't tell which one helped.

<details>
<summary>What the curve looks like</summary>

Four classic step-response shapes and their diagnosis:

```
overdamped   — slow rise, no overshoot   →  raise Kp
underdamped  — fast rise, rings a bit    →  raise Kd
critically   — fast rise, no overshoot   →  just right
oscillating  — never settles             →  lower Kp, then Ki
```

</details>

## Tuning methods {#methods}

Manual, Ziegler-Nichols, Cohen-Coon, trial and error, and software autotune.

### Manual (by feel)

Raise `Kp` until the loop oscillates, then halve it. Add `Kd` to damp, then a little `Ki` to remove the remaining offset.

### Trial & error (P → D → I)

Fix one gain at a time, in order: `P` for speed, `D` for damping, `I` for accuracy. Watch the step response after each move.

### Software autotune

Relay/step injection built into motor drives, PLCs, and 3D-printer firmware (Marlin, Klipper) excites the loop and fits gains automatically.

| Method | Kp | Ti (integral time) | Td (derivative time) |
| --- | --- | --- | --- |
| Ziegler–Nichols — ultimate gain | `0.6·Ku` | `Tu / 2` | `Tu / 8` |
| Ziegler–Nichols — reaction curve | `1.2·T/(K·L)` | `2·L` | `0.5·L` |
| Cohen–Coon | `(T/(K·L))·(4/3 + L/(4T))` | `L·(32 + 6·L/T)/(13 + 8·L/T)` | `4·L/(11 + 2·L/T)` |

> **⌁:** **Reading the table:** `Ku` is the ultimate gain (the `Kp` that just sustains oscillation) and `Tu` is that oscillation's period. Reaction-curve methods use the open-loop step response: `K` = process gain, `L` = dead time, `T` = time constant. Convert times to parallel gains with `Ki = Kp/Ti` and `Kd = Kp·Td`. Ziegler–Nichols targets ~25% overshoot (quarter-amplitude decay) and is aggressive on real plants — back `Kp` off 20–30% before commissioning.

<details>
<summary>Ziegler–Nichols: finding Ku and Tu</summary>

1. **Zero I and D** — Set `Ki = 0` and `Kd = 0` so only `P` acts.
1. **Raise Kp to the edge** — Increase `Kp` until the output oscillates with a constant amplitude.
1. **Record Ku** — That edge gain is the ultimate gain `Ku`.
1. **Measure Tu** — Time one full oscillation — that period is `Tu`.
1. **Apply the table** — `Kp = 0.6·Ku`, `Ti = Tu/2`, `Td = Tu/8`. Back `Kp` off 20–30% to soften the response.

</details>

<details>
<summary>Reading the reaction curve (K, L, T)</summary>

Step the output by `Δu` with the loop open and record the response, then read three numbers:

```
K = Δy / Δu         process gain
L = dead time       before y starts moving
T = time constant   y reaches ~63% of its final change
```

Feed `K`, `L`, and `T` into the Ziegler–Nichols or Cohen–Coon row above.

</details>

## Practical tuning {#practical}

Start P only, add D, add I last. Watch the step response, limit the output, and differentiate the measurement.

1. **Zero I and D** — Set `Ki = 0` and `Kd = 0`. Start with a small, safe `Kp`.
1. **Raise P** — Increase `Kp` until the step response is reasonably fast — stop before it oscillates.
1. **Add D to damp** — Increase `Kd` to cut overshoot and settle the oscillation.
1. **Add I last** — Raise `Ki` a little to remove steady-state offset.
1. **Clamp & verify** — Clamp `u` to the actuator limits and repeat a step to confirm the response.

### Read the step response

Apply a small setpoint step and watch rise time, overshoot, and settle time. The shape tells you which gain to move — see the symptom table above.

```
rise time  →  dominated by Kp
overshoot  →  Kp too high / Kd too low
offset     →  Ki too low (or zero)
ringing    →  Kd too low, or Kp too high
```

### Derivative on measurement

Compute the derivative from the measurement `y`, not the error `e`, so a setpoint step doesn't inject a derivative spike.

```
// on measurement (preferred):
d_term = kd * (prev_measurement - measurement) / dt;
```

<details>
<summary>Cheat-map: symptom → action</summary>

- `overshoot` — lower Kp or raise Kd.
- `oscillation` — lower Kp, then Ki.
- `too slow` — raise Kp.
- `offset` — raise Ki.
- `noisy output` — lower Kd or filter the derivative.
- `slow settle` — raise Kd.

</details>

## Integral windup & filters {#windup}

Anti-windup, derivative on measurement (not error), and noise filtering keep a tuned loop honest.

### Integral windup

When the output saturates, the integral keeps accumulating and overshoots on recovery. Clamp it (or stop integrating) while saturated.

### Derivative on measurement

Differentiating the error couples the derivative to setpoint jumps. Differentiate the measurement instead — the process moves smoothly.

### Noise filtering

Differentiation amplifies sensor noise. Low-pass filter the derivative (or the measurement) before it reaches the `D` term.

### Anti-windup + filtered derivative, in one pass

```
// anti-windup: stop integrating in the direction of saturation
if (out >= out_max && error > 0.0f) integral -= error * dt;
if (out <= out_min && error < 0.0f) integral -= error * dt;

// derivative on measurement (not error): no setpoint kick
d_term = kd * (prev_measurement - measurement) / dt;

// optional: low-pass the derivative to kill noise
d_term = 0.8f * d_term + 0.2f * d_term_prev;
```

## Implementation {#code}

A discrete-time PID skeleton in C: the equation, `dt`, output clamping, and derivative on measurement.

### The state

Keep gains, the integral, the previous measurement, the sample time `dt`, and output clamps in a struct.

```
typedef struct {
  float kp, ki, kd;        // gains
  float integral;          // ∫ e dt
  float prev_measurement;  // for derivative
  float dt;                // sample time (s)
  float out_min, out_max;  // output clamps
} PID;
```

### The update

Compute `P`, `I`, `D` in discrete time, combine, clamp, and return. Call once per sample period.

```
float pid_update(PID *p, float setpoint, float measurement) {
  float error = setpoint - measurement;

  // proportional — the present
  float p_term = p->kp * error;

  // integral — the past
  p->integral += error * p->dt;
  float i_term = p->ki * p->integral;

  // derivative on measurement — the future
  float d_term = p->kd *
    (p->prev_measurement - measurement) / p->dt;
  p->prev_measurement = measurement;

  // combine and clamp the output
  float out = p_term + i_term + d_term;
  if (out > p->out_max) out = p->out_max;
  if (out < p->out_min) out = p->out_min;
  return out;
}
```

> **✓:** **dt is a gain.** Because `I` and `D` scale with sample time, use a fixed `dt` (or measure the real elapsed time each call) and re-tune if it changes. The clamp keeps the actuator inside its physical range and is a first line of defense against windup.

<details>
<summary>Discrete difference equation</summary>

The continuous form is discretized with a fixed sample time `dt`:

```
e[k]          = setpoint - measurement
integral[k]   = integral[k-1] + e[k] * dt
derivative[k] = (prev_measurement - measurement) / dt

u[k] = Kp*e[k] + Ki*integral[k] + Kd*derivative[k]
```

Initialize `prev_measurement = measurement` on the first call so the derivative term starts at zero instead of spiking.

</details>

## Pitfalls {#gotchas}

Too much D, windup, wrong sign, dt drift, deadband — and the subtler ones: stiction, nonlinear plants, and noisy measurements.

### Too much D amplifies noise

Derivative gain multiplies sensor noise and high-frequency jitter. If the output chatters, lower `Kd` or low-pass the derivative term.

### Integral windup

Once the actuator saturates, the integral keeps growing, so the loop overshoots on recovery. Clamp the integral or stop integrating while saturated.

### Wrong sign

A reversed polarity (positive instead of negative feedback) makes the loop run away. Check that increasing `u` drives `y` toward `r`, not away.

### dt inconsistency

If the sample period changes between tuning and running, `I` and `D` change too. Use a fixed `dt` or measure elapsed time every call.

### Deadband too wide

A deadband that turns the output off near zero error can produce a small limit cycle — the loop hunts around the setpoint instead of settling.

### Stiction & backlash

A valve or linkage that sticks ignores small corrections, so the loop overshoots once it finally breaks free. Add a small deadband, dither, or a positioner.

### Nonlinear plant

Gains tuned at one operating point can oscillate at another. Tune near the real setpoint, or schedule gains across the range.

### Noisy measurement

A noisy sensor pollutes `D` however low `Kd` is. Low-pass the measurement (or derivative) first, then bring `D` back.

> **⚠:** **Before tuning, prove the feedback is stable:** nudge the output by hand and confirm the measurement moves the way you expect. A wrong sign or a dead sensor makes any tuning session futile.
