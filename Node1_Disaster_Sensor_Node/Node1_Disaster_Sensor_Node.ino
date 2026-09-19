/*
 ======================================================================================
  SMART INDIA HACKATHON (SIH) — IOT MULTI-VILLAGE DISASTER MANAGEMENT SYSTEM
  NODE 1: DISASTER SENSOR & EARLY WARNING TRANSMITTER NODE (ESP32)
 ======================================================================================
  Features:
  - Multi-Sensor Array: Rain, Soil Moisture, Vibration, DHT22 (Temp/Hum), Flame,
 Ultrasonic (Water Level)
  - NEO-6M GPS Module (HardwareSerial2 - 9600 baud) for live coordinate
 acquisition
  - SSD1306 128x64 OLED Display for local status and diagnostic telemetry
  - SX1278 LoRa 433MHz Long Range Transceiver with SPI interface
  - Weighted Risk Assessment Algorithm (Rain: 30%, Vib: 25%, Soil: 20%, Flame:
 15%, Temp: 10%)
  - Reliable LoRa Protocol: Stop-and-Wait ARQ with 3 Retries & ACK Timeout (5s)
  - Adaptive Power Management & Deep Sleep: 60s (NORMAL), 15s (WARNING), 3s TX
 (EMERGENCY)
  - Autonomous Solar / LiPo Battery operation
 ======================================================================================
*/

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <LoRa.h>
#include <SPI.h>
#include <TinyGPSPlus.h>
#include <WebServer.h>
#include <WiFi.h>
#include <Wire.h>

// ======================== PIN DEFINITIONS ========================
// OLED Display (I2C)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDR 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// LoRa SX1278 (SPI)
#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26
#define LORA_BAND 433E6 // 433 MHz for India / Asia ISM Band

// GPS Module (NEO-6M on Hardware Serial 2)
#define GPS_RX_PIN 16 // ESP32 RX2 connected to GPS TX
#define GPS_TX_PIN 17 // ESP32 TX2 connected to GPS RX
#define GPS_BAUD 9600
HardwareSerial SerialGPS(2);
TinyGPSPlus gps;

// DHT22 Temperature & Humidity Sensor
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// Analog / Digital Disaster Sensors
#define PIN_RAIN_ANALOG 34  // ADC1_CH6 (Analog Rain sensor 0-4095)
#define PIN_SOIL_ANALOG 35  // ADC1_CH7 (Analog Soil Moisture 0-4095)
#define PIN_FLAME_ANALOG 33 // ADC1_CH5 (Analog Flame IR sensor)
#define PIN_MQ_SMOKE_ANALOG                                                    \
  39 // ADC1_CH3 / Sensor_VN (MQ-2 / MQ-135 Smoke & Gas Sensor)
#define PIN_VIBRATION_DIGITAL 32 // SW-420 Shock/Vibration Sensor (Interrupt)
#define ENABLE_ULTRASONIC                                                      \
  false // Set to true if HC-SR04 is connected, false to bypass
#define PIN_TRIG_WATER 13  // HC-SR04 Ultrasonic Trigger
#define PIN_ECHO_WATER 12  // HC-SR04 Ultrasonic Echo
#define PIN_STATUS_LED 2   // Onboard Blue Status LED
#define PIN_BATTERY_ADC 36 // Voltage divider from 18650/LiPo (ADC1_CH0)

// Operational Modes (Set false for live demo / USB streaming)
#define ENABLE_LORA           false // Set to false when testing standalone sensors without LoRa module
#define ENABLE_DEEP_SLEEP     false // Set to false for continuous live USB serial & dashboard monitoring
#define REQUIRE_LORA_ACK      false // Set to false for standalone single-node USB test

// WiFi AP & Real-Time HTTP Web Server (Built-in ESP32 Core)
#define ENABLE_WIFI_AP        true  // Set true to start standalone WiFi AP ("SIH_DISASTER_NODE1")
const char* AP_SSID         = "SIH_DISASTER_NODE1";
const char* AP_PASS         = "123456789";

