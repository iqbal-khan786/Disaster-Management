import React from 'react';
import {
  ShieldCheck,
  Zap,
  LifeBuoy,
  Clock,
  Droplets,
  Radio,
  Send,
  WifiOff,
  Sun
} from 'lucide-react';

export function DisasterLifecycleDetails({ currentPhase, nodes, onOpenDispatch }) {
  if (currentPhase === 'all') {
    return null;
  }

  const nodeList = Object.values(nodes || {});
  const node1 = nodeList.find(n => n.id === 1 || n.id === '1') || nodeList[0] || {};
  const node2 = nodeList.find(n => n.id === 2 || n.id === '2') || nodeList[1] || {};

  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ----------------- PHASE 1: BEFORE DISASTER ----------------- */}
      {currentPhase === 'before' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: '4px solid #10b981'
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', margin: 0 }}>
                1. BEFORE DISASTER — Early Warning & Risk Prediction
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Multi-sensor monitoring detects flood & landslide risks before cellular networks collapse.
              </p>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Clock size={13} />
              Early Warning Window: <strong style={{ color: '#fff' }}>2.4 Hours Lead-Time</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {/* Risk Formula Card */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                NDMA Weighted Risk Formula
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#a7f3d0'
              }}>
                Risk = (Rain×0.25) + (Soil×0.20) + (Vib×0.20) + (Flame×0.15) + (Smoke×0.10) + (Climate×0.10)
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Rainfall Precipitation:</span>
                  <strong>{node1.rainMm || node1.rain || 0} mm/h</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Soil Saturation:</span>
                  <strong>{node1.soilMoisture || 0}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Smoke & Gas:</span>
                  <strong>{node1.smokeLevel || 0} PPM</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Flame & Vibration:</span>
                  <strong>{node1.flameDetected ? 'FLAME' : 'CLEAR'} / {node1.vibration ? 'MOTION' : 'STABLE'}</strong>
                </div>
              </div>
            </div>

            {/* Safe Shelters */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                Pre-Planned Safe Shelters
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                  <div>
                    <strong style={{ color: '#fff' }}>Kolnara High School</strong>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Elevation: 220m ASL • 1.2km</div>
                  </div>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Cap: 450</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                  <div>
                    <strong style={{ color: '#fff' }}>Kumbhikota Community Hall</strong>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Elevation: 195m ASL • 800m</div>
                  </div>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>Cap: 320</span>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                <Sun size={12} /> Solar Continuous Power: 24/7 Active Field Operation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PHASE 2: DURING DISASTER ----------------- */}
      {currentPhase === 'during' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: '4px solid #ef4444'
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#f87171', margin: 0 }}>
                2. DURING DISASTER — Zero-Telecom LoRa Mesh Communication
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Autonomous radio packets hop across mountains when cellular towers are down.
              </p>
            </div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <WifiOff size={13} />
              Cell Towers: <strong style={{ color: '#fff' }}>DOWN (LoRa Mesh 100% Active)</strong>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
              📡 2-Hop LoRa SX1278 Mesh Route (433MHz)
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr auto 1fr',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center'
            }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '9px', color: '#fca5a5', fontWeight: 800 }}>DISASTER ZONE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Node 1: Kolnara</div>
                <div style={{ fontSize: '10px', color: '#f87171' }}>🚨 Siren: ON (95dB)</div>
              </div>

              <div style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>
                5.8 km
                <div style={{ fontSize: '14px' }}>➔ ➔</div>
                -76 dBm
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '9px', color: '#fde68a', fontWeight: 800 }}>RELAY NODE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Node 2: Kumbhikota</div>
                <div style={{ fontSize: '10px', color: '#fbbf24' }}>Auto Packet Repeat</div>
              </div>

              <div style={{ color: '#34d399', fontSize: '10px', fontWeight: 700 }}>
                8.2 km
                <div style={{ fontSize: '14px' }}>➔ ➔</div>
                -82 dBm
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '9px', color: '#a7f3d0', fontWeight: 800 }}>HQ GATEWAY</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Rayagada Base Hub</div>
                <div style={{ fontSize: '10px', color: '#34d399' }}>Sub-45ms Latency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PHASE 3: AFTER DISASTER ----------------- */}
      {currentPhase === 'after' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24', margin: 0 }}>
                3. AFTER DISASTER — Search, Rescue & Triage Dispatch
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Incident commanders dispatch helicopters and rescue boats directly to GPS coordinates.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {/* Sector Triage & Quick Dispatch */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                Sector Priority Triage
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {nodeList.map(n => (
                  <div
                    key={n.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{n.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Risk: {n.riskScore || 0}/100</div>
                    </div>
                    <button
                      onClick={() => onOpenDispatch && onOpenDispatch(n)}
                      style={{
                        background: '#38bdf8',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Send size={11} /> Dispatch
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Survivor GPS Pinpoint */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                Last-Known Survivor GPS Footprint
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                padding: '10px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#67e8f9'
              }}>
                Lat: 19.2400° N | Lng: 83.3300° E (Preserved in DB)
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                ✓ Preserves location even if physical sensors get submerged.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
