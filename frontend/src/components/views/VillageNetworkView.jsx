import React, { useState } from "react";
import { MapPin, Share2, ArrowRight, Globe } from "lucide-react";
import { DisasterMap } from "../DisasterMap";

export function VillageNetworkView({
  nodes = {},
  gatewayStatus: _gatewayStatus = "ONLINE",
  onSelectNode,
  onOpenDispatch,
}) {
  const [activeTab, setActiveTab] = useState("gis_map"); // gis_map, topology_diagram
  const nodeList = Object.values(nodes);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header & Switcher */}
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
            <MapPin size={18} color="#38bdf8" />
            Village Network GIS & LoRa Mesh Topology
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: "3px 0 0" }}>
            Multi-Hop Offline 433MHz RF Network • Nagavali River Basin, Rayagada
            District
          </p>
        </div>

        {/* View Switcher */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "rgba(255, 255, 255, 0.03)",
            padding: "3px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <button
            onClick={() => setActiveTab("gis_map")}
            className="action-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "5px",
              border: "none",
              background: activeTab === "gis_map" ? "#38bdf8" : "transparent",
              color: activeTab === "gis_map" ? "#000" : "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Globe size={13} />
            <span>GIS Tactical Map</span>
          </button>

          <button
            onClick={() => setActiveTab("topology_diagram")}
            className="action-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "5px",
              border: "none",
              background:
                activeTab === "topology_diagram" ? "#38bdf8" : "transparent",
              color: activeTab === "topology_diagram" ? "#000" : "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Share2 size={13} />
            <span>LoRa Mesh Topology</span>
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {activeTab === "gis_map" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <DisasterMap
            nodes={nodes}
            onSelectNode={onSelectNode}
            onOpenDispatch={onOpenDispatch}
          />
        </div>
      ) : (
        /* LoRa Mesh Topology Flow Diagram */
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Topology Architecture Flow */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#38bdf8",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "16px",
              }}
            >
              Data Pipeline & LoRa Relay Propagation Path
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                padding: "16px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "10px",
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {/* Step 1: ESP32 Remote Sensor Node */}
              <div
                style={{
                  flex: "1",
                  minWidth: "180px",
                  padding: "14px",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #ef4444",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#ef4444",
                      textTransform: "uppercase",
                    }}
                  >
                    Remote Sensor Node
                  </span>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ef4444",
                    }}
                    className="pulse-circle"
                  />
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#f8fafc",
                  }}
                >
                  ESP32 Node 1 (Kashipur)
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "4px",
                  }}
                >
                  Ultrasonic + Rain + Soil + Smoke
                  <br />
                  SX1278 433MHz (+20dBm)
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  color: "#38bdf8",
                }}
              >
                <span
                  style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }}
                >
                  LoRa 433MHz (7.2 km)
                </span>
                <ArrowRight size={20} />
                <span style={{ fontSize: "9px", color: "#64748b" }}>
                  RSSI: -64 dBm
                </span>
              </div>

              {/* Step 2: ESP32 Relay Node */}
              <div
                style={{
                  flex: "1",
                  minWidth: "180px",
                  padding: "14px",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #10b981",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#10b981",
                      textTransform: "uppercase",
                    }}
                  >
                    Intermediate Relay
                  </span>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#10b981",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#f8fafc",
                  }}
                >
                  ESP32 Node 2 (Kolnara)
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "4px",
                  }}
                >
                  Highland Relay Tower
                  <br />
                  Packet Hop Increment (Hop: 2)
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  color: "#38bdf8",
                }}
              >
                <span
                  style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }}
                >
                  LoRa 433MHz (8.5 km)
                </span>
                <ArrowRight size={20} />
                <span style={{ fontSize: "9px", color: "#64748b" }}>
                  RSSI: -76 dBm
                </span>
              </div>

              {/* Step 3: Base Gateway */}
              <div
                style={{
                  flex: "1",
                  minWidth: "180px",
                  padding: "14px",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #38bdf8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                    }}
                  >
                    Base Station Gateway
                  </span>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#38bdf8",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#f8fafc",
                  }}
                >
                  Rayagada DEOC Hub
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "4px",
                  }}
                >
                  ESP32 / Pi Gateway Receiver
                  <br />
                  FastAPI WebSocket Bridge :8000
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  color: "#a855f7",
                }}
              >
                <span
                  style={{ fontSize: "10px", fontFamily: "JetBrains Mono" }}
                >
                  WebSocket JSON
                </span>
                <ArrowRight size={20} />
                <span style={{ fontSize: "9px", color: "#64748b" }}>
                  Full Duplex
                </span>
              </div>

              {/* Step 4: DisasterGuard Dashboard */}
              <div
                style={{
                  flex: "1",
                  minWidth: "180px",
                  padding: "14px",
                  background: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #a855f7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#a855f7",
                      textTransform: "uppercase",
                    }}
                  >
                    Client Dashboard
                  </span>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#a855f7",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#f8fafc",
                  }}
                >
                  DisasterGuard App
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "4px",
                  }}
                >
                  React 19 + Real-Time GIS
                  <br />
                  AI Risk & CAD Evac Dispatch
                </div>
              </div>
            </div>
          </div>

          {/* Node Health & Packet Matrix Table */}
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                marginBottom: "12px",
              }}
            >
              LoRa Link Quality & Signal Budget
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "11px",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#94a3b8",
                    }}
                  >
                    <th style={{ padding: "8px" }}>Node ID</th>
                    <th style={{ padding: "8px" }}>Village Name</th>
                    <th style={{ padding: "8px" }}>Role</th>
                    <th style={{ padding: "8px" }}>Hop Count</th>
                    <th style={{ padding: "8px" }}>Signal (RSSI)</th>
                    <th style={{ padding: "8px" }}>SNR</th>
                    <th style={{ padding: "8px" }}>Packet Success</th>
                    <th style={{ padding: "8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nodeList.map((node) => (
                    <tr
                      key={node.id}
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                        color: "#f8fafc",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 8px",
                          fontFamily: "JetBrains Mono",
                          color: "#38bdf8",
                          fontWeight: 700,
                        }}
                      >
                        {node.id}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                        {node.name}
                      </td>
                      <td style={{ padding: "10px 8px", color: "#94a3b8" }}>
                        {node.id === "NODE_02"
                          ? "Highland Relay Node"
                          : "Sensor Cluster"}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          fontFamily: "JetBrains Mono",
                        }}
                      >
                        Hop {node.hopCount || 1}
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          fontFamily: "JetBrains Mono",
                          color:
                            (node.rssi || -70) > -80 ? "#34d399" : "#f59e0b",
                        }}
                      >
                        {node.rssi || -70} dBm
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          fontFamily: "JetBrains Mono",
                          color: "#38bdf8",
                        }}
                      >
                        +8.5 dB
                      </td>
                      <td
                        style={{
                          padding: "10px 8px",
                          color: "#34d399",
                          fontWeight: 700,
                        }}
                      >
                        99.2%
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: 800,
                            background:
                              node.status === "ONLINE"
                                ? "rgba(16, 185, 129, 0.2)"
                                : "rgba(239, 68, 68, 0.2)",
                            color:
                              node.status === "ONLINE" ? "#34d399" : "#ef4444",
                          }}
                        >
                          {node.status || "ONLINE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
