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
      <div className="dispatch-modal" style={{
        background: '#ffffff',
        border: '1px solid #c8d5de',
        borderRadius: '14px',
        width: '480px',
        maxWidth: '95vw',
        padding: '24px',
        boxShadow: '0 18px 45px rgba(31, 62, 86, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#fce8e8',
              border: '1px solid #d88989',
              borderRadius: '8px',
              padding: '8px',
              color: '#a63d3d'
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1f2933', margin: 0 }}>
                Mobilize Rescue Dispatch Order
              </h3>
              <p style={{ fontSize: '11px', color: '#607587', margin: '2px 0 0' }}>
                Target Sector: {node.name || `Village ${node.id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#607587',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Telemetry Snapshot */}
        <div style={{
          background: '#f4f7f9',
          border: '1px solid #d5dfe7',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#607587' }}>Live GPS Coordinates:</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#2e6f95' }}>
              {lat}°N, {lng}°E
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#607587' }}>Threat Classification:</span>
            <span style={{ fontWeight: 800, color: '#b33b3b' }}>
              {node.disasterType || 'FLASH FLOOD'} (Threat Score: {Math.round(node.riskScore || 0)}/100)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#607587' }}>Rain / Soil Saturation:</span>
            <span style={{ color: '#1f2933', fontWeight: 700 }}>
              Rain: {rain} | Soil: {soil}
            </span>
          </div>
        </div>

        {/* Deployment Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#607587' }}>
            SELECT RESCUE ASSETS TO MOBILIZE:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => setUnitType('ODRAF_BOATS')}
              className="action-btn"
              style={{
                background: unitType === 'ODRAF_BOATS' ? '#dcecf4' : '#f2f4f6',
                border: `1px solid ${unitType === 'ODRAF_BOATS' ? '#2e6f95' : '#ccd6de'}`,
                borderRadius: '8px',
                padding: '10px',
                color: unitType === 'ODRAF_BOATS' ? '#2e6f95' : '#607587',
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
                background: unitType === 'NDRF_ALL_TERRAIN' ? '#dcecf4' : '#f2f4f6',
                border: `1px solid ${unitType === 'NDRF_ALL_TERRAIN' ? '#2e6f95' : '#ccd6de'}`,
                borderRadius: '8px',
                padding: '10px',
                color: unitType === 'NDRF_ALL_TERRAIN' ? '#2e6f95' : '#607587',
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
              background: '#e8edf1',
              border: '1px solid #d0dbe2',
              color: '#52697a',
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
              background: '#a63d3d',
              border: '1px solid #8f2d2d',
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
              boxShadow: 'none'
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
