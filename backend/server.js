import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import apiRoutes from './routes/apiRoutes.js';
import { SIM_NODES, startSimulator, setScenario } from './simulator.js';
import { NodeModel } from '../database/models/NodeModel.js';
import { DispatchModel } from '../database/models/DispatchModel.js';

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middlewares
app.use(cors());
app.use(express.json());

// Mount REST API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SIH 2024 — Rayagada Disaster Management Command Center Backend',
    endpoints: {
      nodes: '/api/nodes',
      history: '/api/telemetry/history?villageId=V1',
      dispatches: '/api/dispatches',
      websocket: `ws://localhost:${PORT}/`
    }
  });
});

// Broadcast JSON payload to all connected WebSocket clients
export function broadcastToClients(payload) {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket Connection Lifecycle
wss.on('connection', async (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[WebSocket] 🟢 Client connected from ${ip}`);

  // Send current state of all villages from Database on connect
  try {
    const nodes = await NodeModel.getAll();
    if (nodes && nodes.length > 0) {
      ws.send(JSON.stringify(nodes));
    } else {
      ws.send(JSON.stringify(Object.values(SIM_NODES)));
    }
  } catch {
    ws.send(JSON.stringify(Object.values(SIM_NODES)));
  }

  // Handle incoming commands from Frontend
  ws.on('message', async (rawMsg) => {
    try {
      const data = JSON.parse(rawMsg.toString());
      console.log(`[WebSocket RX] Command:`, data);

      if (data.cmd === 'GET_ALL') {
        const nodes = await NodeModel.getAll();
        ws.send(JSON.stringify(nodes));
      } else if (data.cmd === 'SET_SCENARIO' || data.cmd === 'SCENARIO') {
        const scenario = data.scenario || data.name || 'normal';
        console.log(`[SCENARIO] 🎛️ Setting simulation scenario: ${scenario}`);
        setScenario(scenario);
      } else if (data.cmd === 'SIREN') {
        console.log(`[ALARM] 🚨 Evacuation Siren command broadcasted to all units!`);
        broadcastToClients({ event: 'siren_triggered', duration: data.duration || 3000, timestamp: Date.now() });
      } else if (data.cmd === 'DISPATCH') {
        console.log(`[DISPATCH] 🚁 Tactical Rescue Dispatch confirmed for ${data.node}!`);
        await DispatchModel.create({
          targetVillageId: data.node || 'V1',
          gpsCoordinates: data.coords || '19.2400° N, 83.3300° E',
          unitAssigned: 'Rayagada ODRAF Rescue Team Alpha',
          notes: 'Dispatched via WebSocket Command Center'
        });
        broadcastToClients({ event: 'rescue_dispatched', node: data.node, timestamp: Date.now() });
      } else if (data.cmd === 'SIMULATE') {
        if (data.scenario) {
          setScenario(data.scenario);
        }
        broadcastToClients(data);
      }
    } catch (e) {
      console.error('[WS Message Error]', e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] 🔴 Client disconnected from ${ip}`);
  });
});

// Start Background Simulator
startSimulator(broadcastToClients);

// Launch HTTP & WebSocket Server
server.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  SIH 2024 — RAYAGADA DISASTER COMMAND CENTER BACKEND ONLINE`);
  console.log(`  REST API Server:  http://localhost:${PORT}/api/nodes`);
  console.log(`  WebSocket Server: ws://localhost:${PORT}/`);
  console.log(`  Database:         SQLite (database/disaster_management.db)`);
  console.log(`=================================================================`);
});
