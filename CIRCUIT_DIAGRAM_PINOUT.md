# ⚡ Circuit Diagram & Complete Hardware Pinout Guide
### Smart India Hackathon (SIH) — IoT Multi-Village Disaster Management & Mesh Communication

---

## 📌 1. Node 1: Disaster Sensor Node (ESP32 DevKit V1 30-Pin)

| Component | Component Pin | ESP32 GPIO Pin | Description / Function |
|---|---|---|---|
| **LoRa SX1278 (433MHz)** | NSS / CS | `GPIO 5` | SPI Chip Select |
| | SCK | `GPIO 18` | SPI Clock |
| | MOSI | `GPIO 23` | SPI MOSI |
| | MISO | `GPIO 19` | SPI MISO |
| | RST | `GPIO 14` | Reset Pin |
| | DIO0 | `GPIO 26` | Packet Done Interrupt |
| | VCC / GND | `3.3V` / `GND` | **⚠️ Do NOT power with 5V!** |
| **NEO-6M GPS Module** | TX | `GPIO 16` (RX2) | Hardware Serial 2 Receive |
| | RX | `GPIO 17` (TX2) | Hardware Serial 2 Transmit |
| | VCC / GND | `3.3V - 5V` / `GND`| Power supply |
| **0.96" OLED (SSD1306)** | SDA | `GPIO 21` | I2C Data |
| | SCL | `GPIO 22` | I2C Clock |
| | VCC / GND | `3.3V` / `GND` | Power supply |
| **Rain Sensor (Module)** | A0 (Analog) | `GPIO 34` (ADC1_CH6) | Moisture reading (0-4095) |
| **Soil Moisture Sensor** | A0 (Analog) | `GPIO 35` (ADC1_CH7) | Soil saturation reading |
| **SW-420 Vibration Sensor** | D0 (Digital) | `GPIO 32` | Earthquake / Debris shock ISR |
| **Flame IR Sensor** | A0 (Analog) | `GPIO 33` (ADC1_CH5) | Wildfire detection |
| **HC-SR04 Ultrasonic** | TRIG | `GPIO 13` | Water level trigger pulse |
| | ECHO | `GPIO 12` (via divider) | Echo return (Voltage divider recommended) |
| **DHT22 Sensor** | DATA | `GPIO 4` (10k pullup)| Temp & Humidity |
| **MQ-2 / MQ-135 Smoke & Gas** | A0 (Analog) | `GPIO 39` (Sensor_VN / ADC1_CH3) | Smoke, Methane, LPG & Fire Fumes |
| | VCC / GND | `5V (VIN)` / `GND` | **⚠️ MQ heater coil requires 5V** |
| **Battery Voltage Sense** | ADC Divider | `GPIO 36` (VP) | LiPo battery monitoring |
| **Status LED Indicator** | Anode (+) | `GPIO 2` (Onboard) | Transmission Blinker |

---

## 📌 2. Node 2: Receiver, Alarm Siren & Multi-Hop Relay Node

| Component | Component Pin | ESP32 GPIO Pin | Description / Function |
|---|---|---|---|
| **LoRa SX1278** | NSS / SCK / MOSI / MISO / RST / DIO0 | `5`, `18`, `23`, `19`, `14`, `26` | Hardware SPI Bus |
| **0.96" OLED (SSD1306)** | SDA / SCL | `GPIO 21` / `GPIO 22` | I2C Bus |
| **Active Piezo Buzzer** | (+) Signal | `GPIO 25` | High-pitch Alarm Siren |
| **High-Power Strobe LED** | Anode (+) | `GPIO 2` | Visual strobe warning |
| **Relay Activity LED** | Anode (+) | `GPIO 4` | Forwarding packet indicator |
| **Power Supply** | Solar + TP4056 | `VIN` / `GND` | 5V / 3.7V Li-Ion battery |

---

## 📌 3. Base Station Gateway (Control Center)

| Component | Component Pin | ESP32 GPIO Pin | Description / Function |
|---|---|---|---|
| **LoRa SX1278** | NSS / SCK / MOSI / MISO / RST / DIO0 | `5`, `18`, `23`, `19`, `14`, `26` | Hardware SPI Bus |
| **Local Siren Buzzer** | (+) Signal | `GPIO 25` | Control room audible buzzer |
| **WiFi SoftAP Mode** | Antenna (Built-in) | Embedded | Offline Web Dashboard Host |
| **USB Serial Interface** | Micro-USB | `115200 Baud` | Real-time JSON stream to PC |

---

## 📐 4. Weighted Risk Assessment Mathematical Formula

$$\text{Risk Score} = (S_{\text{rain}} \times 0.25) + (S_{\text{vibration}} \times 0.20) + (S_{\text{soil}} \times 0.15) + (S_{\text{flame}} \times 0.15) + (S_{\text{smoke}} \times 0.15) + (S_{\text{temp}} \times 0.10)$$

### Threat Categorization:
- **0 – 39**: 🟢 **NORMAL** (System in power-saving sleep mode, 60s periodic heartbeat)
- **40 – 69**: 🟡 **WARNING** (Advisory mode, 15s sampling, moderate buzzer warning)
- **70 – 100**: 🔴 **EMERGENCY** (Continuous fast 3s monitoring, multi-hop relay priority, local sirens engaged, immediate rescue dispatch)
