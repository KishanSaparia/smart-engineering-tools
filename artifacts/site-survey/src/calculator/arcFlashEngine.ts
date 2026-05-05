export type EquipmentType = 'Switchgear' | 'Switchboard' | 'MCC' | 'Panelboard' | 'Open Air';
export type ElectrodeConfig = 'Vertical' | 'Horizontal';

export interface ArcFlashInputs {
  voltage: number;
  faultCurrent: number; // kA
  equipmentType: EquipmentType;
  grounded: boolean;
  
  // Optional Inputs
  gap?: number; // mm
  workingDistance?: number; // mm
  clearingTime?: number; // sec
  arcCurrent?: number; // kA
  electrodeConfig?: ElectrodeConfig;
  enclosureSize?: number; // mm
}

export interface AssumptionTracker {
  gap: 'User' | 'Assumed';
  workingDistance: 'User' | 'Assumed';
  clearingTime: 'User' | 'Assumed';
  arcCurrent: 'User' | 'Assumed';
  electrodeConfig: 'User' | 'Assumed';
}

export interface ArcFlashResult {
  incidentEnergy: number; // cal/cm²
  arcFlashBoundary: number; // meters
  arcCurrent: number; // kA
  ppeCategory: 'No PPE' | 'Category 1' | 'Category 2' | 'Category 3' | 'Category 4' | 'Dangerous';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  recommendations: string[];
  assumptionMap: AssumptionTracker;
  appliedValues: {
    gap: number;
    workingDistance: number;
    clearingTime: number;
    electrodeConfig: ElectrodeConfig;
  };
}

export function runArcFlashEngine(inputs: ArcFlashInputs): ArcFlashResult {
  // --- COMPONENT 2: ASSUMPTION ENGINE ---
  const applied = {
    gap: inputs.gap,
    workingDistance: inputs.workingDistance,
    clearingTime: inputs.clearingTime,
    electrodeConfig: inputs.electrodeConfig,
    arcCurrent: inputs.arcCurrent
  };

  const map: AssumptionTracker = {
    gap: inputs.gap !== undefined && inputs.gap !== null && inputs.gap > 0 ? 'User' : 'Assumed',
    workingDistance: inputs.workingDistance !== undefined && inputs.workingDistance !== null && inputs.workingDistance > 0 ? 'User' : 'Assumed',
    clearingTime: inputs.clearingTime !== undefined && inputs.clearingTime !== null && inputs.clearingTime > 0 ? 'User' : 'Assumed',
    arcCurrent: inputs.arcCurrent !== undefined && inputs.arcCurrent !== null && inputs.arcCurrent > 0 ? 'User' : 'Assumed',
    electrodeConfig: inputs.electrodeConfig ? 'User' : 'Assumed'
  };

  if (map.gap === 'Assumed') {
    switch (inputs.equipmentType) {
      case 'Switchgear': applied.gap = 32; break;
      case 'Open Air': applied.gap = 40; break;
      case 'Switchboard':
      case 'MCC':
      case 'Panelboard':
      default: applied.gap = 25; break;
    }
  }

  if (map.workingDistance === 'Assumed') {
    switch (inputs.equipmentType) {
      case 'Switchgear': applied.workingDistance = 910; break;
      case 'Switchboard': applied.workingDistance = 910; break;
      case 'MCC':
      case 'Panelboard':
      case 'Open Air':
      default: applied.workingDistance = 455; break;
    }
  }

  if (map.clearingTime === 'Assumed') {
    applied.clearingTime = 0.2;
  }

  if (map.electrodeConfig === 'Assumed') {
    applied.electrodeConfig = 'Vertical';
  }

  // --- COMPONENT 3: CALCULATION ENGINE ---

  // STEP 1: UNIT CONVERSION
  // Formula expects Distance in meters
  const D_m = (applied.workingDistance as number) / 1000;
  const t = applied.clearingTime as number;

  // STEP 2: ARC CURRENT
  let I_arc = applied.arcCurrent as number;
  if (map.arcCurrent === 'Assumed') {
    const fault = inputs.faultCurrent;
    if (fault < 10) {
      I_arc = 0.9 * fault;
    } else if (fault >= 10 && fault <= 40) {
      I_arc = 0.85 * fault;
    } else {
      I_arc = 0.8 * fault;
    }
    applied.arcCurrent = I_arc;
  }

  // STEP 3: INCIDENT ENERGY
  // E = 4.184 × (I_arc^1.0) × t × (1 / D_m^1.473)
  const k = 4.184;
  const a = 1.0;
  const b = 1.473;
  
  const E = k * Math.pow(I_arc, a) * t * (1 / Math.pow(D_m, b));

  // STEP 4: ARC FLASH BOUNDARY
  // AFB = D_m × (E / 1.2)^(1 / 1.473)
  let AFB = D_m * Math.pow(E / 1.2, 1 / b);
  if (AFB < D_m) {
    AFB = D_m;
  }

  // STEP 5: PPE CATEGORY
  let ppe: ArcFlashResult['ppeCategory'] = 'No PPE';
  if (E <= 1.2) ppe = 'No PPE';
  else if (E <= 4) ppe = 'Category 1';
  else if (E <= 8) ppe = 'Category 2';
  else if (E <= 25) ppe = 'Category 3';
  else if (E <= 40) ppe = 'Category 4';
  else ppe = 'Dangerous';

  // STEP 6: RISK LEVEL
  let risk: ArcFlashResult['riskLevel'] = 'LOW';
  if (E <= 1.2) risk = 'LOW';
  else if (E <= 8) risk = 'MEDIUM';
  else if (E <= 25) risk = 'HIGH';
  else risk = 'EXTREME';

  // --- COMPONENT 4: SMART RECOMMENDATIONS ---
  const recommendations: string[] = [];
  
  if (E > 8) {
    recommendations.push("Suggest faster protection and increasing working distance to reduce high incident energy.");
  }
  if (E > 25) {
    recommendations.push("Incident energy is critically high. Suggest remote operation, arc-resistant equipment, or engineering redesign.");
  }
  if (t > 0.3) {
    recommendations.push("Breaker clearing time is long (>0.3s). Reduce breaker clearing time to significantly lower hazard.");
  }

  return {
    incidentEnergy: E,
    arcFlashBoundary: AFB,
    arcCurrent: I_arc,
    ppeCategory: ppe,
    riskLevel: risk,
    recommendations,
    assumptionMap: map,
    appliedValues: applied as any // Safe due to previous initialization
  };
}
