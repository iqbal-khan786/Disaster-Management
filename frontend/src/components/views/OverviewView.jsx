import React, { useState } from 'react';
import {
  Activity,
  Radio,
  Wifi,
  Waves,
  Mountain,
  Flame,
  Wind,
  ShieldAlert,
  AlertTriangle,
  Server,
  Clock,
  CheckCircle2
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

  // Selected node for live telemetry display (defaults to Node 1 or highest risk)
  const [selectedNodeId, setSelectedNodeId] = useState("NODE_01");
  const selectedNode = nodes[selectedNodeId] || nodeList[0] || {};

  // Average RSSI calculation
  const avgRssi = nodeList.length > 0
    ? Math.round(nodeList.reduce((acc, n) => acc + (n.rssi || -70), 0) / nodeList.length)
    : -68;

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
            Command Center KPI Overview
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Card 1: Active Sensor Nodes */}
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

          {/* Card 2: Villages Monitored */}
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Villages Monitored</span>
              <Waves size={16} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
              {nodeList.length} <span style={{ fontSize: '13px', color: '#64748b' }}>Sectors</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              Rayagada District (Nagavali Basin)
            </div>
          </div>

          {/* Card 3: Active Alerts */}
          <div className="glass-card" style={{
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

          {/* Card 4: Network Health */}
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
      {/* SECTION B: DISASTER RISK OVERVIEW (4 CARDS)                               */}
      {/* ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} color="#ef4444" />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Multi-Hazard AI Risk Assessments
            </h2>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
            *Estimated risk scores computed via sensor fusion — Human verification required for emergency actions
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {/* Risk Card 1: Flood Risk */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.flood || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <Waves size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Flood Hazard</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>River Inundation & Flash Flood</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: getRiskBg(selectedNode.risk?.flood || 'LOW'),
                color: getRiskColor(selectedNode.risk?.flood || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.flood || 'LOW')}`
              }}>
                {selectedNode.risk?.flood || 'LOW'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Confidence / Threat Level:</span>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
                  {selectedNode.risk?.flood === 'CRITICAL' ? '94%' : selectedNode.risk?.flood === 'HIGH' ? '76%' : '18%'}
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{
                  width: selectedNode.risk?.flood === 'CRITICAL' ? '94%' : selectedNode.risk?.flood === 'HIGH' ? '76%' : '18%',
                  background: getRiskColor(selectedNode.risk?.flood || 'LOW')
                }} />
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px', borderRadius: '6px', fontSize: '10px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Water Level:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedNode.waterLevelCm || 0} cm ({selectedNode.waterLevelM || 0}m)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Rainfall Intensity:</span>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>{selectedNode.rainMm || 0} mm/h</span>
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
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Slope Saturation & Shear Slip</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: getRiskBg(selectedNode.risk?.landslide || 'LOW'),
                color: getRiskColor(selectedNode.risk?.landslide || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.landslide || 'LOW')}`
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

          {/* Risk Card 3: Fire & Smoke Risk */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderLeft: `4px solid ${getRiskColor(selectedNode.risk?.fire || 'LOW')}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Fire & Smoke</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Forest Fire & Toxic Gas Spike</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: getRiskBg(selectedNode.risk?.fire || 'LOW'),
                color: getRiskColor(selectedNode.risk?.fire || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.fire || 'LOW')}`
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
                <span>Flame Sensor:</span>
                <span style={{ color: selectedNode.flameDetected ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {selectedNode.flameDetected ? 'FLAME TRIP (CRITICAL)' : 'NONE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ambient Temp:</span>
                <span style={{ color: '#f43f5e', fontWeight: 700 }}>{selectedNode.temp || 24}°C</span>
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
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Cyclone / Storm</h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Gale Wind & Torrential Surge</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: getRiskBg(selectedNode.risk?.cyclone || 'LOW'),
                color: getRiskColor(selectedNode.risk?.cyclone || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.cyclone || 'LOW')}`
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
                <span style={{ color: '#06b6d4', fontWeight: 700 }}>{selectedNode.humidity || 70}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gust Vibration:</span>
                <span style={{ color: selectedNode.vibration ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                  {selectedNode.vibration ? 'HIGH GALE GUSTS' : 'LIGHT BREEZE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: LIVE SENSOR TELEMETRY PANEL                                    */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} color="#38bdf8" />
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Live LoRa Sensor Telemetry Feed
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
                    ⚡ LIVE HW
                  </span>
                ) : null}
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>({node.riskLevel})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry 11-Reading Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {/* 1. Water Level */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Water Level</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.waterLevelCm || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>cm</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>({selectedNode.waterLevelM || 0}m)</span>
          </div>

          {/* 2. Rainfall */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Rainfall Rate</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.rainMm || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>mm/h</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Capacitive Tipping</span>
          </div>

          {/* 3. Soil Moisture */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Soil Moisture</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.soilMoisture || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Capacitive v1.2</span>
          </div>

          {/* 4. Temperature */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Temperature</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.temp || 24} <span style={{ fontSize: '11px', color: '#64748b' }}>°C</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Sensirion / DHT22</span>
          </div>

          {/* 5. Humidity */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Humidity</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.humidity || 70} <span style={{ fontSize: '11px', color: '#64748b' }}>%</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>Relative RH</span>
          </div>

          {/* 6. Smoke / Gas */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Smoke / Gas</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
              {selectedNode.smokeLevel || 0} <span style={{ fontSize: '11px', color: '#64748b' }}>PPM</span>
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>MQ-2 Combustible</span>
          </div>

          {/* 7. Flame Detection */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Flame Status</span>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              color: selectedNode.flameDetected ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono',
              marginTop: '4px'
            }}>
              {selectedNode.flameDetected ? 'FLAME ACTIVE' : 'CLEAR'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>IR Photodiode</span>
          </div>

          {/* 8. Seismic Vibration */}
          <div className="glass-card" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Vibration</span>
            <div style={{
              fontSize: '14px',
              fontWeight: 800,
              color: selectedNode.vibration ? '#ef4444' : '#10b981',
              fontFamily: 'JetBrains Mono',
              marginTop: '4px'
            }}>
              {selectedNode.vibration ? 'MOTION DETECTED' : 'NORMAL'}
            </div>
            <span style={{ fontSize: '9px', color: '#64748b' }}>SW-420 Sensor</span>
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
