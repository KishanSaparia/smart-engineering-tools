import {
  CableMaterial,
  getAmpacity,
  getResistance,
  TRANSFORMER_AMPACITY_COPPER_75C,
  STANDARD_BREAKER_SIZES,
  STANDARD_KAIC_RATINGS
} from './transformerDesignData';

const SQRT3 = Math.sqrt(3);

export interface FullSystemInputs {
  transformer: {
    kVA: number;
    primaryV: number;
    secondaryV: number;
    impedancePercent: number;
  };
  cable: {
    size: string;
    material: CableMaterial;
    runs: number;
    length: number;
    lengthUnit: 'ft' | 'm';
    customResistance?: number;
    resistanceUnit?: 'ohm/km' | 'ohm/ft';
  };
  load: {
    current: number;
    isContinuous: boolean;
  };
  breaker: {
    rating?: number;
    kAIC?: number;
  };
  equipment: {
    rating: number;
    kAIC: number;
  };
  design: {
    vdLimit: number;
  };
}

export interface CableSolution {
  size: string;
  runs: number;
  ampacityPerCable: number;
  totalAmpacity: number;
  vdVolts: number;
  vdPercent: number;
  faultCurrentAtEnd: number;
  headroom: number;
  recommendedBreaker: number;
  recommendedKaic: number;
}

