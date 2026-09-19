import React, { useState } from 'react';
import {
  Flame,
  Waves,
  Mountain,
  Wind,
  Info,
  BrainCircuit
} from 'lucide-react';

export function RiskAnalysisView({ nodes = {} }) {
  const nodeList = Object.values(nodes);
  const [selectedVillageId, setSelectedVillageId] = useState("NODE_01");
  const selectedNode = nodes[selectedVillageId] || nodeList[0] || {};

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL':
      case 'EMERGENCY':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
      case 'WARNING':
        return '#f59e0b';
      case 'LOW':
      case 'NORMAL':
      default:
        return '#10b981';
    }
  };

  // Factor contributions calculation
  const waterWeight = 35;
  const rainWeight = 30;
  const soilWeight = 20;
  const vibeWeight = 10;
  const smokeWeight = 5;

  const waterContribution = Math.min(waterWeight, Math.round(((selectedNode.waterLevelCm || 0) / 250) * waterWeight));
  const rainContribution = Math.min(rainWeight, Math.round(((selectedNode.rainMm || 0) / 100) * rainWeight));
  const soilContribution = Math.min(soilWeight, Math.round(((selectedNode.soilMoisture || 0) / 100) * soilWeight));
  const vibeContribution = selectedNode.vibration ? vibeWeight : 0;
  const smokeContribution = Math.min(smokeWeight, Math.round(((selectedNode.smokeLevel || 0) / 300) * smokeWeight));

  const totalCalculatedScore = Math.min(100, waterContribution + rainContribution + soilContribution + vibeContribution + smokeContribution);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Banner */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={18} color="#a855f7" />
            AI-Driven Disaster Risk Prediction & Fusion Engine
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            Multi-Sensor Weighted Scoring Algorithm & Slope Instability Prognosis
          </p>
        </div>

        {/* Village Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {nodeList.map(node => (
            <button
              key={node.id}
              onClick={() => setSelectedVillageId(node.id)}
              className="action-btn"
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: selectedVillageId === node.id ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedVillageId === node.id ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: selectedVillageId === node.id ? '#c084fc' : '#cbd5e1',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {node.name.split(':')[0]} ({node.riskLevel})
            </button>
          ))}
        </div>
      </div>

      {/* Verification Notice Disclaimer Box */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Info size={20} color="#38bdf8" />
        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
          <strong style={{ color: '#38bdf8' }}>AI Risk Transparency Notice:</strong> All disaster risk scores and severity categorizations are algorithmically estimated from real-time IoT sensor telemetry streams. These predictions serve as early warnings and decision-support metrics; emergency evacuation protocols require verified validation by the Rayagada District Emergency Operation Center (DEOC).
        </div>
      </div>

      {/* Main Risk Analysis Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Left Column: Weighted Sensor Fusion Breakdown */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
              Sensor Fusion Risk Contributor Weights ({selectedNode.name})
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 800, color: getRiskColor(selectedNode.riskLevel), fontFamily: 'JetBrains Mono' }}>
              Overall Score: {totalCalculatedScore}/100 ({selectedNode.riskLevel})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Factor 1: Water Level */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Ultrasonic Water Inundation (Weight: 35%)</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>
                  {waterContribution} / 35 pts ({selectedNode.waterLevelCm || 0} cm)
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${(waterContribution / 35) * 100}%`, background: '#38bdf8' }} />
              </div>
            </div>

            {/* Factor 2: Rainfall */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#818cf8', fontWeight: 700 }}>Rainfall Precipitation Rate (Weight: 30%)</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>
                  {rainContribution} / 30 pts ({selectedNode.rainMm || 0} mm/h)
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${(rainContribution / 30) * 100}%`, background: '#818cf8' }} />
              </div>
            </div>

            {/* Factor 3: Soil Moisture */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Soil Saturation & Moisture (Weight: 20%)</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>
                  {soilContribution} / 20 pts ({selectedNode.soilMoisture || 0}%)
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${(soilContribution / 20) * 100}%`, background: '#10b981' }} />
              </div>
            </div>

            {/* Factor 4: Seismic Vibration */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Seismic Tremor & Slope Movement (Weight: 10%)</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>
                  {vibeContribution} / 10 pts ({selectedNode.vibration ? 'Active' : 'Clear'})
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${(vibeContribution / 10) * 100}%`, background: '#f59e0b' }} />
              </div>
            </div>

            {/* Factor 5: Smoke / Combustible Gas */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>Combustible Gas & Smoke Concentration (Weight: 5%)</span>
                <span style={{ fontFamily: 'JetBrains Mono', color: '#f8fafc' }}>
                  {smokeContribution} / 5 pts ({selectedNode.smokeLevel || 0} PPM)
                </span>
              </div>
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" style={{ width: `${(smokeContribution / 5) * 100}%`, background: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Disaster Hazard Classification Matrix */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Multi-Hazard Threat Matrix
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Flood Status */}
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Waves size={16} color="#38bdf8" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Flood Threat</span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getRiskColor(selectedNode.risk?.flood || 'LOW') + '25',
                color: getRiskColor(selectedNode.risk?.flood || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.flood || 'LOW')}`
              }}>
                {selectedNode.risk?.flood || 'LOW'}
              </span>
            </div>

            {/* Landslide Status */}
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mountain size={16} color="#f59e0b" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Landslide Threat</span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getRiskColor(selectedNode.risk?.landslide || 'LOW') + '25',
                color: getRiskColor(selectedNode.risk?.landslide || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.landslide || 'LOW')}`
              }}>
                {selectedNode.risk?.landslide || 'LOW'}
              </span>
            </div>

            {/* Wildfire Status */}
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={16} color="#ef4444" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Wildfire & Smoke</span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getRiskColor(selectedNode.risk?.fire || 'LOW') + '25',
                color: getRiskColor(selectedNode.risk?.fire || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.fire || 'LOW')}`
              }}>
                {selectedNode.risk?.fire || 'LOW'}
              </span>
            </div>

            {/* Cyclone Status */}
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wind size={16} color="#a855f7" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>Severe Storm / Cyclone</span>
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                background: getRiskColor(selectedNode.risk?.cyclone || 'LOW') + '25',
                color: getRiskColor(selectedNode.risk?.cyclone || 'LOW'),
                border: `1px solid ${getRiskColor(selectedNode.risk?.cyclone || 'LOW')}`
              }}>
                {selectedNode.risk?.cyclone || 'LOW'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
