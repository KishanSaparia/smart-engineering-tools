import type { SwitchgearData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { BREAKER_TYPES, BUS_TYPES, YES_NO } from "../../lib/equipment-config";

interface Props { data: SwitchgearData; onChange: (d: SwitchgearData) => void; }

export function SwitchgearForm({ data, onChange }: Props) {
  const set = (key: keyof SwitchgearData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as SwitchgearData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Electrical Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="kV" placeholder="e.g. 11" />
        <FormField type="input" label="Main Bus Rating" value={data.mainBusRating} onChange={set("mainBusRating")} unit="A" placeholder="e.g. 1250" />
        <FormField type="input" label="Short Circuit Rating" value={data.shortCircuitRating} onChange={set("shortCircuitRating")} unit="kA" placeholder="e.g. 31.5" />
        <FormField type="input" label="Number of Sections" value={data.numberOfSections} onChange={set("numberOfSections")} placeholder="e.g. 3" />
        <FormField type="input" label="Number of Feeders" value={data.numberOfFeeders} onChange={set("numberOfFeeders")} placeholder="e.g. 6" />
        <FormField type="select" label="Breaker Type" value={data.breakerType} onChange={set("breakerType")} options={BREAKER_TYPES} />
        <FormField type="select" label="Bus Material" value={data.busType} onChange={set("busType")} options={BUS_TYPES} />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 3×185 mm² XLPE" />
        <FormField type="select" label="Metering Available" value={data.meteringAvailable} onChange={set("meteringAvailable")} options={YES_NO} />
      </FormSection>
      <FormSection title="Protection & Relays">
        <FormField type="input" label="Relay Type / Model" value={data.relayType} onChange={set("relayType")} placeholder="e.g. SEL-311C, REF615" />
        <FormField type="input" label="CT Ratio" value={data.ctRatio} onChange={set("ctRatio")} placeholder="e.g. 100/1 A" />
        <FormField type="input" label="PT Ratio" value={data.ptRatio} onChange={set("ptRatio")} placeholder="e.g. 11000/110 V" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} placeholder="Additional notes, defects, observations..." rows={3} />
    </div>
  );
}
