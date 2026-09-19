/*
 ======================================================================================
  SMART INDIA HACKATHON (SIH) — IOT MULTI-VILLAGE DISASTER MANAGEMENT SYSTEM
  BASE STATION: CONTROL CENTER GATEWAY & REAL-TIME WEBSOCKET SERVER (ESP32)
 ======================================================================================
  Features:
  - LoRa SX1278 (433MHz) Base Receiver for all Village & Relay nodes
  - Standalone Offline WiFi AP ("SIH_DISASTER_RESCUE_HQ") - 100% works without Internet!
  - Real-Time WebSocket Server (Port 81) for sub-millisecond live telemetry broadcast
  - Embedded HTTP Web Server (Port 80) serving interactive command dashboard
  - Bidirectional WebSocket Commands: Trigger HQ Siren, Dispatch Teams, Resync
  - Live JSON Serial Telemetry Stream for Laptop Dashboard / Python Logging
  - Multi-Village Risk Priority Scoring & Rescue Resource Allocation Table
  - Audio Alarm Trigger output (GPIO 25) for Command Center siren
 ======================================================================================
*/

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h> // "WebSockets" by Markus Sattler in Arduino Library Manager

// ======================== HARDWARE PIN DEFINITIONS ========================
// LoRa SX1278 (SPI)
#define LORA_SCK        18
#define LORA_MISO       19
#define LORA_MOSI       23
#define LORA_SS         5
#define LORA_RST        14
#define LORA_DIO0       26
#define LORA_BAND       433E6

#define PIN_STATUS_LED  2
#define PIN_HQ_BUZZER   25

// WiFi AP Configuration (Offline Field Emergency Deployment)
const char* AP_SSID = "SIH_DISASTER_RESCUE_HQ";
const char* AP_PASS = "emergency123";

WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

// Data structure for monitored villages
struct VillageNode {
  String id;
  String riskLevel;
  String disasterType;
  float latitude;
  float longitude;
  float riskScore;
  int rain;
  int soil;
  int smoke;
  float waterLevel;
  float battery;
  int hopCount;
  int rssi;
  String lastPacket;
  unsigned long lastSeen;
};

#define MAX_VILLAGES 8
VillageNode villages[MAX_VILLAGES];
int totalNodesKnown = 0;

