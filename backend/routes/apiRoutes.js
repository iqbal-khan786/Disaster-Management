import express from 'express';
import { NodeModel } from '../../database/models/NodeModel.js';
import { TelemetryModel } from '../../database/models/TelemetryModel.js';
import { DispatchModel } from '../../database/models/DispatchModel.js';

const router = express.Router();

// 1. Get All Monitored Village Nodes
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await NodeModel.getAll();
    res.json({ success: true, count: nodes.length, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Recent Telemetry History (For Charts)
router.get('/telemetry/history', async (req, res) => {
  try {
    const villageId = req.query.villageId || 'V1';
    const limit = parseInt(req.query.limit) || 20;
    const history = await TelemetryModel.getHistory(villageId, limit);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create Tactical Rescue Dispatch Order
router.post('/dispatch', async (req, res) => {
  try {
    const { targetVillageId, gpsCoordinates, unitAssigned, rescueAssets, personnelCount, notes } = req.body;
    if (!targetVillageId || !gpsCoordinates) {
      return res.status(400).json({ success: false, error: 'targetVillageId and gpsCoordinates are required' });
    }

    const dispatchRecord = await DispatchModel.create({
      targetVillageId,
      gpsCoordinates,
      unitAssigned: unitAssigned || 'Rayagada ODRAF Rescue Team Alpha',
      rescueAssets: rescueAssets || 'Inflatable Power Boats + Air Rescue',
      personnelCount: personnelCount || 12,
      notes: notes || 'Immediate evacuation authorized by District Collectorate DEOC'
    });

    res.status(201).json({
      success: true,
      message: `🚨 Rescue Order ${dispatchRecord.dispatchCode} Dispatched Successfully!`,
      data: dispatchRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get All Rescue Dispatch Records
router.get('/dispatches', async (req, res) => {
  try {
    const dispatches = await DispatchModel.getAll();
    res.json({ success: true, count: dispatches.length, data: dispatches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
