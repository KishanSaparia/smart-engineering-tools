import type { EquipmentEntry, EquipmentType } from './db';
import { EQUIPMENT_LABELS } from './db';
import { getSections } from './equipment-fields';

export const EQUIPMENT_META: Record<EquipmentType, { icon: string; category: 'Power' | 'Control' | 'Mechanical' | 'Other'; hint: string }> = {
  SWITCHGEAR: { icon: '/equipment-icons/swgr.png', category: 'Power', hint: 'Main distribution and protection' },
  SWITCHBOARD: { icon: '/equipment-icons/swbd.png', category: 'Power', hint: 'Power panel and feeders' },
  PANEL: { icon: '/equipment-icons/pnl.png', category: 'Power', hint: 'Lighting and branch distribution' },
  TRANSFORMER: { icon: '/equipment-icons/xfmr.png', category: 'Power', hint: 'Voltage conversion details' },
  DISCONNECT_SWITCH: { icon: '/equipment-icons/dsw.png', category: 'Power', hint: 'Isolation and lockout points' },
  ENCLOSED_CIRCUIT_BREAKER: { icon: '/equipment-icons/ecb.png', category: 'Power', hint: 'Breaker enclosure and ratings' },
  MOTOR_CONTROL_CENTER: { icon: '/equipment-icons/mcc.png', category: 'Control', hint: 'MCC buckets and feeders' },
  VARIABLE_FREQUENCY_DRIVE: { icon: '/equipment-icons/vfd.png', category: 'Control', hint: 'Drive setup and operating range' },
  MOTOR: { icon: '⚙️', category: 'Mechanical', hint: 'Motor nameplate and loading' },
  GENERATOR: { icon: '/equipment-icons/gen.png', category: 'Power', hint: 'Generator output and controls' },
  AUTOMATIC_TRANSFER_SWITCH: { icon: '/equipment-icons/ats.png', category: 'Control', hint: 'Source transfer behavior' },
  UNINTERRUPTIBLE_POWER_SUPPLY: { icon: '/equipment-icons/ups.png', category: 'Power', hint: 'Backup runtime and load' },
  UNKNOWN_EQUIPMENT: { icon: '❓', category: 'Other', hint: 'Custom equipment capture' },
};

export function getEquipmentCompletion(entry: EquipmentEntry): number {
  const fields = getSections(entry.type, entry.data).flatMap((section) => section.fields);
  const requiredFields = fields.filter((field) => field.required);
  if (requiredFields.length === 0) return 100;
  const filled = requiredFields.filter((field) => entry.data[field.name]?.trim()).length;
  return Math.round((filled / requiredFields.length) * 100);
}

export function getEquipmentDisplay(type: EquipmentType): string {
  return `${EQUIPMENT_META[type].icon} ${EQUIPMENT_LABELS[type]}`;
}
