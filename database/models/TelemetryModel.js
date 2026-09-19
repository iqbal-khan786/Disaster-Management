import { query, run } from '../db.js';

export const TelemetryModel = {
  // Record incoming LoRa sensor packet
  insertLog: async (data) => {
    const {
      villageId,
      riskScore = 0.0,
      riskLevel = 'NORMAL',
      disasterType = 'NONE',
      rain = 0,
      soil = 0,
      temp = 24.0,
      humidity = 85.0,
      vibration = 0,
      flame = 0.0,
      smoke = 0,
      hopCount = 1,
      rssi = -70,
      snr = 8.0,
      rawPacket = ''
    } = data;

    const sql = `
      INSERT INTO telemetry_logs (
        village_id, risk_score, risk_level, disaster_type,
        rainfall_pct, soil_moisture_pct,
        temperature_c, humidity_pct, vibration_detected,
        flame_intensity, smoke_pct, hop_count,
        rssi_dbm, snr, raw_packet
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return await run(sql, [
      villageId, riskScore, riskLevel, disasterType,
      rain, soil,
      temp, humidity, vibration ? 1 : 0,
      flame, smoke, hopCount,
      rssi, snr, rawPacket
    ]);
  },

  // Get recent time-series telemetry for Chart.js streaming (last N records)
  getHistory: async (villageId = 'V1', limit = 20) => {
    const sql = `
      SELECT 
        id, village_id, risk_score, risk_level, disaster_type,
        rainfall_pct, soil_moisture_pct,
        temperature_c, humidity_pct, vibration_detected,
        flame_intensity, smoke_pct,
        hop_count, rssi_dbm,
        strftime('%H:%M:%S', recorded_at) as time_label,
        recorded_at
      FROM telemetry_logs
      WHERE village_id = ?
      ORDER BY id DESC
      LIMIT ?
    `;
    const rows = await query(sql, [villageId, limit]);
    return rows.reverse(); // Return in chronological order
  }
};
