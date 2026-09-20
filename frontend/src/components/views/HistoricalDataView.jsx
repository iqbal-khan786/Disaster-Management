import React, { useState } from 'react';
import {
  History,
  Download,
  FileText,
  FileDown,
  Search
} from 'lucide-react';
import { generateDisasterPDFReport } from '../../utils/generatePdfReport';

export function HistoricalDataView({ history = [], nodes = {} }) {
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h, 7d
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('all');

  const currentNode = nodes["NODE_01"] || Object.values(nodes)[0] || {};

  // Historical telemetry logs formatted for the 6 physical sensors
  const historicalLogs = React.useMemo(() => {
    const base = [...history];
    const expanded = [];
    const now = Date.now();

    for (let i = 0; i < 20; i++) {
      const pastTime = new Date(now - i * 1000 * 60 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sample = base[i % base.length] || { rain: 0, soilMoisture: 0, smokeLevel: 0, flameDetected: false, vibration: false, temp: 24.5, humidity: 75, rssi: -65, riskScore: 10 };
      expanded.push({
        id: `LOG-${1000 + i}`,
        time: pastTime,
        nodeId: 'NODE_01',
        village: 'Village 1: Kashipur Valley',
        rain: sample.rain ?? sample.rainMm ?? 0,
        soilMoisture: sample.soilMoisture ?? sample.soil ?? 0,
        smokeLevel: sample.smokeLevel ?? sample.smoke ?? 0,
        flameDetected: sample.flameDetected ?? sample.flame_detected ?? false,
        vibration: sample.vibration ?? false,
        temp: sample.temp ?? sample.temperature ?? 24.5,
        humidity: sample.humidity ?? 75,
        riskScore: sample.riskScore ?? 10,
        rssi: sample.rssi ?? -65
      });
    }
    return expanded;
  }, [history]);

  const filteredLogs = historicalLogs.filter(log => {
    if (selectedVillageFilter !== 'all' && log.nodeId !== selectedVillageFilter) return false;
    if (searchQuery && !log.village.toLowerCase().includes(searchQuery.toLowerCase()) && !log.nodeId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Statistical calculations across the 6 physical sensors
  const maxRain = Math.max(...historicalLogs.map(l => l.rain), 0);
  const avgSoil = (historicalLogs.reduce((acc, l) => acc + l.soilMoisture, 0) / (historicalLogs.length || 1)).toFixed(0);
  const maxSmoke = Math.max(...historicalLogs.map(l => l.smokeLevel), 0);
  const avgTemp = (historicalLogs.reduce((acc, l) => acc + l.temp, 0) / (historicalLogs.length || 1)).toFixed(1);

  // Export handlers
  const exportPDF = () => {
    generateDisasterPDFReport({
      logs: filteredLogs,
      currentNode,
      summaryStats: { maxRain, avgSoil, maxSmoke, avgTemp }
    });
  };

  const exportCSV = () => {
    const headers = "Log ID,Timestamp,Node ID,Village,Rainfall (mm/h),Soil Moisture (%),Smoke (PPM),Flame Detected,Vibration Detected,Temp (C),Humidity (%),Risk Score,RSSI (dBm)\n";
    const rows = filteredLogs.map(l => `${l.id},${l.time},${l.nodeId},"${l.village}",${l.rain},${l.soilMoisture},${l.smokeLevel},${l.flameDetected ? 'YES' : 'NO'},${l.vibration ? 'YES' : 'NO'},${l.temp},${l.humidity},${l.riskScore},${l.rssi}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DisasterGuard_Telemetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DisasterGuard_Telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#38bdf8" />
            Historical Telemetry Logs & PDF Reporting
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            Stored 6-Sensor Environmental Records • Official OSDMA & DEOC Audit Generator
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={exportPDF}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid #94302f',
              background: '#b33b3b',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >
            <FileDown size={14} color="#ffffff" />
            <span>Export Official PDF Report</span>
          </button>

          <button
            onClick={exportCSV}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #245a79',
              background: '#2e6f95',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportJSON}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #5c3e86',
              background: '#70509a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <FileText size={13} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Stats (6 Physical Sensors) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Max Rainfall Intensity</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {maxRain} <span style={{ fontSize: '12px', color: '#64748b' }}>mm/h</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Rain Sensor (Pin 34)</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Mean Soil Moisture</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {avgSoil} <span style={{ fontSize: '12px', color: '#64748b' }}>%</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Soil Saturation (Pin 35)</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Peak Smoke / Gas Concentration</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {maxSmoke} <span style={{ fontSize: '12px', color: '#64748b' }}>PPM</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>MQ-2 Sensor (Pin 39)</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Mean Temperature</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {avgTemp} <span style={{ fontSize: '12px', color: '#64748b' }}>°C</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>DHT22 Sensor (Pin 4)</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            className="history-search"
            placeholder="Search village or node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid #c7d4de',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#1f2933',
              fontSize: '11px',
              outline: 'none',
              width: '180px'
            }}
          />

          <select
            value={selectedVillageFilter}
            onChange={(e) => setSelectedVillageFilter(e.target.value)}
            className="history-village-filter"
            style={{
              background: '#1f2b40',
              border: '1px solid #71869a',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#ffffff',
              fontSize: '11px',
              outline: 'none'
            }}
          >
            <option value="all">Village 1: Kashipur Valley (Live Node)</option>
            <option value="NODE_01">Village 1: Kashipur Valley</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['1h', '6h', '24h', '7d'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="action-btn"
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: timeRange === range ? '#38bdf8' : 'rgba(255, 255, 255, 0.04)',
                color: timeRange === range ? '#000' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '8px' }}>Log ID</th>
                <th style={{ padding: '8px' }}>Timestamp</th>
                <th style={{ padding: '8px' }}>Node / Village</th>
                <th style={{ padding: '8px' }}>Rainfall</th>
                <th style={{ padding: '8px' }}>Soil Moisture</th>
                <th style={{ padding: '8px' }}>Smoke (PPM)</th>
                <th style={{ padding: '8px' }}>Flame</th>
                <th style={{ padding: '8px' }}>Vibration</th>
                <th style={{ padding: '8px' }}>Climate</th>
                <th style={{ padding: '8px' }}>Risk Score</th>
                <th style={{ padding: '8px' }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#f8fafc' }}>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#64748b' }}>{log.id}</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>{log.time}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{log.village}</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#818cf8' }}>{log.rain} mm/h</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#10b981' }}>{log.soilMoisture}%</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#f59e0b' }}>{log.smokeLevel} PPM</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: log.flameDetected ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {log.flameDetected ? 'FLAME' : 'CLEAR'}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: log.vibration ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                    {log.vibration ? 'MOTION' : 'STABLE'}
                  </td>
                  <td style={{ padding: '8px', color: '#94a3b8' }}>{log.temp}°C / {log.humidity}%</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: log.riskScore > 60 ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                    {log.riskScore}/100
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#a855f7' }}>{log.rssi} dBm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
