import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Layers,
  MapPin,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Volume2,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  Waves,
  ArrowRight,
  Crosshair,
  TrendingUp,
  Flame,
  Wind,
  Droplets,
  Mountain,
  Eye,
  CheckCircle2,
  Calendar,
  Hourglass,
  Activity,
  Check,
  Info,
} from "lucide-react";

// Google Maps High-Resolution Direct Tile Providers
const GOOGLE_MAP_LAYERS = {
  hybrid: {
    name: "Satellite (Hybrid)",
    subName: "Real HD Imagery + Labels",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "Map data &copy;2026 Google Imagery",
    maxZoom: 20,
  },
  roadmap: {
    name: "Google Maps (Roads)",
    subName: "Clean Street & Landmark View",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "Map data &copy;2026 Google",
    maxZoom: 20,
  },
  terrain: {
    name: "Google Terrain",
    subName: "Topographic Mountain Relief",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: "Map data &copy;2026 Google Terrain",
    maxZoom: 20,
  },
};

// Real-World Nagavali River Hydrological Course through Rayagada Corridor (Kashipur ➔ Chandili ➔ Rayagada HQ)
const NAGAVALI_RIVER_CHANNEL = [
  [19.26, 83.325],
  [19.248, 83.332],
  [19.245, 83.338], // Kashipur Sector Runoff
  [19.232, 83.355],
  [19.222, 83.375],
  [19.215, 83.39], // Chandili & Kolnara Corridor
  [19.2, 83.402],
  [19.185, 83.412], // Kumbhikota River Meander
  [19.174, 83.415],
  [19.167, 83.417], // Rayagada Town & DEOC Base Hub
  [19.152, 83.422],
  [19.138, 83.428],
];

// Predictive Inundation Danger Hazard Polygons (Pre-Disaster Impact Zones)
// 1. Primary Inundation Zone (Ground Zero - Kashipur Valley)
const PRIMARY_FLOOD_POLYGON = [
  [19.258, 83.32],
  [19.252, 83.348],
  [19.238, 83.35],
  [19.232, 83.332],
  [19.238, 83.318],
  [19.252, 83.315],
];

// 2. Downstream Wave 1 Projected Inundation Zone (Kolnara Lowbank Corridor)
const DOWNSTREAM_WAVE1_POLYGON = [
  [19.225, 83.375],
  [19.218, 83.402],
  [19.205, 83.41],
  [19.198, 83.39],
  [19.21, 83.372],
];

// 3. Downstream Wave 2 Projected Inundation Zone (Kumbhikota & Rayagada Outskirts)
const DOWNSTREAM_WAVE2_POLYGON = [
  [19.19, 83.402],
  [19.182, 83.422],
  [19.165, 83.425],
  [19.158, 83.41],
  [19.172, 83.4],
];

// High-Ground Safe Evacuation Shelters
const SAFE_SHELTERS = [
  {
    id: "SHELTER_01",
    name: "Village 1 Highland Safe Shelter",
    lat: 19.262,
    lng: 83.342,
    capacity: "850 Persons (V1)",
    elevation: "495m (Highland Ridge)",
    distance: "1.2 km",
    duration: "8 mins walk",
  },
  {
    id: "SHELTER_02",
    name: "Village 2 Kolnara Relief Camp",
    lat: 19.228,
    lng: 83.402,
    capacity: "1,200 Persons (V2)",
    elevation: "620m (Mountain Plateau)",
    distance: "1.8 km",
    duration: "12 mins walk",
  },
  {
    id: "SHELTER_03",
    name: "HeadQuarters Rayagada Relief Base",
    lat: 19.162,
    lng: 83.412,
    capacity: "2,500 Persons (HQ)",
    elevation: "235m (Command Base)",
    distance: "0.8 km",
    duration: "5 mins",
  },
];