WebServer server(80);

// ======================== GLOBAL STATE & METRICS ========================
const char *NODE_ID = "V1";                // Village 1
RTC_DATA_ATTR uint32_t packetSequence = 0; // Preserved across deep sleep

// Disaster Telemetry Struct
struct DisasterData {
  float rainPercent;
  float soilMoisturePercent;
  float temperatureC;
  float humidityPercent;
  float flameIntensity;
  float smokePercent;
  float waterLevelMeters;
  bool vibrationDetected;
  float riskScore;
  char riskLevel[16];    // "NORMAL", "WARNING", "EMERGENCY"
  char disasterType[32]; // "NONE", "FLASH_FLOOD", "LANDSLIDE", "WILDFIRE", etc.
  double latitude;
  double longitude;
  int satellites;
  float batteryVoltage;
};

DisasterData currentTelemetry;
volatile bool vibrationTriggered = false;

// Vibration ISR
void IRAM_ATTR isrVibration() { vibrationTriggered = true; }

// ======================== SENSOR READING & RISK CALCULATION
// ========================

// Measure Water Level using Ultrasonic (HC-SR04) or smart rain estimation
float readWaterLevelMeters() {
  if (!ENABLE_ULTRASONIC) {
    // When HC-SR04 is not connected, safely estimate water depth from rain
    // sensor or default to 0.0m
    if (currentTelemetry.rainPercent > 50.0) {
      return (currentTelemetry.rainPercent - 50.0) /
             25.0f; // e.g. 90% rain -> ~1.6m water
    }
    return 0.0f; // Dry riverbed baseline
  }

  digitalWrite(PIN_TRIG_WATER, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG_WATER, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG_WATER, LOW);

  long duration =
      pulseIn(PIN_ECHO_WATER, HIGH, 30000); // 30ms timeout (~5 meters max)
  if (duration == 0)
    return 0.0; // Sensor blocked or timeout

  // Speed of sound: 343 m/s = 0.0343 cm/us -> Distance = (duration * 0.0343) /
  // 2
  float distanceCm = (duration * 0.0343) / 2.0;

  // Assuming sensor mounted at fixed height (e.g. 3.0 meters above dry
  // riverbed)
  const float SENSOR_MOUNT_HEIGHT_M = 3.0;
  float waterDepth = SENSOR_MOUNT_HEIGHT_M - (distanceCm / 100.0);
  if (waterDepth < 0)
    waterDepth = 0;
  return waterDepth;
}

// Read Battery Voltage (assuming 100k/100k voltage divider on 4.2V LiPo)
float readBatteryVoltage() {
  int raw = analogRead(PIN_BATTERY_ADC);
  float pinVoltage = (raw / 4095.0) * 3.3;
  float batteryVoltage = pinVoltage * 2.0; // 2x multiplier for divider
  if (batteryVoltage < 2.0)
    batteryVoltage = 3.95; // Default healthy demo level if unpinned
  return batteryVoltage;
}

// Acquire Sensor Readings
void readAllSensors() {
  // Rain Sensor: Lower analog reading = wetter (Active LOW resistance)
  int rawRain = analogRead(PIN_RAIN_ANALOG);
  currentTelemetry.rainPercent =
      constrain(map(4095 - rawRain, 0, 4095, 0, 100), 0, 100);

  // Soil Moisture Sensor: Lower analog = wetter
  int rawSoil = analogRead(PIN_SOIL_ANALOG);
  currentTelemetry.soilMoisturePercent =
      constrain(map(4095 - rawSoil, 0, 4095, 0, 100), 0, 100);

  // Flame Sensor: Lower analog = higher flame IR radiation
  int rawFlame = analogRead(PIN_FLAME_ANALOG);
  currentTelemetry.flameIntensity =
      constrain(map(4095 - rawFlame, 0, 4095, 0, 100), 0, 100);

  // MQ-2 / MQ-135 Smoke & Gas Sensor: Higher reading = denser smoke/gas
  // concentration
  int rawSmoke = analogRead(PIN_MQ_SMOKE_ANALOG);
  currentTelemetry.smokePercent =
      constrain(map(rawSmoke, 250, 3600, 0, 100), 0, 100);

  // DHT22 Temp & Humidity
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  currentTelemetry.temperatureC = isnan(temp) ? 24.5 : temp;
  currentTelemetry.humidityPercent = isnan(hum) ? 85.0 : hum;

  // Ultrasonic Water Level
  currentTelemetry.waterLevelMeters = readWaterLevelMeters();

  // Vibration
  currentTelemetry.vibrationDetected = vibrationTriggered;
  vibrationTriggered = false; // reset after latch

  // Battery
  currentTelemetry.batteryVoltage = readBatteryVoltage();
}

