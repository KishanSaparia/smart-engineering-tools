import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { SurveySession, EquipmentData, EquipmentType } from "../types/survey";
import { EQUIPMENT_LABELS, EQUIPMENT_ABBREV } from "./equipment-config";
import { loadPhoto } from "./indexeddb";

function getEquipmentRows(equipment: EquipmentData[]): Record<string, Record<string, string | number | undefined>[]> {
  const grouped: Record<string, Record<string, string | number | undefined>[]> = {};

  for (const eq of equipment) {
    const type = eq.type as EquipmentType;
    if (!grouped[type]) grouped[type] = [];

    const base: Record<string, string | undefined> = {
      "Equipment Name": eq.equipmentName,
      "Tag Number": eq.tagNumber,
      "Location": eq.location,
      "Manufacturer": eq.manufacturer,
      "Model Number": eq.modelNumber,
      "Serial Number": eq.serialNumber,
      "Year of Manufacture": eq.yearOfManufacture,
      "Condition": eq.condition,
      "Fed From": eq.fedFrom,
      "Feeds To": eq.feedsTo,
      "Arc Flash Label": eq.arcFlashLabel,
    };

    let specific: Record<string, string | undefined> = {};

    switch (eq.type) {
      case "switchgear":
        specific = { "Voltage (kV)": eq.voltage, "Main Bus Rating (A)": eq.mainBusRating, "Short Circuit Rating (kA)": eq.shortCircuitRating, "Number of Sections": eq.numberOfSections, "Number of Feeders": eq.numberOfFeeders, "Breaker Type": eq.breakerType, "Bus Material": eq.busType, "Incoming Cable Size": eq.incomingCableSize, "Metering Available": eq.meteringAvailable, "Relay Type": eq.relayType, "CT Ratio": eq.ctRatio, "PT Ratio": eq.ptRatio };
        break;
      case "switchboard":
        specific = { "Voltage (V)": eq.voltage, "Phase Count": eq.phaseCount, "Main Breaker Rating (A)": eq.mainBreakerRating, "Main Breaker Type": eq.mainBreakerType, "Busbar Rating (A)": eq.busbarRating, "Short Circuit Rating (kA)": eq.shortCircuitRating, "Number of Circuits": eq.numberOfCircuits, "Incoming Cable Size": eq.incomingCableSize, "Metering Available": eq.meterAvailable };
        break;
      case "panelboard":
        specific = { "Voltage (V)": eq.voltage, "Phase Count": eq.phaseCount, "Panel Type": eq.panelType, "Main Breaker Rating (A)": eq.mainBreakerRating, "Busbar Rating (A)": eq.busbarRating, "Number of Circuits": eq.numberOfCircuits, "Incoming Cable Size": eq.incomingCableSize };
        break;
      case "distributionswitch":
        specific = { "Voltage (V/kV)": eq.voltage, "Current Rating (A)": eq.currentRating, "Interrupting Rating (kA)": eq.interruptingRating, "Switch Type": eq.switchType, "Poles": eq.poles, "Motorized": eq.motorized, "Incoming Cable Size": eq.incomingCableSize };
        break;
      case "mcc":
        specific = { "Voltage (V)": eq.voltage, "Phase Count": eq.phaseCount, "Main Bus Rating (A)": eq.mainBusRating, "Short Circuit Rating (kA)": eq.shortCircuitRating, "Number of Buckets": eq.numberOfBuckets, "Incoming Breaker Rating (A)": eq.incomingBreakerRating, "Incoming Breaker Type": eq.incomingBreakerType, "Incoming Cable Size": eq.incomingCableSize, "Control Voltage": eq.controlVoltage };
        break;
      case "vfd":
        specific = { "Input Voltage (V)": eq.inputVoltage, "Output Voltage (V)": eq.outputVoltage, "Power Rating (kW)": eq.powerRating, "Input Current (A)": eq.inputCurrentRating, "Output Current (A)": eq.outputCurrentRating, "Control Type": eq.controlType, "Frequency": eq.frequency, "Motor Connected": eq.motorConnected, "Motor HP/kW": eq.motorHP, "Incoming Cable Size": eq.incomingCableSize, "Output Cable Size": eq.outputCableSize };
        break;
      case "transformer":
        specific = { "kVA Rating": eq.kvaRating, "Primary Voltage (kV)": eq.primaryVoltage, "Secondary Voltage (kV)": eq.secondaryVoltage, "Primary FLA (A)": eq.primaryFLA, "Secondary FLA (A)": eq.secondaryFLA, "Impedance (%)": eq.impedance, "Connection": eq.connectionType, "Cooling": eq.coolingType, "Tap Setting": eq.tapSetting, "Phase Count": eq.phaseCount, "Frequency": eq.frequency, "Primary Cable Size": eq.primaryCableSize, "Secondary Cable Size": eq.secondaryCableSize };
        break;
      case "generator":
        specific = { "kVA Rating": eq.kvaRating, "kW Rating": eq.kwRating, "Voltage (V)": eq.voltage, "Current Rating (A)": eq.currentRating, "Power Factor": eq.powerFactor, "Frequency": eq.frequency, "Phase Count": eq.phaseCount, "Speed (RPM)": eq.speed, "Engine Type": eq.engineType, "Fuel Type": eq.fuelType, "Excitation": eq.excitationType, "AVR Model": eq.avr, "Output Cable Size": eq.outputCableSize };
        break;
      case "ats":
        specific = { "Voltage (V)": eq.voltage, "Current Rating (A)": eq.currentRating, "Phase Count": eq.phaseCount, "Transition Type": eq.transitionType, "Normal Source": eq.normalSource, "Alternate Source": eq.alternateSource, "Transfer Time (s)": eq.transferTime, "Re-transfer Time (s)": eq.retransferTime, "Control Voltage": eq.controlVoltage, "Incoming Cable Size": eq.incomingCableSize };
        break;
      case "ups":
        specific = { "kVA Rating": eq.kvaRating, "kW Rating": eq.kwRating, "Input Voltage (V)": eq.inputVoltage, "Output Voltage (V)": eq.outputVoltage, "Topology": eq.topology, "Efficiency (%)": eq.efficiency, "Frequency": eq.frequency, "Battery Type": eq.batteryType, "Backup Time (min)": eq.batteryBackupTime, "Incoming Cable Size": eq.incomingCableSize, "Output Cable Size": eq.outputCableSize };
        break;
      case "other":
        specific = { "Voltage": eq.voltage, "Current Rating (A)": eq.currentRating, "Power Rating": eq.powerRating, "Cable Size": eq.cableSize, "Description": eq.description };
        break;
    }

    const photoFolderPath = `Photos/${EQUIPMENT_ABBREV[type]}/${eq.equipmentName.replace(/[^a-zA-Z0-9\-_]/g, "_") || eq.id}`;

    grouped[type].push({
      ...base,
      ...specific,
      "Remarks": eq.remarks,
      "Number of Photos": eq.photos.length,
      "Photos Folder": photoFolderPath,
    });
  }

  return grouped;
}

