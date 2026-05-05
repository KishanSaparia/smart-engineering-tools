import type { TransformerData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { TRANSFORMER_CONNECTION, COOLING_TYPES, PHASE_OPTIONS, FREQUENCY_OPTIONS } from "../../lib/equipment-config";

interface Props { data: TransformerData; onChange: (d: TransformerData) => void; }

export function TransformerForm({ data, onChange }: Props) {
  const set = (key: keyof TransformerData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as TransformerData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Transformer Ratings">
        <FormField type="input" label="kVA Rating" value={data.kvaRating} onChange={set("kvaRating")} unit="kVA" placeholder="e.g. 1000" />
        <FormField type="input" label="Primary Voltage" value={data.primaryVoltage} onChange={set("primaryVoltage")} unit="kV" placeholder="e.g. 11" />
        <FormField type="input" label="Secondary Voltage" value={data.secondaryVoltage} onChange={set("secondaryVoltage")} unit="kV" placeholder="e.g. 0.415" />
        <FormField type="input" label="Primary FLA" value={data.primaryFLA} onChange={set("primaryFLA")} unit="A" placeholder="e.g. 52.5" />
        <FormField type="input" label="Secondary FLA" value={data.secondaryFLA} onChange={set("secondaryFLA")} unit="A" placeholder="e.g. 1393" />
        <FormField type="input" label="Impedance (%Z)" value={data.impedance} onChange={set("impedance")} unit="%" placeholder="e.g. 5.75" />
        <FormField type="select" label="Connection Type" value={data.connectionType} onChange={set("connectionType")} options={TRANSFORMER_CONNECTION} />
        <FormField type="select" label="Cooling Type" value={data.coolingType} onChange={set("coolingType")} options={COOLING_TYPES} />
        <FormField type="input" label="Tap Setting" value={data.tapSetting} onChange={set("tapSetting")} placeholder="e.g. Nominal / +5%" />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="select" label="Frequency" value={data.frequency} onChange={set("frequency")} options={FREQUENCY_OPTIONS} />
      </FormSection>
      <FormSection title="Cabling">
        <FormField type="input" label="Primary Cable Size" value={data.primaryCableSize} onChange={set("primaryCableSize")} placeholder="e.g. 3×35 mm² XLPE" />
        <FormField type="input" label="Secondary Cable Size" value={data.secondaryCableSize} onChange={set("secondaryCableSize")} placeholder="e.g. 4×300 mm² XLPE" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
