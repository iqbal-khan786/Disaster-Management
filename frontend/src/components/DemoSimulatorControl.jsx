import React, { useState } from 'react';
import {
  Sparkles,
  Waves,
  CloudRain,
  Mountain,
  Flame,
  Wind,
  WifiOff,
  ServerOff,
  Sun,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function DemoSimulatorControl({
  isDemoMode: _isDemoMode,
  activeScenario,
  onSelectScenario,
  onToggleDemoMode: _onToggleDemoMode
}) {
  const [isOpen, setIsOpen] = useState(true);

  const scenarios = [
    { id: 'normal', label: '1. Baseline Safe Weather', icon: Sun, color: '#10b981', desc: 'Clear skies, low water & rain' },
    { id: 'flood', label: '2. Critical Flash Flood', icon: Waves, color: '#ef4444', desc: 'Water 2.85m, rain 115mm/h' },
    { id: 'monsoon', label: '3. Heavy Monsoon', icon: CloudRain, color: '#38bdf8', desc: 'Rain 135mm, soil 92%' },
    { id: 'landslide', label: '4. Landslide & Slope Shift', icon: Mountain, color: '#f59e0b', desc: 'Soil 99% + vibration trip' },
    { id: 'fire', label: '5. Wildfire & Smoke Gas', icon: Flame, color: '#ef4444', desc: 'Smoke 380 PPM, flame detected' },
    { id: 'cyclone', label: '6. Severe Cyclonic Storm', icon: Wind, color: '#a855f7', desc: 'Rain 160mm + gale vibration' },
    { id: 'disconnect', label: '7. Node LoRa Blackout', icon: WifiOff, color: '#f43f5e', desc: 'Packet timeout & signal loss' },
    { id: 'gateway_offline', label: '8. Gateway Hub Offline', icon: ServerOff, color: '#64748b', desc: 'Zero data forwarding' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(13, 22, 41, 0.95) 0%, rgba(8, 14, 28, 0.98) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: '10px',
      margin: '0 0 16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Simulator Bar Header */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(245, 158, 11, 0.1)',
        borderBottom: isOpen ? '1px solid rgba(245, 158, 11, 0.2)' : 'none',
        cursor: 'pointer'
      }} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#fbbf24" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Interactive Demo Simulation Engine
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>
            (Simulate live disaster scenarios without physical hardware connected)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            Active: {activeScenario.toUpperCase()}
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Scenario Buttons Grid */}
      {isOpen && (
        <div style={{
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px'
        }}>
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isSelected = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                className="action-btn"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${sc.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? `rgba(${parseInt(sc.color.slice(1,3), 16)}, ${parseInt(sc.color.slice(3,5), 16)}, ${parseInt(sc.color.slice(5,7), 16)}, 0.2)` : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#f8fafc' : '#cbd5e1',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                  <Icon size={14} color={sc.color} />
                  <span style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sc.label}
                  </span>
                </div>
                <span style={{ fontSize: '9px', color: isSelected ? '#e2e8f0' : '#64748b' }}>
                  {sc.desc}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
