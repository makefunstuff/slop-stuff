---
title: "Radio amateur"
description: "Bands by ITU region, propagation, antennas, SWR/Γ, feedline, modes, safety, and RF kill-list."
category: "Embedded & hardware"
tags: ["RF", "IARU", "antenna", "SWR", "propagation"]
weight: 300
lead: "The airwaves and the math — region-tagged."
version: "RF · IARU-aware"
---
Amateur radio is licensed RF: build, experiment, communicate. **National rules win.** Band edges below are orientation from ITU RR + IARU plans — **not** your privileges. Deep SDR → sibling [`sdr/`](../sdr/).

## Quick reference {#quickref}

```
λ(m) = 300 / f(MHz)
Free-space λ/2: 150/f m · 492/f ft
Practical dipole: 143/f m ≈ 468/f ft   # ~0.95×; start long, prune
λ/4 vertical:   71.5/f m ≈ 234/f ft   # needs radials

|Γ| = (S−1)/(S+1)
RL  = −20·log10(|Γ|)
refl% = |Γ|² × 100

dBi ≈ dBd + 2.15
EIRP ≈ ERP + 2.15 dB
```

| SWR | refl% | RL | Vibe |
| --- | --- | --- | --- |
| 1.5 | 4% | ~14 dB | **fine** |
| 2.0 | ~11% | ~9.5 | good enough |
| 3.0 | 25% | ~6 | fix / tuner |
| 10 | ~67% | ~1.7 | **stop** |

## Bands (orientation, not privileges) {#bands}

Tag **ITU R1 / R2 / R3**. Frame: ITU RR Art.5 + IARU regional plans + **your national license**.

| Band | Core | Region edges (approx) | Typical use |
| --- | --- | --- | --- |
| 80 m | 3.5↑ | R1→3.8; R2→4.0; R3→3.9 | night regional; NVIS |
| 40 m | 7.0↑ | R1→7.2; R2→7.3 | night DX; day NVIS |
| 20 m | 14.0–14.35 | widely harmonized | daytime DX |
| 10 m | 28–29.7 | FM near top (national) | solar-max DX + local FM |
| 6 m | 50–54 | R1 often 50–52; R2 50–54 | Es “magic band” |
| 2 m | 144↑ | R1 144–146; R2 144–148 | LOS, repeaters, weak-signal |
| 70 cm | 430-class | R1 430–440; R2 420–450 | repeaters, DV, satellites |
| 60 / 4 / 1.25 m | — | **highly national** — verify locally | don’t invent global rights |

> **KEY:** US Tech/General/Extra edges and ID rules are **not** world law. Check your regulator + IARU region plan.

## Propagation {#prop}

| Mode | One-liner |
| --- | --- |
| Groundwave | hugs earth; dies with frequency / terrain |
| Skywave | ionosphere bounce; HF DX |
| **MUF** | above it → into space |
| **LUF** | below it → D-layer absorption |
| **NVIS** | high-angle 40/80/60; low antenna; regional |
| LOS | VHF/UHF optical horizon (+ radio horizon) |
| Knife-edge | diffraction over ridges |
| Troposcatter | weak beyond-LOS VHF/UHF |
| Sporadic-E | short-skip bursts; 6 m / 10 m |
| Cross-pol | ~20 dB hit if mismatched |

VHF is **not** always LOS-only — tropo, Es, EME exist. Still plan LOS for FM repeaters.

## Antennas {#antennas}

```
λ(m) = 300 / f(MHz)
# practical wire dipole (~0.95 velocity): start long, prune for SWR/resonance
L_dipole_m  ≈ 143 / f
L_dipole_ft ≈ 468 / f
L_λ/4_m     ≈ 71.5 / f
L_λ/4_ft    ≈ 234 / f
```

| Idea | Rule |
| --- | --- |
| Dipole free-space | ~73 Ω; ≈ **2.15 dBi** = **0 dBd** |
| Gain | don’t mix **dBi** and **dBd** |
| Power | **EIRP** vs **ERP** differ by ~2.15 dB |
| Vertical | needs radials / counterpoise |
| Pattern | height and ground change everything |

## SWR / Γ / RL {#swr}

Low SWR ≠ great antenna (a dummy load is 1:1). Lossy coax **hides** a bad antenna (looks matched at the shack).

| Myth | Reality |
| --- | --- |
| SWR 1.5 is “bad” | Usually fine |
| High SWR always kills finals | Modern solid-state folds back; still fix the match / use a tuner carefully |
| ATU = resonant/efficient antenna | ATU matches the **radio**; antenna+feedline efficiency is separate |

## Feedline / matching {#feed}

| Line | Order-of-mag loss | Notes |
| --- | --- | --- |
| RG-58 | ~6 dB/100′ @146 · ~11 @440 | short runs only at UHF |
| LMR-400-class | ~1.5 @146 · ~2.7 @440 | better for VHF/UHF |
| Ladder / window | low loss even at high line SWR | needs balun / balanced ATU |

**1:1 current balun** at a coax-fed dipole is the usual default — not “optional forever.” Tuner in the shack ≠ magic wire at full legal power on every band.

## Modes {#modes}

| Mode | When |
| --- | --- |
| CW | weak-signal / narrow |
| SSB | HF voice DX |
| FM | VHF/UHF local / repeaters |
| AM | vintage / niche |
| FT8 | DX QRP efficiency — **high duty → derate PA** |
| JS8 | keyboard chat |
| RTTY | contests |
| SSTV | pictures |
| WSPR | beacon / propagation science |

## SDR bridge {#sdr}

IQ baseband · Nyquist · for complex IQ, `fs ≈ RF bandwidth` · transmitting still needs a **license** and a clean chain. Full story → [`sdr/`](../sdr/).

## Safety {#safety}

| Topic | One-liner |
| --- | --- |
| Exposure | scales with power × gain × duty × distance — see OET-65 *concepts*, not a global rulebook |
| Tune | dummy load when possible |
| DC | fuse at the battery |
| Storms | disconnect antennas |
| RF burns / common-mode | choke / bond / don’t grab the radiator |

## AI-slop kill-list {#gotchas}

1. Mixing `468/f` **ft** with `150/f` **m** constants
2. SWR 1.5 as “bad”
3. “High SWR always kills finals”
4. More power fixes a bad antenna / path
5. Tuner = resonant/efficient antenna
6. Low SWR = great antenna
7. US band edges / license classes / ID interval as world law
8. ERP = EIRP · dBi = dBd
9. “VHF is always LOS-only”
10. Invented global privileges on 60 / 4 / 1.25 m
11. 100% duty digital at full rated PA
12. Eating the whole [`sdr/`](../sdr/) page here
13. “ATU = any wire, any band, full power, safe”
14. Balun optional forever on coax dipole

## Refs {#refs}

- [IARU](https://www.iaru.org/) · [R1 band plans](https://www.iaru-r1.org/spectrum/band-plans/) · [R2 band plans](https://www.iaru-r2.org/en/reference/band-plans/) · R3 band-plan PDF via IARU R3
- ITU Radio Regulations Art.5 (allocations)
- [FCC OET Bulletin 65](https://www.fcc.gov/general/oet-bulletins-line) + Suppl. B · [ARRL RF exposure calculator](http://arrl.org/rf-exposure-calculator)
- [antenna-theory.com — VSWR](https://www.antenna-theory.com/definitions/vswr.php)
