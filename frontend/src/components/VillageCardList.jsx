import React from 'react';
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Activity,
  Flame,
  Wind,
  Mountain,
  Thermometer,
  Radio,
  Send,
  CheckCircle2,
  Navigation,
  Eye
} from 'lucide-react';

export function VillageCardList({ nodes, onOpenDispatch, onSelectNode }) {
  const nodeList = Object.values(nodes);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {nodeList.map((node) => {
        const isEmerg = node.riskLevel === 'EMERGENCY' || node.riskScore >= 70;
        const isWarn = node.riskLevel === 'WARNING' || (node.riskScore >= 40 && node.riskScore < 70);

        const cardBorderClass = isEmerg
          ? 'rgba(239, 68, 68, 0.4)'
          : (isWarn ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.25)');

        const cardBg = isEmerg
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(30, 41, 59, 0.8))'
          : (isWarn ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.08), rgba(30, 41, 59, 0.8))' : 'rgba(30, 41, 59, 0.7)');

        return (
          <div
            key={node.id}
            className="glass-panel"
            onClick={() => onSelectNode && onSelectNode(node)}
            style={{
              padding: '14px',
              borderLeft: `4px solid ${isEmerg ? 'var(--emergency)' : (isWarn ? 'var(--warning)' : 'var(--normal)')}`,
              borderColor: cardBorderClass,
              background: cardBg,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isEmerg
                ? '0 8px 25px rgba(239, 68, 68, 0.25)'
                : '0 8px 25px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-panel)';
            }}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {node.name || `Village ${node.id}`}
                  {isEmerg && <AlertTriangle size={15} color="var(--emergency)" />}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Navigation size={11} /> {Number(node.latitude).toFixed(4)}°N, {Number(node.longitude).toFixed(4)}°E
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Radio size={11} /> Hop: {node.hopCount || 1}
                  </span>
                  <span>•</span>
                  <span>RSSI: {node.rssi || -68} dBm</span>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: isEmerg ? 'var(--emergency)' : (isWarn ? 'var(--warning)' : 'var(--normal)'),
                color: isEmerg ? '#fff' : '#000',
                boxShadow: isEmerg ? '0 0 12px var(--emergency-glow)' : 'none',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {node.riskLevel || 'NORMAL'} ({Math.round(node.riskScore || 0)}/100)
              </div>
            </div>

            {/* Disaster Event Banner if Active */}
            {isEmerg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '6px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '8px 0',
                color: '#fca5a5',
                fontSize: '11px',
                fontWeight: 700
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Flame size={13} color="#ef4444" />
                  EVENT: {node.disasterType || 'CRITICAL EMERGENCY'}
                </span>
                <span style={{ color: '#ef4444', animation: 'pulse 1s infinite' }}>🚨 ACTIVE</span>
              </div>
            )}

            {/* Multi-Sensor Metrics Grid (6 Physical Sensors) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '6px',
              margin: '10px 0'
            }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <CloudRain size={10} /> RAIN
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'JetBrains Mono' }}>
                  {node.rainMm || node.rain || 0}mm
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Mountain size={10} /> SOIL
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
                  {node.soilMoisture || node.soil || 0}%
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Flame size={10} /> SMOKE
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: (node.smokeLevel > 80 || node.smoke > 80) ? '#ef4444' : '#f59e0b', fontFamily: 'JetBrains Mono' }}>
                  {node.smokeLevel || node.smoke || 0}PPM
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Activity size={10} /> VIB
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: node.vibration ? '#ef4444' : '#10b981',
                  fontFamily: 'JetBrains Mono'
                }}>
                  {node.vibration ? 'DETECT' : 'CLEAR'}
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px 4px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <Thermometer size={10} /> TEMP
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e', fontFamily: 'JetBrains Mono' }}>
                  {node.temp || 24.5}°C
                </div>
              </div>
            </div>

            {/* Tactical Rescue Dispatch Button */}
            {isEmerg ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDispatch(node);
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '12px',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px var(--emergency-glow)',
                  transition: 'transform 0.2s',
                  marginTop: '4px'
                }}
              >
                <Send size={14} />
                DISPATCH NDRF / SDRF RESCUE SQUAD
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--normal)',
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} />
                  <span>Sector Telemetry Nominal</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Eye size={11} /> Click for full status
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

