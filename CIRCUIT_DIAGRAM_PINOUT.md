# ⚡ Circuit Diagram & Complete Hardware Pinout Guide
### Smart India Hackathon (SIH) — IoT Multi-Village Disaster Management & Mesh Communication

---

## 📌 1. Node 1: Disaster Sensor Node (ESP32 DevKit V1 30-Pin)
**Strict 6 Physical Hardware Sensors Configuration:**

| Component / Sensor | Sensor Pin | ESP32 GPIO Pin | Description / Function |
|---|---|---|---|
| **1. Rain Sensor (Module)** | A0 (Analog) | `GPIO 34` (ADC1_CH6) | Rainfall intensity / Precipitation rate (0–100%) |
| **2. Soil Moisture Sensor** | A0 (Analog) | `GPIO 35` (ADC1_CH7) | Soil moisture & saturation (0–100%) |
| **3. SW-420 Vibration Sensor**| D0 (Digital) | `GPIO 32` | Seismic tremor / landslide debris shock ISR |
| **4. MQ-2 Smoke & Gas Sensor**| A0 (Analog) | `GPIO 39` (Sensor_VN) | Toxic smoke, combustible gas & fumes (PPM) |
| **5. Flame IR Sensor** | A0 (Analog) | `GPIO 33` (ADC1_CH5) | Wildfire & optical flame signature detection |
| **6. DHT22 Climate Sensor** | DATA | `GPIO 4` (10k pullup)| Ambient temperature (°C) & humidity (%) |
| **LoRa SX1278 (433MHz)** | NSS / CS | `GPIO 5` | SPI Chip Select |
| | SCK | `GPIO 18` | SPI Clock |
| | MOSI | `GPIO 23` | SPI MOSI |
| | MISO | `GPIO 19` | SPI MISO |
| | RST | `GPIO 14` | Reset Pin |
| | DIO0 | `GPIO 26` | Packet Done Interrupt |
| | VCC / GND | `3.3V` / `GND` | **⚠️ Power with 3.3V only!** |
| **NEO-6M GPS Module** | TX | `GPIO 16` (RX2) | Hardware Serial 2 Receive |
| | RX | `GPIO 17` (TX2) | Hardware Serial 2 Transmit |
| | VCC / GND | `3.3V - 5V` / `GND`| Power supply |
| **0.96" OLED (SSD1306)** | SDA | `GPIO 21` | I2C Data |
| | SCL | `GPIO 22` | I2C Clock |
| | VCC / GND | `3.3V` / `GND` | I2C Display |
| **Status LED Indicator** | Anode (+) | `GPIO 2` (Onboard) | Transmission Blinker |

---

## 📐 2. Weighted Disaster Risk Formula (6 Physical Sensors)

$$\text{Risk Score} = (S_{\text{rain}} \times 0.25) + (S_{\text{soil}} \times 0.20) + (S_{\text{vibration}} \times 0.20) + (S_{\text{flame}} \times 0.15) + (S_{\text{smoke}} \times 0.10) + (S_{\text{climate}} \times 0.10)$$

### Threat Categorization:
- **0 – 39**: 🟢 **NORMAL** (System in power-saving sleep mode, 60s periodic heartbeat)
- **40 – 69**: 🟡 **WARNING** (Advisory mode, 15s sampling, alert logging)
- **70 – 100**: 🔴 **EMERGENCY** (Continuous fast 3s monitoring, multi-hop relay priority, rescue dispatch alert)

---

## 📌 3. Reports & Analytics
- **Official PDF Export**: Generates government-standard OSDMA / DEOC Rayagada incident intelligence reports directly from the web command dashboard.
- **CSV / JSON Exports**: Full cryptographic audit logs for post-disaster analysis.
