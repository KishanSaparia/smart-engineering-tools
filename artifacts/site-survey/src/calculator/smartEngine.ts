/**
 * Smart Electrical Design Engine — Core Computation
 *
 * Combines:
 *   1) NEC cable sizing (Table 310.15(B)(16))
 *   2) 3-phase voltage drop calculation
 *   3) Parallel conductor logic (NEC 310.10(H))
 *   4) Multi-criteria optimization
 *   5) Cable verification with full calculation transparency
 *
 * Does NOT modify any existing module — uses read-only imports.
 */

import {
  NEC_TABLE,
  PARALLEL_ELIGIBLE_KEYS,
  type TempRating,
  type ConductorMaterial,
  type NecEntry,
} from './necTable';

import { AWG_TABLE, toMeters, type LengthUnit } from './vdropFormulas';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

export interface SmartDesignInput {
  voltage: number;        // System voltage (V)
  loadCurrent: number;    // Load current (A)
  cableLength: number;    // Cable length (raw value)
  lengthUnit: LengthUnit; // 'm' or 'ft'
  material: ConductorMaterial;
  tempRating: TempRating;
  continuous: boolean;
  allowedDropPct: number; // 3 or 5
}

/** Transparent calculation breakdown for voltage drop */
export interface CalculationDetails {
  resistance: number;           // Ohm/km (internal)
  resistanceDisplay: number;    // Converted for display unit
  resistanceUnit: string;       // "Ω/km" or "Ω/1000ft"
  material: string;
  cableSize: string;
  lengthUsedM: number;          // Length in meters (formula input)
  lengthOriginal: number;       // Original user input
  lengthUnit: string;
  current: number;
  parallelSets: number;
  formulaSubstitution: string;  // e.g. "Vd = (1.732 × 200 × 100 × 0.064) / (1000 × 2)"
  voltageDropResult: number;
}

export interface DesignSolution {
  entry: NecEntry;
  ampacity: number;
  parallelSets: number;
  totalAmpacity: number;
  designCurrent: number;
  voltageDrop: number;       // V
  voltageDropPct: number;    // %
  headroom: number;          // % ampacity headroom
  isAmpacitySafe: boolean;
  isVdropSafe: boolean;
  isFullySafe: boolean;
  calcDetails: CalculationDetails;
}

export interface SmartDesignResult {
  designCurrent: number;
  recommended: DesignSolution;
  alternatives: DesignSolution[];
}

/* ═══════════════════════════════════════════════════════════
   Pure helper functions
   ═══════════════════════════════════════════════════════════ */

const MAX_PARALLEL = 10;
const FEET_PER_KM = 3280.84;

/** Step 1: Design current with optional 125% factor */
export function calculateDesignCurrent(load: number, continuous: boolean): number {
  return continuous ? load * 1.25 : load;
}

/** Get NEC ampacity for a given entry */
function getAmpacity(entry: NecEntry, material: ConductorMaterial, temp: TempRating): number {
  const copper = entry.copper[temp];
  return material === 'aluminum' ? Math.round(copper * 0.8) : copper;
}

/** Get resistance (Ohm/km) for a cable key. Returns null if not found. */
function getResistanceByKey(key: string, material: ConductorMaterial): number | null {
  const awgEntry = AWG_TABLE.find((e) => e.key === key);
  if (!awgEntry) return null;
  return material === 'aluminum' ? awgEntry.copperR * 1.6 : awgEntry.copperR;
}

/** Convert Ohm/km to Ohm/1000ft */
function ohmPerKmToPerKft(r: number): number {
  return r / (FEET_PER_KM / 1000);
}

/**
 * 3-phase voltage drop for parallel conductors.
 * Vd = (√3 × I × L_m × R_per_km) / (1000 × parallelSets)
 */
function calcVdrop(current: number, lengthM: number, rPerKm: number, parallelSets: number): number {
  return (Math.sqrt(3) * current * lengthM * rPerKm) / (1000 * parallelSets);
}

/** Build transparent calculation details object */
function buildCalcDetails(
  current: number,
  lengthM: number,
  rPerKm: number,
  parallelSets: number,
  material: ConductorMaterial,
  cableLabel: string,
  rawLength: number,
  lengthUnit: LengthUnit,
  vd: number,
): CalculationDetails {
  const rDisplay = lengthUnit === 'ft' ? ohmPerKmToPerKft(rPerKm) : rPerKm;
  const rUnit = lengthUnit === 'ft' ? 'Ω/1000ft' : 'Ω/km';

  const s3 = '1.732';
  const sI = current.toFixed(2);
  const sL = lengthM.toFixed(2);
  const sR = rPerKm.toFixed(4);

  const formulaSubstitution = parallelSets > 1
    ? `Vd = (${s3} × ${sI} × ${sL} × ${sR}) / (1000 × ${parallelSets})`
    : `Vd = (${s3} × ${sI} × ${sL} × ${sR}) / 1000`;

  return {
    resistance: rPerKm,
    resistanceDisplay: parseFloat(rDisplay.toFixed(4)),
    resistanceUnit: rUnit,
    material: material === 'copper' ? 'Copper' : 'Aluminum',
    cableSize: cableLabel,
    lengthUsedM: parseFloat(lengthM.toFixed(2)),
    lengthOriginal: rawLength,
    lengthUnit: lengthUnit === 'ft' ? 'ft' : 'm',
    current,
    parallelSets,
    formulaSubstitution,
    voltageDropResult: parseFloat(vd.toFixed(4)),
  };
}

