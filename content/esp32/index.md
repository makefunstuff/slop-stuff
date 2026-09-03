---
title: "ESP32"
description: "GPIO, UART/I2C/SPI, Wi-Fi, storage, power, and OTA on the ESP32."
category: "Embedded & hardware"
tags: ["embedded", "GPIO", "WiFi", "OTA"]
weight: 280
lead: "Embedded work on the ESP32."
version: "esp-idf 5.5 · arduino 3.x"
---
A dual-core Xtensa MCU with Wi-Fi and Bluetooth for a few dollars. This guide covers the Arduino core and ESP-IDF side by side — from first flash to over-the-air updates.

## Quick reference {#quickref}

The commands and calls you'll reach for most — ESP-IDF and Arduino core side by side.

### Build · flash · monitor

- `idf.py build` — compile the project
- `idf.py flash monitor` — upload + open serial
- `arduino-cli compile -b esp32:esp32:esp32 blink` — build a sketch
- `arduino-cli upload -p /dev/ttyUSB0 -b esp32:esp32:esp32` — flash the sketch

### Arduino core essentials

- `Serial.begin(115200)` — open UART0 debug
- `pinMode(2, OUTPUT)` — set a pin direction
- `digitalWrite(2, HIGH)` — drive a pin
- `WiFi.begin("ssid", "pass")` — join a Wi-Fi network
- `esp_deep_sleep_start()` — sleep — never returns
- `ArduinoOTA.handle()` — serve OTA updates

> **⌁:** **At a glance:** serial log at `115200` · GPIOs are 3.3 V, not 5 V tolerant · hold <kbd>BOOT</kbd> + tap <kbd>EN</kbd> for download mode · `idf.py menuconfig` for settings · Arduino core 3.x replaced `ledcSetup()` with `ledcAttach(pin, freq, res)`.

## Toolchains & first flash {#start}

Three toolchains target the same silicon. Pick one and stick with it: ESP-IDF for bare-metal control, Arduino core for speed, PlatformIO for editor workflows.

### 1. Install

```
# ESP-IDF
brew install espressif/esp-idf/esp-idf
. $IDF_PATH/export.sh   # per shell

# Arduino CLI
brew install arduino-cli
arduino-cli core install esp32:esp32
```

### 2. ESP-IDF

```
idf.py create-project blink
cd blink
idf.py set-target esp32
idf.py menuconfig
idf.py build
idf.py flash monitor
```

### 3. Arduino CLI

```
arduino-cli compile --fqbn esp32:esp32:esp32 blink
arduino-cli upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32
arduino-cli monitor -p /dev/ttyUSB0 -c baudrate=115200
```

### 4. PlatformIO

```
; platformio.ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
```

`pio run -t upload` to flash, `pio device monitor` for serial.

> **KEY:** **Any ESP32 DevKitC / WROOM dev board works.** Flash over USB through the on-board CP2102/CH340 bridge at `115200` baud. If the board lacks auto-reset, hold <kbd>BOOT</kbd> (GPIO0) and tap <kbd>EN</kbd> to enter download mode.

## GPIO & digital IO {#gpio}

The Arduino core maps directly onto ESP-IDF's GPIO driver. Pins are 3.3 V and source ~12 mA each — check per-pin limits before driving LEDs.

| Task | Arduino core | ESP-IDF |
| --- | --- | --- |
| Set direction | `pinMode(2, OUTPUT)` | `gpio_set_direction(GPIO_NUM_2, GPIO_MODE_OUTPUT)` |
| Write | `digitalWrite(2, HIGH)` | `gpio_set_level(GPIO_NUM_2, 1)` |
| Read | `digitalRead(2)` | `gpio_get_level(GPIO_NUM_2)` |
| Pull-up | `pinMode(2, INPUT_PULLUP)` | `gpio_set_pull_mode(GPIO_NUM_2, GPIO_PULLUP_ONLY)` |
| Toggle | `digitalWrite(2, !digitalRead(2))` | `gpio_set_level(GPIO_NUM_2, !gpio_get_level(GPIO_NUM_2))` |