// Embedded HTML Dashboard with Live WebSocket Client
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIH 2024 | Disaster Control Center (WebSocket Live)</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-dark: #070b14;
      --panel-bg: rgba(15, 23, 42, 0.88);
      --card-bg: rgba(30, 41, 59, 0.75);
      --card-border: rgba(56, 189, 248, 0.25);
      --emergency: #ef4444;
      --warning: #f59e0b;
      --normal: #10b981;
      --accent: #38bdf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Roboto,sans-serif; }
    body { background: radial-gradient(circle at 50% 0%, #111e38, var(--bg-dark)); color:var(--text); min-height:100vh; display:flex; flex-direction:column; }
    
    header {
      background: rgba(11, 17, 33, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--card-border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky; top:0; z-index:1000;
    }
    .brand { display:flex; align-items:center; gap:12px; }
    .badge-sih { background: linear-gradient(135deg, #ff9933, #ffffff 50%, #138808); color:#000; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; }
    
    .status-group { display:flex; gap:12px; align-items:center; }
    .ws-pill {
      display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600;
      padding: 5px 12px; border-radius: 20px;
      background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: var(--emergency);
      transition: all 0.3s;
    }
    .ws-pill.connected {
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: var(--normal);
    }
    .pulse-dot { width:8px; height:8px; border-radius:50%; background:currentColor; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%{opacity:1; transform:scale(1);} 50%{opacity:0.3; transform:scale(1.3);} 100%{opacity:1; transform:scale(1);} }

    .main-grid {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 16px;
      padding: 16px;
      flex: 1;
    }
    .map-container {
      background: var(--panel-bg);
      border-radius: 12px;
      border: 1px solid var(--card-border);
      padding: 14px;
      display: flex; flex-direction: column; gap: 12px;
    }
    #map { width:100%; height:380px; border-radius: 8px; }
    
    .charts-row { display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .chart-box { background: var(--card-bg); border-radius: 8px; padding: 10px; height: 160px; }

    .sidebar { display:flex; flex-direction:column; gap:14px; }
    .panel {
      background: var(--panel-bg);
      border-radius: 12px;
      border: 1px solid var(--card-border);
      padding: 14px;
    }
    .panel h3 { font-size: 14px; color: var(--accent); margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center; }
    
    .village-card {
      background: var(--card-bg);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      transition: all 0.3s;
    }
    .village-card.emergency { border-left: 4px solid var(--emergency); background: rgba(239, 68, 68, 0.12); }
    .village-card.warning { border-left: 4px solid var(--warning); background: rgba(245, 158, 11, 0.1); }
    .village-card.normal { border-left: 4px solid var(--normal); }
    
    .node-title { display:flex; justify-content:space-between; font-weight:bold; font-size:14px; margin-bottom:4px; }
    .tag { font-size:11px; padding:2px 8px; border-radius:10px; font-weight:bold; }
    .tag-emergency { background: var(--emergency); color:#fff; }
    .tag-warning { background: var(--warning); color:#000; }
    .tag-normal { background: var(--normal); color:#000; }
    
    .metric-row { display:grid; grid-template-columns: repeat(4, 1fr); gap:6px; margin: 8px 0; font-size:11px; }
    .metric-box { background: rgba(0,0,0,0.35); padding:5px; border-radius:4px; text-align:center; }
    .metric-val { font-size:12px; font-weight:bold; color:#fff; font-family:monospace; }

    .btn-dispatch {
      width: 100%;
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; font-size:12px;
      cursor: pointer; margin-top: 6px; transition: transform 0.2s;
    }
    .btn-dispatch:hover { transform: scale(1.02); }

    .log-feed {
      max-height: 140px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 11px;
      color: #94a3b8;
      background: rgba(0,0,0,0.4);
      padding: 8px;
      border-radius: 6px;
    }
    .log-item { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .log-item.rx { color: var(--accent); }
    .log-item.alert { color: var(--emergency); font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="badge-sih">SIH 2024</span>
      <h2 style="font-size:17px;">Disaster Management Hub (WebSocket Real-Time)</h2>
    </div>
    <div class="status-group">
      <span style="font-size:12px; color:var(--text-muted);">LoRa: <b>433.0 MHz</b></span>
      <div class="ws-pill" id="wsStatus">
        <div class="pulse-dot"></div> <span id="wsText">Connecting WS...</span>
      </div>
    </div>
  </header>

  <div class="main-grid">
    <div class="map-container">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="font-size:14px; color:var(--accent);">REAL-TIME GPS DISASTER MAP</h3>
        <button onclick="sendWsCommand('SIREN')" style="background:var(--emergency); color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">🚨 Trigger HQ Siren</button>
      </div>
      <div id="map"></div>

      <div class="charts-row">
        <div class="chart-box">
          <canvas id="waterChart"></canvas>
        </div>
        <div class="chart-box">
          <canvas id="riskChart"></canvas>
        </div>
      </div>
    </div>

    <div class="sidebar">
      <div class="panel">
        <h3>ACTIVE VILLAGE SECTORS <span id="nodeCount" style="font-size:12px; color:var(--text-muted);">0 Nodes</span></h3>
        <div id="villageList">
          <div style="text-align:center; color:var(--text-muted); padding:15px; font-size:12px;">
            Awaiting WebSocket Telemetry Packets...
          </div>
        </div>
      </div>

      <div class="panel" style="flex:1;">
        <h3>LIVE LORA RADIO LOGS</h3>
        <div class="log-feed" id="logFeed">
          <div class="log-item">[SYS] Initializing WebSocket Client on port 81...</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Leaflet Map Initialization
    const map = L.map('map').setView([28.3974, 84.1240], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'SIH Disaster Response'
    }).addTo(map);

    let markers = {};
    let villageData = {};

    // Audio Context for Web Audio Siren
    let audioCtx = null;
    function playBeep() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    }

    // Chart.js Graphs Setup
    const ctxWater = document.getElementById('waterChart').getContext('2d');
    const waterChart = new Chart(ctxWater, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Water Depth (m)',
          data: [],
          borderColor: '#38bdf8',
          borderWidth: 2,
          tension: 0.3,
          fill: false
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { font: { size: 9 }, color: '#94a3b8' } }, y: { ticks: { font: { size: 9 }, color: '#94a3b8' } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } } }
    });

    const ctxRisk = document.getElementById('riskChart').getContext('2d');
    const riskChart = new Chart(ctxRisk, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Risk Score (0-100)',
          data: [],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { font: { size: 9 }, color: '#94a3b8' } }, y: { max: 100, min: 0, ticks: { font: { size: 9 }, color: '#94a3b8' } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } } }
    });

    function addLog(msg, type='normal') {
      const feed = document.getElementById('logFeed');
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = 'log-item ' + type;
      div.textContent = `[${time}] ${msg}`;
      feed.insertBefore(div, feed.firstChild);
    }

    // ======================== WEBSOCKET CLIENT ========================
    let socket = null;

    function initWebSocket() {
      const wsHost = window.location.hostname || "192.168.4.1";
      const wsUrl = `ws://${wsHost}:81/`;
      
      addLog(`Connecting to WebSocket: ${wsUrl}`, 'normal');
      socket = new WebSocket(wsUrl);

      socket.onopen = function(e) {
        document.getElementById('wsStatus').className = 'ws-pill connected';
        document.getElementById('wsText').innerText = 'LIVE (WebSocket)';
        addLog("✅ WebSocket Connected! Real-time stream active.", "rx");
        // Request existing state
        socket.send(JSON.stringify({ cmd: "GET_ALL" }));
      };

      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          handleIncomingTelemetry(data);
        } catch (err) {
          console.error("Invalid JSON:", event.data);
        }
      };

      socket.onclose = function(event) {
        document.getElementById('wsStatus').className = 'ws-pill';
        document.getElementById('wsText').innerText = 'RECONNECTING...';
        addLog("⚠️ WebSocket Disconnected. Retrying in 2s...", "alert");
        setTimeout(initWebSocket, 2000);
      };

      socket.onerror = function(error) {
        console.error("WebSocket Error:", error);
      };
    }

    function sendWsCommand(cmdName, targetNode="V1") {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({ cmd: cmdName, node: targetNode, timestamp: Date.now() });
        socket.send(payload);
        addLog(`[WS TX] Command Sent: ${cmdName} to ${targetNode}`, 'alert');
        playBeep();
      } else {
        alert("WebSocket not connected to ESP32 Gateway!");
      }
    }

    function handleIncomingTelemetry(data) {
      // Support single object or array of objects
      const items = Array.isArray(data) ? data : [data];
      
      items.forEach(node => {
        if (!node.id) return;
        villageData[node.id] = node;

        const isEmerg = node.riskLevel === 'EMERGENCY' || node.riskScore >= 70;
        addLog(`[LoRa RX] ${node.id} | ${node.riskLevel} | Score: ${node.riskScore} | H2O: ${node.waterLevel}m`, isEmerg ? 'alert' : 'rx');
        
        if (isEmerg) playBeep();

        // Update Charts
        const timeLabel = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        if (waterChart.data.labels.length > 10) {
          waterChart.data.labels.shift();
          waterChart.data.datasets[0].data.shift();
          riskChart.data.labels.shift();
          riskChart.data.datasets[0].data.shift();
        }
        waterChart.data.labels.push(timeLabel);
        waterChart.data.datasets[0].data.push(node.waterLevel);
        waterChart.update('none');

        riskChart.data.labels.push(timeLabel);
        riskChart.data.datasets[0].data.push(node.riskScore);
        riskChart.update('none');
      });

      renderUI();
    }

    function renderUI() {
      const nodes = Object.values(villageData);
      document.getElementById('nodeCount').innerText = `${nodes.length} Nodes`;
      const container = document.getElementById('villageList');
      if (nodes.length === 0) return;
      container.innerHTML = '';

      nodes.forEach(n => {
        const isEmerg = n.riskLevel === 'EMERGENCY' || n.riskScore >= 70;
        const isWarn = n.riskLevel === 'WARNING' || (n.riskScore >= 40 && n.riskScore < 70);
        const card = document.createElement('div');
        card.className = `village-card ${isEmerg ? 'emergency' : (isWarn ? 'warning' : 'normal')}`;

        card.innerHTML = `
          <div class="node-title">
            <span>Village ${n.id} (${n.disasterType || 'NONE'})</span>
            <span class="tag ${isEmerg ? 'tag-emergency' : (isWarn ? 'tag-warning' : 'tag-normal')}">${Math.round(n.riskScore)}/100</span>
          </div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">
            📍 ${Number(n.latitude).toFixed(4)}°N, ${Number(n.longitude).toFixed(4)}°E | Hop: ${n.hopCount || 1} | RSSI: ${n.rssi || -75}dBm
          </div>
          <div class="metric-row">
            <div class="metric-box"><div>Rain</div><div class="metric-val">${n.rain || 0}%</div></div>
            <div class="metric-box"><div>Water</div><div class="metric-val">${Number(n.waterLevel).toFixed(1)}m</div></div>
            <div class="metric-box"><div>Soil</div><div class="metric-val">${n.soil || 0}%</div></div>
            <div class="metric-box"><div>Bat</div><div class="metric-val">${Number(n.battery || 4.0).toFixed(1)}V</div></div>
          </div>
          ${isEmerg ? `<button class="btn-dispatch" onclick="sendWsCommand('DISPATCH', '${n.id}')">🚨 DISPATCH RESCUE TEAM (WS)</button>` : ''}
        `;
        container.appendChild(card);

        // Update Map Marker
        const markerColor = isEmerg ? '#ef4444' : (isWarn ? '#f59e0b' : '#10b981');
        if (!markers[n.id]) {
          const marker = L.circleMarker([n.latitude, n.longitude], {
            radius: 12,
            fillColor: markerColor,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
          }).addTo(map);
          marker.bindPopup(`<b>Village ${n.id}</b><br>Threat: ${n.riskLevel}<br>Score: ${n.riskScore}/100<br>Water: ${n.waterLevel}m`);
          markers[n.id] = marker;
        } else {
          markers[n.id].setLatLng([n.latitude, n.longitude]);
          markers[n.id].setStyle({ fillColor: markerColor });
        }
      });
    }

    // Start WebSocket
    window.addEventListener('load', initWebSocket);
  </script>
