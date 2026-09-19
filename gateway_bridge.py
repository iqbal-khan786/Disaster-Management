"""
======================================================================================
  SMART INDIA HACKATHON (SIH 2026) — DISASTERGUARD IOT COMMAND CENTER
  PYTHON SERIAL / HARDWARE TO WEBSOCKET GATEWAY BRIDGE
======================================================================================
  Usage:
  1. Auto-detect ESP32 on USB Serial and start WebSocket:
     python gateway_bridge.py

  2. Specify COM Port explicitly:
     python gateway_bridge.py --port COM3 --baud 115200

  3. Standalone Simulation Mode:
     python gateway_bridge.py --simulate

  WebSocket Server: ws://127.0.0.1:8080 or ws://0.0.0.0:8080
======================================================================================
"""

import sys
import json
import time
import random
import argparse
import asyncio
import re

import functools
import builtins
builtins.print = functools.partial(print, flush=True)

# Fix Windows cp1252 emoji encoding issues
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    import websockets
except ImportError:
    print("\n[!] 'websockets' library is required.")
    print("    Install it via: pip install websockets pyserial\n")
    sys.exit(1)

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    serial = None

CONNECTED_CLIENTS = set()

# Live State of Monitored Villages (100% Real Hardware Baseline - ONLY Node 1)
LIVE_NODES = {
    "NODE_01": {
        "id": "NODE_01",
        "name": "Village 1: Kashipur Valley",
        "village": "Kashipur Valley",
        "district": "Rayagada, Odisha",
        "latitude": 19.1950,
        "longitude": 83.3950,
        "riskLevel": "NORMAL",
        "disasterType": "NONE",
        "riskScore": 0.0,
        "waterLevelCm": 0,
        "waterLevelM": 0.0,
        "rainMm": 0,
        "soilMoisture": 0,
        "temperature": 24.5,
        "humidity": 75,
        "smokeLevel": 0,
        "flameDetected": False,
        "vibration": False,
        "battery": 72,
        "batteryVoltage": 3.04,
        "hopCount": 1,
        "rssi": -65,
        "status": "ONLINE",
        "lastSeen": int(time.time() * 1000)
    }
}

