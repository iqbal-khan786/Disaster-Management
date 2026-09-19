import { useState, useEffect, useRef, useCallback } from 'react';
import { playEmergencySiren, playTacticalBeep, playAckChime } from '../utils/audioSiren';

// Default initial nodes (Clean Real Hardware Baseline - ONLY Village 1 Node 1)
const INITIAL_NODES = {
  "NODE_01": {
    id: "NODE_01",
    name: "Village 1: Kashipur Valley",
    village: "Kashipur Valley",
    district: "Rayagada, Odisha",
    latitude: 19.1950,
    longitude: 83.3950,
    riskLevel: "NORMAL",
    riskScore: 0.0,
    disasterType: "NONE",
    waterLevelCm: 0,
    waterLevelM: 0.0,
    rainMm: 0,
    rainPercent: 0,
    soilMoisture: 0,
    temp: 24.5,
    humidity: 75,
    smokeLevel: 0,
    flameDetected: false,
    vibration: false,
    battery: 72,
    batteryVoltage: 3.04,
    hopCount: 1,
    rssi: -65,
    lastSeen: Date.now(),
    risk: { flood: "LOW", landslide: "LOW", fire: "LOW", cyclone: "LOW" },
    status: "ONLINE"
  }
};

const INITIAL_HISTORY = [
  { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), waterLevel: 0, waterLevelM: 0.0, rain: 0, soilMoisture: 0, temp: 24.5, humidity: 75, vibration: 0, rssi: -65, riskScore: 0, nodeId: 'NODE_01' }
];

/**
 * Universal Packet Parser (handles JSON, arrays, pipe delimited, prefixed serial logs)
 */
function parseAnyIncomingData(rawInput) {
  if (!rawInput) return null;

  // Already parsed JS object
  if (typeof rawInput === 'object') {
    return rawInput;
  }

  if (typeof rawInput !== 'string') return null;
  const text = rawInput.trim();

  // 1. Try standard JSON substring search
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonStr);
    } catch {
      // Continue to other parsers
    }
  }

  // 2. Try JSON Array search
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart >= 0 && arrEnd > arrStart) {
    try {
      const arrStr = text.substring(arrStart, arrEnd + 1);
      return JSON.parse(arrStr);
    } catch {
      // Continue
    }
  }

  // 3. Pipe-separated string:
  // V1|EMERGENCY|CRITICAL FLASH FLOOD|19.2400|83.3300|88.0|PKT#007|HOP:1|RAIN:95|SOIL:90|SMK:45|H2O:2.20|BAT:4.02
  if (text.includes('|')) {
    const pipeIdx = text.indexOf('|');
    const firstWordStart = text.lastIndexOf(' ', pipeIdx);
    const cleanText = firstWordStart >= 0 ? text.substring(firstWordStart + 1) : text;
    const parts = cleanText.split('|');

    if (parts.length >= 6) {
      const rawId = parts[0].trim();
      const mappedId = rawId === 'V1' ? 'NODE_01' : (rawId === 'V2' ? 'NODE_02' : rawId);
      const riskLevel = parts[1].trim();
      const disasterType = parts[2].trim();
      const lat = parseFloat(parts[3]) || 19.2400;
      const lng = parseFloat(parts[4]) || 83.3300;
      const riskScore = parseFloat(parts[5]) || 20.0;

      let rain = 0;
      let soil = 0;
      let smoke = 0;
      let h2o = 0.25;
      let bat = 4.12;
      let hop = 1;

      for (let i = 6; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.startsWith('HOP:')) hop = parseInt(p.replace('HOP:', ''), 10) || 1;
        else if (p.startsWith('RAIN:')) rain = parseFloat(p.replace('RAIN:', '')) || 0;
        else if (p.startsWith('SOIL:')) soil = parseFloat(p.replace('SOIL:', '')) || 0;
        else if (p.startsWith('SMK:')) smoke = parseFloat(p.replace('SMK:', '')) || 0;
        else if (p.startsWith('H2O:')) h2o = parseFloat(p.replace('H2O:', '')) || 0;
        else if (p.startsWith('BAT:')) bat = parseFloat(p.replace('BAT:', '')) || 4.12;
      }

      const waterCm = Math.round(h2o * 100);
      return {
        id: mappedId,
        node_id: mappedId,
        name: mappedId === 'NODE_01' ? 'Village 1: Kashipur Valley' : (mappedId === 'NODE_02' ? 'Village 2: Kolnara Ridge' : `Village ${mappedId}`),
        village: mappedId === 'NODE_01' ? 'Kashipur Valley' : (mappedId === 'NODE_02' ? 'Kolnara Ridge' : `Village ${mappedId}`),
        district: 'Rayagada, Odisha',
        latitude: lat,
        longitude: lng,
        riskLevel: riskLevel,
        riskScore: riskScore,
        disasterType: disasterType,
        water_level_cm: waterCm,
        waterLevelCm: waterCm,
        waterLevelM: h2o,
        waterLevel: h2o,
        rainfall_mm: rain,
        rainMm: rain,
        rain: rain,
        soil_moisture: soil,
        soilMoisture: soil,
        soil: soil,
        temperature: 24.5,
        humidity: 75,
        smoke_level: smoke,
        smokeLevel: smoke,
        flame_detected: false,
        flameDetected: false,
        vibration: riskLevel === 'EMERGENCY' || riskScore > 70,
        battery: bat > 5 ? bat : Math.min(100, Math.round((bat / 4.2) * 100)),
        batteryVoltage: bat,
        hopCount: hop,
        rssi: -65,
        status: 'ONLINE',
        lastSeen: Date.now(),
        rawPacket: text
      };
    }
  }

  return null;
}