### Blink (Arduino)

On most devkits the on-board LED is `GPIO2`.

```
#define LED 2
void setup() { pinMode(LED, OUTPUT); }
void loop() {
  digitalWrite(LED, HIGH);
  delay(1000);
  digitalWrite(LED, LOW);
  delay(1000);
}
```

### Interrupt + debounce

ISRs must be `IRAM_ATTR` and stay tiny — set a flag, do the work in `loop()`.

```
#define BTN 4
volatile bool pressed = false;
void IRAM_ATTR onPress() { pressed = true; }

void setup() {
  pinMode(BTN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BTN),
                  onPress, FALLING);
}
void loop() {
  if (pressed) {
    pressed = false;
    delay(50);              // debounce
    if (digitalRead(BTN) == LOW) { /* work */ }
  }
}
```

> **!:** **Arduino core 3.x:** `analogWrite()` now works (LEDC-backed), but `ledcSetup()`/`ledcAttachPin()` are removed — use `ledcAttach(pin, freq, res)` + `ledcWrite(pin, duty)`. And **ADC2 pins conflict with Wi-Fi**: prefer ADC1 (`GPIO32–39`) when the radio is on.

## UART · I2C · SPI · ADC · PWM {#peripherals}

The ESP32 exposes three UARTs, two I2C and four SPI buses, plus a 12-bit ADC and LEDC PWM. Default pins below are for the classic ESP32 (WROOM devkit); on Arduino core 3.x `Serial1` defaults to GPIO26/27 and `Serial2` to GPIO4/25.

| Peripheral | Default pins | API |
| --- | --- | --- |
| UART | TX0=1 · RX0=3 (debug) | `Serial.begin(115200)`; `Serial2.begin(115200, SERIAL_8N1, RX2, TX2)` |
| I2C | SDA=21 · SCL=22 | `Wire.begin(21, 22)`; `Wire.beginTransmission(0x3C)` |
| SPI (VSPI) | SCK=18 · MISO=19 · MOSI=23 · SS=5 | `SPI.begin(18, 19, 23, 5)`; `SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0))` |
| ADC | 12-bit → 0–4095 | `analogRead(34)`; `analogReadResolution(12)` |
| PWM (LEDC) | any GPIO | `ledcAttach(2, 5000, 8)`; `ledcWrite(2, 128)` |
| DAC | 25 (DAC1) · 26 (DAC2) | `dacWrite(25, 128)` → 0–255 |

### I2C scanner

Find every device on the bus in one pass.

```
#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  for (byte a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0)
      Serial.printf("Found 0x%02X\n", a);
  }
}
```

### PWM fade (LEDC)

`ledcAttach(pin, freq, resolution)` then `ledcWrite(pin, duty)`.

```
ledcAttach(2, 5000, 8);  // GPIO2, 5 kHz, 8-bit
for (int d = 0; d <= 255; d++) {
  ledcWrite(2, d);
  delay(10);
}
```

## Wi-Fi & networking {#wifi}

Connect as a station, host an access point, or both. ESP-IDF exposes the same via `esp_wifi` + `esp_netif`.

### Station (STA)

Block until connected, then print the assigned IP.

```
#include <WiFi.h>
void setup() {
  Serial.begin(115200);
  WiFi.begin("ssid", "password");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.localIP());
}
```

### Access point (AP)

Great for first-time setup or a captive config page.

```
WiFi.softAP("esp32-setup", "password");
// default gateway: 192.168.4.1
Serial.println(WiFi.softAPIP());
```

### HTTP GET

Fetch JSON or a config blob from any endpoint.

```
#include <HTTPClient.h>
HTTPClient http;
http.begin("http://example.com/api");
int code = http.GET();
if (code == HTTP_CODE_OK) {
  String body = http.getString();
  Serial.println(body);
}
http.end();
```

### mDNS

