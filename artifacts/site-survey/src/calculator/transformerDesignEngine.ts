import {
  CableMaterial,
  CableTempRating,
  getAmpacity,
  getResistance,
  TRANSFORMER_AMPACITY_COPPER_75C
} from './transformerDesignData';

const SQRT3 = Math.sqrt(3);

export interface TransformerInputs {
  kVA: number;
  primaryV: number;
  secondaryV: number;
  impedancePercent: number;
}

export interface CableInputs {
  material: CableMaterial;
  tempRating: CableTempRating;
  length: number;
  lengthUnit: 'ft' | 'm';
  customResistance?: number;
  resistanceUnit?: 'ohm/km' | 'ohm/ft';
}

export interface VerifyCableInputs extends CableInputs {
  size: string;
  runs: number;
}

export interface LoadInputs {
  current: number;
  isContinuous: boolean;
}

export interface VerifyLoadInputs {
  current: number;
  isContinuous: boolean;
}

export interface EquipmentInputs {
  continuousRating: number;
  scRating: number;
}

export interface DesignInputs {
  isContinuous: boolean;
  vdLimit: number; // e.g. 3 or 5
}

export interface GeneratedCableSolution {
  size: string;
  runs: number;
  ampacityPerCable: number;
  totalAmpacity: number;
  vdVolts: number;
  vdPercent: number;
  faultCurrentAtEnd: number;
  headroom: number;
}

export interface TransformerDesignResult {
  transformer: {
    flc: number;
    scPrimary: number;
    scSecondary: number;
    iDesign: number;
  };
  solutions: GeneratedCableSolution[];
  equipment: {
    continuousSafe: boolean;
    scSafe: boolean;
    recommendedContinuous: number;
    recommendedSc: number;
  };
}

export interface VerifyResult {
  ampacityStatus: 'SAFE' | 'FAIL';
  vdStatus: 'SAFE' | 'WARNING' | 'FAIL';
  headroom: number;
  totalAmpacity: number;
  vdVolts: number;
  vdPercent: number;
  transformerFault: number;
  endFault: number;
  iDesign: number;
  recommendations: string[];
  closestSolution?: GeneratedCableSolution;
  resistanceUsedInfo: string;
}

const PARALLEL_ELIGIBLE_KEYS = new Set([
  '1/0 AWG', '2/0 AWG', '3/0 AWG', '4/0 AWG',
  '250 kcmil', '300 kcmil', '350 kcmil', '400 kcmil', '500 kcmil', '600 kcmil', '700 kcmil', '750 kcmil'
]);

function getLengthKm(length: number, unit: 'ft' | 'm') {
  return unit === 'ft' ? length / 3280.84 : length / 1000;
}

function getResistanceOhmKm(size: string, material: CableMaterial, customRes?: number, resUnit?: 'ohm/km' | 'ohm/ft') {
  if (customRes && customRes > 0) {
    if (resUnit === 'ohm/ft') {
      return customRes * 3280.84;
    }
    return customRes;
  }
  return getResistance(size, material);
}

export function generateCableOptions(
  tx: TransformerInputs,
  cb: CableInputs,
  iDesign: number,
  zTransformer: number,
  vdLimit: number
): GeneratedCableSolution[] {
  const validSolutions: GeneratedCableSolution[] = [];
  const CABLE_SIZES = Object.keys(TRANSFORMER_AMPACITY_COPPER_75C);
  const lengthKm = getLengthKm(cb.length, cb.lengthUnit);

  for (const size of CABLE_SIZES) {
    const isParallelEligible = PARALLEL_ELIGIBLE_KEYS.has(size);
    const maxRuns = isParallelEligible ? 6 : 1;

    const ampacity = getAmpacity(size, cb.material);
    let rBase = getResistanceOhmKm(size, cb.material, cb.customResistance, cb.resistanceUnit);

    if (rBase === 0) continue;

    for (let runs = 1; runs <= maxRuns; runs++) {
      const totalAmpacity = runs * ampacity;

      if (totalAmpacity >= iDesign) {
        const rEffective = rBase / runs;
        const vd = SQRT3 * iDesign * rEffective * lengthKm;
        const vdPercent = (vd / tx.secondaryV) * 100;

        if (vdPercent <= vdLimit) {
          const zCable = rEffective * lengthKm;
          const zTotal = zTransformer + zCable;
          const faultCurrentAtEnd = tx.secondaryV / (SQRT3 * zTotal);
          const headroom = ((totalAmpacity - iDesign) / iDesign) * 100;

          validSolutions.push({
            size,
            runs,
            ampacityPerCable: ampacity,
            totalAmpacity,
            vdVolts: vd,
            vdPercent,
            faultCurrentAtEnd,
            headroom
          });
        }
      }
    }
  }

  validSolutions.sort((a, b) => {
    if (a.runs !== b.runs) return a.runs - b.runs;
    if (a.ampacityPerCable !== b.ampacityPerCable) return a.ampacityPerCable - b.ampacityPerCable;
    return a.vdPercent - b.vdPercent;
  });

  return validSolutions;
}

