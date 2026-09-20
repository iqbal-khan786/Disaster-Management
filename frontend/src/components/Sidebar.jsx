import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Flame,
  AlertTriangle,
  Cpu,
  History,
  LifeBuoy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, activeAlertCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity, badge: 'LIVE' },
    { id: 'risk', label: 'Risk Analysis', icon: Flame, badge: 'AI' },
    { id: 'alerts', label: 'Disaster Alerts', icon: AlertTriangle, badge: activeAlertCount > 0 ? activeAlertCount : null, isAlert: activeAlertCount > 0 },
    { id: 'nodes', label: 'Sensor Nodes', icon: Cpu, badge: null },
    { id: 'history', label: 'Historical Data', icon: History, badge: null },
    { id: 'rescue', label: 'Rescue Operations', icon: LifeBuoy, badge: null }
  ];

  return (
    <aside className="app-sidebar" style={{
      width: collapsed ? '68px' : '230px',
      background: 'rgba(8, 14, 28, 0.98)',
      borderRight: '1px solid rgba(56, 189, 248, 0.18)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 900,
      userSelect: 'none'
    }}>
      {/* Top Section / Nav list */}
      <div style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: '0 8px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '6px'
        }}>
          {!collapsed && (
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Command Console
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="action-btn"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: collapsed ? 'auto' : '0',
              marginRight: collapsed ? 'auto' : '0'
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                background: isActive ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.16) 0%, rgba(14, 165, 233, 0.05) 100%)' : 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                width: '100%',
                position: 'relative'
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} color={isActive ? '#38bdf8' : '#64748b'} />
              
              {!collapsed && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <span style={{
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#f8fafc' : '#cbd5e1',
                    letterSpacing: '0.2px'
                  }}>
                    {item.label}
                  </span>

                  {item.badge && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.isAlert ? '#ef4444' : item.id === 'risk' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      color: item.isAlert ? '#ffffff' : item.id === 'risk' ? '#c084fc' : '#38bdf8',
                      border: item.isAlert ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed Alert Dot */}
              {collapsed && item.isAlert && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '12px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#ef4444'
                }} className="pulse-circle" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Telemetry Status Summary */}
      {!collapsed && (
        <div style={{
          padding: '14px',
          margin: '10px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(56, 189, 248, 0.12)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>
            <Radio size={13} color="#38bdf8" />
            <span>LoRa Mesh Protocol</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Band: 433.175 MHz</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>BW 125kHz</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
            <span>Topology: Multi-Hop</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>CR 4/5</span>
          </div>
        </div>
      )}
    </aside>
  );
}
