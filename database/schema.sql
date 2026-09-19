-- ======================================================================================
-- SMART INDIA HACKATHON (SIH) — IOT MULTI-VILLAGE DISASTER MANAGEMENT SYSTEM
-- SQL DATABASE SCHEMA: RAYAGADA DISTRICT DISASTER TELEMETRY & RESCUE DISPATCH
-- ======================================================================================

-- 1. Monitored Village Sectors & Infrastructure Table
CREATE TABLE IF NOT EXISTS villages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT DEFAULT 'Rayagada',
    state TEXT DEFAULT 'Odisha',
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    elevation_m REAL DEFAULT 150.0,
    population INTEGER DEFAULT 1200,
    risk_level TEXT DEFAULT 'NORMAL',
    disaster_type TEXT DEFAULT 'NONE',
    risk_score REAL DEFAULT 0.0,
    rainfall_pct INTEGER DEFAULT 0,
    soil_moisture_pct INTEGER DEFAULT 0,
    smoke_pct INTEGER DEFAULT 0,
    flame_detected INTEGER DEFAULT 0,
    vibration_detected INTEGER DEFAULT 0,
    temperature_c REAL DEFAULT 24.0,
    humidity_pct REAL DEFAULT 75.0,
    hop_count INTEGER DEFAULT 1,
    rssi_dbm INTEGER DEFAULT -70,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Time-Series Sensor Telemetry History Table
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id TEXT NOT NULL,
    risk_score REAL NOT NULL,
    risk_level TEXT NOT NULL,
    disaster_type TEXT NOT NULL,
    rainfall_pct INTEGER NOT NULL,
    soil_moisture_pct INTEGER NOT NULL,
    temperature_c REAL DEFAULT 24.0,
    humidity_pct REAL DEFAULT 85.0,
    vibration_detected INTEGER DEFAULT 0,
    flame_intensity REAL DEFAULT 0.0,
    smoke_pct INTEGER DEFAULT 0,
    hop_count INTEGER DEFAULT 1,
    rssi_dbm INTEGER DEFAULT -70,
    snr REAL DEFAULT 8.0,
    raw_packet TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- 3. Emergency Alerts & Siren Logs
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id TEXT NOT NULL,
    alert_title TEXT NOT NULL,
    alert_description TEXT,
    severity TEXT NOT NULL, -- 'EMERGENCY', 'WARNING', 'ADVISORY'
    risk_score REAL,
    siren_triggered INTEGER DEFAULT 1,
    broadcast_channel TEXT DEFAULT 'LoRa 433MHz + WebSocket',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- 4. Tactical Rescue Squad Dispatch Orders Table
CREATE TABLE IF NOT EXISTS rescue_dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_code TEXT UNIQUE NOT NULL,
    target_village_id TEXT NOT NULL,
    gps_coordinates TEXT NOT NULL,
    unit_assigned TEXT NOT NULL, -- 'ODRAF Unit Alpha', 'NDRF 04 Battalion', etc.
    rescue_assets TEXT NOT NULL, -- 'Inflatable Motor Boats', '4x4 Convoy', 'Air Drop'
    personnel_count INTEGER DEFAULT 12,
    status TEXT DEFAULT 'DEPLOYED', -- 'DEPLOYED', 'EN_ROUTE', 'ON_SCENE', 'COMPLETED'
    notes TEXT,
    dispatched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_village_id) REFERENCES villages(id)
);

-- ======================== INITIAL SEED DATA (Rayagada, Odisha) ========================

INSERT OR REPLACE INTO villages (id, name, district, state, latitude, longitude, elevation_m, population, risk_level, disaster_type, risk_score, rainfall_pct, soil_moisture_pct, smoke_pct, flame_detected, vibration_detected, temperature_c, humidity_pct, hop_count, rssi_dbm)
VALUES 
('V1', 'Village 1: Kashipur Valley', 'Rayagada', 'Odisha', 19.1950, 83.3950, 310.0, 1450, 'EMERGENCY', 'CRITICAL FLASH FLOOD', 88.0, 95, 96, 18, 1, 1, 23.5, 95.0, 1, -64);

INSERT OR REPLACE INTO emergency_alerts (village_id, alert_title, alert_description, severity, risk_score)
VALUES 
('V1', '🚨 CRITICAL FLASH FLOOD AT KASHIPUR VALLEY', 'Nagavali River basin heavy rainfall (95mm/h) & Soil Saturation (96%). All road and cellular networks disconnected. Real-time telemetry via LoRa & WebSocket.', 'EMERGENCY', 88.0);