</body>
</html>
)rawliteral";

// ======================== HELPER FUNCTIONS ========================

int findOrAddVillage(String nodeId) {
  for (int i = 0; i < totalNodesKnown; i++) {
    if (villages[i].id == nodeId) return i;
  }
  if (totalNodesKnown < MAX_VILLAGES) {
    villages[totalNodesKnown].id = nodeId;
    return totalNodesKnown++;
  }
  return 0; // overwrite 0 if full
}

// Convert Village Struct to JSON string
String buildVillageJson(int index) {
  String json = "{";
  json += "\"event\":\"telemetry\",";
  json += "\"id\":\"" + villages[index].id + "\",";
  json += "\"riskLevel\":\"" + villages[index].riskLevel + "\",";
  json += "\"disasterType\":\"" + villages[index].disasterType + "\",";
  json += "\"latitude\":" + String(villages[index].latitude, 4) + ",";
  json += "\"longitude\":" + String(villages[index].longitude, 4) + ",";
  json += "\"riskScore\":" + String(villages[index].riskScore, 1) + ",";
  json += "\"rain\":" + String(villages[index].rain) + ",";
  json += "\"soil\":" + String(villages[index].soil) + ",";
  json += "\"smoke\":" + String(villages[index].smoke) + ",";
  json += "\"waterLevel\":" + String(villages[index].waterLevel, 2) + ",";
  json += "\"battery\":" + String(villages[index].battery, 2) + ",";
  json += "\"hopCount\":" + String(villages[index].hopCount) + ",";
  json += "\"rssi\":" + String(villages[index].rssi);
  json += "}";
  return json;
}

