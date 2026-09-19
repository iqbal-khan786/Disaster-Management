import { NodeModel } from '../database/models/NodeModel.js';
import { TelemetryModel } from '../database/models/TelemetryModel.js';

// Simulated Village Node in Rayagada District (6 Physical Sensors)
export const SIM_NODES = {
  "V1": {
    id: "V1",
    node_id: "NODE_01",
    name: "Village 1: Kashipur Valley",
    district: "Rayagada, Odisha",
    latitude: 19.1950,
    longitude: 83.3950,
    riskLevel: "EMERGENCY",
    disasterType: "CRITICAL FLASH FLOOD",
    riskScore: 88.0,
    rain: 95,
    rainMm: 95,
    soil: 96,
    soilMoisture: 96,
    smoke: 18,
    smokeLevel: 18,
    vibration: true,
    flame: 1,
    flameDetected: true,
    flame_detected: true,
    temperature: 23.5,
    temp: 23.5,
    humidity: 95,
    hopCount: 1,
    rssi: -64
  }
};

/**
 * Start Background Telemetry Simulation Loop
 * Persists data to SQLite database and broadcasts via WebSocket
 */
export function startSimulator(broadcastFn) {
  console.log('[Simulator] ⚡ Rayagada Disaster Sensor Node 1 simulation active (6 Physical Sensors)...');

  setInterval(async () => {
    try {
      const node1 = SIM_NODES["V1"];

      // Realistic rain, soil, smoke fluctuation
      node1.rain = Math.max(70, Math.min(100, Math.round(node1.rain + (Math.random() * 4 - 2))));
      node1.rainMm = node1.rain;
      node1.soil = Math.max(80, Math.min(100, Math.round(node1.soil + (Math.random() * 3 - 1))));
      node1.soilMoisture = node1.soil;
      node1.smoke = Math.max(10, Math.min(30, Math.round(node1.smoke + (Math.random() * 2 - 1))));
      node1.smokeLevel = node1.smoke;
      
      // Calculate dynamic weighted score
      node1.riskScore = Math.min(100.0, Number((node1.rain * 0.25 + 20 + node1.soil * 0.20 + (node1.smoke * 0.10) + 15 + 10).toFixed(1)));
      node1.rssi = -60 - Math.floor(Math.random() * 8);

      // Save to SQLite Database
      await NodeModel.updateTelemetry(node1);
      await TelemetryModel.insertLog({
        villageId: node1.id,
        riskScore: node1.riskScore,
        riskLevel: node1.riskLevel,
        disasterType: node1.disasterType,
        rain: node1.rain,
        soil: node1.soil,
        temp: node1.temperature,
        humidity: node1.humidity,
        vibration: node1.vibration,
        flame: node1.flame,
        smoke: node1.smoke,
        hopCount: node1.hopCount,
        rssi: node1.rssi,
        rawPacket: `V1|${node1.riskLevel}|${node1.disasterType}|${node1.latitude}|${node1.longitude}|${node1.riskScore}|PKT#${Math.floor(Math.random()*900+100)}|HOP:1|RAIN:${node1.rain}|SOIL:${node1.soil}|SMK:${node1.smoke}|FLM:1|VIB:1|TEMP:${node1.temperature}|HUM:${node1.humidity}`
      });

      // Broadcast over WebSocket to all connected browser dashboards
      broadcastFn(node1);

    } catch (err) {
      console.error('[Simulator Error]', err.message);
    }
  }, 3500);
}
