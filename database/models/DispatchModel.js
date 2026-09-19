import { query, run, getOne } from '../db.js';

export const DispatchModel = {
  // Create a new tactical rescue dispatch record
  create: async (dispatchData) => {
    const {
      targetVillageId,
      gpsCoordinates,
      unitAssigned = 'Rayagada ODRAF Unit Alpha',
      rescueAssets = 'Inflatable Boats + Medical Squad',
      personnelCount = 12,
      notes = ''
    } = dispatchData;

    const dispatchCode = `ODRAF-${Date.now().toString().slice(-6)}`;

    const sql = `
      INSERT INTO rescue_dispatches (
        dispatch_code, target_village_id, gps_coordinates,
        unit_assigned, rescue_assets, personnel_count, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      dispatchCode, targetVillageId, gpsCoordinates,
      unitAssigned, rescueAssets, personnelCount, notes
    ]);

    return { id: result.lastID, dispatchCode, ...dispatchData };
  },

  // Get all dispatch orders
  getAll: async () => {
    return await query(`
      SELECT 
        d.*, 
        v.name as village_name,
        v.risk_level,
        v.disaster_type
      FROM rescue_dispatches d
      JOIN villages v ON d.target_village_id = v.id
      ORDER BY d.id DESC
    `);
  },

  // Update dispatch status (e.g. EN_ROUTE, ON_SCENE, COMPLETED)
  updateStatus: async (dispatchId, status) => {
    return await run(`UPDATE rescue_dispatches SET status = ? WHERE id = ?`, [status, dispatchId]);
  }
};