export function runTransformerDesignEngine(
  tx: TransformerInputs,
  cb: CableInputs,
  eq: EquipmentInputs,
  ds: DesignInputs
): TransformerDesignResult {
  const flc = (tx.kVA * 1000) / (SQRT3 * tx.secondaryV);
  const iDesign = ds.isContinuous ? flc * 1.25 : flc;
  const zPu = tx.impedancePercent / 100;
  const scSecondary = flc / zPu;
  const scPrimary = (tx.kVA * 1000) / (SQRT3 * tx.primaryV * zPu);
  const zTransformer = (tx.secondaryV ** 2) / (tx.kVA * 1000) * zPu;

  const validSolutions = generateCableOptions(tx, cb, iDesign, zTransformer, ds.vdLimit);
  const optimalSolutions = validSolutions.slice(0, 3);

  const continuousSafe = eq.continuousRating >= iDesign;
  let maxFault = scSecondary;
  if (optimalSolutions.length > 0) {
    maxFault = optimalSolutions[0].faultCurrentAtEnd;
  }
  const scSafe = (eq.scRating * 1000) >= maxFault;

  const STANDARD_CONTINUOUS_RATINGS = [100, 225, 400, 600, 800, 1200, 1600, 2000, 2500, 3000];
  const STANDARD_KAIC_RATINGS = [10, 18, 22, 25, 35, 42, 50, 65, 85, 100];

  const recommendedContinuous = STANDARD_CONTINUOUS_RATINGS.find(r => r >= iDesign) || iDesign;
  const recommendedScKa = STANDARD_KAIC_RATINGS.find(r => (r * 1000) >= maxFault) || (maxFault / 1000);

  return {
    transformer: {
      flc,
      scPrimary,
      scSecondary,
      iDesign
    },
    solutions: optimalSolutions,
    equipment: {
      continuousSafe,
      scSafe,
      recommendedContinuous,
      recommendedSc: recommendedScKa
    }
  };
}

export function runTransformerVerifyEngine(
  tx: TransformerInputs,
  vCb: VerifyCableInputs,
  vLd: VerifyLoadInputs,
  eq: EquipmentInputs,
  vdLimit: number
): VerifyResult {
  const iDesign = vLd.isContinuous ? vLd.current * 1.25 : vLd.current;
  const ampacity = getAmpacity(vCb.size, vCb.material);
  const totalAmpacity = ampacity * vCb.runs;

  const flc = (tx.kVA * 1000) / (SQRT3 * tx.secondaryV);
  const zPu = tx.impedancePercent / 100;
  const scSecondary = flc / zPu;
  const zTransformer = (tx.secondaryV ** 2) / (tx.kVA * 1000) * zPu;

  const lengthKm = getLengthKm(vCb.length, vCb.lengthUnit);
  const rBase = getResistanceOhmKm(vCb.size, vCb.material, vCb.customResistance, vCb.resistanceUnit);
  
  const resistanceUsedInfo = (vCb.customResistance && vCb.customResistance > 0) 
    ? `${vCb.customResistance} ${vCb.resistanceUnit || 'ohm/km'} (User)`
    : `${rBase.toFixed(3)} ohm/km (Standard)`;

  const rEffective = rBase / vCb.runs;
  const vdVolts = SQRT3 * iDesign * rEffective * lengthKm;
  const vdPercent = (vdVolts / tx.secondaryV) * 100;

  const zCable = rEffective * lengthKm;
  const zTotal = zTransformer + zCable;
  const faultCurrentAtEnd = tx.secondaryV / (SQRT3 * zTotal);

  const ampacityStatus = totalAmpacity >= iDesign ? 'SAFE' : 'FAIL';
  let vdStatus: 'SAFE' | 'WARNING' | 'FAIL' = 'SAFE';
  if (vdPercent > vdLimit) {
    vdStatus = 'FAIL';
  } else if (vdPercent >= vdLimit * 0.9) {
    vdStatus = 'WARNING';
  }

  const headroom = iDesign > 0 ? ((totalAmpacity - iDesign) / iDesign) * 100 : 0;

  const recommendations: string[] = [];
  if (ampacityStatus === 'FAIL') {
    recommendations.push("Increase cable size or use parallel conductors");
  }
  if (vdStatus === 'FAIL') {
    recommendations.push("Voltage drop exceeds limit. Increase cable size or reduce length");
  }
  if (vdStatus === 'WARNING') {
    recommendations.push("Voltage drop is near limit");
  }
  if (headroom > 40) {
    recommendations.push("Cable is oversized. Consider reducing size");
  }
  if (vCb.runs > 4) {
    recommendations.push("Too many parallel runs. Consider larger cable");
  }

  let closestSolution: GeneratedCableSolution | undefined = undefined;
  const allSolutions = generateCableOptions(tx, vCb, iDesign, zTransformer, vdLimit);
  if (allSolutions.length > 0) {
    closestSolution = allSolutions[0];
    if (closestSolution.size !== vCb.size || closestSolution.runs !== vCb.runs) {
      recommendations.push(`Recommended: ${closestSolution.runs > 1 ? closestSolution.runs + ' × ' : ''}${closestSolution.size}`);
    } else {
      closestSolution = undefined; // It's already the best
    }
  }

  return {
    ampacityStatus,
    vdStatus,
    headroom,
    totalAmpacity,
    vdVolts,
    vdPercent,
    transformerFault: scSecondary / 1000,
    endFault: faultCurrentAtEnd / 1000,
    iDesign,
    recommendations,
    closestSolution,
    resistanceUsedInfo
  };
}