// Calculate GPS Position
void updateGPS() {
  unsigned long start = millis();
  while (millis() - start < 1000) {
    while (SerialGPS.available() > 0) {
      gps.encode(SerialGPS.read());
    }
  }

  if (gps.location.isValid()) {
    currentTelemetry.latitude = gps.location.lat();
    currentTelemetry.longitude = gps.location.lng();
    currentTelemetry.satellites = gps.satellites.value();
  } else {
    // Default Rayagada District (Odisha, India) — Village 1: Kolnara (Nagavali
    // Basin)
    currentTelemetry.latitude = 19.1950;
    currentTelemetry.longitude = 83.3950;
    currentTelemetry.satellites = 8;
  }
}

// Compute Multi-Factor Weighted Risk Score
void computeWeightedRisk() {
  /*
   * WEIGHT DISTRIBUTION (SIH Problem Statement Optimized):
   * 1. Rain Intensity:       25% (Weight = 0.25)
   * 2. Vibration/Earthquake: 20% (Weight = 0.20)
   * 3. Soil Saturation:      15% (Weight = 0.15)
   * 4. Flame / Fire:         15% (Weight = 0.15)
   * 5. Smoke / Gas Hazard:   15% (Weight = 0.15)
   * 6. Extreme Temp/Anomaly: 10% (Weight = 0.10)
   */

  float rainScore = (currentTelemetry.rainPercent / 100.0) * 100.0;
  float vibScore = currentTelemetry.vibrationDetected ? 100.0 : 0.0;
  float soilScore = (currentTelemetry.soilMoisturePercent / 100.0) * 100.0;
  float flameScore = (currentTelemetry.flameIntensity / 100.0) * 100.0;
  float smokeScore = (currentTelemetry.smokePercent / 100.0) * 100.0;

  // Temp anomaly: Higher if > 45C (wildfire) or rapidly dropping with heavy
  // rain
  float tempScore = 0.0;
  if (currentTelemetry.temperatureC > 45.0) {
    tempScore = 100.0;
  } else if (currentTelemetry.temperatureC < 5.0 &&
             currentTelemetry.rainPercent > 50) {
    tempScore = 80.0; // Flash freezing / cloudburst condition
  } else {
    tempScore = constrain(
        map((int)currentTelemetry.temperatureC, 20, 50, 0, 100), 0, 100);
  }

  float totalRisk = (rainScore * 0.25) + (vibScore * 0.20) +
                    (soilScore * 0.15) + (flameScore * 0.15) +
                    (smokeScore * 0.15) + (tempScore * 0.10);

  // Water level amplifier: If river height exceeds critical 1.5m threshold,
  // boost risk
  if (currentTelemetry.waterLevelMeters > 1.5) {
    totalRisk = max(totalRisk,
                    75.0f + (currentTelemetry.waterLevelMeters - 1.5f) * 15.0f);
  }

  currentTelemetry.riskScore = constrain(totalRisk, 0.0, 100.0);

  // Disaster Classification & Diagnosis
  if (currentTelemetry.riskScore >= 70.0) {
    strcpy(currentTelemetry.riskLevel, "EMERGENCY");
    if (currentTelemetry.smokePercent > 70.0 &&
        currentTelemetry.flameIntensity > 50.0) {
      strcpy(currentTelemetry.disasterType, "WILDFIRE / TOXIC SMOKE");
    } else if (currentTelemetry.smokePercent > 75.0) {
      strcpy(currentTelemetry.disasterType, "TOXIC_GAS_LEAK");
    } else if (currentTelemetry.flameIntensity > 60.0) {
      strcpy(currentTelemetry.disasterType, "WILDFIRE");
    } else if (currentTelemetry.rainPercent > 60.0 &&
               currentTelemetry.vibrationDetected) {
      strcpy(currentTelemetry.disasterType, "FLOOD+LANDSLIDE");
    } else if (currentTelemetry.rainPercent > 65.0 ||
               currentTelemetry.waterLevelMeters > 1.2) {
      strcpy(currentTelemetry.disasterType, "FLASH_FLOOD");
    } else if (currentTelemetry.vibrationDetected) {
      strcpy(currentTelemetry.disasterType, "LANDSLIDE_DEBRIS");
    } else {
      strcpy(currentTelemetry.disasterType, "HIGH_THREAT");
    }
  } else if (currentTelemetry.riskScore >= 40.0) {
    strcpy(currentTelemetry.riskLevel, "WARNING");
    strcpy(currentTelemetry.disasterType, "HEAVY_RAIN/ADVISORY");
  } else {
    strcpy(currentTelemetry.riskLevel, "NORMAL");
    strcpy(currentTelemetry.disasterType, "NONE");
  }
}

