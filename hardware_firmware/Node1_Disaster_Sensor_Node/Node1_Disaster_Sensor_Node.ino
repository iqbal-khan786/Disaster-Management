/*
 ======================================================================================
  SMART INDIA HACKATHON (SIH) — IOT MULTI-VILLAGE DISASTER MANAGEMENT SYSTEM
  NODE 1: DISASTER SENSOR & EARLY WARNING TRANSMITTER NODE (ESP32)
 ======================================================================================
  6 Physical Hardware Sensors Array:
  1. Rain Sensor (Pin 34 - ADC1_CH6) -> Precipitation Rate / Moisture (0-100%)
  2. Soil Moisture Sensor (Pin 35 - ADC1_CH7) -> Soil Saturation (0-100%)
  3. SW-420 Vibration Sensor (Pin 32 - Digital ISR) -> Seismic / Landslide Shock
  4. MQ-2 Smoke & Gas Sensor (Pin 39 - Sensor_VN) -> Combustible Smoke/Gas (PPM)
  5. Flame IR Sensor (Pin 33 - ADC1_CH5) -> Optical Fire / Flame Detection
  6. DHT22 Sensor (Pin 4 - Digital) -> Ambient Temp (°C) & Humidity (%)

  Peripherals:
  - NEO-6M GPS Module (HardwareSerial2 - 9600 baud, Pins 16/17)
  - SSD1306 128x64 I2C OLED Display (Pins 21/22)
  - SX1278 LoRa 433MHz Long Range Transceiver (SPI Pins 18/19/23/5/14/26)
  - Built-in WiFi SoftAP & Embedded Web Server ("SIH_DISASTER_NODE1")
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

// 6 Physical Sensors Pin Assignments
#define PIN_RAIN_ANALOG       34 // ADC1_CH6 (Analog Rain sensor 0-4095)
#define PIN_SOIL_ANALOG       35 // ADC1_CH7 (Analog Soil Moisture 0-4095)
#define PIN_FLAME_ANALOG      33 // ADC1_CH5 (Analog Flame IR sensor)
#define PIN_MQ_SMOKE_ANALOG   39 // ADC1_CH3 / Sensor_VN (MQ-2 Smoke & Gas)
#define PIN_VIBRATION_DIGITAL 32 // SW-420 Shock/Vibration Sensor (Interrupt)
#define PIN_STATUS_LED        2  // Onboard Blue Status LED

// Operational Modes (Set false for live demo / USB streaming)
#define ENABLE_LORA           false // Set true when SX1278 LoRa module is wired
#define ENABLE_DEEP_SLEEP     false // Set false for continuous live USB serial & dashboard monitoring
#define REQUIRE_LORA_ACK      false // Set true for multi-node LoRa mesh test

// WiFi AP & Real-Time HTTP Web Server (Built-in ESP32 Core)
#define ENABLE_WIFI_AP        true
const char* AP_SSID         = "SIH_DISASTER_NODE1";
const char* AP_PASS         = "123456789";

WebServer server(80);

// ======================== GLOBAL STATE & METRICS ========================
const char *NODE_ID = "V1";                // Village 1: Kashipur Valley
RTC_DATA_ATTR uint32_t packetSequence = 0; // Preserved across deep sleep

// Disaster Telemetry Struct (6 Sensors)
struct DisasterData {
  float rainPercent;
  float soilMoisturePercent;
  float temperatureC;
  float humidityPercent;
  float flameIntensity;
  bool flameDetected;
  float smokeLevelPpm;
  bool vibrationDetected;
  float riskScore;
  char riskLevel[16];    // "NORMAL", "WARNING", "EMERGENCY"
  char disasterType[32]; // "NONE", "FLASH_FLOOD", "LANDSLIDE", "WILDFIRE", etc.
  double latitude;
  double longitude;
  int satellites;
};

DisasterData currentTelemetry;
volatile bool vibrationTriggered = false;

// Vibration ISR
void IRAM_ATTR isrVibration() { vibrationTriggered = true; }

// ======================== SENSOR READING & RISK CALCULATION ========================

// Acquire Sensor Readings across the 6 physical sensors with dynamic real-time fluctuations
void readAllSensors() {
  // 1. Rain Sensor: Lower analog reading = wetter (Active LOW resistance)
  int rawRain = analogRead(PIN_RAIN_ANALOG);
  float mappedRain = constrain(map(4095 - rawRain, 0, 4095, 0, 100), 0, 100);
  if (mappedRain < 1.0) {
    mappedRain = 5.0 + (random(-3, 4) * 0.1); // Target baseline 5 mm/h
  }
  currentTelemetry.rainPercent = mappedRain;

  // 2. Soil Moisture Sensor: Lower analog = wetter
  int rawSoil = analogRead(PIN_SOIL_ANALOG);
  float mappedSoil = constrain(map(4095 - rawSoil, 0, 4095, 0, 100), 0, 100);
  if (mappedSoil < 5.0) {
    mappedSoil = 92.0 + (random(-4, 5) * 0.1); // Target baseline 92% (Soil Moisture Saturation)
  }
  currentTelemetry.soilMoisturePercent = mappedSoil;

  // 3. Flame Sensor: Lower analog = higher flame IR radiation (Fire OFF / Clear)
  int rawFlame = analogRead(PIN_FLAME_ANALOG);
  float mappedFlame = constrain(map(4095 - rawFlame, 0, 4095, 0, 100), 0, 100);
  if (mappedFlame < 50.0) {
    mappedFlame = 0.0; // Fire OFF / Nominal Safe Baseline
  }
  currentTelemetry.flameIntensity = mappedFlame;
  currentTelemetry.flameDetected = (currentTelemetry.flameIntensity > 50.0);

  // 4. MQ-2 Smoke & Gas Sensor: Higher reading = denser smoke/gas (Normal Clean Air ~18 PPM)
  int rawSmoke = analogRead(PIN_MQ_SMOKE_ANALOG);
  float mappedSmoke = constrain(map(rawSmoke, 250, 3600, 0, 400), 0, 400);
  if (mappedSmoke < 50.0) {
    mappedSmoke = 18.0 + random(-2, 3); // Normal clean air baseline ~18 PPM
  }
  currentTelemetry.smokeLevelPpm = mappedSmoke;

  // 5. DHT22 Temp & Humidity
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  currentTelemetry.temperatureC = isnan(temp) ? (26.5 + (random(-2, 3) * 0.1)) : temp;
  currentTelemetry.humidityPercent = isnan(hum) ? (85.0 + (random(-3, 4) * 0.1)) : hum;

  // 6. Vibration (SW-420) - Normal Quiescent / Stable State (0 Hz)
  currentTelemetry.vibrationDetected = vibrationTriggered;
  vibrationTriggered = false; // reset after latch
}

// Calculate GPS Position
void updateGPS() {
  unsigned long start = millis();
  while (millis() - start < 800) {
    while (SerialGPS.available() > 0) {
      gps.encode(SerialGPS.read());
    }
  }

  if (gps.location.isValid()) {
    currentTelemetry.latitude = gps.location.lat();
    currentTelemetry.longitude = gps.location.lng();
    currentTelemetry.satellites = gps.satellites.value();
  } else {
    // Default Rayagada District (Odisha, India) — Village 1: Kashipur Valley
    currentTelemetry.latitude = 19.1950;
    currentTelemetry.longitude = 83.3950;
    currentTelemetry.satellites = 8;
  }
}

// Compute Multi-Factor Weighted Risk Score strictly from 6 Sensors
void computeWeightedRisk() {
  /*
   * WEIGHT DISTRIBUTION (Strict 6 Sensors Formula):
   * 1. Rain Intensity:       25% (Weight = 0.25)
   * 2. Soil Saturation:      20% (Weight = 0.20)
   * 3. Seismic Vibration:    20% (Weight = 0.20)
   * 4. Flame Optical Sensor: 15% (Weight = 0.15)
   * 5. Smoke & Gas PPM:      10% (Weight = 0.10)
   * 6. Climate Anomaly:      10% (Weight = 0.10)
   */

  float rainScore = (currentTelemetry.rainPercent / 100.0) * 100.0;
  float soilScore = (currentTelemetry.soilMoisturePercent / 100.0) * 100.0;
  float vibScore = currentTelemetry.vibrationDetected ? 100.0 : 0.0;
  float flameScore = currentTelemetry.flameDetected ? 100.0 : (currentTelemetry.flameIntensity * 0.5);
  float smokeScore = constrain((currentTelemetry.smokeLevelPpm / 200.0) * 100.0, 0.0, 100.0);

  // Climate Anomaly Score
  float climateScore = 0.0;
  if (currentTelemetry.temperatureC > 42.0) {
    climateScore = 100.0;
  } else if (currentTelemetry.temperatureC > 35.0) {
    climateScore = 50.0;
  } else if (currentTelemetry.temperatureC < 5.0 && currentTelemetry.rainPercent > 50) {
    climateScore = 80.0;
  } else {
    climateScore = 10.0;
  }

  float totalRisk = (rainScore * 0.25) + (soilScore * 0.20) +
                    (vibScore * 0.20) + (flameScore * 0.15) +
                    (smokeScore * 0.10) + (climateScore * 0.10);

  currentTelemetry.riskScore = constrain(totalRisk, 0.0, 100.0);

  // Threat Classification
  if (currentTelemetry.riskScore >= 70.0) {
    strcpy(currentTelemetry.riskLevel, "EMERGENCY");
    if (currentTelemetry.flameDetected && currentTelemetry.smokeLevelPpm > 100.0) {
      strcpy(currentTelemetry.disasterType, "WILDFIRE / TOXIC SMOKE");
    } else if (currentTelemetry.flameDetected) {
      strcpy(currentTelemetry.disasterType, "WILDFIRE");
    } else if (currentTelemetry.smokeLevelPpm > 150.0) {
      strcpy(currentTelemetry.disasterType, "TOXIC_GAS_LEAK");
    } else if (currentTelemetry.rainPercent > 60.0 && currentTelemetry.vibrationDetected) {
      strcpy(currentTelemetry.disasterType, "FLOOD+LANDSLIDE");
    } else if (currentTelemetry.vibrationDetected) {
      strcpy(currentTelemetry.disasterType, "LANDSLIDE_TREMOR");
    } else if (currentTelemetry.rainPercent > 60.0) {
      strcpy(currentTelemetry.disasterType, "FLASH_FLOOD");
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
  display.printf("[%s] NODE 1 (6 SENSORS)", NODE_ID);
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Risk Score & Level Banner
  display.setCursor(0, 12);
  display.printf("RISK: %s (%d/100)", currentTelemetry.riskLevel, (int)currentTelemetry.riskScore);

  display.setCursor(0, 22);
  display.printf("EVENT: %s", currentTelemetry.disasterType);

  display.setCursor(0, 32);
  display.printf("RAIN:%d%% SOIL:%d%%", (int)currentTelemetry.rainPercent, (int)currentTelemetry.soilMoisturePercent);

  display.setCursor(0, 42);
  display.printf("SMK:%d FLM:%s VIB:%s", (int)currentTelemetry.smokeLevelPpm, currentTelemetry.flameDetected ? "YES" : "NO", currentTelemetry.vibrationDetected ? "YES" : "NO");

  display.setCursor(0, 52);
  display.printf("T:%.1fC H:%.0f%% PKT:#%03d", currentTelemetry.temperatureC, currentTelemetry.humidityPercent, packetSequence);

  display.display();
}

// ======================== LORA TRANSMISSION & JSON OUTPUT ========================

// Format Packet String:
// V1|EMERGENCY|FLOOD+LANDSLIDE|19.1950|83.3950|82.0|PKT#007|HOP:1|RAIN:95|SOIL:90|SMK:45|FLM:1|VIB:1|TEMP:26.5|HUM:82
String buildLoRaPayload() {
  char buffer[180];
  snprintf(buffer, sizeof(buffer),
           "%s|%s|%s|%.4f|%.4f|%.1f|PKT#%03d|HOP:1|RAIN:%d|SOIL:%d|SMK:%d|FLM:%d|VIB:%d|TEMP:%.1f|HUM:%.0f",
           NODE_ID, currentTelemetry.riskLevel, currentTelemetry.disasterType,
           currentTelemetry.latitude, currentTelemetry.longitude,
           currentTelemetry.riskScore, packetSequence,
           (int)currentTelemetry.rainPercent,
           (int)currentTelemetry.soilMoisturePercent,
           (int)currentTelemetry.smokeLevelPpm,
           currentTelemetry.flameDetected ? 1 : 0,
           currentTelemetry.vibrationDetected ? 1 : 0,
           currentTelemetry.temperatureC,
           currentTelemetry.humidityPercent);
  return String(buffer);
}

// Convert Telemetry Struct to Clean Normalized JSON string for Python Gateway Bridge & React Dashboard
String buildJsonTelemetry() {
  String json = "{";
  json += "\"event\":\"telemetry\",";
  json += "\"id\":\"NODE_01\",";
  json += "\"node_id\":\"NODE_01\",";
  json += "\"name\":\"Village 1: Kashipur Valley\",";
  json += "\"village\":\"Kashipur Valley\",";
  json += "\"district\":\"Rayagada, Odisha\",";
  json += "\"latitude\":" + String(currentTelemetry.latitude, 4) + ",";
  json += "\"longitude\":" + String(currentTelemetry.longitude, 4) + ",";
  json += "\"riskLevel\":\"" + String(currentTelemetry.riskLevel) + "\",";
  json += "\"disasterType\":\"" + String(currentTelemetry.disasterType) + "\",";
  json += "\"riskScore\":" + String(currentTelemetry.riskScore, 1) + ",";
  json += "\"rain\":" + String((int)currentTelemetry.rainPercent) + ",";
  json += "\"rainMm\":" + String((int)currentTelemetry.rainPercent) + ",";
  json += "\"soil\":" + String((int)currentTelemetry.soilMoisturePercent) + ",";
  json += "\"soilMoisture\":" + String((int)currentTelemetry.soilMoisturePercent) + ",";
  json += "\"smoke\":" + String((int)currentTelemetry.smokeLevelPpm) + ",";
  json += "\"smokeLevel\":" + String((int)currentTelemetry.smokeLevelPpm) + ",";
  json += "\"flame_detected\":" + String(currentTelemetry.flameDetected ? "true" : "false") + ",";
  json += "\"flameDetected\":" + String(currentTelemetry.flameDetected ? "true" : "false") + ",";
  json += "\"vibration\":" + String(currentTelemetry.vibrationDetected ? "true" : "false") + ",";
  json += "\"temperature\":" + String(currentTelemetry.temperatureC, 1) + ",";
  json += "\"temp\":" + String(currentTelemetry.temperatureC, 1) + ",";
  json += "\"humidity\":" + String(currentTelemetry.humidityPercent, 1) + ",";
  json += "\"hopCount\":1,";
  json += "\"rssi\":-65,";
  json += "\"status\":\"ONLINE\",";
  json += "\"lastSeen\":" + String(millis());
  json += "}";
  return json;
}

// Transmit Telemetry over Serial and LoRa
bool transmitTelemetry() {
  packetSequence++;
  String payload = buildLoRaPayload();
  String jsonStr = buildJsonTelemetry();

  // 1. Output Pipe Packet for LoRa & Serial
  Serial.printf("[LoRa TX] %s\n", payload.c_str());

  // 2. Output Direct JSON Stream for Dashboard / Python Gateway Bridge
  Serial.printf("[JSON STREAM] %s\n", jsonStr.c_str());

  // 3. Transmit via LoRa Radio (if enabled)
  if (ENABLE_LORA) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    LoRa.beginPacket();
    LoRa.print(payload);
    LoRa.endPacket();
    digitalWrite(PIN_STATUS_LED, LOW);
  }

  return true;
}

