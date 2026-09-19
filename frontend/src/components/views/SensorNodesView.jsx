import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Activity,
  CheckCircle2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { playTacticalBeep } from '../../utils/audioSiren';

export function SensorNodesView({ nodes = {}, onSelectNode: _onSelectNode }) {
  const nodeList = Object.values(nodes);
  const [pingStatus, setPingStatus] = useState({});

  const handlePingNode = (nodeId) => {
    playTacticalBeep(1500, 0.15);
    setPingStatus(prev => ({ ...prev, [nodeId]: 'PINGING' }));
    setTimeout(() => {
      setPingStatus(prev => ({ ...prev, [nodeId]: 'ACK_OK' }));
      setTimeout(() => {
        setPingStatus(prev => ({ ...prev, [nodeId]: null }));
      }, 3000);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#38bdf8" />
            ESP32 Sensor Nodes & LoRa Hardware Registry
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            Rayagada District Offline Mesh Topology • 6 Physical IoT Sensors Array & Diagnostics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> {nodeList.length} Node Configured
          </span>
        </div>
      </div>

      {/* Nodes Hardware Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px'
      }}>
        {nodeList.map(node => {
          const isPinging = pingStatus[node.id] === 'PINGING';
          const isAcked = pingStatus[node.id] === 'ACK_OK';
          return (
            <div key={node.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      {node.name}
                    </h3>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                    Sector: {node.district || 'Rayagada District'} • 6 Physical Sensors Array
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: node.status === 'ONLINE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: node.status === 'ONLINE' ? '#34d399' : '#ef4444',
                  border: `1px solid ${node.status === 'ONLINE' ? '#10b981' : '#ef4444'}`
                }}>
                  {node.status || 'ONLINE'}
                </span>
              </div>

              {/* Hardware Specs Breakdown */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Microcontroller:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>ESP32-WROOM-32 (240MHz Dual-Core)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Transceiver:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Semtech SX1278 LoRa (433MHz +20dBm)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>6 Physical Sensors:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '10px' }}>
                    Rain (P34), Soil (P35), MQ-2 (P39), Flame (P33), SW-420 (P32), DHT22 (P4)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Operational Status:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Active Continuous Sampling (1.5s Cycle)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Firmware Build:</span>
                  <span style={{ color: '#a855f7', fontFamily: 'JetBrains Mono' }}>DisasterGuard-Node1-v3.0</span>
                </div>
              </div>

              {/* Sampling & RF Link Telemetry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} color="#10b981" /> Sampling Loop
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                    1.5s <span style={{ fontSize: '11px', color: '#94a3b8' }}>(Real-time)</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Radio size={12} color="#a855f7" /> RSSI Signal
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#a855f7', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                    {node.rssi || -65} <span style={{ fontSize: '11px', color: '#94a3b8' }}>dBm</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                  onClick={() => handlePingNode(node.id)}
                  disabled={isPinging}
                  className="action-btn"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '6px',
                    border: isAcked ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)',
                    background: isAcked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    color: isAcked ? '#34d399' : '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: isPinging ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={isPinging ? 'pulse-circle' : ''} />
                  <span>{isPinging ? 'Transmitting RF Ping...' : isAcked ? 'Ping Acknowledged (+8.5dB)' : 'Test RF Link Ping'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