/* ═══════════════════════════════════════════════════════════
   Core engine
   ═══════════════════════════════════════════════════════════ */

/**
 * Generate ALL valid design solutions (cable + parallel sets)
 * that satisfy BOTH ampacity and voltage drop constraints.
 */
function generateAllSolutions(input: SmartDesignInput): DesignSolution[] {
  const designI = calculateDesignCurrent(input.loadCurrent, input.continuous);
  const lengthM = toMeters(input.cableLength, input.lengthUnit);
  const solutions: DesignSolution[] = [];

  for (const entry of NEC_TABLE) {
    const ampacity = getAmpacity(entry, input.material, input.tempRating);
    if (ampacity <= 0) continue;

    const R = getResistanceByKey(entry.key, input.material);
    if (R === null) continue; // no resistance data for this size

    // Determine max parallel sets to try
    const maxSets = PARALLEL_ELIGIBLE_KEYS.has(entry.key) ? MAX_PARALLEL : 1;

    for (let sets = 1; sets <= maxSets; sets++) {
      // Skip parallel sets > 1 for ineligible sizes
      if (sets > 1 && !PARALLEL_ELIGIBLE_KEYS.has(entry.key)) break;

      const totalAmp = ampacity * sets;
      const isAmpSafe = totalAmp >= designI;
      if (!isAmpSafe) continue; // not enough ampacity

      const vd = calcVdrop(input.loadCurrent, lengthM, R, sets);
      const vdPct = (vd / input.voltage) * 100;
      const isVdSafe = vdPct <= input.allowedDropPct;

      if (!isVdSafe) continue; // voltage drop too high

      const headroom = ((totalAmp - designI) / totalAmp) * 100;

      const calcDetails = buildCalcDetails(
        input.loadCurrent, lengthM, R, sets,
        input.material, entry.label,
        input.cableLength, input.lengthUnit, vd,
      );

      solutions.push({
        entry,
        ampacity,
        parallelSets: sets,
        totalAmpacity: totalAmp,
        designCurrent: parseFloat(designI.toFixed(2)),
        voltageDrop: parseFloat(vd.toFixed(2)),
        voltageDropPct: parseFloat(vdPct.toFixed(2)),
        headroom: parseFloat(headroom.toFixed(1)),
        isAmpacitySafe: isAmpSafe,
        isVdropSafe: isVdSafe,
        isFullySafe: isAmpSafe && isVdSafe,
        calcDetails,
      });

      // No need for more parallel sets once we have a valid solution
      // for this cable size (smaller sets are preferred)
      break;
    }
  }

  return solutions;
}

/**
 * Rank solutions: priority is minimum parallel runs, then smallest conductor.
 * NEC_TABLE is already ordered smallest → largest, so table index serves
 * as a proxy for conductor size.
 */
function rankSolutions(solutions: DesignSolution[]): DesignSolution[] {
  return [...solutions].sort((a, b) => {
    // 1) Fewer parallel sets first
    if (a.parallelSets !== b.parallelSets) return a.parallelSets - b.parallelSets;
    // 2) Smaller cable (earlier in NEC_TABLE) first
    const idxA = NEC_TABLE.indexOf(a.entry);
    const idxB = NEC_TABLE.indexOf(b.entry);
    return idxA - idxB;
  });
}

/* ═══════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════ */

/**
 * Run the full Smart Design computation.
 * Returns the recommended solution + up to 2 ranked alternatives,
 * or null if no valid configuration exists.
 */
export function optimizeSolution(input: SmartDesignInput): SmartDesignResult | null {
  const solutions = generateAllSolutions(input);
  if (solutions.length === 0) return null;

  const ranked = rankSolutions(solutions);
  const recommended = ranked[0];

  // Pick up to 2 alternatives that differ meaningfully from the recommended
  const alternatives: DesignSolution[] = [];
  for (let i = 1; i < ranked.length && alternatives.length < 2; i++) {
    const alt = ranked[i];
    // Skip duplicates (same cable + same parallel count)
    if (alt.entry.key === recommended.entry.key && alt.parallelSets === recommended.parallelSets) {
      continue;
    }
    alternatives.push(alt);
  }

  return {
    designCurrent: recommended.designCurrent,
    recommended,
    alternatives,
  };
}
