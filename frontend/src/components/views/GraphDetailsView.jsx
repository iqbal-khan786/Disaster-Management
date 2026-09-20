import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Thermometer,
  Droplets,
  TrendingUp,
  Download,
  Flame,
  CloudRain,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function GraphDetailsView({ history = [], nodes = {} }) {
  const nodeList = Object.values(nodes);
  const [selectedVillageId, setSelectedVillageId] = useState('NODE_01');
  const [timeRange, setTimeRange] = useState('all'); // '15m', '1h', 'all'

  const currentNode = nodes[selectedVillageId] || nodeList[0] || {};

  // Filter or generate realistic telemetry points
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) {
      const points = [];
      const now = Date.now();
      const baseTemp = currentNode.temp || 26.5;
      const baseHum = currentNode.humidity || 68.0;

      for (let i = 15; i >= 0; i--) {
        const t = new Date(now - i * 60000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const tempVariation = Number((baseTemp + (Math.sin(i / 2) * 1.8)).toFixed(1));
        const humVariation = Number((baseHum + (Math.cos(i / 2) * 4.2)).toFixed(1));

        points.push({
          time: t,
          temp: tempVariation,
          humidity: Math.min(100, Math.max(0, humVariation))
        });
      }
      return points;
    }

    let list = history.map(item => ({
      time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temp: Number(item.temp || 25.0),
      humidity: Number(item.humidity || 70.0)
    }));

    if (timeRange === '15m') return list.slice(-15);
    if (timeRange === '1h') return list.slice(-30);
    return list;
  }, [history, timeRange, currentNode]);

  const labels = filteredHistory.map(h => h.time);

  // Statistics calculation for Temperature & Humidity
  const stats = useMemo(() => {
    const tempVals = filteredHistory.map(h => h.temp);
    const humVals = filteredHistory.map(h => h.humidity);

    const calc = (arr, fallback = 25) => {
      if (!arr || arr.length === 0) return { min: fallback, max: fallback, avg: fallback, cur: fallback };
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const avg = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
      const cur = arr[arr.length - 1];
      return { min, max, avg, cur };
    };

    const tempStat = calc(tempVals, 26.5);
    const humStat = calc(humVals, 65.0);

    // Simplified Heat Index calculation (°C)
    const t = tempStat.cur;
    const r = humStat.cur;
    const heatIndex = Number((t + 0.5555 * ((6.11 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (273.15 + t))) * (r / 100)) - 10)).toFixed(1));

    // Approximate Dew Point (°C): T - ((100 - RH)/5)
    const dewPoint = Number((t - ((100 - r) / 5)).toFixed(1));

    return {
      temp: tempStat,
      hum: humStat,
      heatIndex: isNaN(heatIndex) ? t : heatIndex,
      dewPoint: isNaN(dewPoint) ? 18.0 : dewPoint
    };
  }, [filteredHistory]);

  // Chart styling & dataset for Temperature & Humidity
  const climateChartData = {
    labels,
    datasets: [
      {
        label: 'Ambient Temperature (°C)',
        data: filteredHistory.map(h => h.temp),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        borderWidth: 2.8,
        tension: 0.35,
        fill: true,
        yAxisID: 'yTemp',
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: '#f43f5e',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5
      },
      {
        label: 'Relative Humidity (%)',
        data: filteredHistory.map(h => h.humidity),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.12)',
        borderWidth: 2.8,
        tension: 0.35,
        fill: true,
        yAxisID: 'yHum',
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { family: 'Outfit', size: 12, weight: 'bold' },
          boxWidth: 14,
          padding: 18,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.4)',
        borderWidth: 1.5,
        padding: 12,
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        titleFont: { family: 'JetBrains Mono', size: 12, weight: 'bold' },
        bodyFont: { family: 'Outfit', size: 11 },
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const val = context.parsed.y;
            if (label.includes('Temperature')) {
              return `  🌡️ ${label}: ${val} °C`;
            }
            return `  💧 ${label}: ${val} %`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.15)'
        },
        ticks: {
          color: '#cbd5e1',
          font: { family: 'JetBrains Mono', size: 10.5 },
          maxRotation: 0
        }
      },
      yTemp: {
        type: 'linear',
        position: 'left',
        grid: {
          color: 'rgba(244, 63, 94, 0.08)',
          borderColor: 'rgba(244, 63, 94, 0.3)'
        },
        ticks: {
          color: '#f43f5e',
          font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
          callback: (value) => `${value}°C`
        },
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#f43f5e',
          font: { family: 'Outfit', size: 12, weight: 'bold' }
        },
        suggestedMin: 15,
        suggestedMax: 45
      },
      yHum: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#06b6d4',
          font: { family: 'JetBrains Mono', size: 11, weight: 'bold' },
          callback: (value) => `${value}%`
        },
        title: {
          display: true,
          text: 'Relative Humidity (%)',
          color: '#06b6d4',
          font: { family: 'Outfit', size: 12, weight: 'bold' }
        },
        min: 0,
        max: 100
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = 'Timestamp,Temperature_C,RelativeHumidity_pct\n';
    const rows = filteredHistory.map(h => `${h.time},${h.temp},${h.humidity}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DHT22_Climate_${selectedVillageId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NODE / TIME CONTROLS                                      */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25), rgba(6, 182, 212, 0.25))',
            padding: '10px',
            borderRadius: '10px',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)'
          }}>
            <Thermometer size={24} color="#f43f5e" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: 900,
                color: '#f8fafc',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                margin: 0
              }}>
                Temperature & Humidity Graph Analytics
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#06b6d4',
                border: '1px solid rgba(6, 182, 212, 0.4)'
              }}>
                DHT22 DIGITAL CLIMATE TELEMETRY
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
              Continuous Real-Time Ambient Temperature (°C) and Relative Humidity (%) Multi-Curve Monitoring
            </p>
          </div>
        </div>

        {/* Sector Buttons & Range Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sector Selector */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {nodeList.map(node => (
              <button
                key={node.id}
                onClick={() => setSelectedVillageId(node.id)}
                style={{
                  background: selectedVillageId === node.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: selectedVillageId === node.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: selectedVillageId === node.id ? '#38bdf8' : '#cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {node.name.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Time Range Filter */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '2px'
          }}>
            <button
              onClick={() => setTimeRange('15m')}
              style={{
                background: timeRange === '15m' ? '#38bdf8' : 'transparent',
                color: timeRange === '15m' ? '#0f172a' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              15 Mins
            </button>
            <button
              onClick={() => setTimeRange('1h')}
              style={{
                background: timeRange === '1h' ? '#38bdf8' : 'transparent',
                color: timeRange === '1h' ? '#0f172a' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              1 Hour
            </button>
            <button
              onClick={() => setTimeRange('all')}
              style={{
                background: timeRange === 'all' ? '#38bdf8' : 'transparent',
                color: timeRange === 'all' ? '#0f172a' : '#94a3b8',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Full Stream
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TEMPERATURE & HUMIDITY SUMMARY CARDS                                   */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Card 1: Ambient Temperature */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: '4px solid #f43f5e',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Ambient Temperature</span>
            <Thermometer size={17} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#f43f5e', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.temp.cur} <span style={{ fontSize: '14px', color: '#94a3b8' }}>°C</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>Peak: <b style={{ color: '#f43f5e' }}>{stats.temp.max}°C</b></span>
            <span>Min: <b style={{ color: '#38bdf8' }}>{stats.temp.min}°C</b></span>
            <span>Mean: <b style={{ color: '#cbd5e1' }}>{stats.temp.avg}°C</b></span>
          </div>
        </div>

        {/* Card 2: Relative Humidity */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: '4px solid #06b6d4',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Relative Humidity</span>
            <Droplets size={17} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#06b6d4', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.hum.cur} <span style={{ fontSize: '14px', color: '#94a3b8' }}>%</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>Peak: <b style={{ color: '#06b6d4' }}>{stats.hum.max}%</b></span>
            <span>Min: <b style={{ color: '#94a3b8' }}>{stats.hum.min}%</b></span>
            <span>Mean: <b style={{ color: '#cbd5e1' }}>{stats.hum.avg}%</b></span>
          </div>
        </div>

        {/* Card 3: Heat Index / Apparent Temperature */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: '4px solid #f59e0b',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Apparent Heat Index</span>
            <Flame size={17} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.heatIndex} <span style={{ fontSize: '14px', color: '#94a3b8' }}>°C</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>Thermal Stress:</span>
            <b style={{ color: stats.heatIndex > 35 ? '#ef4444' : '#34d399' }}>
              {stats.heatIndex > 38 ? 'EXTREME CAUTION' : (stats.heatIndex > 32 ? 'MODERATE HEAT' : 'COMFORT ZONE')}
            </b>
          </div>
        </div>

        {/* Card 4: Dew Point & Saturation */}
        <div className="glass-card" style={{
          padding: '16px',
          borderLeft: '4px solid #10b981',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Atmospheric Dew Point</span>
            <CloudRain size={17} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.dewPoint} <span style={{ fontSize: '14px', color: '#94a3b8' }}>°C</span>
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <span>Moisture Condensation:</span>
            <b style={{ color: '#34d399' }}>
              {stats.hum.cur > 85 ? 'HIGH CONDENSATION' : 'BALANCED AIR'}
            </b>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DEDICATED TEMPERATURE & HUMIDITY MAIN GRAPH CANVAS                     */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '0.4px' }}>
              Dual-Axis Temperature (°C) vs Relative Humidity (%) Live Curve
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Red curve indicates Ambient Temperature (°C) on Left Axis | Blue curve indicates Relative Humidity (%) on Right Axis
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f43f5e', fontWeight: 700 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }}></span>
              Temp (°C)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#06b6d4', fontWeight: 700 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }}></span>
              Humidity (%)
            </span>
          </div>
        </div>

        {/* Main Chart Canvas */}
        <div style={{ position: 'relative', width: '100%', height: '390px' }}>
          <Line data={climateChartData} options={chartOptions} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DHT22 SENSOR LOGS & TELEMETRY OBSERVATION TABLE                         */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            DHT22 High-Precision Climate Stream Logs ({filteredHistory.length} Packets)
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Sensor Module: DHT22 (AOSONG Digital Sensor, ±0.5°C / ±2% RH Accuracy)
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Sensor Node</th>
                <th style={{ padding: '8px 12px' }}>Temperature (°C)</th>
                <th style={{ padding: '8px 12px' }}>Humidity (%)</th>
                <th style={{ padding: '8px 12px' }}>Heat Index (°C)</th>
                <th style={{ padding: '8px 12px' }}>Comfort & Safety Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.slice(-8).reverse().map((item, idx) => {
                const temp = item.temp || 25;
                const hum = item.humidity || 65;
                const isHighHeat = temp > 35;
                const isHighHum = hum > 80;

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '9px 12px', color: '#cbd5e1', fontFamily: 'JetBrains Mono' }}>
                      {item.time}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#38bdf8', fontWeight: 700 }}>
                      {selectedVillageId}
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#f43f5e', fontFamily: 'JetBrains Mono' }}>
                      {temp} °C
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 800, color: '#06b6d4', fontFamily: 'JetBrains Mono' }}>
                      {hum} %
                    </td>
                    <td style={{ padding: '9px 12px', color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
                      {stats.heatIndex} °C
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isHighHeat || isHighHum ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isHighHeat || isHighHum ? '#f59e0b' : '#34d399',
                        fontWeight: 700
                      }}>
                        {isHighHeat ? 'HIGH TEMPERATURE' : (isHighHum ? 'HIGH HUMIDITY' : 'NOMINAL COMFORT')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