Reach the board by name instead of a changing IP.

```
#include <ESPmDNS.h>
MDNS.begin("esp32");
MDNS.addService("http", "tcp", 80);
// browse to http://esp32.local
```

> **⌁:** **ESP-IDF:** call `esp_netif_init()`, `esp_event_loop_create_default()`, then `esp_wifi_init()` → `esp_wifi_set_mode()` → `esp_wifi_start()`. Arduino wraps this whole sequence behind `WiFi.begin()`.

## Storage & flash {#storage}

Keep small config in wear-leveled NVS, files in SPIFFS/LittleFS, and control the layout with a partition table.

### NVS (Preferences)

Key-value store backed by wear-leveled flash. `false` = read/write, `true` = read-only.

```
#include <Preferences.h>
Preferences prefs;
prefs.begin("app", false);
prefs.putString("ssid", "my-wifi");
String s = prefs.getString("ssid", "");
prefs.end();
```

### SPIFFS

Simple flat filesystem, now legacy in favor of LittleFS.

```
SPIFFS.begin(true);   // format on fail
File f = SPIFFS.open("/data.txt", "r");
String s = f.readString();
f.close();
```

### LittleFS

Prefer this for new projects — faster and directory-aware.

```
LittleFS.begin(true);
File f = LittleFS.open("/cfg.json", "w");
f.print("{\"v\":1}");
f.close();
```

### partitions.csv

Define regions of flash; select it in `menuconfig` (or `board_build.partitions` in PlatformIO).

```
# Name,   Type, SubType, Offset,  Size,   Flags
nvs,      data, nvs,     0x9000,  0x5000,
phy_init, data, phy,     0xf000,  0x1000,
factory,  app,  factory, 0x10000, 1M,
spiffs,   data, spiffs,  0x110000, 0xF0000,
```

## Sleep & power {#power}

Deep sleep shuts the cores off entirely; light sleep keeps RAM. Both wake from RTC sources. Choose the mode that matches your duty cycle.

- **Deep sleep** — ~5–10 µA. Cores off, RAM lost. `esp_deep_sleep_start()` never returns.
- **Light sleep** — ~0.8 mA. RAM preserved; `esp_light_sleep_start()` resumes where it left off.
- **Modem sleep** — Wi-Fi DTIM-cycled, connection kept. Automatic when the radio idles.
- **Active** — ~100–240 mA, Wi-Fi TX peaks ~350 mA. Budget ≥500 mA for the supply.

### Deep sleep + wake

Enable sources, then sleep. The wake reason is readable after reboot.

```
#define WAKE_PIN GPIO_NUM_33
esp_sleep_enable_timer_wakeup(30 * 1000000ULL); // 30 s
esp_sleep_enable_ext0_wakeup(WAKE_PIN, 0);      // LOW
esp_deep_sleep_start();                          // no return
```

### Wake causes

- `ESP_SLEEP_WAKEUP_TIMER` — timer elapsed.
- `ESP_SLEEP_WAKEUP_EXT0` — single pin matched level.
- `ESP_SLEEP_WAKEUP_EXT1` — pin mask matched pattern.
- `ESP_SLEEP_WAKEUP_TOUCHPAD` — touch sensor triggered.

> **!:** **Brownout detector** resets the chip when VIN sags under load (Wi-Fi TX spikes). Use a 5 V / ≥500 mA supply with a solid 3.3 V LDO and a decoupling cap near the module. Read the cause with `esp_sleep_get_wakeup_cause()`.

## Over-the-air updates {#ota}

Flash wirelessly via the Arduino IDE's built-in OTA, or pull a binary over HTTPS. ESP-IDF adds a native `esp_ota` API with rollback.

### ArduinoOTA

Appears as a network port in the IDE after `begin()`.

```
#include <ArduinoOTA.h>
void setup() {
  ArduinoOTA.setHostname("esp32");
  ArduinoOTA.setPassword("secret");
  ArduinoOTA.begin();
}
void loop() { ArduinoOTA.handle(); }
```

