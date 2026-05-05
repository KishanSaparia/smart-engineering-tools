import type { PanelboardData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { PHASE_OPTIONS } from "../../lib/equipment-config";

interface Props { data: PanelboardData; onChange: (d: PanelboardData) => void; }

const PANEL_TYPES = ["Lighting & Appliance", "Power Distribution", "Sub-panel", "Motor Branch Circuit", "Other"];

export function PanelboardForm({ data, onChange }: Props) {
  const set = (key: keyof PanelboardData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as PanelboardData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Electrical Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="select" label="Panel Type" value={data.panelType} onChange={set("panelType")} options={PANEL_TYPES} />
        <FormField type="input" label="Main Breaker Rating" value={data.mainBreakerRating} onChange={set("mainBreakerRating")} unit="A" placeholder="e.g. 200" />
        <FormField type="input" label="Busbar Rating" value={data.busbarRating} onChange={set("busbarRating")} unit="A" placeholder="e.g. 225" />
        <FormField type="input" label="Number of Circuits" value={data.numberOfCircuits} onChange={set("numberOfCircuits")} placeholder="e.g. 24" />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 50 mm² XLPE" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