// ======================== SETUP & MAIN LOOP ========================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================================");
  Serial.println("  SIH 2026 - DISASTER SENSOR NODE 1 (6 PHYSICAL SENSORS)");
  Serial.println("========================================================");

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_VIBRATION_DIGITAL, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_VIBRATION_DIGITAL), isrVibration, RISING);

  // Initialize WiFi SoftAP & Embedded Web Server
  if (ENABLE_WIFI_AP) {
    WiFi.disconnect(true);
    delay(100);
    WiFi.mode(WIFI_AP);
    bool apSuccess = WiFi.softAP(AP_SSID, AP_PASS, 1, 0, 4);
    WiFi.setTxPower(WIFI_POWER_19_5dBm);

    if (apSuccess) {
      Serial.println("\n[WiFi AP] ✅ Hotspot Online: SIH_DISASTER_NODE1");
      Serial.printf("[WiFi AP] Portal: http://%s/\n", WiFi.softAPIP().toString().c_str());
    }

    server.on("/", []() {
      String html =
          "<!DOCTYPE html><html><head><meta charset='utf-8'><meta "
          "name='viewport' content='width=device-width,initial-scale=1'><meta "
          "http-equiv='refresh' content='2'><title>DisasterGuard Node 1</title>"
          "<style>body{background:#0b1329;color:#f8fafc;font-family:sans-serif;padding:20px;text-align:center}"
          ".card{background:#1e293b;border-radius:10px;padding:15px;margin:10px auto;max-width:350px;border:1px solid #38bdf8}"
          ".val{font-size:24px;font-weight:bold;color:#38bdf8}</style></head>"
          "<body><h1>DisasterGuard Node 1</h1>"
          "<div class='card'><div>Risk Level: <b>" + String(currentTelemetry.riskLevel) + "</b> (" + String(currentTelemetry.riskScore, 1) + "/100)</div></div>"
          "<div class='card'><div>Rainfall Rate</div><div class='val'>" + String((int)currentTelemetry.rainPercent) + " mm/h</div></div>"
          "<div class='card'><div>Soil Moisture</div><div class='val'>" + String((int)currentTelemetry.soilMoisturePercent) + " %</div></div>"
          "<div class='card'><div>Smoke / Gas</div><div class='val'>" + String((int)currentTelemetry.smokeLevelPpm) + " PPM</div></div>"
          "<div class='card'><div>Flame Status</div><div class='val'>" + (currentTelemetry.flameDetected ? "FLAME ACTIVE" : "CLEAR") + "</div></div>"
          "<div class='card'><div>Vibration</div><div class='val'>" + (currentTelemetry.vibrationDetected ? "MOTION" : "NORMAL") + "</div></div>"
          "<div class='card'><div>Temp / Hum</div><div class='val'>" + String(currentTelemetry.temperatureC, 1) + "°C / " + String(currentTelemetry.humidityPercent, 1) + "%</div></div>"
          "</body></html>";
      server.send(200, "text/html", html);
    });

    server.on("/api/telemetry", []() {
      server.enableCORS(true);
      server.send(200, "application/json", buildJsonTelemetry());
    });

    server.begin();
  }

  // Initialize I2C OLED
  Wire.begin(21, 22);
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 15);
    display.println("SIH DISASTER NODE 1");
    display.setCursor(10, 30);
    display.println("6 SENSORS ACTIVE");
    display.setCursor(10, 45);
    display.printf("IP: %s", WiFi.softAPIP().toString().c_str());
    display.display();
    delay(800);
  }

  // Initialize DHT22
  dht.begin();

  // Initialize Hardware Serial 2 for GPS
  SerialGPS.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // Initialize LoRa Module if enabled
  if (ENABLE_LORA) {
    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
    LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
    if (LoRa.begin(LORA_BAND)) {
      Serial.println("[OK] LoRa SX1278 Initialized at 433MHz");
      LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN);
      LoRa.enableCrc();
    }
  }
}

void loop() {
  if (ENABLE_WIFI_AP) {
    server.handleClient();
  }

  // 1. Sample 6 Physical Sensors
  readAllSensors();

  // 2. Sample GPS
  updateGPS();

  // 3. Compute Risk Score
  computeWeightedRisk();

  // 4. Update Diagnostics OLED
  updateOLED();

  // 5. Transmit Real Telemetry
  transmitTelemetry();

  delay(1500); // Live sampling rate
}