export function useDisasterWebSocket() {
  // Determine configured WebSocket URL
  const [serverUrl, setServerUrl] = useState(() => {
    if (import.meta.env && import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const host = window.location.hostname;
    // Default to port 8080 where gateway_bridge.py / server.js listen
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'ws://127.0.0.1:8080/';
    }
    return `ws://${host}:8080/`;
  });

  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // CONNECTED, CONNECTING, RECONNECTING, DISCONNECTED, OFFLINE
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState('normal');
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialPortName, setSerialPortName] = useState('');

  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), text: '[DisasterGuard CORE] Rayagada DEOC Command Center Initialized.', type: 'sys' },
    { id: 2, time: new Date().toLocaleTimeString(), text: '[Gateway Bridge] Ready for ESP32 Serial / WebSocket input on port 8080 / 8000.', type: 'sys' }
  ]);
  
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState('ONLINE');
  const [lastDataTimestamp, setLastDataTimestamp] = useState(Date.now());

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const simIntervalRef = useRef(null);
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  // Append system or radio log
  const addLog = useCallback((text, type = 'normal') => {
    setLogs(prev => [
      { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type },
      ...prev.slice(0, 59)
    ]);
  }, []);

  // Standardize incoming node packet format (Node 1 Only)
  const normalizeNodeData = useCallback((raw) => {
    if (!raw) return null;
    const mappedId = "NODE_01";
    
    const existing = nodes["NODE_01"] || INITIAL_NODES["NODE_01"];
    
    // Explicitly parse 100% real physical sensor values
    let waterCm = 0;
    if (raw.water_level_cm !== undefined) waterCm = Number(raw.water_level_cm);
    else if (raw.waterLevelCm !== undefined) waterCm = Number(raw.waterLevelCm);
    else if (raw.waterLevelM !== undefined) waterCm = Math.round(Number(raw.waterLevelM) * 100);
    else if (raw.waterLevel !== undefined) waterCm = Math.round(Number(raw.waterLevel) * 100);
    else if (existing) waterCm = existing.waterLevelCm;

    const waterM = Number((waterCm / 100).toFixed(2));

    let rainMm = 0;
    if (raw.rainfall_mm !== undefined) rainMm = Number(raw.rainfall_mm);
    else if (raw.rainMm !== undefined) rainMm = Number(raw.rainMm);
    else if (raw.rain !== undefined) rainMm = Number(raw.rain);
    else if (existing) rainMm = existing.rainMm;

    let soilMoisture = 0;
    if (raw.soil_moisture !== undefined) soilMoisture = Number(raw.soil_moisture);
    else if (raw.soilMoisture !== undefined) soilMoisture = Number(raw.soilMoisture);
    else if (raw.soil !== undefined) soilMoisture = Number(raw.soil);
    else if (existing) soilMoisture = existing.soilMoisture;

    let temp = 24.5;
    if (raw.temperature !== undefined) temp = Number(raw.temperature);
    else if (raw.temp !== undefined) temp = Number(raw.temp);
    else if (existing) temp = existing.temp;

    const humidity = raw.humidity !== undefined ? Number(raw.humidity) : (existing ? existing.humidity : 75);

    let smokeLevel = 0;
    if (raw.smoke_level !== undefined) smokeLevel = Number(raw.smoke_level);
    else if (raw.smokeLevel !== undefined) smokeLevel = Number(raw.smokeLevel);
    else if (raw.smoke !== undefined) smokeLevel = Number(raw.smoke);
    else if (existing) smokeLevel = existing.smokeLevel;

    let flameDetected = false;
    if (raw.flame_detected !== undefined) flameDetected = Boolean(raw.flame_detected);
    else if (raw.flameDetected !== undefined) flameDetected = Boolean(raw.flameDetected);
    else if (raw.flame !== undefined) flameDetected = typeof raw.flame === 'boolean' ? raw.flame : Number(raw.flame) > 50;
    else if (existing) flameDetected = existing.flameDetected;

    const vibration = raw.vibration !== undefined ? Boolean(raw.vibration) : (existing ? existing.vibration : false);

    let batteryVoltage = 3.04;
    if (raw.batteryVoltage !== undefined) batteryVoltage = Number(raw.batteryVoltage);
    else if (raw.battery !== undefined && Number(raw.battery) <= 5.0) batteryVoltage = Number(raw.battery);
    else if (existing) batteryVoltage = existing.batteryVoltage;

    let battery = 72;
    if (raw.battery !== undefined) {
      battery = Number(raw.battery) > 5 ? Math.round(Number(raw.battery)) : Math.min(100, Math.max(10, Math.round((Number(raw.battery) / 4.2) * 100)));
    } else if (existing) {
      battery = existing.battery;
    }

    const rssi = raw.rssi !== undefined ? Number(raw.rssi) : (existing ? existing.rssi : -65);
    const hopCount = raw.hopCount !== undefined ? Number(raw.hopCount) : (raw.hops || (existing ? existing.hopCount : 1));

    // Dynamic risk calculation
    let calculatedRiskScore = raw.riskScore !== undefined ? Number(raw.riskScore) : (raw.risk_score !== undefined ? Number(raw.risk_score) : null);
    if (calculatedRiskScore === null) {
      calculatedRiskScore = Math.min(100, Math.round(
        (waterCm > 150 ? 40 : (waterCm / 150) * 40) +
        (rainMm > 80 ? 30 : (rainMm / 80) * 30) +
        (soilMoisture > 80 ? 20 : (soilMoisture / 80) * 20) +
        (vibration ? 25 : 0)
      ));
    }

    let calculatedRiskLevel = raw.riskLevel || (calculatedRiskScore >= 75 ? "CRITICAL" : calculatedRiskScore >= 45 ? "HIGH" : calculatedRiskScore >= 25 ? "MEDIUM" : "NORMAL");
    if (calculatedRiskLevel === "NORMAL" || calculatedRiskScore < 25) {
      calculatedRiskLevel = "NORMAL";
    }
    
    const riskTypes = raw.risk || {
      flood: waterCm > 180 ? "CRITICAL" : waterCm > 100 ? "HIGH" : waterCm > 50 ? "MEDIUM" : "LOW",
      landslide: (soilMoisture > 85 && vibration) ? "CRITICAL" : soilMoisture > 75 ? "HIGH" : soilMoisture > 50 ? "MEDIUM" : "LOW",
      fire: flameDetected ? "CRITICAL" : smokeLevel > 150 ? "HIGH" : smokeLevel > 80 ? "MEDIUM" : "LOW",
      cyclone: (rainMm > 80 && humidity > 90) ? "HIGH" : "LOW"
    };

    const disasterType = raw.disasterType || (calculatedRiskLevel === 'CRITICAL' ? 'CRITICAL FLASH FLOOD' : calculatedRiskLevel === 'HIGH' ? 'HEAVY RAINFALL WARNING' : 'NONE');

    return {
      id: mappedId,
      name: raw.name || raw.village || existing.name,
      village: raw.village || raw.name || existing.village,
      district: raw.district || existing.district,
      latitude: raw.latitude !== undefined ? raw.latitude : existing.latitude,
      longitude: raw.longitude !== undefined ? raw.longitude : existing.longitude,
      riskLevel: calculatedRiskLevel,
      riskScore: calculatedRiskScore,
      disasterType: disasterType,
      waterLevelCm: waterCm,
      waterLevelM: waterM,
      rainMm: rainMm,
      rainPercent: Math.min(100, rainMm),
      soilMoisture: soilMoisture,
      temp: temp,
      humidity: humidity,
      smokeLevel: smokeLevel,
      flameDetected: flameDetected,
      vibration: vibration,
      battery: battery,
      batteryVoltage: batteryVoltage,
      hopCount: hopCount,
      rssi: rssi,
      lastSeen: Date.now(),
      risk: riskTypes,
      status: "ONLINE",
      rawPacket: raw.rawPacket || `${mappedId}|${calculatedRiskLevel}|H2O:${waterCm}cm|RAIN:${rainMm}mm|SOIL:${soilMoisture}%|VIB:${vibration ? '1' : '0'}`
    };
  }, []);

  const handleIncomingDataRef = useRef(null);

  // Process incoming data items
  const handleIncomingData = useCallback((data) => {
    if (!data) return;
    const items = Array.isArray(data) ? data : [data];
    setLastDataTimestamp(Date.now());

    items.forEach(rawItem => {
      const node = normalizeNodeData(rawItem);
      if (!node) return;

      setNodes(prev => ({
        ...prev,
        [node.id]: node
      }));

      // Check for Critical Alerts
      if (node.riskLevel === 'CRITICAL' || node.riskScore >= 75) {
        playEmergencySiren(2.0);
        const newAlert = {
          id: `ALT-${Date.now().toString().slice(-4)}`,
          title: `EMERGENCY: ${node.disasterType || 'DISASTER HAZARD'} AT ${node.name.toUpperCase()}`,
          desc: `Water Level: ${node.waterLevelCm}cm | Rain: ${node.rainMm}mm/h | Soil Moisture: ${node.soilMoisture}% | Relayed via LoRa Hop ${node.hopCount}`,
          level: 'CRITICAL',
          village: node.name,
          nodeId: node.id,
          disasterType: node.disasterType || 'FLASH FLOOD',
          triggerSensor: 'LoRa Mesh Sensor Array (Ultrasonic / Rain / Soil)',
          timestamp: new Date().toLocaleTimeString(),
          status: 'active'
        };

        setActiveAlert(newAlert);
        setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id).slice(0, 19)]);
      }

      // Append real-time chart history
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory(prev => {
        const next = [...prev, {
          time: timeStr,
          waterLevel: node.waterLevelCm,
          waterLevelM: node.waterLevelM,
          rain: node.rainMm,
          soilMoisture: node.soilMoisture,
          temp: node.temp,
          humidity: node.humidity,
          vibration: node.vibration ? 1 : 0,
          rssi: node.rssi,
          riskScore: node.riskScore,
          nodeId: node.id
        }];
        return next.length > 25 ? next.slice(next.length - 25) : next;
      });

      addLog(
        `[LIVE TELEMETRY] ${node.id} (${node.village}) ➔ Water: ${node.waterLevelCm}cm | Rain: ${node.rainMm}mm | Soil: ${node.soilMoisture}% | RSSI: ${node.rssi}dBm`,
        node.riskLevel === 'CRITICAL' ? 'danger' : node.riskLevel === 'HIGH' ? 'warn' : 'rx'
      );
    });
  }, [normalizeNodeData, addLog]);

  handleIncomingDataRef.current = handleIncomingData;

  // Connect WebSocket
  const connectWebSocket = useCallback((url) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const targetUrl = url || serverUrl;
    addLog(`[WS Client] Connecting to ${targetUrl}...`, 'ws');
    setConnectionStatus('CONNECTING');

    try {
      const ws = new WebSocket(targetUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('CONNECTED');
        setGatewayStatus('ONLINE');
        addLog(`[WS Client] Connected to DisasterGuard Backend (${targetUrl})`, 'ack');
        playTacticalBeep(1400, 0.15);
        ws.send(JSON.stringify({ cmd: 'GET_ALL' }));
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = parseAnyIncomingData(evt.data);
          if (parsed && handleIncomingDataRef.current) {
            handleIncomingDataRef.current(parsed);
          } else {
            addLog(`[WS Raw] ${evt.data}`, 'rx');
          }
        } catch (err) {
          addLog(`[WS Parse Err] ${err.message}`, 'warn');
        }
      };

      ws.onclose = () => {
        setConnectionStatus('RECONNECTING');
        setGatewayStatus('DEGRADED');
        addLog(`[WS Client] Disconnected from ${targetUrl}. Retrying in 3.5s...`, 'warn');
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWebSocket(targetUrl);
          }, 3500);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('DISCONNECTED');
      };
    } catch (err) {
      addLog(`[WS Error] ${err.message}`, 'danger');
      setConnectionStatus('DISCONNECTED');
    }
  }, [serverUrl, addLog]);

  // Direct Browser Web Serial API Connection (Direct USB plug-and-play!)
  const connectUsbSerial = useCallback(async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is supported in Google Chrome and Microsoft Edge.\nPlease open this dashboard in Chrome/Edge to connect your ESP32 directly via USB!');
      return false;
    }

    try {
      addLog('[Web Serial] Requesting USB Serial Port access...', 'ws');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setIsSerialConnected(true);
      setSerialPortName('ESP32 USB Serial (115200 Baud)');
      setConnectionStatus('CONNECTED');
      setGatewayStatus('ONLINE');
      playAckChime();
      addLog('[Web Serial] ✅ Connected to ESP32 Hardware via USB Serial!', 'ack');

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let lineBuffer = '';
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              lineBuffer += value;
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop(); // keep partial line in buffer

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                  const parsed = parseAnyIncomingData(trimmed);
                  if (parsed) {
                    handleIncomingData(parsed);
                  }
                }
              }
            }
          }
        } catch (e) {
          addLog(`[Web Serial Error] ${e.message}`, 'danger');
        } finally {
          setIsSerialConnected(false);
          reader.releaseLock();
        }
      })();

      return true;
    } catch (err) {
      addLog(`[Web Serial Cancelled/Error] ${err.message}`, 'warn');
      return false;
    }
  }, [addLog, handleIncomingData]);

  const disconnectUsbSerial = useCallback(async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      setIsSerialConnected(false);
      setSerialPortName('');
      addLog('[Web Serial] USB Serial Disconnected', 'warn');
    } catch (e) {
      console.warn('Serial close error', e);
    }
  }, [addLog]);

  // Send command to backend
  const sendCommand = useCallback((cmd, extra = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({ cmd, ...extra, timestamp: Date.now() });
      wsRef.current.send(msg);
      addLog(`[WS TX] Command sent: ${cmd}`, 'ws');
      return true;
    } else {
      addLog(`[WS Sim] Local command simulated: ${cmd}`, 'warn');
      return false;
    }
  }, [addLog]);

  // Audio Siren
  const triggerSiren = useCallback(() => {
    playEmergencySiren(2.5, 0.35);
    sendCommand('SIREN', { duration: 3000 });
    addLog('[COMMAND] Evacuation Siren broadcasted to all village nodes!', 'danger');
  }, [sendCommand, addLog]);

  // Tactical Rescue Dispatch
  const dispatchRescue = useCallback((nodeId, coords, details = {}) => {
    playEmergencySiren(1.5, 0.2);
    sendCommand('DISPATCH', { node: nodeId, coords, ...details });
    addLog(`[DISPATCH] Rescue Unit Alpha mobilized for ${nodeId} (${coords})`, 'danger');
  }, [sendCommand, addLog]);

  // Alert Management Actions
  const acknowledgeAlert = useCallback((alertId) => {
    playAckChime();
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged' } : a));
    addLog(`[ALERTS] Alert ${alertId} acknowledged by Operator`, 'ack');
  }, [addLog]);

  const resolveAlert = useCallback((alertId) => {
    playTacticalBeep(900, 0.15);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
    addLog(`[ALERTS] Alert ${alertId} marked RESOLVED`, 'ack');
  }, [addLog]);

  // Interactive Demo Simulation Scenarios Engine
  const setSimulationScenario = useCallback((scenario) => {
    setActiveScenario(scenario);
    setIsDemoMode(true);
    playTacticalBeep(1600, 0.12);
    addLog(`[SIMULATOR] Switching to Scenario: ${scenario.toUpperCase()}`, 'sys');

    const baseV1 = { ...INITIAL_NODES["NODE_01"] };
    const baseV2 = { ...INITIAL_NODES["NODE_02"] };
    const baseV3 = { ...INITIAL_NODES["NODE_03"] };

    if (scenario === 'normal') {
      baseV1.waterLevelCm = 25;
      baseV1.waterLevelM = 0.25;
      baseV1.rainMm = 2;
      baseV1.soilMoisture = 32;
      baseV1.temp = 26.5;
      baseV1.humidity = 55;
      baseV1.smokeLevel = 10;
      baseV1.flameDetected = false;
      baseV1.vibration = false;
      baseV1.riskScore = 14;
      baseV1.riskLevel = "LOW";
      baseV1.disasterType = "NONE";
      baseV1.risk = { flood: "LOW", landslide: "LOW", fire: "LOW", cyclone: "LOW" };
      setGatewayStatus('ONLINE');
      setConnectionStatus('CONNECTED');
    } else if (scenario === 'flood') {
      baseV1.waterLevelCm = 285;
      baseV1.waterLevelM = 2.85;
      baseV1.rainMm = 115;
      baseV1.soilMoisture = 98;
      baseV1.temp = 22.0;
      baseV1.humidity = 98;
      baseV1.smokeLevel = 15;
      baseV1.flameDetected = false;
      baseV1.vibration = true;
      baseV1.riskScore = 96;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "CRITICAL FLASH FLOOD";
      baseV1.risk = { flood: "CRITICAL", landslide: "HIGH", fire: "LOW", cyclone: "HIGH" };
      playEmergencySiren(2.0);
    } else if (scenario === 'monsoon') {
      baseV1.waterLevelCm = 160;
      baseV1.waterLevelM = 1.60;
      baseV1.rainMm = 135;
      baseV1.soilMoisture = 92;
      baseV1.temp = 21.5;
      baseV1.humidity = 99;
      baseV1.riskScore = 78;
      baseV1.riskLevel = "HIGH";
      baseV1.disasterType = "HEAVY MONSOON INUNDATION";
      baseV1.risk = { flood: "HIGH", landslide: "HIGH", fire: "LOW", cyclone: "HIGH" };
    } else if (scenario === 'landslide') {
      baseV1.waterLevelCm = 95;
      baseV1.waterLevelM = 0.95;
      baseV1.rainMm = 75;
      baseV1.soilMoisture = 99;
      baseV1.vibration = true;
      baseV1.riskScore = 92;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "LANDSLIDE & SLOPE FAILURE";
      baseV1.risk = { flood: "HIGH", landslide: "CRITICAL", fire: "LOW", cyclone: "LOW" };
      playEmergencySiren(2.0);
    } else if (scenario === 'fire') {
      baseV1.smokeLevel = 380;
      baseV1.flameDetected = true;
      baseV1.temp = 48.5;
      baseV1.humidity = 18;
      baseV1.waterLevelCm = 5;
      baseV1.rainMm = 0;
      baseV1.riskScore = 95;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "WILDFIRE / SMOKE HAZARD";
      baseV1.risk = { flood: "LOW", landslide: "LOW", fire: "CRITICAL", cyclone: "LOW" };
      playEmergencySiren(2.0);
    } else if (scenario === 'cyclone') {
      baseV1.waterLevelCm = 210;
      baseV1.waterLevelM = 2.10;
      baseV1.rainMm = 160;
      baseV1.soilMoisture = 95;
      baseV1.temp = 20.0;
      baseV1.humidity = 100;
      baseV1.vibration = true;
      baseV1.riskScore = 98;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "SEVERE CYCLONIC STORM";
      baseV1.risk = { flood: "CRITICAL", landslide: "HIGH", fire: "LOW", cyclone: "CRITICAL" };
      playEmergencySiren(2.0);
    } else if (scenario === 'disconnect') {
      baseV1.status = "OFFLINE";
      baseV1.rssi = -120;
      addLog('[WARN] Node NODE_01 (Kashipur) LoRa signal lost / Packet timeout!', 'warn');
    } else if (scenario === 'gateway_offline') {
      setGatewayStatus('OFFLINE');
      setConnectionStatus('OFFLINE');
      addLog('[CRITICAL] Gateway Base Hub Offline — Zero LoRa packets being forwarded!', 'danger');
      return;
    }

    handleIncomingData([baseV1, baseV2, baseV3]);
  }, [handleIncomingData, addLog]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      addLog(`[MODE] Switched to ${next ? 'DEMO SIMULATION MODE' : 'LIVE HARDWARE MODE'}`, next ? 'warn' : 'ack');
      if (!next) {
        connectWebSocket(serverUrl);
      }
      return next;
    });
  }, [addLog, connectWebSocket, serverUrl]);

  // Background simulation tick (only when in Demo Mode)
  useEffect(() => {
    simIntervalRef.current = setInterval(() => {
      if (isDemoMode && activeScenario !== 'gateway_offline' && activeScenario !== 'disconnect') {
        const deltaWater = Math.round((Math.random() * 4 - 2));
        const deltaRain = Math.round((Math.random() * 2 - 1));
        
        setNodes(prev => {
          const v1 = { ...prev["NODE_01"] };
          v1.waterLevelCm = Math.max(10, Math.min(350, v1.waterLevelCm + deltaWater));
          v1.waterLevelM = Number((v1.waterLevelCm / 100).toFixed(2));
          v1.rainMm = Math.max(0, Math.min(200, v1.rainMm + deltaRain));
          v1.lastSeen = Date.now();
          return { ...prev, "NODE_01": v1 };
        });

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory(prev => {
          const v1 = nodes["NODE_01"] || INITIAL_NODES["NODE_01"];
          const next = [...prev, {
            time: timeStr,
            waterLevel: v1.waterLevelCm,
            waterLevelM: v1.waterLevelM,
            rain: v1.rainMm,
            soilMoisture: v1.soilMoisture,
            temp: v1.temp,
            humidity: v1.humidity,
            vibration: v1.vibration ? 1 : 0,
            rssi: v1.rssi,
            riskScore: v1.riskScore,
            nodeId: "NODE_01"
          }];
          return next.length > 25 ? next.slice(next.length - 25) : next;
        });
      }
    }, 3500);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isDemoMode, activeScenario, nodes]);

  // Mount effect: Connect to WebSocket
  useEffect(() => {
    connectWebSocket(serverUrl);
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connectWebSocket, serverUrl]);

  return {
    serverUrl,
    setServerUrl,
    connectionStatus,
    gatewayStatus,
    isDemoMode,
    activeScenario,
    nodes,
    history,
    logs,
    alerts,
    activeAlert,
    lastDataTimestamp,
    isSerialConnected,
    serialPortName,
    connectWebSocket,
    connectUsbSerial,
    disconnectUsbSerial,
    sendCommand,
    triggerSiren,
    dispatchRescue,
    acknowledgeAlert,
    resolveAlert,
    setSimulationScenario,
    toggleDemoMode,
    addLog
  };
}
