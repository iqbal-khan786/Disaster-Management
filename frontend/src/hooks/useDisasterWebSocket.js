import { useState, useEffect, useRef, useCallback } from 'react';
import { playEmergencySiren, playTacticalBeep, playAckChime } from '../utils/audioSiren';

// Baseline Realistic Physical Sensor State (Rayagada District - Kashipur Valley)
const INITIAL_NODES = {
  "NODE_01": {
    id: "NODE_01",
    name: "Village 1: Kashipur Valley",
    village: "Kashipur Valley",
    district: "Rayagada, Odisha",
    latitude: 19.1950,
    longitude: 83.3950,
    riskLevel: "NORMAL",
    riskScore: 18.5,
    disasterType: "BASELINE_STABLE",
    rainMm: 0.0,
    rainPercent: 0,
    rain: 0.0,
    soilMoisture: 34.2,
    soil: 34.2,
    smokeLevel: 18.4,
    smoke: 18.4,
    flameDetected: false,
    flame_detected: false,
    flame: 0,
    flameIntensity: 0.0,
    flameVoltage: 3.26,
    vibration: false,
    vibrationFreq: 0.0,
    vibrationHz: 0.0,
    vibrationG: 0.02,
    temp: 26.4,
    temperature: 26.4,
    humidity: 64.5,
    hopCount: 1,
    rssi: -67,
    snr: 8.6,
    packetSequence: 1024,
    lastSeen: Date.now(),
    risk: { flood: "LOW", landslide: "LOW", fire: "LOW", cyclone: "LOW" },
    status: "ONLINE"
  }
};

