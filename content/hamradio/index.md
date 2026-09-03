---
title: "Radio amateur"
description: "Bands, propagation, antennas, and the math, physics, and embedded side of RF."
category: "Embedded & hardware"
tags: ["RF", "bands", "antenna", "SWR"]
weight: 300
lead: "The airwaves and the math."
version: "RF · embedded"
---
Amateur radio is the licensed hobby of building and using radios: from world-wide HF voice to local VHF repeaters, digital modes, and home-built SDR receivers. This page is the field manual — the bands, the antennas, and the physics that tie them together.

## Quick reference {#quickref}

The numbers you reach for first: wavelength, decibels, match, bands, and the antennas and modes that carry a contact.

<kbd>λ(m)</kbd> = <kbd>300 / f(MHz)</kbd>
<kbd>1 W</kbd> = <kbd>+30 dBm</kbd>
<kbd>dipole(ft)</kbd> = <kbd>468 / f(MHz)</kbd>

### 1. Wavelength

`λ = c / f`. In metres: `λ = 300 / f(MHz)`. `14.2 MHz → ~21.1 m`.

### 2. Decibels

`dB = 10·log10(P1/P0)`; `dBm` references 1 mW. `+3 dB ≈ ×2`, `+10 dB ≈ ×10`.

### 3. SWR

`SWR = (1 + |Γ|) / (1 - |Γ|)`. `1.5:1 ≈ 4%` reflected, `3:1 ≈ 25%` — fix it before transmitting.

### 4. Bands

**HF** 1.8–30 MHz (DX via skywave) · **VHF** 30–300 MHz · **UHF** 300 MHz–3 GHz (local).

### 5. Dipole

Half-wave, center-fed, ~73 Ω. `L = 468 / f(MHz)` feet, or `143 / f(MHz)` metres.

### 6. Vertical

Quarter-wave over a ground plane, ~36 Ω, low take-off. `L = 234 / f(MHz)` feet.

### 7. Yagi

Reflector + driven + directors → gain and directivity. 3 elements ≈ 7 dBi; a long boom 12–15 dBi.

### 8. FT8

8-FSK, 15 s cycles, ~50 Hz, weak-signal DX. Run WSJT-X on `14.074` (20 m) and the band-edge data frequencies.

## What ham radio is {#start}

Amateur radio is the licensed art of building and using radios to talk across town or around the world — with rules, bands, and a lot of physics.

### 1. Bands

**HF** (1.8–30 MHz) reaches worldwide via skywave. **VHF** (30–300 MHz) is line-of-sight and repeater country. **UHF** (300 MHz–3 GHz) is short range and local.

### 2. Licensing

You need a license and a **callsign** to transmit. US classes: **Technician** (VHF/UHF entry), **General** (most HF), **Extra** (all privileges). Most countries use similar tiers.

### 3. Modes

**SSB** (voice, HF), **FM** (voice, VHF/UHF repeaters), **CW** (Morse), and digital — **FT8**, **RTTY**, **PSK31**. Bandwidth and etiquette differ per mode.

### 4. Calling CQ

`CQ CQ CQ, this is <callsign>, <callsign>, listening.` Reply once with your call, then swap signal report, name, and QTH.

> **KEY:** **A QSO is a contact.** Listen first, identify with your callsign, and stay inside your license's bands, modes, and power limits. Identify every 10 minutes and at the end of the contact.

- `QSL` — I confirm / please confirm; also a confirmation card.
- `QTH` — My location is…
- `QRM` — Man-made interference from other stations.
- `QRN` — Natural/atmospheric noise (static, lightning).
- `QRP` — Reduce power / low-power operation (≤ 5 W).
- `QSO` — A contact, a conversation.
- `QRZ` — Who is calling me?
- `QSY` — Change frequency to…
- `QSB` — Your signal is fading.

## The math {#math}

Four numbers govern everything in RF: wavelength, power, impedance, and the ratio between them.