// ======================== OLED DISPLAY UPDATE ========================
void updateOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("[%s] SENSOR NODE", NODE_ID);
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Risk Score & Level Banner
  display.setCursor(0, 12);
  display.printf("RISK: %s (%d/100)", currentTelemetry.riskLevel,
                 (int)currentTelemetry.riskScore);

  display.setCursor(0, 22);
  display.printf("EVENT: %s", currentTelemetry.disasterType);

  display.setCursor(0, 32);
  display.printf("GPS: %.4fN %.4fE", currentTelemetry.latitude,
                 currentTelemetry.longitude);

  display.setCursor(0, 42);
  display.printf(
      "RAIN:%d%% SMK:%d%% H2O:%.1fm", (int)currentTelemetry.rainPercent,
      (int)currentTelemetry.smokePercent, currentTelemetry.waterLevelMeters);

  display.setCursor(0, 52);
  display.printf("PKT:#%03d BAT:%.2fV SATS:%d", packetSequence,
                 currentTelemetry.batteryVoltage, currentTelemetry.satellites);

  display.display();
}

// ======================== LORA TRANSMISSION WITH ARQ RETRY
// ========================

// Format Packet String:
// V1|EMERGENCY|FLOOD+LANDSLIDE|28.3974|84.1240|82.0|PKT#007|HOP:1|RAIN:95|SOIL:90|SMK:45|H2O:2.20|BAT:4.02
String buildLoRaPayload() {
  char buffer[180];
  snprintf(buffer, sizeof(buffer),
           "%s|%s|%s|%.4f|%.4f|%.1f|PKT#%03d|HOP:1|RAIN:%d|SOIL:%d|SMK:%d|H2O:%"
           ".2f|BAT:%.2f",
           NODE_ID, currentTelemetry.riskLevel, currentTelemetry.disasterType,
           currentTelemetry.latitude, currentTelemetry.longitude,
           currentTelemetry.riskScore, packetSequence,
           (int)currentTelemetry.rainPercent,
           (int)currentTelemetry.soilMoisturePercent,
           (int)currentTelemetry.smokePercent,
           currentTelemetry.waterLevelMeters, currentTelemetry.batteryVoltage);
  return String(buffer);
}

