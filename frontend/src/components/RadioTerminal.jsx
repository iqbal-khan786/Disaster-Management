import React from 'react';
import { Terminal } from 'lucide-react';

export function RadioTerminal({ logs }) {
  return (
    <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', height: '170px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={14} color="var(--accent)" />
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live LoRa Radio Telemetry Terminal
          </h3>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
          433.0 MHz SF10 CR4/5 BW125
        </span>
      </div>

      <div style={{
        flex: 1,
        background: '#040711',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 10px',
        overflowY: 'auto',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        {logs.map((log) => {
          let textColor = '#64748b';
          if (log.type === 'rx') textColor = '#38bdf8';
          if (log.type === 'ack') textColor = '#10b981';
          if (log.type === 'danger') textColor = '#ef4444';
          if (log.type === 'warn') textColor = '#f59e0b';
          if (log.type === 'ws') textColor = '#c084fc';

          return (
            <div key={log.id} style={{ color: textColor, lineHeight: '1.4' }}>
              <span style={{ color: '#475569', marginRight: '6px' }}>[{log.time}]</span>
              <span>{log.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
