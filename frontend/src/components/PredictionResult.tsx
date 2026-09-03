import type { PredictionResult } from "../types";
import { calculateGrowthAssessment } from "../utils/growthStatus";

interface PredictionResultCardProps {
  result: PredictionResult | null;
  chronologicalAge: string;
  loading?: boolean;
  error?: string | null;
}

function yearsMonths(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = Math.round(totalMonths % 12);
  return `${years}y ${months}m`;
}

export default function PredictionResultCard({
  result,
  chronologicalAge,
  loading,
  error,
}: PredictionResultCardProps) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-12 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-full rounded bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <p className="text-sm font-medium text-red-800">Prediction Error</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card text-center text-slate-500">
        <p className="text-sm">Upload an X-ray and run prediction</p>
      </div>
    );
  }

  const confidencePct = Math.round(result.confidence * 100);
  const growthAssessment = calculateGrowthAssessment(
    chronologicalAge,
    result.bone_age_months,
  );

  return (
    <div className="card">
      <p className="text-sm font-medium text-slate-500">Predicted Bone Age</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-primary-700">
          {result.bone_age_months}
        </span>
        <span className="text-lg text-slate-500">months</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        ≈ {yearsMonths(result.bone_age_months)}
      </p>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">
          Growth status is estimated by comparing the predicted bone age with the patient&apos;s chronological age.
        </p>
        {growthAssessment ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Chronological Age</dt>
              <dd className="font-medium text-slate-800">
                {growthAssessment.chronologicalAgeYears.toFixed(1)} years
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Predicted Bone Age</dt>
              <dd className="font-medium text-slate-800">
                {growthAssessment.predictedBoneAgeYears.toFixed(1)} years
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Bone Age Difference</dt>
              <dd className="font-medium text-slate-800">
                {growthAssessment.differenceYears >= 0 ? "+" : ""}
                {growthAssessment.differenceYears.toFixed(1)} years
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
              <dt className="font-medium text-slate-600">Growth Status</dt>
              <dd className="font-semibold text-primary-700">{growthAssessment.status}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Enter a valid chronological age to calculate growth status.
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-slate-600">Confidence</span>
          <span className="text-slate-500">{confidencePct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-medical-accent transition-all"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          Model: {result.model_type}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {result.processing_time_ms.toFixed(0)} ms
        </span>
        {result.gender_used && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">
            Gender: {result.gender_used}
          </span>
        )}
      </div>
    </div>
  );
}