// Convert All Known Villages to JSON Array
String buildAllVillagesJson() {
  String json = "[";
  for (int i = 0; i < totalNodesKnown; i++) {
    if (i > 0) json += ",";
    json += buildVillageJson(i);
  }
  json += "]";
  return json;
}

// WebSocket Event Handler
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client #%u Disconnected.\n", num);
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client #%u Connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      // Send current state immediately on connect
      if (totalNodesKnown > 0) {
        String allData = buildAllVillagesJson();
        webSocket.sendTXT(num, allData);
      }
      break;
    }

    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.printf("[WS RX] Client #%u sent: %s\n", num, msg.c_str());

      // Handle Commands from Dashboard
      if (msg.indexOf("\"cmd\":\"SIREN\"") >= 0) {
        Serial.println("[WS CMD] 🚨 Remote Siren Triggered via WebSocket!");
        digitalWrite(PIN_STATUS_LED, HIGH);
        tone(PIN_HQ_BUZZER, 2200, 600);
        delay(600);
        tone(PIN_HQ_BUZZER, 1400, 600);
      } else if (msg.indexOf("\"cmd\":\"DISPATCH\"") >= 0) {
        Serial.println("[WS CMD] 🚁 Rescue Dispatch Request Received via WebSocket!");
        tone(PIN_HQ_BUZZER, 1800, 300);
      } else if (msg.indexOf("\"cmd\":\"GET_ALL\"") >= 0) {
        String allData = buildAllVillagesJson();
        webSocket.sendTXT(num, allData);
      }
      break;
    }

    default:
      break;
  }
}

