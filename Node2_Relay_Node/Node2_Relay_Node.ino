/*
 ======================================================================================
  SMART INDIA HACKATHON (SIH) — IOT MULTI-VILLAGE DISASTER MANAGEMENT SYSTEM
  NODE 2: RECEIVER, LOCAL ALARM & MULTI-HOP RELAY NODE (ESP32)
 ======================================================================================
  Features:
  - LoRa SX1278 (433MHz) Transceiver for packet reception and mesh forwarding
  - Immediate Automated LoRa Acknowledgement (ACK) transmission to sender
  - Local Community Alarm: High-decibel Piezo Buzzer & High-brightness Strobe LED
  - OLED SSD1306 (128x64) displaying incoming telemetry, hop metrics & risk level
  - Multi-Hop Mesh Forwarding: Increments hop count (HOP: 1 -> HOP: 2) and relays
  - Intelligent Deduplication Cache: Prevents packet storm and infinite looping
 ======================================================================================
*/

#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ======================== PIN DEFINITIONS ========================
// OLED Display (I2C)
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define OLED_ADDR       0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// LoRa SX1278 (SPI)
#define LORA_SCK        18
#define LORA_MISO       19
#define LORA_MOSI       23
#define LORA_SS         5
#define LORA_RST        14
#define LORA_DIO0       26
#define LORA_BAND       433E6

// Local Warning Hardware
#define PIN_BUZZER_ALARM  25  // Active/PWM Buzzer for siren
#define PIN_STROBE_LED    2   // Visual Warning Flasher
#define PIN_RELAY_STATUS  4   // Forwarding activity LED

// Node Identity
const char* RELAY_NODE_ID = "V2_RELAY";

// Deduplication Cache Structure
#define DEDUP_CACHE_SIZE 10
String seenPacketIDs[DEDUP_CACHE_SIZE];
int dedupIndex = 0;

// Received Telemetry Cache
struct ReceivedPacket {
  String originNode;
  String riskLevel;
  String disasterType;
  float latitude;
  float longitude;
  float riskScore;
  String packetSeq;
  int hopCount;
  int rssi;
  float snr;
  unsigned long timestamp;
};

ReceivedPacket lastPacket;
bool hasNewData = false;

// ======================== HELPER FUNCTIONS ========================

// Check if packet was already received and forwarded
bool isDuplicate(String pktKey) {
  for (int i = 0; i < DEDUP_CACHE_SIZE; i++) {
    if (seenPacketIDs[i] == pktKey) return true;
  }
  return false;
}

// Add packet to deduplication cache
void registerPacket(String pktKey) {
  seenPacketIDs[dedupIndex] = pktKey;
  dedupIndex = (dedupIndex + 1) % DEDUP_CACHE_SIZE;
}

// Trigger Local Village Alarm Siren
void triggerLocalAlarm(String riskLevel, float riskScore) {
  if (riskLevel == "EMERGENCY" || riskScore >= 70.0) {
    Serial.println("[SIREN] 🚨 CRITICAL EMERGENCY SIREN ACTIVATED!");
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_STROBE_LED, HIGH);
      tone(PIN_BUZZER_ALARM, 2000, 300); // 2kHz tone
      delay(300);
      digitalWrite(PIN_STROBE_LED, LOW);
      tone(PIN_BUZZER_ALARM, 1200, 300); // 1.2kHz tone
      delay(300);
    }
    noTone(PIN_BUZZER_ALARM);
  } else if (riskLevel == "WARNING" || riskScore >= 40.0) {
    Serial.println("[SIREN] ⚠️ WARNING BEEPS ACTIVATED!");
    digitalWrite(PIN_STROBE_LED, HIGH);
    tone(PIN_BUZZER_ALARM, 1500, 200);
    delay(200);
    digitalWrite(PIN_STROBE_LED, LOW);
    noTone(PIN_BUZZER_ALARM);
  }
}

// Update OLED Display
void updateOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.printf("[%s] RELAY NODE", RELAY_NODE_ID);
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  if (hasNewData) {
    display.setCursor(0, 12);
    display.printf("FROM: %s | %s", lastPacket.originNode.c_str(), lastPacket.riskLevel.c_str());

    display.setCursor(0, 22);
    display.printf("DISASTER: %s", lastPacket.disasterType.c_str());

    display.setCursor(0, 32);
    display.printf("SCORE: %.0f/100  HOP: %d", lastPacket.riskScore, lastPacket.hopCount);

    display.setCursor(0, 42);
    display.printf("GPS: %.4f, %.4f", lastPacket.latitude, lastPacket.longitude);

    display.setCursor(0, 52);
    display.printf("RSSI:%ddBm SNR:%.1f", lastPacket.rssi, lastPacket.snr);
  } else {
    display.setCursor(10, 25);
    display.println("MONITORING LORA...");
    display.setCursor(10, 40);
    display.println("READY TO RELAY & ACK");
  }

  display.display();
}

// Send Instant ACK to Sender
void sendLoRaAck(String originNode, String pktSeq) {
  delay(150); // Small turnaround delay
  String ackPayload = "ACK|" + originNode + "|" + pktSeq;
  Serial.printf("[LoRa TX] Sending ACK: %s\n", ackPayload.c_str());

  LoRa.beginPacket();
  LoRa.print(ackPayload);
  LoRa.endPacket();
}

