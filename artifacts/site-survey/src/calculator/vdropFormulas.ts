/**
 * Voltage Drop Calculator – Formula Functions (AWG / kcmil, Three-Phase)
 */

export type Material = 'copper' | 'aluminum';
export type LengthUnit = 'm' | 'ft';

/** AWG / kcmil conductor table — ordered small → large (highest R → lowest R) */
export const AWG_TABLE: { label: string; key: string; copperR: number }[] = [
  { label: '#14 AWG',   key: '14',   copperR: 8.286 },
  { label: '#12 AWG',   key: '12',   copperR: 5.211 },
  { label: '#10 AWG',   key: '10',   copperR: 3.277 },
  { label: '#8 AWG',    key: '8',    copperR: 2.061 },
  { label: '#6 AWG',    key: '6',    copperR: 1.296 },
  { label: '#4 AWG',    key: '4',    copperR: 0.815 },
  { label: '#3 AWG',    key: '3',    copperR: 0.646 },
  { label: '#2 AWG',    key: '2',    copperR: 0.513 },
  { label: '#1 AWG',    key: '1',    copperR: 0.406 },
  { label: '1/0 AWG',   key: '1/0',  copperR: 0.322 },
  { label: '2/0 AWG',   key: '2/0',  copperR: 0.256 },
  { label: '3/0 AWG',   key: '3/0',  copperR: 0.203 },
  { label: '4/0 AWG',   key: '4/0',  copperR: 0.161 },
  { label: '250 kcmil', key: '250',  copperR: 0.128 },
  { label: '300 kcmil', key: '300',  copperR: 0.107 },
  { label: '350 kcmil', key: '350',  copperR: 0.092 },
  { label: '400 kcmil', key: '400',  copperR: 0.081 },
  { label: '500 kcmil', key: '500',  copperR: 0.064 },
  { label: '600 kcmil', key: '600',  copperR: 0.053 },
  { label: '750 kcmil', key: '750',  copperR: 0.043 },
];

const FEET_PER_KM = 3280.84;

/**
 * Convert input length to meters (internal unit for all calculations).
 */
export function toMeters(length: number, unit: LengthUnit): number {
  return unit === 'ft' ? length * 0.3048 : length;
}

/**
 * Convert meters back to the display unit.
 */
export function fromMeters(meters: number, unit: LengthUnit): number {
  return unit === 'ft' ? meters / 0.3048 : meters;
}

/**
 * Get resistance (Ohm/km) by conductor key and material.
 * Aluminum = Copper × 1.6
 */
export function getResistance(material: Material, sizeKey: string): number {
  const entry = AWG_TABLE.find((e) => e.key === sizeKey);
  if (!entry) throw new Error(`Unknown conductor size: ${sizeKey}`);
  return material === 'aluminum' ? entry.copperR * 1.6 : entry.copperR;
}

/**
 * Three-phase voltage drop.
 * Vd = (√3 × I × L_m × R_ohm_per_km) / 1000
 * @param I  Load current (A)
 * @param Lm Cable length in **meters**
 * @param R  Resistance (Ohm/km)
 */
export function calcThreePhaseVD(I: number, Lm: number, R: number): number {
  return (Math.sqrt(3) * I * Lm * R) / 1000;
}

/**
 * Percentage voltage drop.
 * %Drop = (Vd / Voltage) × 100
 */
export function calculateVoltageDropPercent(Vd: number, voltage: number): number {
  return (Vd / voltage) * 100;
}

/**
 * Maximum allowable cable length (returned in **meters**).
 * Lmax = (Voltage × (allowedPct/100) × 1000) / (√3 × I × R)
 * @param allowedPct  Allowed % drop, e.g. 3 or 5
 */
export function calculateMaxLength(
  I: number,
  voltage: number,
  R: number,
  allowedPct: number,
): number {
  return (voltage * (allowedPct / 100) * 1000) / (Math.sqrt(3) * I * R);
}

/**
 * Find the smallest conductor size where %Drop ≤ allowedPct.
 * Returns the AWG_TABLE entry, or null if none found.
 */
export function getRecommendedCableSize(
  I: number,
  Lm: number,
  voltage: number,
  material: Material,
  allowedPct: number,
): (typeof AWG_TABLE)[number] | null {
  for (const entry of AWG_TABLE) {
    const R = material === 'aluminum' ? entry.copperR * 1.6 : entry.copperR;
    const Vd = calcThreePhaseVD(I, Lm, R);
    const pct = calculateVoltageDropPercent(Vd, voltage);
    if (pct <= allowedPct) return entry;
  }
  return null;
}

/** Lookup label by key */
export function getLabelByKey(key: string): string {
  return AWG_TABLE.find((e) => e.key === key)?.label ?? key;
}

/** Resistance display string (Ohm/km or Ohm/1000ft) */
export function resistanceDisplayUnit(unit: LengthUnit): string {
  return unit === 'ft' ? 'Ω/1000 ft' : 'Ω/km';
}

/**
 * Convert Ohm/km → Ohm/1000ft for display only.
 * 1 km = 3280.84 ft  →  Ohm/1000ft = Ohm/km / 3.28084
 */
export function ohmPerKmToPerKft(r: number): number {
  return r / (FEET_PER_KM / 1000);
}