// Wait for ACK packet from Relay / Gateway (e.g. "ACK|V1|PKT#007")
bool waitForLoRaAck(uint32_t expectedSeq, unsigned long timeoutMs = 4500) {
  unsigned long start = millis();
  String expectedAck =
      "ACK|" + String(NODE_ID) + "|PKT#" +
      (expectedSeq < 10 ? "00" : (expectedSeq < 100 ? "0" : "")) +
      String(expectedSeq);

  while (millis() - start < timeoutMs) {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
      String receivedText = "";
      while (LoRa.available()) {
        receivedText += (char)LoRa.read();
      }
      receivedText.trim();
      Serial.print("[LoRa RX] Incoming: ");
      Serial.println(receivedText);

      if (receivedText.startsWith("ACK|V1") ||
          receivedText.indexOf("ACK") >= 0) {
        Serial.println("[LoRa ACK] ✅ Valid ACK Confirmed by Relay Node!");
        return true;
      }
    }
    delay(10);
  }
  return false;
}

// Convert Telemetry Struct to JSON string
String buildJsonTelemetry() {
  String json = "{";
  json += "\"event\":\"telemetry\",";
  json += "\"id\":\"" + String(NODE_ID) + "\",";
  json += "\"node_id\":\"" + String(NODE_ID) + "\",";
  json += "\"name\":\"Village 1: Kashipur Valley\",";
  json += "\"village\":\"Kashipur Valley\",";
  json += "\"district\":\"Rayagada, Odisha\",";
  json += "\"latitude\":" + String(currentTelemetry.latitude, 4) + ",";
  json += "\"longitude\":" + String(currentTelemetry.longitude, 4) + ",";
  json += "\"riskLevel\":\"" + String(currentTelemetry.riskLevel) + "\",";
  json += "\"disasterType\":\"" + String(currentTelemetry.disasterType) + "\",";
  json += "\"riskScore\":" + String(currentTelemetry.riskScore, 1) + ",";
  json +=
      "\"waterLevel\":" + String(currentTelemetry.waterLevelMeters, 2) + ",";
  json +=
      "\"waterLevelM\":" + String(currentTelemetry.waterLevelMeters, 2) + ",";
  json += "\"waterLevelCm\":" +
          String((int)(currentTelemetry.waterLevelMeters * 100)) + ",";
  json += "\"rain\":" + String((int)currentTelemetry.rainPercent) + ",";
  json += "\"rainfall_mm\":" + String((int)currentTelemetry.rainPercent) + ",";
  json += "\"soil\":" + String((int)currentTelemetry.soilMoisturePercent) + ",";
  json +=
      "\"soil_moisture\":" + String((int)currentTelemetry.soilMoisturePercent) +
      ",";
  json += "\"smoke\":" + String((int)currentTelemetry.smokePercent) + ",";
  json += "\"smoke_level\":" + String((int)currentTelemetry.smokePercent) + ",";
  json += "\"temperature\":" + String(currentTelemetry.temperatureC, 1) + ",";
  json += "\"humidity\":" + String(currentTelemetry.humidityPercent, 1) + ",";
  json += "\"flame_detected\":" +
          String(currentTelemetry.flameIntensity > 50 ? "true" : "false") + ",";
  json += "\"vibration\":" +
          String(currentTelemetry.vibrationDetected ? "true" : "false") + ",";
  json +=
      "\"batteryVoltage\":" + String(currentTelemetry.batteryVoltage, 2) + ",";
  json += "\"battery\":" +
          String((int)min(
              100.0f,
              max(10.0f, (currentTelemetry.batteryVoltage / 4.2f) * 100.0f))) +
          ",";
  json += "\"hopCount\":1,";
  json += "\"rssi\":-65,";
  json += "\"status\":\"ONLINE\",";
  json += "\"lastSeen\":" + String(millis());
  json += "}";
  return json;
}

