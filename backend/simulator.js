import { NodeModel } from '../database/models/NodeModel.js';
import { TelemetryModel } from '../database/models/TelemetryModel.js';

// Realistic Physical Sensor State Tracker for Rayagada District (ESP32 Node 1)
class SensorPhysicsEngine {
  constructor() {
    this.packetSequence = 1024;
    this.scenario = 'normal'; // 'normal', 'flood', 'monsoon', 'landslide', 'fire', 'cyclone'
    
    // Internal floating-point physical states (Continuous drift)
    this.state = {
      rainMm: 0.0,
      soilMoisture: 34.2,
      smokePpm: 18.4,
      flameDetected: false,
      flameVoltage: 3.26, // 3.3V = No Flame, <0.8V = Fire Detected
      vibrationActive: false,
      vibrationHz: 0.0,
      vibrationG: 0.02, // 0.02g ambient baseline seismic noise
      temperatureC: 26.4,
      humidityPct: 64.5,
      rssi: -67.0,
      snr: 8.6,
      hopCount: 1
    };

    // Scenario target configurations for realistic asymptotic convergence
    this.scenarioTargets = {
      normal: {
        rainTarget: 0.0,
        soilTarget: 34.0,
        smokeTarget: 18.0,
        tempTarget: 26.5,
        humTarget: 64.0,
        flame: false,
        vibration: false,
        disasterType: 'NONE'
      },
      flood: {
        rainTarget: 118.0,
        soilTarget: 97.5,
        smokeTarget: 15.0,
        tempTarget: 21.8,
        humTarget: 98.0,
        flame: false,
        vibration: false,
        disasterType: 'CRITICAL FLASH FLOOD'
      },
      monsoon: {
        rainTarget: 48.0,
        soilTarget: 78.0,
        smokeTarget: 16.0,
        tempTarget: 23.5,
        humTarget: 92.0,
        flame: false,
        vibration: false,
        disasterType: 'HEAVY MONSOON'
      },
      landslide: {
        rainTarget: 68.0,
        soilTarget: 99.0,
        smokeTarget: 14.0,
        tempTarget: 21.0,
        humTarget: 96.0,
        flame: false,
        vibration: true,
        disasterType: 'LANDSLIDE & SLOPE SHIFT'
      },
      fire: {
        rainTarget: 0.0,
        soilTarget: 12.0,
        smokeTarget: 385.0,
        tempTarget: 49.5,
        humTarget: 18.0,
        flame: true,
        vibration: false,
        disasterType: 'WILDFIRE & TOXIC SMOKE'
      },
      cyclone: {
        rainTarget: 145.0,
        soilTarget: 98.0,
        smokeTarget: 14.0,
        tempTarget: 20.5,
        humTarget: 99.0,
        flame: false,
        vibration: true,
        disasterType: 'SEVERE CYCLONIC STORM'
      }
    };
  }

  setScenario(name) {
    const key = (name || 'normal').toLowerCase();
    if (this.scenarioTargets[key]) {
      this.scenario = key;
      console.log(`[Simulator Physics] Scenario transitioned to: ${key.toUpperCase()}`);
    }
  }

  // Gaussian-like noise generator (Box-Muller transform)
  _gaussianNoise(mean = 0, stdDev = 1) {
    let u1 = Math.random();
    let u2 = Math.random();
    while (u1 === 0) u1 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * stdDev;
  }

