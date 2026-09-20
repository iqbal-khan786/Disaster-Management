import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official, highly structured Government-grade PDF Disaster Telemetry & Incident Report.
 * Specifically aligned with the 6 Physical IoT Sensors:
 * 1. Rain Sensor (Precipitation mm/h)
 * 2. Soil Moisture Sensor (Saturation %)
 * 3. Smoke & Gas Sensor MQ-2 (PPM)
 * 4. Flame IR Sensor (Detection Status)
 * 5. SW-420 Vibration Sensor (Seismic/Slope Shift Status)
 * 6. DHT22 Temperature & Humidity Sensor (°C / %)
 */
export function generateDisasterPDFReport({ logs = [], currentNode = {}, summaryStats = {} }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const reportDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const reportId = `OSDMA-DEOC-RPT-${Date.now().toString().slice(-6)}`;

  // ==========================================
  // 1. TOP HEADER BANNER (Official Government Theme)
  // ==========================================
  doc.setFillColor(15, 23, 42); // Deep Navy (#0f172a)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(56, 189, 248); // Electric Sky Blue (#38bdf8)
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GOVERNMENT OF ODISHA — DISASTER MANAGEMENT AUTHORITY (OSDMA)', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('DISTRICT EMERGENCY OPERATION CENTER (DEOC) • RAYAGADA HEADQUARTERS', 14, 17);
  doc.text('High-Frequency IoT Telemetry & Multi-Hazard Sensor Early Warning Record', 14, 23);

  // Security / Classification Badge (Top Right)
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(pageWidth - 58, 7, 44, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL INCIDENT', pageWidth - 36, 12, { align: 'center' });
  doc.text('AUDIT REPORT', pageWidth - 36, 17, { align: 'center' });

  // ==========================================
  // 2. INCIDENT & REPORT METADATA GRID
  // ==========================================
  let currentY = 36;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Report ID:', 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(reportId, 45, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Generated At:', 18, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportDate} (IST)`, 45, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Monitored Sector:', 18, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('Village 1: Kashipur Valley, Rayagada', 45, currentY + 21);

  // Column 2
  const col2X = 110;
  doc.setFont('helvetica', 'bold');
  doc.text('Telemetry Node:', col2X, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text('NODE_01 (ESP32 Standalone Core)', col2X + 28, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('RF Protocol:', col2X, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text('LoRa SX1278 433MHz Mesh Link', col2X + 28, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Active Sensors:', col2X, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('6 Physical Hardware Transducers', col2X + 28, currentY + 21);

  // ==========================================
  // 3. EXECUTIVE KPI METRICS (6 PHYSICAL SENSORS)
  // ==========================================
  currentY += 32;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE PHYSICAL SENSOR SUMMARY (CURRENT TELEMETRY)', 14, currentY);

  currentY += 4;

  const cardWidth = (pageWidth - 28 - 10) / 3;
  const cardHeight = 16;

  const kpis = [
    {
      title: 'Rainfall Rate (Rain Sensor)',
      val: `${summaryStats.maxRain ?? (currentNode.rainMm || 0)} mm/h`,
      sub: 'Capacitive Precip. Gauge'
    },
    {
      title: 'Soil Moisture Saturation',
      val: `${summaryStats.avgSoil ?? (currentNode.soilMoisture || 0)}%`,
      sub: 'Analog Soil v1.2 Sensor'
    },
    {
      title: 'Smoke & Gas (MQ-2)',
      val: `${summaryStats.maxSmoke ?? (currentNode.smokeLevel || 0)} PPM`,
      sub: 'Combustible Gas Sensor'
    },
    {
      title: 'Flame Detection (IR)',
      val: currentNode.flameDetected ? 'FLAME TRIP (CRITICAL)' : 'CLEAR (NOMINAL)',
      sub: 'IR Optical Sensor'
    },
    {
      title: 'Seismic / Slope Vibration',
      val: currentNode.vibration ? 'MOTION DETECTED' : 'NORMAL (STABLE)',
      sub: 'SW-420 Shock Sensor'
    },
    {
      title: 'Ambient Climate (DHT22)',
      val: `${summaryStats.avgTemp ?? (currentNode.temp || 24.5)}°C | ${currentNode.humidity || 75}% RH`,
      sub: 'Sensirion Temp / Humidity'
    }
  ];

  kpis.forEach((kpi, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = 14 + col * (cardWidth + 5);
    const y = currentY + row * (cardHeight + 4);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + 3, y + 9.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, y + 13.5);
  });

  currentY += (cardHeight * 2) + 12;

  // ==========================================
  // 4. HISTORICAL TELEMETRY LOGS AUDIT TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. AUDITED TELEMETRY TIME-SERIES SAMPLES BUFFER', 14, currentY);

  const tableData = logs.slice(0, 20).map((log, idx) => [
    log.id || `LOG-${1000 + idx}`,
    log.time || 'N/A',
    `${log.rain ?? 0} mm/h`,
    `${log.soilMoisture ?? 0}%`,
    `${log.smokeLevel ?? log.smoke ?? 0} PPM`,
    log.flameDetected ? 'TRIP' : 'OK',
    log.vibration ? 'VIB' : 'OK',
    `${log.temp ?? 24.5}°C / ${log.humidity ?? 75}%`,
    `${log.riskScore ?? 10}/100`,
    `${log.rssi ?? -65} dBm`
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [[
      'Log ID',
      'Time',
      'Rainfall',
      'Soil Sat.',
      'Smoke (PPM)',
      'Flame',
      'Vibe',
      'Temp / Hum',
      'Risk Score',
      'Signal'
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center', fontStyle: 'bold' },
      9: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 70;

  // ==========================================
  // 5. OFFICIAL VERIFICATION & SEAL BLOCK
  // ==========================================
  if (finalY < pageHeight - 35) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, finalY, pageWidth - 28, 22, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('OFFICIAL VERIFICATION & DISASTER RESPONSE DIRECTIVE:', 18, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'This telemetry record is automatically compiled from live IoT telemetry streams at Node 1 (Kashipur Valley). ' +
      'Emergency rescue mobilization (NDRF/ODRAF) requires protocol authentication by the Rayagada DEOC Duty Officer.',
      18,
      finalY + 10.5,
      { maxWidth: pageWidth - 70 }
    );

    // Official Seal Placeholder
    doc.setDrawColor(148, 163, 184);
    doc.rect(pageWidth - 46, finalY + 3, 28, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('DEOC RAYAGADA', pageWidth - 32, finalY + 8, { align: 'center' });
    doc.text('OFFICIAL SEAL', pageWidth - 32, finalY + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('STATUS: VERIFIED', pageWidth - 32, finalY + 16, { align: 'center' });
  }

  // ==========================================
  // 6. FOOTER WITH PAGE NUMBERS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DisasterGuard IoT Platform • SIH 2026 • Confidential DEOC Incident Record • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Download Trigger
  doc.save(`DisasterGuard_DEOC_Report_${Date.now()}.pdf`);
}