| Formula | Meaning | Worked example |
| --- | --- | --- |
| `λ = c / f` | Wavelength = speed of light ÷ frequency (c ≈ 3·10⁸ m/s). | `300 / 14.2 MHz ≈ 21.1 m` |
| `dB = 10·log10(P1/P0)` | Power ratio in decibels. | `+3 dB ≈ ×2, −3 dB ≈ ÷2` |
| `dBm = 10·log10(P / 1 mW)` | Absolute power referenced to 1 mW. | `1 W = +30 dBm` |
| `V = I · R` | Ohm's law, RF form. | `100 W into 50 Ω → 70.7 V` |
| `P = V² / R = I² · R` | Power from voltage or current. | `70.7 V / 50 Ω → 100 W` |
| `Z = R + jX` | Impedance = resistance + reactance. | `resonance: X ≈ 0, Z ≈ R` |
| `SWR = (1 + \|Γ\|) / (1 - \|Γ\|)` | Standing wave ratio from reflection. | `1.0 = perfect, 3.0 = poor` |
| `\|Γ\| = \|(Z - Z0) / (Z + Z0)\|` | Reflection coefficient vs the 50 Ω line. | `Z = 50 Ω → Γ = 0` |

<kbd>1 W</kbd> = <kbd>1000 mW</kbd> = <kbd>+30 dBm</kbd>
<kbd>100 W</kbd> = <kbd>+50 dBm</kbd>

### The dB ladder

Every 10 dB is a factor of 10 in power; 3 dB is a factor of 2. Memorize these four.

```
+3 dB   ≈ ×2 power
+6 dB   ≈ ×4 power
+10 dB  ≈ ×10 power
-3 dB   ≈ ÷2 power
-10 dB  ≈ ÷10 power
```

### SWR → reflected power

High SWR means power bounces back to the rig instead of radiating. The jump from 2:1 to 3:1 is costly.

```
SWR 1.0 → 0% reflected
SWR 1.5 → ~4% reflected
SWR 2.0 → ~11% reflected
SWR 3.0 → ~25% reflected
```

## The physics {#physics}

A radio wave is an electromagnetic field travelling at the speed of light; how far it goes depends on frequency and the ionosphere.

### Electromagnetic waves

A radio wave is an EM field: electric (**E**) and magnetic (**H**) at right angles, travelling at `c ≈ 3·10⁸ m/s`. Frequency and wavelength lock together through `λ = c / f`.

```
14.2 MHz  → 21.1 m   (20 m band)
146 MHz   →  2.05 m  (2 m band)
440 MHz   →  0.68 m  (70 cm band)
```

### Polarization

A vertical antenna radiates a vertical E-field; a horizontal dipole radiates horizontally. Cross-polarized antennas lose ~20 dB. Circular (left/right-hand) polarization is used for satellites to beat Faraday rotation.

```
vertical   → vertical E-field
horizontal → horizontal E-field
circular   → LHCP / RHCP (satellites)
```

| Mode | Path | Bands | Range |
| --- | --- | --- | --- |
| **Ground wave** | follows the earth's surface | MF and low HF (below ~3 MHz) | local, tens of km |
| **Sky wave** | refracted off the ionosphere | HF 3–30 MHz | thousands of km (DX) |
| **Line of sight** | direct wave, no reflection | VHF / UHF and up | to the radio horizon |
| **Skip** | sky wave returning far from TX | HF | beyond ground wave; silent "skip zone" between |

| Layer | Height | Effect |
| --- | --- | --- |
| **D** | 50–90 km | absorbs MF/low HF by day; vanishes at night. |
| **E** | 90–120 km | sporadic-E can carry 6 m and 2 m DX. |
| **F1** | 150–220 km | daytime only; merges into F2 at night. |
| **F2** | 250–400 km | the main HF reflector; sets the MUF. |

