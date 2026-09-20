import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  Radio,
  CloudRain,
  Mountain,
  Globe,
  Play,
  Waves
} from 'lucide-react';

// Tile Provider Configurations (100% Free, Zero API Key Required, Zero Watermark)
const TILE_LAYERS = {
  satellite: {
    name: 'Google Satellite (Hybrid)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: 'Map data &copy;2026 Google Imagery',
    maxZoom: 20,
    hasOverlay: false
  },
  roadmap: {
    name: 'Google Maps (Roads)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: 'Map data &copy;2026 Google',
    maxZoom: 20,
    hasOverlay: false
  },
  topo: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: 'Map data &copy;2026 Google Terrain',
    maxZoom: 20,
    hasOverlay: false
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    hasOverlay: false
  }
};

const SATELLITE_LABELS_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

// Rayagada Sectors (Village 1 Live Hardware Node ➔ District Command HQ)
const RAYAGADA_SECTORS = [
  { name: 'Village 1: Kashipur Valley (Live ESP32 Hardware Node)', lat: 19.1950, lng: 83.3950, zoom: 14 },
  { name: 'District Headquarter: Rayagada DEOC Base Hub', lat: 19.1670, lng: 83.4160, zoom: 15 }
];

// Nagavali River Winding Course Path Coordinates (Realistic Hydrological Waterway)
const NAGAVALI_RIVER_COORDS = [
  [19.2600, 83.3150],
  [19.2480, 83.3250],
  [19.2400, 83.3300], // Kashipur V1
  [19.2310, 83.3420],
  [19.2180, 83.3580],
  [19.2050, 83.3780],
  [19.1950, 83.3950], // Kolnara V2
  [19.1820, 83.4050],
  [19.1730, 83.4110],
  [19.1670, 83.4160], // Rayagada HQ
  [19.1550, 83.4220],
  [19.1420, 83.4300]
];

// Kashipur Valley Flood Inundation Polygon (Realistic Water Spread Zone)
const FLOOD_INUNDATION_POLYGON = [
  [19.2520, 83.3220],
  [19.2480, 83.3380],
  [19.2380, 83.3420],
  [19.2320, 83.3350],
  [19.2340, 83.3200],
  [19.2440, 83.3160]
];

// Weather / Precipitation Storm Cell Polygon over Kashipur Range
const STORM_RADAR_POLYGON = [
  [19.2650, 83.3050],
  [19.2580, 83.3550],
  [19.2250, 83.3600],
  [19.2150, 83.3100]
];

// Safe High-Ground Evacuation Shelters
const SAFE_SHELTERS = [
  {
    name: 'Kashipur Highland Safe Evacuation Shelter',
    lat: 19.2530,
    lng: 83.3420,
    capacity: '850 Persons',
    elevation: '495m (Highland Zone)'
  },
  {
    name: 'Kolnara High School Relief Camp',
    lat: 19.2010,
    lng: 83.4020,
    capacity: '1,200 Persons',
    elevation: '620m (Mountain Ridge)'
  }
];