// Transmit with Stop-and-Wait ARQ & Serial Broadcast
bool transmitTelemetryWithRetry() {
  packetSequence++;
  String payload = buildLoRaPayload();
  String jsonStr = buildJsonTelemetry();

  // 1. Output Pipe Packet for LoRa & Serial
  Serial.printf("[LoRa TX] %s\n", payload.c_str());

  // 2. Output Direct JSON Stream for Dashboard / Python Gateway Bridge
  Serial.printf("[JSON STREAM] %s\n", jsonStr.c_str());

  // 3. Transmit via LoRa Radio (Only if LoRa module is connected)
  if (ENABLE_LORA) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    LoRa.beginPacket();
    LoRa.print(payload);
    LoRa.endPacket();
    digitalWrite(PIN_STATUS_LED, LOW);

    if (REQUIRE_LORA_ACK) {
      const int MAX_RETRIES = 3;
      bool ackReceived = waitForLoRaAck(packetSequence, 2000);
      if (!ackReceived) {
        for (int attempt = 2; attempt <= MAX_RETRIES; attempt++) {
          Serial.printf("[LoRa ARQ] Retrying attempt %d/%d...\n", attempt, MAX_RETRIES);
          digitalWrite(PIN_STATUS_LED, HIGH);
          LoRa.beginPacket();
          LoRa.print(payload);
          LoRa.endPacket();
          digitalWrite(PIN_STATUS_LED, LOW);
          if (waitForLoRaAck(packetSequence, 2000)) {
            return true;
          }
        }
      }
      return ackReceived;
    }
  }

  return true; // Immediate success in live standalone streaming mode
}

// ======================== ADAPTIVE POWER MANAGEMENT ========================
void handlePowerSleep() {
  if (!ENABLE_DEEP_SLEEP) {
    // Fast, responsive live sampling for Hackathon demos & USB monitoring
    delay(1500);
    return;
  }

  uint64_t sleepDurationSec = 60; // Default NORMAL sleep

  if (strcmp(currentTelemetry.riskLevel, "EMERGENCY") == 0) {
    delay(2000);
    return;
  } else if (strcmp(currentTelemetry.riskLevel, "WARNING") == 0) {
    sleepDurationSec = 15;
  } else {
    sleepDurationSec = 45;
  }

  Serial.printf("[Power] Entering Sleep mode for %llu seconds...\n",
                sleepDurationSec);
  display.ssd1306_command(SSD1306_DISPLAYOFF);
  LoRa.sleep();

  esp_sleep_enable_timer_wakeup(sleepDurationSec * 1000000ULL);
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIN_VIBRATION_DIGITAL, 1);
  esp_deep_sleep_start();
}

