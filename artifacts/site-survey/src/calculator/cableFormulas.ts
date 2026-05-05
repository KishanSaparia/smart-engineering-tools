/**
 * Cable Size Calculator – Formula Functions
 * Based on NEC Table 310.15(B)(16)
 * Supports parallel conductors per NEC 310.10(H)
 * Parallel conductors only allowed for ≥ 1/0 AWG
 */

import {
  NEC_TABLE,
  PARALLEL_ELIGIBLE_KEYS,
  type TempRating,
  type ConductorMaterial,
  type NecEntry,
} from './necTable';

/** Maximum number of parallel sets to consider */
const MAX_PARALLEL_SETS = 10;

/**
 * Check whether a conductor size is eligible for parallel installation.
 * Per NEC 310.10(H), only conductors ≥ 1/0 AWG may be installed in parallel.
 */
export function isParallelEligible(sizeKey: string): boolean {
  return PARALLEL_ELIGIBLE_KEYS.has(sizeKey);
}

/**
 * Get ampacity for a given cable size, material, and temperature rating.
 * Aluminum = Copper × 0.8
 */
export function getAmpacity(
  sizeKey: string,
  material: ConductorMaterial,
  tempRating: TempRating,
): number {
  const entry = NEC_TABLE.find((e) => e.key === sizeKey);
  if (!entry) throw new Error(`Unknown cable size: ${sizeKey}`);
  const copperAmpacity = entry.copper[tempRating];
  return material === 'aluminum'
    ? Math.round(copperAmpacity * 0.8)
    : copperAmpacity;
}

/**
 * Calculate design current with optional 125% continuous-load factor.
 */
export function calculateDesignCurrent(loadCurrent: number, isContinuous: boolean): number {
  return isContinuous ? loadCurrent * 1.25 : loadCurrent;
}

/** Shape returned by parallel-related functions */
export interface ParallelOption {
  entry: NecEntry;
  ampacity: number;
  parallelSets: number;
  totalAmpacity: number;
}

/**
 * Find the smallest cable size whose ampacity ≥ designCurrent.
 * If no single conductor suffices, calculates parallel sets (only ≥ 1/0 AWG).
 * Returns the NEC table entry + computed ampacity + parallel info, or null if none found.
 */
export function findCableSize(
  designCurrent: number,
  material: ConductorMaterial,
  tempRating: TempRating,
): ParallelOption | null {
  // Step 1: Try single conductor (smallest that fits)
  for (const entry of NEC_TABLE) {
    const ampacity = material === 'aluminum'
      ? Math.round(entry.copper[tempRating] * 0.8)
      : entry.copper[tempRating];
    if (ampacity >= designCurrent) {
      return { entry, ampacity, parallelSets: 1, totalAmpacity: ampacity };
    }
  }

  // Step 2: No single conductor found → calculate parallel sets
  return calculateParallelSets(designCurrent, material, tempRating);
}

/**
 * Generate all valid parallel conductor options.
 * Only considers sizes ≥ 1/0 AWG per NEC 310.10(H).
 * Returns unsorted list of valid configurations.
 */
export function generateParallelOptions(
  designCurrent: number,
  material: ConductorMaterial,
  tempRating: TempRating,
): ParallelOption[] {
  const options: ParallelOption[] = [];

  for (const entry of NEC_TABLE) {
    // NEC 310.10(H): parallel only for ≥ 1/0 AWG
    if (!PARALLEL_ELIGIBLE_KEYS.has(entry.key)) continue;

    const ampacity = material === 'aluminum'
      ? Math.round(entry.copper[tempRating] * 0.8)
      : entry.copper[tempRating];

    if (ampacity <= 0) continue;

    const requiredSets = Math.ceil(designCurrent / ampacity);

    // Skip if exceeds max limit or single conductor (already checked)
    if (requiredSets > MAX_PARALLEL_SETS || requiredSets < 2) continue;

    const totalAmpacity = requiredSets * ampacity;

    if (totalAmpacity >= designCurrent) {
      options.push({ entry, ampacity, parallelSets: requiredSets, totalAmpacity });
    }
  }

  return options;
}

/**
 * Select the optimal parallel configuration.
 * Priority: 1) Minimum number of runs  2) Smallest conductor size
 * This yields the most cost-effective and practical solution.
 */
export function selectOptimalSolution(options: ParallelOption[]): ParallelOption | null {
  if (options.length === 0) return null;

  // Sort: fewest runs first, then smallest conductor (earlier in NEC_TABLE = smaller)
  const sorted = [...options].sort((a, b) => {
    if (a.parallelSets !== b.parallelSets) return a.parallelSets - b.parallelSets;
    const idxA = NEC_TABLE.indexOf(a.entry);
    const idxB = NEC_TABLE.indexOf(b.entry);
    return idxA - idxB;
  });

  return sorted[0];
}

/**
 * Calculate optimal parallel conductor configuration.
 * Uses generateParallelOptions + selectOptimalSolution.
 * Prefers minimum runs, then smallest conductor for cost-effectiveness.
 */
export function calculateParallelSets(
  designCurrent: number,
  material: ConductorMaterial,
  tempRating: TempRating,
): ParallelOption | null {
  const options = generateParallelOptions(designCurrent, material, tempRating);
  return selectOptimalSolution(options);
}

/**
 * Check a specific cable size against a load.
 * Supports parallel runs: total ampacity = single ampacity × parallelRuns.
 * Enforces NEC 310.10(H): parallel only for ≥ 1/0 AWG; forces runs=1 otherwise.
 */
export function checkCable(
  sizeKey: string,
  loadCurrent: number,
  material: ConductorMaterial,
  tempRating: TempRating,
  isContinuous: boolean,
  parallelRuns: number = 1,
): {
  ampacity: number;
  totalAmpacity: number;
  parallelRuns: number;
  designCurrent: number;
  headroom: number;
  isSafe: boolean;
} {
  const ampacity = getAmpacity(sizeKey, material, tempRating);
  // Enforce NEC: parallel only for ≥ 1/0 AWG
  const runs = isParallelEligible(sizeKey)
    ? Math.max(1, Math.floor(parallelRuns))
    : 1;
  const totalAmpacity = ampacity * runs;
  const designCurrent = calculateDesignCurrent(loadCurrent, isContinuous);
  const headroom = totalAmpacity > 0
    ? ((totalAmpacity - designCurrent) / totalAmpacity) * 100
    : -100;
  return {
    ampacity,
    totalAmpacity,
    parallelRuns: runs,
    designCurrent: parseFloat(designCurrent.toFixed(2)),
    headroom: parseFloat(headroom.toFixed(1)),
    isSafe: totalAmpacity >= designCurrent,
  };
}

/** Shape returned by findMinimumCableSize */
export interface MinimumCableSuggestion {
  entry: NecEntry;
  ampacity: number;
}

/**
 * Find the smallest single-conductor cable whose ampacity ≥ designCurrent.
 * Iterates NEC_TABLE from smallest → largest and returns the first match.
 * Returns null if no single conductor can meet the requirement.
 */
export function findMinimumCableSize(
  designCurrent: number,
  material: ConductorMaterial,
  tempRating: TempRating,
): MinimumCableSuggestion | null {
  for (const entry of NEC_TABLE) {
    const ampacity = material === 'aluminum'
      ? Math.round(entry.copper[tempRating] * 0.8)
      : entry.copper[tempRating];
    if (ampacity >= designCurrent) {
      return { entry, ampacity };
    }
  }
  return null;
}