> **⌁:** **Skip zone & MUF.** The skip zone is the silent ring between where the ground wave dies and the first sky-wave hop lands. The **MUF** (maximum usable frequency) is the highest frequency the F layer will reflect — operate below it, or the signal punches through into space.

## Antennas {#antennas}

The antenna turns RF current into a radiated field (and back). Shape, size, and height decide where the signal goes.

### Half-wave dipole

Center-fed and balanced, ~**73 Ω** in free space, with a broadside figure-8 pattern. The classic first antenna — cut it for your band.

```
L = 143 / f(MHz)   metres, total
L = 468 / f(MHz)   feet, total
# 14.2 MHz → ~10.1 m / ~33 ft
```

### Quarter-wave vertical

A quarter-wave radiator over a ground plane, ~**36 Ω**, omnidirectional with a low take-off angle — the workhorse for DX and mobile.

```
L = 71.5 / f(MHz)  metres
L = 234 / f(MHz)   feet
# needs radials / ground plane
```

### Yagi-Uda

A driven element plus a reflector and directors focus energy into one direction. **Gain** climbs with element count: a 3-element Yagi gives ~7–8 dBi, a long boom 12–15 dBi. Point it where the station is.

```
reflector ← driven → directors
gain ≈ 7 dBi (3 el) … 15 dBi (long)
```

### Feedline

**50 Ω coax** (RG-58, RG-213, LMR-400) is standard; loss climbs with frequency, so keep 2 m/70 cm runs short and low-loss. **450 Ω ladder line** is lower-loss but balanced — feed a dipole through a **balun**.

```
short run   → RG-58 (lossy, cheap)
long / VHF  → LMR-400 (low loss)
balanced    → ladder line + balun
```

> **Z:** **Matching ≠ radiating.** A tuner (ATU) matches whatever impedance your antenna actually presents back to 50 Ω so the radio sees a low SWR and the finals stay cool. Low SWR means power gets out; it does *not* mean the antenna radiates well — a dummy load has SWR 1.0 and radiates almost nothing.

<details>
<summary>Dipole lengths per band</summary>

Total length `143 / f(MHz)` metres — trim to resonance, then check SWR.

| Band | Frequency | Total length | Feet |
| --- | --- | --- | --- |
| 40 m | 7.10 MHz | ~20.1 m | ~66 ft |
| 20 m | 14.2 MHz | ~10.1 m | ~33 ft |
| 15 m | 21.2 MHz | ~6.7 m | ~22 ft |
| 10 m | 28.4 MHz | ~5.0 m | ~16.5 ft |
| 6 m | 50.1 MHz | ~2.9 m | ~9.3 ft |
| 2 m | 146 MHz | ~0.98 m | ~3.2 ft |

</details>

## Bands & modes {#bands}

Amateur bands are allocated slices of spectrum; each has its own frequency, propagation, and customary modes.

<kbd>160 m</kbd> ≈ <kbd>1.8 MHz</kbd>
<kbd>20 m</kbd> ≈ <kbd>14 MHz</kbd>
<kbd>6 m</kbd> ≈ <kbd>50 MHz</kbd>
<kbd>2 m</kbd> ≈ <kbd>146 MHz</kbd>

| Band | Frequency | Propagation | Typical use |
| --- | --- | --- | --- |
| 160 m | 1.8–2.0 MHz | ground wave + night sky wave | regional, "top band" |
| 80 m | 3.5–4.0 MHz | night, regional | ragchews, nets |
| 60 m | 5.3515–5.3665 MHz | regional, NVIS | secondary, 15 kHz channels |
| 40 m | 7.0–7.3 MHz | night, long haul | DX, evening workhorse |
| 30 m | 10.1–10.15 MHz | all-day (WARC) | CW / digital only |
| 20 m | 14.0–14.35 MHz | daytime DX | the DX workhorse |
| 17 m | 18.068–18.168 MHz | daytime (WARC) | DX, no contests |
| 15 m | 21.0–21.45 MHz | daytime, sunspot-driven | DX openings |
| 12 m | 24.89–24.99 MHz | daytime (WARC) | DX, no contests |
| 10 m | 28.0–29.7 MHz | sunspot peak | DX + local FM repeaters |
| 6 m | 50–54 MHz | sporadic-E | the "magic band" |
| 2 m | 144–148 MHz | line of sight | FM repeaters, SSB weak signal |
| 70 cm | 420–450 MHz | line of sight | repeaters, DMR / Fusion |

