---
title: "SDR"
description: "Software-defined radio: IQ, sampling, DSP, GNU Radio, and common signals."
category: "Embedded & hardware"
tags: ["RF", "IQ", "FFT", "GNU Radio"]
weight: 310
lead: "Listen to the spectrum."
version: "RF · DSP"
---
Software-defined radio turns a cheap USB dongle into a receiver for everything from FM broadcast to ADS-B and weather satellites. After the ADC, it's all just math.

## Quick reference {#quickref}

The commands and numbers you reach for most — the fast path into every section below.

### Capture IQ

```
rtl_sdr -f 100e6 -s 2.4e6 -g 20 out.bin
# 2.4 MS/s ≈ 2.4 MHz of spectrum
```

### Live FM

```
rtl_fm -f 100.1e6 -M wbfm \
  -s 200k -r 48k - | aplay -r 48k -f S16_LE
```

### IQ sample

```
I = A·cos(2π·Δf·t)
Q = A·sin(2π·Δf·t)
mag   = hypot(I, Q)    # strength
phase = atan2(Q, I)    # angle
```

### Rate ↔ bandwidth

```
fs ≈ capture bandwidth
fs > 2 × BW        # Nyquist
# FM ≈ 200 kHz → 480 kS/s+
```

### FFT spectrum

```
# scan 88–108 MHz, log power
rtl_power -f 88e6:108e6:100k \
  -g 30 -e 1m scan.csv
```

### Flowgraph

```
RTL-SDR Source → Low Pass →
  WBFM Receive → Audio Sink
# wire in GRC, run the .py
```

### Signals at a glance

```
FM       88–108 MHz   wbfm
ADS-B    1090 MHz     dump1090
NOAA APT 137 MHz      noaa-apt
AIS      162 MHz      GMSK
```

### ADS-B decode

```
rtl_sdr -f 1090e6 -s 2.4e6 -g 10 - | \
  dump1090 --interactive
```