const INITIAL_HISTORY = [
  { time: new Date(Date.now() - 15000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 0.0, soilMoisture: 34.0, smokeLevel: 18.2, flameDetected: false, vibration: 0, vibrationFreq: 0, temp: 26.3, humidity: 64.8, rssi: -67, riskScore: 18.2, nodeId: 'NODE_01' },
  { time: new Date(Date.now() - 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 0.0, soilMoisture: 34.1, smokeLevel: 18.6, flameDetected: false, vibration: 0, vibrationFreq: 0, temp: 26.4, humidity: 64.6, rssi: -66, riskScore: 18.4, nodeId: 'NODE_01' },
  { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), rain: 0.0, soilMoisture: 34.2, smokeLevel: 18.4, flameDetected: false, vibration: 0, vibrationFreq: 0, temp: 26.4, humidity: 64.5, rssi: -67, riskScore: 18.5, nodeId: 'NODE_01' }
];

/**
 * Universal Packet Parser for 6 physical sensors:
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

  // 3. Pipe-separated LoRa packet string:
  // V1|SEQ:1024|LVL:NORMAL|EVT:BASELINE_STABLE|GPS:19.1950,83.3950|SCORE:18.5|...
  if (text.includes('|')) {
    const pipeIdx = text.indexOf('|');
    const firstWordStart = text.lastIndexOf(' ', pipeIdx);
    const cleanText = firstWordStart >= 0 ? text.substring(firstWordStart + 1) : text;
    const parts = cleanText.split('|');

    if (parts.length >= 4) {
      const mappedId = 'NODE_01';
      let riskLevel = 'NORMAL';
      let disasterType = 'NONE';
      let riskScore = 18.5;
      let rain = 0.0;
      let soil = 34.0;
      let smoke = 18.0;
      let flm = false;
      let vib = false;
      let temp = 26.4;
      let hum = 64.5;
      let hop = 1;
      let rssi = -67;
      let snr = 8.6;
      let seq = 1000;

      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.startsWith('LVL:')) riskLevel = p.replace('LVL:', '').trim();
        else if (p.startsWith('EVT:')) disasterType = p.replace('EVT:', '').trim();
        else if (p.startsWith('SCORE:')) riskScore = parseFloat(p.replace('SCORE:', '')) || 18.5;
        else if (p.startsWith('SEQ:')) seq = parseInt(p.replace('SEQ:', ''), 10) || 1000;
        else if (p.startsWith('HOP:')) hop = parseInt(p.replace('HOP:', ''), 10) || 1;
        else if (p.startsWith('RAIN:')) {
          const match = p.match(/RAIN:([0-9.]+)/);
          if (match) rain = parseFloat(match[1]) || 0.0;
        }
        else if (p.startsWith('SOIL:')) {
          const match = p.match(/SOIL:([0-9.]+)/);
          if (match) soil = parseFloat(match[1]) || 34.0;
        }
        else if (p.startsWith('SMK:')) {
          const match = p.match(/SMK:([0-9.]+)/);
          if (match) smoke = parseFloat(match[1]) || 18.0;
        }
        else if (p.startsWith('FLM:')) flm = p.includes('1') || p.includes('true') || p.includes('TRUE');
        else if (p.startsWith('VIB:')) vib = p.includes('1') || p.includes('true') || p.includes('TRUE');
        else if (p.startsWith('TEMP:')) {
          const match = p.match(/TEMP:([0-9.]+)/);
          if (match) temp = parseFloat(match[1]) || 26.4;
        }
        else if (p.startsWith('HUM:')) {
          const match = p.match(/HUM:([0-9.]+)/);
          if (match) hum = parseFloat(match[1]) || 64.5;
        }
        else if (p.startsWith('RSSI:')) {
          const match = p.match(/RSSI:(-?[0-9.]+)/);
          if (match) rssi = parseInt(match[1], 10) || -67;
        }
        else if (p.startsWith('SNR:')) {
          const match = p.match(/SNR:(\+?-?[0-9.]+)/);
          if (match) snr = parseFloat(match[1]) || 8.6;
        }
      }

      return {
        id: mappedId,
        node_id: mappedId,
        name: 'Village 1: Kashipur Valley',
        village: 'Kashipur Valley',
        district: 'Rayagada, Odisha',
        latitude: 19.1950,
        longitude: 83.3950,
        riskLevel: riskLevel,
        riskScore: riskScore,
        disasterType: disasterType,
        packetSequence: seq,
        rainMm: rain,
        rain: rain,
        soilMoisture: soil,
        soil: soil,
        smokeLevel: smoke,
        smoke: smoke,
        flameDetected: flm,
        vibration: vib,
        temperature: temp,
        temp: temp,
        humidity: hum,
        hopCount: hop,
        rssi: rssi,
        snr: snr,
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
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  // Append system or radio log
  const addLog = useCallback((text, type = 'normal') => {
    setLogs(prev => [
      { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), text, type },
      ...prev.slice(0, 59)
    ]);
  }, []);

  // Standardize incoming node packet format (Node 1 - 6 Physical Sensors)
  const normalizeNodeData = useCallback((raw) => {
    if (!raw) return null;
    const mappedId = "NODE_01";
    const existing = nodes["NODE_01"] || INITIAL_NODES["NODE_01"];
    
    // 1. Rainfall (mm/h)
    let rainMm = 0.0;
    if (raw.rainfall_mm !== undefined) rainMm = Number(raw.rainfall_mm);
    else if (raw.rainMm !== undefined) rainMm = Number(raw.rainMm);
    else if (raw.rain !== undefined) rainMm = Number(raw.rain);
    else if (existing) rainMm = existing.rainMm;
    rainMm = Number(rainMm.toFixed(1));

    // 2. Soil Moisture (%)
    let soilMoisture = 34.0;
    if (raw.soil_moisture !== undefined) soilMoisture = Number(raw.soil_moisture);
    else if (raw.soilMoisture !== undefined) soilMoisture = Number(raw.soilMoisture);
    else if (raw.soil !== undefined) soilMoisture = Number(raw.soil);
    else if (existing) soilMoisture = existing.soilMoisture;
    soilMoisture = Number(soilMoisture.toFixed(1));

    // 3. Smoke / Gas (PPM)
    let smokeLevel = 18.0;
    if (raw.smoke_level !== undefined) smokeLevel = Number(raw.smoke_level);
    else if (raw.smokeLevel !== undefined) smokeLevel = Number(raw.smokeLevel);
    else if (raw.smoke !== undefined) smokeLevel = Number(raw.smoke);
    else if (raw.smokePpm !== undefined) smokeLevel = Number(raw.smokePpm);
    else if (existing) smokeLevel = existing.smokeLevel;
    smokeLevel = Number(smokeLevel.toFixed(1));

    // 4. Flame IR
    let flameDetected = false;
    if (raw.flame_detected !== undefined) flameDetected = Boolean(raw.flame_detected);
    else if (raw.flameDetected !== undefined) flameDetected = Boolean(raw.flameDetected);
    else if (raw.flame !== undefined) flameDetected = typeof raw.flame === 'boolean' ? raw.flame : Number(raw.flame) > 0;
    else if (existing) flameDetected = existing.flameDetected;

    const flameVoltage = raw.flameVoltage !== undefined ? Number(raw.flameVoltage) : (flameDetected ? 0.38 : 3.26);

    // 5. Vibration (SW-420)
    const vibration = raw.vibration !== undefined ? Boolean(raw.vibration) : (raw.vibration_detected !== undefined ? Boolean(raw.vibration_detected) : (existing ? existing.vibration : false));
    const vibrationFreq = raw.vibrationFreq !== undefined ? Number(raw.vibrationFreq) : (raw.vibrationHz !== undefined ? Number(raw.vibrationHz) : (existing?.vibrationFreq || (vibration ? 38.0 : 0.0)));
    const vibrationG = raw.vibrationG !== undefined ? Number(raw.vibrationG) : (vibration ? 0.75 : 0.02);

    // 6. DHT22 Climate
    let temp = 26.4;
    if (raw.temperature !== undefined) temp = Number(raw.temperature);
    else if (raw.temperatureC !== undefined) temp = Number(raw.temperatureC);
    else if (raw.temp !== undefined) temp = Number(raw.temp);
    else if (existing) temp = existing.temp;
    temp = Number(temp.toFixed(1));

    let humidity = 64.5;
    if (raw.humidity !== undefined) humidity = Number(raw.humidity);
    else if (raw.humidityPct !== undefined) humidity = Number(raw.humidityPct);
    else if (existing) humidity = existing.humidity;
    humidity = Number(humidity.toFixed(1));

    const rssi = raw.rssi !== undefined ? Number(raw.rssi) : (raw.rssi_dbm !== undefined ? Number(raw.rssi_dbm) : (existing ? existing.rssi : -67));
    const snr = raw.snr !== undefined ? Number(raw.snr) : (existing?.snr || 8.6);
    const hopCount = raw.hopCount !== undefined ? Number(raw.hopCount) : 1;
    const packetSequence = raw.packetSequence !== undefined ? Number(raw.packetSequence) : (existing?.packetSequence ? existing.packetSequence + 1 : 1024);

    // Weighted risk computed from strictly the 6 physical sensors
    let calculatedRiskScore = raw.riskScore !== undefined ? Number(raw.riskScore) : null;
    if (calculatedRiskScore === null) {
      const rainScore = (Math.min(100, rainMm) / 100.0) * 100.0;
      const soilScore = (soilMoisture / 100.0) * 100.0;
      const vibScore = vibration ? 100.0 : 0.0;
      const flameScore = flameDetected ? 100.0 : 0.0;
      const smokeScore = Math.min(100.0, (smokeLevel / 200.0) * 100.0);
      const climateScore = temp > 42.0 ? 100.0 : (temp > 35.0 ? 50.0 : 10.0);
      calculatedRiskScore = Number(Math.max(5.0, Math.min(100.0, (rainScore * 0.25) + (soilScore * 0.20) + (vibScore * 0.20) + (flameScore * 0.15) + (smokeScore * 0.10) + (climateScore * 0.10))).toFixed(1));
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

    const disasterType = raw.disasterType || (flameDetected ? "WILDFIRE" : (vibration && soilMoisture > 75 ? "LANDSLIDE" : (rainMm > 60 ? "FLASH_FLOOD" : "BASELINE_STABLE")));

    return {
      id: mappedId,
      name: 'Village 1: Kashipur Valley',
      village: 'Kashipur Valley',
      district: 'Rayagada, Odisha',
      latitude: raw.latitude !== undefined ? raw.latitude : 19.1950,
      longitude: raw.longitude !== undefined ? raw.longitude : 83.3950,
      elevation: 310,
      riskLevel: calculatedRiskLevel,
      riskScore: calculatedRiskScore,
      disasterType: disasterType,
      packetSequence: packetSequence,
      rainMm: rainMm,
      rainPercent: Math.min(100, Math.round(rainMm)),
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
      flameIntensity: flameDetected ? 94.5 : 0.0,
      flameVoltage: flameVoltage,
      vibration: vibration,
      vibrationFreq: vibrationFreq,
      vibrationHz: vibrationFreq,
      vibrationG: vibrationG,
      hopCount: hopCount,
      rssi: rssi,
      snr: snr,
      lastSeen: Date.now(),
      risk: riskTypes,
      status: "ONLINE",
      rawPacket: raw.rawPacket || `V1|SEQ:${packetSequence}|LVL:${calculatedRiskLevel}|EVT:${disasterType}|RAIN:${rainMm}mm|SOIL:${soilMoisture}%|SMK:${smokeLevel}PPM|FLM:${flameDetected ? '1' : '0'}|VIB:${vibration ? '1' : '0'}|TEMP:${temp}C|HUM:${humidity}%|RSSI:${rssi}dBm`
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
      if (node.riskLevel === 'CRITICAL' || node.riskLevel === 'EMERGENCY' || node.riskScore >= 70) {
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
        `[LoRa PKT #${node.packetSequence || 1024}] ${node.id} ➔ Rain: ${node.rainMm}mm | Soil: ${node.soilMoisture}% | Smoke: ${node.smokeLevel} PPM | Flame: ${node.flameDetected ? 'YES' : 'NO'} | Vib: ${node.vibration ? 'ACTIVE' : 'OFF'} | Temp: ${node.temp}°C | RSSI: ${node.rssi}dBm`,
        (node.riskLevel === 'CRITICAL' || node.riskLevel === 'EMERGENCY') ? 'danger' : node.riskLevel === 'WARNING' ? 'warn' : 'rx'
      );
    });
  }, [normalizeNodeData, addLog]);

  handleIncomingDataRef.current = handleIncomingData;

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
      const portInfo = port.getInfo ? port.getInfo() : {};
      const portTitle = portInfo.usbVendorId ? `USB COM (VID:${portInfo.usbVendorId.toString(16)})` : 'ESP32 Serial';
      setSerialPortName(portTitle);
      addLog(`[Web Serial] Connected to ${portTitle} at 115200 baud.`, 'ack');

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      (async () => {
        let buffer = '';
        while (true) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                const parsed = parseAnyIncomingData(line);
                if (parsed && handleIncomingDataRef.current) {
                  handleIncomingDataRef.current(parsed);
                } else if (line.trim().length > 0) {
                  addLog(`[ESP32 HW] ${line.trim()}`, 'rx');
                }
              }
            }
          } catch (readErr) {
            console.warn('Serial read loop error:', readErr);
            break;
          }
        }
      })();

      return true;
    } catch (err) {
      addLog(`[Web Serial Error] ${err.message}`, 'danger');
      return false;
    }
  }, [addLog]);

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

  // Interactive Demo Simulation Scenarios Engine
  const setSimulationScenario = useCallback((scenario) => {
    setActiveScenario(scenario);
    playTacticalBeep(1600, 0.12);
    addLog(`[SCENARIO] Switched to Scenario: ${scenario.toUpperCase()}`, 'sys');

    // Notify backend physics engine via WebSocket
    sendCommand('SET_SCENARIO', { scenario });

    // Also update offline fallback state smoothly
    setNodes(prev => {
      const current = prev["NODE_01"] || INITIAL_NODES["NODE_01"];
      const updated = { ...current };

      if (scenario === 'normal') {
        updated.rainMm = 0.0;
        updated.soilMoisture = 34.2;
        updated.smokeLevel = 18.4;
        updated.flameDetected = false;
        updated.flame = 0;
        updated.vibration = false;
        updated.temp = 26.4;
        updated.humidity = 64.5;
        updated.riskScore = 18.5;
        updated.riskLevel = "NORMAL";
        updated.disasterType = "BASELINE_STABLE";
      } else if (scenario === 'flood') {
        updated.rainMm = 118.0;
        updated.soilMoisture = 97.5;
        updated.smokeLevel = 15.0;
        updated.flameDetected = false;
        updated.flame = 0;
        updated.vibration = false;
        updated.temp = 21.8;
        updated.humidity = 98.0;
        updated.riskScore = 92.5;
        updated.riskLevel = "CRITICAL";
        updated.disasterType = "FLASH_FLOOD";
        playEmergencySiren(2.0);
      } else if (scenario === 'landslide') {
        updated.rainMm = 68.0;
        updated.soilMoisture = 99.0;
        updated.vibration = true;
        updated.smokeLevel = 14.0;
        updated.flameDetected = false;
        updated.flame = 0;
        updated.temp = 21.0;
        updated.humidity = 96.0;
        updated.riskScore = 94.0;
        updated.riskLevel = "CRITICAL";
        updated.disasterType = "LANDSLIDE";
        playEmergencySiren(2.0);
      } else if (scenario === 'fire') {
        updated.rainMm = 0.0;
        updated.soilMoisture = 12.0;
        updated.smokeLevel = 385.0;
        updated.flameDetected = true;
        updated.flame = 1;
        updated.vibration = false;
        updated.temp = 49.5;
        updated.humidity = 18.0;
        updated.riskScore = 96.0;
        updated.riskLevel = "CRITICAL";
        updated.disasterType = "WILDFIRE";
        playEmergencySiren(2.0);
      }

      return {
        ...prev,
        ["NODE_01"]: updated
      };
    });
  }, [sendCommand, addLog]);

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

  // Standalone offline fallback generator (only triggers when WebSocket and Serial are disconnected)
  useEffect(() => {
    const offlineTimer = setInterval(() => {
      if (connectionStatus === 'CONNECTED' || isSerialConnected) {
        return; // Backend/Serial is streaming live data, do not overwrite
      }

      setNodes(prev => {
        const current = prev["NODE_01"] || INITIAL_NODES["NODE_01"];
        const dSoil = (Math.random() * 0.1 - 0.05);
        const dSmoke = (Math.random() * 0.2 - 0.1);
        const dTemp = (Math.random() * 0.08 - 0.04);
        const dHum = (Math.random() * 0.16 - 0.08);

        const newRain = current.rainMm > 0 ? Number(current.rainMm.toFixed(1)) : 0.0;
        const newSoil = Number(Math.max(5.0, Math.min(99.5, (current.soilMoisture || 34.2) + dSoil)).toFixed(1));
        const newSmoke = Number(Math.max(10.0, Math.min(800.0, (current.smokeLevel || 18.4) + dSmoke)).toFixed(1));
        const newTemp = Number(Math.max(15.0, Math.min(50.0, (current.temp || 26.4) + dTemp)).toFixed(1));
        const newHum = Number(Math.max(15.0, Math.min(99.0, (current.humidity || 64.5) + dHum)).toFixed(1));

        const updated = {
          ...current,
          rainMm: newRain,
          rain: newRain,
          soilMoisture: newSoil,
          soil: newSoil,
          smokeLevel: newSmoke,
          smoke: newSmoke,
          temp: newTemp,
          temperature: newTemp,
          humidity: newHum,
          packetSequence: (current.packetSequence || 1024) + 1,
          rssi: -67 + Math.floor(Math.random() * 2),
          lastSeen: Date.now()
        };

        return {
          ...prev,
          ["NODE_01"]: updated
        };
      });
    }, 4500);

    return () => clearInterval(offlineTimer);
  }, [connectionStatus, isSerialConnected]);

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