export function DisasterMap({ nodes, dispatches: _dispatches = [], language = 'en', onOpenDispatch: _onOpenDispatch, onSelectNode }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const labelOverlayLayerRef = useRef(null);

  useEffect(() => {
    window.__onSelectVillageNode = (nodeId) => {
      if (onSelectNode && nodes[nodeId]) {
        onSelectNode(nodes[nodeId]);
      }
    };
    return () => {
      delete window.__onSelectVillageNode;
    };
  }, [nodes, onSelectNode]);

  // Layer Group Refs
  const markersRef = useRef({});
  const shelterMarkersRef = useRef([]);
  const hopPolylineRef = useRef(null);
  const riverPolylineRef = useRef(null);
  const floodPolygonRef = useRef(null);
  const stormPolygonRef = useRef(null);
  const rfCirclesRef = useRef([]);
  const rescuePolylineRef = useRef(null);
  const rescueMarkerRef = useRef(null);

  // States
  const [activeLayer, setActiveLayer] = useState('satellite');
  const [selectedSector, setSelectedSector] = useState(0);

  // Tactical HUD Layer Toggles
  const [showFloodZone, setShowFloodZone] = useState(true);
  const [showRFCoverage, setShowRFCoverage] = useState(true);
  const [showStormRadar, setShowStormRadar] = useState(true);
  const [showElevationProfile, setShowElevationProfile] = useState(true);
  const [cursorCoords, setCursorCoords] = useState({ lat: 19.2000, lng: 83.3750, elev: 480 });

  const isHindi = language === 'hi';

  // Switch Tile Layer Helper
  const applyTileLayer = (layerKey) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const cfg = TILE_LAYERS[layerKey];

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }
    if (labelOverlayLayerRef.current) {
      map.removeLayer(labelOverlayLayerRef.current);
      labelOverlayLayerRef.current = null;
    }

    const newBaseLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution
    }).addTo(map);
    currentTileLayerRef.current = newBaseLayer;

    if (cfg.hasOverlay) {
      const labelsLayer = L.tileLayer(SATELLITE_LABELS_URL, {
        maxZoom: cfg.maxZoom,
        opacity: 0.95
      }).addTo(map);
      labelOverlayLayerRef.current = labelsLayer;
    }

    setActiveLayer(layerKey);
  };

  // Run Step-by-Step Mesh Lifecycle Animation
  const runMeshLifecycleDemo = () => {
    setSimulationStep(1);
    const map = mapInstanceRef.current;
    if (!map) return;

    // Step 1: Focus on V1 Disaster
    map.flyTo([19.2400, 83.3300], 14, { duration: 1.2 });

    // Step 2: LoRa Hop 1 (V1 -> V2) after 2.5 seconds
    setTimeout(() => {
      setSimulationStep(2);
      map.flyTo([19.1950, 83.3950], 13.5, { duration: 1.2 });
    }, 2800);

    // Step 3: LoRa Hop 2 (V2 -> HQ) after 5.5 seconds
    setTimeout(() => {
      setSimulationStep(3);
      map.flyTo([19.1670, 83.4160], 13.5, { duration: 1.2 });
    }, 5600);

    // Step 4: Rescue Dispatched (HQ -> V1) after 8.5 seconds
    setTimeout(() => {
      setSimulationStep(4);
      map.flyTo([19.2000, 83.3750], 12, { duration: 1.4 });
    }, 8500);

    setTimeout(() => {
      setSimulationStep(0);
    }, 15000);
  };

  // Jump to Sector
  const handleSectorChange = (index) => {
    setSelectedSector(index);
    const spot = RAYAGADA_SECTORS[index];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lng], spot.zoom, { duration: 1.2 });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([19.2000, 83.3750], 12);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Track cursor position for Tactical HUD
      map.on('mousemove', (e) => {
        // Approximate elevation based on lat/lng in Rayagada corridor (210m - 680m)
        const latRatio = (e.latlng.lat - 19.1670) / (19.2400 - 19.1670);
        const estElev = Math.round(210 + (latRatio * 280) + Math.sin(e.latlng.lng * 10) * 80);
        setCursorCoords({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          elev: Math.max(180, Math.min(estElev, 720))
        });
      });

      // Default Base Layer
      const baseLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
        maxZoom: 19,
        attribution: TILE_LAYERS.satellite.attribution
      }).addTo(map);
      currentTileLayerRef.current = baseLayer;

      // Labels Overlay
      const labelsLayer = L.tileLayer(SATELLITE_LABELS_URL, {
        maxZoom: 19,
        opacity: 0.95
      }).addTo(map);
      labelOverlayLayerRef.current = labelsLayer;

      // 1. Draw Nagavali River Course Path
      const riverLine = L.polyline(NAGAVALI_RIVER_COORDS, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.75,
        lineCap: 'round',
        smoothFactor: 1.5
      }).addTo(map);
      riverLine.bindPopup('<b style="color:#0284c7;">Nagavali River Basin</b><br/>Major flash flood drainage corridor in Rayagada');
      riverPolylineRef.current = riverLine;

      // 2. Draw Flood Inundation Hazard Polygon
      const floodPoly = L.polygon(FLOOD_INUNDATION_POLYGON, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#38bdf8',
        fillOpacity: 0.35,
        dashArray: '6, 6',
        className: 'flood-inundation-active'
      }).addTo(map);
      floodPoly.bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <b style="color:#ef4444; font-size:13px;">CRITICAL FLOOD INUNDATION ZONE</b><br/>
          <span style="font-size:11px; color:#334155;">Kashipur River Lowland Valley</span><br/>
          <span style="font-size:10px; color:#ef4444; font-weight:bold;">Submerged Area: ~4.2 km² • Flood Depth: 2.25m</span>
        </div>
      `);
      floodPolygonRef.current = floodPoly;

      // 3. Draw Weather Storm Doppler Radar Overlay
      const stormPoly = L.polygon(STORM_RADAR_POLYGON, {
        color: '#818cf8',
        weight: 1.5,
        fillColor: '#818cf8',
        fillOpacity: 0.2,
        dashArray: '4, 4'
      }).addTo(map);
      stormPoly.bindPopup('<b style="color:#818cf8;">Doppler Precipitation Radar</b><br/>Active Cloudburst Cell (>95mm/hr rain rate)');
      stormPolygonRef.current = stormPoly;

      // 4. District HQ Marker
      const hqIcon = L.divIcon({
        className: 'custom-hq-marker',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center; width:44px; height:44px;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; border:2px solid #38bdf8; background:rgba(56,189,248,0.2);" class="sonar-cascade"></div>
            <div style="
              background: linear-gradient(135deg, #0284c7, #0369a1);
              color: #fff;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2.5px solid #fff;
              box-shadow: 0 0 20px rgba(2, 132, 199, 0.95);
              font-size: 12px;
              font-weight: 800;
              z-index: 2;
            ">
              HQ
            </div>
            <div style="position:absolute; top:-16px; background:rgba(15,23,42,0.9); border:1px solid #38bdf8; color:#38bdf8; font-size:9px; font-weight:800; padding:1px 5px; border-radius:4px; white-space:nowrap; font-family:monospace;">
              RAYAGADA DEOC (210m)
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      L.marker([19.1670, 83.4160], { icon: hqIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; padding:4px;">
            <b style="color:#0284c7; font-size:13px;">DISTRICT HEADQUARTERS (RAYAGADA DEOC)</b><br/>
            <span style="font-size:11px; color:#334155;">Collectorate Command Hub, Rayagada (Odisha)</span><br/>
            <span style="font-size:10px; color:#64748b; font-family:monospace;">Receives relayed LoRa packet from V2 ➔ Dispatches Rescue to V1</span>
          </div>
        `);

      // 5. Safe Evacuation Shelters
      SAFE_SHELTERS.forEach(shelter => {
        const shelterIcon = L.divIcon({
          className: 'custom-shelter-marker',
          html: `
            <div style="
              background: #10b981;
              color: #fff;
              width: 32px;
              height: 32px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #fff;
              box-shadow: 0 0 14px rgba(16, 185, 129, 0.9);
              font-size: 15px;
            ">
              ⛺
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const sm = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif; padding:4px;">
              <b style="color:#10b981; font-size:12px;">HIGH GROUND EVACUATION SHELTER</b><br/>
              <span style="font-size:11px; color:#334155;">${shelter.name}</span><br/>
              <span style="font-size:10px; color:#64748b;">Capacity: ${shelter.capacity} • Elevation: ${shelter.elevation}</span>
            </div>
          `);
        shelterMarkersRef.current.push(sm);
      });

      // 6. Draw LoRa 12km Wireless RF Coverage Circles
      const circleV1 = L.circle([19.2400, 83.3300], {
        radius: 7500,
        color: '#ef4444',
        weight: 1,
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        dashArray: '3, 6'
      }).addTo(map);

      const circleV2 = L.circle([19.1950, 83.3950], {
        radius: 9500,
        color: '#10b981',
        weight: 1,
        fillColor: '#10b981',
        fillOpacity: 0.08,
        dashArray: '3, 6'
      }).addTo(map);

      const circleHQ = L.circle([19.1670, 83.4160], {
        radius: 6000,
        color: '#0284c7',
        weight: 1,
        fillColor: '#0284c7',
        fillOpacity: 0.08,
        dashArray: '3, 6'
      }).addTo(map);

      rfCirclesRef.current = [circleV1, circleV2, circleHQ];

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const nodeList = Object.values(nodes);

    // Update Node Markers with Tactical Military / GIS Reticles
    nodeList.forEach(node => {
      const isEmerg = node.riskLevel === 'EMERGENCY' || node.riskScore >= 70;
      const isWarn = node.riskLevel === 'WARNING' || (node.riskScore >= 40 && node.riskScore < 70);
      const color = isEmerg ? '#ef4444' : (isWarn ? '#f59e0b' : '#10b981');
      const auraColor = isEmerg ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.25)';

      const isV1 = node.id === 'V1';
      const nodeElev = isV1 ? '460m Valley' : '680m Ridge';

      const markerHtml = `
        <div style="position:relative; display:flex; align-items:center; justify-content:center; width:48px; height:48px;">
          ${isEmerg ? `
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${auraColor};" class="sonar-cascade"></div>
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${auraColor};" class="sonar-cascade-delay"></div>
          ` : ''}

          <div style="
            background: ${color};
            color: #fff;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2.5px solid #fff;
            box-shadow: 0 0 20px ${color};
            font-size: 13px;
            font-weight: 900;
            z-index: 2;
          ">
            ${node.id}
          </div>

          <!-- Tactical HUD Tag -->
          <div style="
            position: absolute;
            top: -20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid ${color};
            color: ${color};
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 4px;
            white-space: nowrap;
            font-family: 'JetBrains Mono', monospace;
            box-shadow: 0 2px 8px rgba(0,0,0,0.8);
            z-index: 3;
          ">
            ${node.id}: ${nodeElev} ${isEmerg ? '• HIGH RISK' : '• NOMINAL'}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-tactical-village-icon',
        html: markerHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      if (!markersRef.current[node.id]) {
        const marker = L.marker([node.latitude, node.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:240px; padding:6px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <b style="color:${color}; font-size:13px;">${node.name || ('Village ' + node.id)}</b>
              <span style="background:${color}; color:#fff; font-size:10px; padding:2px 7px; border-radius:8px; font-weight:bold;">${Math.round(node.riskScore)}/100</span>
            </div>
            <div style="font-size:11px; color:#1e293b; margin-bottom:6px; line-height:1.4;">
              <b>Sector:</b> ${node.district || 'Rayagada District'}<br/>
              <b>Disaster Threat:</b> <span style="color:${color};font-weight:bold;">${node.disasterType || 'Normal'}</span><br/>
              <b>Rainfall:</b> ${node.rainMm || 0} mm/h | <b>Soil:</b> ${node.soilMoisture || 0}%<br/>
              <b>Smoke/Gas:</b> ${node.smokeLevel || 0} PPM | <b>Flame:</b> ${node.flameDetected ? 'YES' : 'NO'}<br/>
              <b>Vibration:</b> ${node.vibration ? 'MOTION DETECTED' : 'NORMAL'} | <b>Climate:</b> ${node.temp || 24.5}°C / ${node.humidity || 75}%
            </div>
            <div style="font-size:10px; color:#64748b; font-family:monospace; background:#f1f5f9; padding:3px 6px; border-radius:4px; margin-bottom:8px;">
              GPS: ${node.latitude.toFixed(4)}°N, ${node.longitude.toFixed(4)}°E • RSSI: ${node.rssi || -65}dBm
            </div>
            <button
              onclick="window.__onSelectVillageNode && window.__onSelectVillageNode('${node.id}')"
              style="width:100%; background:#0f172a; color:#ffffff; border:none; padding:7px 10px; border-radius:6px; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;"
            >
              View Detailed Status & Sensors
            </button>
          </div>
        `);
        markersRef.current[node.id] = marker;
      } else {
        markersRef.current[node.id].setLatLng([node.latitude, node.longitude]);
        markersRef.current[node.id].setIcon(customIcon);
      }
    });

    // Draw Animated Direct Telemetry Link (Node 1 ➔ District HQ)
    const node1 = nodes['NODE_01'] || nodes['V1'] || Object.values(nodes)[0];
    if (node1) {
      const hopPath = [
        [node1.latitude, node1.longitude], // Start: Village 1 (Kashipur Live Node)
        [19.1670, 83.4160]                  // Destination: District Headquarter (Rayagada DEOC)
      ];

      if (!hopPolylineRef.current) {
        hopPolylineRef.current = L.polyline(hopPath, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.95,
          className: 'leaflet-polyline-packet'
        }).addTo(map);
      } else {
        hopPolylineRef.current.setLatLngs(hopPath);
      }
    }

    // Draw Rescue Dispatched Path (HQ -> V1 via River Corridor)
    if (dispatches.length > 0 && nodes['V1']) {
      const rescuePath = [
        [19.1670, 83.4160], // HQ Rayagada
        [19.1950, 83.3950], // Kolnara
        [19.2250, 83.3500], // River Waypoint
        [nodes['V1'].latitude, nodes['V1'].longitude] // Target Village 1
      ];

      if (!rescuePolylineRef.current) {
        rescuePolylineRef.current = L.polyline(rescuePath, {
          color: '#f43f5e',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.9
        }).addTo(map);
      } else {
        rescuePolylineRef.current.setLatLngs(rescuePath);
      }

      // Moving Rescue Boat Marker
      const rescueIcon = L.divIcon({
        className: 'custom-rescue-boat-icon',
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center; width:34px; height:34px;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(239,68,68,0.4);" class="pulse-circle"></div>
            <div style="
              background: #ef4444;
              color: #fff;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #fff;
              box-shadow: 0 0 16px #ef4444;
              font-size: 13px;
              z-index: 2;
            ">
              Rescue Boat
            </div>
            <div style="position:absolute; top:-16px; background:rgba(239,68,68,0.9); color:#fff; font-size:8px; font-weight:800; padding:1px 4px; border-radius:3px; white-space:nowrap;">
              NDRF BOAT EN ROUTE
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (!rescueMarkerRef.current) {
        rescueMarkerRef.current = L.marker([19.2150, 83.3650], { icon: rescueIcon })
          .addTo(map)
          .bindPopup('<b style="color:#ef4444;">NDRF Inflatable Rescue Boat</b><br/>En route to Village 1 via Nagavali water corridor');
      }
    }

  }, [nodes]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (floodPolygonRef.current) {
      if (showFloodZone) floodPolygonRef.current.setStyle({ opacity: 1, fillOpacity: 0.35 });
      else floodPolygonRef.current.setStyle({ opacity: 0, fillOpacity: 0 });
    }
    if (stormPolygonRef.current) {
      if (showStormRadar) stormPolygonRef.current.setStyle({ opacity: 1, fillOpacity: 0.2 });
      else stormPolygonRef.current.setStyle({ opacity: 0, fillOpacity: 0 });
    }
    rfCirclesRef.current.forEach(circle => {
      if (showRFCoverage) circle.setStyle({ opacity: 1, fillOpacity: 0.08 });
      else circle.setStyle({ opacity: 0, fillOpacity: 0 });
    });
  }, [showFloodZone, showStormRadar, showRFCoverage]);

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Map Header & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(2, 132, 199, 0.25))',
            padding: '6px',
            borderRadius: '8px',
            color: 'var(--accent)'
          }}>
            <Globe size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isHindi ? 'रायगड़ा सामरिक राहत एवं मल्टी-हॉप मेश मैप' : 'Rayagada Tactical Disaster GIS & LoRa Mesh Map'}
              <span style={{ fontSize: '10px', background: 'rgba(56,189,248,0.2)', color: 'var(--accent)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                HD SATELLITE + HYDROLOGY
              </span>
            </h2>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {isHindi ? 'नागावली नदी बेसिन • लाइव जलप्रवाह एवं पहाड़ी रिले टोपोग्राफी' : 'Nagavali River Basin • Live LoRa 433MHz Mesh Corridor (V1 ➔ V2 Relay ➔ DEOC Base)'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

          {/* Animated Mesh Demo Button */}
          <button
            onClick={runMeshLifecycleDemo}
            className="action-btn"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1))',
              border: '1px solid var(--emergency)',
              color: '#ff8787',
              fontSize: '11px',
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 8px var(--emergency-glow)'
            }}
          >
            <Play size={13} fill="currentColor" />
            {isHindi ? 'लाइव सिमुलेशन चलाएं' : 'Play Live Presentation Demo'}
          </button>

          {/* Sector Selector */}
          <select
            value={selectedSector}
            onChange={(e) => handleSectorChange(Number(e.target.value))}
            style={{
              background: '#1f2b40',
              border: '1px solid #71869a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {RAYAGADA_SECTORS.map((spot, i) => (
              <option key={spot.name} value={i}>{spot.name}</option>
            ))}
          </select>

          {/* Map Layer Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '2px'
          }}>
            <button
              onClick={() => applyTileLayer('satellite')}
              style={{
                background: activeLayer === 'satellite' ? 'var(--accent)' : 'transparent',
                color: activeLayer === 'satellite' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Satellite
            </button>
            <button
              onClick={() => applyTileLayer('topo')}
              style={{
                background: activeLayer === 'topo' ? 'var(--accent)' : 'transparent',
                color: activeLayer === 'topo' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Topo Contours
            </button>
            <button
              onClick={() => applyTileLayer('osm')}
              style={{
                background: activeLayer === 'osm' ? 'var(--accent)' : 'transparent',
                color: activeLayer === 'osm' ? '#000' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Streets
            </button>
          </div>

        </div>
      </div>

      {/* Tactical Layer Quick Toggles Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px'
      }}>
        <span style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
          {isHindi ? 'सामरिक मैप लेयर्स:' : 'Tactical GIS Overlays:'}
        </span>

        {/* Toggle 1: Flood Inundation */}
        <button
          onClick={() => setShowFloodZone(!showFloodZone)}
          style={{
            background: showFloodZone ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showFloodZone ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
            color: showFloodZone ? 'var(--accent)' : 'var(--text-dim)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Waves size={12} />
          {isHindi ? 'बाढ़ फैलाव क्षेत्र' : 'Flood Inundation Zone'}
        </button>

        {/* Toggle 2: RF Coverage Range */}
        <button
          onClick={() => setShowRFCoverage(!showRFCoverage)}
          style={{
            background: showRFCoverage ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showRFCoverage ? 'var(--purple)' : 'rgba(255,255,255,0.1)'}`,
            color: showRFCoverage ? 'var(--purple)' : 'var(--text-dim)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Radio size={12} />
          {isHindi ? '12km लोरा रेडियो रेंज' : '12km LoRa RF Range'}
        </button>

        {/* Toggle 3: Weather Radar */}
        <button
          onClick={() => setShowStormRadar(!showStormRadar)}
          style={{
            background: showStormRadar ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showStormRadar ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
            color: showStormRadar ? '#818cf8' : 'var(--text-dim)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <CloudRain size={12} />
          {isHindi ? 'वर्षा डॉप्लर रडार' : 'Storm Doppler Radar'}
        </button>

        {/* Toggle 4: Elevation Profile */}
        <button
          onClick={() => setShowElevationProfile(!showElevationProfile)}
          style={{
            background: showElevationProfile ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showElevationProfile ? 'var(--normal)' : 'rgba(255,255,255,0.1)'}`,
            color: showElevationProfile ? 'var(--normal)' : 'var(--text-dim)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Mountain size={12} />
          {isHindi ? 'पहाड़ी एलिवेशन प्रोफाइल' : 'Cross-Section Terrain Profile'}
        </button>
      </div>

      {/* Map Canvas Container with Tactical HUD Reticle */}
      <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '420px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7)'
          }}
        />

        {/* Top-Right Tactical Compass & Scale Bar */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(11, 17, 33, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px',
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          zIndex: 600,
          boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '1px' }}>
            ▲ NORTH (000°)
          </div>
          <div style={{ width: '40px', height: '2px', background: 'var(--accent)', margin: '2px 0' }} />
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            SCALE: ~1:50,000
          </div>
        </div>
      </div>

      {/* Realistic Mountain Elevation Cross-Section Diagram */}
      {showElevationProfile && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mountain size={13} /> {isHindi ? 'पहाड़ी एलिवेशन क्रॉस-सेक्शन (LoRa रिले क्यों आवश्यक है)' : 'Mountain Terrain Cross-Section & Line-of-Sight Profile'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
              Distance: ~22.4 km Corridor
            </span>
          </div>

          {/* Graphical Terrain Representation */}
          <div style={{
            position: 'relative',
            height: '75px',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(4,7,17,0.9) 100%)',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}>
            {/* SVG Elevation Mountain Terrain Curve */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} preserveAspectRatio="none" viewBox="0 0 400 100">
              <defs>
                <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id="rfLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Mountains Profile Path */}
              <path d="M 0,100 L 0,65 Q 60,40 100,55 Q 160,85 200,20 Q 260,75 320,60 Q 360,75 400,80 L 400,100 Z" fill="url(#terrainGrad)" stroke="#475569" strokeWidth="1.5" />

              {/* LoRa Hop 1 Beam (V1 to V2 Ridge) */}
              <line x1="60" y1="50" x2="200" y2="20" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4, 4" />

              {/* LoRa Hop 2 Beam (V2 Ridge to HQ) */}
              <line x1="200" y1="20" x2="380" y2="80" stroke="#10b981" strokeWidth="2" strokeDasharray="4, 4" />

              {/* Blocked Direct Path (Red X showing mountains block direct line to HQ) */}
              <line x1="60" y1="50" x2="380" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="2, 4" opacity="0.3" />
            </svg>

            {/* Point 1: V1 Kashipur Valley */}
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444' }}>V1: Kashipur</div>
              <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>460m (Flood Valley)</div>
            </div>

            {/* Point 2: V2 Kolnara Ridge Relay */}
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>V2: Kolnara Ridge</div>
              <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>680m (Highland Relay)</div>
            </div>

            {/* Point 3: Rayagada HQ */}
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981' }}>HQ: Rayagada DEOC</div>
              <div style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }}>210m (Collectorate Base)</div>
            </div>
          </div>

          <div style={{ fontSize: '9px', color: 'var(--text-dim)', textAlign: 'right' }}>
            <i>Why Relay? Direct signal from V1 to HQ is blocked by a 680m mountain ridge. Village 2 acts as a line-of-sight wireless repeater.</i>
          </div>
        </div>
      )}

      {/* Legend & Key Indicators */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--text-muted)',
        background: 'rgba(0, 0, 0, 0.45)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-sm)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            {isHindi ? 'V1 (काशीपुर घाटी - 460m)' : 'V1: Kashipur (460m Flood Zone)'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            {isHindi ? 'V2 (कोलनारा रिज - 680m)' : 'V2: Kolnara (680m Ridge Relay)'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            {isHindi ? 'HQ (कलेक्ट्रेट बेस - 210m)' : 'HQ: Rayagada DEOC (210m Base)'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '3px', background: '#0284c7' }} />
            {isHindi ? 'नागावली नदी' : 'Nagavali River Channel'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '3px', background: '#ef4444', border: '1px dashed #ef4444' }} />
            {isHindi ? 'बाढ़ फैलाव क्षेत्र' : 'Flood Inundation Polygon'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⛺ {isHindi ? 'सुरक्षित राहत शिविर' : 'Safe High-Ground Shelter'}
          </span>
        </div>

        <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'monospace' }}>
          LoRa: 433MHz • SF10 • CR4/5 • BW125kHz
        </span>
      </div>
    </div>
  );
}
