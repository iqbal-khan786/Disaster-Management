import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Activity, Droplets, Mountain, Radio, Thermometer } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function SensorCharts({ history = [] }) {
  const [activeChartTab, setActiveChartTab] = useState('water_rain');

  const labels = history.map(h => h.time);

  // 1. Water Level (cm) & Rainfall (mm)
  const waterRainData = {
    labels,
    datasets: [
      {
        label: 'Water Depth (cm)',
        data: history.map(h => h.waterLevel),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        yAxisID: 'yWater'
      },
      {
        label: 'Rainfall (mm/h)',
        data: history.map(h => h.rain),
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.08)',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.35,
        fill: false,
        yAxisID: 'yRain'
      }
    ]
  };

  // 2. Soil Moisture (%) & Seismic Vibration
  const soilVibrationData = {
    labels,
    datasets: [
      {
        label: 'Soil Moisture (%)',
        data: history.map(h => h.soilMoisture || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        yAxisID: 'ySoil'
      },
      {
        label: 'Seismic Vibration (SW-420 Active 1/0)',
        data: history.map(h => (h.vibration ? 1 : 0)),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderWidth: 2,
        stepped: true,
        yAxisID: 'yVibe'
      }
    ]
  };

  // 3. Temperature (°C) & Humidity (%)
  const tempHumidityData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: history.map(h => h.temp || 24),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderWidth: 2,
        tension: 0.35,
        yAxisID: 'yTemp'
      },
      {
        label: 'Relative Humidity (%)',
        data: history.map(h => h.humidity || 70),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        tension: 0.35,
        yAxisID: 'yHum'
      }
    ]
  };

  // 4. LoRa Signal RSSI (dBm) & Risk Score (0-100)
  const signalRiskData = {
    labels,
    datasets: [
      {
        label: 'AI Disaster Risk Score (0-100)',
        data: history.map(h => h.riskScore || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        yAxisID: 'yRisk'
      },
      {
        label: 'LoRa RSSI (dBm)',
        data: history.map(h => h.rssi || -70),
        borderColor: '#a855f7',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.35,
        yAxisID: 'yRssi'
      }
    ]
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 10, family: 'Outfit' },
          boxWidth: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(13, 22, 41, 0.95)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'Outfit', size: 10 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 9, family: 'JetBrains Mono' }, maxRotation: 0 }
      }
    }
  };

  const waterRainOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      yWater: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#38bdf8', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Water Level (cm)', color: '#38bdf8', font: { size: 9 } }
      },
      yRain: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#818cf8', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Rain (mm/h)', color: '#818cf8', font: { size: 9 } }
      }
    }
  };

  const soilVibrationOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      ySoil: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#10b981', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Soil Moisture (%)', color: '#10b981', font: { size: 9 } }
      },
      yVibe: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 1.5,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b', stepSize: 1, font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Vibration Status (1/0)', color: '#f59e0b', font: { size: 9 } }
      }
    }
  };

  const tempHumidityOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      yTemp: {
        type: 'linear',
        position: 'left',
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#f43f5e', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Temp (°C)', color: '#f43f5e', font: { size: 9 } }
      },
      yHum: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
        ticks: { color: '#06b6d4', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Humidity (%)', color: '#06b6d4', font: { size: 9 } }
      }
    }
  };

  const signalRiskOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      yRisk: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#ef4444', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'Risk Score (0-100)', color: '#ef4444', font: { size: 9 } }
      },
      yRssi: {
        type: 'linear',
        position: 'right',
        min: -120,
        max: -30,
        grid: { drawOnChartArea: false },
        ticks: { color: '#a855f7', font: { size: 9, family: 'JetBrains Mono' } },
        title: { display: true, text: 'LoRa RSSI (dBm)', color: '#a855f7', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Chart Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="#38bdf8" />
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Real-Time Telemetry Trend Streams
          </h3>
          <span style={{ fontSize: '10px', color: '#64748b' }}>({history.length} Live Samples Buffer)</span>
        </div>

        {/* Tab Selectors */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {[
            { id: 'water_rain', label: 'Water & Rain', icon: Droplets },
            { id: 'soil_vibe', label: 'Soil & Seismic', icon: Mountain },
            { id: 'temp_hum', label: 'Temp & Humidity', icon: Thermometer },
            { id: 'risk_signal', label: 'Risk & RSSI', icon: Radio }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeChartTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChartTab(tab.id)}
                className="action-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Icon size={12} color={isSelected ? '#38bdf8' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Chart Container */}
      <div style={{ height: '220px', position: 'relative', width: '100%' }}>
        {activeChartTab === 'water_rain' && <Line data={waterRainData} options={waterRainOptions} />}
        {activeChartTab === 'soil_vibe' && <Line data={soilVibrationData} options={soilVibrationOptions} />}
        {activeChartTab === 'temp_hum' && <Line data={tempHumidityData} options={tempHumidityOptions} />}
        {activeChartTab === 'risk_signal' && <Line data={signalRiskData} options={signalRiskOptions} />}
      </div>
    </div>
  );
}