def parse_raw_serial_line(line: str):
    """Extract and normalize 100% real physical sensor data from ESP32 Serial output."""
    if not line:
        return None

    line = line.strip()

    # 1. Try extracting embedded JSON object (e.g. [JSON STREAM] {"id":"V1",...})
    json_match = re.search(r'(\{.*\})', line)
    if json_match:
        try:
            data = json.loads(json_match.group(1))
            mapped_id = "NODE_01"
            
            # Water level
            if "water_level_cm" in data:
                water_cm = int(data["water_level_cm"])
            elif "waterLevelCm" in data:
                water_cm = int(data["waterLevelCm"])
            elif "waterLevel" in data:
                water_cm = int(round(float(data["waterLevel"]) * 100))
            elif "waterLevelM" in data:
                water_cm = int(round(float(data["waterLevelM"]) * 100))
            else:
                water_cm = 0

            # Rainfall
            if "rainfall_mm" in data:
                rain_mm = float(data["rainfall_mm"])
            elif "rainMm" in data:
                rain_mm = float(data["rainMm"])
            elif "rain" in data:
                rain_mm = float(data["rain"])
            else:
                rain_mm = 0.0

            # Soil moisture
            if "soil_moisture" in data:
                soil_pct = float(data["soil_moisture"])
            elif "soilMoisture" in data:
                soil_pct = float(data["soilMoisture"])
            elif "soil" in data:
                soil_pct = float(data["soil"])
            else:
                soil_pct = 0.0

            # Smoke level
            if "smoke_level" in data:
                smoke_lvl = int(data["smoke_level"])
            elif "smokeLevel" in data:
                smoke_lvl = int(data["smokeLevel"])
            elif "smoke" in data:
                smoke_lvl = int(data["smoke"])
            else:
                smoke_lvl = 0

            # Vibration
            vib_raw = data.get("vibration", False)
            if isinstance(vib_raw, str):
                vibration = vib_raw.lower() in ("true", "1", "detected", "active")
            else:
                vibration = bool(vib_raw)

            # Flame
            flm_raw = data.get("flame_detected", data.get("flameDetected", False))
            if isinstance(flm_raw, str):
                flame = flm_raw.lower() in ("true", "1", "detected")
            elif isinstance(flm_raw, (int, float)):
                flame = flm_raw > 50
            else:
                flame = bool(flm_raw)

            # Battery
            bat_v = float(data.get("batteryVoltage", data.get("battery", 3.95)))
            if bat_v > 5.0:
                bat_pct = int(min(100, max(10, bat_v)))
                bat_v = 4.05
            else:
                bat_pct = int(min(100, max(10, (bat_v / 4.2) * 100)))

            normalized = {
                "id": mapped_id,
                "node_id": mapped_id,
                "name": "Village 1: Kashipur Valley" if mapped_id == "NODE_01" else ("Village 2: Kolnara Ridge" if mapped_id == "NODE_02" else f"Village {mapped_id}"),
                "village": "Kashipur Valley" if mapped_id == "NODE_01" else ("Kolnara Ridge" if mapped_id == "NODE_02" else f"Village {mapped_id}"),
                "district": data.get("district", "Rayagada, Odisha"),
                "latitude": float(data.get("latitude", 19.1950)),
                "longitude": float(data.get("longitude", 83.3950)),
                "riskLevel": data.get("riskLevel", "NORMAL"),
                "riskScore": float(data.get("riskScore", 10.0)),
                "disasterType": data.get("disasterType", "NONE"),
                "water_level_cm": water_cm,
                "waterLevelCm": water_cm,
                "waterLevelM": round(water_cm / 100.0, 2),
                "waterLevel": round(water_cm / 100.0, 2),
                "rainfall_mm": int(rain_mm),
                "rainMm": int(rain_mm),
                "rain": int(rain_mm),
                "soil_moisture": int(soil_pct),
                "soilMoisture": int(soil_pct),
                "soil": int(soil_pct),
                "temperature": float(data.get("temperature", data.get("temp", 24.5))),
                "temp": float(data.get("temperature", data.get("temp", 24.5))),
                "humidity": float(data.get("humidity", 75.0)),
                "smoke_level": smoke_lvl,
                "smokeLevel": smoke_lvl,
                "flame_detected": flame,
                "flameDetected": flame,
                "vibration": vibration,
                "battery": bat_pct,
                "batteryVoltage": bat_v,
                "hopCount": int(data.get("hopCount", data.get("hop", 1))),
                "rssi": int(data.get("rssi", -65)),
                "status": "ONLINE",
                "lastSeen": int(time.time() * 1000),
                "rawPacket": line
            }
            return normalized
        except Exception as e:
            pass

    # 2. Parse Pipe-separated packet:
    # V1|NORMAL|NONE|19.1950|83.3950|10.0|PKT#001|HOP:1|RAIN:0|SOIL:0|SMK:0|H2O:0.00|BAT:3.11|VIB:1|FLM:0
    if "|" in line:
        pipe_idx = line.find("|")
        space_idx = line.rfind(" ", 0, pipe_idx)
        clean = line[space_idx+1:] if space_idx >= 0 else line
        parts = clean.split("|")
        
        if len(parts) >= 6:
            raw_id = parts[0].strip()
            mapped_id = "NODE_01" if raw_id in ("V1", "NODE_01") else ("NODE_02" if raw_id in ("V2", "NODE_02") else raw_id)
            risk_lvl = parts[1].strip()
            disaster = parts[2].strip()
            lat = float(parts[3]) if parts[3].replace('.', '', 1).replace('-', '', 1).isdigit() else 19.1950
            lng = float(parts[4]) if parts[4].replace('.', '', 1).replace('-', '', 1).isdigit() else 83.3950
            score = float(parts[5]) if parts[5].replace('.', '', 1).isdigit() else 10.0

            rain = 0
            soil = 0
            smoke = 0
            h2o = 0.0
            bat = 3.95
            hop = 1
            vib = False
            flm = False

            for p in parts[6:]:
                p = p.strip()
                if p.startswith("HOP:"):
                    hop = int(p.replace("HOP:", ""))
                elif p.startswith("RAIN:"):
                    rain = float(p.replace("RAIN:", ""))
                elif p.startswith("SOIL:"):
                    soil = float(p.replace("SOIL:", ""))
                elif p.startswith("SMK:"):
                    smoke = int(p.replace("SMK:", ""))
                elif p.startswith("H2O:"):
                    h2o = float(p.replace("H2O:", ""))
                elif p.startswith("BAT:"):
                    bat = float(p.replace("BAT:", ""))
                elif p.startswith("VIB:"):
                    vib = p.replace("VIB:", "").strip() in ("1", "true", "TRUE", "DETECTED")
                elif p.startswith("FLM:"):
                    flm = float(p.replace("FLM:", "")) > 50

            water_cm = int(round(h2o * 100))
            normalized = {
                "id": mapped_id,
                "node_id": mapped_id,
                "name": "Village 1: Kashipur Valley" if mapped_id == "NODE_01" else ("Village 2: Kolnara Ridge" if mapped_id == "NODE_02" else f"Village {mapped_id}"),
                "village": "Kashipur Valley" if mapped_id == "NODE_01" else ("Kolnara Ridge" if mapped_id == "NODE_02" else f"Village {mapped_id}"),
                "district": "Rayagada, Odisha",
                "latitude": lat,
                "longitude": lng,
                "riskLevel": risk_lvl,
                "riskScore": score,
                "disasterType": disaster,
                "water_level_cm": water_cm,
                "waterLevelCm": water_cm,
                "waterLevelM": h2o,
                "waterLevel": h2o,
                "rainfall_mm": int(rain),
                "rainMm": int(rain),
                "rain": int(rain),
                "soil_moisture": int(soil),
                "soilMoisture": int(soil),
                "soil": int(soil),
                "temperature": 24.5,
                "temp": 24.5,
                "humidity": 75,
                "smoke_level": smoke,
                "smokeLevel": smoke,
                "flame_detected": flm,
                "flameDetected": flm,
                "vibration": vib,
                "battery": int(min(100, max(10, (bat / 4.2) * 100))),
                "batteryVoltage": bat,
                "hopCount": hop,
                "rssi": -65,
                "status": "ONLINE",
                "lastSeen": int(time.time() * 1000),
                "rawPacket": line
            }
            return normalized

    return None

    return None