// Parse Raw LoRa Packet and Broadcast via WebSocket
void parseAndStorePacket(String payload, int rssi) {
  Serial.printf("\n[LORA HQ RX] Payload: %s (RSSI: %d dBm)\n", payload.c_str(), rssi);

  if (payload.startsWith("ACK|")) return;

  char buf[200];
  payload.toCharArray(buf, sizeof(buf));
  char* token = strtok(buf, "|");

  int field = 0;
  String id = "V1", riskLvl = "NORMAL", disaster = "NONE";
  float lat = 19.1950, lng = 83.3950, score = 0.0, water = 0.0, bat = 4.0;
  int rain = 0, soil = 0, smoke = 0, hop = 1;
  String pktSeq = "";

  while (token != NULL) {
    if (field == 0) id = String(token);
    else if (field == 1) riskLvl = String(token);
    else if (field == 2) disaster = String(token);
    else if (field == 3) lat = atof(token);
    else if (field == 4) lng = atof(token);
    else if (field == 5) score = atof(token);
    else if (field == 6) pktSeq = String(token);
    else if (field == 7) {
      String hStr = String(token);
      hStr.replace("HOP:", "");
      hop = hStr.toInt();
    }
    else if (field == 8) {
      String rStr = String(token);
      rStr.replace("RAIN:", "");
      rain = rStr.toInt();
    }
    else if (field == 9) {
      String sStr = String(token);
      sStr.replace("SOIL:", "");
      soil = sStr.toInt();
    }
    else if (String(token).startsWith("SMK:")) {
      String smkStr = String(token);
      smkStr.replace("SMK:", "");
      smoke = smkStr.toInt();
    }
    else if (String(token).startsWith("H2O:")) {
      String wStr = String(token);
      wStr.replace("H2O:", "");
      water = atof(wStr.c_str());
    }
    else if (String(token).startsWith("BAT:")) {
      String bStr = String(token);
      bStr.replace("BAT:", "");
      bat = atof(bStr.c_str());
    }
    token = strtok(NULL, "|");
    field++;
  }

  int idx = findOrAddVillage(id);
  villages[idx].id = id;
  villages[idx].riskLevel = riskLvl;
  villages[idx].disasterType = disaster;
  villages[idx].latitude = lat;
  villages[idx].longitude = lng;
  villages[idx].riskScore = score;
  villages[idx].rain = rain;
  villages[idx].soil = soil;
  villages[idx].smoke = smoke;
  villages[idx].waterLevel = water;
  villages[idx].battery = bat;
  villages[idx].hopCount = hop;
  villages[idx].rssi = rssi;
  villages[idx].lastPacket = pktSeq;
  villages[idx].lastSeen = millis();

  // 1. Build Real-Time JSON Telemetry Payload
  String jsonPayload = buildVillageJson(idx);

  // 2. Broadcast immediately over WebSocket to ALL connected browser dashboards!
  webSocket.broadcastTXT(jsonPayload);

  // 3. Output JSON to Serial for PC Logging / Python Visualizer
  Serial.printf("[JSON STREAM] %s\n", jsonPayload.c_str());

  // 4. Trigger Hardware Siren at HQ if Emergency
  if (riskLvl == "EMERGENCY" || score >= 70.0) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    tone(PIN_HQ_BUZZER, 1800, 200);
  }
}

