import { CABLE_AMPACITY, CABLE_RESISTANCE } from './motorTables';
import { StarterType, calculateStartingCurrent } from './motorFormulas';

const SQRT3 = Math.sqrt(3);

export interface GeneratedSolution {
  size: string;
  runs: number;
  ampacity: number;
  totalAmpacity: number;
  runningVDVolts: number;
  runningVDPercent: number;
  startingVDVolts: number;
  startingVDPercent: number;
  headroom: number;
}

// Sizes eligible for parallel installation (>= 1/0 AWG)
const PARALLEL_ELIGIBLE_KEYS = new Set([
  '1/0 AWG', '2/0 AWG', '3/0 AWG', '4/0 AWG',
  '250 kcmil', '300 kcmil', '350 kcmil', '400 kcmil', '500 kcmil', '600 kcmil', '750 kcmil'
]);

export function generateCableOptions(
  flc: number,
  voltage: number,
  lengthKm: number,
  allowedVd: number,
  starterType: StarterType
): GeneratedSolution[] {
  const iCable = flc * 1.25;
  const iStart = calculateStartingCurrent(flc, starterType);
  const CABLE_KEYS = Object.keys(CABLE_AMPACITY);
  
  const validSolutions: GeneratedSolution[] = [];

  for (const size of CABLE_KEYS) {
    const isParallelEligible = PARALLEL_ELIGIBLE_KEYS.has(size);
    const maxRuns = isParallelEligible ? 10 : 1;

    const ampacity = CABLE_AMPACITY[size];
    const r = CABLE_RESISTANCE[size];
    if (r === undefined) continue;

    for (let runs = 1; runs <= maxRuns; runs++) {
      const totalAmpacity = runs * ampacity;

      // STEP 1: Ampacity Check
      if (totalAmpacity >= iCable) {
        // STEP 2: Voltage Drop Calculation
        const rEffective = r / runs;
        
        const vdRun = SQRT3 * flc * lengthKm * rEffective;
        const vdRunPercent = (vdRun / voltage) * 100;
        
        const vdStart = SQRT3 * iStart * lengthKm * rEffective;
        const vdStartPercent = (vdStart / voltage) * 100;

        // STEP 3: Validation
        if (vdRunPercent <= allowedVd && vdStartPercent <= 15) {
          const headroom = ((totalAmpacity - iCable) / iCable) * 100;
          
          validSolutions.push({
            size,
            runs,
            ampacity,
            totalAmpacity,
            runningVDVolts: vdRun,
            runningVDPercent: vdRunPercent,
            startingVDVolts: vdStart,
            startingVDPercent: vdStartPercent,
            headroom
          });
        }
      }
    }
  }

  // STEP 6: Sorting Logic
  validSolutions.sort((a, b) => {
    // 1) Minimum runs
    if (a.runs !== b.runs) return a.runs - b.runs;
    // 2) Smallest cable size (ampacity) - this makes Option 1 the smallest valid, Option 3 larger/conservative
    if (a.ampacity !== b.ampacity) return a.ampacity - b.ampacity;
    // 3) Lowest running voltage drop
    return a.runningVDPercent - b.runningVDPercent;
  });

  // Return top 3 solutions
  return validSolutions.slice(0, 3);
}