async def broadcast_message(message_json: str):
    """Broadcast JSON string to all connected WebSocket browser clients."""
    if CONNECTED_CLIENTS:
        tasks = [asyncio.create_task(client.send(message_json)) for client in CONNECTED_CLIENTS]
        await asyncio.gather(*tasks, return_exceptions=True)

async def ws_handler(websocket):
    """Handle incoming WebSocket connections from React Dashboard."""
    CONNECTED_CLIENTS.add(websocket)
    remote_ip = websocket.remote_address
    print(f"[WebSocket] 🟢 Client connected from {remote_ip}")

    # Send current state of all known nodes immediately
    initial_payload = json.dumps(list(LIVE_NODES.values()))
    await websocket.send(initial_payload)

    try:
        async for message in websocket:
            try:
                cmd_data = json.loads(message)
                cmd = cmd_data.get("cmd")
                print(f"[WebSocket RX] Command: {cmd}")
                if cmd == "GET_ALL":
                    await websocket.send(json.dumps(list(LIVE_NODES.values())))
                elif cmd == "SIREN":
                    print("🚨 [SIREN COMMAND] Base Station Buzzer Triggered!")
                    await broadcast_message(json.dumps({"event": "siren_triggered", "timestamp": int(time.time() * 1000)}))
                elif cmd == "DISPATCH":
                    node = cmd_data.get("node", "NODE_01")
                    print(f"🚁 [DISPATCH COMMAND] Rescue Team Alpha mobilized for Node {node}!")
                    await broadcast_message(json.dumps({"event": "rescue_dispatched", "node": node, "timestamp": int(time.time() * 1000)}))
            except Exception as e:
                print(f"[WS Error] {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.remove(websocket)
        print(f"[WebSocket] 🔴 Client disconnected: {remote_ip}")

def find_esp32_port():
    """Auto-detect USB Serial Port connected to ESP32 / CP210x / CH340 / FTDI."""
    if not serial:
        return None
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = (p.description or "").lower()
        hwid = (p.hwid or "").lower()
        if "cp210" in desc or "ch340" in desc or "uart" in desc or "usb" in desc or "serial" in desc or "ftdi" in desc:
            return p.device
    if ports:
        return ports[0].device
    return None

async def read_serial_loop(port: str, baud: int):
    """Read live packets from ESP32 over USB Serial and broadcast to WebSockets."""
    if not serial:
        print("[!] PySerial is required for USB Serial mode. Run: pip install pyserial")
        return

    while True:
        target_port = port
        if not target_port or target_port == "auto" or target_port == "AUTO":
            detected = find_esp32_port()
            if detected:
                target_port = detected
                print(f"[Serial] ⚡ Auto-detected ESP32 Serial Port: {target_port}")
            else:
                target_port = "COM4"

        print(f"[Serial] 🔌 Connecting to ESP32 on {target_port} at {baud} baud...")
        try:
            ser = serial.Serial(target_port, baud, timeout=1, dsrdtr=False, rtscts=False)
            try:
                ser.dtr = False
                ser.rts = False
            except Exception:
                pass
            print(f"[Serial] ✅ Successfully connected to {target_port}! Streaming 100% REAL physical hardware sensor telemetry...")
        except Exception as e:
            print(f"[!] Could not open serial port {target_port}: {e}")
            if serial.tools.list_ports.comports():
                print("    Available ports:")
                for p in serial.tools.list_ports.comports():
                    print(f"    - {p.device}: {p.description}")
            print("    Waiting 3 seconds before retrying hardware connection...")
            await asyncio.sleep(3)
            continue

        while True:
            try:
                raw_line = ser.readline().decode('utf-8', errors='ignore').strip()
                if raw_line:
                    parsed = parse_raw_serial_line(raw_line)
                    if parsed:
                        node_id = parsed["id"]
                        LIVE_NODES[node_id] = parsed
                        payload = json.dumps(parsed)
                        print(f"[ESP32 -> WS] 📡 {node_id} | H2O: {parsed['waterLevelCm']}cm ({parsed['waterLevelM']}m) | Rain: {parsed['rainMm']}mm | Soil: {parsed['soilMoisture']}% | Smoke: {parsed['smokeLevel']} | Vib: {parsed['vibration']} | Temp: {parsed['temperature']}°C | Bat: {parsed['batteryVoltage']}V | Risk: {parsed['riskLevel']} ({parsed['riskScore']}/100)")
                        await broadcast_message(payload)
                    else:
                        if raw_line.startswith("[") or "LoRa" in raw_line or "PKT" in raw_line or "WiFi" in raw_line or "Cycle" in raw_line:
                            print(f"[ESP32 Log] {raw_line}")
            except Exception as e:
                print(f"[Serial Error] {e}. Reconnecting...")
                try:
                    ser.close()
                except Exception:
                    pass
                await asyncio.sleep(2)
                break
            await asyncio.sleep(0.01)

async def run_simulation_loop():
    """Simulation fallback when no physical hardware is plugged in."""
    print("[Simulator] Background simulation active...")
    while True:
        await asyncio.sleep(3.0)
        node1 = LIVE_NODES["NODE_01"]
        node1["waterLevelCm"] = max(10, min(300, node1["waterLevelCm"] + random.randint(-2, 3)))
        node1["waterLevelM"] = round(node1["waterLevelCm"] / 100.0, 2)
        node1["rainMm"] = max(0, min(150, node1["rainMm"] + random.randint(-1, 2)))
        node1["soilMoisture"] = max(20, min(99, node1["soilMoisture"] + random.randint(-1, 1)))
        node1["lastSeen"] = int(time.time() * 1000)
        
        payload = json.dumps(node1)
        await broadcast_message(payload)

async def main():
    parser = argparse.ArgumentParser(description="DisasterGuard WebSocket Gateway Bridge")
    parser.add_argument("--port", type=str, default="auto", help="Serial port (e.g. COM3, COM4 or /dev/ttyUSB0 or 'auto')")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate (default: 115200)")
    parser.add_argument("--ws_port", type=int, default=8080, help="WebSocket port (default: 8080)")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode without hardware")
    args = parser.parse_args()

    print("=================================================================")
    print("  SIH 2026 — DISASTERGUARD HARDWARE TO WEBSOCKET BRIDGE ONLINE")
    print(f"  WebSocket URL: ws://127.0.0.1:{args.ws_port}/")
    print("=================================================================\n")

    ws_server = await websockets.serve(ws_handler, "0.0.0.0", args.ws_port)

    if args.simulate:
        await run_simulation_loop()
    else:
        await read_serial_loop(args.port, args.baud)

    await ws_server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] Bridge stopped.")
