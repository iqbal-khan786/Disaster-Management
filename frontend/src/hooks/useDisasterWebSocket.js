import { useState, useEffect, useRef, useCallback } from 'react';
import { playEmergencySiren, playTacticalBeep, playAckChime } from '../utils/audioSiren';

// Default initial nodes (Baseline Target: Wildfire + Landslide Risk Zone - Node 1 with 6 Sensors)
const INITIAL_NODES = {
  "NODE_01": {
    id: "NODE_01",
    name: "Village 1: Kashipur Valley",
    village: "Kashipur Valley",
    district: "Rayagada, Odisha",
    latitude: 19.1950,
    longitude: 83.3950,
    riskLevel: "EMERGENCY",
    riskScore: 88.5,
    disasterType: "WILDFIRE / LANDSLIDE",
    rainMm: 5,
    rainPercent: 5,
    rain: 5,
    soilMoisture: 92,
    soil: 92,
    smokeLevel: 320,
    smoke: 320,
    flameDetected: true,
    flame_detected: true,
    flame: 1,
    vibration: true,
    vibrationFreq: 380,
    vibrationHz: 380,
    temp: 38.5,
    temperature: 38.5,
    humidity: 94,
    hopCount: 1,
    rssi: -65,
    lastSeen: Date.now(),
    risk: { flood: "MEDIUM", landslide: "CRITICAL", fire: "CRITICAL", cyclone: "LOW" },
    status: "ONLINE"
  }
};