export function PreDisasterImpactMap({
  nodes = {},
  alerts = [],
  activeScenario = "normal",
  onSelectNode,
  onOpenDispatch,
  onTriggerSiren,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);

  // Layer Refs
  const riverPolylineRef = useRef(null);
  const v1DisasterCircleRef = useRef(null);
  const primaryFloodPolyRef = useRef(null);
  const wave1FloodPolyRef = useRef(null);
  const wave2FloodPolyRef = useRef(null);
  const markersRef = useRef({});
  const shelterMarkersRef = useRef([]);
  const navigationRouteRef = useRef(null);

  // UI States
  const [activeLayerKey, setActiveLayerKey] = useState("hybrid"); // 'hybrid', 'roadmap', 'terrain'
  const [showInundationPolygons, setShowInundationPolygons] = useState(true);
  const [showSurgePath, setShowSurgePath] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showNavigationRoute, setShowNavigationRoute] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState("V1");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorCoords, setCursorCoords] = useState({
    lat: 19.195,
    lng: 83.39,
    elev: 380,
  });

  // Get Primary Node Data
  const primaryNode =
    nodes["NODE_01"] || nodes["V1"] || Object.values(nodes)[0] || {};
  const rainIntensity = primaryNode.rainMm || primaryNode.rainfall_mm || 0;
  const soilSat = primaryNode.soilMoisture || primaryNode.soil || 0;
  const isVibrating = primaryNode.vibration || false;
  const isFlaming = primaryNode.flameDetected || false;
  const smokeVal = primaryNode.smokeLevel || 0;

  // Compute Pre-Disaster Threat Severity & Impact Duration
  const threatState = useMemo(() => {
    const sc = (activeScenario || "normal").toLowerCase();
    const risk = primaryNode.riskScore || 15;

    let isDisasterImminent = false;
    let disasterType = "BASELINE_MONITORING";
    let title = "Normal Hydrological Stability";
    let surgeSpeedKmh = 0;
    let totalAffectedPop = 0;
    let totalSpreadKm2 = 0;
    let severity = "NORMAL";

    // Impact Duration Details
    let totalDurationHours = 0;
    let peakHoursText = "None";
    let recessionHoursText = "Nominal Flow";
    let shelterDaysText = "0 Days";
    let timelineStages = [
      {
        time: "Current",
        title: "Normal Baseline",
        desc: "All river levels & slopes operating within safe parameters",
        status: "active",
        color: "#10b981",
      },
    ];

    if (sc === "flood" || rainIntensity >= 70 || risk >= 70) {
      isDisasterImminent = true;
      disasterType = "CRITICAL FLASH FLOOD INUNDATION";
      title = "Flash Flood Wave Propagating Downstream";
      surgeSpeedKmh = 24.5;
      totalAffectedPop = 8350;
      totalSpreadKm2 = 14.8;
      severity = "CRITICAL";
      totalDurationHours = 64; // ~2.5 - 3 days
      peakHoursText = "Next 6 to 14 Hours (Extreme Surge Crest)";
      recessionHoursText = "Water Recession in 36 to 48 Hours";
      shelterDaysText = "3 to 5 Days Evacuation Horizon";
      timelineStages = [
        {
          time: "T-0h to T+2h",
          title: "Inundation Ingress",
          desc: "Upstream surge arrives at Kashipur Valley; river breaches 2.85m danger mark",
          status: "active",
          color: "#ef4444",
        },
        {
          time: "T+2h to T+14h",
          title: "Peak Flood Crest",
          desc: "Maximum inundation (14.8 km²), road blockages & low culverts submerged",
          status: "upcoming",
          color: "#f97316",
        },
        {
          time: "T+14h to T+36h",
          title: "Gradual Recession",
          desc: "Floodwaters drain into lower Nagavali channel; water level drops below danger line",
          status: "upcoming",
          color: "#f59e0b",
        },
        {
          time: "T+36h to T+64h",
          title: "Recovery & Repatriation",
          desc: "Debris clearing, sanitation, structural inspections & return to villages",
          status: "upcoming",
          color: "#10b981",
        },
      ];
    } else if (sc === "monsoon" || rainIntensity >= 35 || soilSat >= 75) {
      isDisasterImminent = true;
      disasterType = "HEAVY MONSOON SURGE & WATERLOGGING";
      title = "Heavy Runoff Inundating Low-Bank Corridors";
      surgeSpeedKmh = 14.2;
      totalAffectedPop = 5150;
      totalSpreadKm2 = 8.6;
      severity = "WARNING";
      totalDurationHours = 36;
      peakHoursText = "Next 4 to 8 Hours";
      recessionHoursText = "Recession within 24 Hours";
      shelterDaysText = "1 to 2 Days Advisory";
      timelineStages = [
        {
          time: "T-0h to T+4h",
          title: "Heavy Runoff Ingress",
          desc: "Soil saturation reaches 92%; agricultural bank overflow",
          status: "active",
          color: "#f59e0b",
        },
        {
          time: "T+4h to T+18h",
          title: "Continuous Waterlogging",
          desc: "Low-lying roads waterlogged (0.6m - 1.2m depth)",
          status: "upcoming",
          color: "#f97316",
        },
        {
          time: "T+18h to T+36h",
          title: "Drainage & Clearance",
          desc: "Natural drainage through river network; all pathways cleared",
          status: "upcoming",
          color: "#10b981",
        },
      ];
    } else if (sc === "landslide" || (soilSat >= 85 && isVibrating)) {
      isDisasterImminent = true;
      disasterType = "LANDSLIDE & SLOPE RUNOUT HAZARD";
      title = "Slope Debris Flow Threatening Valley Settlements";
      surgeSpeedKmh = 38.0;
      totalAffectedPop = 4250;
      totalSpreadKm2 = 6.2;
      severity = "CRITICAL";
      totalDurationHours = 72;
      peakHoursText = "Next 2 to 6 Hours (Slope Liquefaction)";
      recessionHoursText = "Slope Stabilization in 48 Hours";
      shelterDaysText = "4 to 6 Days Debris Clearance";
      timelineStages = [
        {
          time: "T-0h to T+3h",
          title: "Slope Shift & Mudflow",
          desc: "Seismic vibration triggers slope failure; debris blocks valley access",
          status: "active",
          color: "#ef4444",
        },
        {
          time: "T+3h to T+24h",
          title: "Secondary Rockfall Risk",
          desc: "Geotechnical monitoring active; perimeter cordoned off",
          status: "upcoming",
          color: "#f97316",
        },
        {
          time: "T+24h to T+72h",
          title: "Heavy Earthmover Clearance",
          desc: "SDRF road clearance & hill slope reinforcement",
          status: "upcoming",
          color: "#10b981",
        },
      ];
    } else if (sc === "cyclone" || (rainIntensity >= 90 && isVibrating)) {
      isDisasterImminent = true;
      disasterType = "SEVERE CYCLONIC STORM INUNDATION";
      title = "High Gale Surge & Flash Inundation Active";
      surgeSpeedKmh = 29.0;
      totalAffectedPop = 8350;
      totalSpreadKm2 = 16.5;
      severity = "CRITICAL";
      totalDurationHours = 48;
      peakHoursText = "Next 8 to 18 Hours (Gale Wind & Storm Surge)";
      recessionHoursText = "Calm Weather Returns in 36 Hours";
      shelterDaysText = "3 Days Cyclone Relief";
      timelineStages = [
        {
          time: "T-0h to T+6h",
          title: "Gale Inundation Front",
          desc: "Squally winds 110km/h + 145mm torrential cloudburst",
          status: "active",
          color: "#ef4444",
        },
        {
          time: "T+6h to T+20h",
          title: "Cyclone Eye Passage",
          desc: "Storm surge inundation across low-lying rural wards",
          status: "upcoming",
          color: "#f97316",
        },
        {
          time: "T+20h to T+48h",
          title: "Post-Storm Restoration",
          desc: "Power grid repair, LoRa telemetry sync & road clearing",
          status: "upcoming",
          color: "#10b981",
        },
      ];
    } else if (sc === "fire" || isFlaming || smokeVal >= 150) {
      isDisasterImminent = true;
      disasterType = "WILDFIRE & TOXIC SMOKE SPREAD";
      title = "Thermal Front & Gas Plume Spreading with Wind";
      surgeSpeedKmh = 18.0;
      totalAffectedPop = 3100;
      totalSpreadKm2 = 5.4;
      severity = "CRITICAL";
      totalDurationHours = 24;
      peakHoursText = "Next 3 to 8 Hours (Wind Driven Spread)";
      recessionHoursText = "Smoke Dissipation in 18 Hours";
      shelterDaysText = "1 to 2 Days Smoke Evacuation";
      timelineStages = [
        {
          time: "T-0h to T+4h",
          title: "Thermal Spread Peak",
          desc: "Smoke 380+ PPM, flame detected in dry canopy",
          status: "active",
          color: "#ef4444",
        },
        {
          time: "T+4h to T+14h",
          title: "Containment Line Creation",
          desc: "Forest department firebreak line established",
          status: "upcoming",
          color: "#f97316",
        },
        {
          time: "T+14h to T+24h",
          title: "Air Quality Normalization",
          desc: "Gas levels drop below 30 PPM; safe to return",
          status: "upcoming",
          color: "#10b981",
        },
      ];
    }

    return {
      isDisasterImminent,
      disasterType,
      title,
      surgeSpeedKmh,
      totalAffectedPop,
      totalSpreadKm2,
      severity,
      totalDurationHours,
      peakHoursText,
      recessionHoursText,
      shelterDaysText,
      timelineStages,
    };
  }, [
    activeScenario,
    primaryNode,
    rainIntensity,
    soilSat,
    isVibrating,
    isFlaming,
    smokeVal,
  ]);

  // Monitored Disaster Places List with Exact Impact Durations
  const disasterPlaces = useMemo(() => {
    const isEmerg = threatState.severity === "CRITICAL";
    const isWarn = threatState.severity === "WARNING";

    return [
      {
        id: "V1",
        nodeId: "NODE_01",
        name: "Village 1 (Disaster Area - Epicenter)",
        shortName: "Village 1 (Disaster Zone)",
        category: "Ground Zero • Disaster Area (Epicenter)",
        lat: 19.245,
        lng: 83.33,
        elevation: "460m MSL (Valley Plain)",
        population: 2850,
        wardsCount: 6,
        threatLevel: isEmerg
          ? "CRITICAL (DISASTER AREA)"
          : isWarn
            ? "HIGH RISK"
            : "NORMAL",
        threatScore: isEmerg ? 96 : isWarn ? 68 : 28,
        pinColor: "#ef4444",
        leadTimeText: isEmerg
          ? "IMMEDIATE (< 10 Mins)"
          : isWarn
            ? "30 Mins Watch"
            : "Nominal Flow",
        leadTimeMinutes: isEmerg ? 8 : isWarn ? 30 : null,

        // Exact Duration for this Place
        impactDurationHours: isEmerg
          ? "48 - 72 Hours (3 Days)"
          : isWarn
            ? "24 - 36 Hours"
            : "0 Hours (Nominal)",
        waterloggingDepth: isEmerg
          ? "2.45 - 2.85 meters"
          : isWarn
            ? "0.8 - 1.2 meters"
            : "0.0 m (Nominal)",
        recessionEta: isEmerg
          ? "Recession begins in ~36 Hours"
          : isWarn
            ? "Recession in 18 Hours"
            : "Continuous Normal Flow",
        shelterStayDays: isEmerg
          ? "3 to 5 Days"
          : isWarn
            ? "1 to 2 Days"
            : "0 Days",

        impactDescription: isEmerg
          ? "Epicenter of torrential surge and flood hazard. Embankments breached, active transparent red disaster zone."
          : "Village 1 catchment basin nominal. Water levels within safe thresholds.",
        safeShelter: "Village 1 Highland Safe Shelter (495m)",
        evacuationRouteDistance: "1.2 km (Ascending Route V1)",
        navigationPath: [
          [19.245, 83.33],
          [19.252, 83.335],
          [19.262, 83.342],
        ],
        sirenStatus: isEmerg ? "ACTIVATED (110dB SIREN)" : "ARMED / STANDBY",
        actionRequired: isEmerg
          ? "Mandatory Immediate Evacuation to Safe Highland Shelter"
          : "Continuous Telemetry Monitoring",
      },
      {
        id: "V2",
        nodeId: "NODE_02",
        name: "Village 2 (Downstream Relay Zone)",
        shortName: "Village 2 (Downstream)",
        category: "Downstream Sector • Warning Corridor",
        lat: 19.215,
        lng: 83.39,
        elevation: "380m Lowbank / 620m Ridge",
        population: 3400,
        wardsCount: 7,
        threatLevel: isEmerg
          ? "HIGH RISK (IMMINENT SURGE)"
          : isWarn
            ? "WARNING"
            : "NORMAL",
        threatScore: isEmerg ? 84 : isWarn ? 54 : 22,
        pinColor: "#f97316",
        leadTimeText: isEmerg
          ? "+42 Mins Early Lead-Time"
          : isWarn
            ? "+55 Mins Lead-Time"
            : "Nominal Flow",
        leadTimeMinutes: isEmerg ? 42 : isWarn ? 55 : null,

        impactDurationHours: isEmerg
          ? "24 - 36 Hours"
          : isWarn
            ? "18 - 24 Hours"
            : "0 Hours (Nominal)",
        waterloggingDepth: isEmerg
          ? "1.20 - 1.65 meters"
          : isWarn
            ? "0.4 - 0.7 meters"
            : "0.0 m",
        recessionEta: isEmerg
          ? "Recession begins in ~24 Hours"
          : isWarn
            ? "Recession in 12 Hours"
            : "Nominal",
        shelterStayDays: isEmerg ? "2 to 3 Days" : isWarn ? "1 Day" : "0 Days",

        impactDescription: isEmerg
          ? "Downstream relay surge advancing along river corridor. Lowland farmlands and pathway culverts at high risk."
          : "River discharge within safe thresholds.",
        safeShelter: "Village 2 Kolnara Relief Camp (620m)",
        evacuationRouteDistance: "1.8 km (Ridge Highway V2)",
        navigationPath: [
          [19.215, 83.39],
          [19.22, 83.395],
          [19.228, 83.402],
        ],
        sirenStatus: isEmerg
          ? "EARLY WARNING SIREN BROADCAST"
          : "ARMED / STANDBY",
        actionRequired: isEmerg
          ? "Pre-emptive Evacuation of Lowland Hamlets"
          : "LoRa Mesh Relay Nominal",
      },
      {
        id: "HQ",
        nodeId: "NODE_04",
        name: "HeadQuarters (Rayagada DEOC Command Base)",
        shortName: "Central HeadQuarters (HQ)",
        category: "District Command Hub & Central Operations Base",
        lat: 19.167,
        lng: 83.417,
        elevation: "235m MSL (Central Command Base)",
        population: 5200,
        wardsCount: 8,
        threatLevel: isEmerg ? "DEOC COMMAND BASE (ACTIVE)" : "NOMINAL BASE",
        threatScore: isEmerg ? 45 : 16,
        pinColor: "#38bdf8",
        leadTimeText: isEmerg
          ? "+95 Mins Advance Lead-Time"
          : "Command Operations Nominal",
        leadTimeMinutes: isEmerg ? 95 : null,

        impactDurationHours: isEmerg ? "12 - 18 Hours (Regulated)" : "0 Hours",
        waterloggingDepth: isEmerg ? "0.35 - 0.60 meters" : "0.0 m",
        recessionEta: isEmerg
          ? "Drainage via sluice gates in 12-18 Hours"
          : "Nominal Flow",
        shelterStayDays: "0 - 1 Day (Standby Base)",

        impactDescription: isEmerg
          ? "Central Command HeadQuarters coordinating NDRF/SDRF rapid response units and regulating barrage sluice gates."
          : "All urban drainage and barrage channels flowing normally.",
        safeShelter: "HeadQuarters Rayagada Relief Base (235m)",
        evacuationRouteDistance: "0.8 km (Command Bypass Road)",
        navigationPath: [
          [19.167, 83.417],
          [19.164, 83.414],
          [19.162, 83.412],
        ],
        sirenStatus: isEmerg ? "DEOC COMMAND ACTIVE" : "NOMINAL",
        actionRequired: isEmerg
          ? "Regulate Barrage Sluice Gates & Deploy Rescue Boats"
          : "Operational Readiness",
      },
    ];
  }, [threatState]);

  // Selected Place Object
  const activePlace =
    disasterPlaces.find((p) => p.id === selectedPlaceId) || disasterPlaces[0];

  // Helper to Switch Google Maps Layers
  const setGoogleMapLayer = (layerKey) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const cfg = GOOGLE_MAP_LAYERS[layerKey];

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
    setActiveLayerKey(layerKey);
  };

  // Helper to Recenter Map on Rayagada Corridor with Perfect Framing
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(
        [
          [19.155, 83.315],
          [19.27, 83.435],
        ],
        { padding: [30, 30], duration: 1.0 },
      );
    }
  };

  // Helper to Zoom
  const handleZoomIn = () =>
    mapInstanceRef.current && mapInstanceRef.current.zoomIn();
  const handleZoomOut = () =>
    mapInstanceRef.current && mapInstanceRef.current.zoomOut();

  // Helper to Search / Filter Places
  const filteredPlaces = disasterPlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });

    // Frame the entire corridor with proper bounds on start
    map.fitBounds(
      [
        [19.155, 83.315],
        [19.27, 83.435],
      ],
      { padding: [30, 30] },
    );

    // Track Cursor for Coordinates Pill
    map.on("mousemove", (e) => {
      const latRatio = (e.latlng.lat - 19.167) / (19.245 - 19.167);
      const estElev = Math.round(
        210 + latRatio * 250 + Math.sin(e.latlng.lng * 10) * 50,
      );
      setCursorCoords({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        elev: Math.max(180, Math.min(estElev, 680)),
      });
    });

    // Default: Google Maps Hybrid (Satellite with Crisp Roads & Labels)
    const baseLayer = L.tileLayer(GOOGLE_MAP_LAYERS.hybrid.url, {
      maxZoom: 20,
      attribution: GOOGLE_MAP_LAYERS.hybrid.attribution,
    }).addTo(map);
    currentTileLayerRef.current = baseLayer;

    // 1. Draw Nagavali River Course Path (Google Water Blue with White Border)
    const riverUnderlay = L.polyline(NAGAVALI_RIVER_CHANNEL, {
      color: "#ffffff",
      weight: 8,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    const river = L.polyline(NAGAVALI_RIVER_CHANNEL, {
      color: "#1a73e8",
      weight: 5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "river-corridor-path",
    }).addTo(map);

    river.bindPopup(`
      <div style="font-family: sans-serif; padding: 4px;">
        <div style="font-size: 13px; font-weight: 700; color: #1a73e8; margin-bottom: 2px;">🌊 Nagavali River Hydrological Drainage Basin</div>
        <div style="font-size: 11px; color: #334155;">Main Drainage: Kashipur Valley ➔ Chandili ➔ Rayagada HQ</div>
      </div>
    `);
    riverPolylineRef.current = river;

    // 2. Safe High-Ground Shelters (Google Style Green Shield Pins)
    SAFE_SHELTERS.forEach((shelter) => {
      const shelterIcon = L.divIcon({
        className: "google-shelter-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: #0f9d58;
              color: #ffffff;
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 10px rgba(0,0,0,0.5);
              border: 2px solid #ffffff;
            ">
              <div style="transform: rotate(45deg); font-size: 13px;">⛺</div>
            </div>
            <div style="
              background: #064e3b;
              color: #a7f3d0;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 6px;
              border-radius: 4px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              white-space: nowrap;
              margin-top: 2px;
              border: 1px solid #10b981;
            ">
              ${shelter.capacity}
            </div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 38],
      });

      const sm = L.marker([shelter.lat, shelter.lng], {
        icon: shelterIcon,
      }).addTo(map).bindPopup(`
          <div style="font-family: sans-serif; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
              <span style="font-size: 16px;">⛺</span>
              <b style="color: #059669; font-size: 13px;">SAFE EVACUATION SHELTER</b>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${shelter.name}</div>
            <div style="font-size: 11px; color: #475569; line-height: 1.4;">
              • <b>Capacity:</b> ${shelter.capacity}<br/>
              • <b>Elevation:</b> ${shelter.elevation}<br/>
              • <b>Estimated Walk:</b> ${shelter.duration} (${shelter.distance})
            </div>
          </div>
        `);
      shelterMarkersRef.current.push(sm);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Map Size Resizing
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isFullscreen]);

  // Update Hazard Inundation Polygons based on Threat State
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const isEmerg = threatState.severity === "CRITICAL";
    const isWarn = threatState.severity === "WARNING";

    // 0. Transparent Red Circle over Village 1 (Disaster Area)
    if (v1DisasterCircleRef.current) {
      map.removeLayer(v1DisasterCircleRef.current);
      v1DisasterCircleRef.current = null;
    }

    // Always render transparent red circle for Village 1 (Disaster Area)
    const v1Circle = L.circle([19.245, 83.33], {
      radius: 2200, // 2.2 km radius around Village 1
      color: "#ef4444",
      weight: 3,
      fillColor: "#ef4444",
      fillOpacity: isEmerg ? 0.32 : 0.22,
      dashArray: "6, 6",
      className: "v1-disaster-circle",
    }).addTo(map);

    v1Circle.bindPopup(`
      <div style="font-family: sans-serif; padding: 6px; min-width: 230px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="font-size: 16px;">🚨</span>
          <b style="color: #ef4444; font-size: 13px;">VILLAGE 1 : DISASTER AREA</b>
        </div>
        <div style="font-size: 11px; color: #1e293b; line-height: 1.4;">
          • <b>Status:</b> Ground Zero • Active Hazard Epicenter<br/>
          • <b>Perimeter:</b> 2.2 km Inundation Radius<br/>
          • <b>Coordinates:</b> 19.2450°N, 83.3300°E<br/>
          • <b>Evacuation:</b> Village 1 Highland Safe Shelter
        </div>
      </div>
    `);
    v1DisasterCircleRef.current = v1Circle;

    // 1. Primary Flood Polygon (Ground Zero)
    if (primaryFloodPolyRef.current) {
      map.removeLayer(primaryFloodPolyRef.current);
      primaryFloodPolyRef.current = null;
    }
    if (showInundationPolygons && (isEmerg || isWarn)) {
      primaryFloodPolyRef.current = L.polygon(PRIMARY_FLOOD_POLYGON, {
        color: "#ef4444",
        weight: 2.5,
        fillColor: "#ef4444",
        fillOpacity: isEmerg ? 0.4 : 0.22,
        dashArray: "6, 6",
      }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="color: #ef4444; font-size: 13px;">⚠️ CRITICAL INUNDATION ZONE (GROUND ZERO)</b><br/>
          <span style="font-size: 11px; color: #334155;">Village 1 Valley Catchment Basin</span><br/>
          <span style="font-size: 10px; color: #ef4444; font-weight: 700;">Submerged Area: ~4.2 km² • Affecting for ~48 to 72 Hours</span>
        </div>
      `);
    }

    // 2. Downstream Wave 1 (Village 2 Corridor)
    if (wave1FloodPolyRef.current) {
      map.removeLayer(wave1FloodPolyRef.current);
      wave1FloodPolyRef.current = null;
    }
    if (showInundationPolygons && isEmerg) {
      wave1FloodPolyRef.current = L.polygon(DOWNSTREAM_WAVE1_POLYGON, {
        color: "#f97316",
        weight: 2.5,
        fillColor: "#f97316",
        fillOpacity: 0.32,
        dashArray: "5, 5",
      }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="color: #ea580c; font-size: 13px;">🌊 DOWNSTREAM WAVE 1 PROJECTED ZONE</b><br/>
          <span style="font-size: 11px; color: #334155;">Village 2 Lowland Warning Corridor</span><br/>
          <span style="font-size: 10px; color: #ea580c; font-weight: 700;">Flood Arrival: +42 Mins • Inundation Duration: ~24 to 36 Hours</span>
        </div>
      `);
    }

    // 3. Downstream Wave 2 (HeadQuarters Reach)
    if (wave2FloodPolyRef.current) {
      map.removeLayer(wave2FloodPolyRef.current);
      wave2FloodPolyRef.current = null;
    }
    if (showInundationPolygons && isEmerg) {
      wave2FloodPolyRef.current = L.polygon(DOWNSTREAM_WAVE2_POLYGON, {
        color: "#38bdf8",
        weight: 2,
        fillColor: "#38bdf8",
        fillOpacity: 0.25,
        dashArray: "4, 4",
      }).addTo(map).bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="color: #0284c7; font-size: 13px;">⚡ DOWNSTREAM WAVE 2 ADVISORY BUFFER</b><br/>
          <span style="font-size: 11px; color: #334155;">HeadQuarters DEOC Base Outskirts</span><br/>
          <span style="font-size: 10px; color: #0284c7; font-weight: 700;">Projected Arrival: +68 to +95 Mins • Impact: 12-18 Hours</span>
        </div>
      `);
    }
  }, [threatState, showInundationPolygons]);

  // Update Location Pin Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up markers that are no longer in disasterPlaces
    const currentPlaceIds = new Set(disasterPlaces.map((p) => p.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentPlaceIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    disasterPlaces.forEach((place) => {
      const isSelected = selectedPlaceId === place.id;
      const isEmerg = place.threatScore >= 70;

      const pinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          ${
            isEmerg
              ? `
            <div style="position: absolute; top: -6px; width: 46px; height: 46px; border-radius: 50%; background: rgba(239, 68, 68, 0.45);" class="sonar-cascade"></div>
          `
              : ""
          }

          <div style="
            background: ${place.pinColor};
            width: ${isSelected ? "38px" : "32px"};
            height: ${isSelected ? "38px" : "32px"};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            border: 2.5px solid #ffffff;
            transition: all 0.2s ease;
            z-index: 2;
          ">
            <div style="transform: rotate(45deg); color: #ffffff; font-size: 12px; font-weight: 900;">
              ${place.id}
            </div>
          </div>

          <!-- Label Pill -->
          <div style="
            background: #0f172a;
            color: #f8fafc;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            white-space: nowrap;
            margin-top: 4px;
            border: 1px solid ${place.pinColor};
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 3;
          ">
            <span>${place.shortName}</span>
            <span style="color: ${place.pinColor}; font-weight: 900;">(${place.threatScore})</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "google-place-pin",
        html: pinHtml,
        iconSize: [46, 54],
        iconAnchor: [23, 44],
      });

      if (!markersRef.current[place.id]) {
        const m = L.marker([place.lat, place.lng], { icon }).addTo(map);
        m.on("click", () => {
          setSelectedPlaceId(place.id);
        });
        m.bindPopup(`
          <div style="font-family: sans-serif; min-width: 270px; padding: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <b style="color: ${place.pinColor}; font-size: 13px;">${place.name}</b>
              <span style="background: ${place.pinColor}; color: #fff; font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: bold;">
                ${place.threatScore}/100 Risk
              </span>
            </div>
            <div style="font-size: 11px; color: #1e293b; margin-bottom: 6px; line-height: 1.4;">
              • <b>Lead-Time:</b> <span style="color: #0284c7; font-weight: bold;">${place.leadTimeText}</span><br/>
              • <b>How Long Disaster Affects:</b> <span style="color: #ef4444; font-weight: bold;">${place.impactDurationHours}</span><br/>
              • <b>Water Depth Peak:</b> ${place.waterloggingDepth}<br/>
              • <b>Population at Risk:</b> ${place.population.toLocaleString()} Residents<br/>
              • <b>Shelter:</b> ${place.safeShelter} (${place.shelterStayDays} stay)
            </div>
            <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; font-size: 10px; color: #475569; margin-bottom: 6px;">
              ${place.impactDescription}
            </div>
          </div>
        `);
        markersRef.current[place.id] = m;
      } else {
        markersRef.current[place.id].setLatLng([place.lat, place.lng]);
        markersRef.current[place.id].setIcon(icon);
      }
    });
  }, [disasterPlaces, selectedPlaceId]);

  // Update Navigation Polyline for Active Place
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (navigationRouteRef.current) {
      map.removeLayer(navigationRouteRef.current);
      navigationRouteRef.current = null;
    }

    if (showNavigationRoute && activePlace && activePlace.navigationPath) {
      const routeLine = L.polyline(activePlace.navigationPath, {
        color: "#38bdf8",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        dashArray: "8, 8",
      }).addTo(map);

      routeLine.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <b style="color: #0284c7;">🚗 Evacuation Navigation Route</b><br/>
          <span style="font-size: 11px; color: #334155;">To: ${activePlace.safeShelter} (${activePlace.evacuationRouteDistance})</span>
        </div>
      `);

      navigationRouteRef.current = routeLine;
    }
  }, [activePlace, showNavigationRoute]);

  // Select Place Card Action
  const handleSelectPlaceCard = (place) => {
    setSelectedPlaceId(place.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 14, {
        duration: 1.0,
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & PREDICTIVE IMPACT SUMMARY (BEFORE DISASTER ARRIVES)       */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          background:
            "linear-gradient(180deg, rgba(16, 28, 48, 0.95) 0%, rgba(10, 18, 32, 0.98) 100%)",
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background:
                  threatState.severity === "CRITICAL"
                    ? "rgba(239, 68, 68, 0.25)"
                    : "rgba(56, 189, 248, 0.25)",
                padding: "8px",
                borderRadius: "10px",
                color:
                  threatState.severity === "CRITICAL" ? "#ef4444" : "#38bdf8",
                border: `1px solid ${threatState.severity === "CRITICAL" ? "#ef4444" : "#38bdf8"}`,
              }}
            >
              <Waves size={22} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#f8fafc",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    margin: 0,
                  }}
                >
                  Pre-Disaster Impact Area & Downstream Inundation Forecast Map
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background:
                      threatState.severity === "CRITICAL"
                        ? "rgba(239, 68, 68, 0.25)"
                        : "rgba(16, 185, 129, 0.25)",
                    color:
                      threatState.severity === "CRITICAL"
                        ? "#fca5a5"
                        : "#34d399",
                    border: `1px solid ${threatState.severity === "CRITICAL" ? "#ef4444" : "#10b981"}`,
                  }}
                >
                  {threatState.severity === "CRITICAL"
                    ? "● CRITICAL INUNDATION SURGE ADVANCING"
                    : "● ALL BASIN SECTORS NOMINAL"}
                </span>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  margin: "3px 0 0",
                }}
              >
                Nagavali River Corridor (Village 1 ➔ Village 2 ➔ HeadQuarters
                Base) • Real-Time Hydrological Surge Lead-Time & Duration
                Modeling
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {threatState.isDisasterImminent && onTriggerSiren && (
              <button
                onClick={onTriggerSiren}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 10px rgba(239, 68, 68, 0.5)",
                }}
              >
                <Volume2 size={14} />
                Broadcast Village Sirens
              </button>
            )}

            <button
              onClick={handleRecenter}
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid #38bdf8",
                color: "#38bdf8",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Crosshair size={13} />
              Recenter Full Corridor
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 CORE PREDICTIVE IMPACT KPIS (BEFORE DISASTER & DURATION)                */}
        {/* ========================================================================= */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "10px",
          }}
        >
          {/* KPI 1: Places in Disaster Path */}
          <div
            className="glass-card"
            style={{ padding: "12px 14px", borderLeft: "4px solid #ef4444" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <span>Places In Disaster Path</span>
              <MapPin
                size={15}
                color={
                  threatState.severity === "CRITICAL" ? "#ef4444" : "#10b981"
                }
              />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color:
                  threatState.severity === "CRITICAL" ? "#f87171" : "#34d399",
                fontFamily: "JetBrains Mono",
                margin: "4px 0",
              }}
            >
              {threatState.severity === "CRITICAL"
                ? "3 Sectors (V1, V2, HQ)"
                : "0 Sectors at Risk"}
            </div>
            <div style={{ fontSize: "10px", color: "#cbd5e1" }}>
              {threatState.severity === "CRITICAL"
                ? "Village 1 (Disaster Zone) & Village 2 at Risk"
                : "All 3 Sectors Operating Nominally"}
            </div>
          </div>

          {/* KPI 2: Earliest Lead Time */}
          <div
            className="glass-card"
            style={{ padding: "12px 14px", borderLeft: "4px solid #38bdf8" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <span>Earliest Warning Lead-Time</span>
              <Clock size={15} color="#38bdf8" />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#38bdf8",
                fontFamily: "JetBrains Mono",
                margin: "4px 0",
              }}
            >
              {threatState.severity === "CRITICAL"
                ? "42 Mins Advance"
                : "Real-Time Telemetry"}
            </div>
            <div style={{ fontSize: "10px", color: "#cbd5e1" }}>
              Surge Velocity: <b>{threatState.surgeSpeedKmh} km/h</b> down river
            </div>
          </div>

          {/* KPI 3: HOW LONG DISASTER WILL AFFECT (NEW REQUESTED FEATURE) */}
          <div
            className="glass-card"
            style={{
              padding: "12px 14px",
              borderLeft: "4px solid #f59e0b",
              background: "rgba(245, 158, 11, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#fbbf24",
                fontWeight: 700,
              }}
            >
              <span>Disaster Impact Duration</span>
              <Hourglass size={15} color="#f59e0b" />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#fbbf24",
                fontFamily: "JetBrains Mono",
                margin: "4px 0",
              }}
            >
              {threatState.severity === "CRITICAL"
                ? `${threatState.totalDurationHours} Hours (~3 Days)`
                : "0 Hours (Nominal)"}
            </div>
            <div style={{ fontSize: "10px", color: "#fde68a" }}>
              <b>Peak Inundation:</b> {threatState.peakHoursText}
            </div>
          </div>

          {/* KPI 4: At-Risk Population & Inundation Spread */}
          <div
            className="glass-card"
            style={{ padding: "12px 14px", borderLeft: "4px solid #a855f7" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#94a3b8",
                fontWeight: 600,
              }}
            >
              <span>At-Risk Population & Spread</span>
              <Users size={15} color="#c084fc" />
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#c084fc",
                fontFamily: "JetBrains Mono",
                margin: "4px 0",
              }}
            >
              {threatState.severity === "CRITICAL"
                ? "6,250 Citizens"
                : "0 Citizens"}
            </div>
            <div style={{ fontSize: "10px", color: "#cbd5e1" }}>
              Spread Footprint: <b>{threatState.totalSpreadKm2} km²</b>{" "}
              Inundation Buffer
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DISASTER TIMELINE & RECOVERY PROGRESSION BAR (HOW LONG IT WILL AFFECT)    */}
        {/* ========================================================================= */}
        {threatState.isDisasterImminent && (
          <div
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Calendar size={13} /> Multi-Stage Disaster Impact & Recession
                Timeline Horizon:
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  fontFamily: "JetBrains Mono",
                }}
              >
                Estimated Recovery Window: ~3 to 5 Days
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
              }}
            >
              {threatState.timelineStages.map((stage, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderLeft: `3px solid ${stage.color}`,
                    borderRadius: "4px",
                    padding: "6px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "10px",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: stage.color }}>
                      {stage.time}
                    </span>
                    <span style={{ color: "#cbd5e1", fontWeight: 700 }}>
                      {stage.title}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#94a3b8",
                      lineHeight: "1.3",
                    }}
                  >
                    {stage.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. GOOGLE MAPS INTERACTIVE CANVAS (FIXED SIZE, HD VIEWPORT & CONTROLS)     */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: "0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Map Container Viewport */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: isFullscreen ? "700px" : "390px",
            overflow: "hidden",
          }}
        >
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%", zIndex: 1 }}
          />

          {/* --- TOP-LEFT: GOOGLE MAPS SEARCH & MODE BUTTONS --- */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              zIndex: 500,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxWidth: "340px",
              width: "calc(100% - 28px)",
            }}
          >
            {/* Google Search Bar */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                boxShadow: "0 3px 12px rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                padding: "6px 14px",
                gap: "8px",
                border: "1px solid #dadce0",
              }}
            >
              <Search size={16} color="#5f6368" />
              <input
                type="text"
                placeholder="Search Village 1, Village 2, HeadQuarters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "12px",
                  color: "#202124",
                  width: "100%",
                  background: "transparent",
                  fontFamily: "sans-serif",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#5f6368",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Google Map Mode Buttons */}
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                overflow: "hidden",
                border: "1px solid #dadce0",
                width: "fit-content",
              }}
            >
              <button
                onClick={() => setGoogleMapLayer("hybrid")}
                style={{
                  background:
                    activeLayerKey === "hybrid" ? "#1a73e8" : "#ffffff",
                  color: activeLayerKey === "hybrid" ? "#ffffff" : "#3c4043",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                }}
              >
                Satellite
              </button>
              <button
                onClick={() => setGoogleMapLayer("roadmap")}
                style={{
                  background:
                    activeLayerKey === "roadmap" ? "#1a73e8" : "#ffffff",
                  color: activeLayerKey === "roadmap" ? "#ffffff" : "#3c4043",
                  border: "none",
                  borderLeft: "1px solid #dadce0",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                }}
              >
                Map (Roads)
              </button>
              <button
                onClick={() => setGoogleMapLayer("terrain")}
                style={{
                  background:
                    activeLayerKey === "terrain" ? "#1a73e8" : "#ffffff",
                  color: activeLayerKey === "terrain" ? "#ffffff" : "#3c4043",
                  border: "none",
                  borderLeft: "1px solid #dadce0",
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                }}
              >
                Terrain
              </button>
            </div>
          </div>

          {/* --- BOTTOM-RIGHT CONTROLS --- */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              right: "14px",
              zIndex: 500,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                background: "#ffffff",
                border: "1px solid #dadce0",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3c4043",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              title="Toggle Map Size"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Recenter Button */}
            <button
              onClick={handleRecenter}
              style={{
                background: "#ffffff",
                border: "1px solid #dadce0",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a73e8",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              title="Recenter Map"
            >
              <Navigation size={16} />
            </button>

            {/* Zoom (+ / -) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #dadce0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <button
                onClick={handleZoomIn}
                style={{
                  background: "#ffffff",
                  border: "none",
                  width: "36px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3c4043",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                +
              </button>
              <div style={{ height: "1px", background: "#e8eaed" }} />
              <button
                onClick={handleZoomOut}
                style={{
                  background: "#ffffff",
                  border: "none",
                  width: "36px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3c4043",
                  fontSize: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                −
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PLACES FACING DISASTER & EXACT DURATION BREAKDOWN                      */}
      {/* ========================================================================= */}
      <div
        className="glass-panel"
        style={{
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          background:
            "linear-gradient(180deg, rgba(16, 28, 48, 0.95) 0%, rgba(10, 18, 32, 0.98) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={17} color="#fbbf24" />
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 900,
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0,
              }}
            >
              Places Facing Disaster • Arrival Lead-Time & Total Impact Duration
            </h3>
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            *Click any sector below to inspect lead-time, flood depth, and
            duration on map
          </span>
        </div>

        {/* 4 Places Cards with High Contrast Typography */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {filteredPlaces.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            return (
              <div
                key={place.id}
                onClick={() => handleSelectPlaceCard(place)}
                style={{
                  background: isSelected
                    ? "rgba(56, 189, 248, 0.15)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: isSelected
                    ? "2px solid #38bdf8"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  borderLeft: `5px solid ${place.pinColor}`,
                  borderRadius: "10px",
                  padding: "14px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected
                    ? "0 4px 18px rgba(56, 189, 248, 0.25)"
                    : "none",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#94a3b8",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {place.category}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 900,
                        color: "#ffffff",
                        marginTop: "2px",
                      }}
                    >
                      {place.name}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 900,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: `${place.pinColor}25`,
                      color: place.pinColor,
                      border: `1px solid ${place.pinColor}`,
                    }}
                  >
                    {place.threatScore}/100 Risk
                  </span>
                </div>

                {/* Lead Time & Duration Strip */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.5)",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                    }}
                  >
                    <span
                      style={{
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Clock size={12} color="#38bdf8" /> Arrival Lead-Time:
                    </span>
                    <span
                      style={{
                        fontWeight: 900,
                        color: place.pinColor,
                        fontFamily: "JetBrains Mono",
                      }}
                    >
                      {place.leadTimeText}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                    }}
                  >
                    <span
                      style={{
                        color: "#fbbf24",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Hourglass size={12} color="#fbbf24" /> Affecting
                      Duration:
                    </span>
                    <span
                      style={{
                        fontWeight: 900,
                        color: "#fbbf24",
                        fontFamily: "JetBrains Mono",
                      }}
                    >
                      {place.impactDurationHours}
                    </span>
                  </div>
                </div>

                {/* Flood Depth & Population */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#cbd5e1",
                  }}
                >
                  <span>
                    <b>Population:</b> {place.population.toLocaleString()} (
                    {place.wardsCount} Wards)
                  </span>
                  <span>
                    <b>Peak Depth:</b>{" "}
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                      {place.waterloggingDepth}
                    </span>
                  </span>
                </div>

                {/* Safe Shelter Destination */}
                <div
                  style={{
                    fontSize: "11px",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <ShieldCheck size={13} color="#34d399" />
                  <span>
                    <b>Assigned Safe Shelter:</b> {place.safeShelter}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SELECTED PLACE ACTION & EVACUATION ROUTE DISPATCH                      */}
      {/* ========================================================================= */}
      {activePlace && (
        <div
          className="glass-panel"
          style={{
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            background:
              "linear-gradient(180deg, rgba(20, 36, 62, 0.98) 0%, rgba(12, 22, 38, 0.98) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                background: "#38bdf8",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0f172a",
                boxShadow: "0 2px 10px rgba(56, 189, 248, 0.5)",
              }}
            >
              <Navigation size={20} />
            </div>
            <div>
              <div
                style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff" }}
              >
                Google Maps Evacuation Corridor:{" "}
                <span style={{ color: "#38bdf8" }}>
                  {activePlace.name} ➔ {activePlace.safeShelter}
                </span>
              </div>
              <div
                style={{ fontSize: "11px", color: "#cbd5e1", marginTop: "2px" }}
              >
                Distance: <b>{activePlace.evacuationRouteDistance}</b> •
                Expected Displacement Horizon:{" "}
                <b>{activePlace.shelterStayDays}</b> • Status:{" "}
                <span style={{ color: "#34d399", fontWeight: 700 }}>
                  HIGH-GROUND ASCENT CLEAR
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {onOpenDispatch && (
              <button
                onClick={() =>
                  onOpenDispatch({
                    id: activePlace.nodeId || "NODE_01",
                    name: activePlace.name,
                    latitude: activePlace.lat,
                    longitude: activePlace.lng,
                  })
                }
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 10px rgba(239, 68, 68, 0.4)",
                }}
              >
                <Navigation size={13} /> Dispatch NDRF / SDRF Team
              </button>
            )}

            {onSelectNode && (
              <button
                onClick={() =>
                  onSelectNode(
                    nodes[activePlace.nodeId] ||
                      nodes["NODE_01"] || {
                        id: activePlace.nodeId,
                        name: activePlace.name,
                      },
                  )
                }
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Eye size={13} /> View Live ESP32 Hardware Telemetry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
