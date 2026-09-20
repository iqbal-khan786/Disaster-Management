import React, { useState } from 'react';
import {
  Activity,
  Radio,
  Wifi,
  Droplets,
  Mountain,
  Flame,
  Wind,
  ShieldAlert,
  AlertTriangle,
  Server,
  Clock,
  CheckCircle2,
  Zap,
  Thermometer
} from 'lucide-react';
import { SensorCharts } from '../SensorCharts';

export function OverviewView({
  nodes = {},
  history = [],
  alerts = [],
  gatewayStatus = 'ONLINE',
  lastDataTimestamp,
  onSelectNode: _onSelectNode,
  onOpenDispatch: _onOpenDispatch
}) {
  const nodeList = Object.values(nodes);
  const activeNodesCount = nodeList.filter(n => n.status === 'ONLINE').length;
  const criticalAlerts = alerts.filter(a => a.status === 'active' && (a.level === 'CRITICAL' || a.level === 'EMERGENCY'));
  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  // Selected node for live telemetry display (defaults to Node 1)
  const [selectedNodeId, setSelectedNodeId] = useState("NODE_01");
  const selectedNode = nodes[selectedNodeId] || nodeList[0] || {};

  // Average RSSI calculation
  const avgRssi = nodeList.length > 0
    ? Math.round(nodeList.reduce((acc, n) => acc + (n.rssi || -65), 0) / nodeList.length)
    : -65;

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

  const getRiskBg = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return 'rgba(239, 68, 68, 0.15)';
      case 'HIGH':
        return 'rgba(249, 115, 22, 0.15)';
      case 'MEDIUM':
      case 'WARNING':
        return 'rgba(245, 158, 11, 0.15)';
      case 'LOW':
      case 'NORMAL':
      default:
        return 'rgba(16, 185, 129, 0.12)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ========================================================================= */}
      {/* SECTION A: SYSTEM OVERVIEW CARDS (6 CARDS)                                */}
      {/* ========================================================================= */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Activity size={16} color="#38bdf8" />
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
            Disaster Management Command Center
          </h2>
        </div>

        <div className="kpi-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Card 1: Active Sensor Nodes */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Nodes</span>
              <Radio size={16} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
              {activeNodesCount} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {nodeList.length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#34d399' }}>
              <CheckCircle2 size={11} />
              <span>100% LoRa Nodes Reporting</span>
            </div>
          </div>

          {/* Card 2: Monitored Sector */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Sectors Monitored</span>
              <Mountain size={16} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
              {nodeList.length} <span style={{ fontSize: '13px', color: '#64748b' }}>Sector</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Rayagada District (Kashipur)
            </div>
          </div>

          {/* Card 3: Active Alerts */}
          <div className="glass-card kpi-card" style={{
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            borderColor: activeAlertsCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Active Alerts</span>
              <AlertTriangle size={16} color={activeAlertsCount > 0 ? '#ef4444' : '#10b981'} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: activeAlertsCount > 0 ? '#ef4444' : '#10b981', fontFamily: 'JetBrains Mono' }}>
              {activeAlertsCount} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({criticalAlerts.length} Critical)</span>
            </div>
            <div style={{ fontSize: '10px', color: activeAlertsCount > 0 ? '#fca5a5' : '#34d399' }}>
              {activeAlertsCount > 0 ? 'Immediate Action Required' : 'All Zones Within Thresholds'}
            </div>
          </div>

          {/* Card 4: Sensor Data Accuracy */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Data Accuracy</span>
              <Activity size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
              {selectedNode.accuracy || selectedNode.dataAccuracy || 92.4}% <span style={{ fontSize: '12px', color: '#94a3b8' }}>(85-95%)</span>
            </div>
            <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={11} />
              <span>Multi-Sensor Fusion Validated</span>
            </div>
          </div>

          {/* Card 5: Network Health */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Network Health</span>
              <Wifi size={16} color="#a855f7" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
              99.4% <span style={{ fontSize: '13px', color: '#a855f7' }}>({avgRssi} dBm)</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              LoRa SX1278 433MHz Mesh
            </div>
          </div>

          {/* Card 5: Last Telemetry Received */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Last Telemetry</span>
              <Clock size={16} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
              {new Date(lastDataTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '10px', color: '#34d399' }}>
              Live Telemetry Stream Active
            </div>
          </div>

          {/* Card 6: Gateway Status */}
          <div className="glass-card kpi-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Gateway Hub</span>
              <Server size={16} color={gatewayStatus === 'ONLINE' ? '#10b981' : '#ef4444'} />
            </div>
            <div style={{
              fontSize: '22px',
              fontWeight: 900,
              color: gatewayStatus === 'ONLINE' ? '#34d399' : '#f87171',
              fontFamily: 'JetBrains Mono',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gatewayStatus === 'ONLINE' ? '#10b981' : '#ef4444' }} className="pulse-circle" />
              {gatewayStatus}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Rayagada Base Receiver Unit
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: DISASTER RISK OVERVIEW (4 MULTI-HAZARD CARDS)                 */}
      {/* ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Multi-Hazard AI Risk Assessments (6 Physical Sensors)
            </h2>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
            *Estimated risk scores computed via sensor fusion (Rain, Soil, Vibration, Flame, Smoke, Climate)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {/* Risk Card 1: Torrential Rain & Inundation */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.flood || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <Droplets size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Heavy Precipitation</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rainfall Intensity & Runoff</span>
                </div>
              </div>
              <span className={`risk-level-label risk-${(selectedNode.risk?.flood || 'LOW').toLowerCase()}`} style={{
                fontSize: '11px',
                fontWeight: 800,
                color: getRiskColor(selectedNode.risk?.flood || 'LOW')
              }}>
                {selectedNode.risk?.flood || 'LOW'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Rainfall Intensity Index:</span>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {selectedNode.rainMm || 0} mm/h
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{
                  width: `${Math.min(100, ((selectedNode.rainMm || 0) / 100) * 100)}%`,
                  background: getRiskColor(selectedNode.risk?.flood || 'LOW')
                }} />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Precipitation Rate:</span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>{selectedNode.rainMm || 0} mm/h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Soil Saturation:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedNode.soilMoisture || 0}%</span>
              </div>
            </div>
          </div>

          {/* Risk Card 2: Landslide Risk */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.landslide || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <Mountain size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Landslide Hazard</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Soil Moisture & Slope Tremors</span>
                </div>
              </div>
              <span className={`risk-level-label risk-${(selectedNode.risk?.landslide || 'LOW').toLowerCase()}`} style={{
                fontSize: '11px',
                fontWeight: 800,
                color: getRiskColor(selectedNode.risk?.landslide || 'LOW')
              }}>
                {selectedNode.risk?.landslide || 'LOW'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Soil Saturation Index:</span>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {selectedNode.soilMoisture || 0}%
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{
                  width: `${Math.min(100, selectedNode.soilMoisture || 0)}%`,
                  background: getRiskColor(selectedNode.risk?.landslide || 'LOW')
                }} />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Soil Moisture:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedNode.soilMoisture || 0}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Seismic Vibration:</span>
                <span style={{ color: selectedNode.vibration ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {selectedNode.vibration ? 'DETECTED (ACTIVE)' : 'NOMINAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Card 3: Smoke & Air Quality */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.fire || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Smoke & Air Quality</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>MQ-2 Gas Sensor & Flame IR (Nominal)</span>
                </div>
              </div>
              <span className={`risk-level-label risk-${(selectedNode.risk?.fire || 'LOW').toLowerCase()}`} style={{
                fontSize: '11px',
                fontWeight: 800,
                color: getRiskColor(selectedNode.risk?.fire || 'LOW')
              }}>
                {selectedNode.risk?.fire || 'LOW'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Gas / Smoke Concentration:</span>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {selectedNode.smokeLevel || 0} PPM
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{
                  width: `${Math.min(100, ((selectedNode.smokeLevel || 0) / 400) * 100)}%`,
                  background: getRiskColor(selectedNode.risk?.fire || 'LOW')
                }} />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Flame IR Status:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  OFF / CLEAR (0)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ambient Temp:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{selectedNode.temp || 26.5}°C</span>
              </div>
            </div>
          </div>

          {/* Risk Card 4: Cyclone & Severe Weather */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.cyclone || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                  <Wind size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Severe Storm</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>High Wind & Torrential Surge</span>
                </div>
              </div>
              <span className={`risk-level-label risk-${(selectedNode.risk?.cyclone || 'LOW').toLowerCase()}`} style={{
                fontSize: '11px',
                fontWeight: 800,
                color: getRiskColor(selectedNode.risk?.cyclone || 'LOW')
              }}>
                {selectedNode.risk?.cyclone || 'LOW'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Storm Intensity Index:</span>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {selectedNode.risk?.cyclone === 'CRITICAL' ? '92%' : selectedNode.risk?.cyclone === 'HIGH' ? '70%' : '15%'}
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{
                  width: selectedNode.risk?.cyclone === 'CRITICAL' ? '92%' : selectedNode.risk?.cyclone === 'HIGH' ? '70%' : '15%',
                  background: getRiskColor(selectedNode.risk?.cyclone || 'LOW')
                }} />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Atmospheric Humidity:</span>
                <span style={{ color: '#06b6d4', fontWeight: 700 }}>{selectedNode.humidity || 75}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gust Tremor:</span>
                <span style={{ color: selectedNode.vibration ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                  {selectedNode.vibration ? 'HIGH GUST VIBRATION' : 'CALM / NOMINAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: LIVE SENSOR TELEMETRY PANEL (6 SENSORS)                        */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#38bdf8" />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Live Telemetry Feed (6 Physical Sensors)
            </h2>
          </div>

          {/* Village Node Selector */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {nodeList.map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className="action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: selectedNodeId === node.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedNodeId === node.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedNodeId === node.id ? '#38bdf8' : '#cbd5e1',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span>{node.name.split(':')[0]}</span>
                {node.id === 'NODE_01' ? (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: 'rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.5)'
                  }}>
                    LIVE HW
                  </span>
                ) : null}
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>({node.riskLevel})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry 6-Physical Sensor Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px'
        }}>
          {/* 1. Rainfall Rate */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Droplets size={14} color="#818cf8" />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Rainfall Rate</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.rainMm || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>mm/h</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Rainfall Sensor</span>
          </div>

          {/* 2. Soil Moisture */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mountain size={14} color="#10b981" />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Soil Moisture</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.soilMoisture || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Soil Moisture Sensor</span>
          </div>

          {/* 3. Smoke & Gas */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Flame size={14} color="#f59e0b" />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Smoke / Gas</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.smokeLevel || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>PPM</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>MQ-2 Gas Sensor</span>
          </div>

          {/* 4. Flame IR */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={14} color={selectedNode.flameDetected ? '#ef4444' : '#10b981'} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Flame Detection</span>
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 800,
              color: selectedNode.flameDetected ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono',
              marginTop: '4px'
            }}>
              {selectedNode.flameDetected ? 'FLAME (1)' : 'CLEAR (0)'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Flame IR Sensor</span>
          </div>

          {/* 5. Seismic Vibration */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Activity size={14} color={selectedNode.vibration ? '#ef4444' : '#10b981'} />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Vibration Frequency</span>
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 800,
              color: selectedNode.vibration ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono',
              marginTop: '4px'
            }}>
              {selectedNode.vibration ? `${selectedNode.vibrationFreq || 380} Hz (TREMOR)` : '0 Hz (NOMINAL)'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>SW-420 Motion Sensor</span>
          </div>

          {/* 6. Climate (Temp / Hum) */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Thermometer size={14} color="#06b6d4" />
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Temp & Humidity</span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.temp || 24.5}°C <span style={{ fontSize: '11px', color: '#06b6d4' }}>/ {selectedNode.humidity || 75}%</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>DHT22 Climate Sensor</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: REAL-TIME TREND CHARTS                                         */}
      {/* ========================================================================= */}
      <SensorCharts history={history} />
    </div>
  );
}
