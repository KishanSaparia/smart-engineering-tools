export type EquipmentType =
  | "switchgear"
  | "switchboard"
  | "panelboard"
  | "distributionswitch"
  | "mcc"
  | "vfd"
  | "transformer"
  | "generator"
  | "ats"
  | "ups"
  | "other";

export interface PhotoFile {
  id: string;
  label: string;
  preview: string;
  originalName: string;
  sequentialName: string;
  fileType: string;
  fileSize: number;
}

export interface SurveyHeader {
  date: string;
  surveyorName: string;
  projectName: string;
  projectNumber: string;
  client: string;
  location: string;
  notes: string;
}

export interface EquipmentBase {
  id: string;
  type: EquipmentType;
  equipmentName: string;
  tagNumber: string;
  location: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  yearOfManufacture: string;
  condition: string;
  fedFrom: string;
  feedsTo: string;
  remarks: string;
  arcFlashLabel: string;
  photos: PhotoFile[];
}

export interface SwitchgearData extends EquipmentBase {
  type: "switchgear";
  voltage: string;
  mainBusRating: string;
  shortCircuitRating: string;
  numberOfSections: string;
  numberOfFeeders: string;
  breakerType: string;
  incomingCableSize: string;
  busType: string;
  meteringAvailable: string;
  relayType: string;
  ctRatio: string;
  ptRatio: string;
}

export interface SwitchboardData extends EquipmentBase {
  type: "switchboard";
  voltage: string;
  phaseCount: string;
  mainBreakerRating: string;
  mainBreakerType: string;
  busbarRating: string;
  shortCircuitRating: string;
  numberOfCircuits: string;
  incomingCableSize: string;
  meterAvailable: string;
}

export interface PanelboardData extends EquipmentBase {
  type: "panelboard";
  voltage: string;
  phaseCount: string;
  mainBreakerRating: string;
  busbarRating: string;
  numberOfCircuits: string;
  incomingCableSize: string;
  panelType: string;
}

export interface DistributionSwitchData extends EquipmentBase {
  type: "distributionswitch";
  voltage: string;
  currentRating: string;
  interruptingRating: string;
  switchType: string;
  poles: string;
  motorized: string;
  incomingCableSize: string;
}

export interface MCCData extends EquipmentBase {
  type: "mcc";
  voltage: string;
  phaseCount: string;
  mainBusRating: string;
  shortCircuitRating: string;
  numberOfBuckets: string;
  incomingBreakerRating: string;
  incomingBreakerType: string;
  incomingCableSize: string;
  controlVoltage: string;
}

export interface VFDData extends EquipmentBase {
  type: "vfd";
  inputVoltage: string;
  outputVoltage: string;
  powerRating: string;
  inputCurrentRating: string;
  outputCurrentRating: string;
  motorConnected: string;
  motorHP: string;
  controlType: string;
  incomingCableSize: string;
  outputCableSize: string;
  frequency: string;
}

export interface TransformerData extends EquipmentBase {
  type: "transformer";
  kvaRating: string;
  primaryVoltage: string;
  secondaryVoltage: string;
  primaryFLA: string;
  secondaryFLA: string;
  impedance: string;
  connectionType: string;
  coolingType: string;
  tapSetting: string;
  phaseCount: string;
  frequency: string;
  primaryCableSize: string;
  secondaryCableSize: string;
}

export interface GeneratorData extends EquipmentBase {
  type: "generator";
  kvaRating: string;
  kwRating: string;
  voltage: string;
  currentRating: string;
  powerFactor: string;
  frequency: string;
  phaseCount: string;
  speed: string;
  engineType: string;
  fuelType: string;
  excitationType: string;
  avr: string;
  outputCableSize: string;
}

export interface ATSData extends EquipmentBase {
  type: "ats";
  voltage: string;
  currentRating: string;
  phaseCount: string;
  transitionType: string;
  normalSource: string;
  alternateSource: string;
  transferTime: string;
  retransferTime: string;
  controlVoltage: string;
  incomingCableSize: string;
}

export interface UPSData extends EquipmentBase {
  type: "ups";
  kvaRating: string;
  kwRating: string;
  inputVoltage: string;
  outputVoltage: string;
  batteryType: string;
  batteryBackupTime: string;
  topology: string;
  frequency: string;
  efficiency: string;
  incomingCableSize: string;
  outputCableSize: string;
}

export interface OtherData extends EquipmentBase {
  type: "other";
  voltage: string;
  currentRating: string;
  powerRating: string;
  description: string;
  cableSize: string;
}

export type EquipmentData =
  | SwitchgearData
  | SwitchboardData
  | PanelboardData
  | DistributionSwitchData
  | MCCData
  | VFDData
  | TransformerData
  | GeneratorData
  | ATSData
  | UPSData
  | OtherData;

export interface SurveySession {
  id: string;
  header: SurveyHeader;
  equipment: EquipmentData[];
  createdAt: string;
  updatedAt: string;
}