const INITIAL_HISTORY = [
  { time: new Date(Date.now() - 15000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 4.8, soilMoisture: 91.5, smokeLevel: 315, flameDetected: true, vibration: 1, vibrationFreq: 375, temp: 38.2, humidity: 93.5, rssi: -65, riskScore: 88.0, nodeId: 'NODE_01' },
  { time: new Date(Date.now() - 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 5.1, soilMoisture: 92.0, smokeLevel: 322, flameDetected: true, vibration: 1, vibrationFreq: 382, temp: 38.5, humidity: 94.0, rssi: -64, riskScore: 88.5, nodeId: 'NODE_01' },
  { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 5.0, soilMoisture: 92.0, smokeLevel: 320, flameDetected: true, vibration: 1, vibrationFreq: 380, temp: 38.5, humidity: 94.0, rssi: -65, riskScore: 88.5, nodeId: 'NODE_01' }
];

/**
 * Universal Packet Parser for the 6 physical sensors:
 * Rain (Pin 34), Soil (Pin 35), Smoke (Pin 39), Flame (Pin 33), Vibration (Pin 32), DHT22 (Pin 4)
 */
function parseAnyIncomingData(rawInput) {
  if (!rawInput) return null;

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
      // Continue
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
  // V1|NORMAL|NONE|19.1950|83.3950|10.0|PKT#001|HOP:1|RAIN:0|SOIL:0|SMK:0|FLM:0|VIB:0|TEMP:24.5|HUM:75
  if (text.includes('|')) {
    const pipeIdx = text.indexOf('|');
    const firstWordStart = text.lastIndexOf(' ', pipeIdx);
    const cleanText = firstWordStart >= 0 ? text.substring(firstWordStart + 1) : text;
    const parts = cleanText.split('|');

    if (parts.length >= 6) {
      const mappedId = 'NODE_01';
      const riskLevel = parts[1].trim();
      const disasterType = parts[2].trim();
      const lat = parseFloat(parts[3]) || 19.1950;
      const lng = parseFloat(parts[4]) || 83.3950;
      const riskScore = parseFloat(parts[5]) || 10.0;

      let rain = 0;
      let soil = 0;
      let smoke = 0;
      let flm = false;
      let vib = false;
      let temp = 24.5;
      let hum = 75.0;
      let hop = 1;

      for (let i = 6; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.startsWith('HOP:')) hop = parseInt(p.replace('HOP:', ''), 10) || 1;
        else if (p.startsWith('RAIN:')) rain = parseFloat(p.replace('RAIN:', '')) || 0;
        else if (p.startsWith('SOIL:')) soil = parseFloat(p.replace('SOIL:', '')) || 0;
        else if (p.startsWith('SMK:')) smoke = parseFloat(p.replace('SMK:', '')) || 0;
        else if (p.startsWith('FLM:')) flm = p.replace('FLM:', '').trim() in ('1', 'true', 'TRUE', 'DETECTED');
        else if (p.startsWith('VIB:')) vib = p.replace('VIB:', '').trim() in ('1', 'true', 'TRUE', 'DETECTED');
        else if (p.startsWith('TEMP:')) temp = parseFloat(p.replace('TEMP:', '')) || 24.5;
        else if (p.startsWith('HUM:')) hum = parseFloat(p.replace('HUM:', '')) || 75.0;
      }

      return {
        id: mappedId,
        node_id: mappedId,
        name: 'Village 1: Kashipur Valley',
        village: 'Kashipur Valley',
        district: 'Rayagada, Odisha',
        latitude: lat,
        longitude: lng,
        riskLevel: riskLevel,
        riskScore: riskScore,
        disasterType: disasterType,
        rainfall_mm: Math.round(rain),
        rainMm: Math.round(rain),
        rain: Math.round(rain),
        soil_moisture: Math.round(soil),
        soilMoisture: Math.round(soil),
        soil: Math.round(soil),
        smoke_level: Math.round(smoke),
        smokeLevel: Math.round(smoke),
        smoke: Math.round(smoke),
        flame_detected: flm,
        flameDetected: flm,
        vibration: vib,
        temperature: temp,
        temp: temp,
        humidity: hum,
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
  const [serverUrl, setServerUrl] = useState(() => {
    if (import.meta.env && import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    const host = window.location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'ws://127.0.0.1:8080/';
    }
    return `ws://${host}:8080/`;
  });

  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState('normal');
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [serialPortName, setSerialPortName] = useState('');

  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), text: '[DisasterGuard CORE] Rayagada DEOC Command Center Initialized (6 Physical Sensors).', type: 'sys' },
    { id: 2, time: new Date().toLocaleTimeString(), text: '[Gateway Bridge] Active on ws://127.0.0.1:8080.', type: 'sys' }
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

  // Standardize incoming node packet format (Node 1 Only - 6 Physical Sensors)
  const normalizeNodeData = useCallback((raw) => {
    if (!raw) return null;
    const mappedId = "NODE_01";
    const existing = nodes["NODE_01"] || INITIAL_NODES["NODE_01"];
    
    // 1. Rainfall
    let rainMm = 0;
    if (raw.rainfall_mm !== undefined) rainMm = Number(raw.rainfall_mm);
    else if (raw.rainMm !== undefined) rainMm = Number(raw.rainMm);
    else if (raw.rain !== undefined) rainMm = Number(raw.rain);
    else if (existing) rainMm = existing.rainMm;

    // 2. Soil Moisture
    let soilMoisture = 0;
    if (raw.soil_moisture !== undefined) soilMoisture = Number(raw.soil_moisture);
    else if (raw.soilMoisture !== undefined) soilMoisture = Number(raw.soilMoisture);
    else if (raw.soil !== undefined) soilMoisture = Number(raw.soil);
    else if (existing) soilMoisture = existing.soilMoisture;

    // 3. Smoke / Gas
    let smokeLevel = 0;
    if (raw.smoke_level !== undefined) smokeLevel = Number(raw.smoke_level);
    else if (raw.smokeLevel !== undefined) smokeLevel = Number(raw.smokeLevel);
    else if (raw.smoke !== undefined) smokeLevel = Number(raw.smoke);
    else if (existing) smokeLevel = existing.smokeLevel;

    // 4. Flame IR
    let flameDetected = false;
    if (raw.flame_detected !== undefined) flameDetected = Boolean(raw.flame_detected);
    else if (raw.flameDetected !== undefined) flameDetected = Boolean(raw.flameDetected);
    else if (raw.flame !== undefined) flameDetected = typeof raw.flame === 'boolean' ? raw.flame : Number(raw.flame) > 50;
    else if (existing) flameDetected = existing.flameDetected;

    // 5. Vibration
    const vibration = raw.vibration !== undefined ? Boolean(raw.vibration) : (existing ? existing.vibration : true);
    const vibrationFreq = raw.vibrationFreq !== undefined ? Number(raw.vibrationFreq) : (raw.vibrationHz !== undefined ? Number(raw.vibrationHz) : (existing?.vibrationFreq || (vibration ? 380 : 0)));

    // 6. DHT22 Climate
    let temp = 38.5;
    if (raw.temperature !== undefined) temp = Number(raw.temperature);
    else if (raw.temp !== undefined) temp = Number(raw.temp);
    else if (existing) temp = existing.temp;

    const humidity = raw.humidity !== undefined ? Number(raw.humidity) : (existing ? existing.humidity : 94);

    const rssi = raw.rssi !== undefined ? Number(raw.rssi) : (existing ? existing.rssi : -65);
    const hopCount = raw.hopCount !== undefined ? Number(raw.hopCount) : 1;

    // Weighted risk computed from strictly the 6 physical sensors
    let calculatedRiskScore = raw.riskScore !== undefined ? Number(raw.riskScore) : null;
    if (calculatedRiskScore === null) {
      const rainScore = (rainMm / 100) * 25;
      const soilScore = (soilMoisture / 100) * 20;
      const vibScore = vibration ? 20 : 0;
      const flameScore = flameDetected ? 15 : 0;
      const smokeScore = Math.min(10, (smokeLevel / 200) * 10);
      const tempScore = temp > 40 ? 10 : 2;
      calculatedRiskScore = Math.min(100, Math.round(rainScore + soilScore + vibScore + flameScore + smokeScore + tempScore));
    }

    let calculatedRiskLevel = raw.riskLevel || (calculatedRiskScore >= 70 ? "CRITICAL" : calculatedRiskScore >= 40 ? "WARNING" : "NORMAL");
    if (calculatedRiskLevel === "NORMAL" || calculatedRiskScore < 25) {
      calculatedRiskLevel = "NORMAL";
    }
    
    const riskTypes = raw.risk || {
      flood: rainMm > 60 ? "CRITICAL" : rainMm > 30 ? "HIGH" : "LOW",
      landslide: (soilMoisture > 80 && vibration) ? "CRITICAL" : soilMoisture > 65 ? "HIGH" : "LOW",
      fire: flameDetected ? "CRITICAL" : smokeLevel > 150 ? "HIGH" : smokeLevel > 70 ? "MEDIUM" : "LOW",
      cyclone: (rainMm > 70 && humidity > 90) ? "HIGH" : "LOW"
    };

    const disasterType = raw.disasterType || (flameDetected ? "WILDFIRE" : (vibration && soilMoisture > 75 ? "LANDSLIDE" : (rainMm > 60 ? "HEAVY_RAIN" : "WILDFIRE / LANDSLIDE")));

    return {
      id: mappedId,
      name: 'Village 1: Kashipur Valley',
      village: 'Kashipur Valley',
      district: 'Rayagada, Odisha',
      latitude: raw.latitude !== undefined ? raw.latitude : 19.1950,
      longitude: raw.longitude !== undefined ? raw.longitude : 83.3950,
      riskLevel: calculatedRiskLevel,
      riskScore: calculatedRiskScore,
      disasterType: disasterType,
      rainMm: rainMm,
      rainPercent: Math.min(100, rainMm),
      rain: rainMm,
      soilMoisture: soilMoisture,
      soil: soilMoisture,
      temp: temp,
      temperature: temp,
      humidity: humidity,
      smokeLevel: smokeLevel,
      smoke: smokeLevel,
      flameDetected: flameDetected,
      flame_detected: flameDetected,
      flame: flameDetected ? 1 : 0,
      vibration: vibration,
      vibrationFreq: vibrationFreq,
      vibrationHz: vibrationFreq,
      hopCount: hopCount,
      rssi: rssi,
      lastSeen: Date.now(),
      risk: riskTypes,
      status: "ONLINE",
      rawPacket: raw.rawPacket || `${mappedId}|${calculatedRiskLevel}|RAIN:${rainMm}mm|SOIL:${soilMoisture}%|SMK:${smokeLevel}|FLM:${flameDetected ? '1' : '0'}|VIB:${vibration ? '1' : '0'}`
    };
  }, [nodes]);

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
      if (node.riskLevel === 'CRITICAL' || node.riskScore >= 70) {
        playEmergencySiren(2.0);
        const newAlert = {
          id: `ALT-${Date.now().toString().slice(-4)}`,
          title: `EMERGENCY: ${node.disasterType || 'DISASTER HAZARD'} AT ${node.name.toUpperCase()}`,
          desc: `Rain: ${node.rainMm}mm/h | Soil: ${node.soilMoisture}% | Smoke: ${node.smokeLevel} PPM | Flame: ${node.flameDetected ? 'YES' : 'NO'} | Vibration: ${node.vibration ? 'YES' : 'NO'}`,
          level: 'CRITICAL',
          village: node.name,
          nodeId: node.id,
          disasterType: node.disasterType || 'HIGH_THREAT',
          triggerSensor: '6-Sensor IoT Array',
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
          rain: node.rainMm,
          soilMoisture: node.soilMoisture,
          smokeLevel: node.smokeLevel,
          flameDetected: node.flameDetected,
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
        `[LIVE TELEMETRY] ${node.id} (${node.village}) ➔ Rain: ${node.rainMm}mm | Soil: ${node.soilMoisture}% | Smoke: ${node.smokeLevel} PPM | Flame: ${node.flameDetected ? 'YES' : 'NO'} | Vib: ${node.vibration ? 'YES' : 'NO'} | Temp: ${node.temp}°C`,
        node.riskLevel === 'CRITICAL' ? 'danger' : node.riskLevel === 'WARNING' ? 'warn' : 'rx'
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

  // Direct Browser Web Serial API Connection
  const connectUsbSerial = useCallback(async () => {
    if (!('serial' in navigator)) {
      alert('Web Serial API is supported in Chrome/Edge.');
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
              lineBuffer = lines.pop();

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
    }
    return false;
  }, [addLog]);

  // Audio Siren
  const triggerSiren = useCallback(() => {
    playEmergencySiren(2.5, 0.35);
    sendCommand('SIREN', { duration: 3000 });
    addLog('[COMMAND] Evacuation Siren broadcasted to Node 1!', 'danger');
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

  // Interactive Demo Simulation Scenarios Engine for 6 Sensors
  const setSimulationScenario = useCallback((scenario) => {
    setActiveScenario(scenario);
    setIsDemoMode(true);
    playTacticalBeep(1600, 0.12);
    addLog(`[SIMULATOR] Switching to Scenario: ${scenario.toUpperCase()}`, 'sys');

    const baseV1 = { ...INITIAL_NODES["NODE_01"] };

    if (scenario === 'normal') {
      baseV1.rainMm = 0;
      baseV1.soilMoisture = 25;
      baseV1.smokeLevel = 10;
      baseV1.flameDetected = false;
      baseV1.vibration = false;
      baseV1.temp = 24.5;
      baseV1.humidity = 70;
      baseV1.riskScore = 10;
      baseV1.riskLevel = "NORMAL";
      baseV1.disasterType = "NONE";
      baseV1.risk = { flood: "LOW", landslide: "LOW", fire: "LOW", cyclone: "LOW" };
    } else if (scenario === 'flood') {
      baseV1.rainMm = 120;
      baseV1.soilMoisture = 95;
      baseV1.smokeLevel = 15;
      baseV1.flameDetected = false;
      baseV1.vibration = false;
      baseV1.temp = 22.0;
      baseV1.humidity = 98;
      baseV1.riskScore = 92;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "FLASH_FLOOD";
      baseV1.risk = { flood: "CRITICAL", landslide: "HIGH", fire: "LOW", cyclone: "HIGH" };
      playEmergencySiren(2.0);
    } else if (scenario === 'landslide') {
      baseV1.rainMm = 75;
      baseV1.soilMoisture = 99;
      baseV1.vibration = true;
      baseV1.smokeLevel = 10;
      baseV1.flameDetected = false;
      baseV1.temp = 21.0;
      baseV1.humidity = 95;
      baseV1.riskScore = 95;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "LANDSLIDE";
      baseV1.risk = { flood: "HIGH", landslide: "CRITICAL", fire: "LOW", cyclone: "LOW" };
      playEmergencySiren(2.0);
    } else if (scenario === 'fire') {
      baseV1.rainMm = 0;
      baseV1.soilMoisture = 10;
      baseV1.smokeLevel = 380;
      baseV1.flameDetected = true;
      baseV1.vibration = false;
      baseV1.temp = 48.5;
      baseV1.humidity = 18;
      baseV1.riskScore = 96;
      baseV1.riskLevel = "CRITICAL";
      baseV1.disasterType = "WILDFIRE";
      baseV1.risk = { flood: "LOW", landslide: "LOW", fire: "CRITICAL", cyclone: "LOW" };
      playEmergencySiren(2.0);
    }

    handleIncomingData([baseV1]);
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

  // Mount effect: Connect to WebSocket
  useEffect(() => {
    connectWebSocket(serverUrl);
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connectWebSocket, serverUrl]);

  // Periodic Real-Time Telemetry Auto-Fluctuation ("aur kuch kuch der mai change hote rahega")
  useEffect(() => {
    const liveTimer = setInterval(() => {
      setNodes(prev => {
        const current = prev["NODE_01"] || INITIAL_NODES["NODE_01"];
        const dRain = (Math.random() * 0.6 - 0.3);
        const dSoil = (Math.random() * 0.8 - 0.4);
        const dSmoke = Math.floor(Math.random() * 7 - 3);
        const dVibFreq = Math.floor(Math.random() * 11 - 5);
        const dTemp = (Math.random() * 0.4 - 0.2);
        const dHum = (Math.random() * 0.6 - 0.3);

        const newRain = Number(Math.max(3.0, Math.min(8.0, (current.rainMm || 5.0) + dRain)).toFixed(1));
        const newSoil = Number(Math.max(89.0, Math.min(95.0, (current.soilMoisture || 92.0) + dSoil)).toFixed(1));
        const newSmoke = Math.max(305, Math.min(338, (current.smokeLevel || 320) + dSmoke));
        const newVibFreq = Math.max(360, Math.min(405, (current.vibrationFreq || 380) + dVibFreq));
        const newTemp = Number(Math.max(37.5, Math.min(39.5, (current.temp || 38.5) + dTemp)).toFixed(1));
        const newHum = Number(Math.max(91.0, Math.min(97.0, (current.humidity || 94.0) + dHum)).toFixed(1));
        const newRisk = Number(Math.max(82.0, Math.min(96.0, 88.5 + (Math.random() * 2.0 - 1.0))).toFixed(1));

        const updated = {
          ...current,
          rainMm: newRain,
          rain: newRain,
          soilMoisture: newSoil,
          soil: newSoil,
          smokeLevel: newSmoke,
          smoke: newSmoke,
          flameDetected: true,
          flame_detected: true,
          flame: 1,
          vibration: true,
          vibrationFreq: newVibFreq,
          vibrationHz: newVibFreq,
          temp: newTemp,
          temperature: newTemp,
          humidity: newHum,
          riskScore: newRisk,
          riskLevel: 'EMERGENCY',
          disasterType: 'WILDFIRE / LANDSLIDE',
          lastSeen: Date.now()
        };

        // Update real-time history chart
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory(hPrev => {
          const next = [...hPrev, {
            time: timeStr,
            rain: newRain,
            soilMoisture: newSoil,
            smokeLevel: newSmoke,
            flameDetected: true,
            temp: newTemp,
            humidity: newHum,
            vibration: 1,
            vibrationFreq: newVibFreq,
            rssi: current.rssi || -65,
            riskScore: newRisk,
            nodeId: 'NODE_01'
          }];
          return next.length > 25 ? next.slice(next.length - 25) : next;
        });

        return {
          ...prev,
          ["NODE_01"]: updated
        };
      });
    }, 2500);

    return () => clearInterval(liveTimer);
  }, []);

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
