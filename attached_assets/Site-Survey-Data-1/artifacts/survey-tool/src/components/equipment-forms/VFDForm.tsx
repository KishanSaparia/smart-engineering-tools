import type { VFDData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { FREQUENCY_OPTIONS, VFD_CONTROL } from "../../lib/equipment-config";

interface Props { data: VFDData; onChange: (d: VFDData) => void; }

export function VFDForm({ data, onChange }: Props) {
  const set = (key: keyof VFDData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as VFDData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="VFD Ratings">
        <FormField type="input" label="Input Voltage" value={data.inputVoltage} onChange={set("inputVoltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="input" label="Output Voltage" value={data.outputVoltage} onChange={set("outputVoltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="input" label="Power Rating" value={data.powerRating} onChange={set("powerRating")} unit="kW" placeholder="e.g. 75" />
        <FormField type="input" label="Input Current Rating" value={data.inputCurrentRating} onChange={set("inputCurrentRating")} unit="A" placeholder="e.g. 148" />
        <FormField type="input" label="Output Current Rating" value={data.outputCurrentRating} onChange={set("outputCurrentRating")} unit="A" placeholder="e.g. 155" />
        <FormField type="select" label="Control Type" value={data.controlType} onChange={set("controlType")} options={VFD_CONTROL} />
        <FormField type="select" label="Frequency" value={data.frequency} onChange={set("frequency")} options={FREQUENCY_OPTIONS} />
      </FormSection>
      <FormSection title="Motor & Cabling">
        <FormField type="input" label="Motor Connected" value={data.motorConnected} onChange={set("motorConnected")} placeholder="e.g. MTR-01 Pump Motor" />
        <FormField type="input" label="Motor HP / kW" value={data.motorHP} onChange={set("motorHP")} placeholder="e.g. 100 HP / 75 kW" />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 95 mm²" />
        <FormField type="input" label="Output Cable Size" value={data.outputCableSize} onChange={set("outputCableSize")} placeholder="e.g. 95 mm²" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
