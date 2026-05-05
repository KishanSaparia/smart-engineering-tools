/**
 * Full Load Current formulas — Three-Phase only.
 * √3 ≈ 1.7320508075688772
 */

const SQRT3 = Math.sqrt(3);

/** HP → Watts conversion factor */
const HP_TO_WATTS = 746;

/** kW → Watts conversion factor */
const KW_TO_WATTS = 1000;

/** kVA → VA conversion factor */
const KVA_TO_VA = 1000;

/**
 * Three-phase full load current from kW.
 *
 * I = (kW × 1000) / (√3 × V × PF)
 */
export function calcCurrentFromKW(kW: number, voltage: number, pf: number): number {
  return (kW * KW_TO_WATTS) / (SQRT3 * voltage * pf);
}

/**
 * Three-phase full load current from kVA.
 *
 * I = (kVA × 1000) / (√3 × V)
 */
export function calcCurrentFromKVA(kVA: number, voltage: number): number {
  return (kVA * KVA_TO_VA) / (SQRT3 * voltage);
}

/**
 * Three-phase full load current from HP.
 *
 * I = (HP × 746) / (√3 × V × PF)
 */
export function calcCurrentFromHP(hp: number, voltage: number, pf: number): number {
  return (hp * HP_TO_WATTS) / (SQRT3 * voltage * pf);
}
