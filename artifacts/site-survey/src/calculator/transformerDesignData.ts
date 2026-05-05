export type CableMaterial = 'Copper' | 'Aluminum';
export type CableTempRating = '60°C' | '75°C' | '90°C';

export const TRANSFORMER_AMPACITY_COPPER_75C: Record<string, number> = {
  "#14 AWG": 20,
  "#12 AWG": 25,
  "#10 AWG": 35,
  "#8 AWG": 50,
  "#6 AWG": 65,
  "#4 AWG": 85,
  "#3 AWG": 100,
  "#2 AWG": 115,
  "#1 AWG": 130,
  "1/0 AWG": 150,
  "2/0 AWG": 175,
  "3/0 AWG": 200,
  "4/0 AWG": 230,
  "250 kcmil": 255,
  "300 kcmil": 285,
  "350 kcmil": 310,
  "400 kcmil": 335,
  "500 kcmil": 380,
  "600 kcmil": 420,
  "700 kcmil": 460,
  "750 kcmil": 475
};

export const TRANSFORMER_RESISTANCE_COPPER: Record<string, number> = {
  "#14 AWG": 8.286,
  "#12 AWG": 5.211,
  "#10 AWG": 3.277,
  "#8 AWG": 2.061,
  "#6 AWG": 1.296,
  "#4 AWG": 0.815,
  "#3 AWG": 0.646,
  "#2 AWG": 0.513,
  "#1 AWG": 0.406,
  "1/0 AWG": 0.322,
  "2/0 AWG": 0.256,
  "3/0 AWG": 0.203,
  "4/0 AWG": 0.160,
  "250 kcmil": 0.107,
  "300 kcmil": 0.089,
  "350 kcmil": 0.077,
  "400 kcmil": 0.070,
  "500 kcmil": 0.054,
  "600 kcmil": 0.045,
  "750 kcmil": 0.036
};

export const STANDARD_CONTINUOUS_RATINGS = [
  100, 225, 400, 600, 800, 1200, 1600, 2000, 2500, 3000, 4000
];

export const STANDARD_BREAKER_SIZES = [
  100, 225, 400, 600, 800, 1200, 1600, 2000, 2500, 3000, 4000
];

export const STANDARD_KAIC_RATINGS = [
  10, 18, 22, 25, 35, 42, 50, 65, 85, 100
];

export function getAmpacity(size: string, material: CableMaterial): number {
  const cuAmpacity = TRANSFORMER_AMPACITY_COPPER_75C[size] || 0;
  if (material === 'Aluminum') {
    return Math.floor(cuAmpacity * 0.8);
  }
  return cuAmpacity;
}

export function getResistance(size: string, material: CableMaterial): number {
  const cuResistance = TRANSFORMER_RESISTANCE_COPPER[size] || 0;
  if (material === 'Aluminum') {
    return cuResistance * 1.6;
  }
  return cuResistance;
}
