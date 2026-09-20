import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Volume2,
  Clock,
  Radio,
  MapPin,
  Flame,
  Waves,
  Mountain,
  Wind,
  Check,
} from "lucide-react";

export function AlertsCenterView({
  alerts = [],
  onAcknowledge,
  onResolve,
  onTriggerSiren,
}) {
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, acknowledged, resolved

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  const activeCriticalAlert = alerts.find(
    (a) =>
      a.status === "active" &&
      (a.level === "CRITICAL" || a.level === "EMERGENCY"),
  );

  const getSeverityBadge = (level) => {
    switch (level) {
      case "CRITICAL":
      case "EMERGENCY":
        return { bg: "#ef4444", text: "#ffffff", label: "CRITICAL" };
      case "HIGH":
        return { bg: "#f97316", text: "#ffffff", label: "HIGH" };
      case "MEDIUM":
      case "WARNING":
        return { bg: "#f59e0b", text: "#000000", label: "MEDIUM" };
      case "LOW":
      case "NORMAL":
      default:
        return { bg: "#10b981", text: "#ffffff", label: "LOW" };
    }
  };

  const getDisasterIcon = (type) => {
    if (type?.includes("FLOOD")) return Waves;
    if (type?.includes("LANDSLIDE")) return Mountain;
    if (type?.includes("FIRE") || type?.includes("SMOKE")) return Flame;
    if (type?.includes("STORM") || type?.includes("CYCLONE")) return Wind;
    return AlertTriangle;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner & Siren Trigger */}
      <div
        className="glass-panel"
        style={{
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
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
            <ShieldAlert size={18} color="#ef4444" />
            Disaster Emergency Alert Management Center
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: "3px 0 0" }}>
            Multi-Hazard Trigger Log, Village Siren Broadcasts & Operator Audit
            Logs
          </p>
        </div>

        <button
          onClick={onTriggerSiren}
          className="action-btn"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            border: "1px solid #ef4444",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 0 15px rgba(239, 68, 68, 0.4)",
          }}
        >
          <Volume2 size={14} />
          <span>Broadcast Village Siren</span>
        </button>
      </div>

      {/* Prominent Critical Warning Banner if Active Critical Alert */}
      {activeCriticalAlert && (
        <div
          className="alert-flash"
          style={{
            background:
              "linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, rgba(15, 23, 42, 0.95) 100%)",
            border: "2px solid #ef4444",
            borderRadius: "10px",
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "#ef4444",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.5)",
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#fca5a5",
                    textTransform: "uppercase",
                  }}
                >
                  {activeCriticalAlert.title}
                </span>
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  IMMEDIATE ACTION
                </span>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#fecaca",
                  margin: "4px 0 0",
                }}
              >
                {activeCriticalAlert.desc}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() =>
                onAcknowledge && onAcknowledge(activeCriticalAlert.id)
              }
              className="action-btn"
              style={{
                background: "#38bdf8",
                color: "#000",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Check size={12} />
              Acknowledge Alert
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
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
          {["all", "active", "acknowledged", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className="action-btn"
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                border: "none",
                background: filterStatus === status ? "#38bdf8" : "transparent",
                color: filterStatus === status ? "#000" : "#94a3b8",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {status} (
              {status === "all"
                ? alerts.length
                : alerts.filter((a) => a.status === status).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredAlerts.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            No disaster alerts matching this filter.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const badge = getSeverityBadge(alert.level);
            const Icon = getDisasterIcon(alert.disasterType);
            return (
              <div
                key={alert.id}
                className="glass-panel"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                  borderLeft: `4px solid ${badge.bg}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      background: `${badge.bg}25`,
                      color: badge.bg,
                      border: `1px solid ${badge.bg}`,
                    }}
                  >
                    <Icon size={20} />
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
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#f8fafc",
                        }}
                      >
                        {alert.title}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background:
                            alert.status === "active"
                              ? "rgba(239, 68, 68, 0.2)"
                              : alert.status === "acknowledged"
                                ? "rgba(245, 158, 11, 0.2)"
                                : "rgba(16, 185, 129, 0.2)",
                          color:
                            alert.status === "active"
                              ? "#ef4444"
                              : alert.status === "acknowledged"
                                ? "#f59e0b"
                                : "#10b981",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          textTransform: "uppercase",
                        }}
                      >
                        {alert.status}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "11px",
                        color: "#cbd5e1",
                        margin: "4px 0 6px",
                      }}
                    >
                      {alert.desc}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        fontSize: "10px",
                        color: "#64748b",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <MapPin size={11} />{" "}
                        {alert.village || "Rayagada Sector"}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Radio size={11} />{" "}
                        {alert.triggerSensor || "Ultrasonic + Rain"}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Clock size={11} /> {alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {alert.status === "active" && (
                    <button
                      onClick={() => onAcknowledge && onAcknowledge(alert.id)}
                      className="action-btn"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #38bdf8",
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Acknowledge
                    </button>
                  )}

                  {alert.status !== "resolved" && (
                    <button
                      onClick={() => onResolve && onResolve(alert.id)}
                      className="action-btn"
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "1px solid #10b981",
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
