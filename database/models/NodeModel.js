import { query, getOne, run } from '../db.js';

export const NodeModel = {
  // Fetch all monitored villages with latest telemetry
  getAll: async () => {
    return await query(`SELECT * FROM villages ORDER BY id ASC`);
  },

  // Fetch single village by ID
  getById: async (id) => {
    return await getOne(`SELECT * FROM villages WHERE id = ?`, [id]);
  },

  // Update village real-time telemetry from LoRa / WebSocket
  updateTelemetry: async (nodeData) => {
    const {
      id,
      riskLevel = 'NORMAL',
      disasterType = 'NONE',
      riskScore = 0.0,
      waterLevel = 0.0,
      rain = 0,
      soil = 0,
      smoke = 0,
      vibration = 0,
      battery = 4.0,
      hopCount = 1,
      rssi = -70
    } = nodeData;

    const sql = `
      UPDATE villages 
      SET 
        risk_level = ?,
        disaster_type = ?,
        risk_score = ?,
        water_level_m = ?,
        rainfall_pct = ?,
        soil_moisture_pct = ?,
        smoke_pct = ?,
        vibration_detected = ?,
        battery_voltage = ?,
        hop_count = ?,
        rssi_dbm = ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    return await run(sql, [
      riskLevel,
      disasterType,
      riskScore,
      waterLevel,
      rain,
      soil,
      smoke,
      vibration ? 1 : 0,
      battery,
      hopCount,
      rssi,
      id
    ]);
  }
};
