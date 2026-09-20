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
  Layers,
  Thermometer,
  Droplets,
  Download
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

  // Interactive View Modes:
  // 1. Tab: 'dual' (Dual Overlay) | 'temp' (Temperature) | 'hum' (Humidity)
  const [activeTab, setActiveTab] = useState('dual');

  // 2. Chart Type: 'area' | 'line' | 'bar'
  const [chartType, setChartType] = useState('area');

  // 3. Time Range: '1H' | '6H' | '24H' | '7D' | '30D'
  const [timeRange, setTimeRange] = useState('7D');

  const currentNode = nodes[selectedVillageId] || nodeList[0] || {};
  const baseTemp = Number(currentNode.temp || 33.5);
  const baseHum = Number(currentNode.humidity || 58.0);

  // Time-aligned telemetry data points corresponding to the selected range
  const chartDataPoints = useMemo(() => {
    const now = Date.now();

    if (timeRange === '1H') {
      const count = 12;
      const stepMs = 5 * 60 * 1000;
      const points = [];
      for (let i = count - 1; i >= 0; i--) {
        const timeStr = new Date(now - i * stepMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tVal = Number((baseTemp + Math.sin((count - i) * 0.5) * 1.2).toFixed(1));
        const hVal = Number(Math.min(100, Math.max(10, baseHum - Math.sin((count - i) * 0.5) * 3.2)).toFixed(1));
        points.push({ label: timeStr, temp: tVal, hum: hVal });
      }
      return points;
    }

    if (timeRange === '6H') {
      const count = 12;
      const stepMs = 30 * 60 * 1000;
      const points = [];
      for (let i = count - 1; i >= 0; i--) {
        const timeStr = new Date(now - i * stepMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tVal = Number((baseTemp + Math.sin((count - i) * 0.4) * 2.2).toFixed(1));
        const hVal = Number(Math.min(100, Math.max(10, baseHum - Math.sin((count - i) * 0.4) * 6.5)).toFixed(1));
        points.push({ label: timeStr, temp: tVal, hum: hVal });
      }
      return points;
    }

    if (timeRange === '24H') {
      const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      return hours.map((h, idx) => {
        const tVal = Number((baseTemp + Math.cos((idx - 4) * 0.7) * 4.2).toFixed(1));
        const hVal = Number(Math.min(95, Math.max(25, baseHum - Math.cos((idx - 4) * 0.7) * 12.0)).toFixed(1));
        return { label: h, temp: tVal, hum: hVal };
      });
    }

    if (timeRange === '7D') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const temps = [34.5, 34.1, 34.8, 35.0, 34.3, 34.0, 34.5];
      const hums = [58.0, 60.5, 63.8, 61.2, 57.0, 55.2, 62.0];

      return days.map((d, idx) => ({
        label: d,
        temp: temps[idx],
        hum: hums[idx]
      }));
    }

    if (timeRange === '30D') {
      const points = [];
      for (let i = 1; i <= 10; i++) {
        const dayNum = i * 3;
        points.push({
          label: `${dayNum} Sep`,
          temp: Number((baseTemp + Math.sin(i * 0.5) * 3.5).toFixed(1)),
          hum: Number(Math.min(95, Math.max(25, baseHum - Math.sin(i * 0.5) * 8.5)).toFixed(1))
        });
      }
      return points;
    }

    return [];
  }, [timeRange, baseTemp, baseHum]);

  const labels = chartDataPoints.map(p => p.label);

  const isArea = chartType === 'area';
  const datasets = [];

  // Temperature Dataset (Orange / Amber)
  if (activeTab === 'dual' || activeTab === 'temp') {
    datasets.push({
      type: chartType === 'bar' ? 'bar' : 'line',
      label: 'Temperature (°C)',
      data: chartDataPoints.map(p => p.temp),
      borderColor: '#d97706', // Amber orange stroke
      backgroundColor: (context) => {
        if (chartType === 'bar') return 'rgba(217, 119, 6, 0.7)';
        if (!isArea) return 'transparent';
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
        gradient.addColorStop(0.7, 'rgba(251, 191, 36, 0.08)');
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0.0)');
        return gradient;
      },
      borderWidth: 2.8,
      tension: 0.35,
      fill: isArea,
      yAxisID: 'yTemp',
      pointRadius: chartType === 'bar' ? 0 : 4.5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#d97706',
      pointBorderWidth: 2.5
    });
  }

  // Humidity Dataset (Royal Blue)
  if (activeTab === 'dual' || activeTab === 'hum') {
    datasets.push({
      type: chartType === 'bar' ? 'bar' : 'line',
      label: 'Humidity (%)',
      data: chartDataPoints.map(p => p.hum),
      borderColor: '#2563eb', // Royal Blue stroke
      backgroundColor: (context) => {
        if (chartType === 'bar') return 'rgba(37, 99, 235, 0.7)';
        if (!isArea) return 'transparent';
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
        gradient.addColorStop(0.7, 'rgba(37, 99, 235, 0.05)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
        return gradient;
      },
      borderWidth: 2.8,
      tension: 0.35,
      fill: isArea,
      yAxisID: activeTab === 'hum' ? 'yTemp' : 'yHum',
      pointRadius: chartType === 'bar' ? 0 : 4.5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#2563eb',
      pointBorderWidth: 2.5
    });
  }

  const chartData = { labels, datasets };

  // Precise Scale Configuration matching reference
  const scalesConfig = {
    x: {
      grid: {
        color: 'rgba(226, 232, 240, 0.6)',
        borderColor: 'rgba(203, 213, 225, 0.8)',
        drawBorder: true
      },
      ticks: {
        color: '#64748b',
        font: { family: 'Outfit', size: 12, weight: '500' }
      }
    },
    yTemp: {
      type: 'linear',
      position: 'left',
      min: 20,
      max: 45,
      ticks: {
        color: '#d97706',
        stepSize: 5,
        font: { family: 'Outfit', size: 12, weight: '700' },
        callback: (v) => `${v}°C`
      },
      title: {
        display: true,
        text: 'Temperature (°C)',
        color: '#d97706',
        font: { family: 'Outfit', size: 12, weight: '700' }
      },
      grid: {
        color: 'rgba(226, 232, 240, 0.6)',
        borderColor: 'rgba(203, 213, 225, 0.8)'
      }
    }
  };

  if (activeTab === 'dual') {
    scalesConfig.yHum = {
      type: 'linear',
      position: 'right',
      min: 20,
      max: 100,
      ticks: {
        color: '#2563eb',
        stepSize: 10,
        font: { family: 'Outfit', size: 12, weight: '700' },
        callback: (v) => `${v}%`
      },
      title: {
        display: true,
        text: 'Humidity (%)',
        color: '#2563eb',
        font: { family: 'Outfit', size: 12, weight: '700' }
      },
      grid: {
        drawOnChartArea: false,
        borderColor: 'rgba(203, 213, 225, 0.8)'
      }
    };
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(203, 213, 225, 0.4)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleColor: '#ffffff',
        bodyColor: '#f8fafc',
        titleFont: { family: 'Outfit', size: 12, weight: '700' },
        bodyFont: { family: 'Outfit', size: 11 }
      }
    },
    scales: scalesConfig
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = 'Label,Temperature_C,Humidity_pct\n';
    const rows = chartDataPoints.map(p => `${p.label},${p.temp},${p.hum}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sensor_Analytics_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* ========================================================================= */}
      {/* MAIN WHITE/LIGHT-GLASS CARD MATCHING USER REFERENCE SCREENSHOT            */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        color: '#1e293b'
      }}>

        {/* ------------------------------------------------------------------------- */}
        {/* TOP BAR: SENSOR TABS (LEFT) & CONTROLS (RIGHT)                            */}
        {/* ------------------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '16px'
        }}>

          {/* Left Group: Sensor View Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            
            {/* 1. Dual Overlay Tab */}
            <button
              onClick={() => setActiveTab('dual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: activeTab === 'dual' ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
                background: activeTab === 'dual' ? '#fef3c7' : '#ffffff',
                color: activeTab === 'dual' ? '#d97706' : '#64748b',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'dual' ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Layers size={15} color={activeTab === 'dual' ? '#d97706' : '#64748b'} />
              Dual Overlay
            </button>

            {/* 2. Temperature Tab */}
            <button
              onClick={() => setActiveTab('temp')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: activeTab === 'temp' ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
                background: activeTab === 'temp' ? '#fef3c7' : '#ffffff',
                color: activeTab === 'temp' ? '#d97706' : '#64748b',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'temp' ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Thermometer size={15} color={activeTab === 'temp' ? '#d97706' : '#64748b'} />
              Temperature
            </button>

            {/* 3. Humidity Tab */}
            <button
              onClick={() => setActiveTab('hum')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '10px',
                border: activeTab === 'hum' ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
                background: activeTab === 'hum' ? '#fef3c7' : '#ffffff',
                color: activeTab === 'hum' ? '#d97706' : '#64748b',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === 'hum' ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Droplets size={15} color={activeTab === 'hum' ? '#d97706' : '#64748b'} />
              Humidity
            </button>
          </div>

          {/* Right Group: Area/Line/Bar + Time Filters + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

            {/* Chart Type Toggle: Area | Line | Bar */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '3px'
            }}>
              {['area', 'line', 'bar'].map((type) => {
                const isActive = chartType === type;
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                return (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#fef3c7' : 'transparent',
                      color: isActive ? '#d97706' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Time Range Selector: 1H | 6H | 24H | 7D | 30D */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '3px'
            }}>
              {['1H', '6H', '24H', '7D', '30D'].map((range) => {
                const isActive = timeRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#fef3c7' : 'transparent',
                      color: isActive ? '#d97706' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {range}
                  </button>
                );
              })}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={14} color="#475569" />
              Export
            </button>

          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* LEGEND ROW (TOP RIGHT INSIDE CARD)                                        */}
        {/* ------------------------------------------------------------------------- */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', padding: '0 8px' }}>
          {(activeTab === 'dual' || activeTab === 'temp') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2.5px solid #d97706',
                background: '#ffffff',
                display: 'inline-block'
              }} />
              Temperature (°C)
            </div>
          )}

          {(activeTab === 'dual' || activeTab === 'hum') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2.5px solid #2563eb',
                background: '#ffffff',
                display: 'inline-block'
              }} />
              Humidity (%)
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* MAIN CHART CANVAS                                                         */}
        {/* ------------------------------------------------------------------------- */}
        <div style={{ position: 'relative', width: '100%', height: '370px' }}>
          {chartType === 'bar' ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

      </div>

    </div>
  );
}
