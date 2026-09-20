import React, { useState } from "react";
import {
  Settings,
  Server,
  Radio,
  Volume2,
  Sliders,
  CheckCircle2,
  VolumeX,
  Usb,
  Activity,
} from "lucide-react";
import {
  playEmergencySiren,
  playAckChime,
  playTacticalBeep,
  setAudioMuted,
  getAudioMuted,
} from "../../utils/audioSiren";

export function SystemSettingsView({
  serverUrl,
  onConnectWebSocket,
  connectionStatus,
  gatewayStatus,
  isSerialConnected = false,
  serialPortName = "",
  onConnectSerial,
  onDisconnectSerial,
}) {
  const [customWsUrl, setCustomWsUrl] = useState(
    serverUrl || "ws://127.0.0.1:8080/",
  );
  const [loraBand, setLoraBand] = useState("433");
  const [waterThreshold, setWaterThreshold] = useState(150);
  const [rainThreshold, setRainThreshold] = useState(60);
  const [soilThreshold, setSoilThreshold] = useState(80);
  const [smokeThreshold, setSmokeThreshold] = useState(120);
  const [isMuted, setIsMuted] = useState(getAudioMuted());
  const [isSaved, setIsSaved] = useState(false);

  const PRESETS = [
    { label: "Python Gateway Bridge (Local)", url: "ws://127.0.0.1:8080/" },
    { label: "FastAPI Backend (/ws)", url: "ws://127.0.0.1:8000/ws" },
    { label: "ESP32 Base Station AP (WiFi)", url: "ws://192.168.4.1:81/" },
  ];

  const handleSelectPreset = (url) => {
    setCustomWsUrl(url);
    if (onConnectWebSocket) {
      onConnectWebSocket(url);
    }
  };

  const handleSaveSettings = () => {
    setIsSaved(true);
    playAckChime();
    if (customWsUrl !== serverUrl && onConnectWebSocket) {
      onConnectWebSocket(customWsUrl);
    }
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    setAudioMuted(nextMute);
    if (!nextMute) {
      playTacticalBeep(1200, 0.15);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#f8fafc",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Settings size={18} color="#38bdf8" />
            DisasterGuard System Settings & Hardware Parameters
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: "3px 0 0" }}>
            Direct ESP32 USB Serial, WebSocket Backend, LoRa 433MHz RF
            Parameters & Thresholds
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="action-btn"
          style={{
            background: isSaved
              ? "#10b981"
              : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            border: isSaved
              ? "1px solid #10b981"
              : "1px solid rgba(56, 189, 248, 0.4)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 0 15px rgba(56, 189, 248, 0.3)",
          }}
        >
          <CheckCircle2 size={13} />
          <span>
            {isSaved
              ? "Settings Saved & Applied!"
              : "Save System Configuration"}
          </span>
        </button>
      </div>

      {/* Settings Sections Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {/* 1. Direct Web Serial USB Connection */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            border: isSerialConnected
              ? "1px solid rgba(16, 185, 129, 0.5)"
              : "1px solid rgba(56, 189, 248, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Usb
                size={18}
                color={isSerialConnected ? "#34d399" : "#38bdf8"}
              />
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#f8fafc",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  margin: 0,
                }}
              >
                Direct ESP32 USB Serial (Plug & Play)
              </h3>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "4px",
                background: isSerialConnected
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(255, 255, 255, 0.05)",
                color: isSerialConnected ? "#34d399" : "#94a3b8",
                border: isSerialConnected
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              {isSerialConnected ? "ACTIVE" : "READY"}
            </span>
          </div>

          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
            Connect your ESP32 board directly to this browser via USB. Works
            with Chrome & Edge on Windows/Mac/Linux at 115200 Baud.
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={isSerialConnected ? onDisconnectSerial : onConnectSerial}
              className="action-btn"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "6px",
                border: isSerialConnected
                  ? "1px solid #ef4444"
                  : "1px solid #10b981",
                background: isSerialConnected
                  ? "rgba(239, 68, 68, 0.2)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.4) 100%)",
                color: isSerialConnected ? "#fca5a5" : "#6ee7b7",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Usb size={15} />
              <span>
                {isSerialConnected
                  ? "Disconnect ESP32 Serial"
                  : "Select & Connect ESP32 (COM4)"}
              </span>
            </button>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "10px",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Serial Device:</span>
              <strong
                style={{ color: isSerialConnected ? "#34d399" : "#94a3b8" }}
              >
                {serialPortName || "Not Connected"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Baud Rate:</span>
              <strong style={{ color: "#38bdf8" }}>
                115200 (Standard ESP32 UART)
              </strong>
            </div>
          </div>
        </div>

        {/* 2. WebSocket Backend Connection */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={18} color="#38bdf8" />
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0,
              }}
            >
              WebSocket Backend Connection
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", color: "#94a3b8" }}>
              WebSocket URL Endpoint:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={customWsUrl}
                onChange={(e) => setCustomWsUrl(e.target.value)}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: "#f8fafc",
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono",
                  outline: "none",
                }}
              />
              <button
                onClick={() =>
                  onConnectWebSocket && onConnectWebSocket(customWsUrl)
                }
                className="action-btn"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #38bdf8",
                  background: "rgba(56, 189, 248, 0.2)",
                  color: "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Connect
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "10px", color: "#64748b" }}>
              Quick Presets:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {PRESETS.map((p) => (
                <button
                  key={p.url}
                  onClick={() => handleSelectPreset(p.url)}
                  style={{
                    fontSize: "10px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border:
                      customWsUrl === p.url
                        ? "1px solid #38bdf8"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                    background:
                      customWsUrl === p.url
                        ? "rgba(56, 189, 248, 0.2)"
                        : "rgba(255, 255, 255, 0.03)",
                    color: customWsUrl === p.url ? "#38bdf8" : "#cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "10px",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Connection Status:</span>
              <strong
                style={{
                  color:
                    connectionStatus === "CONNECTED" ? "#34d399" : "#f87171",
                }}
              >
                {connectionStatus}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Gateway State:</span>
              <strong
                style={{
                  color: gatewayStatus === "ONLINE" ? "#34d399" : "#f87171",
                }}
              >
                {gatewayStatus}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. LoRa RF Physical Parameters */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={18} color="#a855f7" />
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0,
              }}
            >
              LoRa SX1278 RF Configuration
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", color: "#94a3b8" }}>
              Operating Frequency Band:
            </label>
            <select
              value={loraBand}
              onChange={(e) => setLoraBand(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#f8fafc",
                fontSize: "11px",
                outline: "none",
              }}
            >
              <option value="433">
                433.175 MHz — India / Asia Multi-Hop (Default)
              </option>
              <option value="865">865-867 MHz — India Licensed ISM Band</option>
              <option value="868">868.000 MHz — European Standard</option>
              <option value="915">915.000 MHz — North America Band</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "8px",
                borderRadius: "6px",
              }}
            >
              <span>Spreading Factor:</span>
              <div
                style={{
                  fontWeight: 800,
                  color: "#f8fafc",
                  fontFamily: "JetBrains Mono",
                }}
              >
                SF7 / 128 Chips
              </div>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                padding: "8px",
                borderRadius: "6px",
              }}
            >
              <span>Bandwidth:</span>
              <div
                style={{
                  fontWeight: 800,
                  color: "#f8fafc",
                  fontFamily: "JetBrains Mono",
                }}
              >
                125 kHz
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sensor Danger Thresholds */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={18} color="#f59e0b" />
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0,
              }}
            >
              Disaster Risk Alert Thresholds
            </h3>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "11px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>
                  Water Level Danger Limit:
                </span>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  {waterThreshold} cm
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={waterThreshold}
                onChange={(e) => setWaterThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>
                  Rainfall Alert Trigger:
                </span>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>
                  {rainThreshold} mm/h
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                value={rainThreshold}
                onChange={(e) => setRainThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#818cf8" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>
                  Soil Moisture Saturation Warning:
                </span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>
                  {soilThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={soilThreshold}
                onChange={(e) => setSoilThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>
                  Smoke / Toxic Gas Alarm Limit:
                </span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>
                  {smokeThreshold} PPM
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="400"
                value={smokeThreshold}
                onChange={(e) => setSmokeThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#ef4444" }}
              />
            </div>
          </div>
        </div>

        {/* 4. Audio Siren & Acoustic Alarm Preferences */}
        <div
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Volume2 size={18} color="#ef4444" />
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                margin: 0,
              }}
            >
              Web Audio Synthesizer Preferences
            </h3>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}
              >
                Audio Siren Output
              </div>
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                Web Audio API undulation wail on critical event
              </div>
            </div>

            <button
              onClick={handleToggleMute}
              className="action-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: isMuted ? "1px solid #ef4444" : "1px solid #10b981",
                background: isMuted
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(16, 185, 129, 0.2)",
                color: isMuted ? "#f87171" : "#34d399",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isMuted ? "Muted" : "Enabled"}</span>
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => playEmergencySiren(1.5)}
              className="action-btn"
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Test Siren Sound
            </button>

            <button
              onClick={() => playAckChime()}
              className="action-btn"
              style={{
                flex: 1,
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Test Ack Chime
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
