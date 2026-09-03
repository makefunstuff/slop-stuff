---
title: "DIY hardware list"
description: "Modules, ICs, microcontrollers, and sensors — typical and unusual — for DIY builds."
category: "Electronics"
tags: ["parts", "sensors", "modules", "MCUs"]
weight: 320
lead: "The parts bin for every project."
version: "DIY parts"
---
From the MCU at the heart of it to the sensor that reads the room: the modules, ICs, and boards that show up in every DIY electronics build — with the specs you need to pick one without reading a datasheet.

## Quick reference {#quickref}

The ten parts that cover most builds — grab these first, then dig into the full tables below when you need the long tail.

- `ESP32` — Wi-Fi + BLE MCU · 3.3 V · 4 MB flash · 30+ GPIO
- `Arduino Uno` — 5 V beginner board · ATmega328P · shield ecosystem
- `Pi Pico (RP2040)` — dual Cortex-M0+ · 3.3 V · PIO state machines
- `STM32 Blue Pill` — Cortex-M3 · 72 MHz · RTOS / PWM-heavy
- `DS18B20` — 1-Wire digital temp · ±0.5 °C · waterproof probe
- `BME280` — I2C temp + humidity + pressure · 0x76/0x77
- `MPU6050` — I2C 6-axis IMU (accel + gyro) · 0x68
- `DRV8825` — stepper driver · 1/32 microstep · 2.2 A
- `SSD1306` — 128×64 OLED · I2C 0x3C · only 4 wires
- `LM2596 + TP4056` — 3 A buck step-down · 1 A Li-ion charger

## Microcontrollers & boards {#start}

Pick the brain first. The “big four” cover 90% of projects; the table fills in the long tail.

### 1. ESP32

```
Wi-Fi + BLE on-chip
3.3 V · dual 240 MHz
4 MB flash · 30+ GPIO
```

### 2. Arduino Uno

```
Beginner standard
5 V · ATmega328P
32 KB flash · 14 GPIO
```

### 3. Pi Pico

```
RP2040 · 133 MHz
3.3 V · dual Cortex-M0+
2 MB flash · 26 GPIO
```

### 4. STM32

```
Performance / RTOS
3.3 V · Cortex-M3/M4
64–1024 KB flash
```

| Board | Best for | Key specs |
| --- | --- | --- |
| `Arduino Uno R3` | Beginner prototyping, 5 V shields | ATmega328P · 5 V · 32 KB flash · 2 KB RAM · 14 digital / 6 analog pins |
| `Arduino Uno R4` | Current official Uno, faster + more RAM | Renesas RA4M1 Cortex-M4 · 48 MHz · 5 V · 256 KB flash · 32 KB RAM · (WiFi adds ESP32-S3) |
| `Arduino Nano` | Breadboard builds, small enclosures | ATmega328P · 5 V · 32 KB flash · mini-USB · same pins as Uno, smaller |
| `Arduino Mega 2560` | Many pins, RAM-hungry sketches | ATmega2560 · 5 V · 256 KB flash · 8 KB RAM · 54 digital / 16 analog pins |
| `ESP32` | Wi-Fi + Bluetooth, most projects | dual Xtensa LX6 · 240 MHz · 3.3 V · 4 MB flash · 520 KB RAM · 30+ GPIO |
| `ESP32-S3` | Modern ESP32: USB + more GPIO + AI | dual Xtensa LX7 · 240 MHz · 3.3 V · BLE 5 · USB-OTG · AI vector extensions |
| `ESP8266` | Cheap Wi-Fi only | Tensilica L106 · 80/160 MHz · 3.3 V · 4 MB flash · ~80 KB RAM · 11 GPIO |
| `STM32 (Blue Pill)` | Performance, RTOS, PWM-heavy | Cortex-M3 · 72 MHz · 3.3 V · 64/128 KB flash · 20 KB RAM · 37 GPIO |
| `STM32 Black Pill (F411)` | More flash/RAM, FPU, native USB | Cortex-M4F · 100 MHz · 3.3 V · 512 KB flash · 128 KB RAM · 25 GPIO |
| `RP2040 (Pi Pico)` | Hobby + PIO state machines | dual Cortex-M0+ · 133 MHz · 3.3 V · 2 MB flash · 264 KB RAM · 26 GPIO |
| `RP2350 (Pico 2)` | Next-gen Pico, Arm or RISC-V cores | dual Cortex-M33 (or Hazard3 RISC-V) · 150 MHz · 3.3 V · 4 MB flash · 520 KB RAM |
| `ATtiny85` | Tiny, low-power, battery | 8-pin AVR · 2.7–5.5 V · 8 KB flash · 512 B RAM · 6 GPIO |
| `Teensy 4.x` | High-speed USB, audio, fast GPIO | Cortex-M7 · 600 MHz · 3.3 V · 2 MB flash · 1 MB RAM |
| `Raspberry Pi` | Full Linux, camera/display, networking | 1–8 GB RAM · 5 V · GPIO with I2C / SPI / UART / PWM |

