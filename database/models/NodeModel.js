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
      rain = 0,
      soil = 0,
      smoke = 0,
      flame = 0,
      vibration = 0,
      temp = 24.0,
      humidity = 75.0,
      hopCount = 1,
      rssi = -70
    } = nodeData;

    const sql = `
      UPDATE villages 
      SET 
        risk_level = ?,
        disaster_type = ?,
        risk_score = ?,
        rainfall_pct = ?,
        soil_moisture_pct = ?,
        smoke_pct = ?,
        flame_detected = ?,
        vibration_detected = ?,
        temperature_c = ?,
        humidity_pct = ?,
        hop_count = ?,
        rssi_dbm = ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    return await run(sql, [
      riskLevel,
      disasterType,
      riskScore,
      rain,
      soil,
      smoke,
      flame ? 1 : 0,
      vibration ? 1 : 0,
      temp,
      humidity,
      hopCount,
      rssi,
      id
    ]);
  }
};
