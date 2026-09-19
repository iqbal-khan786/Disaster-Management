import React, { useState } from 'react';
import {
  LifeBuoy,
  Send,
  Truck,
  Building2,
  Info
} from 'lucide-react';
import { DispatchModal } from '../DispatchModal';

export function RescueOperationsView({
  nodes = {},
  onOpenDispatch
}) {
  const nodeList = Object.values(nodes);
  const criticalNode = nodeList.find(n => n.riskLevel === 'CRITICAL' || n.riskScore >= 75) || nodeList[0] || {};
  
  const [selectedDispatchNode, setSelectedDispatchNode] = useState(null);

  // Response Units Status
  const rescueTeams = [
    {
      id: 'ODRAF-01',
      name: 'ODRAF Team Alpha (Rayagada)',
      type: 'Rapid Flood & Boat Rescue',
      personnel: 16,
      equipment: '4x Inflatable Power Boats, Life Jackets, Satellite Comms',
      status: 'MOBILIZED',
      assignedTarget: criticalNode.name || 'Village 1: Kashipur',
      eta: '18 mins'
    },
    {
      id: 'NDRF-04',
      name: 'NDRF 4th Battalion Unit',
      type: 'Heavy Disaster & Structural Evac',
      personnel: 24,
      equipment: 'All-Terrain Amphibious Vehicles, Drone Recon',
      status: 'STANDBY',
      assignedTarget: 'Rayagada District Base',
      eta: 'On Call'
    },
    {
      id: 'MED-02',
      name: 'District Medical Evacuation Wing',
      type: 'Triage & First-Aid Mobile Hospital',
      personnel: 8,
      equipment: '2x 4x4 Critical Care Ambulances, Trauma Kits',
      status: 'DEPLOYED',
      assignedTarget: 'Kashipur Community Health Center',
      eta: '10 mins'
    },
    {
      id: 'FIRE-01',
      name: 'Rayagada Fire & Rescue Services',
      type: 'Pumping & Water Hazard Clearance',
      personnel: 12,
      equipment: 'High-Capacity De-watering Pumps, Chainsaws',
      status: 'ACTIVE',
      assignedTarget: 'Nagavali River Bridgehead',
      eta: 'On Site'
    }
  ];

  // Evacuation Shelters
  const shelters = [
    {
      name: 'Kashipur Multipurpose Cyclone / Flood Shelter',
      elevation: '340m (Safe High Ridge)',
      capacity: 500,
      occupied: 285,
      power: 'Solar Microgrid Active',
      rations: '72h Emergency Stock'
    },
    {
      name: 'Kolnara High School Evacuation Center',
      elevation: '290m (Plateau)',
      capacity: 350,
      occupied: 40,
      power: 'Diesel Generator Backup',
      rations: '48h Stock'
    },
    {
      name: 'Rayagada District Sports Complex Camp',
      elevation: '210m (Central Base)',
      capacity: 1200,
      occupied: 110,
      power: 'Grid + Solar Hybrid',
      rations: '120h Central Reserve'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LifeBuoy size={18} color="#ef4444" />
            Tactical Rescue Operations & Evacuation Coordination (CAD)
          </h2>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '3px 0 0' }}>
            Multi-Agency Dispatch Console • ODRAF, NDRF, Fire Service & District Medical Evacuation
          </p>
        </div>

        <button
          onClick={() => setSelectedDispatchNode(criticalNode)}
          className="action-btn"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            border: '1px solid #ef4444',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
          }}
        >
          <Send size={13} />
          <span>Deploy Tactical Rescue Unit</span>
        </button>
      </div>

      {/* AI Dispatch Guidance Disclaimer */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Info size={20} color="#ef4444" />
        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
          <strong style={{ color: '#ef4444' }}>AI Dispatch Recommendation Note:</strong> Prioritization rankings and rescue recommendations are algorithmically generated suggestions based on incoming LoRa sensor telemetry. Final tactical routing, boat deployment, and evacuation decisions must be authenticated and directed by field commanders and DEOC officers.
        </div>
      </div>

      {/* Incident Situation & Priority Ranking Box */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
          Live Incident Priority Ranking (Rayagada Operational Grid)
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px'
        }}>
          {nodeList.map(node => (
            <div
              key={node.id}
              className="glass-card"
              style={{
                padding: '14px',
                borderLeft: `4px solid ${node.riskLevel === 'CRITICAL' ? '#ef4444' : node.riskLevel === 'HIGH' ? '#f59e0b' : '#10b981'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>Priority Sector</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', margin: '2px 0' }}>{node.name}</h4>
                </div>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: node.riskLevel === 'CRITICAL' ? '#ef4444' : node.riskLevel === 'HIGH' ? '#f59e0b' : '#10b981',
                  color: '#fff'
                }}>
                  {node.riskLevel}
                </span>
              </div>

              <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Threat Type: <strong style={{ color: '#fca5a5' }}>{node.disasterType}</strong></div>
                <div>Rainfall: <strong>{node.rainMm || 0}mm/h</strong> | Soil: <strong>{node.soilMoisture || 0}%</strong> | Smoke: <strong>{node.smokeLevel || 0}PPM</strong></div>
                <div>Nearest Gateway: <strong>Rayagada Base Hub (Hop {node.hopCount || 1})</strong></div>
              </div>

              <button
                onClick={() => setSelectedDispatchNode(node)}
                className="action-btn"
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Dispatch Rescue Team to Sector
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Response Teams & Evacuation Shelters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Left: Deployed Rescue Units */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Deployed Rescue Battalions & Wings
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rescueTeams.map(team => (
              <div key={team.id} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} color="#38bdf8" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>{team.name}</span>
                    <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                      {team.personnel} Personnel
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Equip: {team.equipment}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>
                    Target: <strong style={{ color: '#38bdf8' }}>{team.assignedTarget}</strong> • ETA: <strong style={{ color: '#34d399' }}>{team.eta}</strong>
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '9px',
                  fontWeight: 800,
                  background: team.status === 'MOBILIZED' ? '#ef4444' : team.status === 'DEPLOYED' ? '#f59e0b' : '#10b981',
                  color: '#fff'
                }}>
                  {team.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Evacuation Shelters */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Designated Evacuation Shelters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {shelters.map((shelter, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} color="#10b981" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>{shelter.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                    {shelter.occupied} / {shelter.capacity} Cap
                  </span>
                </div>

                <div className="gauge-bar-track" style={{ height: '4px', margin: '4px 0' }}>
                  <div className="gauge-bar-fill" style={{ width: `${(shelter.occupied / shelter.capacity) * 100}%`, background: '#10b981' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                  <span>{shelter.elevation}</span>
                  <span>{shelter.power}</span>
                  <span>{shelter.rations}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dispatch Modal Component */}
      <DispatchModal
        node={selectedDispatchNode}
        isOpen={Boolean(selectedDispatchNode)}
        onClose={() => setSelectedDispatchNode(null)}
        onConfirm={(nodeId, coords, details) => {
          if (onOpenDispatch) onOpenDispatch(selectedDispatchNode);
          setSelectedDispatchNode(null);
        }}
      />
    </div>
  );
}