function styleWorksheet(ws: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  ws["!cols"] = Array(range.e.c + 1).fill({ wch: 24 });
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: "1E3A5F" } },
        alignment: { horizontal: "center", wrapText: true },
        border: { bottom: { style: "thin", color: { rgb: "AAAAAA" } } },
      };
    }
  }
}

export async function exportToExcel(session: SurveySession): Promise<void> {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["ELECTRICAL EQUIPMENT SURVEY REPORT"],
    [],
    ["Project Name:", session.header.projectName],
    ["Project Number:", session.header.projectNumber],
    ["Client:", session.header.client],
    ["Date:", session.header.date],
    ["Surveyor:", session.header.surveyorName],
    ["Location:", session.header.location],
    ["Notes:", session.header.notes],
    [],
    ["Equipment Summary:"],
    ["Type", "Count"],
    ...Object.entries(
      session.equipment.reduce((acc, eq) => {
        const lbl = EQUIPMENT_LABELS[eq.type] || eq.type;
        acc[lbl] = (acc[lbl] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
    ["TOTAL", session.equipment.length],
    [],
    ["Export Date:", new Date().toLocaleString()],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 20 }, { wch: 50 }];
  if (summaryWs["A1"]) summaryWs["A1"].s = { font: { bold: true, sz: 14, color: { rgb: "1E3A5F" } } };
  XLSX.utils.book_append_sheet(wb, summaryWs, "Survey Info");

  const grouped = getEquipmentRows(session.equipment);
  for (const [type, rows] of Object.entries(grouped)) {
    if (rows.length === 0) continue;
    const sheetName = (EQUIPMENT_ABBREV[type as EquipmentType] || type).slice(0, 31);
    const headers = Object.keys(rows[0]);
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    styleWorksheet(ws);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const safeProject = (session.header.projectName || "Survey").replace(/[^a-zA-Z0-9\-_]/g, "_");
  const filename = `${safeProject}_${session.header.date || new Date().toISOString().slice(0, 10)}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, filename);
}

export async function exportPhotosAsZip(
  session: SurveySession,
  onProgress?: (pct: number, msg: string) => void
): Promise<void> {
  const zip = new JSZip();
  const safeProject = (session.header.projectName || "Survey").replace(/[^a-zA-Z0-9\-_]/g, "_");
  const root = zip.folder(safeProject)!;
  const photosRoot = root.folder("Photos")!;

  const allPhotos = session.equipment.flatMap(eq =>
    eq.photos.map(p => ({ eq, photo: p }))
  );

  for (let i = 0; i < allPhotos.length; i++) {
    const { eq, photo } = allPhotos[i];
    onProgress?.(Math.round((i / allPhotos.length) * 90), `Packing ${photo.sequentialName}...`);

    const stored = await loadPhoto(photo.id);
    if (!stored) continue;

    const typeAbbrev = EQUIPMENT_ABBREV[eq.type] || "OTHER";
    const safeName = (eq.equipmentName || eq.id).replace(/[^a-zA-Z0-9\-_]/g, "_");

    const eqFolder = photosRoot.folder(typeAbbrev)!.folder(safeName)!;
    eqFolder.file(photo.sequentialName, stored.data);
  }

  onProgress?.(92, "Generating ZIP archive...");
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }, (meta) => {
    onProgress?.(92 + Math.round(meta.percent * 0.08), "Compressing...");
  });

  const filename = `${safeProject}_Photos.zip`;
  saveAs(blob, filename);
  onProgress?.(100, "Done!");
}