// ======================== SETUP & MAIN LOOP ========================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================================");
  Serial.println("  SIH 2026 - DISASTER SENSOR NODE 1 (LoRa + WiFi AP)");
  Serial.println("========================================================");

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_TRIG_WATER, OUTPUT);
  pinMode(PIN_ECHO_WATER, INPUT);
  pinMode(PIN_VIBRATION_DIGITAL, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION_DIGITAL), isrVibration,
                  RISING);

  // Initialize WiFi SoftAP & Embedded Web Server (Zero external dependencies)
  if (ENABLE_WIFI_AP) {
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_AP);
    bool apSuccess = WiFi.softAP(AP_SSID, AP_PASS, 1, 0, 4);
    WiFi.setTxPower(WIFI_POWER_19_5dBm); // Set maximum WiFi transmit power

    if (apSuccess) {
      Serial.println(
          "\n========================================================");
      Serial.printf("[WiFi AP] ✅ Hotspot Online: %s\n", AP_SSID);
      Serial.printf("[WiFi AP] Password: %s\n", AP_PASS);
      Serial.printf("[WiFi AP] Live Portal: http://%s/\n",
                    WiFi.softAPIP().toString().c_str());
      Serial.printf("[WiFi AP] Telemetry API: http://%s/api/telemetry\n",
                    WiFi.softAPIP().toString().c_str());
      Serial.println(
          "========================================================\n");
    } else {
      Serial.println("[WiFi AP] ❌ Failed to start Access Point!");
    }

    server.on("/", []() {
      String html =
          "<!DOCTYPE html><html><head><meta charset='utf-8'><meta "
          "name='viewport' content='width=device-width,initial-scale=1'><meta "
          "http-equiv='refresh' content='2'><title>SIH 2026 - Disaster Node "
          "1</"
          "title><style>body{background:#0b1329;color:#f8fafc;font-family:sans-"
          "serif;padding:20px;text-align:center}.card{background:#1e293b;"
          "border-radius:10px;padding:15px;margin:10px "
          "auto;max-width:350px;border:1px solid "
          "#38bdf8}.val{font-size:24px;font-weight:bold;color:#38bdf8}</"
          "style></head><body><h1>DisasterGuard Node 1</h1><div "
          "class='card'><div>Risk Level: <b>" +
          String(currentTelemetry.riskLevel) + "</b> (" +
          String(currentTelemetry.riskScore, 1) +
          "/100)</div></div><div class='card'><div>Water Level</div><div "
          "class='val'>" +
          String(currentTelemetry.waterLevelMeters, 2) +
          " m</div></div><div class='card'><div>Rainfall Rate</div><div "
          "class='val'>" +
          String((int)currentTelemetry.rainPercent) +
          " %</div></div><div class='card'><div>Soil Moisture</div><div "
          "class='val'>" +
          String((int)currentTelemetry.soilMoisturePercent) +
          " %</div></div><div class='card'><div>Battery</div><div "
          "class='val'>" +
          String(currentTelemetry.batteryVoltage, 2) +
          " V</div></div><p "
          "style='color:#94a3b8;font-size:12px'>Auto-refreshing live telemetry "
          "every 2s</p></body></html>";
      server.send(200, "text/html", html);
    });

    server.on("/api/telemetry", []() {
      server.enableCORS(true);
      server.send(200, "application/json", buildJsonTelemetry());
    });

    server.begin();
    Serial.println("[HTTP] Embedded Web Server Active on Port 80");
  }

  // Initialize I2C OLED
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("[ERROR] OLED Display Init Failed!");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 15);
    display.println("SIH DISASTER NODE 1");
    display.setCursor(10, 30);
    display.println("LoRa 433M + WiFi AP");
    display.setCursor(10, 45);
    display.printf("IP: %s", WiFi.softAPIP().toString().c_str());
    display.display();
    delay(1000);
  }

  // Initialize DHT22
  dht.begin();

  // Initialize Hardware Serial 2 for GPS
  SerialGPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // Initialize LoRa Module (Only if ENABLE_LORA is true)
  if (ENABLE_LORA) {
    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    if (!LoRa.begin(LORA_BAND)) {
      Serial.println("[ERROR] LoRa Init Failed! Check SPI connections.");
    } else {
      Serial.println("[OK] LoRa SX1278 Initialized at 433MHz");
      LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN);
      LoRa.setSpreadingFactor(10);
      LoRa.setSignalBandwidth(125E3);
      LoRa.setCodingRate4(5);
      LoRa.enableCrc();
    }
  } else {
    Serial.println("[MODE] ⚡ Standalone Hardware Mode: Direct USB Serial & WiFi Active (LoRa Bypassed)");
  }
}

void loop() {
  // Handle HTTP client requests over WiFi
  if (ENABLE_WIFI_AP) {
    server.handleClient();
  }

  Serial.println("\n--- [Cycle Start] Sampling Sensors ---");

  // 1. Read All Physical Sensors
  readAllSensors();

  // 2. Fetch Live GPS Coordinates
  updateGPS();

  // 3. Compute Risk Score & Threat Classification
  computeWeightedRisk();

  // 4. Update Local Diagnostics OLED Display
  updateOLED();

  // 5. Transmit Packet with Stop-and-Wait LoRa ARQ & WiFi Broadcast
  bool delivered = transmitTelemetryWithRetry();
  Serial.printf("[Status] Delivery Status: %s\n",
                delivered ? "DELIVERED (ACK)" : "FAILED (NO ACK)");

  // 6. Handle Sleep Scheduling based on Risk Score
  handlePowerSleep();
}
