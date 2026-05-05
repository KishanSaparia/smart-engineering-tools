import type { EquipmentType } from './db';

export interface FieldDef {
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'dropdown';
  options?: string[];
  section: string;
  condition?: {
    field: string;
    value: string | string[];
  };
}

const BASIC_INFO_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Name', required: true, type: 'text', section: 'Basic Information' },
  { name: 'roomNo', label: 'Room No.', required: false, type: 'text', section: 'Basic Information' },
  { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'Basic Information' },
  { name: 'voltageLevel', label: 'Voltage Level', required: true, type: 'text', section: 'Basic Information' },
];

const CABLE_INFO_FIELDS: FieldDef[] = [
  { name: 'cablePhase', label: 'Cable Phase', required: false, type: 'text', section: 'Cable Information' },
  { name: 'noOfWires', label: 'No. of Wires', required: false, type: 'text', section: 'Cable Information' },
  { name: 'noOfParallelPath', label: 'No. of Parallel Path', required: false, type: 'text', section: 'Cable Information' },
  { name: 'cableSize', label: 'Cable Size', required: false, type: 'text', section: 'Cable Information' },
  { name: 'cableLength', label: 'Cable Length', required: false, type: 'text', section: 'Cable Information' },
];

const BUS_INFO_FIELDS: FieldDef[] = [
  { name: 'busManufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'Bus Information' },
  { name: 'busType', label: 'Type', required: false, type: 'text', section: 'Bus Information' },
  { name: 'ampacity', label: 'Ampacity', required: true, type: 'text', section: 'Bus Information' },
  { name: 'aicSccr', label: 'AIC/SCCR', required: true, type: 'text', section: 'Bus Information' },
];

const MLO_MAIN_FIELD = (sectionLabel: string): FieldDef => ({
  name: 'mloMain',
  label: 'MLO/MAIN',
  required: true,
  type: 'dropdown',
  options: ['MLO', 'MAIN'],
  section: sectionLabel,
});

const MAIN_BREAKER_FIELDS = (sectionLabel: string): FieldDef[] => [
  { name: 'mbManuf', label: 'MB Manufacturer', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'mbType', label: 'MB Type', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'mbAmps', label: 'MB Amps', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'mbAic', label: 'MB AIC', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p51p1p', label: '51P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p51p1d', label: '51P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p50p1p', label: '50P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p50p1d', label: '50P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'i2t', label: 'I\u00B2T', required: false, type: 'dropdown', options: ['ON', 'OFF'], section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'inst', label: 'INST', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p50g1p', label: '50G1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
  { name: 'p50g1d', label: '50G1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'MAIN' } },
];

const ARC_FLASH_FIELDS: FieldDef[] = [
  { name: 'arcFlashLabel', label: 'Arc Flash Label Available?', required: true, type: 'dropdown', options: ['Yes', 'No'], section: 'Previous Arc Flash Data' },
  { name: 'equipmentNameAsPerLabel', label: 'Equipment Name As per Label', required: false, type: 'text', section: 'Previous Arc Flash Data', condition: { field: 'arcFlashLabel', value: 'Yes' } },
  { name: 'arcFlashLabelsRequired', label: 'How Many Arc Flash Labels Required?', required: false, type: 'number', section: 'Arc Flash Label Requirements' },
  { name: 'genericArcFlashLabelsRequired', label: 'How Many Generic Arc Flash Labels Required?', required: false, type: 'number', section: 'Arc Flash Label Requirements' },
];

const REMARKS_FIELD: FieldDef = {
  name: 'remarks', label: 'Remarks', required: false, type: 'text', section: 'Remarks',
};

export const EQUIPMENT_FIELDS: Record<EquipmentType, FieldDef[]> = {
  SWITCHGEAR: [
    ...BASIC_INFO_FIELDS,
    ...CABLE_INFO_FIELDS,
    ...BUS_INFO_FIELDS,
    { name: 'mloMain', label: 'MLO (YES/NO)', required: true, type: 'dropdown', options: ['MLO', 'MAIN'], section: 'Type of the SWGR' },
    { name: 'mbManuf', label: 'MB Manufacturer', required: true, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'mbType', label: 'MB Type', required: true, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'mbAmps', label: 'MB Amps', required: true, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'mbAic', label: 'MB AIC', required: true, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p51p1p', label: '51P1P', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p51p1d', label: '51P1D', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p50p1p', label: '50P1P', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p50p1d', label: '50P1D', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'i2t', label: 'I\u00B2T', required: false, type: 'dropdown', options: ['ON', 'OFF'], section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'inst', label: 'INST', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p50g1p', label: '50G1P', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    { name: 'p50g1d', label: '50G1D', required: false, type: 'text', section: 'Type of the SWGR', condition: { field: 'mloMain', value: 'MAIN' } },
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],

  SWITCHBOARD: [
    ...BASIC_INFO_FIELDS,
    ...CABLE_INFO_FIELDS,
    ...BUS_INFO_FIELDS,
    MLO_MAIN_FIELD('Type of the SWBD'),
    ...MAIN_BREAKER_FIELDS('Type of the SWBD'),
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],

  PANEL: [
    ...BASIC_INFO_FIELDS,
    ...CABLE_INFO_FIELDS,
    ...BUS_INFO_FIELDS,
    MLO_MAIN_FIELD('Type of the Panel'),
    ...MAIN_BREAKER_FIELDS('Type of the Panel'),
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],

  TRANSFORMER: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'Basic Information' },
    { name: 'roomCloset', label: 'Room/Closet', required: false, type: 'text', section: 'Basic Information' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'Basic Information' },
    { name: 'feeds', label: 'Feeds', required: true, type: 'text', section: 'Basic Information' },
    { name: 'cablePhase', label: 'Cable Phase', required: false, type: 'text', section: 'Cable Information' },
    { name: 'noOfWires', label: 'No. of Wires', required: false, type: 'text', section: 'Cable Information' },
    { name: 'noOfParallelPath', label: 'No. of Parallel Path', required: false, type: 'text', section: 'Cable Information' },
    { name: 'cableSize', label: 'Cable Size', required: false, type: 'text', section: 'Cable Information' },
    { name: 'cableLength', label: 'Cable Length', required: false, type: 'text', section: 'Cable Information' },
    { name: 'priVoltage', label: 'Pri Voltage', required: true, type: 'text', section: 'Name Plate Information' },
    { name: 'secVoltage', label: 'Sec Voltage', required: true, type: 'text', section: 'Name Plate Information' },
    { name: 'connection', label: 'Connection', required: true, type: 'dropdown', options: ['Delta-Delta', 'Star-Star', 'Star-Delta', 'Delta-Star'], section: 'Name Plate Information' },
    { name: 'noLoadKva', label: 'No Load KVA', required: false, type: 'text', section: 'Name Plate Information' },
    { name: 'fullLoadKva', label: 'Full Load KVA', required: true, type: 'text', section: 'Name Plate Information' },
    { name: 'percentZ', label: '%Z', required: true, type: 'text', section: 'Name Plate Information' },
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],

  DISCONNECT_SWITCH: [
    { name: 'dswType', label: 'Type', required: true, type: 'dropdown', options: ['DSW', 'Fused DSW'], section: 'Disconnect Switch Info' },
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'roomCloset', label: 'Room/Closet', required: false, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'amps', label: 'Amps', required: true, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'manufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'type', label: 'Type', required: false, type: 'text', section: 'Disconnect Switch Info' },
    { name: 'fuseRating', label: 'Fuse Rating', required: true, type: 'text', section: 'Fuse Data', condition: { field: 'dswType', value: 'Fused DSW' } },
    { name: 'fuseManufacturer', label: 'Fuse Manufacturer', required: true, type: 'text', section: 'Fuse Data', condition: { field: 'dswType', value: 'Fused DSW' } },
    { name: 'fuseModel', label: 'Fuse Model', required: true, type: 'text', section: 'Fuse Data', condition: { field: 'dswType', value: 'Fused DSW' } },
    ...ARC_FLASH_FIELDS,
  ],

  ENCLOSED_CIRCUIT_BREAKER: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'roomCloset', label: 'Room/Closet', required: false, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'manufacturer', label: 'Manufacturer', required: true, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'cbType', label: 'Type', required: true, type: 'text', section: 'Circuit Breaker Info' },
    { name: 'mbAmpsAt', label: 'MB Amps AT', required: true, type: 'text', section: 'Breaker Data' },
    { name: 'mbAmpsAf', label: 'MB Amps AF', required: true, type: 'text', section: 'Breaker Data' },
    { name: 'mbAic', label: 'MB AIC', required: true, type: 'text', section: 'Breaker Data' },
    { name: 'mbModel', label: 'MB Model', required: true, type: 'text', section: 'Breaker Data' },
    { name: 'p51p1p', label: '51P1P', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'p51p1d', label: '51P1D', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'p50p1p', label: '50P1P', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'p50p1d', label: '50P1D', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'i2t', label: 'I\u00B2T', required: false, type: 'dropdown', options: ['ON', 'OFF'], section: 'Breaker Data' },
    { name: 'inst', label: 'INST', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'p50g1p', label: '50G1P', required: false, type: 'text', section: 'Breaker Data' },
    { name: 'p50g1d', label: '50G1D', required: false, type: 'text', section: 'Breaker Data' },
    ...ARC_FLASH_FIELDS,
  ],

  MOTOR_CONTROL_CENTER: [
    ...BASIC_INFO_FIELDS,
    ...CABLE_INFO_FIELDS,
    ...BUS_INFO_FIELDS,
    MLO_MAIN_FIELD('Type of the MCC'),
    ...MAIN_BREAKER_FIELDS('Type of the MCC'),
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],

  VARIABLE_FREQUENCY_DRIVE: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'VFD Information' },
    { name: 'roomNo', label: 'Room No.', required: false, type: 'text', section: 'VFD Information' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'VFD Information' },
    { name: 'voltageLevel', label: 'Voltage Level', required: true, type: 'text', section: 'VFD Information' },
    { name: 'cablePhase', label: 'Cable Phase', required: false, type: 'text', section: 'Cable Information' },
    { name: 'noOfWires', label: 'No. of Wires', required: false, type: 'text', section: 'Cable Information' },
    { name: 'noOfParallelPath', label: 'No. of Parallel Path', required: false, type: 'text', section: 'Cable Information' },
    { name: 'cableSize', label: 'Cable Size', required: false, type: 'text', section: 'Cable Information' },
    { name: 'cableLength', label: 'Cable Length', required: false, type: 'text', section: 'Cable Information' },
    { name: 'vfdManufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'VFD Details' },
    { name: 'vfdType', label: 'Type', required: false, type: 'text', section: 'VFD Details' },
    { name: 'vfdHpKva', label: 'VFD HP/KVA', required: true, type: 'text', section: 'VFD Details' },
    { name: 'connectedMotorLoad', label: 'Connected Motor Load KVA/HP', required: true, type: 'text', section: 'VFD Details' },
    { name: 'upstreamBreakerAmp', label: 'Upstream Breaker Amp.', required: true, type: 'text', section: 'VFD Details' },
    ...ARC_FLASH_FIELDS,
  ],

  MOTOR: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'Motor Information' },
    { name: 'roomNo', label: 'Room No.', required: false, type: 'text', section: 'Motor Information' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'Motor Information' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'Motor Information' },
    { name: 'hp', label: 'HP', required: true, type: 'text', section: 'Motor Information' },
    { name: 'powerFactor', label: 'Power Factor', required: true, type: 'text', section: 'Motor Information' },
    ...ARC_FLASH_FIELDS,
  ],

  GENERATOR: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'Generator Information' },
    { name: 'roomCloset', label: 'Room/Closet', required: false, type: 'text', section: 'Generator Information' },
    { name: 'feedsTo', label: 'Feeds To', required: true, type: 'text', section: 'Generator Information' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'Generator Information' },
    { name: 'kva', label: 'KVA', required: true, type: 'text', section: 'Generator Information' },
    { name: 'pf', label: 'Power Factor', required: true, type: 'text', section: 'Generator Information' },
    { name: 'xd', label: 'Xd', required: false, type: 'text', section: 'Generator Information' },
    { name: 'xdPrime', label: "X'd", required: false, type: 'text', section: 'Generator Information' },
    { name: 'xdDoublePrime', label: "X''d", required: false, type: 'text', section: 'Generator Information' },
    { name: 'genManufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'Generator Information' },
    { name: 'mloMain', label: 'MLO (YES/NO)', required: true, type: 'dropdown', options: ['YES', 'NO'], section: 'Generator Breaker' },
    { name: 'mbManuf', label: 'MB Manufacturer', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbType', label: 'MB Type', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbAmps', label: 'MB Amps', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbAic', label: 'MB AIC', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p51p1p', label: '51P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p51p1d', label: '51P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50p1p', label: '50P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50p1d', label: '50P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'i2t', label: 'I\u00B2T', required: false, type: 'dropdown', options: ['ON', 'OFF'], section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'inst', label: 'INST', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50g1p', label: '50G1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50g1d', label: '50G1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    ...ARC_FLASH_FIELDS,
  ],

  AUTOMATIC_TRANSFER_SWITCH: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'ATS Information' },
    { name: 'roomNo', label: 'Room No.', required: false, type: 'text', section: 'ATS Information' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'ATS Information' },
    { name: 'fedFromN', label: 'Fed From (N)', required: true, type: 'text', section: 'ATS Information' },
    { name: 'fedFromE', label: 'Fed From (E)', required: true, type: 'text', section: 'ATS Information' },
    { name: 'feedsTo', label: 'Feeds To', required: true, type: 'text', section: 'ATS Information' },
    { name: 'atsManufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'ATS Details' },
    { name: 'atsModel', label: 'Model', required: false, type: 'text', section: 'ATS Details' },
    { name: 'atsAmpacity', label: 'Ampacity', required: true, type: 'text', section: 'ATS Details' },
    { name: 'atsAic', label: 'AIC', required: true, type: 'text', section: 'ATS Details' },
    ...ARC_FLASH_FIELDS,
  ],

  UNINTERRUPTIBLE_POWER_SUPPLY: [
    { name: 'name', label: 'Name', required: true, type: 'text', section: 'UPS Information' },
    { name: 'roomCloset', label: 'Room/Closet', required: false, type: 'text', section: 'UPS Information' },
    { name: 'feedsTo', label: 'Feeds To', required: true, type: 'text', section: 'UPS Information' },
    { name: 'fedFrom', label: 'Fed From', required: true, type: 'text', section: 'UPS Information' },
    { name: 'voltage', label: 'Voltage', required: true, type: 'text', section: 'UPS Information' },
    { name: 'kvaKw', label: 'KVA/KW', required: true, type: 'text', section: 'UPS Information' },
    { name: 'upsManufacturer', label: 'Manufacturer', required: false, type: 'text', section: 'UPS Information' },
    { name: 'upsType', label: 'Type', required: false, type: 'text', section: 'UPS Information' },
    { name: 'upsAic', label: 'AIC', required: true, type: 'text', section: 'UPS Information' },
    { name: 'mloMain', label: 'MLO (YES/NO)', required: true, type: 'dropdown', options: ['YES', 'NO'], section: 'UPS Breaker' },
    { name: 'mbManuf', label: 'MB Manufacturer', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbType', label: 'MB Type', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbAmps', label: 'MB Amps', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'mbAic', label: 'MB AIC', required: true, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p51p1p', label: '51P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p51p1d', label: '51P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50p1p', label: '50P1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50p1d', label: '50P1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'i2t', label: 'I\u00B2T', required: false, type: 'dropdown', options: ['ON', 'OFF'], section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'inst', label: 'INST', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50g1p', label: '50G1P', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    { name: 'p50g1d', label: '50G1D', required: false, type: 'text', section: 'Main Breaker Data', condition: { field: 'mloMain', value: 'NO' } },
    ...ARC_FLASH_FIELDS,
  ],

  UNKNOWN_EQUIPMENT: [
    ...BASIC_INFO_FIELDS,
    ...CABLE_INFO_FIELDS,
    ...BUS_INFO_FIELDS,
    MLO_MAIN_FIELD('Type of the Equipment'),
    ...MAIN_BREAKER_FIELDS('Type of the Equipment'),
    ...ARC_FLASH_FIELDS,
    REMARKS_FIELD,
  ],
};

export function getVisibleFields(type: EquipmentType, data: Record<string, string>): FieldDef[] {
  return EQUIPMENT_FIELDS[type].filter((f) => {
    if (!f.condition) return true;
    const condValue = data[f.condition.field] || '';
    if (Array.isArray(f.condition.value)) {
      return f.condition.value.includes(condValue);
    }
    return condValue === f.condition.value;
  });
}

export function getSections(type: EquipmentType, data: Record<string, string>): { section: string; fields: FieldDef[] }[] {
  const visible = getVisibleFields(type, data);
  const sectionMap = new Map<string, FieldDef[]>();
  const sectionOrder: string[] = [];
  for (const f of visible) {
    if (!sectionMap.has(f.section)) {
      sectionMap.set(f.section, []);
      sectionOrder.push(f.section);
    }
    sectionMap.get(f.section)!.push(f);
  }
  return sectionOrder.map((s) => ({ section: s, fields: sectionMap.get(s)! }));
}