export interface ValidationResult {
  overallStatus: 'SAFE' | 'WARNING' | 'REVIEW_REQUIRED';
  cable: {
    ampacityStatus: 'SAFE' | 'FAIL';
    vdStatus: 'SAFE' | 'WARNING' | 'FAIL';
    headroom: number;
    totalAmpacity: number;
    vdVolts: number;
    vdPercent: number;
  };
  fault: {
    transformerFault: number;
    endFault: number;
  };
  breaker: {
    continuousStatus: 'SAFE' | 'FAIL' | 'N/A';
    scStatus: 'SAFE' | 'FAIL' | 'N/A';
    oversizeWarning: boolean;
  };
  equipment: {
    continuousStatus: 'SAFE' | 'FAIL';
    scStatus: 'SAFE' | 'FAIL';
  };
  recommendations: string[];
  optimalSolutions: CableSolution[];
  resistanceUsedInfo: string;
  iDesign: number;
  flc: number;
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
  inputs: FullSystemInputs,
  iDesign: number,
  zTransformer: number
): CableSolution[] {
  const validSolutions: CableSolution[] = [];
  const CABLE_SIZES = Object.keys(TRANSFORMER_AMPACITY_COPPER_75C);
  const lengthKm = getLengthKm(inputs.cable.length, inputs.cable.lengthUnit);

  for (const size of CABLE_SIZES) {
    const isParallelEligible = PARALLEL_ELIGIBLE_KEYS.has(size);
    const maxRuns = isParallelEligible ? 6 : 1;

    const ampacity = getAmpacity(size, inputs.cable.material);
    let rBase = getResistanceOhmKm(size, inputs.cable.material, inputs.cable.customResistance, inputs.cable.resistanceUnit);

    if (rBase === 0) continue;

    for (let runs = 1; runs <= maxRuns; runs++) {
      const totalAmpacity = runs * ampacity;

      if (totalAmpacity >= iDesign) {
        const rEffective = rBase / runs;
        const vd = SQRT3 * iDesign * rEffective * lengthKm;
        const vdPercent = (vd / inputs.transformer.secondaryV) * 100;

        if (vdPercent <= inputs.design.vdLimit) {
          const zCable = rEffective * lengthKm;
          const zTotal = zTransformer + zCable;
          const faultCurrentAtEnd = inputs.transformer.secondaryV / (SQRT3 * zTotal);
          const faultKa = faultCurrentAtEnd / 1000;
          const headroom = ((totalAmpacity - iDesign) / iDesign) * 100;
          
          const recommendedBreaker = STANDARD_BREAKER_SIZES.find(r => r >= iDesign) || iDesign;
          const recommendedKaic = STANDARD_KAIC_RATINGS.find(r => r >= faultKa) || faultKa;

          validSolutions.push({
            size,
            runs,
            ampacityPerCable: ampacity,
            totalAmpacity,
            vdVolts: vd,
            vdPercent,
            faultCurrentAtEnd,
            headroom,
            recommendedBreaker,
            recommendedKaic
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

export function runFullSystemValidationEngine(inputs: FullSystemInputs): ValidationResult {
  const recommendations: string[] = [];
  
  // STEP 1: Transformer Full Load Current
  const iFl = (inputs.transformer.kVA * 1000) / (SQRT3 * inputs.transformer.secondaryV);

  // STEP 2: Design Current
  const iDesign = inputs.load.isContinuous ? inputs.load.current * 1.25 : inputs.load.current;

  // STEP 3: Transformer Fault Current
  const zPu = inputs.transformer.impedancePercent / 100;
  const iScSecondary = iFl / zPu;

  // STEP 4 & 5: Length Conversion & Resistance Selection
  const lengthKm = getLengthKm(inputs.cable.length, inputs.cable.lengthUnit);
  const rBase = getResistanceOhmKm(inputs.cable.size, inputs.cable.material, inputs.cable.customResistance, inputs.cable.resistanceUnit);
  
  const resistanceUsedInfo = (inputs.cable.customResistance && inputs.cable.customResistance > 0) 
    ? `${inputs.cable.customResistance} ${inputs.cable.resistanceUnit || 'ohm/km'} (User)`
    : `${rBase.toFixed(3)} ohm/km (Standard)`;

  // STEP 6: Cable Impedance
  const rEffective = rBase / inputs.cable.runs;
  const zCable = rEffective * lengthKm;
  const zTransformer = (inputs.transformer.secondaryV ** 2) / (inputs.transformer.kVA * 1000) * zPu;
  const zTotal = zTransformer + zCable;

  // STEP 7: End-of-Line Fault Current
  const iScEnd = inputs.transformer.secondaryV / (SQRT3 * zTotal);
  const endFaultKa = iScEnd / 1000;
  const transformerFaultKa = iScSecondary / 1000;

  // STEP 8: Voltage Drop
  const vdVolts = SQRT3 * iDesign * rEffective * lengthKm;
  const vdPercent = (vdVolts / inputs.transformer.secondaryV) * 100;

  // STEP 9: Cable Ampacity
  const ampacityPerCable = getAmpacity(inputs.cable.size, inputs.cable.material);
  const totalAmpacity = inputs.cable.runs * ampacityPerCable;

  // --- VALIDATION LOGIC ---
  
  // CABLE CHECK
  const ampacityStatus = totalAmpacity >= iDesign ? 'SAFE' : 'FAIL';
  
  let vdStatus: 'SAFE' | 'WARNING' | 'FAIL' = 'SAFE';
  if (vdPercent > inputs.design.vdLimit) {
    vdStatus = 'FAIL';
  } else if (vdPercent >= inputs.design.vdLimit * 0.9) {
    vdStatus = 'WARNING';
  }

  const headroom = iDesign > 0 ? ((totalAmpacity - iDesign) / iDesign) * 100 : 0;

  // BREAKER CHECK
  let breakerContinuousStatus: 'SAFE' | 'FAIL' | 'N/A' = 'N/A';
  let breakerScStatus: 'SAFE' | 'FAIL' | 'N/A' = 'N/A';
  let oversizeWarning = false;

  if (inputs.breaker.rating && inputs.breaker.rating > 0) {
    breakerContinuousStatus = inputs.breaker.rating >= iDesign ? 'SAFE' : 'FAIL';
    if (inputs.breaker.rating > 2 * iDesign) oversizeWarning = true;
  }
  
  if (inputs.breaker.kAIC && inputs.breaker.kAIC > 0) {
    breakerScStatus = inputs.breaker.kAIC >= endFaultKa ? 'SAFE' : 'FAIL';
  }

  // EQUIPMENT CHECK
  const eqContinuousStatus = inputs.equipment.rating >= iDesign ? 'SAFE' : 'FAIL';
  const eqScStatus = inputs.equipment.kAIC >= endFaultKa ? 'SAFE' : 'FAIL';

  // OVERALL STATUS
  let overallStatus: 'SAFE' | 'WARNING' | 'REVIEW_REQUIRED' = 'SAFE';
  const anyFailures = [ampacityStatus, vdStatus, breakerContinuousStatus, breakerScStatus, eqContinuousStatus, eqScStatus].includes('FAIL');
  const anyWarnings = [vdStatus].includes('WARNING') || oversizeWarning;
  
  if (anyFailures) {
    overallStatus = 'REVIEW_REQUIRED';
  } else if (anyWarnings) {
    overallStatus = 'WARNING';
  }

  // AUTO DESIGN LOGIC
  const allSolutions = generateCableOptions(inputs, iDesign, zTransformer);
  const optimalSolutions = allSolutions.slice(0, 3);

  // SMART RECOMMENDATIONS
  if (ampacityStatus === 'FAIL') {
    recommendations.push("Increase cable size or use parallel conductors");
  }
  if (vdStatus === 'FAIL') {
    recommendations.push("Voltage drop exceeds limit. Increase cable size or reduce length");
  } else if (vdStatus === 'WARNING') {
    recommendations.push("Voltage drop is near limit");
  }
  
  if (headroom > 40) {
    recommendations.push("Cable is oversized. Consider reducing size");
  }
  if (inputs.cable.runs > 4) {
    recommendations.push("Too many parallel runs. Consider larger cable");
  }
  
  if (breakerContinuousStatus === 'FAIL' || breakerScStatus === 'FAIL') {
    recommendations.push("Recommend correct breaker size/kAIC");
  }
  if (eqContinuousStatus === 'FAIL' || eqScStatus === 'FAIL') {
    recommendations.push("Recommend equipment upgrade");
  }

  if (optimalSolutions.length > 0) {
    const top = optimalSolutions[0];
    recommendations.push(`Recommended Cable: ${top.runs > 1 ? top.runs + ' × ' : ''}${top.size}`);
    recommendations.push(`Recommended Breaker: ${top.recommendedBreaker} A, ${top.recommendedKaic} kAIC`);
  }

  return {
    overallStatus,
    cable: {
      ampacityStatus,
      vdStatus,
      headroom,
      totalAmpacity,
      vdVolts,
      vdPercent
    },
    fault: {
      transformerFault: transformerFaultKa,
      endFault: endFaultKa
    },
    breaker: {
      continuousStatus: breakerContinuousStatus,
      scStatus: breakerScStatus,
      oversizeWarning
    },
    equipment: {
      continuousStatus: eqContinuousStatus,
      scStatus: eqScStatus
    },
    recommendations,
    optimalSolutions,
    resistanceUsedInfo,
    iDesign,
    flc: iFl
  };
}
