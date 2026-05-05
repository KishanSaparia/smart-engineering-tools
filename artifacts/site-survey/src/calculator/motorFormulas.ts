import {
  MotorHP,
  MotorVoltage,
  NEC_FLC_TABLE,
  CABLE_RESISTANCE,
  STANDARD_BREAKERS,
  ProtectionDevice,
  PROTECTION_FACTORS
} from './motorTables';

const SQRT3 = Math.sqrt(3);

export type StarterType = 'Not Specified' | 'DOL' | 'Star-Delta' | 'Soft Starter' | 'VFD';

export const STARTER_MULTIPLIERS: Record<StarterType, number> = {
  'Not Specified': 6.0,
  'DOL': 6.0,
  'Star-Delta': 2.5,
  'Soft Starter': 2.0,
  'VFD': 1.5
};

export function getFLCfromTable(hp: MotorHP, voltage: MotorVoltage): number | null {
  const row = NEC_FLC_TABLE[hp];
  if (!row) return null;
  return row[voltage] ?? null;
}

export function calculateOverload(flc: number): number {
  return flc * 1.25;
}

export function calculateBreakerSize(flc: number, device: ProtectionDevice): { calculated: number; standard: number } {
  const factor = PROTECTION_FACTORS[device];
  const calculated = flc * factor;
  const standard = STANDARD_BREAKERS.find(s => s >= calculated) || calculated;
  return { calculated, standard };
}

export function calculateStartingCurrent(flc: number, starterType: StarterType): number {
  return flc * STARTER_MULTIPLIERS[starterType];
}

export interface VoltageDropResult {
  dropVolts: number;
  dropPercent: number;
}

/**
 * Calculates voltage drop percentage using the formula: Vd = (√3 × I × L × R) / 1000
 */
export function calculateVoltageDrop(current: number, voltage: number, lengthKm: number, size: string, runs: number = 1): VoltageDropResult | null {
  const r = CABLE_RESISTANCE[size];
  if (r === undefined) return null;
  
  const vd = (SQRT3 * current * lengthKm * r) / runs; // Wait, formula in user prompt: Vd = √3 × I × L_km × R_effective
  const dropPercent = (vd / voltage) * 100;
  
  return {
    dropVolts: vd,
    dropPercent: dropPercent
  };
}
