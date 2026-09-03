---
title: "ESPHome"
description: "YAML-defined firmware, sensors, and home automation for ESP devices."
category: "Embedded & hardware"
tags: ["embedded", "YAML", "sensor", "Home Assistant"]
weight: 290
lead: "ESP firmware from YAML."
version: "home automation"
---
ESPHome turns a few-dollar ESP32 or ESP8266 into a Home Assistant–native sensor, switch, or light — described entirely in YAML, compiled locally, and flashed over USB or Wi-Fi.

## Quick reference {#quickref}

The handful of lines and commands you'll reach for most often.

### Minimal device YAML

Everything a node needs to phone home and be discoverable.

```
esphome:
  name: livingroom
  friendly_name: Living Room

esp32:
  board: esp32dev

wifi:
  ssid: "my-wifi"
  password: !secret wifi_password

api:          # HA discovery, port 6053
ota:          # wireless updates
```

### Most-used commands

Build, flash, and watch a node from the terminal.

- `esphome dashboard config/` — web UI · http://localhost:6052
- `esphome run livingroom.yaml` — compile + upload + logs
- `esphome compile livingroom.yaml` — build the binary only
- `esphome upload livingroom.yaml` — flash USB, then OTA
- `esphome logs livingroom.yaml` — stream serial logs
- `esphome config livingroom.yaml` — validate the YAML

> **⌁:** **Common sensors:** `dht` (temp + humidity) · `bme280` (temp + humidity + pressure, I2C) · `ultrasonic` (distance) · `adc` (0–3.3 V) · `gpio` binary (button / PIR). **Boards:** `esp32dev` · `esp32-c3-devkitm-1` · `nodemcuv2` · `d1_mini`. **Ports:** API `6053` · dashboard `6052` · web `80`.

## What ESPHome is {#start}

ESPHome is firmware-as-YAML: you describe what the board does, it compiles a binary, and Home Assistant discovers the device automatically.

### 1. What it is

A YAML config per device compiles into firmware for `esp32:` / `esp8266:`. No C++ required — unless you want it.

### 2. Install

```
pip install esphome
esphome version   # sanity check

# or Docker:
docker run --rm -v "${PWD}":/config -it \
  ghcr.io/esphome/esphome version
```

### 3. First config

```
# livingroom.yaml
esphome:
  name: livingroom

esp32:
  board: esp32dev

wifi:
  ssid: "my-wifi"
  password: "secret"
```

### 4. Compile & flash

```
esphome run livingroom.yaml
# = compile + upload + logs

esphome dashboard config/
```

> **KEY:** **One YAML file per device.** Every node has its own `esphome:` name, one board, and at least `wifi:` to phone home. Add `api:` so Home Assistant discovers it with a single click.

## Configuration {#config}

Every node is one YAML file. The top-level blocks below are the only ones a minimal setup needs.

```
esphome:
  name: livingroom
  friendly_name: Living Room

esp32:
  board: esp32dev
  # ESP8266 instead:
  # esp8266:
  #   board: nodemcuv2

wifi:
  ssid: "my-wifi"
  password: !secret wifi_password
  ap:                        # fallback hotspot
    ssid: "Livingroom Fallback"
    password: "setup1234"

api:                         # native HA integration
  encryption:
    key: !secret api_key

ota:                         # over-the-air updates
  - platform: esphome
    password: !secret ota_password

captive_portal:              # wifi setup page in fallback-AP mode

logger:                      # serial logs

sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "Living Room Temp"
```

### Boards

The board string selects the pin map and flash layout. ESP8266 needs a matching `esp8266:` block.

```
esp32:
  board: esp32dev
  #   esp32-c3-devkitm-1
  #   wemos_d1_mini32

esp8266:
  board: nodemcuv2
  #   d1_mini / esp01_1m
```

### Wi-Fi & fallback AP

If the station can't connect, the board starts the `ap:` hotspot; add `captive_portal:` to get a web setup page when you join it.

```
wifi:
  ssid: "my-wifi"
  password: !secret wifi_password
  ap:
    ssid: "Node Fallback"
    password: "12345678"

captive_portal:
```

> **⌁:** **`api:` and `ota:` make ESPHome feel native.** `api:` opens port `6053` for the Home Assistant integration (auto-discovered over mDNS); `ota:` lets you push new firmware over Wi-Fi. Pull every password from `secrets.yaml` via `!secret`.

## Sensors & components {#sensors}

Components read the physical world and expose it to Home Assistant as entities. Each is a `platform` under a top-level key.

