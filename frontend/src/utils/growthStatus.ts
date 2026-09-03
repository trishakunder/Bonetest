export const GROWTH_STATUS_THRESHOLD_YEARS = 1;
export const MAX_CHRONOLOGICAL_AGE_YEARS = 120;
export const MAX_BONE_AGE_MONTHS = 240;

export type GrowthStatus = "Under-growth" | "Normal growth" | "Over-growth";

export interface GrowthAssessment {
  chronologicalAgeYears: number;
  predictedBoneAgeYears: number;
  differenceYears: number;
  status: GrowthStatus;
}

export function getChronologicalAgeError(value: string): string | null {
  if (!value.trim()) return "Enter the patient's chronological age.";

  const age = Number(value);
  if (!Number.isFinite(age)) return "Enter a valid numeric age.";
  if (age <= 0) return "Age must be greater than 0 years.";
  if (age > MAX_CHRONOLOGICAL_AGE_YEARS) {
    return `Age must be ${MAX_CHRONOLOGICAL_AGE_YEARS} years or less.`;
  }

  return null;
}

export function calculateGrowthAssessment(
  chronologicalAge: string,
  boneAgeMonths: number,
): GrowthAssessment | null {
  if (getChronologicalAgeError(chronologicalAge)) return null;
  if (
    !Number.isFinite(boneAgeMonths) ||
    boneAgeMonths <= 0 ||
    boneAgeMonths > MAX_BONE_AGE_MONTHS
  ) {
    return null;
  }

  const chronologicalAgeYears = Number(chronologicalAge);
  const predictedBoneAgeYears = boneAgeMonths / 12;
  const differenceYears = predictedBoneAgeYears - chronologicalAgeYears;

  let status: GrowthStatus;
  if (differenceYears < -GROWTH_STATUS_THRESHOLD_YEARS) {
    status = "Under-growth";
  } else if (differenceYears > GROWTH_STATUS_THRESHOLD_YEARS) {
    status = "Over-growth";
  } else {
    status = "Normal growth";
  }

  return {
    chronologicalAgeYears,
    predictedBoneAgeYears,
    differenceYears,
    status,
  };
}