| Mode | Keying | Bandwidth | Note |
| --- | --- | --- | --- |
| **FT8** | 8-FSK, 15 s cycles | ~50 Hz | weak-signal DX; run with WSJT-X |
| **FT4** | 4-GFSK, 7.5 s cycles | ~90 Hz | FT8's faster sibling; contesting, DXpeditions |
| **RTTY** | 2-FSK, 45.45 baud | ~270 Hz | contest and data classic |
| **PSK31** | BPSK/QPSK, 31.25 baud | ~60 Hz | narrow keyboard chat |
| **WSPR** | FSK beacon | ~6 Hz | propagation probes |
| **JS8Call** | FT8-derived | ~50 Hz | keyboard chat via FT8 |

`FT8` `FT4` `RTTY` `PSK31` `WSPR` `WSJT-X` `fldigi`

> **▦:** **Band plan first.** Each band is split by mode (CW, data, SSB, FM) and by region. Check your national band plan before transmitting — 30 m is CW/digital only worldwide, and repeater sub-bands differ by country. Beyond this table there are also **2200 m** (135.7 kHz), **630 m** (472 kHz), **1.25 m** (222 MHz), and **23 cm** (1240 MHz) allocations. Solar Cycle 25 peaked around 2024–2025, so 10–6 m openings are frequent now.

## Embedded & SDR {#embedded}

Modern ham gear is software-defined: a mixer and an ADC followed by DSP. Cheap SDR dongles make the whole RF chain hackable.

**Antenna** (RF in) → **Mixer** (RF × LO) → **IF filter** (band-select) → **Demod** (SSB · FM · CW) → **Audio / DSP** (speaker · decode)

1. Captures the EM field; match it to the band for real signal.
1. A low-noise amplifier sets the noise figure — the first stage dominates.
1. Multiply RF by a local oscillator (LO) to shift the band to IF or baseband.
1. Band-select and anti-alias before the ADC; reject images and out-of-band junk.
1. Sample the band (SDR) or detect it (analog receiver).
1. Demodulate FT8 / SSB / FM and decode in software.

### RTL-SDR dongle

A ~$25 USB stick is a full receiver: **24 MHz–1.7 GHz**, ~2.4 MS/s, receive-only. Pair it with GQRX, SDR#, or GNU Radio and the whole spectrum is yours to explore.

```
rtl_sdr -f 146e6 -s 2.4e6 capture.bin
rtl_fm -f 146.52e6 -M fm -s 200k -r 48k - | \
  aplay -r 48k -f S16_LE
```

### Building blocks

An **Si5351** clock generator or **AD9850** DDS makes a tunable LO; add a diode-ring mixer, some filters, and an audio amp and you have a working receiver or QRP transceiver.

```
LO = Si5351 / AD9850 (DDS)
mixer = diode ring (SBL-1)
filter = LC band-pass / crystal
audio = op-amp → speaker / sound card
```

- `rtl_sdr` — Raw IQ capture from an RTL-SDR dongle.
- `rtl_fm` — Narrowband/WFM demod to audio.
- `gqrx` — GUI receiver: waterfall, demod, audio.
- `GNU Radio` — Flowgraph DSP framework.
- `WSJT-X` — FT8 / FT4 / WSPR / JT65 modes.
- `fldigi` — RTTY, PSK31, and other sound-card modes.

> **SDR:** **Go deeper.** The full SDR story — IQ, sampling, FFT, and GNU Radio blocks — lives on the [SDR guide](sdr/). This page is the radio-side complement: bands, antennas, and the signals you'll tune to.

