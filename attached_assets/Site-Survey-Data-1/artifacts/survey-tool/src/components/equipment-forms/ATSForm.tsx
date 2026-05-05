import type { ATSData } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { BaseFields } from "./BaseFields";
import { ATS_TRANSITION, PHASE_OPTIONS } from "../../lib/equipment-config";

interface Props { data: ATSData; onChange: (d: ATSData) => void; }
const CTRL_VOLTAGE = ["110 VAC", "220 VAC", "24 VDC", "48 VDC", "Other"];

export function ATSForm({ data, onChange }: Props) {
  const set = (key: keyof ATSData) => (val: string) => onChange({ ...data, [key]: val });
  const setBase = (key: string, val: string) => onChange({ ...data, [key]: val } as ATSData);
  return (
    <div className="space-y-6">
      <BaseFields data={data} onChange={setBase} />
      <FormSection title="ATS Ratings">
        <FormField type="input" label="Voltage" value={data.voltage} onChange={set("voltage")} unit="V" placeholder="e.g. 415" />
        <FormField type="input" label="Current Rating" value={data.currentRating} onChange={set("currentRating")} unit="A" placeholder="e.g. 400" />
        <FormField type="select" label="Phase Count" value={data.phaseCount} onChange={set("phaseCount")} options={PHASE_OPTIONS} />
        <FormField type="select" label="Transition Type" value={data.transitionType} onChange={set("transitionType")} options={ATS_TRANSITION} />
        <FormField type="input" label="Transfer Time" value={data.transferTime} onChange={set("transferTime")} unit="s" placeholder="e.g. 10" />
        <FormField type="input" label="Re-transfer Time" value={data.retransferTime} onChange={set("retransferTime")} unit="s" placeholder="e.g. 30" />
        <FormField type="select" label="Control Voltage" value={data.controlVoltage} onChange={set("controlVoltage")} options={CTRL_VOLTAGE} />
        <FormField type="input" label="Incoming Cable Size" value={data.incomingCableSize} onChange={set("incomingCableSize")} placeholder="e.g. 185 mm² XLPE" />
      </FormSection>
      <FormSection title="Sources">
        <FormField type="input" label="Normal Source" value={data.normalSource} onChange={set("normalSource")} placeholder="e.g. Utility / MDB-01" />
        <FormField type="input" label="Alternate Source" value={data.alternateSource} onChange={set("alternateSource")} placeholder="e.g. Generator GEN-01" />
      </FormSection>
      <FormField type="textarea" label="Remarks" value={data.remarks} onChange={set("remarks")} rows={3} />
    </div>
  );
}
