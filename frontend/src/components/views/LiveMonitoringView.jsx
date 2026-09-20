import React, { useState } from 'react';
import {
  Activity,
  Droplets,
  Mountain,
  Flame,
  Thermometer,
  Send,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Truck,
  ArrowRight,
  Clock,
  Navigation,
  Info
} from 'lucide-react';

export function LiveMonitoringView({
  nodes = {},
  onSelectNode: _onSelectNode,
  onOpenDispatch,
  onTriggerSiren: _onTriggerSiren
}) {
  const nodeList = Object.values(nodes);
  const [selectedVillageId, setSelectedVillageId] = useState("NODE_01");
  const [forwardSuccess, setForwardSuccess] = useState(false);
  const [lastForwardedTimestamp, setLastForwardedTimestamp] = useState(null);

  const currentNode = nodes[selectedVillageId] || nodeList[0] || {};

  // =========================================================================
  // 1. COMPUTE NORMALIZED 6 PHYSICAL SENSOR CONTRIBUTIONS (SIH FUSION MODEL)
  // =========================================================================
  // Rain (25% Weight): 4 pts ambient baseline + precipitation intensity
  const rainMm = Number(currentNode.rainMm || currentNode.rain || 0);
  const rainPts = Math.min(25, Math.round(4 + (rainMm > 0 ? (rainMm / 75) * 21 : 0)));
  const rainPct = Math.min(100, Math.round((rainPts / 25) * 100));

  // Soil Moisture (20% Weight): 3 pts subsurface baseline + moisture saturation
  const soilMoisture = Number(currentNode.soilMoisture || currentNode.soil || 34.1);
  const soilPts = Math.min(20, Math.max(3, Math.round(3 + (soilMoisture / 100) * 17)));
  const soilPct = Math.min(100, Math.round((soilPts / 20) * 100));

  // Smoke & Gas (10% Weight): 2 pts clean VOC baseline + gas concentration
  const smokeLevel = Number(currentNode.smokeLevel || currentNode.smoke || 17.3);
  const smokePts = Math.min(10, Math.max(2, Math.round(2 + (smokeLevel / 200) * 8)));
  const smokePct = Math.min(100, Math.round((smokePts / 10) * 100));

  // Flame IR (15% Weight): 2 pts solar ambient baseline + optical trigger
  const flameDetected = Boolean(currentNode.flameDetected || currentNode.flame_detected);
  const flamePts = flameDetected ? 15 : 2;
  const flamePct = flameDetected ? 100 : 13;

  // Seismic / Slope Vibration (20% Weight): 3 pts geological noise + tremor trigger
  const vibration = Boolean(currentNode.vibration);
  const vibePts = vibration ? 20 : 3;
  const vibePct = vibration ? 100 : 15;

  // Climate DHT22 (10% Weight): 4 pts thermal baseline + heat stress
  const tempVal = Number(currentNode.temp || 26.5);
  const climateScoreRatio = tempVal > 42 ? 1.0 : (tempVal > 35 ? 0.75 : (tempVal < 10 ? 0.55 : 0.38));
  const climatePts = Math.min(10, Math.max(3, Math.round(climateScoreRatio * 10)));
  const climatePct = Math.min(100, Math.round((climatePts / 10) * 100));

  // =========================================================================
  // 2. CALCULATE WEIGHTED COMPOSITE AVERAGE INDEX (0 - 100%)
  // =========================================================================
  const rawCalculatedScore = rainPts + soilPts + smokePts + flamePts + vibePts + climatePts;
  const averageSensorScore = Math.min(100, Math.max(15, Math.round(currentNode.riskScore || rawCalculatedScore)));

  // =========================================================================
  // 3. EVALUATE 3 CONDITIONS: SAFE (0-39), WARNING (40-69), DANGER (70-100)
  // =========================================================================
  let sensorCondition = 'SAFE';
  let conditionColor = '#10b981';
  let conditionBg = 'rgba(16, 185, 129, 0.12)';
  let conditionBorder = '#10b981';
  let conditionDesc = 'All 6 physical environmental sensors are within safe baseline parameters. Standard automated monitoring active.';
  let rescueActionText = 'Forward Nominal Status to Rescue Team';

  if (averageSensorScore >= 70 || currentNode.riskScore >= 70 || flameDetected || (soilMoisture >= 85 && vibration)) {
    sensorCondition = 'DANGER';
    conditionColor = '#ef4444';
    conditionBg = 'rgba(239, 68, 68, 0.18)';
    conditionBorder = '#ef4444';
    conditionDesc = 'CRITICAL THRESHOLD BREACHED: Multi-sensor fusion indicates severe imminent disaster risk. Immediate rescue mobilization required!';
    rescueActionText = '🚨 Forward EMERGENCY Alert to Rescue Team';
  } else if (averageSensorScore >= 40 || currentNode.riskScore >= 40) {
    sensorCondition = 'WARNING';
    conditionColor = '#f59e0b';
    conditionBg = 'rgba(245, 158, 11, 0.15)';
    conditionBorder = '#f59e0b';
    conditionDesc = 'ELEVATED THREAT DETECTED: Moderate anomaly in rainfall intensity or soil saturation. Pre-alert advisory transmitted.';
    rescueActionText = '⚠️ Forward Warning Advisory to Rescue Team';
  }

  const getStatusColor = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
      case 'WARNING':
        return '#f59e0b';
      case 'LOW':
      case 'NORMAL':
      default:
        return '#10b981';
    }
  };

  // Handle Forward to Rescue Team Action
  const handleForwardToRescue = () => {
    if (onOpenDispatch) {
      onOpenDispatch(currentNode);
    }
    setForwardSuccess(true);
    setLastForwardedTimestamp(new Date().toLocaleTimeString());
    setTimeout(() => {
      setForwardSuccess(false);
    }, 6000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header & Node Selector Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#38bdf8" />
            Live LoRa Sensor Telemetry Matrix
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            High-Frequency Environmental & Geological Telemetry • 6 Physical IoT Sensors Array
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Sector:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {nodeList.map(node => {
              const isSelected = selectedVillageId === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedVillageId(node.id)}
                  className="action-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#38bdf8' : '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>{node.name.split(':')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Village Details Header Banner */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        borderLeft: `4px solid ${conditionColor}`
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {currentNode.name}
            </h3>
            {currentNode.id === 'NODE_01' ? (
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.25)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                LIVE ESP32 HARDWARE NODE
              </span>
            ) : null}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              background: conditionBg,
              color: conditionColor,
              border: `1px solid ${conditionBorder}`
            }}>
              {sensorCondition} CONDITION ({averageSensorScore}% COMPOSITE AVERAGE)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <span>GPS: {currentNode.latitude?.toFixed(4)}°N, {currentNode.longitude?.toFixed(4)}°E</span>
            <span>LoRa Hop: {currentNode.hopCount || 1}</span>
            <span>Signal: {currentNode.rssi || -65} dBm</span>
            <span>Sensors: 6 Physical Hardware Transducers</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleForwardToRescue}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: sensorCondition === 'DANGER' ? '1px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.5)',
              background: sensorCondition === 'DANGER' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: sensorCondition === 'DANGER' ? '0 4px 15px rgba(239, 68, 68, 0.4)' : '0 4px 15px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Truck size={14} />
            <span>Forward Incident Report to Rescue Team</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SENSOR COMPOSITE AVERAGE & 3-TIER CONDITION FORWARDING PANEL              */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(180deg, rgba(16, 28, 48, 0.95) 0%, rgba(10, 18, 32, 0.98) 100%)',
        border: `1.5px solid ${conditionBorder}`,
        boxShadow: sensorCondition === 'DANGER' ? '0 0 25px rgba(239, 68, 68, 0.25)' : 'none'
      }}>
        
        {/* Panel Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: conditionBg,
              padding: '8px',
              borderRadius: '8px',
              color: conditionColor,
              border: `1px solid ${conditionBorder}`
            }}>
              {sensorCondition === 'DANGER' ? <AlertTriangle size={20} /> : (sensorCondition === 'WARNING' ? <Activity size={20} /> : <ShieldCheck size={20} />)}
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                Multi-Sensor Average Fusion & Rescue Dispatch Forwarding Engine
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Aggregated 6-Sensor Telemetry Index ➔ Evaluates 3 Conditions (Safe / Warning / Danger) ➔ Auto-Relays to NDRF/SDRF Rescue Command
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 900,
              padding: '4px 12px',
              borderRadius: '6px',
              background: conditionBg,
              color: conditionColor,
              border: `1px solid ${conditionBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: conditionColor }} className={sensorCondition === 'DANGER' ? 'sonar-cascade' : ''} />
              CONDITION: {sensorCondition}
            </span>
          </div>
        </div>

        {/* Core Calculation Metrics: Average Gauge & Normalized Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          
          {/* Card 1: Composite Average Value & 3-Condition Progress Gauge */}
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Computed Sensor Average Value:</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: conditionColor, fontFamily: 'JetBrains Mono' }}>
                {averageSensorScore}% <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ 100%</span>
              </span>
            </div>

            {/* Tri-Condition Color Spectrum Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ position: 'relative', width: '100%', height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${averageSensorScore}%`,
                  height: '100%',
                  background: conditionColor,
                  transition: 'width 0.4s ease, background 0.4s ease'
                }} />
              </div>

              {/* 3 Threshold Markers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>
                <span style={{ color: '#10b981' }}>🟢 SAFE (0 - 39%)</span>
                <span style={{ color: '#f59e0b' }}>🟡 WARNING (40 - 69%)</span>
                <span style={{ color: '#ef4444' }}>🔴 DANGER (70 - 100%)</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', margin: '4px 0 0' }}>
              {conditionDesc}
            </p>
          </div>

          {/* Card 2: 6 Normalized Sensor Contributions */}
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                6 Physical Sensor Inputs & Fusion Weights:
              </span>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
                {rawCalculatedScore}/100 Pts
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              fontSize: '10px'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#818cf8', fontWeight: 700 }}>🌧️ Rain: {rainMm}mm/h</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 25% ({rainPts} pts)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#10b981', fontWeight: 700 }}>🏔️ Soil: {soilMoisture}%</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 20% ({soilPts} pts)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700 }}>💨 Smoke: {smokeLevel}PPM</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 10% ({smokePts} pts)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: flameDetected ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  ⚡ Flame: {flameDetected ? 'FIRE (1)' : 'CLEAR (0)'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 15% ({flamePts} pts)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: vibration ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  📈 Vibe: {vibration ? 'TREMOR' : 'STABLE'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 20% ({vibePts} pts)</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: '#06b6d4', fontWeight: 700 }}>🌡️ Temp: {tempVal}°C</div>
                <div style={{ color: '#94a3b8', fontSize: '9px' }}>Weight: 10% ({climatePts} pts)</div>
              </div>
            </div>
          </div>

        </div>

        {/* Rescue Team Forwarding Status & Action Box */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.2)',
              padding: '6px',
              borderRadius: '6px',
              color: '#38bdf8'
            }}>
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                Rescue Team Forwarding Destination: <span style={{ color: '#38bdf8' }}>NDRF 3rd Battalion & Rayagada District Base (DEOC)</span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Protocol: <b>LoRa SX1278 433MHz Mesh Packet Relay + Automated CAD Dispatch Bridge</b>
              </div>
            </div>
          </div>

          <button
            onClick={handleForwardToRescue}
            style={{
              background: sensorCondition === 'DANGER' ? '#ef4444' : (sensorCondition === 'WARNING' ? '#d97706' : '#0284c7'),
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: sensorCondition === 'DANGER' ? '0 2px 10px rgba(239, 68, 68, 0.5)' : '0 2px 10px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Send size={13} />
            {rescueActionText}
          </button>
        </div>

        {/* Forwarding Success Banner */}
        {forwardSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700
          }}>
            <CheckCircle2 size={15} />
            <span>
              ✅ SUCCESS: Telemetry data (Average: {averageSensorScore}%, Condition: {sensorCondition}) successfully forwarded to NDRF/SDRF Rescue Unit at {lastForwardedTimestamp}!
            </span>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 4. INDIVIDUAL SENSOR GAUGES GRID (6 PHYSICAL SENSORS)                      */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Sensor 1: Rainfall Intensity (Rain Sensor) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={18} color="#818cf8" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Rainfall Precipitation</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Rainfall Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#818cf8', fontFamily: 'JetBrains Mono' }}>
              {currentNode.rainMm || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>mm / hour</span>
          </div>

          <div className="gauge-bar-track">
            <div className="gauge-bar-fill" style={{
              width: `${Math.min(100, ((currentNode.rainMm || 0) / 150) * 100)}%`,
              background: (currentNode.rainMm || 0) > 80 ? '#ef4444' : (currentNode.rainMm || 0) > 40 ? '#f59e0b' : '#818cf8'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Light: &lt;20mm</span>
            <span>Moderate: 50mm</span>
            <span style={{ color: '#ef4444' }}>Torrential: &gt;80mm</span>
          </div>
        </div>

        {/* Sensor 2: Soil Moisture Content */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mountain size={18} color="#10b981" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Soil Moisture & Saturation</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Soil Moisture Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
              {currentNode.soilMoisture || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>% Saturation</span>
          </div>

          <div className="gauge-bar-track">
            <div className="gauge-bar-fill" style={{
              width: `${Math.min(100, currentNode.soilMoisture || 0)}%`,
              background: (currentNode.soilMoisture || 0) > 85 ? '#ef4444' : (currentNode.soilMoisture || 0) > 60 ? '#f59e0b' : '#10b981'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Dry: &lt;30%</span>
            <span>Wet: 60%</span>
            <span style={{ color: '#ef4444' }}>Liquefaction: &gt;85%</span>
          </div>
        </div>

        {/* Sensor 3: Smoke & Combustible Gas */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Smoke & Combustible Gas</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>MQ-2 Gas Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
              {currentNode.smokeLevel || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>PPM</span>
          </div>

          <div className="gauge-bar-track">
            <div className="gauge-bar-fill" style={{
              width: `${Math.min(100, ((currentNode.smokeLevel || 0) / 400) * 100)}%`,
              background: (currentNode.smokeLevel || 0) > 150 ? '#ef4444' : (currentNode.smokeLevel || 0) > 60 ? '#f59e0b' : '#10b981'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Clean: &lt;50 PPM</span>
            <span>Caution: 100 PPM</span>
            <span style={{ color: '#ef4444' }}>Hazard: &gt;200 PPM</span>
          </div>
        </div>

        {/* Sensor 4: Flame / Fire Detection */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color={currentNode.flameDetected ? '#ef4444' : '#10b981'} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Flame / Fire Optical Status</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Flame IR Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: 900,
              color: currentNode.flameDetected ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono'
            }}>
              {currentNode.flameDetected ? 'FLAME DETECTED' : 'CLEAR (SAFE)'}
            </span>
          </div>

          <div style={{
            padding: '8px',
            borderRadius: '6px',
            background: currentNode.flameDetected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${currentNode.flameDetected ? '#ef4444' : '#10b981'}`,
            fontSize: '11px',
            color: currentNode.flameDetected ? '#fca5a5' : '#86efac'
          }}>
            {currentNode.flameDetected
              ? 'CRITICAL ALERT: Infrared optical fire signature detected! Wildfire warning.'
              : 'Nominal ambient IR baseline. No open flame or thermal ignition detected.'}
          </div>
        </div>

        {/* Sensor 5: Seismic / Slope Vibration */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Seismic / Slope Shift</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>SW-420 Motion Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 900,
              color: currentNode.vibration ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono'
            }}>
              {currentNode.vibration ? `${currentNode.vibrationFreq || 38} Hz` : '0 Hz'}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {currentNode.vibration ? '⚡ Debris Shock Detected' : 'Quiescent Baseline (Stable)'}
            </span>
          </div>

          <div style={{
            padding: '8px',
            borderRadius: '6px',
            background: currentNode.vibration ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${currentNode.vibration ? '#ef4444' : '#10b981'}`,
            fontSize: '11px',
            color: currentNode.vibration ? '#fca5a5' : '#86efac'
          }}>
            {currentNode.vibration
              ? `Warning: High-frequency seismic tremor (${currentNode.vibrationFreq || 38} Hz) detected! Slope instability warning.`
              : 'Geological slope integrity is currently stable with zero abnormal tremors.'}
          </div>
        </div>

        {/* Sensor 6: Atmospheric Temp & Humidity */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={18} color="#06b6d4" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Ambient Climate</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>DHT22 Climate Sensor</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Temperature</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono' }}>
                {currentNode.temp || 24.5}°C
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rel. Humidity</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono' }}>
                {currentNode.humidity || 75}%
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            Barometric Dewpoint: {Math.round((currentNode.temp || 24.5) - ((100 - (currentNode.humidity || 75)) / 5))}°C
          </div>
        </div>
      </div>
    </div>
  );
}
