import type { EquipmentType } from "../types/survey";

export const EQUIPMENT_TYPES: {
  type: EquipmentType;
  label: string;
  abbrev: string;
  icon: string;
  description: string;
  color: string;
}[] = [
  { type: "switchgear", label: "Switchgear", abbrev: "SWGR", icon: "⚡", description: "HV/MV switchgear panels", color: "blue" },
  { type: "switchboard", label: "Switchboard", abbrev: "SWBD", icon: "🔳", description: "Main switchboards & SWBD", color: "indigo" },
  { type: "panelboard", label: "Panelboard", abbrev: "PNL", icon: "📋", description: "Distribution panelboards", color: "violet" },
  { type: "distributionswitch", label: "Distribution Switch", abbrev: "DSW", icon: "🔀", description: "Distribution switches", color: "purple" },
  { type: "mcc", label: "Motor Control Center", abbrev: "MCC", icon: "⚙️", description: "MCC lineups & buckets", color: "sky" },
  { type: "vfd", label: "Variable Freq. Drive", abbrev: "VFD", icon: "🔄", description: "VFDs and soft starters", color: "cyan" },
  { type: "transformer", label: "Transformer", abbrev: "XFMR", icon: "🔋", description: "Power & distribution transformers", color: "teal" },
  { type: "generator", label: "Generator", abbrev: "GEN", icon: "🏭", description: "Diesel, gas generators", color: "green" },
  { type: "ats", label: "Auto Transfer Switch", abbrev: "ATS", icon: "🔁", description: "Automatic transfer switches", color: "amber" },
  { type: "ups", label: "UPS System", abbrev: "UPS", icon: "🔆", description: "Uninterruptible power supplies", color: "orange" },
  { type: "other", label: "Other Equipment", abbrev: "OTHER", icon: "🔧", description: "Other / miscellaneous", color: "gray" },
];

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  switchgear: "Switchgear (SWGR)",
  switchboard: "Switchboard (SWBD)",
  panelboard: "Panelboard (PNL)",
  distributionswitch: "Distribution Switch (DSW)",
  mcc: "Motor Control Center (MCC)",
  vfd: "Variable Freq. Drive (VFD)",
  transformer: "Transformer (XFMR)",
  generator: "Generator (GEN)",
  ats: "Auto Transfer Switch (ATS)",
  ups: "UPS System (UPS)",
  other: "Other Equipment",
};

export const EQUIPMENT_ABBREV: Record<EquipmentType, string> = {
  switchgear: "SWGR",
  switchboard: "SWBD",
  panelboard: "PNL",
  distributionswitch: "DSW",
  mcc: "MCC",
  vfd: "VFD",
  transformer: "XFMR",
  generator: "GEN",
  ats: "ATS",
  ups: "UPS",
  other: "OTHER",
};

export const PHOTO_CATEGORIES = [
  "Nameplate",
  "Front View",
  "Interior View",
  "Breaker / Fuse",
  "Bus / Busbar",
  "Cable / Termination",
  "Control Wiring",
  "Relay / Meter",
  "Label / Tag",
  "Damage / Defect",
  "Overview",
  "Other",
];

export const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Critical", "Unknown"];
export const PHASE_OPTIONS = ["1", "3"];
export const FREQUENCY_OPTIONS = ["50 Hz", "60 Hz"];
export const YES_NO = ["Yes", "No"];

export const BREAKER_TYPES = ["ACB", "MCCB", "MCB", "VCB", "SF6", "Air", "Oil", "Fused", "Other"];
export const TRANSFORMER_CONNECTION = ["Dyn11", "Dyn1", "YNyn0", "Dd0", "Yd1", "Yy0", "Other"];
export const COOLING_TYPES = ["ONAN", "ONAF", "OFAN", "OFAF", "AN", "AF", "Other"];
export const UPS_TOPOLOGY = ["Online Double Conversion", "Line Interactive", "Offline / Standby", "Delta Conversion", "Other"];
export const BATTERY_TYPES = ["Sealed Lead Acid (VRLA)", "Lithium Ion", "Flooded Lead Acid", "NiCd", "Other"];
export const ATS_TRANSITION = ["Open Transition", "Closed Transition", "Soft Load Transfer", "Other"];
export const SWITCH_TYPES = ["Fusible", "Non-Fusible", "MCCB", "Motorized", "Bolted Pressure", "Other"];
export const BUS_TYPES = ["Aluminum", "Copper", "Other"];
export const ENGINE_TYPES = ["Diesel", "Natural Gas", "Biogas", "Petrol", "Other"];
export const VFD_CONTROL = ["V/F (Volts/Hz)", "Vector Control", "Direct Torque Control (DTC)", "Other"];
