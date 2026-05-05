import type { UPSData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { UPS_TOPOLOGY, BATTERY_TYPES, FREQUENCY_OPTIONS } from "../../lib/equipment-config";

interface Props { data: UPSData; onChange: (d: UPSData) => void; }

export function UPSForm({ data, onChange }: Props) {
  const set = (key: keyof UPSData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as UPSData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="UPS Ratings">
        <FormField type="input" label="kVA Rating" value={data.kvaRating} onChange={set("kvaRating")} unit="kVA" placeholder="e.g. 40" />
        <FormField type="input" label="kW Rating" value={data.kwRating} onChange={set("kwRating")} unit="kW" placeholder="e.g. 32" />
        <FormField type="input" label="Input Voltage" value={data.inputVoltage} onChange={set("inputVoltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="input" label="Output Voltage" value={data.outputVoltage} onChange={set("outputVoltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="select" label="Topology" value={data.topology} onChange={set("topology")} options={UPS_TOPOLOGY} />
        <FormField type="input" label="Efficiency" value={data.efficiency} onChange={set("efficiency")} unit="%" placeholder="e.g. 96" />
        <FormField type="select" label="Frequency" value={data.frequency} onChange={set("frequency")} options={FREQUENCY_OPTIONS} />
      </FormSection>
      <FormSection title="Battery & Cabling">
        <FormField type="select" label="Battery Type" value={data.batteryType} onChange={set("batteryType")} options={BATTERY_TYPES} />
        <FormField type="input" label="Battery Backup Time" value={data.batteryBackupTime} onChange={set("batteryBackupTime")} unit="min" placeholder="e.g. 30" />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 50 mm²" />
        <FormField type="input" label="Output Cable Size" value={data.outputCableSize} onChange={set("outputCableSize")} placeholder="e.g. 35 mm²" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
