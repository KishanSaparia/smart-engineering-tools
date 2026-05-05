import type { MCCData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { BREAKER_TYPES, PHASE_OPTIONS } from "../../lib/equipment-config";

interface Props { data: MCCData; onChange: (d: MCCData) => void; }
const CONTROL_VOLTAGE = ["110 VAC", "220 VAC", "24 VDC", "48 VDC", "Other"];

export function MCCForm({ data, onChange }: Props) {
  const set = (key: keyof MCCData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as MCCData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="MCC Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="input" label="Main Bus Rating" value={data.mainBusRating} onChange={set("mainBusRating")} unit="A" placeholder="e.g. 1600" />
        <FormField type="input" label="Short Circuit Rating" value={data.shortCircuitRating} onChange={set("shortCircuitRating")} unit="kA" placeholder="e.g. 50" />
        <FormField type="input" label="Number of Buckets/Starters" value={data.numberOfBuckets} onChange={set("numberOfBuckets")} placeholder="e.g. 12" />
        <FormField type="input" label="Incoming Breaker Rating" value={data.incomingBreakerRating} onChange={set("incomingBreakerRating")} unit="A" placeholder="e.g. 1600" />
        <FormField type="select" label="Incoming Breaker Type" value={data.incomingBreakerType} onChange={set("incomingBreakerType")} options={BREAKER_TYPES} />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 2×240 mm²" />
        <FormField type="select" label="Control Voltage" value={data.controlVoltage} onChange={set("controlVoltage")} options={CONTROL_VOLTAGE} />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
