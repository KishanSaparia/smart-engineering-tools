import { useState } from "react";
import type { EquipmentData, EquipmentType } from "../types/survey";
import { SwitchgearForm } from "./equipment-forms/SwitchgearForm";
import { SwitchboardForm } from "./equipment-forms/SwitchboardForm";
import { PanelboardForm } from "./equipment-forms/PanelboardForm";
import { DistributionSwitchForm } from "./equipment-forms/DistributionSwitchForm";
import { MCCForm } from "./equipment-forms/MCCForm";
import { VFDForm } from "./equipment-forms/VFDForm";
import { TransformerForm } from "./equipment-forms/TransformerForm";
import { GeneratorForm } from "./equipment-forms/GeneratorForm";
import { ATSForm } from "./equipment-forms/ATSForm";
import { UPSForm } from "./equipment-forms/UPSForm";
import { OtherForm } from "./equipment-forms/OtherForm";
import { PhotoUploader } from "./PhotoUploader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_TYPES } from "../lib/equipment-config";

function createDefault(type: EquipmentType): EquipmentData {
  const base = {
    id: crypto.randomUUID(),
    type,
    equipmentName: "",
    tagNumber: "",
    location: "",
    manufacturer: "",
    modelNumber: "",
    serialNumber: "",
    yearOfManufacture: "",
    condition: "",
    fedFrom: "",
    feedsTo: "",
    arcFlashLabel: "",
    remarks: "",
    photos: [],
  };
  switch (type) {
    case "switchgear": return { ...base, type: "switchgear", voltage: "", mainBusRating: "", shortCircuitRating: "", numberOfSections: "", numberOfFeeders: "", breakerType: "", busType: "", incomingCableSize: "", meteringAvailable: "", relayType: "", ctRatio: "", ptRatio: "" };
    case "switchboard": return { ...base, type: "switchboard", voltage: "", phaseCount: "", mainBreakerRating: "", mainBreakerType: "", busbarRating: "", shortCircuitRating: "", numberOfCircuits: "", incomingCableSize: "", meterAvailable: "" };
    case "panelboard": return { ...base, type: "panelboard", voltage: "", phaseCount: "", mainBreakerRating: "", busbarRating: "", numberOfCircuits: "", incomingCableSize: "", panelType: "" };
    case "distributionswitch": return { ...base, type: "distributionswitch", voltage: "", currentRating: "", interruptingRating: "", switchType: "", poles: "", motorized: "", incomingCableSize: "" };
    case "mcc": return { ...base, type: "mcc", voltage: "", phaseCount: "", mainBusRating: "", shortCircuitRating: "", numberOfBuckets: "", incomingBreakerRating: "", incomingBreakerType: "", incomingCableSize: "", controlVoltage: "" };
    case "vfd": return { ...base, type: "vfd", inputVoltage: "", outputVoltage: "", powerRating: "", inputCurrentRating: "", outputCurrentRating: "", motorConnected: "", motorHP: "", controlType: "", incomingCableSize: "", outputCableSize: "", frequency: "" };
    case "transformer": return { ...base, type: "transformer", kvaRating: "", primaryVoltage: "", secondaryVoltage: "", primaryFLA: "", secondaryFLA: "", impedance: "", connectionType: "", coolingType: "", tapSetting: "", phaseCount: "", frequency: "", primaryCableSize: "", secondaryCableSize: "" };
    case "generator": return { ...base, type: "generator", kvaRating: "", kwRating: "", voltage: "", currentRating: "", powerFactor: "", frequency: "", phaseCount: "", speed: "", engineType: "", fuelType: "", excitationType: "", avr: "", outputCableSize: "" };
    case "ats": return { ...base, type: "ats", voltage: "", currentRating: "", phaseCount: "", transitionType: "", normalSource: "", alternateSource: "", transferTime: "", retransferTime: "", controlVoltage: "", incomingCableSize: "" };
    case "ups": return { ...base, type: "ups", kvaRating: "", kwRating: "", inputVoltage: "", outputVoltage: "", batteryType: "", batteryBackupTime: "", topology: "", frequency: "", efficiency: "", incomingCableSize: "", outputCableSize: "" };
    case "other": return { ...base, type: "other", voltage: "", currentRating: "", powerRating: "", description: "", cableSize: "" };
  }
}

interface Props {
  initialData?: EquipmentData;
  onSave: (data: EquipmentData) => void;
  onCancel: () => void;
  editMode?: boolean;
}

export function EquipmentForm({ initialData, onSave, onCancel, editMode = false }: Props) {
  const [selectedType, setSelectedType] = useState<EquipmentType | null>(initialData?.type || null);
  const [formData, setFormData] = useState<EquipmentData | null>(initialData || null);

  const handleTypeSelect = (type: EquipmentType) => {
    setSelectedType(type);
    setFormData(createDefault(type));
  };

  const handleSave = () => {
    if (formData?.equipmentName.trim()) onSave(formData);
  };

  if (!selectedType || !formData) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Select Equipment Type</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Choose the type of equipment to add to your survey.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {EQUIPMENT_TYPES.map(et => (
            <button
              key={et.type}
              onClick={() => handleTypeSelect(et.type)}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl">{et.icon}</span>
                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{et.abbrev}</span>
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground leading-tight">{et.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{et.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const typeInfo = EQUIPMENT_TYPES.find(t => t.type === selectedType)!;

  const renderForm = () => {
    switch (formData.type) {
      case "switchgear": return <SwitchgearForm data={formData} onChange={d => setFormData(d)} />;
      case "switchboard": return <SwitchboardForm data={formData} onChange={d => setFormData(d)} />;
      case "panelboard": return <PanelboardForm data={formData} onChange={d => setFormData(d)} />;
      case "distributionswitch": return <DistributionSwitchForm data={formData} onChange={d => setFormData(d)} />;
      case "mcc": return <MCCForm data={formData} onChange={d => setFormData(d)} />;
      case "vfd": return <VFDForm data={formData} onChange={d => setFormData(d)} />;
      case "transformer": return <TransformerForm data={formData} onChange={d => setFormData(d)} />;
      case "generator": return <GeneratorForm data={formData} onChange={d => setFormData(d)} />;
      case "ats": return <ATSForm data={formData} onChange={d => setFormData(d)} />;
      case "ups": return <UPSForm data={formData} onChange={d => setFormData(d)} />;
      case "other": return <OtherForm data={formData} onChange={d => setFormData(d)} />;
    }
  };

  const isValid = !!formData.equipmentName.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        {!editMode && (
          <button onClick={() => { setSelectedType(null); setFormData(null); }} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1 shrink-0">
            ← Back
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{typeInfo.icon}</span>
          <span className="font-bold text-foreground">{typeInfo.label}</span>
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{typeInfo.abbrev}</span>
          <Badge variant={editMode ? "default" : "secondary"} className="text-[10px]">{editMode ? "Editing" : "New"}</Badge>
        </div>
      </div>

      <div className="space-y-6">{renderForm()}</div>

      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest px-2">Photo Attachments</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <PhotoUploader
          photos={formData.photos}
          equipmentName={formData.equipmentName}
          onChange={photos => setFormData({ ...formData, photos })}
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={!isValid} className="flex-1">
          {editMode ? "Update Equipment" : "Save Equipment"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="w-28">Cancel</Button>
      </div>
      {!isValid && (
        <p className="text-xs text-destructive text-center -mt-2">Equipment Name / ID is required before saving.</p>
      )}
    </div>
  );
}
