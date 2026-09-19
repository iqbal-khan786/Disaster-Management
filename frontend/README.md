# DisasterGuard — Real-Time Disaster Monitoring & Early Warning Dashboard (SIH 2026)

**DisasterGuard** is an IoT-enabled Multi-Village Disaster Monitoring and Early Warning Command Center designed for remote, blackout-prone rural regions (such as the Nagavali River Basin in Rayagada District, Odisha). When cellular towers and standard internet connections fail during severe floods, cyclones, or landslides, DisasterGuard uses offline **ESP32 + Semtech SX1278 (433MHz) LoRa Mesh Transceivers** to relay vital environmental telemetry back to base camp, where a FastAPI WebSocket bridge feeds this dashboard in real time.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, Vite 8, Vanilla CSS Design System with dark navy glassmorphism.
- **Visualizations**: Leaflet GIS Maps (Satellite, OpenStreetMap, Topographic contours), Chart.js (Real-time telemetry streams), Lucide React.
- **Audio Synthesizer**: Web Audio API Undulating Emergency Siren and Tactical Chimes (Zero external media asset dependency).
- **Backend Communication**: Full-duplex WebSocket client (`ws://localhost:8000/ws` or configurable via `VITE_WS_URL`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables (Optional)
Create a `.env` file in `frontend/`:
```env
# WebSocket URL for FastAPI or Gateway Bridge
VITE_WS_URL=ws://127.0.0.1:8000/ws
```
*(If unset, the dashboard automatically falls back to `ws://localhost:8000/ws` and port `8080`)*

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📡 WebSocket JSON Telemetry Schema

The dashboard natively ingests both the unified DisasterGuard schema and the Rayagada multi-hop packet format:

```json
{
  "node_id": "NODE_01",
  "village": "Village 1: Kashipur Valley",
  "timestamp": "2026-09-19T15:30:00Z",
  "water_level_cm": 225,
  "rainfall_mm": 95.0,
  "soil_moisture": 96,
  "temperature": 23.5,
  "humidity": 95,
  "smoke_level": 18,
  "flame_detected": false,
  "vibration": true,
  "battery": 87,
  "batteryVoltage": 4.02,
  "rssi": -64,
  "hopCount": 1,
  "risk": {
    "flood": "CRITICAL",
    "landslide": "HIGH",
    "fire": "LOW",
    "cyclone": "MEDIUM"
  }
}
```

---

## 🧭 Command Console Navigation Views

1. **Overview Dashboard**:
   - 6 Key Performance Indicator Cards: Active Sensor Nodes, Villages Monitored, Active Alerts, Network Health (RSSI/SNR), Last Data Received, Gateway Status.
   - 4 Multi-Hazard Risk Cards: Flood Hazard, Landslide Hazard, Wildfire/Smoke Hazard, Cyclone/Storm Hazard (with AI confidence scores).
   - 11-Reading Sensor Telemetry Grid.
   - Real-Time Time-Series Trend Charts for Water Level, Rainfall, Soil Moisture, Temp & Humidity, Seismic Vibration, and RSSI.
2. **Live Monitoring**: High-frequency telemetry matrix with radial/linear gauges, Safe/Caution/Critical threshold limits, and per-node diagnostic switches.
3. **Village Network**: Interactive Leaflet GIS Topographic / Satellite Map with river inundation zones + interactive LoRa Mesh Relay Topology flowchart (`Node 1 -> Node 2 -> Gateway -> Dashboard`).
4. **Risk Analysis**: AI Multi-Factor Risk Matrix detailing sensor weight distributions (Water 35%, Rain 30%, Soil 20%, Seismic 10%, Smoke 5%).
5. **Disaster Alerts**: Emergency Alert Center with critical warning marquees, severity badges, Acknowledge & Mark Resolved workflows, and siren broadcasts.
6. **Sensor Nodes**: Hardware specifications (ESP32-WROOM-32, SX1278 433MHz, JSN-SR04T, Soil v1.2, MQ-2, SW-420, DHT22), battery voltage, and RF ping test buttons.
7. **Historical Data**: Filterable telemetry logs, time-range selectors (1h, 6h, 24h, 7d), statistical min/max/avg cards, and one-click CSV/JSON data export.
8. **Rescue Operations (CAD)**: Multi-agency response management (ODRAF Power Boats, NDRF 4x4 Amphibious Units, Medical Evac Wing), shelter capacities, and interactive tactical dispatch CAD modal.
9. **System Settings**: WebSocket server URL configuration, LoRa RF band selector (433MHz / 868MHz / 915MHz), customizable danger threshold limits, and Web Audio siren preferences.

---

## 🧪 Interactive Demo Simulation Engine

For presentations or testing without hardware:
Click **"Demo Simulation"** in the top header or use the interactive scenario bar to trigger 8 realistic disaster events:
1. **Baseline Safe Weather**: Clear skies, nominal water & rain levels.
2. **Critical Flash Flood**: Rapid water rise (2.85m), torrential rain (115mm/h), automated siren alert.
3. **Heavy Monsoon**: Sustained downpour (135mm/h), high river saturation.
4. **Landslide & Slope Shift**: Soil moisture saturation (99%) + seismic slope vibration trip.
5. **Wildfire & Smoke Hazard**: Combustible smoke spike (380 PPM) + flame IR photodiode trip.
6. **Severe Cyclonic Storm**: Gale gusts + heavy rain (160mm/h).
7. **Node LoRa Blackout**: Simulates node packet timeout and signal loss.
8. **Gateway Hub Offline**: Simulates base station connectivity drop.

---

## ⚖️ AI Estimation & Safety Notice
*All disaster risk classifications, confidence indices, and response priorities are predictive calculations derived from IoT sensor fusion. These metrics provide early warning alerts; all critical evacuation and dispatch orders must be verified by designated DEOC incident commanders.*
