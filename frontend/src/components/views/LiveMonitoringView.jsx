import React, { useState } from 'react';
import {
  Activity,
  Droplets,
  Mountain,
  Flame,
  Thermometer,
  Send
} from 'lucide-react';

export function LiveMonitoringView({
  nodes = {},
  onSelectNode: _onSelectNode,
  onOpenDispatch,
  onTriggerSiren: _onTriggerSiren
}) {
  const nodeList = Object.values(nodes);
  const [selectedVillageId, setSelectedVillageId] = useState("NODE_01");

  const currentNode = nodes[selectedVillageId] || nodeList[0] || {};

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
            High-Frequency Environmental & Geological Telemetry via 433MHz Mesh
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Sector:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {nodeList.map(node => {
              const isSelected = selectedVillageId === node.id;
              const color = getStatusColor(node.riskLevel);
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
                    border: isSelected ? `1px solid ${color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? `rgba(${color === '#ef4444' ? '239, 68, 68' : '56, 189, 248'}, 0.2)` : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? '#f8fafc' : '#cbd5e1',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} className={node.riskLevel === 'CRITICAL' ? 'pulse-circle' : ''} />
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
        borderLeft: `4px solid ${getStatusColor(currentNode.riskLevel)}`
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
                ⚡ LIVE ESP32 HARDWARE NODE
              </span>
            ) : null}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              background: getStatusColor(currentNode.riskLevel) + '25',
              color: getStatusColor(currentNode.riskLevel),
              border: `1px solid ${getStatusColor(currentNode.riskLevel)}`
            }}>
              {currentNode.riskLevel} THREAT ({Math.round(currentNode.riskScore || 0)}/100)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '14px' }}>
            <span>GPS: {currentNode.latitude?.toFixed(4)}°N, {currentNode.longitude?.toFixed(4)}°E</span>
            <span>LoRa Hop: {currentNode.hopCount || 1}</span>
            <span>Signal: {currentNode.rssi || -68} dBm</span>
            <span>Battery: {currentNode.battery || 90}% ({currentNode.batteryVoltage || 4.1}V)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onOpenDispatch && onOpenDispatch(currentNode)}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Send size={13} />
            <span>Dispatch Rescue CAD</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Sensor Gauges Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Sensor 1: Water Level (Ultrasonic JSN-SR04T) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={18} color="#38bdf8" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Water Level (River/Stream)</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>JSN-SR04T Waterproof</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
              {currentNode.waterLevelCm || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>cm ({currentNode.waterLevelM || 0} meters)</span>
          </div>

          <div className="gauge-bar-track">
            <div className="gauge-bar-fill" style={{
              width: `${Math.min(100, ((currentNode.waterLevelCm || 0) / 300) * 100)}%`,
              background: (currentNode.waterLevelCm || 0) > 180 ? '#ef4444' : (currentNode.waterLevelCm || 0) > 100 ? '#f59e0b' : '#38bdf8'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Safe: &lt;100cm</span>
            <span>Warning: 150cm</span>
            <span style={{ color: '#ef4444' }}>Danger: &gt;200cm</span>
          </div>
        </div>

        {/* Sensor 2: Rainfall Intensity */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={18} color="#818cf8" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Precipitation / Rainfall</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Capacitive Tipping Gauge</span>
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

        {/* Sensor 3: Soil Moisture Content */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mountain size={18} color="#10b981" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Soil Moisture & Saturation</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Capacitive Soil v1.2</span>
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

        {/* Sensor 4: Seismic / Slope Vibration (SW-420) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#f59e0b" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Seismic / Slope Shift</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>SW-420 Vibration Switch</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: 900,
              color: currentNode.vibration ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono'
            }}>
              {currentNode.vibration ? 'MOTION DETECTED' : 'NORMAL (STABLE)'}
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
              ? 'Warning: Slope micro-vibrations detected. High landslide probability!'
              : 'Slope integrity is currently stable with zero abnormal tremors.'}
          </div>
        </div>

        {/* Sensor 5: Smoke & Combustible Gas (MQ-2) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#ef4444" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Smoke & Combustible Gas</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>MQ-2 Gas Sensor</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>
              {currentNode.smokeLevel || 0}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>PPM (Parts Per Million)</span>
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

        {/* Sensor 6: Atmospheric Temp & Humidity (DHT22) */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={18} color="#06b6d4" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Ambient Climate</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>DHT22 / Sensirion</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Temperature</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono' }}>
                {currentNode.temp || 24}°C
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rel. Humidity</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono' }}>
                {currentNode.humidity || 70}%
              </div>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            Barometric Dewpoint: {Math.round((currentNode.temp || 24) - ((100 - (currentNode.humidity || 70)) / 5))}°C
          </div>
        </div>
      </div>
    </div>
  );
}
