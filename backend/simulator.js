import { NodeModel } from '../database/models/NodeModel.js';
import { TelemetryModel } from '../database/models/TelemetryModel.js';

// Simulated Village Nodes in Rayagada District
export const SIM_NODES = {
  "V1": {
    id: "V1",
    name: "Village 1: Kashipur Valley (Deep Remote Flood Zone)",
    district: "Rayagada, Odisha",
    latitude: 19.2400,
    longitude: 83.3300,
    riskLevel: "EMERGENCY",
    disasterType: "CRITICAL FLASH FLOOD",
    riskScore: 88.0,
    rain: 95,
    soil: 96,
    smoke: 18,
    waterLevel: 2.25,
    vibration: 1,
    flame: 8,
    temperature: 23.5,
    humidity: 95,
    battery: 4.02,
    hopCount: 1,
    rssi: -64
  },
  "V2": {
    id: "V2",
    name: "Village 2: Kolnara Ridge (Intermediate Relay Node)",
    district: "Rayagada, Odisha",
    latitude: 19.1950,
    longitude: 83.3950,
    riskLevel: "NORMAL",
    disasterType: "NONE",
    riskScore: 18.0,
    rain: 22,
    soil: 35,
    smoke: 8,
    waterLevel: 0.40,
    vibration: 0,
    flame: 5,
    temperature: 22.0,
    humidity: 65,
    battery: 4.18,
    hopCount: 2,
    rssi: -76
  }
};

/**
 * Start Background Telemetry Simulation Loop
 * Persists data to SQLite database and broadcasts via WebSocket
 */
export function startSimulator(broadcastFn) {
  console.log('[Simulator] ⚡ Rayagada Multi-Hop Mesh simulation engine active...');

  setInterval(async () => {
    try {
      const node1 = SIM_NODES["V1"];

      // Realistic flood level & rain fluctuation
      const deltaWater = (Math.random() * 0.12 - 0.04);
      node1.waterLevel = Math.max(0.8, Math.min(3.2, Number((node1.waterLevel + deltaWater).toFixed(2))));
      node1.rain = Math.max(70, Math.min(100, Math.round(node1.rain + (Math.random() * 4 - 2))));
      node1.soil = Math.max(80, Math.min(100, Math.round(node1.soil + (Math.random() * 3 - 1))));
      node1.smoke = Math.max(10, Math.min(30, Math.round(node1.smoke + (Math.random() * 2 - 1))));
      
      // Calculate dynamic weighted score
      node1.riskScore = Math.min(100.0, Number((node1.rain * 0.25 + 20 + node1.soil * 0.15 + (node1.smoke * 0.15) + 8 + 3).toFixed(1)));
      node1.rssi = -60 - Math.floor(Math.random() * 8);

      // Save to SQLite Database
      await NodeModel.updateTelemetry(node1);
      await TelemetryModel.insertLog({
        villageId: node1.id,
        riskScore: node1.riskScore,
        riskLevel: node1.riskLevel,
        disasterType: node1.disasterType,
        waterLevel: node1.waterLevel,
        rain: node1.rain,
        soil: node1.soil,
        temp: node1.temperature,
        humidity: node1.humidity,
        vibration: node1.vibration,
        flame: node1.flame,
        smoke: node1.smoke,
        battery: node1.battery,
        hopCount: node1.hopCount,
        rssi: node1.rssi,
        rawPacket: `V1|${node1.riskLevel}|${node1.disasterType}|${node1.latitude}|${node1.longitude}|${node1.riskScore}|PKT#${Math.floor(Math.random()*900+100)}|HOP:1|RAIN:${node1.rain}|SOIL:${node1.soil}|SMK:${node1.smoke}|H2O:${node1.waterLevel}|BAT:${node1.battery}`
      });

      // Broadcast over WebSocket to all connected browser dashboards
      broadcastFn(node1);

    } catch (err) {
      console.error('[Simulator Error]', err.message);
    }
  }, 3500);
}
