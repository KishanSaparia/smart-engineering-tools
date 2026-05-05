import type { GeneratorData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { PHASE_OPTIONS, FREQUENCY_OPTIONS, ENGINE_TYPES } from "../../lib/equipment-config";

interface Props { data: GeneratorData; onChange: (d: GeneratorData) => void; }
const FUEL_TYPES = ["Diesel", "Natural Gas", "LPG", "Petrol", "Other"];
const EXCITATION = ["Self-Excited", "Separately Excited", "Brushless", "PMG", "Other"];

export function GeneratorForm({ data, onChange }: Props) {
  const set = (key: keyof GeneratorData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as GeneratorData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="Generator Ratings">
        <FormField type="input" label="kVA Rating" value={data.kvaRating} onChange={set("kvaRating")} unit="kVA" placeholder="e.g. 500" />
        <FormField type="input" label="kW Rating" value={data.kwRating} onChange={set("kwRating")} unit="kW" placeholder="e.g. 400" />
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="input" label="Current Rating" value={data.currentRating} onChange={set("currentRating")} unit="A" placeholder="e.g. 695" />
        <FormField type="input" label="Power Factor" value={data.powerFactor} onChange={set("powerFactor")} placeholder="e.g. 0.8 lag" />
        <FormField type="select" label="Frequency" value={data.frequency} onChange={set("frequency")} options={FREQUENCY_OPTIONS} />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="input" label="Speed" value={data.speed} onChange={set("speed")} unit="RPM" placeholder="e.g. 1500" />
      </FormSection>
      <FormSection title="Engine & Control">
        <FormField type="select" label="Engine Type" value={data.engineType} onChange={set("engineType")} options={ENGINE_TYPES} />
        <FormField type="select" label="Fuel Type" value={data.fuelType} onChange={set("fuelType")} options={FUEL_TYPES} />
        <FormField type="select" label="Excitation Type" value={data.excitationType} onChange={set("excitationType")} options={EXCITATION} />
        <FormField type="input" label="AVR Model" value={data.avr} onChange={set("avr")} placeholder="e.g. Basler AVC63-4" />
        <FormField type="input" label="Output Cable Size" value={data.outputCableSize} onChange={set("outputCableSize")} placeholder="e.g. 2×240 mm² XLPE" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
