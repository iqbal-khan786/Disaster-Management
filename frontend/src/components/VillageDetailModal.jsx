import React from 'react';
import {
  X,
  Thermometer,
  Activity,
  CloudRain,
  Send,
  Mountain,
  Flame,
  Zap
} from 'lucide-react';

export function VillageDetailModal({ node, isOpen, onClose, onOpenDispatch, allNodes: _allNodes = {} }) {
  if (!isOpen || !node) return null;

  const isCritical = node.riskLevel === 'CRITICAL' || node.riskLevel === 'EMERGENCY' || (node.riskScore >= 75);

  const rain = node.rainMm !== undefined ? node.rainMm : (node.rain !== undefined ? node.rain : 0);
  const soil = node.soilMoisture !== undefined ? node.soilMoisture : (node.soil !== undefined ? node.soil : 0);
  const smoke = node.smokeLevel !== undefined ? node.smokeLevel : (node.smoke !== undefined ? node.smoke : 0);

  const getRiskColor = (level) => {
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d1629',
          border: `1px solid ${isCritical ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`,
          borderRadius: '14px',
          width: '740px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 25px rgba(56, 189, 248, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'JetBrains Mono'
              }}>
                {node.id}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {node.name}
              </h2>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
              GPS: {node.latitude?.toFixed(4)}°N, {node.longitude?.toFixed(4)}°E • Sector: {node.district || 'Rayagada District'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              background: getRiskColor(node.riskLevel) + '25',
              color: getRiskColor(node.riskLevel),
              border: `1px solid ${getRiskColor(node.riskLevel)}`
            }}>
              {node.riskLevel} THREAT ({Math.round(node.riskScore || 0)}/100)
            </span>

            <button
              onClick={onClose}
              className="action-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Threat Situation Summary Banner */}
        <div style={{
          background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.08)',
          border: `1px solid ${isCritical ? '#ef4444' : 'rgba(56, 189, 248, 0.25)'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: isCritical ? '#fca5a5' : '#38bdf8' }}>
              Active Disaster State: {node.disasterType || 'ENVIRONMENTAL MONITORING'}
            </div>
            <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>
              Relayed over LoRa Mesh via Hop {node.hopCount || 1} • Signal Strength: {node.rssi || -65} dBm
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenDispatch) onOpenDispatch(node);
              onClose();
            }}
            className="action-btn"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: '1px solid #ef4444',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={13} />
            Dispatch Rescue CAD
          </button>
        </div>

        {/* 6 Physical Sensors Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {/* 1. Rainfall (Rain Sensor Pin 34) */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8' }}>
              <CloudRain size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Rainfall Precipitation</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono' }}>
              {rain} mm/h
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Rainfall Sensor</span>
          </div>

          {/* 2. Soil Moisture */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <Mountain size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Soil Saturation</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
              {soil}%
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Soil Moisture Sensor</span>
          </div>

          {/* 3. Smoke & Gas */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
              <Flame size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Smoke & Gas</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
              {smoke} PPM
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>MQ-2 Gas Sensor</span>
          </div>

          {/* 4. Flame IR Detection */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: node.flameDetected ? '#ef4444' : '#10b981' }}>
              <Zap size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Flame Optical Sensor</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: node.flameDetected ? '#ef4444' : '#10b981', fontFamily: 'JetBrains Mono' }}>
              {node.flameDetected ? 'FLAME DETECTED' : 'CLEAR'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Flame IR Sensor</span>
          </div>

          {/* 5. Seismic Vibration */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
              <Activity size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Seismic Tremor</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: node.vibration ? '#ef4444' : '#10b981', fontFamily: 'JetBrains Mono' }}>
              {node.vibration ? 'MOTION DETECTED' : 'STABLE'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>SW-420 Motion Sensor</span>
          </div>

          {/* 6. Climate (Temp / Humidity) */}
          <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4' }}>
              <Thermometer size={16} />
              <span style={{ fontSize: '11px', fontWeight: 700 }}>Ambient Climate</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
              {node.temp || 24.5}°C <span style={{ fontSize: '12px', color: '#06b6d4' }}>({node.humidity || 75}%)</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>DHT22 Climate Sensor</span>
          </div>
        </div>

        {/* Hardware & Power Diagnostic Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          fontSize: '11px'
        }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Sampling Loop:</span>
            <div style={{ fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              1.5s (Continuous)
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8' }}>RF Transceiver:</span>
            <div style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              SX1278 433MHz LoRa
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8' }}>Active Sensors:</span>
            <div style={{ fontWeight: 800, color: '#a855f7', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              6 Physical Sensors
            </div>
          </div>

          <div>
            <span style={{ color: '#94a3b8' }}>Packet RSSI:</span>
            <div style={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {node.rssi || -65} dBm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