## Station setup {#setup}

A working station is transceiver → tuner → feedline → antenna, all bonded to a single ground — in that order.

### Transceiver

One box does TX and RX: ~100 W typical on HF, 5 W handhelds on VHF/UHF. Controls to know: **power**, mic gain, VFO, band, mode, and **PTT**. The finals run hot into a mismatch — mind the SWR.

```
HF   → 100 W, SSB / CW / data
VHF  → 50 W mobile, 5 W handheld
UHF  → 5 W handheld, FM / DMR
```

### Antenna tuner (ATU)

An impedance matcher between radio and feedline. It presents 50 Ω to the rig so the finals stay cool. It matches what's there — it doesn't improve the antenna itself.

```
rig ── ATU ── feedline ── antenna
       50 Ω  (any Z)    (any Z)
```

### Feedline

RG-58 is fine for short runs; RG-213 / LMR-400 for longer runs or higher bands. Loss climbs with frequency, so 2 m/70 cm runs should be short and low-loss. Weather-seal all outdoor connectors.

```
RG-58      → cheap, lossy, short runs
LMR-400    → low loss, VHF/UHF
ladder line→ very low loss, balanced
```

### Grounding

One **single-point** RF/safety ground: rig, tuner, and antenna feedline all bond to one earth rod. Add a lightning arrestor where the feedline enters the building, and disconnect antennas in storms.

```
rig ── tuner ── arrestor ── earth rod
      (all bonded at one point)
```

1. Single-point earth and bond all gear before applying power.
1. Position it, connect power supply, key, mic, and PTT.
1. Insert between rig and feedline when the antenna is off-resonance.
1. Shortest low-loss run; seal connectors against weather.
1. High, in the clear, away from power lines and metal.
1. Key up at low power, check SWR on each band before full power.
> **⚠:** **Safety.** Never touch an antenna or feedline while transmitting — RF burns are real. Disconnect antennas during lightning, and keep them far from power lines: contact can be fatal, not just damaging.

## Pitfalls {#gotchas}

The mistakes that cook finals, shock fingers, and make signals vanish.

### High SWR

Above ~3:1, power reflects back to the rig; finals overheat and fold back. Fix the antenna, add a tuner, or check connectors — don't just crank the power.

```
SWR > 3:1  → investigate
SWR < 1.5:1 → good to go
```

### Ground loops

Two ground paths at different potentials put hum and RF in the shack. Bond everything to **one** point and one earth rod — no daisy chains.

```
rig + tuner + arrestor → ONE earth rod
```

### RF burns

Live RF heats tissue at the contact point. Never transmit with the antenna disconnected, and never touch a radiating element while keying.

```
# always have a matched load attached
# before you key the transmitter
```

### Licensing & legal

Transmitting without a license is illegal. Stay inside your class's bands, modes, and power; identify with your callsign every 10 minutes and at the end.

```
# receiving: usually fine
# transmitting: requires a license — always
```

### Antenna placement

Near power lines = fatal; near metal = detuning and a skewed pattern. Height and clear space beat more power almost every time.

```
higher + in the clear > more watts
```

### No antenna, no TX

Keying up into an open or shorted output can destroy finals. Confirm a matched load is attached before every transmission.

```
# open / shorted output → dead finals
```

### RF in the shack

Common-mode current on the coax shield puts RF on the rig, mic, and key — the "RF bite". Choke it with a **balun** or ferrite at the feedpoint.

```
feedpoint → 1:1 current balun / ferrite choke
```

### Digital duty cycle

FT8, FT4, and RTTY transmit near **100% duty cycle**. Back off to ~50% of rated power so the finals don't overheat on long sessions.

```
100 W rig → run data modes at ~50 W
```

> **⚠:** **Know the law.** Amateur licensing is personal and non-commercial. Rules vary by country; your national regulator and the exam material are authoritative — not forum posts. When in doubt, don't transmit.
