/**
 * NEC Table 310.15(B)(16) — Ampacity Data
 * Systems up to 2000V — Copper & Aluminum conductors
 */

export type TempRating = 60 | 75 | 90;
export type ConductorMaterial = 'copper' | 'aluminum';

export interface NecEntry {
  /** Display label, e.g. "#14 AWG" or "250 kcmil" */
  label: string;
  /** Lookup key */
  key: string;
  /** Copper ampacity at each temperature rating */
  copper: Record<TempRating, number>;
}

/**
 * NEC 310.15(B)(16) copper ampacity data, ordered smallest → largest.
 * Aluminum = Copper × 0.8
 */
export const NEC_TABLE: NecEntry[] = [
  { label: '#14 AWG',   key: '14',   copper: { 60: 15,  75: 20,  90: 25  } },
  { label: '#12 AWG',   key: '12',   copper: { 60: 20,  75: 25,  90: 30  } },
  { label: '#10 AWG',   key: '10',   copper: { 60: 30,  75: 35,  90: 40  } },
  { label: '#8 AWG',    key: '8',    copper: { 60: 40,  75: 50,  90: 55  } },
  { label: '#6 AWG',    key: '6',    copper: { 60: 55,  75: 65,  90: 75  } },
  { label: '#4 AWG',    key: '4',    copper: { 60: 70,  75: 85,  90: 95  } },
  { label: '#3 AWG',    key: '3',    copper: { 60: 85,  75: 100, 90: 115 } },
  { label: '#2 AWG',    key: '2',    copper: { 60: 95,  75: 115, 90: 130 } },
  { label: '#1 AWG',    key: '1',    copper: { 60: 110, 75: 130, 90: 145 } },
  { label: '1/0 AWG',   key: '1/0',  copper: { 60: 125, 75: 150, 90: 170 } },
  { label: '2/0 AWG',   key: '2/0',  copper: { 60: 145, 75: 175, 90: 195 } },
  { label: '3/0 AWG',   key: '3/0',  copper: { 60: 165, 75: 200, 90: 225 } },
  { label: '4/0 AWG',   key: '4/0',  copper: { 60: 195, 75: 230, 90: 260 } },
  { label: '250 kcmil', key: '250',  copper: { 60: 215, 75: 255, 90: 290 } },
  { label: '300 kcmil', key: '300',  copper: { 60: 240, 75: 285, 90: 320 } },
  { label: '350 kcmil', key: '350',  copper: { 60: 260, 75: 310, 90: 350 } },
  { label: '400 kcmil', key: '400',  copper: { 60: 280, 75: 335, 90: 380 } },
  { label: '500 kcmil', key: '500',  copper: { 60: 320, 75: 380, 90: 430 } },
  { label: '600 kcmil', key: '600',  copper: { 60: 350, 75: 420, 90: 475 } },
  { label: '750 kcmil', key: '750',  copper: { 60: 400, 75: 475, 90: 535 } },
];

/**
 * Conductor sizes eligible for parallel installation per NEC 310.10(H).
 * Only conductors ≥ 1/0 AWG may be installed in parallel.
 */
export const PARALLEL_ELIGIBLE_KEYS = new Set([
  '1/0', '2/0', '3/0', '4/0',
  '250', '300', '350', '400', '500', '600', '750',
]);