> **KEY:** **3.3 V vs 5 V is the first decision.** ESP32, ESP8266, STM32, RP2040 run at 3.3 V logic; Arduino runs at 5 V. Match your sensors and drivers to the logic level or add a level shifter — see [Selection tips](#gotchas).

1. **Pick the MCU** — ESP32 for wireless, Uno for 5 V shields, Pico for PIO, STM32 for raw speed.
1. **Choose the sensors** — Match voltage and bus: I2C is the default, 1-Wire for temps, analog for simple reads.
1. **Pick the drivers** — Any moving or high-current load goes through a driver or MOSFET, never a GPIO.
1. **Size the power** — Add up stall current, pick a supply with headroom, and common-ground everything.
1. **Assemble & test** — Wire module by module, test each in isolation, then integrate.
**Sensor** (MPU6050 · I2C) → **MCU** (ESP32 · brain) → **Driver** (DRV8825) → **Output** (NEMA 17)

## Sensors {#sensors}

Everything that reads the physical world: temperature, motion, light, gas, current, position.

| Device | Measures | Key specs |
| --- | --- | --- |
| `DS18B20` | Digital temperature | 1-Wire · -55…+125 °C · ±0.5 °C · 3–5.5 V · waterproof probe variant |
| `DHT22 (AM2302)` | Temperature + humidity | 0–100 % RH ±2 % · -40…+80 °C · single-wire · 0.5 Hz sampling |
| `DHT11` | Cheap temp + humidity | 20–90 % RH ±5 % · 0–50 °C · 1 Hz sampling · single-wire |
| `SHT40` | Precise temp + humidity | I2C · 0x44 · ±0.2 °C / ±1.8 % RH · replaces DHT22 for accuracy |
| `BME280` | Temp + humidity + pressure | I2C/SPI · 0x76/0x77 · 300–1100 hPa · indoor weather |
| `BME680` | Temp + humidity + pressure + VOC gas | I2C/SPI · 0x76/0x77 · adds indoor air-quality (IAQ) index |
| `LM35` | Analog temperature | 10 mV/°C · -55…+150 °C · 4–30 V · analog out |
| `TMP36` | Analog temperature | 10 mV/°C · -40…+125 °C · 2.7–5.5 V · easier than LM35 |
| `NTC thermistor` | Temperature | resistance falls as it heats · needs divider + lookup table |
| `MPU6050` | 6-axis IMU (accel + gyro) | I2C · 0x68 · 3.3/5 V · gyro + accelerometer |
| `MPU9250` | 9-axis IMU (adds magnetometer) | I2C/SPI · 0x68 · 3.3 V · 9 DoF fusion |
| `HC-SR04` | Ultrasonic distance | 2–400 cm · 5 V · trigger/echo pins · 15° beam |
| `VL53L0X` | Time-of-flight distance | I2C · 0x29 · 2 m · mm resolution · 2.8 V |
| `TSOP38238` | IR remote receiver | 38 kHz carrier · 3.3/5 V · decodes TV remotes |
| `LDR (photoresistor)` | Analog light level | resistance drops with light · needs voltage divider |
| `BH1750` | Digital lux (light) | I2C · 0x23/0x5C · 1–65535 lx · 3.3/5 V |
| `MQ-2` | Gas / smoke (LPG, alcohol) | analog + digital out · 5 V heater · needs preheat + calibration |
| `SCD40` | CO₂ + temp + humidity | I2C · 0x62 · true CO₂ 400–2000 ppm · factory calibrated |
| `ACS712` | Hall-effect current | 5 / 20 / 30 A variants · analog 66–185 mV/A · 5 V |
| `BMP280` | Barometric pressure + temp | I2C/SPI · 0x76/0x77 · 300–1100 hPa · altimeter |
| `NEO-6M (GPS)` | Position + time | UART · 9600 baud · NMEA · 3.3/5 V · needs antenna |
| `A3144 (hall)` | Magnetic field / RPM | digital switch · 5 V · triggers near a magnet |
| `Load cell + HX711` | Weight / force | full bridge · HX711 24-bit ADC · 2-wire · 5 V |
| `Potentiometer` | Analog position / knob | 3-terminal divider · 10k common · wiper to ADC |
| `AS5600` | Magnetic rotary angle encoder | I2C · 0x36 · 12-bit contactless knob · pairs with a diametric magnet |

### Analog read (voltage divider)

Resistive sensors (LDR, thermistor, flex) need a fixed resistor to form a divider; the ADC reads the midpoint.

```
VCC ──[sensor]──┬──→ A0
                 │
                [10k]
                 │
                GND

int raw = analogRead(A0);
```

### 1-Wire (DS18B20)

Many sensors share one pin, each with a unique 64-bit address. A 4.7k pull-up to VCC is required.

```
DQ ──┬──→ pin 2
     [4.7k]
      VCC
# OneWire + DallasTemperature lib
```

> **⌁:** Prefer digital sensors (`DS18B20`, `DHT22`, `BH1750`) over raw analog ones — they're calibrated at the factory and immune to ADC noise.

## Communication modules {#comm}

Wireless and wired links: Wi-Fi, Bluetooth, LoRa, RF, RS-485, CAN, Ethernet, GSM.

| Module | Protocol | Key specs |
| --- | --- | --- |
| `ESP32` | Wi-Fi + Bluetooth | 2.4 GHz · 802.11 b/g/n · BT 4.2/5 · built into the MCU |
| `ESP8266 (ESP-01)` | Wi-Fi | 2.4 GHz · AT-command firmware · 3.3 V · 2 GPIO |
| `HC-05` | Bluetooth classic (SPP) | 2.4 GHz · serial passthrough · AT commands · 3.3 V logic |
| `HM-10 (CC2541)` | Bluetooth Low Energy | BLE 4.0 · AT commands · 3.3 V · pairs with phones |
| `SX1278` | LoRa 433 MHz | SPI · up to 300 kbps · km-range line of sight |
| `RFM95W` | LoRa 868/915 MHz | SPI · Adafruit Feather footprint · long range, low power |
| `nRF24L01` | 2.4 GHz RF | SPI · 2 Mbps · ~100 m open air · +PA/LNA variant for range |
| `MAX485` | RS-485 | half-duplex differential · 5 V · multi-drop, 1200 m |
| `MCP2515 + TJA1050` | CAN bus | SPI · 1 Mbps · 5 V · automotive / robotics |
| `W5500` | Ethernet | SPI · 10/100 Mbit · TCP/IP offload · 3.3 V |
| `SIM800L` | GSM / GPRS (2G — being sunset) | UART · AT commands · 3.7–4.2 V · 2 A peak · check local 2G availability |
| `SIM7000 / SIM7080G` | LTE Cat-M / NB-IoT | UART · AT commands · 3.3/5 V · the current low-power cellular choice |

### Range vs power, at a glance

```
Bluetooth LE   → ~10 m
nRF24L01       → ~100 m
Wi-Fi          → ~100 m
LoRa (SX1278)  → 1–10 km
```

### Pick by distance

Short and battery-friendly: BLE. Medium and point-to-point: `nRF24L01`. Long and sparse: LoRa. Anything that needs the internet: Wi-Fi or GSM.

```
# LoRa needs a matched pair
SX1278 on both ends, same
frequency + sync word
```

### I2C

- Data / clock — <kbd>SDA</kbd><kbd>SCL</kbd>
- Pull-ups — <kbd>4.7k</kbd><kbd>VCC</kbd>
- Wires — <kbd>VCC</kbd><kbd>GND</kbd><kbd>SDA</kbd><kbd>SCL</kbd>

### SPI

- Clock / data — <kbd>SCK</kbd><kbd>MOSI</kbd><kbd>MISO</kbd>
- Per-device select — <kbd>CS</kbd>
- Wires — <kbd>VCC</kbd><kbd>GND</kbd><kbd>SCK</kbd><kbd>MOSI</kbd><kbd>MISO</kbd><kbd>CS</kbd>

### UART / 1-Wire

- UART — <kbd>TX</kbd><kbd>RX</kbd>
- 1-Wire — <kbd>DQ</kbd><kbd>4.7k</kbd>
- Cross-wire — <kbd>TX↔RX</kbd>

## Actuators & drivers {#act}

Making things move and switch: motor drivers, servos, relays, MOSFETs, solenoids.

| Device | Purpose | Key specs |
| --- | --- | --- |
| `L298N` | Dual H-bridge motor driver | 2 A/ch · 5–35 V motor · PWM + direction · 5 V logic |
| `L293D` | Dual H-bridge (small) | 600 mA/ch · 4.5–36 V · built-in flyback diodes |
| `DRV8825` | Stepper driver | 1/32 microstep · 2.2 A · 8.2–45 V · current-limit pot |
| `A4988` | Stepper driver | 1/16 microstep · 2 A · 8–35 V · current-limit pot |
| `TMC2209` | Silent stepper driver | stealthChop · 1/256 microstep · 2.8 A peak · 4.75–29 V · UART or standalone |
| `TB6612FNG` | Dual motor driver | 1.2 A/ch · 2.5–13.5 V · compact, efficient |
| `SG90` | Micro servo | 9 g · 4.8–6 V · 180° · ~50 Hz PWM |
| `MG996R` | Metal-gear servo | 55 g · 4.8–7.2 V · ~10 kg·cm · 180° |
| `Relay module (SRD-05VDC)` | High-power switching | 10 A @ 250 VAC · opto-isolated · 5 V coil · NO/NC |
| `IRLZ44N (MOSFET)` | Logic-level switch | 55 V · 47 A · 5 V gate · PWM for dimming/speed |
| `Solenoid (12 V)` | Push / pull actuator | 12 V · pulse drive · needs flyback diode |
| `NEMA 17` | Stepper motor | 1.8°/step · 12–24 V · 1.2–2 A · pairs with DRV8825/A4988 |

- `50 Hz` — servos (SG90, MG996R)
- `490 Hz` — Arduino default PWM — pins 3, 9, 10, 11
- `980 Hz` — Arduino pins 5, 6
- `25 kHz` — LED dimming / motor — above audible whine
- `1–10 kHz` — DC motor PWM (L298N / TB6612)
- `38 kHz` — IR remote carrier (TSOP38238)

### Stepper wiring (DRV8825)

```
EN ── GND (or a pin)
DIR ── pin 8
STEP ── pin 9
VMOT ── 12 V + 100 µF cap
B2 B1 A2 A1 ── NEMA 17
```

### Servo sweep

Servos take a 50 Hz pulse; 1 ms ≈ 0°, 1.5 ms ≈ 90°, 2 ms ≈ 180°.

```
servo.attach(9);
servo.write(90);   // center
servo.write(0);    // min
servo.write(180);  // max
```

> **!:** **Never drive a motor from a GPIO pin.** A motor's stall current can be amps; a GPIO sources ~20 mA. Always go through a driver (`L298N`, `TB6612`, MOSFET) and a separate power supply with a common ground.

## Displays & HMI {#display}

Ways to show output and take input: LCDs, OLEDs, TFTs, e-paper, keypads, encoders.

| Device | Type | Key specs |
| --- | --- | --- |
| `16×2 LCD (HD44780)` | Character LCD | 5 V · parallel 4/8-bit · contrast pot · backlight |
| `I2C backpack (PCF8574)` | LCD I2C adapter | 0x27 / 0x3F address · 5 V · saves 6+ pins |
| `SSD1306` | 128×64 OLED | I2C/SPI · 0x3C · 3.3/5 V · no backlight |
| `SH1106` | 128×64 OLED (1.3") | I2C · 0x3C · different init from SSD1306 |
| `ST7735` | 1.8" color TFT | SPI · 128×160 · 3.3/5 V · fast enough for sprites |
| `ST7789` | 1.3–2.0" IPS color TFT | SPI · 240×240 · 3.3 V · the go-to small full-color display |
| `GC9A01` | 1.28" round color TFT | SPI · 240×240 · 3.3 V · circular display for watch-style builds |
| `ILI9341` | 2.4–3.2" color TFT | SPI · 240×320 · 3.3/5 V · touch variants |
| `E-paper (SSD1680)` | 2.9" e-ink | SPI · 296×128 · zero-power image · slow refresh |
| `TM1637` | 4-digit 7-segment | 2-wire · 5 V · clock/digits · colon |
| `4×4 keypad` | Matrix input | 8 pins · membrane · needs keypad library |
| `Rotary encoder (KY-040)` | Knob input | 5 V · A/B quadrature + push button · needs debounce |
| `TTP223` | Capacitive touch button | digital out · 2–5.5 V · active-high or -low jumper |

### Character LCD

Text-only, cheap, readable in daylight. Uses 6+ pins, or 2 with an I2C backpack.

```
lcd.init();
lcd.backlight();
lcd.print("Hello");
```

### OLED

Crisp, tiny, no backlight, 4 wires. Great for status readouts and small graphs.

```
display.clearDisplay();
display.setTextSize(1);
display.println("ESP32");
```

### E-paper

Keeps the image with zero power; refresh takes seconds and ghosting is normal.

```
display.setRotation(0);
display.display(); // full refresh
display.powerOff();
```

> **✓:** **OLED over LCD:** `SSD1306` needs only 4 wires (VCC, GND, SDA, SCL) and no contrast pot, so it's the default choice for quick readouts.

## Power & storage {#power}

Getting the right voltage, keeping time, and holding data between power cycles.

| Device | Purpose | Key specs |
| --- | --- | --- |
| `7805` | Linear 5 V regulator | 7–25 V in · 5 V out · 1.5 A · needs heatsink |
| `AMS1117-3.3` | LDO 3.3 V regulator | 4.5–15 V in · 3.3 V out · 1 A · common on dev boards |
| `LM2596 (buck)` | DC-DC step-down | 4.5–40 V in · adj out · 3 A · efficient |
| `MT3608 (boost)` | DC-DC step-up | 2–24 V in · up to 28 V out · 2 A · for 12 V rails |
| `TP4056` | Li-ion/LiPo charger | 1 A · 4.2 V · micro-USB in · with/without protection |
| `DW01A + 8205A` | Li-ion protection | over/under-voltage · over-current · 2.5 A |
| `Battery holder` | 18650 / AA power | series or parallel · match pack voltage to regulator |
| `SD card module (SPI)` | Removable storage | 3.3 V · CS/MOSI/MISO/SCK · FAT via SD library |
| `DS3231` | Real-time clock | I2C · 0x68 · ±2 ppm · coin-cell backup |
| `MB102 breadboard PSU` | Bench power | 5 V / 3.3 V rails · barrel or USB in · 700 mA |

### Linear vs switching

Linear (`7805`, `AMS1117`) is quiet but burns the difference as heat. Switching (buck/boost) is efficient but can be noisy for analog readings.

```
# 12 V → 5 V, 500 mA
# linear wastes: (12-5) × 0.5 = 3.5 W heat
# buck wastes:  ~0.3 W
```

### RTC keeps time

The MCU's millis clock resets on power loss. A `DS3231` on I2C with a coin cell keeps wall-clock time across reboots.

```
# Wire: VCC→5V  GND→GND
#       SDA→A4   SCL→A5
# read via RTClib, set once
```

<details>
<summary>Battery packs: series vs parallel</summary>

#### Series (add voltage)

```
2× 18650 in series = 7.4 V
# boost for 12 V rails, or
# buck down to 5 V / 3.3 V
```

#### Parallel (add capacity)

```
2× 18650 in parallel = 3.7 V
# double mAh, same voltage
# balance cells first!
```

</details>

## Non-typical parts {#unusual}

The odd, the vintage, and the gloriously unnecessary — for when a normal project won't do.

| Device | What it does | Key specs |
| --- | --- | --- |
| `TCS34725` | RGB color sensor | I2C · 0x29 · 16-bit per channel · color matching |
| `APDS-9960` | Gesture / proximity / color | I2C · 0x39 · up/down/left/right swipes |
| `SDS011` | PM2.5 / PM10 dust sensor | UART · laser scattering · needs ~30 s warmup |
| `Nixie tube (IN-14)` | Vintage numeral display | ~170 V · needs boost + driver IC (K155ID1) |
| `VFD (IV-11)` | Vacuum fluorescent display | filament + grid voltages · multiplexed · glows teal |
| `Thermal printer (58 mm)` | Receipt printing | UART/TTL · 5–9 V · 2 A peak · ESC/POS |
| `Solenoid lock (12 V)` | Electric door lock | 12 V pulse · needs flyback diode · NC/NO types |
| `Vibration motor` | Haptic feedback | 3 V coin or 5 V ERM · drive via transistor |
| `Flex sensor` | Bend / angle | resistive · resistance rises with bend · voltage divider |
| `HC-SR501 PIR` | Motion detection | 3.3–5 V · ~7 m range · adjustable delay + sensitivity |
| `Ultrasonic atomizer` | Mist maker | 5 V disc · 113 kHz driver · for fog effects |
| `Geiger tube (SBM-20)` | Radiation detection | ~400 V supply · pulse counting · needs HV module |

`nixie` `vacuum` `haptic` `fog` `radiation` `receipt printer` `gesture` `dust`

### Nixie / VFD basics

Both need a high-voltage rail (170–400 V) from a boost converter plus a driver chip. Multiplex the digits to save pins.

```
170 V ── anode driver
cathode ── K155ID1 ── GPIO
# never touch HV pins powered
```

### Thermal printer

Speaks ESC/POS over UART. Feed it 5–9 V with a beefy supply — the heating head spikes to ~2 A.

```
Serial1.begin(9600);
Serial1.write(0x1B); Serial1.write('@'); // init
Serial1.println("Hello, receipt");
```

> **!:** **High voltage lives in this section.** Nixie, VFD, and Geiger circuits run at 170–400 V — lethal if you touch the wrong node. Power down, discharge capacitors, and use an isolation transformer when probing.

## Selection tips {#gotchas}

Six rules that save boards, hours, and money — before you solder anything.

### 3.3 V vs 5 V logic

ESP32, ESP8266, STM32, and RP2040 GPIOs are **not 5 V tolerant**. Feed them a 5 V signal and you can kill the pin. Use a level shifter or a resistor divider for 5 V inputs.

```
5V signal ──[1.7k]──┬──→ 3.3V pin
                    [3.3k]
                     GND
```

### I2C address conflicts

Two devices can't share a bus address. Watch the usual suspects: `0x27/0x3F` LCD backpacks, `0x68` MPU6050/DS3231, `0x76/0x77` BMP280, `0x3C` OLED.

```
// I2C scanner sketch
// prints every address found
Wire.beginTransmission(addr);
```

### Current draw

Size the supply for *stall* current, not running current. Motors, servos, and relays spike at startup; a weak supply browns out the MCU.

```
SG90 stall   ≈ 650 mA
MG996R stall ≈ 2.5 A
NEMA17 coil  ≈ 1.2 A
```

### Pin count & shared pins

I2C uses SDA/SCL, SPI uses SCK/MOSI/MISO + one CS per device. On ESP32, some pins are input-only or strapping pins — avoid GPIO 0/2 for arbitrary use.

```
SPI:  SCK, MOSI, MISO, CS
I2C:  SDA, SCL
UART: TX, RX
```

### Genuine vs clone

Clones often swap the FTDI chip for a `CH340` (needs a driver) and may skip protection circuits. They usually work — just verify the board voltage and USB chip before buying in bulk.

```
# check the USB-serial chip
ls /dev/cu.*    # CH340 → cu.wchusbserial*
                # FTDI  → cu.usbserial*
```

### ESD & reverse polarity

Discharge static before touching bare ICs, and add a flyback diode across any relay, solenoid, or motor. Double-check capacitor polarity and battery orientation — one reversed electrolytic pops.

```
coil + ──|>|── coil -
   flyback diode across
   every inductive load
```

### Li-ion battery safety

Never discharge a bare 18650 below ~2.8 V or charge above 4.2 V — use protected cells or a `DW01A + 8205A` board. Don't mix cells of different age or capacity, and retire any cell that puffs.

```
4.2 V full · 3.7 V nominal
2.8 V empty · don't go below
TP4056 charges at 1 A
```

### 2G / 3G sunset

Carriers are switching off 2G and 3G region by region, so `SIM800L`-based builds will stop connecting. For new cellular projects use LTE Cat-M / NB-IoT (`SIM7000`, `SIM7080G`) or Wi-Fi via an ESP32.

```
2G  → sunset, avoid new builds
4G  → SIM7000 / SIM7080G
IoT → NB-IoT / LTE Cat-M
```

`5 V → 3.3 V` `divider`
`R1 1.7kΩ · R2 3.3kΩ` `ratio 2:3`
`level shifter` `bidirectional`

- **INPUT** — High-impedance read. Floats if nothing drives it — use `INPUT_PULLUP` for buttons.
- **OUTPUT** — Drive high/low. ~20 mA max per pin — enough for an LED, never a motor.
- **PWM** — Fast on/off duty cycle: dim LEDs, drive servos, set motor speed.
- **ANALOG** — `analogRead()` on ADC pins only; 0–1023 (10-bit) on AVR.
> **!:** **Most blown boards come from one mistake:** connecting 5 V logic to a 3.3 V input, or a reversed power supply. Check voltage twice, then power up.