| Component | Measures | Example config |
| --- | --- | --- |
| `sensor` · dht | temperature + humidity | `platform: dht` · `pin: GPIO4` |
| `sensor` · bme280 | temperature, humidity, pressure | `address: 0x76` (I2C) |
| `sensor` · ultrasonic | distance (HC-SR04) | `trigger_pin` + `echo_pin` |
| `sensor` · adc | voltage 0–3.3 V | `attenuation: auto` |
| `binary_sensor` · gpio | button / PIR high–low | `pin` + `mode: INPUT_PULLUP` |
| `text_sensor` · wifi_info | IP, SSID, BSSID | no config needed |
| `sensor` · uptime | seconds since boot | `update_interval: 60s` |
| `switch` · gpio | relay on/off (see §4) | `pin` + `restore_mode` |

<details>
<summary>Full sensor examples</summary>

#### DHT22 on one wire

```
sensor:
  - platform: dht
    pin: GPIO4
    model: DHT22          # default: AUTO_DETECT
    temperature:
      name: "Living Room Temp"
    humidity:
      name: "Living Room Humidity"
    update_interval: 60s
```

#### BME280 over I2C

```
i2c:
  sda: GPIO21
  scl: GPIO22
  scan: true

sensor:
  - platform: bme280
    address: 0x76
    temperature:
      name: "BME Temp"
    humidity:
      name: "BME Humidity"
    pressure:
      name: "BME Pressure"
```

</details>

`dht` `bme280` `hc-sr04` `adc` `gpio` `wifi_info` `uptime`

## GPIO & switches {#gpio}

These turn pins into outputs (relays, dimmers, lights) and inputs (buttons, PIRs) with a few lines of YAML.

### switch (relay)

Simple on/off output. `restore_mode` sets the state after reboot.

```
switch:
  - platform: gpio
    pin: GPIO26
    name: "Relay"
    id: relay1
    restore_mode: ALWAYS_OFF
```

### output + light (PWM)

`ledc` gives hardware PWM on any pin; a `light` wraps it for Home Assistant.

```
output:
  - platform: ledc
    pin: GPIO5
    frequency: 1000Hz
    id: led_pwm

light:
  - platform: monochromatic
    output: led_pwm
    name: "Dimmer"
```

### binary_sensor + button

Inputs read high/low and can run automations with `on_press`.

```
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO13
      mode: INPUT_PULLUP
    name: "Button"
    on_press:
      - switch.toggle: relay1
```

> **!:** **Drive relays through a transistor or optocoupler** — never straight from a GPIO. For low-active relay boards set `inverted: true`. Keep strapping pins `GPIO0`/`GPIO2`/`GPIO15` free (see §8).

## Integrations {#integrations}

ESPHome talks to Home Assistant natively, but can also speak MQTT, host a web UI, update over the air, and proxy Bluetooth.

**YAML** (config files) → **ESP device** (compiled firmware) → **Home Assistant** (native API :6053) → **MQTT broker** (pub/sub topics)

### Home Assistant API

Zero-config discovery. Entities appear in HA as soon as the node boots.

```
api:
  encryption:
    key: !secret api_key
# auto-discovered via mDNS
# encrypted on port 6053
```

### MQTT

Publish state and listen for commands through a broker; `discovery` auto-creates HA entities.

```
mqtt:
  broker: 192.168.1.10
  username: !secret mqtt_user
  password: !secret mqtt_pass
  discovery: true
```

### Web server

A local UI at `http://<device-ip>/` for reading state and toggling without HA.

```
web_server:
  port: 80
  auth:
    username: admin
    password: !secret web_pass
```

### OTA

Wireless firmware updates from the dashboard or CLI. Keep a password on it.

```
ota:
  - platform: esphome
    password: !secret ota_password
# "Wirelessly update" in dashboard
```

<details>
<summary>Bluetooth proxy (ESP32)</summary>

A cheap ESP32 becomes a remote Bluetooth antenna for Home Assistant, relaying BLE advertisements (trackers, sensors, locks) back to the hub.

```
esp32_ble_tracker:

bluetooth_proxy:
  active: true
```

</details>

## Lambdas & automations {#lambda}

Automations run when a trigger fires. When YAML isn't enough, a `lambda:` drops into raw C++.

```
sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "Temp"
      on_value:
        then:
          - if:
              condition:
                lambda: 'return x > 30.0;'
              then:
                - switch.turn_on: relay_fan
                - logger.log: "Cooling on"
          - else:
              - switch.turn_off: relay_fan
```

1. **Trigger** — `on_boot`, `on_value`, `on_press`, `interval`, or `time` fires the automation.
1. **Condition** — `if:` with `and:`, `or:`, `not:`, or a `lambda:` gates the action.
1. **Action** — `then:` runs `switch.turn_on`, `light.toggle`, `homeassistant.service`…
1. **Lambda** — A `lambda:` executes raw C++ for anything the YAML actions can't express.