  // Physics update step (called on each telemetry cycle)
  step() {
    this.packetSequence++;
    const target = this.scenarioTargets[this.scenario] || this.scenarioTargets.normal;
    const s = this.state;

    // 1. Rain Physics: Smooth convergence + wind gust noise (FC-37 Rain sensor)
    const rainDrift = (target.rainTarget - s.rainMm) * 0.18;
    const rainNoise = target.rainTarget > 0 ? this._gaussianNoise(0, 1.8) : Math.max(0, this._gaussianNoise(0, 0.04));
    s.rainMm = Math.max(0, s.rainMm + rainDrift + rainNoise);

    // 2. Soil Moisture Physics: Capacitive hysteresis (absorbs gradually, dries very slowly)
    const absorptionRate = s.rainMm > 20 ? 0.12 : 0.05;
    const soilDrift = (target.soilTarget - s.soilMoisture) * absorptionRate;
    const soilNoise = this._gaussianNoise(0, 0.15);
    s.soilMoisture = Math.max(5.0, Math.min(99.8, s.soilMoisture + soilDrift + soilNoise));

    // 3. Smoke & Gas Physics: Brownian thermal noise + plume turbulence (MQ-2 / MQ-135)
    const smokeDrift = (target.smokeTarget - s.smokePpm) * 0.22;
    const smokeNoise = target.smokeTarget > 100 ? this._gaussianNoise(0, 8.5) : this._gaussianNoise(0, 0.45);
    s.smokePpm = Math.max(8.0, Math.min(800.0, s.smokePpm + smokeDrift + smokeNoise));

    // 4. Flame IR Optical Sensor (KY-026)
    if (target.flame) {
      s.flameDetected = true;
      s.flameVoltage = Math.max(0.18, Math.min(0.65, 0.38 + this._gaussianNoise(0, 0.08)));
    } else {
      s.flameDetected = false;
      s.flameVoltage = Math.max(3.18, Math.min(3.30, 3.26 + this._gaussianNoise(0, 0.02)));
    }

    // 5. Vibration / Seismic Shock (SW-420 Piezo / ADXL345)
    if (target.vibration) {
      // Intermittent tremor pulses during active geological / wind events
      const isTremorPulse = Math.random() < 0.85;
      s.vibrationActive = isTremorPulse;
      s.vibrationHz = isTremorPulse ? Math.max(18.0, 38.0 + this._gaussianNoise(0, 6.0)) : 0.0;
      s.vibrationG = isTremorPulse ? Math.max(0.35, 0.82 + this._gaussianNoise(0, 0.18)) : 0.04;
    } else {
      // Occasional micro-ambient noise pulse (1 out of 25 frames)
      const microJitter = Math.random() < 0.04;
      s.vibrationActive = microJitter;
      s.vibrationHz = microJitter ? 8.5 : 0.0;
      s.vibrationG = Math.max(0.01, 0.025 + this._gaussianNoise(0, 0.005));
    }

    // 6. DHT22 Climate Dynamics: Thermal inertia + evaporative humidity correlation
    const tempDrift = (target.tempTarget - s.temperatureC) * 0.10;
    const tempNoise = this._gaussianNoise(0, 0.08);
    s.temperatureC = Math.max(10.0, Math.min(58.0, s.temperatureC + tempDrift + tempNoise));

    const humDrift = (target.humTarget - s.humidityPct) * 0.12;
    const humNoise = this._gaussianNoise(0, 0.35);
    s.humidityPct = Math.max(12.0, Math.min(99.9, s.humidityPct + humDrift + humNoise));

    // 7. LoRa RF Physical Link Layer (SX1278 433MHz)
    // RSSI log-normal path loss + Rayleigh multipath fading
    s.rssi = Math.max(-95, Math.min(-58, -66.5 + this._gaussianNoise(0, 1.8)));
    s.snr = Math.max(3.0, Math.min(12.5, 8.6 + this._gaussianNoise(0, 0.5)));

    // 8. Calculate SIH Standard Weighted Risk Score (Matching ESP32 Firmware)
    const rainScore = (Math.min(100, s.rainMm) / 100.0) * 100.0;
    const soilScore = (s.soilMoisture / 100.0) * 100.0;
    const vibScore = s.vibrationActive ? 100.0 : 0.0;
    const flameScore = s.flameDetected ? 100.0 : 0.0;
    const smokeScore = Math.min(100.0, (s.smokePpm / 200.0) * 100.0);
    const climateScore = s.temperatureC > 42.0 ? 100.0 : (s.temperatureC > 35.0 ? 50.0 : 10.0);

    const rawTotalRisk = (rainScore * 0.25) + (soilScore * 0.20) +
                         (vibScore * 0.20) + (flameScore * 0.15) +
                         (smokeScore * 0.10) + (climateScore * 0.10);
    const riskScore = Number(Math.max(5.0, Math.min(100.0, rawTotalRisk)).toFixed(1));

    let riskLevel = 'NORMAL';
    if (riskScore >= 70.0) riskLevel = 'EMERGENCY';
    else if (riskScore >= 40.0) riskLevel = 'WARNING';

    let disasterType = target.disasterType;
    if (disasterType === 'NONE') {
      if (s.soilMoisture > 70) disasterType = 'SOIL_SATURATION_MONITORING';
      else if (s.rainMm > 15) disasterType = 'LIGHT_PRECIPITATION';
      else disasterType = 'BASELINE_STABLE';
    }

    // 9. Derive Hardware ADC 12-bit Equivalent Counts (0-4095) for ESP32 authenticity
    const adcRain = Math.max(0, Math.min(4095, Math.round(4095 - (s.rainMm / 150.0) * 3800)));
    const adcSoil = Math.max(0, Math.min(4095, Math.round(4095 - (s.soilMoisture / 100.0) * 2900)));
    const adcSmoke = Math.max(0, Math.min(4095, Math.round((s.smokePpm / 500.0) * 4095)));

    // Formatted Raw LoRa Packet String (Matches ESP32 Serial & LoRa Payload)
    const rawPacket = `V1|SEQ:${this.packetSequence}|LVL:${riskLevel}|EVT:${disasterType}|GPS:19.1950,83.3950|SCORE:${riskScore}|RAIN:${s.rainMm.toFixed(1)}mm(ADC:${adcRain})|SOIL:${s.soilMoisture.toFixed(1)}%(ADC:${adcSoil})|SMK:${s.smokePpm.toFixed(1)}PPM(ADC:${adcSmoke})|FLM:${s.flameDetected ? '1' : '0'}(${s.flameVoltage.toFixed(2)}V)|VIB:${s.vibrationActive ? '1' : '0'}(${s.vibrationG.toFixed(2)}g@${s.vibrationHz.toFixed(0)}Hz)|TEMP:${s.temperatureC.toFixed(1)}C|HUM:${s.humidityPct.toFixed(1)}%|RSSI:${s.rssi.toFixed(0)}dBm|SNR:+${s.snr.toFixed(1)}dB|HOP:1`;

    return {
      id: "V1",
      node_id: "NODE_01",
      name: "Village 1: Kashipur Valley",
      village: "Kashipur Valley",
      district: "Rayagada, Odisha",
      latitude: 19.1950,
      longitude: 83.3950,
      elevation: 310,
      riskLevel: riskLevel,
      disasterType: disasterType,
      riskScore: riskScore,
      packetSequence: this.packetSequence,

      // Sensor Metrics (Strict 6 Physical Sensors)
      rainMm: Number(s.rainMm.toFixed(1)),
      rainfall_mm: Number(s.rainMm.toFixed(1)),
      rain: Number(s.rainMm.toFixed(1)),
      soilMoisture: Number(s.soilMoisture.toFixed(1)),
      soil_moisture: Number(s.soilMoisture.toFixed(1)),
      soil: Number(s.soilMoisture.toFixed(1)),
      smokePpm: Number(s.smokePpm.toFixed(1)),
      smokeLevel: Number(s.smokePpm.toFixed(1)),
      smoke: Number(s.smokePpm.toFixed(1)),
      flameDetected: s.flameDetected,
      flame_detected: s.flameDetected,
      flame: s.flameDetected ? 1 : 0,
      flameIntensity: s.flameDetected ? 94.5 : 0.0,
      flameVoltage: Number(s.flameVoltage.toFixed(2)),
      vibration: s.vibrationActive,
      vibration_detected: s.vibrationActive,
      vibrationFreq: Number(s.vibrationHz.toFixed(1)),
      vibrationHz: Number(s.vibrationHz.toFixed(1)),
      vibrationG: Number(s.vibrationG.toFixed(2)),
      temp: Number(s.temperatureC.toFixed(1)),
      temperature: Number(s.temperatureC.toFixed(1)),
      temperatureC: Number(s.temperatureC.toFixed(1)),
      humidity: Number(s.humidityPct.toFixed(1)),
      humidityPct: Number(s.humidityPct.toFixed(1)),

      // Hardware ADC Diagnostics
      adcRain,
      adcSoil,
      adcSmoke,

      // LoRa Radio Layer
      hopCount: 1,
      rssi: Math.round(s.rssi),
      rssi_dbm: Math.round(s.rssi),
      snr: Number(s.snr.toFixed(1)),
      rawPacket: rawPacket,
      status: "ONLINE",
      lastSeen: Date.now()
    };
  }
}

