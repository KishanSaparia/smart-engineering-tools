import type { DistributionSwitchData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { SWITCH_TYPES, YES_NO } from "../../lib/equipment-config";

interface Props { data: DistributionSwitchData; onChange: (d: DistributionSwitchData) => void; }
const POLES = ["2", "3", "4"];

export function DistributionSwitchForm({ data, onChange }: Props) {
  const set = (key: keyof DistributionSwitchData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as DistributionSwitchData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Switch Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V/kV" placeholder="e.g. 415 or 11 kV" />
        <FormField type="input" label="Current Rating" value={data.currentRating} onChange={set("currentRating")} unit="A" placeholder="e.g. 800" />
        <FormField type="input" label="Interrupting Rating" value={data.interruptingRating} onChange={set("interruptingRating")} unit="kA" placeholder="e.g. 22" />
        <FormField type="select" label="Switch Type" value={data.switchType} onChange={set("switchType")} options={SWITCH_TYPES} />
        <FormField type="select" label="Number of Poles" value={data.poles} onChange={set("poles")} options={POLES} />
        <FormField type="select" label="Motorized" value={data.motorized} onChange={set("motorized")} options={YES_NO} />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 185 mm²" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
