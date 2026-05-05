import type { SwitchboardData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { BREAKER_TYPES, PHASE_OPTIONS, YES_NO } from "../../lib/equipment-config";

interface Props { data: SwitchboardData; onChange: (d: SwitchboardData) => void; }

export function SwitchboardForm({ data, onChange }: Props) {
  const set = (key: keyof SwitchboardData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as SwitchboardData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Electrical Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="input" label="Main Breaker Rating" value={data.mainBreakerRating} onChange={set("mainBreakerRating")} unit="A" placeholder="e.g. 2000" />
        <FormField type="select" label="Main Breaker Type" value={data.mainBreakerType} onChange={set("mainBreakerType")} options={BREAKER_TYPES} />
        <FormField type="input" label="Busbar Rating" value={data.busbarRating} onChange={set("busbarRating")} unit="A" placeholder="e.g. 2500" />
        <FormField type="input" label="Short Circuit Rating" value={data.shortCircuitRating} onChange={set("shortCircuitRating")} unit="kA" placeholder="e.g. 50" />
        <FormField type="input" label="Number of Circuits" value={data.numberOfCircuits} onChange={set("numberOfCircuits")} placeholder="e.g. 12" />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 2×300 mm² XLPE" />
        <FormField type="select" label="Metering Available" value={data.meterAvailable} onChange={set("meterAvailable")} options={YES_NO} />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
