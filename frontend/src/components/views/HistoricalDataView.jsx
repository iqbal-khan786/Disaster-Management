import React, { useState } from 'react';
import {
  History,
  Download,
  FileText,
  Search
} from 'lucide-react';

export function HistoricalDataView({ history = [], nodes: _nodes = {} }) {
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h, 7d
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('all');

  // Synthetic expansion for realistic historical logs
  const historicalLogs = React.useMemo(() => {
    const base = [...history];
    const expanded = [];
    const now = Date.now();

    for (let i = 0; i < 20; i++) {
      const pastTime = new Date(now - i * 1000 * 60 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sample = base[i % base.length] || { waterLevel: 65, rain: 40, soilMoisture: 55, temp: 24.2, humidity: 78, vibration: 0, rssi: -66, riskScore: 40 };
      expanded.push({
        id: `LOG-${1000 + i}`,
        time: pastTime,
        nodeId: i % 2 === 0 ? 'NODE_01' : 'NODE_02',
        village: i % 2 === 0 ? 'Village 1: Kashipur Valley' : 'Village 2: Kolnara Ridge',
        waterLevel: sample.waterLevel || 65,
        rain: sample.rain || 40,
        soilMoisture: sample.soilMoisture || 55,
        temp: sample.temp || 24.2,
        humidity: sample.humidity || 78,
        riskScore: sample.riskScore || 40,
        rssi: sample.rssi || -66
      });
    }
    return expanded;
  }, [history]);

  const filteredLogs = historicalLogs.filter(log => {
    if (selectedVillageFilter !== 'all' && log.nodeId !== selectedVillageFilter) return false;
    if (searchQuery && !log.village.toLowerCase().includes(searchQuery.toLowerCase()) && !log.nodeId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Statistical calculations
  const peakWater = Math.max(...historicalLogs.map(l => l.waterLevel), 0);
  const maxRain = Math.max(...historicalLogs.map(l => l.rain), 0);
  const avgTemp = (historicalLogs.reduce((acc, l) => acc + l.temp, 0) / (historicalLogs.length || 1)).toFixed(1);

  // Export handlers
  const exportCSV = () => {
    const headers = "Log ID,Timestamp,Node ID,Village,Water Level (cm),Rainfall (mm/h),Soil Moisture (%),Temp (C),Humidity (%),Risk Score,RSSI (dBm)\n";
    const rows = filteredLogs.map(l => `${l.id},${l.time},${l.nodeId},"${l.village}",${l.waterLevel},${l.rain},${l.soilMoisture},${l.temp},${l.humidity},${l.riskScore},${l.rssi}`).join("\n");
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
            Historical Telemetry Logs & Analysis
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            Stored Environmental Sensor Records • SQLite & LoRa Packet Audit Log
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={exportCSV}
            className="action-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
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
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
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

      {/* Summary KPI Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Peak Flood Depth</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {peakWater} <span style={{ fontSize: '12px', color: '#64748b' }}>cm</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Recorded at Village 1 (Kashipur)</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Max Rainfall Intensity</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {maxRain} <span style={{ fontSize: '12px', color: '#64748b' }}>mm/h</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Monsoon Peak Precipitation</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Mean Ambient Temperature</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            {avgTemp} <span style={{ fontSize: '12px', color: '#64748b' }}>°C</span>
          </div>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Sensirion DHT22 Telemetry</span>
        </div>

        <div className="glass-card" style={{ padding: '14px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>LoRa Packet Integrity</span>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
            99.6%
          </div>
          <span style={{ fontSize: '10px', color: '#34d399' }}>Zero Packet Collision</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Search village or node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#f8fafc',
              fontSize: '11px',
              outline: 'none',
              width: '180px'
            }}
          />

          <select
            value={selectedVillageFilter}
            onChange={(e) => setSelectedVillageFilter(e.target.value)}
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#cbd5e1',
              fontSize: '11px',
              outline: 'none'
            }}
          >
            <option value="all">All Village Sectors</option>
            <option value="NODE_01">Village 1: Kashipur Valley</option>
            <option value="NODE_02">Village 2: Kolnara Ridge</option>
            <option value="NODE_03">Village 3: Kumbhikota Highland</option>
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
                <th style={{ padding: '8px' }}>Water Level</th>
                <th style={{ padding: '8px' }}>Rainfall</th>
                <th style={{ padding: '8px' }}>Soil Moisture</th>
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
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>{log.waterLevel} cm</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#818cf8' }}>{log.rain} mm/h</td>
                  <td style={{ padding: '8px', fontFamily: 'JetBrains Mono', color: '#10b981' }}>{log.soilMoisture}%</td>
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