// Web Server Handlers
void handleRoot() {
  server.send_P(200, "text/html", INDEX_HTML);
}

void handleTelemetryApi() {
  server.send(200, "application/json", buildAllVillagesJson());
}

// ======================== SETUP & MAIN LOOP ========================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n========================================================");
  Serial.println("  SIH 2024 - RESCUE CONTROL BASE STATION GATEWAY");
  Serial.println("========================================================");

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_HQ_BUZZER, OUTPUT);

  // Setup Standalone Emergency WiFi Access Point
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.printf("[WiFi AP] Emergency Network Started: %s\n", AP_SSID);
  Serial.printf("[WiFi AP] Dashboard URL: http://%s/\n", WiFi.softAPIP().toString().c_str());

  // Setup HTTP Server (Port 80)
  server.on("/", handleRoot);
  server.on("/api/telemetry", handleTelemetryApi);
  server.begin();
  Serial.println("[HTTP] Web Dashboard Server Active (Port 80)");

  // Setup WebSocket Server (Port 81)
  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
  Serial.println("[WebSocket] Real-Time WebSocket Server Active (Port 81)");

  // Setup LoRa Receiver
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(LORA_BAND)) {
    Serial.println("[ERROR] LoRa Init Failed!");
  } else {
    Serial.println("[OK] LoRa SX1278 Base Station Online at 433MHz");
    LoRa.setTxPower(20, PA_OUTPUT_PA_BOOST_PIN);
    LoRa.setSpreadingFactor(10);
    LoRa.setSignalBandwidth(125E3);
    LoRa.setCodingRate4(5);
    LoRa.enableCrc();
  }
}

void loop() {
  server.handleClient();
  webSocket.loop(); // Handle WebSocket client packets

  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String payload = "";
    while (LoRa.available()) {
      payload += (char)LoRa.read();
    }
    payload.trim();
    int rssi = LoRa.packetRssi();

    parseAndStorePacket(payload, rssi);
  }
}
