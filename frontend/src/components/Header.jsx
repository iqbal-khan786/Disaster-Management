import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Volume2,
  Clock,
  Sparkles,
  Server,
  Usb,
  Radio
} from 'lucide-react';

export function Header({
  connectionStatus,
  gatewayStatus,
  isDemoMode,
  onToggleDemoMode,
  onTriggerSiren,
  isSerialConnected = false,
  serialPortName = '',
  onConnectSerial,
  onDisconnectSerial,
  activeAlertCount: _activeAlertCount = 0,
  activeScenario: _activeScenario,
  onSelectScenario: _onSelectScenario
}) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = connectionStatus === 'CONNECTED';

  return (
    <header style={{
      background: 'rgba(8, 14, 28, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(56, 189, 248, 0.22)',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)'
        }}>
          <ShieldAlert size={22} color="#f8fafc" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#f8fafc',
              margin: 0,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Disaster<span style={{ color: '#38bdf8' }}>Guard</span>
            </h1>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              letterSpacing: '0.4px'
            }}>
              SIH 2026
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0', fontWeight: 500 }}>
            Disaster Monitoring & Early Warning System • Rayagada Command Hub
          </p>
        </div>
      </div>

      {/* Middle Status & Live Clock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '6px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Live Digital Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '12px', fontFamily: 'JetBrains Mono' }}>
          <Clock size={13} color="#38bdf8" />
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{timeStr}</span>
          <span style={{ color: '#64748b', fontSize: '10px' }}>IST | {dateStr}</span>
        </div>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Real Hardware WebSocket Stream Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10b981'
          }} className="pulse-circle" />
          <span style={{ color: '#94a3b8' }}>Hardware WebSocket:</span>
          <span style={{ fontWeight: 700, color: '#34d399' }}>
            CONNECTED
          </span>
        </div>
      </div>

      {/* Right Telemetry Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontSize: '11.5px',
            fontWeight: 800,
            letterSpacing: '0.4px'
          }}
        >
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} className="pulse-circle" />
          <span>⚡ ESP32 Real Sensor Stream</span>
        </div>
      </div>
    </header>
  );
}