> **REF:** **Everything here is expanded below.** Capture flags in [Tools](#tools), IQ math in [IQ](#iq), bandwidth in [Frequency](#freq), FFT in [DSP](#dsp), flowgraphs in [GNU Radio](#gnuradio), and the signal table in [Signals](#signals).

## What SDR is {#start}

A software-defined radio replaces analog mixers and filters with an ADC and DSP, so the same dongle receives anything from AM broadcast to ADS-B.

### 1. ADC + tuner

The tuner shifts an RF band down to an intermediate frequency; the ADC digitizes it. Everything after the ADC is software.

### 2. Sampling theorem

To represent a signal without aliasing, sample at more than twice its bandwidth: `fs > 2 × BW`.

### 3. Front-end chain

Antenna → LNA → tuner/mixer → ADC → sample buffer → host over USB.

### 4. Hardware

**RTL-SDR Blog V4** (RX, 500 kHz–1.766 GHz, ~2.4 MS/s), **HackRF** (RX/TX, 1 MHz–6 GHz), **SDRplay** / **Airspy** (wide dynamic range).

> **RF:** **Receive-only first.** RTL-SDR dongles are cheap, legal to own, and enough to learn sampling, IQ, and DSP. Only HackRF-class devices can transmit — and transmitting needs a license.

## IQ & complex signals {#iq}

Each sample is a complex number `I + jQ`: two real streams that carry both amplitude and phase, so the spectrum on both sides of the center frequency survives.

**RF in** (real signal) → **Mixer × 2** (cos & sin LO) → **I, Q** (two baseband streams) → **I + jQ** (complex samples) → **DSP** (filter · FFT · demod)

### I and Q

`I` multiplies the signal by the local oscillator; `Q` multiplies by the same LO shifted 90°. The phase between them preserves the sign of the frequency offset.

```
# one IQ sample = a complex pair
# I = A·cos(2π·Δf·t)
# Q = A·sin(2π·Δf·t)
sample = I + jQ
```

### Negative frequencies

A real signal is mirrored around 0 Hz; a complex (IQ) signal is not. The sign of the frequency tells you whether a carrier is above or below the tuned center.

```
+1 MHz in IQ  → carrier above center
-1 MHz in IQ  → carrier below center
```

> **j:** **Why IQ?** It's the difference between hearing a station on either side of your dial. With only real samples you can't tell `+100 kHz` from `-100 kHz`; IQ keeps them distinct so filters and demodulators work.

<details>
<summary>Complex numbers in one minute</summary>

A complex sample packs two reals into one value. Magnitude is signal strength; angle is phase. The conjugate flips the spectrum's sign.

```
magnitude = sqrt(I² + Q²)   # signal strength
phase     = atan2(Q, I)     # angle, in radians
conjugate = I - jQ          # mirrors the spectrum
```

</details>

## Frequency & bandwidth {#freq}

Frequency is where on the dial you listen; bandwidth is how wide a slice you capture. Sample rate is the number of IQ pairs per second.

<kbd>1 GHz</kbd> = <kbd>1000 MHz</kbd> = <kbd>10⁶ kHz</kbd> = <kbd>10⁹ Hz</kbd>

| Unit | Scale | Typical signal |
| --- | --- | --- |
| `Hz` | cycles per second | baseband audio, POCSAG bit rate |
| `kHz` | 10³ Hz | AM channel (~10 kHz), RTTY |
| `MHz` | 10⁶ Hz | FM broadcast (88–108), NOAA APT 137, ADS-B 1090 |
| `GHz` | 10⁹ Hz | Wi-Fi 2.4/5, GPS 1.575 |

### Sample rate vs bandwidth

Sample rate `fs` sets the capture bandwidth: an RTL-SDR at `2.4 MS/s` sees roughly `2.4 MHz` of spectrum at once.

```
rtl_sdr -f 100e6 -s 2.4e6 out.bin
```

### Nyquist limit

To avoid aliasing you must sample at `fs > 2 × BW`. A 200 kHz FM signal needs at least 400 kS/s — 480 kS/s is comfortable.

```
# FM broadcast ≈ 200 kHz wide
rtl_fm -f 100e6 -M fm -s 200k -r 48k -
```

### Decimation & gain

**Decimation** drops every Nth sample (after filtering) to lower the rate; **interpolation** inserts zeros to raise it. **Gain** boosts signal before the ADC — too much clips.

```
# capture with manual gain
rtl_sdr -f 100e6 -s 2.4e6 -g 20 out.bin
```

## DSP building blocks {#dsp}

The same handful of operations appear in every receiver, in roughly this order.

1. Converts time-domain IQ samples into frequency bins — the spectrum behind the waterfall display.
1. A finite impulse response filter that passes a band and rejects the rest: low-pass, band-pass, or channel-select.
1. Multiply samples by a Hann or Hamming window before the FFT to reduce spectral leakage from edge discontinuities.
1. Envelope detector: the magnitude of each sample, `|I + jQ|`, then a low-pass filter.
1. Quadrature detector: the phase angle between consecutive samples becomes the audio frequency deviation.
1. Low-pass filter, then drop samples to reduce the rate and lighten every later stage.

### AM envelope demod

```
# amplitude = distance from origin
amp   = hypot(I, Q)
audio = lowpass(amp)
```

### FM quadrature demod

```
# phase = angle of the IQ vector
phase = atan2(Q, I)
audio = diff(unwrap(phase))
```

## Tools {#tools}

From raw capture to full GUI receivers — these cover most workflows.

- `rtl_sdr` — Raw IQ capture to a file from RTL-SDR dongles.
- `rtl_fm` — Narrowband/wideband FM demod; pipe audio to a player.
- `rtl_power` — Spectrum scanner — sweep a band to a CSV log/heatmap.
- `rtl_433` — Decodes 433/868/915 MHz ISM sensors (weather, TPMS, remotes).
- `gqrx` — GUI receiver: waterfall, demod, audio (uses GNU Radio).
- `SDR++` — Modern cross-platform GUI receiver (RTL-SDR, Airspy, HackRF).
- `SDR#` — Windows GUI receiver for RTL-SDR and Airspy.
- `GNU Radio` — Flowgraph framework (3.10.x) — build the DSP yourself.
- `SDRAngel` — Multi-mode receiver/transmitter with deep feature set.

### Capture raw IQ

```
rtl_sdr -f 100e6 -s 2.4e6 -g 20 capture.bin
```

Record 2.4 MHz of spectrum around 100 MHz to a file.

### Live FM audio

```
rtl_fm -f 100.1e6 -M wbfm -s 200k -r 48k - | \
  aplay -r 48k -f S16_LE
```

Demodulate and play a broadcast FM station on Linux.

| Flag | Modulation | Use for |
| --- | --- | --- |
| `-M fm` | narrowband FM | 2-way radio, ham repeaters, NOAA APT |
| `-M wbfm` | wideband FM | broadcast FM radio |
| `-M am` | AM envelope | airband, AM broadcast |
| `-M raw` | no demod | pass IQ straight through |

> **⌁:** **Install:** `brew install rtl-sdr rtl-433 gnuradio` (macOS) or `sudo apt install rtl-sdr rtl-433 gqrx-sdr gnuradio` (Debian/Ubuntu). Blacklist the DVB-T kernel driver so the dongle is free for SDR use. GNU Radio **3.10.x** is the current stable line.

## Common signals {#signals}

Frequencies and decoders for the signals people actually go hunting for.

| Signal | Frequency | Modulation | Decoder |
| --- | --- | --- | --- |
| AM broadcast | 530–1700 kHz | AM, ~10 kHz channels | any AM receiver |
| FM broadcast | 88–108 MHz | WFM, 200 kHz, 19 kHz pilot | `rtl_fm -M wbfm` |
| NOAA APT | 137.1 (NOAA-19) / 137.62 (NOAA-15) / 137.9125 (NOAA-18) MHz | WFM, 34 kHz | `noaa-apt` |
| ADS-B | 1090 MHz | pulse-position, Mode-S | `dump1090` |
| POCSAG (paging) | 138 / 153 / 929 MHz | FSK | `multimon-ng` |
| ACARS | 131.550 MHz (VHF) | AFSK | `acarsdec` |
| LoRa | 433 / 868 / 915 MHz | chirp spread spectrum | LoRa hardware / SDR toolkits |

`noaa-apt` `dump1090` `multimon-ng` `acarsdec` `rtl_fm`

> **📡:** **Antenna matters.** ADS-B needs a tuned 1090 MHz antenna (ideally with ground plane); NOAA APT wants a VHF turnstile or QFH. Most "no signal" problems are antenna problems, not software problems.

<details>
<summary>More signals to try</summary>

| Signal | Frequency | Note |
| --- | --- | --- |
| AIS | 161.975 / 162.025 MHz | ship tracking, GMSK |
| RTTY / FT8 | HF amateur bands | data modes via `fldigi` / `wsjt-x` |
| SSTV | 145.800 MHz (ISS) | slow-scan TV images |
| Meteor-M2-3 / M2-4 | 137.1 / 137.9 MHz | LRPT weather imagery |

</details>

## GNU Radio flowgraphs {#gnuradio}

Connect blocks in a graph: samples flow from a source through filters and demodulators to a sink.

1. `RTL-SDR Source` or `File Source` pulls IQ samples into the graph.
1. `Low Pass Filter` or `Band Pass Filter` selects the channel and often decimates.
1. `WBFM Receive`, `AM Demod`, or `Quadrature Demod` turns IQ into audio.
1. `Audio Sink`, `File Sink`, or `QT GUI Sink` plays, saves, or visualizes.

### GRC (the GUI)

Drag blocks onto a canvas and wire them. The `.grc` file compiles to Python you can read and edit.

```
# run a generated flowgraph
python3 fm_receiver.py
```

### Python flowgraph

Everything GRC does is plain Python — the same blocks, hand-wired.

```
from gnuradio import gr, blocks, filter, analog, audio

tb = gr.top_block()
src = blocks.file_source(gr.sizeof_gr_complex, "capture.bin")
lp  = filter.fir_filter_ccf(1, filter.firdes.low_pass(1, 2.4e6, 100e3, 10e3))
dem = analog.wfm_rcv(quad_rate=2.4e6, audio_decimation=10)
sink = audio.sink(48000)

tb.connect(src, lp, dem, sink)
tb.run()
```

| Block | Role | Key params |
| --- | --- | --- |
| `RTL-SDR Source` | Pull IQ from the dongle | sample_rate, frequency, gain |
| `Low Pass Filter` | Band-limit + decimate | cutoff_freq, transition_width, decim |
| `WBFM Receive` | Wideband FM demod | quadrature_rate, audio_decimation |
| `AM Demod` | Envelope demod | channel_rate |
| `Rational Resampler` | Change sample rate | interpolation, decimation |
| `Audio Sink` | Play to speakers | sample_rate |
| `QT GUI Sink / File Sink` | Visualize / save | filename (File Sink) |

## Pitfalls {#gotchas}

Things that bite everyone on their first capture.

### DC spike at 0 Hz

Every SDR shows a strong spike at the tuned center frequency from DC offset and tuner leakage. It's not a real signal — ignore it or enable DC blocking.

```
# offset the center to move the spike
rtl_sdr -f 100.05e6 -s 2.4e6 out.bin
```

### Sample drops

"Lost samples" or USB overruns mean the host can't keep up. Lower the sample rate, enlarge buffers, or use a shorter/better USB cable.

```
rtl_sdr -f 100e6 -s 1.0e6 out.bin   # slower
rtl_sdr -f 100e6 -s 2.4e6 -b 0 out.bin  # bigger buffer
```

### Gain settings

Auto gain hides weak signals and pumps up noise; manual gain is predictable. Too low and you hear only hiss; too high and strong stations intermodulate.

```
rtl_sdr -f 100e6 -s 2.4e6 -g 20 out.bin
```

### Antenna, not software

A random indoor whip is the weakest link. Match the antenna to the band: a dipole cut for the frequency, a ground plane for ADS-B, a turnstile/QFH for APT.

```
# dipole length ≈ 143 / f(MHz) metres, per leg
# 100 MHz → ~1.43 m total
```

### Front-end overload

A nearby broadcast FM tower can saturate the LNA and appear as ghosts across the whole band. Add an FM band-stop filter, or reduce gain and move the center frequency.

```
# avoid tuning straight into the strong signal
rtl_sdr -f 1090e6 -s 2.4e6 -g 10 adsb.bin
```

### Listening vs transmitting

RTL-SDR dongles are receive-only, which is generally fine. HackRF and similar can transmit, and transmitting without a license is illegal in most jurisdictions — don't.

```
# receive-only: no license required in most places
# transmitting:  requires a license — always
```

### Clock drift (PPM)

Cheap crystal oscillators drift a few ppm, so every signal sits slightly off-frequency. The RTL-SDR V4 ships a 1 ppm TCXO, but older dongles need a correction like `-p 42`.

```
# calibrate against a known signal
rtl_fm -f 100e6 -M fm -s 200k -p 42 -
```

> **⚠:** **Stay on the receive side.** Receiving law varies by country, and decoding some services (paging, aircraft) is restricted in places. Transmitting on licensed bands without authorization is illegal almost everywhere — a HackRF is not a license.
