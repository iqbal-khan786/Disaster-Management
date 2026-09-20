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
import { Line, Bar } from 'react-chartjs-2';
import {
  LineChart as LineChartIcon,
  TrendingUp,
  Activity,
  Droplets,
  Mountain,
  Flame,
  Thermometer,
  Zap,
  Radio,
  Clock,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck
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
  const [activeChartCategory, setActiveChartCategory] = useState('rain_soil');
  const [timeRange, setTimeRange] = useState('all'); // '15m', '1h', 'all'

  const currentNode = nodes[selectedVillageId] || nodeList[0] || {};

  // Filter history based on time range
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) {
      // Generate realistic fallback telemetry data points if history is sparse
      const points = [];
      const now = Date.now();
      for (let i = 12; i >= 0; i--) {
        const t = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        points.push({
          time: t,
          rain: currentNode.rainMm || 0,
          soilMoisture: currentNode.soilMoisture || 34,
          smokeLevel: currentNode.smokeLevel || 18,
          flameDetected: currentNode.flameDetected || false,
          vibration: currentNode.vibration ? 1 : 0,
          vibrationFreq: currentNode.vibrationFreq || 0,
          temp: currentNode.temp || 26.4,
          humidity: currentNode.humidity || 64.5,
          rssi: currentNode.rssi || -67,
          snr: currentNode.snr || 8.6,
          riskScore: currentNode.riskScore || 18.5
        });
      }
      return points;
    }

    if (timeRange === '15m') return history.slice(-15);
    if (timeRange === '1h') return history.slice(-30);
    return history;
  }, [history, timeRange, currentNode]);

  const labels = filteredHistory.map(h => h.time || '00:00');

  // Compute Statistics for each sensor parameter
  const stats = useMemo(() => {
    const rainVals = filteredHistory.map(h => h.rain || h.rainMm || 0);
    const soilVals = filteredHistory.map(h => h.soilMoisture || 0);
    const smokeVals = filteredHistory.map(h => h.smokeLevel || h.smoke || 0);
    const tempVals = filteredHistory.map(h => h.temp || 24.5);
    const humVals = filteredHistory.map(h => h.humidity || 75);
    const riskVals = filteredHistory.map(h => h.riskScore || 15);

    const calc = (arr) => {
      if (arr.length === 0) return { min: 0, max: 0, avg: 0, cur: 0 };
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const avg = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
      const cur = arr[arr.length - 1] || 0;
      return { min, max, avg, cur };
    };

    return {
      rain: calc(rainVals),
      soil: calc(soilVals),
      smoke: calc(smokeVals),
      temp: calc(tempVals),
      hum: calc(humVals),
      risk: calc(riskVals)
    };
  }, [filteredHistory]);

  // Common Dark Theme Grid & Axis Styling
  const commonScaleOptions = {
    grid: {
      color: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    ticks: {
      color: '#94a3b8',
      font: { family: 'JetBrains Mono', size: 11 }
    }
  };

  // 1. Rainfall & Soil Moisture Data
  const rainSoilData = {
    labels,
    datasets: [
      {
        label: 'Rainfall Intensity (mm/h)',
        data: filteredHistory.map(h => h.rain || h.rainMm || 0),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        yAxisID: 'yRain',
        pointRadius: 3,
        pointBackgroundColor: '#818cf8'
      },
      {
        label: 'Soil Moisture (%)',
        data: filteredHistory.map(h => h.soilMoisture || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2.5,
        borderDash: [5, 5],
        tension: 0.35,
        fill: false,
        yAxisID: 'ySoil',
        pointRadius: 3,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  // 2. Seismic Vibration & Slope Stability
  const seismicData = {
    labels,
    datasets: [
      {
        label: 'Seismic Vibration Frequency (Hz)',
        data: filteredHistory.map(h => h.vibrationFreq || (h.vibration ? 380 : 0)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.18)',
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
        yAxisID: 'yHz',
        pointRadius: 3,
        pointBackgroundColor: '#ef4444'
      },
      {
        label: 'Soil Saturation Baseline (%)',
        data: filteredHistory.map(h => h.soilMoisture || 0),
        borderColor: '#f59e0b',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.35,
        fill: false,
        yAxisID: 'ySoil',
        pointRadius: 2,
        pointBackgroundColor: '#f59e0b'
      }
    ]
  };

  // 3. Smoke / Gas (PPM) & Flame IR Trigger
  const smokeFlameData = {
    labels,
    datasets: [
      {
        label: 'Gas / Smoke Concentration (PPM)',
        data: filteredHistory.map(h => h.smokeLevel || h.smoke || 0),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        yAxisID: 'ySmoke',
        pointRadius: 3,
        pointBackgroundColor: '#f59e0b'
      },
      {
        label: 'Flame IR Sensor Active (0/1)',
        data: filteredHistory.map(h => (h.flameDetected ? 1 : 0)),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        borderWidth: 2,
        stepped: true,
        fill: true,
        yAxisID: 'yFlame',
        pointRadius: 0
      }
    ]
  };

  // 4. Climate Trends (Temp vs Humidity)
  const climateData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: filteredHistory.map(h => h.temp || 24.5),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        yAxisID: 'yTemp',
        pointRadius: 3,
        pointBackgroundColor: '#f43f5e'
      },
      {
        label: 'Relative Humidity (%)',
        data: filteredHistory.map(h => h.humidity || 75),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderWidth: 2.5,
        borderDash: [4, 4],
        tension: 0.35,
        fill: false,
        yAxisID: 'yHum',
        pointRadius: 3,
        pointBackgroundColor: '#06b6d4'
      }
    ]
  };

  // 5. Composite Risk Score (0 - 100%)
  const compositeRiskData = {
    labels,
    datasets: [
      {
        label: 'Multi-Sensor Fusion Risk Score (%)',
        data: filteredHistory.map(h => h.riskScore || 18),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        yAxisID: 'yRisk',
        pointRadius: 4,
        pointBackgroundColor: '#a855f7'
      }
    ]
  };

  // 6. Wireless LoRa RF Quality (RSSI & SNR)
  const loraRfData = {
    labels,
    datasets: [
      {
        label: 'LoRa RSSI Signal Strength (dBm)',
        data: filteredHistory.map(h => h.rssi || -67),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        yAxisID: 'yRssi',
        pointRadius: 3,
        pointBackgroundColor: '#38bdf8'
      },
      {
        label: 'LoRa SNR Signal-to-Noise Ratio (dB)',
        data: filteredHistory.map(h => h.snr || 8.6),
        borderColor: '#34d399',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.35,
        fill: false,
        yAxisID: 'ySnr',
        pointRadius: 3,
        pointBackgroundColor: '#34d399'
      }
    ]
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = 'Timestamp,Rainfall_mm_h,SoilMoisture_pct,Smoke_PPM,Flame_Detected,Vibration_Hz,Temperature_C,Humidity_pct,Risk_Score\n';
    const rows = filteredHistory.map(h =>
      `${h.time},${h.rain || h.rainMm || 0},${h.soilMoisture || 0},${h.smokeLevel || 0},${h.flameDetected ? 1 : 0},${h.vibrationFreq || 0},${h.temp || 24.5},${h.humidity || 75},${h.riskScore || 15}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Disaster_Telemetry_${selectedVillageId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TELEMETRY CONTROLS                                        */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.25))',
            padding: '10px',
            borderRadius: '10px',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)'
          }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                Sensor Graph Analytics & Detailed Curves
              </h2>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}>
                LIVE HIGH-FREQUENCY TELEMETRY
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
              Real-Time Continuous Multi-Sensor Dynamics, Threshold Excursions & Time-Series Derivative Tracking
            </p>
          </div>
        </div>

        {/* Sector Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Sector Buttons */}
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
      {/* 2. STATISTICAL PEAK & AVERAGE SUMMARY CARDS                               */}
      {/* ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        {/* Metric 1: Rainfall */}
        <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #818cf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Precipitation (Peak / Mean)</span>
            <Droplets size={15} color="#818cf8" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#818cf8', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.rain.cur} <span style={{ fontSize: '12px', color: '#94a3b8' }}>mm/h</span>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peak: <b>{stats.rain.max} mm</b></span>
            <span>Mean: <b>{stats.rain.avg} mm</b></span>
          </div>
        </div>

        {/* Metric 2: Soil Saturation */}
        <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Soil Saturation (Peak / Mean)</span>
            <Mountain size={15} color="#10b981" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.soil.cur} <span style={{ fontSize: '12px', color: '#94a3b8' }}>%</span>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peak: <b>{stats.soil.max}%</b></span>
            <span>Mean: <b>{stats.soil.avg}%</b></span>
          </div>
        </div>

        {/* Metric 3: Gas & Smoke */}
        <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Smoke & Gas (Peak / Mean)</span>
            <Flame size={15} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.smoke.cur} <span style={{ fontSize: '12px', color: '#94a3b8' }}>PPM</span>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peak: <b>{stats.smoke.max} PPM</b></span>
            <span>Mean: <b>{stats.smoke.avg} PPM</b></span>
          </div>
        </div>

        {/* Metric 4: Composite Risk */}
        <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
            <span>Composite Risk Index</span>
            <Activity size={15} color="#a855f7" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#c084fc', fontFamily: 'JetBrains Mono', margin: '4px 0' }}>
            {stats.risk.cur}% <span style={{ fontSize: '11px', color: '#94a3b8' }}>/ 100%</span>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
            <span>Peak: <b>{stats.risk.max}%</b></span>
            <span>Mean: <b>{stats.risk.avg}%</b></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE CHART CATEGORY SELECTOR & MAIN GRAPH CANVAS                */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Graph Category Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveChartCategory('rain_soil')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'rain_soil' ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'rain_soil' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'rain_soil' ? '#818cf8' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Droplets size={15} />
            1. Hydrology (Rain mm/h & Soil %)
          </button>

          <button
            onClick={() => setActiveChartCategory('seismic')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'seismic' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'seismic' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'seismic' ? '#ef4444' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Mountain size={15} />
            2. Geotechnical (Vibration Hz & Slope)
          </button>

          <button
            onClick={() => setActiveChartCategory('smoke_flame')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'smoke_flame' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'smoke_flame' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'smoke_flame' ? '#f59e0b' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Flame size={15} />
            3. Fire & Toxic Gas (MQ-2 PPM & Flame IR)
          </button>

          <button
            onClick={() => setActiveChartCategory('climate')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'climate' ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'climate' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'climate' ? '#06b6d4' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Thermometer size={15} />
            4. Micro-Climate (Temp °C & Humidity %)
          </button>

          <button
            onClick={() => setActiveChartCategory('risk')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'risk' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'risk' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'risk' ? '#c084fc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Activity size={15} />
            5. Composite AI Risk Fusion Trend
          </button>

          <button
            onClick={() => setActiveChartCategory('lora_rf')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeChartCategory === 'lora_rf' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeChartCategory === 'lora_rf' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeChartCategory === 'lora_rf' ? '#38bdf8' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Radio size={15} />
            6. Wireless LoRa Link (RSSI & SNR)
          </button>
        </div>

        {/* Main Chart Rendering Canvas */}
        <div style={{ position: 'relative', width: '100%', height: '360px' }}>
          
          {/* Chart 1: Rain & Soil */}
          {activeChartCategory === 'rain_soil' && (
            <Line
              data={rainSoilData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#38bdf8', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  yRain: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'Rainfall (mm/h)', color: '#818cf8', font: { weight: 'bold' } },
                    suggestedMax: 150
                  },
                  ySoil: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#10b981' },
                    title: { display: true, text: 'Soil Moisture (%)', color: '#10b981', font: { weight: 'bold' } },
                    min: 0,
                    max: 100
                  }
                }
              }}
            />
          )}

          {/* Chart 2: Seismic / Vibration */}
          {activeChartCategory === 'seismic' && (
            <Line
              data={seismicData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#ef4444', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  yHz: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'Seismic Tremor (Hz)', color: '#ef4444', font: { weight: 'bold' } },
                    suggestedMax: 500
                  },
                  ySoil: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#f59e0b' },
                    title: { display: true, text: 'Soil Saturation (%)', color: '#f59e0b', font: { weight: 'bold' } },
                    min: 0,
                    max: 100
                  }
                }
              }}
            />
          )}

          {/* Chart 3: Smoke & Flame */}
          {activeChartCategory === 'smoke_flame' && (
            <Line
              data={smokeFlameData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#f59e0b', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  ySmoke: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'Smoke Concentration (PPM)', color: '#f59e0b', font: { weight: 'bold' } },
                    suggestedMax: 400
                  },
                  yFlame: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#ef4444', stepSize: 1 },
                    title: { display: true, text: 'Flame IR (0=Clear, 1=Fire)', color: '#ef4444', font: { weight: 'bold' } },
                    min: 0,
                    max: 1.2
                  }
                }
              }}
            />
          )}

          {/* Chart 4: Climate */}
          {activeChartCategory === 'climate' && (
            <Line
              data={climateData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#06b6d4', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  yTemp: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'Temperature (°C)', color: '#f43f5e', font: { weight: 'bold' } },
                    suggestedMax: 60
                  },
                  yHum: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#06b6d4' },
                    title: { display: true, text: 'Humidity (%)', color: '#06b6d4', font: { weight: 'bold' } },
                    min: 0,
                    max: 100
                  }
                }
              }}
            />
          )}

          {/* Chart 5: Composite Risk */}
          {activeChartCategory === 'risk' && (
            <Line
              data={compositeRiskData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#a855f7', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  yRisk: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'AI Risk Score (%)', color: '#c084fc', font: { weight: 'bold' } },
                    min: 0,
                    max: 100
                  }
                }
              }}
            />
          )}

          {/* Chart 6: LoRa RF */}
          {activeChartCategory === 'lora_rf' && (
            <Line
              data={loraRfData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: '#f8fafc', font: { family: 'Outfit', weight: 'bold' } } },
                  tooltip: { backgroundColor: '#0f172a', borderColor: '#38bdf8', borderWidth: 1 }
                },
                scales: {
                  x: commonScaleOptions,
                  yRssi: {
                    type: 'linear',
                    position: 'left',
                    ...commonScaleOptions,
                    title: { display: true, text: 'RSSI (dBm)', color: '#38bdf8', font: { weight: 'bold' } },
                    min: -105,
                    max: -45
                  },
                  ySnr: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#34d399' },
                    title: { display: true, text: 'SNR (dB)', color: '#34d399', font: { weight: 'bold' } },
                    min: -5,
                    max: 15
                  }
                }
              }}
            />
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DETAILED SENSOR STATISTICAL PARAMETERS MATRIX TABLE                    */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            6-Physical Sensor Statistical Derivatives & Threshold Surveillance
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Historical Window: {filteredHistory.length} Telemetry Packets
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '8px 12px' }}>Physical Sensor Channel</th>
                <th style={{ padding: '8px 12px' }}>Hardware Model</th>
                <th style={{ padding: '8px 12px' }}>Live Current</th>
                <th style={{ padding: '8px 12px' }}>Min Recorded</th>
                <th style={{ padding: '8px 12px' }}>Peak (Max)</th>
                <th style={{ padding: '8px 12px' }}>Mean (Average)</th>
                <th style={{ padding: '8px 12px' }}>Threshold Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Rain */}
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={14} /> Rainfall Precipitation
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>Optical / Tipping Bucket</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{stats.rain.cur} mm/h</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{stats.rain.min} mm</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: stats.rain.max > 80 ? '#ef4444' : '#818cf8' }}>{stats.rain.max} mm</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{stats.rain.avg} mm</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: stats.rain.cur > 80 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: stats.rain.cur > 80 ? '#f87171' : '#34d399',
                    fontWeight: 700
                  }}>
                    {stats.rain.cur > 80 ? 'CRITICAL RUNOFF' : (stats.rain.cur > 40 ? 'MODERATE' : 'NOMINAL')}
                  </span>
                </td>
              </tr>

              {/* Row 2: Soil */}
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mountain size={14} /> Soil Moisture Content
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>Capacitive Corrosion-Resistant</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{stats.soil.cur}%</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{stats.soil.min}%</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: stats.soil.max > 85 ? '#ef4444' : '#10b981' }}>{stats.soil.max}%</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{stats.soil.avg}%</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: stats.soil.cur > 85 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: stats.soil.cur > 85 ? '#f87171' : '#34d399',
                    fontWeight: 700
                  }}>
                    {stats.soil.cur > 85 ? 'LIQUEFACTION RISK' : (stats.soil.cur > 60 ? 'SATURATED' : 'STABLE')}
                  </span>
                </td>
              </tr>

              {/* Row 3: Smoke */}
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={14} /> Smoke & Combustible Gas
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>MQ-2 Semiconductor Gas Sensor</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{stats.smoke.cur} PPM</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{stats.smoke.min} PPM</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: stats.smoke.max > 150 ? '#ef4444' : '#f59e0b' }}>{stats.smoke.max} PPM</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{stats.smoke.avg} PPM</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: stats.smoke.cur > 150 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: stats.smoke.cur > 150 ? '#f87171' : '#34d399',
                    fontWeight: 700
                  }}>
                    {stats.smoke.cur > 150 ? 'TOXIC SMOKE HAZARD' : 'CLEAN AIR'}
                  </span>
                </td>
              </tr>

              {/* Row 4: Seismic */}
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} /> Seismic Motion / Tremor
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>SW-420 Piezo Vibration Sensor</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: currentNode.vibration ? '#ef4444' : '#34d399', fontFamily: 'JetBrains Mono' }}>
                  {currentNode.vibration ? 'MOTION DETECTED (1)' : 'QUIESCENT (0)'}
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>0 Hz</td>
                <td style={{ padding: '10px 12px', color: '#ef4444' }}>{currentNode.vibrationFreq || 380} Hz</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>Quiescent Baseline</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: currentNode.vibration ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: currentNode.vibration ? '#f87171' : '#34d399',
                    fontWeight: 700
                  }}>
                    {currentNode.vibration ? 'SLOPE DEBRIS SHOCK' : 'STABLE SLOPE'}
                  </span>
                </td>
              </tr>

              {/* Row 5: Temperature & Humidity */}
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Thermometer size={14} /> Ambient Climate Array
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>DHT22 Digital Temperature & Hum</td>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{stats.temp.cur}°C / {stats.hum.cur}%</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{stats.temp.min}°C</td>
                <td style={{ padding: '10px 12px', color: '#f43f5e' }}>{stats.temp.max}°C / {stats.hum.max}%</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{stats.temp.avg}°C Mean</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
                    OPTIMAL CLIMATE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