// Forward Packet to Next Hop / Base Station
void relayPacket(String rawPayload, int currentHop) {
  digitalWrite(PIN_RELAY_STATUS, HIGH);
  delay(400); // Backoff before forwarding to avoid ACK collision

  // Increment Hop Count
  String oldHopStr = "HOP:" + String(currentHop);
  String newHopStr = "HOP:" + String(currentHop + 1);
  rawPayload.replace(oldHopStr, newHopStr);

  Serial.printf("[LoRa RELAY] Forwarding Packet -> %s\n", rawPayload.c_str());

  LoRa.beginPacket();
  LoRa.print(rawPayload);
  LoRa.endPacket();

  digitalWrite(PIN_RELAY_STATUS, LOW);
}

// Parse Raw LoRa Telemetry Packet
// Format: V1|EMERGENCY|FLOOD+LANDSLIDE|28.3974|84.1240|82.0|PKT#007|HOP:1|...
void processIncomingPacket(String payload, int rssi, float snr) {
  Serial.printf("\n[LoRa RX] Received Payload (%d bytes, RSSI: %d dBm): %s\n", payload.length(), rssi, payload.c_str());

  // Ignore incoming ACK packets intended for someone else
  if (payload.startsWith("ACK|")) {
    Serial.println("[LoRa RX] (Ignoring transit ACK packet)");
    return;
  }

  // Tokenize payload by '|'
  char buf[200];
  payload.toCharArray(buf, sizeof(buf));
  char* token = strtok(buf, "|");

  int fieldIndex = 0;
  String originNode = "";
  String riskLevel = "";
  String disasterType = "";
  float lat = 0.0, lng = 0.0, score = 0.0;
  String pktSeq = "";
  int hop = 1;

  while (token != NULL) {
    if (fieldIndex == 0) originNode = String(token);
    else if (fieldIndex == 1) riskLevel = String(token);
    else if (fieldIndex == 2) disasterType = String(token);
    else if (fieldIndex == 3) lat = atof(token);
    else if (fieldIndex == 4) lng = atof(token);
    else if (fieldIndex == 5) score = atof(token);
    else if (fieldIndex == 6) pktSeq = String(token);
    else if (fieldIndex == 7) {
      String hopStr = String(token);
      hopStr.replace("HOP:", "");
      hop = hopStr.toInt();
    }
    token = strtok(NULL, "|");
    fieldIndex++;
  }

  if (originNode.length() == 0 || pktSeq.length() == 0) {
    Serial.println("[LoRa] Malformed packet received.");
    return;
  }

  String uniqueKey = originNode + "_" + pktSeq;

  // 1. Send Immediate ACK back to origin node
  sendLoRaAck(originNode, pktSeq);

  // 2. Check if already processed (deduplication)
  if (isDuplicate(uniqueKey)) {
    Serial.printf("[LoRa] Duplicate packet %s ignored for relaying.\n", uniqueKey.c_str());
    return;
  }
  registerPacket(uniqueKey);

  // 3. Update Local Storage & UI
  lastPacket.originNode = originNode;
  lastPacket.riskLevel = riskLevel;
  lastPacket.disasterType = disasterType;
  lastPacket.latitude = lat;
  lastPacket.longitude = lng;
  lastPacket.riskScore = score;
  lastPacket.packetSeq = pktSeq;
  lastPacket.hopCount = hop;
  lastPacket.rssi = rssi;
  lastPacket.snr = snr;
  lastPacket.timestamp = millis();
  hasNewData = true;

  updateOLED();

  // 4. Trigger Local Village Siren Alarm
  triggerLocalAlarm(riskLevel, score);

  // 5. Multi-Hop Forwarding to Control Center / Village 3
  relayPacket(payload, hop);
}

// ======================== SETUP & MAIN LOOP ========================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================================");
  Serial.println("  SIH 2024 - DISASTER RELAY & ALARM NODE 2 INITIALIZING");
  Serial.println("========================================================");

  pinMode(PIN_STROBE_LED, OUTPUT);
  pinMode(PIN_RELAY_STATUS, OUTPUT);
  pinMode(PIN_BUZZER_ALARM, OUTPUT);

  // OLED Init
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("[ERROR] OLED Display Init Failed!");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(5, 20);
    display.println("SIH RELAY NODE 2");
    display.setCursor(5, 35);
    display.println("LoRa Receiver Active");
    display.display();
    delay(1000);
  }

  // LoRa Init
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_BAND)) {
    Serial.println("[ERROR] LoRa Init Failed!");
    display.clearDisplay();
    display.setCursor(0, 20);
    display.println("LoRa INIT FAILED!");
    display.display();
  } else {
    Serial.println("[OK] LoRa SX1278 Receiver Ready at 433MHz");
    LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN);
    LoRa.setSpreadingFactor(10);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.enableCrc();
  }

  updateOLED();
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String payload = "";
    while (LoRa.available()) {
      payload += (char)LoRa.read();
    }
    payload.trim();
    int rssi = LoRa.packetRssi();
    float snr = LoRa.packetSnr();

    processIncomingPacket(payload, rssi, snr);
  }
}
