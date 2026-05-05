/**
 * Electrical Calculator – Reusable Formula Functions
 */

/**
 * Three-phase short circuit current at secondary side.
 * Isc = (kVA × 1000) / (√3 × V_secondary × (Z% / 100))
 * Returns result in Amperes.
 */
export function calcThreePhaseSC(kva: number, voltage: number, impedance: number): number {
  return (kva * 1000) / (Math.sqrt(3) * voltage * (impedance / 100));
}

/**
 * Single-phase short circuit current at secondary side.
 * Isc = (kVA × 1000) / (V_secondary × (Z% / 100))
 * Returns result in Amperes.
 */
export function calcSinglePhaseSC(kva: number, voltage: number, impedance: number): number {
  return (kva * 1000) / (voltage * (impedance / 100));
}

/**
 * Primary side fault current reflected from secondary.
 * Isc_primary = Isc_secondary × (V_secondary / V_primary)
 * Returns result in Amperes.
 */
export function calcPrimaryCurrent(isecAmps: number, vsec: number, vpri: number): number {
  return isecAmps * (vsec / vpri);
}

/** Convert Amperes to kA rounded to 2 decimal places. */
export function toKA(amps: number): number {
  return Math.round((amps / 1000) * 100) / 100;
}