export const physicsEngine = new SensorPhysicsEngine();

export const SIM_NODES = {
  "V1": physicsEngine.step()
};

export function setScenario(scenarioName) {
  physicsEngine.setScenario(scenarioName);
}

/**
 * Start Background Telemetry Simulation Loop
 * Persists data to SQLite database and broadcasts via WebSocket
 */
export function startSimulator(broadcastFn) {
  console.log('[Simulator] ⚡ High-Fidelity Physics Engine Active (Rayagada 6-Sensor Array)...');

  setInterval(async () => {
    try {
      const node1 = physicsEngine.step();
      SIM_NODES["V1"] = node1;

      // Persist to SQLite Database
      await NodeModel.updateTelemetry(node1);
      await TelemetryModel.insertLog({
        villageId: node1.id,
        riskScore: node1.riskScore,
        riskLevel: node1.riskLevel,
        disasterType: node1.disasterType,
        rain: Math.round(node1.rainMm),
        soil: Math.round(node1.soilMoisture),
        temp: node1.temperature,
        humidity: node1.humidity,
        vibration: node1.vibration,
        flame: node1.flame,
        smoke: Math.round(node1.smokePpm),
        hopCount: node1.hopCount,
        rssi: node1.rssi,
        snr: node1.snr,
        rawPacket: node1.rawPacket
      });

      // Broadcast over WebSocket to all connected browser dashboards
      broadcastFn(node1);

    } catch (err) {
      console.error('[Simulator Error]', err.message);
    }
  }, 2200);
}
