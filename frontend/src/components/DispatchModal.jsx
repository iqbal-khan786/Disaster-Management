import React, { useState } from 'react';
import { ShieldAlert, X, Truck, Anchor, Send } from 'lucide-react';

export function DispatchModal({ node, isOpen, onClose, onConfirm }) {
  const [unitType, setUnitType] = useState('ODRAF_BOATS');
  const [personnelCount, setPersonnelCount] = useState(16);

  if (!isOpen || !node) return null;

  const lat = typeof node.latitude === 'number' ? node.latitude.toFixed(4) : '19.1950';
  const lng = typeof node.longitude === 'number' ? node.longitude.toFixed(4) : '83.3950';
  const soil = node.soilMoisture !== undefined ? `${node.soilMoisture}%` : (node.soil !== undefined ? `${node.soil}%` : '0%');
  const rain = node.rainMm !== undefined ? `${node.rainMm} mm/h` : (node.rain !== undefined ? `${node.rain}%` : '0 mm/h');

  const handleConfirm = () => {
    onConfirm(node.id, `${lat}°N, ${lng}°E`, {
      unitType,
      personnelCount
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div style={{
        background: '#0d1629',
        border: '1px solid #ef4444',
        borderRadius: '12px',
        width: '480px',
        maxWidth: '95vw',
        padding: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 25px rgba(239, 68, 68, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '8px',
              color: '#ef4444'
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Mobilize Rescue Dispatch Order
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                Target Sector: {node.name || `Village ${node.id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Snapshot */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Live GPS Coordinates:</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#38bdf8' }}>
              {lat}°N, {lng}°E
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Threat Classification:</span>
            <span style={{ fontWeight: 800, color: '#ef4444' }}>
              {node.disasterType || 'FLASH FLOOD'} (Threat Score: {Math.round(node.riskScore || 0)}/100)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Rain / Soil Saturation:</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>
              Rain: {rain} | Soil: {soil}
            </span>
          </div>
        </div>

        {/* Deployment Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
            SELECT RESCUE ASSETS TO MOBILIZE:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setUnitType('ODRAF_BOATS')}
              className="action-btn"
              style={{
                background: unitType === 'ODRAF_BOATS' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${unitType === 'ODRAF_BOATS' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '10px',
                color: unitType === 'ODRAF_BOATS' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Anchor size={16} />
              ODRAF Power Boats + Divers
            </button>

            <button
              onClick={() => setUnitType('NDRF_ALL_TERRAIN')}
              className="action-btn"
              style={{
                background: unitType === 'NDRF_ALL_TERRAIN' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${unitType === 'NDRF_ALL_TERRAIN' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '10px',
                color: unitType === 'NDRF_ALL_TERRAIN' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Truck size={16} />
              NDRF 4x4 Amphibious Unit
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            className="action-btn"
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#94a3b8',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="action-btn"
            style={{
              flex: 2,
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              border: 'none',
              color: '#fff',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Send size={14} />
            CONFIRM & DISPATCH VIA LORA/WS
          </button>
        </div>
      </div>
    </div>
  );
}