### HTTPS update

Download a firmware binary and stream it into the update partition.

```
#include <Update.h>
HTTPClient http;
http.begin("http://host/fw.bin");
int len = http.GET();
Update.begin(len);
Update.writeStream(http.getStream());
if (Update.end() && Update.isFinished())
  ESP.restart();
```

> **✓:** **ESP-IDF + rollback:** `esp_ota_begin()` → `esp_ota_write()` → `esp_ota_end()` → `esp_ota_set_boot_partition()`. Enable `CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE`, then confirm a good boot with `esp_ota_mark_app_valid_cancel_rollback()` — or revert with `esp_ota_mark_app_invalid_rollback_and_reboot()`.

## Pitfalls {#gotchas}

Eight things that bite everyone once. Read the serial log at `115200` before guessing.

<details>
<summary>Watchdog resets</summary>

Two watchdogs guard the ESP32: the interrupt WDT and the task WDT. A long `delay()` in a task, or an ISR that blocks, trips `Task watchdog got triggered`. Feed it with `esp_task_wdt_reset()`, or raise `CONFIG_ESP_TASK_WDT_TIMEOUT_S`.

</details>

<details>
<summary>Brownout detector</summary>

A voltage sag under load prints `Brownout detector was triggered` and reboots the chip. It's almost always the power supply, not the code — beef up the regulator and add a cap, or raise the brownout threshold in menuconfig.

</details>

<details>
<summary>Flash size mismatch</summary>

A wrong `flash_size` in menuconfig (or `esptool`) makes the app crash or fail to boot. Most devkits are 4 MB — set `Serial flasher config → Flash size` to match the module's datasheet.

</details>

<details>
<summary>Boot loops</summary>

Watch the serial at `115200` — it usually prints the panic reason and a backtrace. When in doubt, wipe and reflash:

```
esptool.py --port /dev/ttyUSB0 erase_flash
idf.py flash   # or: arduino-cli upload …
```

</details>

<details>
<summary>3.3 V logic vs 5 V</summary>

GPIOs are **3.3 V and not 5 V tolerant**. Feeding a 5 V signal in can damage the pin. Use a level shifter or a resistor divider for 5 V sensors and displays.

</details>

<details>
<summary>Boot strapping pins</summary>

These pins are sampled at reset — the wrong pull changes boot behavior. `GPIO0` low = download mode; `GPIO2` must be high; `GPIO12` selects flash voltage (keep low at boot); `GPIO15` high keeps the boot log on UART0. Avoid hard-wiring them to conflicting levels.

</details>

<details>
<summary>Arduino core 2.x → 3.x breaking changes</summary>

The 3.x line (ESP-IDF 5.1+) removed several long-standing APIs: `ledcSetup()`/`ledcAttachPin()` (now `ledcAttach()` + `ledcWrite(pin, duty)`), `hallRead()` (hall sensor dropped), and `adcAttachPin()`. It also changed `Serial1`/`Serial2` default pins and added a proper `analogWrite()`. 2.x examples won't compile unmodified — pin the old core with `arduino-cli core install esp32:esp32@2.0.17` if you need to stay.

</details>

<details>
<summary>OTA partition table</summary>

OTA needs two app slots so the running firmware survives while the new image downloads: a partition table with `factory` + `ota_0` + `ota_1` (or the Arduino default `app0`/`app1`). With a single `factory` slot, `Update.writeStream()` fails with `Not enough space`. Budget ≥4 MB flash to hold two images.

</details>

## Keep exploring {#related}

Neighboring cheatsheets for the same workbench.

### ESPHome

Firmware-as-YAML on the same silicon — sensors, Wi-Fi, and Home Assistant discovery.

ESPHome →
### Embedded dev

Cross-platform embedded fundamentals, toolchains, and hardware workflows.

Embedded dev →
### Electrical

The physics behind the firmware — voltage, current, and power supplies.

Electrical →
