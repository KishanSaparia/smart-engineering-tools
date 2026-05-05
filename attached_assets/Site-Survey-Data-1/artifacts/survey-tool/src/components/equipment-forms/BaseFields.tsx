import type { EquipmentBase } from "../../types/survey";
import { FormField, FormSection } from "../FormField";
import { CONDITION_OPTIONS } from "../../lib/equipment-config";

interface Props {
  data: EquipmentBase;
  onChange: (key: keyof EquipmentBase, val: string) => void;
}

export function BaseFields({ data, onChange }: Props) {
  const set = (key: keyof EquipmentBase) => (val: string) => onChange(key, val);
  return (
    <>
      <FormSection title="Equipment Identification">
        <FormField type="input" label="Equipment Name / ID" value={data.equipmentName} onChange={set("equipmentName")} required placeholder="e.g. SWGR-001, MDB-A" />
        <FormField type="input" label="Tag Number" value={data.tagNumber} onChange={set("tagNumber")} placeholder="e.g. SWGR-001" />
        <FormField type="input" label="Location" value={data.location} onChange={set("location")} placeholder="e.g. Main Switchroom, B1" />
        <FormField type="input" label="Manufacturer" value={data.manufacturer} onChange={set("manufacturer")} placeholder="e.g. ABB, Schneider" />
        <FormField type="input" label="Model Number" value={data.modelNumber} onChange={set("modelNumber")} />
        <FormField type="input" label="Serial Number" value={data.serialNumber} onChange={set("serialNumber")} />
        <FormField type="input" label="Year of Manufacture" value={data.yearOfManufacture} onChange={set("yearOfManufacture")} inputType="number" placeholder="e.g. 2018" />
        <FormField type="select" label="Condition" value={data.condition} onChange={set("condition")} options={CONDITION_OPTIONS} />
      </FormSection>
      <FormSection title="Connectivity">
        <FormField type="input" label="Fed From" value={data.fedFrom} onChange={set("fedFrom")} placeholder="e.g. TX-01 Secondary" />
        <FormField type="input" label="Feeds To" value={data.feedsTo} onChange={set("feedsTo")} placeholder="e.g. MDB-1, MDB-2" />
        <FormField type="input" label="Arc Flash Label" value={data.arcFlashLabel} onChange={set("arcFlashLabel")} placeholder="e.g. AF-001" />
      </FormSection>
    </>
  );
}
