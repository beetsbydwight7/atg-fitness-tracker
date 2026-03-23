const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 10000) / 10000;
}

export function formatWeight(kg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') {
    const lbs = kgToLbs(kg);
    return `${lbs % 1 === 0 ? lbs.toFixed(0) : lbs.toFixed(1)} lbs`;
  }
  return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)} kg`;
}

export function parseWeightToKg(value: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? lbsToKg(value) : value;
}

export function displayWeight(kg: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') return Math.round(kgToLbs(kg) * 10) / 10;
  return Math.round(kg * 10) / 10;
}
