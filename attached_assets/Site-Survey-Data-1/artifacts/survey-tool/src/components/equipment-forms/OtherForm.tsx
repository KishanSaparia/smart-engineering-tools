import type { OtherData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";

interface Props { data: OtherData; onChange: (d: OtherData) => void; }

export function OtherForm({ data, onChange }: Props) {
  const set = (key: keyof OtherData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as OtherData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Equipment Details">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V/kV" placeholder="e.g. 415" />
        <FormField type="input" label="Current Rating" value={data.currentRating} onChange={set("currentRating")} unit="A" placeholder="e.g. 100" />
        <FormField type="input" label="Power Rating" value={data.powerRating} onChange={set("powerRating")} placeholder="e.g. 50 kW / 100 kVA" />
        <FormField type="input" label="Cable Size" value={data.cableSize} onChange={set("cableSize")} placeholder="e.g. 35 mm²" />
        <FormField type="textarea" label="Equipment Description" value={data.description} onChange={set("description")} placeholder="Describe the equipment type and function..." rows={3} className="col-span-3" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