### Common triggers

- `on_boot` — once at startup (priority).
- `on_value` — a sensor's value changes.
- `on_press` — a binary_sensor goes on.
- `on_click` — tap / double-tap / long-press.
- `interval` — every N seconds.
- `time` — cron-style schedule.

### Lambda C++ helpers

`x` is the current value; reach other entities by `id()`.

```
id(relay_fan).turn_on();
id(temp).state;                 // read
return id(temp).state > 25.0;   // condition
```

## CLI & flashing {#cli}

The `esphome` command and the web dashboard both build and flash; `secrets.yaml` keeps credentials out of the config.

- `esphome dashboard config/` — web UI on http://localhost:6052.
- `esphome run livingroom.yaml` — compile + upload + stream logs.
- `esphome compile livingroom.yaml` — build the binary only.
- `esphome upload livingroom.yaml` — flash only (USB, then OTA later).
- `esphome logs livingroom.yaml` — stream serial logs at 115200.
- `esphome config livingroom.yaml` — validate the YAML, print the merged config.
- `esphome wizard livingroom.yaml` — interactive scaffold.
- `esphome rename old.yaml new.yaml` — rename a node.
- `esphome upload … --device /dev/ttyUSB0` — target a specific serial port.
- `esphome run … --no-logs` — compile + flash, skip the log tail.

`esphome` `command`
`config.yaml` `node`
`--device /dev/ttyUSB0` `flag`

<details>
<summary>secrets.yaml</summary>

Keep every password here and reference it with `!secret key`. Commit the config, never this file.

```
# secrets.yaml — never commit
wifi_password: "super-secret"
api_key: "rXlP6…base64-32-bytes…"
ota_password: "another-secret"

# in the config:
#   password: !secret wifi_password
```

</details>

## Pitfalls {#gotchas}

The mistakes that cost the most debugging time — all avoidable up front.

### YAML indentation

Two spaces, never tabs. A list item one space off silently nests under the wrong key.

```
# ✗ pin indented under platform
sensor:
  - platform: dht
      pin: GPIO4

# ✓ two spaces deeper than the dash
sensor:
  - platform: dht
    pin: GPIO4
```

### Pin conflicts

Strapping pins are sampled at reset — leave them alone or the board won't boot right.

```
# GPIO0  low at boot = flash mode
# GPIO2  must be high at boot
# GPIO15 must be low at boot
```

### Secrets not found

A `!secret` that has no matching key fails the compile with a clear error — check the key name.

```
password: !secret wifi_password  # ✓
password: !secret wifi_password  # ✗ typo
```

### Boot loops

Watch the log first — it usually prints the panic and backtrace.

```
esphome logs livingroom.yaml
# erase + reflash as a last resort:
esphome run livingroom.yaml \
  --device /dev/ttyUSB0
```

### Flashing without USB

The first flash needs USB. After that, any config that keeps `ota:` updates wirelessly.

```
# first: USB cable
esphome run livingroom.yaml
# later: over the air
esphome upload livingroom.yaml
```

### Wi-Fi fallback AP

If the station won't connect, the board hosts the `ap:` hotspot — join it to fix `ssid`/`password`.

```
wifi:
  ssid: "my-wifi"
  ap:
    ssid: "Node Fallback"
    password: "12345678"
```

### OTA brick → safe mode

Safe mode is on by default: after repeated failed boots, the node drops to a minimal firmware (OTA + API only) so you can push a fix wirelessly.

```
safe_mode:              # defaults shown
  num_attempts: 5       # failed boots to trigger
  reboot_timeout: 5min  # window to count

button:
  - platform: safe_mode
    name: "Safe Mode Boot"
```

### Rotated the API key

Change the `api:` encryption key and Home Assistant shows the node offline until you re-approve it — the old key no longer matches.

```
api:
  encryption:
    key: !secret api_key
# HA → Settings → Devices:
# re-add after any key change
```

> **!:** **3.3 V logic only.** ESP32/ESP8266 GPIOs are not 5 V tolerant. Level-shift 5 V sensors, and never power a relay coil straight from a pin.

## Keep exploring {#related}

Neighboring cheatsheets for the same workbench.

### ESP32

Bare-metal ESP32 development — IDF, pin maps, Wi-Fi, and low-level APIs.

ESP32 guide →
### Embedded dev

Cross-platform embedded fundamentals, toolchains, and workflows.

Embedded dev →
### Hardware list

Boards, sensors, and parts to stock the physical build.

Hardware list →
