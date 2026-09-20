import React, { useState } from "react";
import { useDisasterWebSocket } from "./hooks/useDisasterWebSocket";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { OverviewView } from "./components/views/OverviewView";
import { LiveMonitoringView } from "./components/views/LiveMonitoringView";
import { VillageNetworkView } from "./components/views/VillageNetworkView";
import { RiskAnalysisView } from "./components/views/RiskAnalysisView";
import { AlertsCenterView } from "./components/views/AlertsCenterView";
import { SensorNodesView } from "./components/views/SensorNodesView";
import { HistoricalDataView } from "./components/views/HistoricalDataView";
import { RescueOperationsView } from "./components/views/RescueOperationsView";
import { GraphDetailsView } from "./components/views/GraphDetailsView";
import { SystemSettingsView } from "./components/views/SystemSettingsView";

import { VillageDetailModal } from "./components/VillageDetailModal";
import { DispatchModal } from "./components/DispatchModal";

export default function App() {
  const {
    serverUrl,
    connectionStatus,
    gatewayStatus,
    isDemoMode,
    activeScenario,
    nodes,
    history,
    alerts,
    lastDataTimestamp,
    isSerialConnected,
    serialPortName,
    connectWebSocket,
    connectUsbSerial,
    disconnectUsbSerial,
    triggerSiren,
    dispatchRescue,
    acknowledgeAlert,
    resolveAlert,
    setSimulationScenario,
    toggleDemoMode,
  } = useDisasterWebSocket();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDetailNode, setSelectedDetailNode] = useState(null);
  const [selectedDispatchNode, setSelectedDispatchNode] = useState(null);

  const activeAlertCount = alerts.filter((a) => a.status === "active").length;

  const handleOpenDispatch = (node) => {
    setSelectedDispatchNode(node);
  };

  const handleConfirmDispatch = (nodeId, coords, details) => {
    dispatchRescue(nodeId, coords, details);
  };

  // Keep selectedDetailNode synchronized with live data
  const activeDetailNode = selectedDetailNode
    ? nodes[selectedDetailNode.id] || selectedDetailNode
    : null;

  return (
    <div className="app-container">
      {/* 1. Command Center Top Header */}
      <Header
        connectionStatus={connectionStatus}
        gatewayStatus={gatewayStatus}
        isDemoMode={isDemoMode}
        onToggleDemoMode={toggleDemoMode}
        onTriggerSiren={triggerSiren}
        isSerialConnected={isSerialConnected}
        serialPortName={serialPortName}
        onConnectSerial={connectUsbSerial}
        onDisconnectSerial={disconnectUsbSerial}
        activeAlertCount={activeAlertCount}
        activeScenario={activeScenario}
        onSelectScenario={setSimulationScenario}
      />

      {/* 2. Main Body with Left Sidebar & View Container */}
      <div className="app-body">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeAlertCount={activeAlertCount}
        />

        {/* Central Dynamic View Area */}
        <main className="main-content">
          {/* Active Navigation Views Switcher */}
          {activeTab === "overview" && (
            <OverviewView
              nodes={nodes}
              history={history}
              alerts={alerts}
              gatewayStatus={gatewayStatus}
              lastDataTimestamp={lastDataTimestamp}
              activeScenario={activeScenario}
              onSelectNode={setSelectedDetailNode}
              onOpenDispatch={handleOpenDispatch}
              onTriggerSiren={triggerSiren}
            />
          )}

          {activeTab === "monitoring" && (
            <LiveMonitoringView
              nodes={nodes}
              onSelectNode={setSelectedDetailNode}
              onOpenDispatch={handleOpenDispatch}
              onTriggerSiren={triggerSiren}
            />
          )}

          {activeTab === "graphs" && (
            <GraphDetailsView history={history} nodes={nodes} />
          )}

          {activeTab === "network" && (
            <VillageNetworkView
              nodes={nodes}
              gatewayStatus={gatewayStatus}
              onSelectNode={setSelectedDetailNode}
              onOpenDispatch={handleOpenDispatch}
            />
          )}

          {activeTab === "risk" && <RiskAnalysisView nodes={nodes} />}

          {activeTab === "alerts" && (
            <AlertsCenterView
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
              onTriggerSiren={triggerSiren}
            />
          )}

          {activeTab === "nodes" && (
            <SensorNodesView
              nodes={nodes}
              onSelectNode={setSelectedDetailNode}
            />
          )}

          {activeTab === "history" && (
            <HistoricalDataView history={history} nodes={nodes} />
          )}

          {activeTab === "rescue" && (
            <RescueOperationsView
              nodes={nodes}
              onOpenDispatch={handleOpenDispatch}
            />
          )}

          {activeTab === "settings" && (
            <SystemSettingsView
              serverUrl={serverUrl}
              onConnectWebSocket={connectWebSocket}
              connectionStatus={connectionStatus}
              gatewayStatus={gatewayStatus}
              isSerialConnected={isSerialConnected}
              serialPortName={serialPortName}
              onConnectSerial={connectUsbSerial}
              onDisconnectSerial={disconnectUsbSerial}
            />
          )}
        </main>
      </div>

      {/* Village Detail Modal */}
      <VillageDetailModal
        node={activeDetailNode}
        isOpen={Boolean(activeDetailNode)}
        onClose={() => setSelectedDetailNode(null)}
        onOpenDispatch={handleOpenDispatch}
        allNodes={nodes}
      />

      {/* Rescue Dispatch Confirmation Modal */}
      <DispatchModal
        node={selectedDispatchNode}
        isOpen={Boolean(selectedDispatchNode)}
        onClose={() => setSelectedDispatchNode(null)}
        onConfirm={handleConfirmDispatch}
      />
    </div>
  );
}
